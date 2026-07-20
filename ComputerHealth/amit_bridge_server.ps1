# Amit Computer Health - Local Bridge Server
# Serves the dashboard HTML and exposes local watcher data/controls over HTTP
# so a browser page (which cannot see the filesystem or processes directly)
# can read tracker output and push events to Supabase.
#
# Each request is handled on its own runspace. This matters because a client
# that times out mid-request can leave the server-side connection half-open,
# and a naive single-threaded accept loop would then hang on every request
# after that one forever. Concurrent handling means one stuck connection
# never blocks the rest.
#
# Run this, then open http://localhost:8710/ in a browser.

$port = 8710
$watcherDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$dashboardPath = "$watcherDir\ComputerHealth_Dashboard.html"
$deviceIdFile = "$watcherDir\device_id.txt"

# Device identity is the SMBIOS UUID - a hardware-level identifier present on
# virtually every modern PC (this is what IT asset-management tools use for
# hardware fingerprinting). This matters because it survives a full reinstall
# of this software: a locally-generated random ID stored in a file would be
# lost and regenerated on reinstall, orphaning that computer's entire history
# in Supabase. The SMBIOS UUID is the same value for as long as the physical
# hardware exists, regardless of what happens to our files.
#
# BIOS serial number was tested and rejected - on custom-built desktops
# (confirmed on this machine) it's frequently just the placeholder text
# "To be filled by O.E.M.", since board makers often don't populate that
# field outside of prebuilt OEM systems. SMBIOS UUID is far more reliably
# populated on DIY builds.
try {
    $smbiosUuid = (Get-CimInstance Win32_ComputerSystemProduct -ErrorAction Stop).UUID
} catch { $smbiosUuid = $null }

if ($smbiosUuid -and $smbiosUuid -ne "00000000-0000-0000-0000-000000000000") {
    $deviceId = $smbiosUuid
    # Keep the file in sync for reference/debugging, but it's no longer the
    # source of truth - the hardware UUID is.
    $smbiosUuid | Set-Content -Path $deviceIdFile -Encoding utf8
} else {
    # Fallback only for the rare system where SMBIOS UUID genuinely isn't
    # available - a locally-generated ID, same as before.
    if (-not (Test-Path $deviceIdFile)) {
        [guid]::NewGuid().ToString() | Set-Content -Path $deviceIdFile -Encoding utf8
    }
    $deviceId = (Get-Content $deviceIdFile -Raw).Trim()
}
$deviceName = $env:COMPUTERNAME

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
} catch {
    Write-Host "Could not bind to port $port - it may already be in use. Error: $($_.Exception.Message)"
    exit 1
}

Write-Host "Amit Computer Health bridge server running at http://localhost:$port/"
Write-Host "Device ID: $deviceId  |  Device Name: $deviceName"
Write-Host "Press Ctrl+C to stop."

$handlerScript = {
    param($context, $watcherDir, $dashboardPath, $deviceId, $deviceName)

    function ConvertTo-JsonString($text) {
        # Manual JSON string escaping - avoids ConvertTo-Json, which has a real
        # slowness/hang issue on some fresh runspaces in Windows PowerShell 5.1
        # (confirmed via tracing: identical code hangs on a cold runspace but not
        # a warm one, purely from the cmdlet call itself, not the data size).
        if ($null -eq $text) { return '""' }
        $escaped = $text -replace '\\', '\\\\' -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t'
        return '"' + $escaped + '"'
    }

    function Send-JsonRaw($response, $jsonString, $statusCode = 200) {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonString)
        $response.StatusCode = $statusCode
        $response.ContentType = "application/json"
        $response.KeepAlive = $false
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        # Belt-and-suspenders alongside the OPTIONS-preflight handling below -
        # some browser versions check for this on the real response too, not
        # only the preflight.
        $response.Headers.Add("Access-Control-Allow-Private-Network", "true")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    }

    function Send-JsonLines($response, $lines) {
        $itemsJson = ($lines | ForEach-Object { ConvertTo-JsonString $_ }) -join ","
        Send-JsonRaw $response ('{"lines":[' + $itemsJson + ']}')
    }

    function Send-Json($response, $obj, $statusCode = 200) {
        $json = $obj | ConvertTo-Json -Depth 8 -Compress
        Send-JsonRaw $response $json $statusCode
    }
    function Send-Html($response, $content) {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        $response.ContentType = "text/html; charset=utf-8"
        $response.KeepAlive = $false
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    }
    function Get-TailSafe($path, $lines = 100, $maxLineLen = 400) {
        if (Test-Path $path) {
            try {
                $raw = @(Get-Content $path -Tail $lines -Encoding UTF8)
                return @($raw | ForEach-Object { if ($_.Length -gt $maxLineLen) { $_.Substring(0, $maxLineLen) + "..." } else { $_ } })
            } catch { return @() }
        }
        return @()
    }

    function Get-BrowserBreakdown() {
        # Same breakdown Amit did manually when Ryan asked "why does Edge have 41
        # processes for 2 tabs" - now built into Computer Health as its own tab.
        $browsers = @(
            @{ Name = "Edge"; ProcName = "msedge"; ExtPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Extensions" },
            @{ Name = "Chrome"; ProcName = "chrome"; ExtPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions" },
            @{ Name = "Firefox"; ProcName = "firefox"; ExtPath = $null }
        )
        $results = @()
        foreach ($b in $browsers) {
            $procs = Get-CimInstance Win32_Process -Filter "Name='$($b.ProcName).exe'" -ErrorAction SilentlyContinue
            if (-not $procs) { continue }

            $renderer = 0; $gpu = 0; $utility = 0; $other = 0
            $totalMemMB = 0
            foreach ($p in $procs) {
                $cmd = $p.CommandLine
                if ($cmd -match '--type=renderer') { $renderer++ }
                elseif ($cmd -match '--type=gpu-process') { $gpu++ }
                elseif ($cmd -match '--type=utility') { $utility++ }
                elseif ($cmd -notmatch '--type=') { } # main process, not counted separately here
                else { $other++ }
                $procObj = Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue
                if ($procObj) { $totalMemMB += [math]::Round($procObj.WS / 1MB, 1) }
            }

            $extCount = 0
            if ($b.ExtPath -and (Test-Path $b.ExtPath)) {
                $extCount = @(Get-ChildItem $b.ExtPath -Directory -ErrorAction SilentlyContinue).Count
            }

            $results += [PSCustomObject]@{
                browser = $b.Name
                totalProcesses = $procs.Count
                rendererProcesses = $renderer
                gpuProcesses = $gpu
                utilityProcesses = $utility
                extensionCount = $extCount
                totalMemMB = [math]::Round($totalMemMB, 0)
            }
        }
        return $results
    }

    # Three new capabilities added 2026-07-16 (Ryan's direct request) -
    # reliability/failure-prediction, distinct from the Diagnostics tab's
    # "how fast is Windows right now" and the Hardware tab's live sensor
    # readings. All three use only what Windows already provides natively
    # - no third-party tool needed, the same standard this whole project
    # has held to except for LibreHardwareMonitor (which exists only
    # because Windows has no native temperature/voltage/fan sensor API).
    function Get-DriveHealth() {
        # Get-StorageReliabilityCounter is Windows' own built-in SMART-
        # style reliability data - wear, error counts, temperature,
        # power-on hours - a genuinely different concern from Hardware's
        # live activity sensors: this is about a drive's long-term
        # condition, not what it's doing right now.
        $results = @()
        try {
            $disks = Get-PhysicalDisk -ErrorAction Stop
            foreach ($d in $disks) {
                $rel = $null
                try { $rel = $d | Get-StorageReliabilityCounter -ErrorAction Stop } catch {}
                $results += [PSCustomObject]@{
                    friendlyName = $d.FriendlyName
                    healthStatus = "$($d.HealthStatus)"
                    mediaType = "$($d.MediaType)"
                    wear = if ($rel -and $null -ne $rel.Wear) { $rel.Wear } else { $null }
                    temperature = if ($rel -and $null -ne $rel.Temperature) { $rel.Temperature } else { $null }
                    powerOnHours = if ($rel -and $null -ne $rel.PowerOnHours) { $rel.PowerOnHours } else { $null }
                    readErrorsUncorrected = if ($rel -and $null -ne $rel.ReadErrorsUncorrected) { $rel.ReadErrorsUncorrected } else { $null }
                    writeErrorsUncorrected = if ($rel -and $null -ne $rel.WriteErrorsUncorrected) { $rel.WriteErrorsUncorrected } else { $null }
                }
            }
        } catch {}
        return $results
    }

    function Get-RestartPendingStatus() {
        # Fast, always-safe registry checks - the same signals Windows
        # itself uses to decide whether to show "restart required."
        # Ryan's direct request 2026-07-16: connects directly to the
        # recurring TiWorker.exe/wuauserv crash pattern found in
        # Reliability - a pending update stuck waiting on a restart (from
        # being postponed/rescheduled repeatedly) is a very plausible
        # cause of an update component retrying and failing over and
        # over instead of ever cleanly finishing.
        $reasons = @()
        try { if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired") { $reasons += "Windows Update is waiting on a restart" } } catch {}
        try { if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending") { $reasons += "A servicing operation is waiting on a restart" } } catch {}
        try {
            $pfro = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" -Name PendingFileRenameOperations -ErrorAction Stop
            if ($pfro -and $pfro.PendingFileRenameOperations) { $reasons += "Files are waiting to be replaced on next restart" }
        } catch {}
        return [PSCustomObject]@{ restartPending = ($reasons.Count -gt 0); reasons = $reasons }
    }

    function Get-PendingUpdateCount() {
        # Windows' own built-in Update Agent COM API - genuinely native,
        # no module/tool needed, but a real search against it can take
        # several seconds (sometimes contacting Windows Update servers),
        # so this is deliberately NOT called automatically - only on
        # explicit request from the Reliability tab's own button.
        try {
            $session = New-Object -ComObject Microsoft.Update.Session
            $searcher = $session.CreateUpdateSearcher()
            $result = $searcher.Search("IsInstalled=0 and IsHidden=0")
            $titles = @()
            foreach ($u in $result.Updates) { $titles += $u.Title }
            return [PSCustomObject]@{ found = $true; count = $result.Updates.Count; titles = $titles }
        } catch {
            return [PSCustomObject]@{ found = $false; count = 0; titles = @() }
        }
    }

    # Ryan's direct request 2026-07-16: a button that actually installs
    # pending updates, since telling someone "you have 2 updates" with no
    # way to act on it (especially if they don't know where Windows
    # Update even is, or have it turned off) just creates alarm instead
    # of solving anything. Originally this ran the install silently in
    # the background via the Update Agent COM API - replaced 2026-07-16
    # (Ryan's direct request) because that path gives no real progress or
    # time estimate, just a plain elapsed-seconds counter, which is
    # genuinely unhelpful when some updates take minutes and others take
    # hours. Windows' own Settings > Windows Update page already shows
    # real percentage/time-remaining, so the simpler and more honest move
    # is to hand off to it directly instead of re-implementing it worse.
    function Open-WindowsUpdateSettings() {
        try {
            Start-Process "ms-settings:windowsupdate"
            return $true
        } catch { return $false }
    }

    function Get-ReliabilityHistory() {
        # Win32_ReliabilityRecords is Windows' own built-in Reliability
        # Monitor data - already running in the background on every
        # Windows machine, tracking crashes/failures/driver problems with
        # timestamps, whether this app ever looked at it or not. Minidump
        # files are the hard corroborating evidence for actual BSODs
        # specifically, separate from the broader reliability log.
        $records = @()
        try {
            $raw = Get-CimInstance -ClassName Win32_ReliabilityRecords -Namespace root\cimv2 -ErrorAction Stop |
                Sort-Object TimeGenerated -Descending | Select-Object -First 25
            foreach ($r in $raw) {
                $msg = "$($r.Message)" -replace "`r`n", ' '
                $records += [PSCustomObject]@{
                    time = $r.TimeGenerated
                    source = "$($r.SourceName)"
                    product = "$($r.ProductName)"
                    message = $msg.Substring(0, [Math]::Min(200, $msg.Length))
                }
            }
        } catch {}
        $minidumps = @()
        try {
            $minidumps = @(Get-ChildItem "$env:SystemRoot\Minidump" -Filter "*.dmp" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | Select-Object -First 10 |
                ForEach-Object { [PSCustomObject]@{ time = $_.LastWriteTime; fileName = $_.Name } })
        } catch {}
        $lastUpdate = Get-LastUpdateInstallDate
        foreach ($rec in $records) {
            $rec | Add-Member -NotePropertyName "beforeLastUpdate" -NotePropertyValue $(
                if ($null -ne $lastUpdate -and $rec.time -lt $lastUpdate) { $true } else { $false }
            )
        }
        return [PSCustomObject]@{ records = $records; minidumps = $minidumps; lastUpdateDate = $lastUpdate }
    }

    # Ryan's direct request 2026-07-16: crash/failure history is a
    # permanent log - Windows never purges it just because the underlying
    # cause got fixed by a later update, so the same old crashes keep
    # showing indefinitely with nothing to tell the user they're probably
    # already resolved. Reading Windows' own real update-install history
    # (not a manual log entry Amit writes only when IT triggers an
    # install) means this stays accurate even for updates done entirely
    # outside Amit, like installing manually through Settings.
    function Get-LastUpdateInstallDate() {
        try {
            $session = New-Object -ComObject Microsoft.Update.Session
            $searcher = $session.CreateUpdateSearcher()
            $historyCount = $searcher.GetTotalHistoryCount()
            if ($historyCount -eq 0) { return $null }
            $history = $searcher.QueryHistory(0, [Math]::Min($historyCount, 50))
            $lastSuccess = $history | Where-Object { $_.Operation -eq 1 -and $_.ResultCode -eq 2 } |
                Sort-Object Date -Descending | Select-Object -First 1
            if ($lastSuccess) { return $lastSuccess.Date }
            return $null
        } catch { return $null }
    }

    # Driver Updates - Ryan's direct request 2026-07-16. Win32_PnPSignedDriver
    # is Windows' own native record of every installed driver (name,
    # manufacturer, version, date) - no third-party tool needed. Cross-
    # referenced against Windows Update's own driver-category search (same
    # trusted Update Agent COM API already used for the OS-update check,
    # just filtered to Type='Driver') for an honest, automatic "Windows
    # has a newer one" signal. Deliberately does NOT attempt to scrape any
    # vendor's website for their "true latest version" - no manufacturer
    # publishes a stable public API for that, and a wrong answer here is
    # worse than an honest link to go check manually.
    function Get-DriverUpdates() {
        $vendorLinks = @{
            'NVIDIA'                = 'https://www.nvidia.com/Download/index.aspx'
            'Advanced Micro Devices' = 'https://www.amd.com/en/support'
            'AMD'                   = 'https://www.amd.com/en/support'
            'ATI Technologies'       = 'https://www.amd.com/en/support'
            'Intel'                  = 'https://www.intel.com/content/www/us/en/download-center/home.html'
            'Intel Corporation'      = 'https://www.intel.com/content/www/us/en/download-center/home.html'
            'Realtek'                = 'https://www.realtek.com/en/support'
            'Realtek Semiconductor Corp.' = 'https://www.realtek.com/en/support'
            'Qualcomm'               = 'https://www.qualcomm.com/support'
            'Broadcom'               = 'https://www.broadcom.com/support'
            'MediaTek'               = 'https://www.mediatek.com/support'
        }

        $driverList = @()
        try {
            $relevantClasses = @('DISPLAY','NET','SCSIADAPTER','HDC','MEDIA','SYSTEM','BLUETOOTH')
            $pnp = Get-CimInstance Win32_PnPSignedDriver -ErrorAction Stop |
                Where-Object { $_.DeviceName -and $_.DriverVersion -and $_.DeviceClass -in $relevantClasses -and $_.Manufacturer -notmatch '^Microsoft$' } |
                Sort-Object DeviceName -Unique
            $driverList = @($pnp | Select-Object DeviceName, Manufacturer, DriverVersion, DriverDate, DeviceClass)
        } catch {}

        $driverUpdateTitles = @()
        try {
            $session = New-Object -ComObject Microsoft.Update.Session
            $searcher = $session.CreateUpdateSearcher()
            $result = $searcher.Search("IsInstalled=0 and IsHidden=0 and Type='Driver'")
            foreach ($u in $result.Updates) { $driverUpdateTitles += $u.Title }
        } catch {}

        $drivers = @()
        foreach ($d in $driverList) {
            # Fuzzy match: does any pending driver update's title contain a
            # significant word (4+ letters, to skip "the"/"for"/etc) from
            # this device's name? Genuinely approximate - Windows Update
            # titles don't follow a fixed format - so this is a signal, not
            # a guarantee, and false negatives are expected (better than a
            # false positive claiming a match that isn't real).
            $nameWords = ($d.DeviceName -split '\s+') | Where-Object { $_.Length -ge 4 }
            $matched = $false
            foreach ($title in $driverUpdateTitles) {
                foreach ($w in $nameWords) {
                    if ($title -like "*$w*") { $matched = $true; break }
                }
                if ($matched) { break }
            }
            $vendorLink = 'https://www.google.com/search?q=' + [Uri]::EscapeDataString("$($d.Manufacturer) $($d.DeviceName) driver download")
            foreach ($key in $vendorLinks.Keys) {
                if ("$($d.Manufacturer)" -match [regex]::Escape($key)) { $vendorLink = $vendorLinks[$key]; break }
            }
            $driverDateStr = $null
            if ($d.DriverDate) { try { $driverDateStr = ([Management.ManagementDateTimeConverter]::ToDateTime($d.DriverDate)).ToString("yyyy-MM-dd") } catch { $driverDateStr = "$($d.DriverDate)" } }
            $drivers += [PSCustomObject]@{
                deviceName = "$($d.DeviceName)"
                manufacturer = "$($d.Manufacturer)"
                driverVersion = "$($d.DriverVersion)"
                driverDate = $driverDateStr
                windowsUpdateAvailable = $matched
                vendorLink = $vendorLink
            }
        }
        return [PSCustomObject]@{ found = ($driverList.Count -gt 0); drivers = $drivers }
    }

    function Get-SecurityStatus() {
        # Get-MpComputerStatus is Windows Defender's own built-in
        # PowerShell interface - real-time protection state, last scan
        # time, signature age. Only gives full detail when Defender is
        # the active antivirus; if a different third-party AV is
        # installed instead, Defender may report itself as passive/
        # disabled even though the machine is actually protected by
        # something else this call has no visibility into - a real,
        # honest limitation, not a bug.
        $result = [PSCustomObject]@{
            found = $false
            antivirusEnabled = $false; realTimeProtectionEnabled = $false; antispywareEnabled = $false
            signatureAge = $null; lastQuickScan = $null; lastFullScan = $null; threatsDetected = $null
            oneDriveRunning = $false; oneDriveConfigured = $false; oneDriveLastSync = $null
        }
        try {
            $mp = Get-MpComputerStatus -ErrorAction Stop
            $result.found = $true
            $result.antivirusEnabled = [bool]$mp.AntivirusEnabled
            $result.realTimeProtectionEnabled = [bool]$mp.RealTimeProtectionEnabled
            $result.antispywareEnabled = [bool]$mp.AntispywareEnabled
            $result.signatureAge = $mp.AntivirusSignatureAge
            $result.lastQuickScan = "$($mp.QuickScanEndTime)"
            $result.lastFullScan = "$($mp.FullScanEndTime)"
            $result.threatsDetected = if ($mp.PSObject.Properties.Name -contains 'ThreatDetectionsCount') { $mp.ThreatDetectionsCount } else { $null }
        } catch {}
        # OneDrive backup status - genuinely best-effort, unlike the
        # Defender check above. Microsoft has never published an official
        # API for OneDrive sync state; this reads the same undocumented
        # registry values File Explorer's own sync icon relies on. Real,
        # useful signal, just less certain than the antivirus check -
        # Ryan's direct request 2026-07-16, explicitly accepted with that
        # caveat understood.
        try {
            $odProc = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
            $result.oneDriveRunning = [bool]$odProc
            $result.oneDriveConfigured = Test-Path "HKCU:\Software\Microsoft\OneDrive"
            $providers = Get-ChildItem "HKCU:\Software\SyncEngines\Providers\OneDrive" -ErrorAction SilentlyContinue
            if ($providers) {
                $latest = $providers | ForEach-Object {
                    try { (Get-ItemProperty $_.PSPath -ErrorAction Stop).LastSyncTime } catch { $null }
                } | Where-Object { $_ } | Sort-Object -Descending | Select-Object -First 1
                if ($latest) { $result.oneDriveLastSync = $latest }
            }
        } catch {}
        return $result
    }

    $trackerPidFile = "$env:TEMP\amit_tracker_pids.txt"
    $trackerStopFlag = "$env:TEMP\tracker_stop.flag"
    $diagnosticsStopFlag = "$env:TEMP\diagnostics_stop.flag"
    $lhmStopFlag = "$env:TEMP\lhm_stop.flag"
    # PERMANENT FIX (2026-07-19): sensor reading no longer depends on
    # LibreHardwareMonitor's own GUI app or its "Remote Web Server" toggle -
    # that toggle silently failed to turn on for a real user despite the
    # saved config claiming it was enabled, with no reliable way to force it
    # from outside the GUI. AmitSensorReader.exe (compiled against
    # LibreHardwareMonitorLib.dll directly, self-contained net10.0) reads
    # the same sensors straight from the library and writes them to a JSON
    # file - no GUI, no web server, no toggle to silently fail.
    $sensorReaderPath = Join-Path $watcherDir "AmitSensorReader.exe"
    $sensorDataPath = "$env:TEMP\amit_sensor_data.json"

    function Get-TrackerStatus() {
        $running = $false
        $pids = @()
        if (Test-Path $trackerPidFile) {
            $savedPids = Get-Content $trackerPidFile -ErrorAction SilentlyContinue
            foreach ($spid in $savedPids) {
                if ($spid -match '^\d+$') {
                    $p = Get-Process -Id $spid -ErrorAction SilentlyContinue
                    if ($p) { $running = $true; $pids += $spid }
                }
            }
        }
        return @{ running = $running; pids = $pids }
    }

    # Live command-line check for one of our own watcher scripts - same idea
    # as the existing LibreHardwareMonitor process check below, generalized.
    # A second "start tracking" call (a second open tab, a retry, whatever)
    # must recognize an already-running watcher and skip it, not launch a
    # duplicate that then fights the first one over the same output file
    # (this is exactly what caused the repeated "Stream was not readable"
    # crashes during testing on 2026-07-13 - two tabs each triggered
    # start-tracking, and nothing here stopped a second full set launching).
    function Test-WatcherScriptRunning($scriptFileName) {
        # Get-CimInstance hangs specifically when called from inside this
        # handler's runspace - confirmed live 2026-07-14: the exact same
        # call, run standalone in a normal session, returns in well under a
        # second, but every /api/start-tracking request through the actual
        # bridge server hung indefinitely at this line. Same underlying class
        # of cold-runspace issue already documented above for ConvertTo-Json
        # (works fine in a warm/normal session, hangs in this one). Fixed the
        # same way - swap to the older COM-based WMI cmdlet, which doesn't
        # share that failure mode, instead of the WSMan/CIM one.
        #
        # Retry added 2026-07-16 (Ryan's direct request, after 1.5 hours lost
        # to two full generations of watcher processes running at once) -
        # this exact query intermittently returned nothing for a genuinely
        # still-running process in this same cold-runspace environment,
        # exactly the class of unreliability already documented above for
        # the CIM version. A single miss here means Start-Tracking() thinks
        # nothing is running and launches a full duplicate set, which then
        # never gets reconciled since Stop-Tracking() only ever knew about
        # whichever generation's PIDs it last saved. One retry after a short
        # pause catches a transient miss without meaningfully slowing down
        # the normal (nothing running) case.
        $match = Get-WmiObject Win32_Process -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like "*$scriptFileName*" } |
            Select-Object -First 1
        if (-not $match) {
            Start-Sleep -Milliseconds 400
            $match = Get-WmiObject Win32_Process -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -like "*$scriptFileName*" } |
                Select-Object -First 1
        }
        return $match
    }

    # Hard guarantee, not just a retry - Ryan's direct request 2026-07-16.
    # Runs first, unconditionally, before Start-Tracking does anything else:
    # for each watcher script, if MORE THAN ONE process matches it (from any
    # prior bridge-server generation, however it got orphaned), keep only the
    # single oldest one and force-kill every extra. This is what actually
    # prevents two full generations from silently running side by side and
    # fighting over the same output files - the per-script check further
    # down only prevents launching a NEW duplicate, it never cleans up
    # duplicates that already exist from before this call.
    function Remove-DuplicateWatcherProcesses() {
        $scriptNames = @('resource_watcher.ps1', 'diagnostics_watcher.ps1', 'activity_watcher2.ps1', 'app_behavior_watcher.ps1')
        foreach ($name in $scriptNames) {
            $procMatches = @(Get-WmiObject Win32_Process -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -like "*$name*" } |
                Sort-Object { [Management.ManagementDateTimeConverter]::ToDateTime($_.CreationDate) })
            if ($procMatches.Count -gt 1) {
                foreach ($extra in $procMatches[1..($procMatches.Count - 1)]) {
                    try { Stop-Process -Id $extra.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
                }
            }
        }
    }

    function Start-Tracking() {
        Remove-DuplicateWatcherProcesses
        # NOTE: a top-level "is anything already running" shortcut used to live
        # here, based on Get-TrackerStatus (whether ANY previously-recorded pid
        # is still alive). Removed 2026-07-13 - it was a real bug: if only
        # LibreHardwareMonitor (recorded in the same pid file) was still alive
        # while the three watcher scripts had actually died, this treated the
        # whole session as "already running" and skipped restarting them,
        # silently leaving Resources/Diagnostics/App Behavior stale for good.
        # The per-script checks below (Test-WatcherScriptRunning) already do
        # this correctly and specifically per script - that's the only dedup
        # guard needed.

        # Each piece starts independently - LibreHardwareMonitor requires admin
        # (it prompts UAC on its own), and if that prompt is denied or can't be
        # shown, that alone must not stop the other three watchers from starting.
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
        $newPids = @()
        $warnings = @()

        # Check the live process list before launching - not just whether a
        # file exists at the recorded path. A file check alone can be wrong
        # (the file could've been moved/deleted since, e.g. someone cleaning
        # out a Downloads folder) while an already-running copy is still
        # genuinely running. This is what prevents launching a duplicate.
        $alreadyRunningReader = Get-Process -Name "AmitSensorReader" -ErrorAction SilentlyContinue
        if ($alreadyRunningReader) {
            # Not one of ours to track/stop later - it was already running
            # before we started, so Stop-Tracking should leave it alone.
        } elseif (Test-Path $sensorReaderPath) {
            # AmitSensorReader.exe needs admin (LibreHardwareMonitorLib's
            # driver access requires it, same as the GUI app did). Starting
            # an elevated process this way blocks the calling thread until
            # the user answers the UAC prompt - confirmed live 2026-07-14:
            # this held the entire start-tracking response hostage, so the
            # client's short timeout gave up before the response ever came
            # back. Launching the WATCHER itself elevated (one UAC prompt)
            # avoids that - it starts the reader as its own already-
            # elevated child, then waits on a stop-flag file and kills it
            # directly when signaled. No new elevation ever needed again
            # after this one initial approval, and stopping is a plain,
            # always-reliable file write instead of a second UAC gamble.
            try {
                Remove-Item $lhmStopFlag -ErrorAction SilentlyContinue
                Remove-Item $sensorDataPath -ErrorAction SilentlyContinue
                $lhmWatcherScript = @"
try {
    `$readerProc = Start-Process -FilePath '$sensorReaderPath' -ArgumentList '"$sensorDataPath"','"$lhmStopFlag"' -WindowStyle Hidden -PassThru -ErrorAction Stop
    while (-not (Test-Path '$lhmStopFlag')) {
        Start-Sleep -Seconds 1
        `$readerProc.Refresh()
        if (`$readerProc.HasExited) { break }
    }
    if (-not `$readerProc.HasExited) { Stop-Process -Id `$readerProc.Id -Force -ErrorAction SilentlyContinue }
    Remove-Item '$lhmStopFlag' -ErrorAction SilentlyContinue
} catch {}
"@
                $lhmEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($lhmWatcherScript))
                Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -ArgumentList "-NoProfile -EncodedCommand $lhmEncoded"
            } catch {
                $warnings += "Sensor reader needs admin approval to run (UAC) - sensor readings (temps/voltages/fans) won't be available this session. Resource and diagnostic tracking still work."
            }
        }

        $activityAlready = Test-WatcherScriptRunning "activity_watcher2.ps1"
        if ($activityAlready) { $newPids += $activityAlready.ProcessId }
        else {
            try {
                $activityProc = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\activity_watcher2.ps1`"" -WindowStyle Hidden -PassThru -ErrorAction Stop
                $newPids += $activityProc.Id
            } catch { $warnings += "activity watcher failed to start: $($_.Exception.Message)" }
        }

        $resourceAlready = Test-WatcherScriptRunning "resource_watcher.ps1"
        if ($resourceAlready) { $newPids += $resourceAlready.ProcessId }
        else {
            try {
                $resourceProc = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\resource_watcher.ps1`"" -WindowStyle Hidden -PassThru -ErrorAction Stop
                $newPids += $resourceProc.Id
            } catch { $warnings += "resource watcher failed to start: $($_.Exception.Message)" }
        }

        $diagAlready = Test-WatcherScriptRunning "diagnostics_watcher.ps1"
        if ($diagAlready) { $newPids += $diagAlready.ProcessId }
        else {
            try {
                $diagProc = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\diagnostics_watcher.ps1`"" -WindowStyle Hidden -PassThru -ErrorAction Stop
                $newPids += $diagProc.Id
            } catch { $warnings += "diagnostics watcher failed to start: $($_.Exception.Message)" }
        }

        $newPids -join "`n" | Set-Content -Path $trackerPidFile -Encoding utf8
        return @{ started = $true; pids = $newPids; elevated = $isAdmin; warnings = $warnings }
    }

    function Stop-Tracking() {
        $stopped = @()
        if (Test-Path $trackerPidFile) {
            $savedPids = Get-Content $trackerPidFile -ErrorAction SilentlyContinue
            # resource_watcher.ps1 AND diagnostics_watcher.ps1 both get asked
            # nicely first (a stop-flag each checks every loop pass) instead
            # of an immediate force-kill - Ryan's direct request 2026-07-16,
            # extended 2026-07-17 to diagnostics once it also gained a final
            # session-summary write. Both stop flags are set together and
            # waited on in the SAME window (not sequentially - waiting twice
            # would double the shutdown delay for no reason), so both scripts
            # get their full graceful-exit chance in parallel. activity_watcher2
            # still has no summary to produce and stays on the immediate kill
            # it always had. Falls back to a force-kill after a few seconds
            # if either doesn't exit on its own, so Stop always actually
            # stops everything either way.
            $resourceWatcherPid = $null
            $diagnosticsWatcherPid = $null
            foreach ($spid in $savedPids) {
                if ($spid -match '^\d+$') {
                    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$spid" -ErrorAction SilentlyContinue
                    if ($proc -and $proc.CommandLine -match 'resource_watcher\.ps1') {
                        $resourceWatcherPid = [int]$spid
                    } elseif ($proc -and $proc.CommandLine -match 'diagnostics_watcher\.ps1') {
                        $diagnosticsWatcherPid = [int]$spid
                    }
                }
            }
            if ($resourceWatcherPid -or $diagnosticsWatcherPid) {
                if ($resourceWatcherPid) { New-Item $trackerStopFlag -ItemType File -Force | Out-Null }
                if ($diagnosticsWatcherPid) { New-Item $diagnosticsStopFlag -ItemType File -Force | Out-Null }
                $waited = 0
                while ($waited -lt 8000) {
                    $resourceDone = -not $resourceWatcherPid -or -not (Get-Process -Id $resourceWatcherPid -ErrorAction SilentlyContinue)
                    $diagnosticsDone = -not $diagnosticsWatcherPid -or -not (Get-Process -Id $diagnosticsWatcherPid -ErrorAction SilentlyContinue)
                    if ($resourceDone -and $diagnosticsDone) { break }
                    Start-Sleep -Milliseconds 500
                    $waited += 500
                }
                if ($resourceWatcherPid -and (Get-Process -Id $resourceWatcherPid -ErrorAction SilentlyContinue)) {
                    try { Stop-Process -Id $resourceWatcherPid -Force -ErrorAction SilentlyContinue } catch {}
                }
                if ($diagnosticsWatcherPid -and (Get-Process -Id $diagnosticsWatcherPid -ErrorAction SilentlyContinue)) {
                    try { Stop-Process -Id $diagnosticsWatcherPid -Force -ErrorAction SilentlyContinue } catch {}
                }
                Remove-Item $trackerStopFlag -ErrorAction SilentlyContinue
                Remove-Item $diagnosticsStopFlag -ErrorAction SilentlyContinue
                if ($resourceWatcherPid) { $stopped += $resourceWatcherPid }
                if ($diagnosticsWatcherPid) { $stopped += $diagnosticsWatcherPid }
            }
            foreach ($spid in $savedPids) {
                if ($spid -match '^\d+$' -and [int]$spid -ne $resourceWatcherPid -and [int]$spid -ne $diagnosticsWatcherPid) {
                    try {
                        Stop-Process -Id $spid -Force -ErrorAction SilentlyContinue
                        $stopped += $spid
                    } catch {}
                }
            }
            Remove-Item $trackerPidFile -ErrorAction SilentlyContinue
        }

        # Also stop AmitSensorReader, even if it was already running before
        # this session started it (previously left alone deliberately - Ryan's
        # direct request 2026-07-13: closing the tracker window should shut
        # everything down cleanly, not leave the monitor running invisibly).
        # Signaling the stop-flag is the primary path - the elevated watcher
        # that launched the reader (see Start-Tracking above) is already
        # sitting there watching for exactly this file and kills it directly,
        # no new elevation needed. The plain-kill-then-elevated-fallback only
        # still applies to the one case the flag can't cover: the reader was
        # already running before this session ever touched it, so no
        # elevated watcher for it exists to signal.
        $lhmProcs = Get-Process -Name "AmitSensorReader" -ErrorAction SilentlyContinue
        if ($lhmProcs) {
            New-Item $lhmStopFlag -ItemType File -Force | Out-Null
            $lhmWaited = 0
            while ($lhmWaited -lt 5000) {
                if (-not (Get-Process -Name "AmitSensorReader" -ErrorAction SilentlyContinue)) { break }
                Start-Sleep -Milliseconds 500
                $lhmWaited += 500
            }
            $stillRunning = Get-Process -Name "AmitSensorReader" -ErrorAction SilentlyContinue
            if ($stillRunning) {
                # Genuinely wasn't launched by an elevated watcher of ours
                # (e.g. was already running before this session) - fall back
                # to the old best-effort approach for this one case only.
                foreach ($p in $stillRunning) {
                    try { Stop-Process -Id $p.Id -Force -ErrorAction Stop }
                    catch {
                        try {
                            Start-Process powershell -Verb RunAs -WindowStyle Hidden -ArgumentList "-NoProfile -Command `"Stop-Process -Name AmitSensorReader -Force -ErrorAction SilentlyContinue`""
                        } catch {}
                    }
                }
            }
            Remove-Item $lhmStopFlag -ErrorAction SilentlyContinue
        }

        return @{ stopped = $true; pids = $stopped }
    }

    function Send-BrowserJson($response) {
        $data = @(Get-BrowserBreakdown)
        $items = $data | ForEach-Object {
            '{"browser":' + (ConvertTo-JsonString $_.browser) + ',"totalProcesses":' + $_.totalProcesses + ',"rendererProcesses":' + $_.rendererProcesses + ',"gpuProcesses":' + $_.gpuProcesses + ',"utilityProcesses":' + $_.utilityProcesses + ',"extensionCount":' + $_.extensionCount + ',"totalMemMB":' + $_.totalMemMB + '}'
        }
        Send-JsonRaw $response ('{"browsers":[' + ($items -join ",") + ']}')
    }

    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.AbsolutePath

    # Private Network Access preflight - a separate, extra check Chrome/Edge
    # added on top of regular CORS specifically for a public HTTPS page (like
    # ask-amit.github.io) calling a private-network target (localhost). The
    # browser sends an OPTIONS request with Access-Control-Request-Private-
    # Network: true BEFORE the real request, and silently blocks everything
    # afterward unless this preflight is answered with Access-Control-Allow-
    # Private-Network: true specifically - a header regular CORS handling
    # (Access-Control-Allow-Origin alone) never sends. Confirmed live
    # 2026-07-15: Launch Tracker failed silently from the GitHub Pages
    # dashboard even though the bridge itself was verified healthy and
    # responding correctly to the exact same call made directly - this was
    # the real, missing piece, not a bridge or launch-logic bug.
    if ($request.HttpMethod -eq 'OPTIONS') {
        $response.StatusCode = 200
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Private-Network", "true")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        $response.KeepAlive = $false
        $response.ContentLength64 = 0
        $response.OutputStream.Close()
        return
    }

    try {
        switch ($path) {
            "/" {
                if (Test-Path $dashboardPath) { Send-Html $response (Get-Content $dashboardPath -Raw -Encoding UTF8) }
                else { Send-Html $response "<h1>Dashboard file not found at $dashboardPath</h1>" }
            }
            "/api/device" { Send-Json $response @{ deviceId = $deviceId; deviceName = $deviceName } }
            "/api/installed-programs" {
                # Ryan's direct request 2026-07-19: same technique verified live
                # in chat that evening (registry Uninstall keys, cross-checked
                # against each install folder's real NTFS creation date, which
                # doesn't silently drift forward the way the registry's own
                # self-reported InstallDate can on an ordinary update). Identity
                # for change-tracking is PSChildName - the actual registry
                # subkey name/GUID - not DisplayName, since several real
                # entries (the VC++ Redistributables) bake their own version
                # number into DisplayName, which would make a routine update
                # misread as a brand-new install if matched by name.
                try {
                    $paths = @(
                        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
                        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
                        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
                    )
                    $items = Get-ItemProperty $paths -ErrorAction SilentlyContinue |
                        Where-Object { $_.DisplayName } |
                        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, PSChildName |
                        Sort-Object DisplayName -Unique
                    $rowsJson = ($items | ForEach-Object {
                        # Ryan's direct request 2026-07-19: keep the real time
                        # of day, not just the date - the folder's actual NTFS
                        # CreationTime already has it, this was just being
                        # thrown away by formatting to date-only. Two things
                        # installed ten minutes apart are very likely one real
                        # install event (an app plus its runtime dependencies);
                        # two installed hours apart on the same calendar day
                        # almost certainly are not.
                        $folderDate = $null; $folderDateTime = $null
                        if ($_.InstallLocation -and (Test-Path $_.InstallLocation)) {
                            try {
                                $ct = (Get-Item $_.InstallLocation -ErrorAction Stop).CreationTime
                                $folderDate = $ct.ToString('yyyy-MM-dd')
                                $folderDateTime = $ct.ToString('yyyy-MM-ddTHH:mm:ss')
                            } catch {}
                        }
                        $regDate = $null
                        if ($_.InstallDate -and $_.InstallDate -match '^\d{8}$') {
                            $regDate = "$($_.InstallDate.Substring(0,4))-$($_.InstallDate.Substring(4,2))-$($_.InstallDate.Substring(6,2))"
                        }
                        '{"regKeyId":' + (ConvertTo-JsonString $_.PSChildName) +
                        ',"displayName":' + (ConvertTo-JsonString $_.DisplayName) +
                        ',"publisher":' + (ConvertTo-JsonString $_.Publisher) +
                        ',"version":' + (ConvertTo-JsonString $_.DisplayVersion) +
                        ',"folderDate":' + $(if ($folderDate) { ConvertTo-JsonString $folderDate } else { 'null' }) +
                        ',"folderDateTime":' + $(if ($folderDateTime) { ConvertTo-JsonString $folderDateTime } else { 'null' }) +
                        ',"registryDate":' + $(if ($regDate) { ConvertTo-JsonString $regDate } else { 'null' }) + '}'
                    }) -join ","
                    Send-JsonRaw $response ('{"programs":[' + $rowsJson + ']}')
                } catch {
                    Send-Json $response @{ error = "Could not read installed-programs list: $($_.Exception.Message)" } 500
                }
            }
            "/api/resource" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\resource_watch_result.txt" 20) }
            "/api/resource-history" {
                # Every line already contains a full sensor dump (resource_watcher.ps1
                # captures this every 30s) - returning the whole retained window (up to
                # its own 500-line cap) instead of just the last 20 lets the dashboard
                # build a real per-sensor trend over time, not just a live snapshot.
                #
                # maxLineLen was 2000 - real lines run 10,000-15,000+ characters (a full
                # sensor dump across every component). Every line was getting silently
                # truncated with "..." appended, which broke the closing "]" the JS
                # parser looks for and dropped EVERY row entirely, for every component
                # (caught live 2026-07-13 - Ryan reported nothing captured anywhere,
                # not just Motherboard). Raised well above the largest real line seen.
                Send-JsonLines $response (Get-TailSafe "$env:TEMP\resource_watch_result.txt" 500 20000)
            }
            "/api/diagnostics" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\diagnostics_watch_result.txt" 30) }
            "/api/activity" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\activity_watch2_result.txt" 30) }
            "/api/behavior" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\app_behavior_result.txt" 50) }
            "/api/behavior-status" {
                # Real bug caught live 2026-07-14: Start Watching and Stop
                # were both always shown/enabled regardless of whether a
                # session was actually running - a genuine process check
                # (same pattern as the main Tracker on/off state) instead of
                # guessing from the log's text content.
                $running = [bool](Test-WatcherScriptRunning "app_behavior_watcher.ps1")
                Send-JsonRaw $response ('{"running":' + $(if ($running) {'true'} else {'false'}) + '}')
            }
            "/api/browser" { Send-BrowserJson $response }
            "/api/drive-health" {
                $drives = @(Get-DriveHealth)
                $items = $drives | ForEach-Object {
                    '{"friendlyName":' + (ConvertTo-JsonString $_.friendlyName) + ',"healthStatus":' + (ConvertTo-JsonString $_.healthStatus) + ',"mediaType":' + (ConvertTo-JsonString $_.mediaType) + ',"wear":' + $(if ($null -ne $_.wear) { $_.wear } else { 'null' }) + ',"temperature":' + $(if ($null -ne $_.temperature) { $_.temperature } else { 'null' }) + ',"powerOnHours":' + $(if ($null -ne $_.powerOnHours) { $_.powerOnHours } else { 'null' }) + ',"readErrorsUncorrected":' + $(if ($null -ne $_.readErrorsUncorrected) { $_.readErrorsUncorrected } else { 'null' }) + ',"writeErrorsUncorrected":' + $(if ($null -ne $_.writeErrorsUncorrected) { $_.writeErrorsUncorrected } else { 'null' }) + '}'
                }
                Send-JsonRaw $response ('{"drives":[' + ($items -join ",") + ']}')
            }
            "/api/reliability" {
                $rel = Get-ReliabilityHistory
                $recordItems = $rel.records | ForEach-Object {
                    '{"time":' + (ConvertTo-JsonString "$($_.time)") + ',"source":' + (ConvertTo-JsonString $_.source) + ',"product":' + (ConvertTo-JsonString $_.product) + ',"message":' + (ConvertTo-JsonString $_.message) + ',"beforeLastUpdate":' + $(if ($_.beforeLastUpdate) {'true'} else {'false'}) + '}'
                }
                $dumpItems = $rel.minidumps | ForEach-Object {
                    '{"time":' + (ConvertTo-JsonString "$($_.time)") + ',"fileName":' + (ConvertTo-JsonString $_.fileName) + '}'
                }
                $lastUpdateStr = if ($null -ne $rel.lastUpdateDate) { ConvertTo-JsonString "$($rel.lastUpdateDate)" } else { 'null' }
                Send-JsonRaw $response ('{"records":[' + ($recordItems -join ",") + '],"minidumps":[' + ($dumpItems -join ",") + '],"lastUpdateDate":' + $lastUpdateStr + '}')
            }
            "/api/restart-pending" {
                $rp = Get-RestartPendingStatus
                $reasonItems = $rp.reasons | ForEach-Object { ConvertTo-JsonString $_ }
                Send-JsonRaw $response ('{"restartPending":' + $(if ($rp.restartPending) {'true'} else {'false'}) + ',"reasons":[' + ($reasonItems -join ",") + ']}')
            }
            "/api/pending-updates" {
                $pu = Get-PendingUpdateCount
                $titleItems = $pu.titles | ForEach-Object { ConvertTo-JsonString $_ }
                Send-JsonRaw $response ('{"found":' + $(if ($pu.found) {'true'} else {'false'}) + ',"count":' + $pu.count + ',"titles":[' + ($titleItems -join ",") + ']}')
            }
            "/api/driver-updates" {
                $du = Get-DriverUpdates
                $driverItems = $du.drivers | ForEach-Object {
                    '{"deviceName":' + (ConvertTo-JsonString $_.deviceName) + ',"manufacturer":' + (ConvertTo-JsonString $_.manufacturer) + ',"driverVersion":' + (ConvertTo-JsonString $_.driverVersion) + ',"driverDate":' + $(if ($_.driverDate) { ConvertTo-JsonString $_.driverDate } else { 'null' }) + ',"windowsUpdateAvailable":' + $(if ($_.windowsUpdateAvailable) {'true'} else {'false'}) + ',"vendorLink":' + (ConvertTo-JsonString $_.vendorLink) + '}'
                }
                Send-JsonRaw $response ('{"found":' + $(if ($du.found) {'true'} else {'false'}) + ',"drivers":[' + ($driverItems -join ",") + ']}')
            }
            "/api/open-windows-update" {
                $opened = Open-WindowsUpdateSettings
                Send-JsonRaw $response ('{"opened":' + $(if ($opened) {'true'} else {'false'}) + '}')
            }
            "/api/restart-computer" {
                # Native shutdown.exe with a short, visible grace period -
                # Windows itself shows its own "restarting in N seconds"
                # notice and gives a real way to cancel (shutdown /a)
                # right up until it fires, rather than an instant
                # force-restart with zero warning. The client is
                # responsible for gracefully stopping App Behavior/the
                # Tracker (closeEverything()) BEFORE ever calling this -
                # this endpoint only ever does the restart itself.
                try {
                    Start-Process shutdown.exe -ArgumentList "/r /t 15 /c `"Amit Computer Health is restarting this computer to finish installing updates.`""
                    Send-JsonRaw $response '{"started":true}'
                } catch {
                    Send-JsonRaw $response '{"started":false}'
                }
            }
            "/api/security" {
                $sec = Get-SecurityStatus
                $json = '{"found":' + $(if ($sec.found) {'true'} else {'false'}) +
                    ',"antivirusEnabled":' + $(if ($sec.antivirusEnabled) {'true'} else {'false'}) +
                    ',"realTimeProtectionEnabled":' + $(if ($sec.realTimeProtectionEnabled) {'true'} else {'false'}) +
                    ',"antispywareEnabled":' + $(if ($sec.antispywareEnabled) {'true'} else {'false'}) +
                    ',"signatureAge":' + $(if ($null -ne $sec.signatureAge) { $sec.signatureAge } else { 'null' }) +
                    ',"lastQuickScan":' + (ConvertTo-JsonString $sec.lastQuickScan) +
                    ',"lastFullScan":' + (ConvertTo-JsonString $sec.lastFullScan) +
                    ',"threatsDetected":' + $(if ($null -ne $sec.threatsDetected) { $sec.threatsDetected } else { 'null' }) +
                    ',"oneDriveRunning":' + $(if ($sec.oneDriveRunning) {'true'} else {'false'}) +
                    ',"oneDriveConfigured":' + $(if ($sec.oneDriveConfigured) {'true'} else {'false'}) +
                    ',"oneDriveLastSync":' + (ConvertTo-JsonString "$($sec.oneDriveLastSync)") +
                    '}'
                Send-JsonRaw $response $json
            }
            "/api/sensors" {
                # PERMANENT FIX (2026-07-19): reads AmitSensorReader.exe's own
                # output file directly instead of proxying LibreHardwareMonitor's
                # GUI web server (localhost:8085/data.json). That web server
                # required a "Remote Web Server > Run" toggle that a real user
                # hit tonight with the toggle silently off despite the saved
                # config claiming it was on, with no reliable way to force it
                # from outside the GUI. AmitSensorReader.exe reads the same
                # sensors straight from LibreHardwareMonitorLib and writes the
                # identical tree shape (Text/Value/Children) to this file every
                # 2 seconds - no GUI, no web server, no toggle to silently fail.
                try {
                    if (-not (Test-Path $sensorDataPath)) { throw "not started yet" }
                    $raw = Get-Content $sensorDataPath -Raw -ErrorAction Stop
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($raw)
                    $response.StatusCode = 200
                    $response.ContentType = "application/json"
                    $response.Headers.Add("Access-Control-Allow-Origin", "*")
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.OutputStream.Close()
                } catch {
                    Send-Json $response @{ error = "Sensor data not available yet - the tracker may still be starting, or admin approval (UAC) for sensor access wasn't granted this session." } 502
                }
            }
            "/api/tracker-status" {
                $s = Get-TrackerStatus
                Send-JsonRaw $response ('{"running":' + $(if ($s.running) {'true'} else {'false'}) + ',"pidCount":' + $s.pids.Count + '}')
            }
            "/api/start-tracking" {
                $r = Start-Tracking
                Send-JsonRaw $response ('{"started":true,"pidCount":' + $r.pids.Count + ',"elevated":' + $(if ($r.elevated) {'true'} else {'false'}) + '}')
            }
            "/api/stop-tracking" {
                $r = Stop-Tracking
                Send-JsonRaw $response ('{"stopped":true,"pidCount":' + $r.pids.Count + '}')
            }
            "/api/install-diff-latest" {
                $snapDir = "$env:TEMP\amit_install_snapshots"
                $latest = if (Test-Path $snapDir) { Get-ChildItem "$snapDir\diff_report_*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 } else { $null }
                if ($latest) { Send-Json $response @{ found = $true; content = (Get-Content $latest.FullName -Raw) } }
                else { Send-Json $response @{ found = $false } }
            }
            "/api/start-behavior" {
                # Real bug caught live 2026-07-14: two App Behavior watcher
                # processes ended up running simultaneously, both targeting
                # the same (mistyped) process name - nothing stopped a
                # second "Start Watching" click from launching a duplicate,
                # same class of bug already fixed for the bridge server and
                # the three main watchers. Same fix: check the live process
                # list first, no-op if one's already running.
                $body = New-Object System.IO.StreamReader($request.InputStream)
                $data = $body.ReadToEnd() | ConvertFrom-Json
                $alreadyRunning = Test-WatcherScriptRunning "app_behavior_watcher.ps1"
                if ($alreadyRunning) {
                    Send-Json $response @{ started = $true; alreadyRunning = $true; processName = $data.processName }
                } else {
                    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\app_behavior_watcher.ps1`" -TargetProcess `"$($data.processName)`"" -WindowStyle Hidden
                    Send-Json $response @{ started = $true; processName = $data.processName }
                }
            }
            "/api/stop-behavior" {
                New-Item "$env:TEMP\app_behavior_stop.flag" -ItemType File -Force | Out-Null
                Send-Json $response @{ stopped = $true }
            }
            "/api/behavior-metrics" {
                # app_behavior_watcher.ps1 writes this once, right as it exits
                # its main loop after Stop is pressed - the aggregated min/max/
                # avg/stddev/count rows for the whole session, reduced from
                # running accumulators, never raw per-second data. The
                # dashboard polls this right after Stop to pick up the rows
                # and bulk-insert them into amit_device_session_metrics.
                $metricsFile = "$env:TEMP\app_behavior_metrics.json"
                if (Test-Path $metricsFile) {
                    # Passed straight through as raw text instead of parsing
                    # with ConvertFrom-Json and rebuilding with ConvertTo-Json
                    # - confirmed live 2026-07-16 that round-tripping a large
                    # JSON array through this PowerShell version's
                    # ConvertFrom-Json produced a malformed {"value":[...]}
                    # wrapper (even after forcing @() on the outside), which
                    # silently broke the dashboard's d.rows.map(). The file
                    # already contains valid JSON written by
                    # app_behavior_watcher.ps1 - no need to parse it at all,
                    # just splice it directly into the response body.
                    # File now shaped {"sessionEndTime":"...","rows":[...]}
                    # (added for reconciliation-check parity with the
                    # tracker) - "found":true spliced in front the same way
                    # as /api/tracker-metrics below, not wrapped under a
                    # "rows" key.
                    $content = (Get-Content $metricsFile -Raw -Encoding UTF8).Trim()
                    Send-JsonRaw $response ('{"found":true,' + $content.Substring(1))
                } else {
                    Send-JsonRaw $response '{"found":false,"sessionEndTime":null,"rows":[]}'
                }
            }
            "/api/tracker-metrics" {
                # Same pattern as /api/behavior-metrics above, for the main
                # tracker's session-end summary. resource_watcher.ps1
                # writes this file already shaped as
                # {"sessionEndTime":"...","rows":[...]} - "found":true is
                # spliced in front rather than wrapping it under a "rows"
                # key, since sessionEndTime needs to sit alongside rows,
                # not inside it, for the dashboard's reconciliation check.
                $trackerMetricsFile = "$env:TEMP\tracker_metrics.json"
                if (Test-Path $trackerMetricsFile) {
                    $tContent = (Get-Content $trackerMetricsFile -Raw -Encoding UTF8).Trim()
                    Send-JsonRaw $response ('{"found":true,' + $tContent.Substring(1))
                } else {
                    Send-JsonRaw $response '{"found":false,"sessionEndTime":null,"rows":[]}'
                }
            }
            "/api/tracker-metrics-live" {
                # Real gap caught live 2026-07-18 (Ryan, watching the
                # Performance gauge sit frozen during an active session):
                # /api/tracker-metrics above only ever has data once the
                # session has ENDED. This serves resource_watcher.ps1's new
                # tracker_metrics_live.json instead, rewritten every ~30s
                # pass while tracking is still running, same shape/pattern
                # as the other metrics endpoints.
                $liveMetricsFile = "$env:TEMP\tracker_metrics_live.json"
                if (Test-Path $liveMetricsFile) {
                    $lContent = (Get-Content $liveMetricsFile -Raw -Encoding UTF8).Trim()
                    Send-JsonRaw $response ('{"found":true,' + $lContent.Substring(1))
                } else {
                    Send-JsonRaw $response '{"found":false,"sessionEndTime":null,"rows":[]}'
                }
            }
            "/api/diagnostics-metrics" {
                # Same pattern as /api/tracker-metrics above - Ryan's direct
                # request 2026-07-17: diagnostics_watcher.ps1 now writes its
                # own final aggregated summary the same way, so it can be
                # pushed into the same shared amit_device_session_metrics
                # table under the same event as the Tracker's own rows.
                $diagMetricsFile = "$env:TEMP\diagnostics_metrics.json"
                if (Test-Path $diagMetricsFile) {
                    $dContent = (Get-Content $diagMetricsFile -Raw -Encoding UTF8).Trim()
                    Send-JsonRaw $response ('{"found":true,' + $dContent.Substring(1))
                } else {
                    Send-JsonRaw $response '{"found":false,"sessionEndTime":null,"rows":[]}'
                }
            }
            "/api/install-start" {
                Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\install_snapshot_watcher.ps1`" -Start" -WindowStyle Hidden -Wait
                Send-Json $response @{ baselineStarted = $true }
            }
            "/api/install-compare" {
                Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\install_snapshot_watcher.ps1`" -Compare" -WindowStyle Hidden -Wait
                $snapDir = "$env:TEMP\amit_install_snapshots"
                $latest = Get-ChildItem "$snapDir\diff_report_*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                if ($latest) { Send-Json $response @{ found = $true; content = (Get-Content $latest.FullName -Raw) } }
                else { Send-Json $response @{ found = $false } }
            }
            default {
                $response.StatusCode = 404
                Send-Html $response "Not found"
            }
        }
    } catch {
        try { Send-Json $response @{ error = $_.Exception.Message } 500 } catch {}
    }
}

$pool = [runspacefactory]::CreateRunspacePool(1, 8)
# WMI/CIM cmdlets are COM-based underneath and need an STA apartment to
# marshal correctly. A runspace pool defaults to MTA, so the first WMI call
# made inside one of this pool's worker runspaces deadlocks waiting on COM
# marshaling that never completes - confirmed live 2026-07-14: identical WMI
# calls returned in well under a second run standalone (a normal PowerShell
# host is STA by default), but hung indefinitely every single time when run
# through this pool's handler script, which is exactly where
# Test-WatcherScriptRunning (used by start-tracking) calls one. This is the
# actual root cause of start-tracking hanging and never writing the PID
# file - not the earlier LHM/UAC or Get-CimInstance-vs-Get-WmiObject
# theories, both of which were reasonable but didn't fix it because the
# pool's apartment state was the real problem underneath either cmdlet.
$pool.ApartmentState = [System.Threading.ApartmentState]::STA
$pool.Open()
$running = New-Object System.Collections.ArrayList

while ($listener.IsListening) {
    $context = $listener.GetContext()

    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($handlerScript).AddArgument($context).AddArgument($watcherDir).AddArgument($dashboardPath).AddArgument($deviceId).AddArgument($deviceName)
    $handle = $ps.BeginInvoke()
    [void]$running.Add(@{ PS = $ps; Handle = $handle })

    # Clean up completed handlers so the list doesn't grow forever
    for ($i = $running.Count - 1; $i -ge 0; $i--) {
        if ($running[$i].Handle.IsCompleted) {
            try { $running[$i].PS.EndInvoke($running[$i].Handle) } catch {}
            $running[$i].PS.Dispose()
            $running.RemoveAt($i)
        }
    }
}

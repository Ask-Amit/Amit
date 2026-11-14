# amit_crash_check.ps1  v1.01 (2026-11-14, Ryan) - at sign-in, notice a hard crash (always: crash_notice.json for the Hub's pop-up) and, in WATCH MODE, package what was recorded.
#
# Started by the bridge (amit_bridge_server.ps1) every time it starts, i.e. the first thing that happens when the person signs in.
# 1. Watch mode off -> nothing at all (normal mode keeps only its snapshots, exactly as before).
# 2. Watch mode on -> was this start preceded by an UNCLEAN shutdown? Windows says so itself: Kernel-Power event 41 (+ EventLog 6008,
#    which names the last moment the computer was alive), logged within minutes of this boot. A leftover checkpoint is NOT used for
#    this: the tracker often fails to stop cleanly at a normal shutdown, so that test cries wolf.
# 3. If so: package everything useful into ONE queued file (data\pending\zcrash_<stamp>.json): the permanent watch trace for the
#    24 hours before the last-alive moment, the Windows events around it, what had just been installed or changed, the earlier
#    unclean shutdowns, and what this computer is made of. gzip + base64, so it stays small. The Hub / Computer Health page saves
#    it to the database at the next sign-in (the helper has no login of its own) and the helper deletes the file once it is saved.
# 4. Then, once the desktop has settled and there is internet, open Computer Health ONCE so it can say "we registered a hard crash".
# Never throws a visible error; everything it does is logged to crash_check.log. -TestEventTime replays an older unclean shutdown
# (the time of its Kernel-Power 41 event) for testing; -NoOpen skips opening the page; -Force ignores "already handled".
param([string]$TestEventTime = '', [switch]$NoOpen, [switch]$Force)
$ErrorActionPreference = 'SilentlyContinue'
$base = "$env:LOCALAPPDATA\AmitComputerHealth"
$watchFile = "$base\watch_mode.json"
$stateFile = "$base\watch_state.json"
$watchDir = "$base\data\watch"
$pendingDir = "$base\data\pending"
$logFile = "$base\crash_check.log"
$pageUrl = 'https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html'
function Log($m) { try { New-Item -ItemType Directory -Path $base -Force | Out-Null; Add-Content -Path $logFile -Value ("{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8 } catch {} }
function Short($s, $n = 300) { if (-not $s) { return '' }; $s = ($s -replace '\s+', ' ').Trim(); if ($s.Length -gt $n) { return $s.Substring(0, $n) + '...' }; return $s }
function Write-DurableFile($path, $text) {
    try {
        New-Item -ItemType Directory -Path (Split-Path $path) -Force -ErrorAction Stop | Out-Null
        $tmp = "$path.tmp"
        [System.IO.File]::WriteAllText($tmp, $text, (New-Object System.Text.UTF8Encoding($false)))
        Move-Item -LiteralPath $tmp -Destination $path -Force -ErrorAction Stop
        return $true
    } catch { return $false }
}

$ws = $null
try { if (Test-Path $watchFile) { $ws = [System.IO.File]::ReadAllText($watchFile) | ConvertFrom-Json } } catch {}
# v1.01 (2026-11-14, Ryan): the crash is noticed EVERY time, Watch mode or not (a small crash_notice.json for the Hub's pop-up: "we noticed a Windows
# crash; if it keeps happening, turn on Watch mode"). Only the heavy part below (packaging the trace) needs Watch mode.
$watchOn = [bool]($ws -and $ws.on)
$windowHours = if ($ws -and $ws.crashWindowHours) { [int]$ws.crashWindowHours } else { 24 }

$state = [ordered]@{ lastCrashProcessed = ''; lastDumpId = ''; openedId = '' }
try { if (Test-Path $stateFile) { $o = [System.IO.File]::ReadAllText($stateFile) | ConvertFrom-Json; foreach ($k in 'lastCrashProcessed', 'lastDumpId', 'openedId') { if ($o.$k) { $state[$k] = [string]$o.$k } } } } catch {}
function Save-State { try { [System.IO.File]::WriteAllText($stateFile, ($state | ConvertTo-Json -Compress)) } catch {} }

function Test-Internet {
    try { [void][System.Net.Dns]::GetHostAddresses('ask-amit.github.io'); [void](Invoke-WebRequest -UseBasicParsing 'https://ask-amit.github.io/' -Method Head -TimeoutSec 8); return $true } catch { return $false }
}
function Open-PageOnce($id) {
    if ($NoOpen) { Log "not opening the page (NoOpen) for $id"; return }
    if (-not $Force -and $state.openedId -eq $id) { Log "Computer Health was already opened for crash ${id} - not opened again"; return }   # never twice for the same crash
    if (-not $Force -and -not $TestEventTime) { Start-Sleep -Seconds 60 }   # let the desktop settle after sign-in
    $until = (Get-Date).AddMinutes(20)
    while ((Get-Date) -lt $until) { if (Test-Internet) { break }; Start-Sleep -Seconds 20 }
    if (-not (Test-Internet)) { Log "no internet within 20 minutes: page not opened for $id (will try again at the next start)"; return }
    try { Start-Process ($pageUrl + '?crash=' + $id); $state.openedId = $id; Save-State; Log "opened Computer Health for crash $id" } catch { Log "could not open the page: $($_.Exception.Message)" }
}

# ---- 1. find the unclean shutdown that belongs to THIS start -------------------------------------------------------------
$osInfo = Get-CimInstance Win32_OperatingSystem
$bootTime = $osInfo.LastBootUpTime
$ev = $null
try {
    if ($TestEventTime) {
        $t0 = [datetime]$TestEventTime
        $ev = Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 41; ProviderName = 'Microsoft-Windows-Kernel-Power'; StartTime = $t0.AddMinutes(-2); EndTime = $t0.AddMinutes(2) } -ErrorAction Stop | Select-Object -First 1
        if ($ev) { $bootTime = $ev.TimeCreated.AddSeconds(-10) }
    } else {
        $ev = Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 41; ProviderName = 'Microsoft-Windows-Kernel-Power'; StartTime = $bootTime.AddMinutes(-2); EndTime = $bootTime.AddMinutes(30) } -ErrorAction Stop | Sort-Object TimeCreated -Descending | Select-Object -First 1
    }
} catch {}

if (-not $ev) {
    Log 'no unclean shutdown was logged for this start'
    # a dump packaged earlier whose page never opened (no internet last time) is offered again
    if ($state.lastDumpId -and $state.openedId -ne $state.lastDumpId -and (Test-Path "$pendingDir\zcrash_$($state.lastDumpId).json")) { Open-PageOnce $state.lastDumpId }
    exit 0
}
$evIso = $ev.TimeCreated.ToString('o')
if (-not $Force -and $state.lastCrashProcessed -eq $evIso) { Log "unclean shutdown $evIso was already handled"; if ($state.lastDumpId -and $state.openedId -ne $state.lastDumpId -and (Test-Path "$pendingDir\zcrash_$($state.lastDumpId).json")) { Open-PageOnce $state.lastDumpId }; exit 0 }
Log "UNCLEAN SHUTDOWN found: Kernel-Power 41 at $evIso (boot $($bootTime.ToString('o')))"

$evData = @{}
try { $x = [xml]$ev.ToXml(); foreach ($d in $x.Event.EventData.Data) { $evData[$d.Name] = $d.'#text' } } catch {}

# last moment the computer was alive: EventLog 6008 names it ("The previous system shutdown at 1:25:38 PM on 11/13/2026 was unexpected.")
$lastAlive = $null; $lastAliveExact = $false
try {
    $e6008 = Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 6008; StartTime = $ev.TimeCreated.AddMinutes(-3); EndTime = $ev.TimeCreated.AddMinutes(3) } -ErrorAction Stop | Select-Object -First 1
    if ($e6008) {
        $msg = ($e6008.Message -replace '[\u200e\u200f]', '')
        $m = [regex]::Match($msg, '(\d{1,2}:\d{2}:\d{2}\s*[AP]M)\s+on\s+(\d{1,2}/\d{1,2}/\d{4})')
        if ($m.Success) { $lastAlive = [datetime]::Parse(($m.Groups[2].Value + ' ' + $m.Groups[1].Value), [System.Globalization.CultureInfo]::CurrentCulture); $lastAliveExact = $true }
    }
} catch {}
if (-not $lastAlive) { $lastAlive = $bootTime.AddMinutes(-1) }
# Windows prints the time without a time zone; say it is local time so every "o" format below carries the offset (otherwise the database reads it as UTC, 8 hours off)
$lastAlive = [datetime]::SpecifyKind($lastAlive, [System.DateTimeKind]::Local)
$gapMin = [math]::Round(($bootTime - $lastAlive).TotalMinutes)

# ---- 1b. the notice for the Hub's pop-up (always, Watch mode or not) ----------------------------------------------------------
# One small file. The Hub asks the helper for it at sign-in (/api/crash-notice) and shows "we noticed a Windows crash"; the person's answer is
# remembered (acked) so it is shown once. Written again with the dump's id once a dump has been packaged. An existing notice for the same crash keeps its acked flag.
$noticeFile = "$base\crash_notice.json"
$noticeId = $lastAlive.ToUniversalTime().ToString('yyyyMMddHHmmss')
function Write-Notice($dumpId, $readingCount) {
    try {
        $acked = $false; $ackedAt = ''
        if (Test-Path $noticeFile) { $old = [System.IO.File]::ReadAllText($noticeFile) | ConvertFrom-Json; if ($old.id -eq $noticeId) { $acked = [bool]$old.acked; $ackedAt = [string]$old.ackedAt } }
        $count30 = 0; try { $count30 = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 41; ProviderName = 'Microsoft-Windows-Kernel-Power'; StartTime = (Get-Date).AddDays(-30) } -ErrorAction Stop).Count } catch {}
        $n = [ordered]@{
            id = $noticeId; eventTime = $evIso; lastAliveAt = $lastAlive.ToString('o'); lastAliveExact = $lastAliveExact; bootAt = $bootTime.ToString('o'); downMinutes = $gapMin
            sleepInProgress = $evData['SleepInProgress']; bugcheck = $evData['BugcheckCode']; crashesLast30Days = $count30
            watchOn = $watchOn; readings = [int]$readingCount; dumpId = $dumpId; acked = $acked; ackedAt = $ackedAt; createdAt = (Get-Date).ToString('o')
        } | ConvertTo-Json -Compress
        [void](Write-DurableFile $noticeFile $n)
    } catch { Log "could not write the crash notice: $($_.Exception.Message)" }
}
Write-Notice '' 0
if (-not $watchOn) { Log "unclean shutdown noticed (notice $noticeId written); Watch mode is off, so nothing was packaged"; exit 0 }

# ---- 2. the Windows events around it -------------------------------------------------------------------------------------
$from = $lastAlive.AddMinutes(-30)
$to = $bootTime.AddMinutes(10)
$provRx = 'Kernel-Power|WHEA|Display|nvlddmkm|amdkmdag|disk|stor|Ntfs|volmgr|Service Control|Power-Troubleshooter|Kernel-General|EventLog|Application Popup|BugCheck|Resource-Exhaustion|Kernel-PnP|WindowsUpdateClient|DriverFrameworks|Kernel-Boot|Winlogon|User32'
$sysEvents = @()
try {
    $all = Get-WinEvent -FilterHashtable @{ LogName = 'System'; StartTime = $from; EndTime = $to } -ErrorAction Stop
    $sysEvents = @($all | Where-Object { $_.Level -le 3 -or $_.ProviderName -match $provRx } | Sort-Object TimeCreated | Select-Object -First 400 | ForEach-Object {
        [ordered]@{ t = $_.TimeCreated.ToString('o'); log = 'System'; id = $_.Id; src = $_.ProviderName; lvl = $_.LevelDisplayName; msg = (Short $_.Message) } })
} catch {}
$appEvents = @()
# Found in the first test (Nov 13 replay): at every boot Windows Error Reporting RE-REPORTS old blue-screen dump files (the ones named
# MMDDYY-nnnn-nn.dmp, here from July 1) as 108 fresh "BlueScreen" events. They are not this crash and would drown the real evidence, so
# a dump whose date is more than 2 days from the crash is counted and listed once instead of being kept as an event.
$staleDumps = @{}
try {
    $allA = Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = $from; EndTime = $to } -ErrorAction Stop
    foreach ($e in ($allA | Where-Object { $_.Level -le 2 -or $_.Id -in 1000, 1001, 1002, 1026 } | Sort-Object TimeCreated)) {
        $dm = [regex]::Match([string]$e.Message, 'Minidump\\(\d{2})(\d{2})(\d{2})-\d+-\d+')
        if ($e.ProviderName -eq 'Windows Error Reporting' -and $e.Message -match 'BlueScreen' -and $dm.Success) {
            try {
                $dmpDate = New-Object DateTime (2000 + [int]$dm.Groups[3].Value), ([int]$dm.Groups[1].Value), ([int]$dm.Groups[2].Value)
                if ([math]::Abs(($dmpDate - $lastAlive.Date).TotalDays) -gt 2) { $staleDumps[$dm.Value] = $dmpDate.ToString('yyyy-MM-dd'); continue }
            } catch {}
        }
        if ($appEvents.Count -lt 120) { $appEvents += [ordered]@{ t = $e.TimeCreated.ToString('o'); log = 'Application'; id = $e.Id; src = $e.ProviderName; lvl = $e.LevelDisplayName; msg = (Short $e.Message) } }
    }
} catch {}

# what had just been installed or changed (7 days before the last-alive moment)
$changes = @()
try {
    $chg = Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-WindowsUpdateClient'; Id = 19; StartTime = $lastAlive.AddDays(-7); EndTime = $lastAlive } -ErrorAction Stop
    $changes += @($chg | ForEach-Object { [ordered]@{ t = $_.TimeCreated.ToString('o'); kind = 'update'; msg = (Short $_.Message 200) } })
} catch {}
try {
    $chg = Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-UserPnp'; Id = 20001; StartTime = $lastAlive.AddDays(-7); EndTime = $lastAlive } -ErrorAction Stop
    $changes += @($chg | ForEach-Object { [ordered]@{ t = $_.TimeCreated.ToString('o'); kind = 'driver'; msg = (Short $_.Message 200) } })
} catch {}
try {
    $chg = Get-WinEvent -FilterHashtable @{ LogName = 'Application'; ProviderName = 'MsiInstaller'; Id = 11707, 11724; StartTime = $lastAlive.AddDays(-7); EndTime = $lastAlive } -ErrorAction Stop
    $changes += @($chg | ForEach-Object { [ordered]@{ t = $_.TimeCreated.ToString('o'); kind = 'install'; msg = (Short $_.Message 200) } })
} catch {}
$changes = @($changes | Sort-Object { $_.t } | Select-Object -Last 80)

# the earlier unclean shutdowns (45 days)
$prior = @()
try {
    $p = Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 41; ProviderName = 'Microsoft-Windows-Kernel-Power'; StartTime = (Get-Date).AddDays(-45) } -ErrorAction Stop
    $prior = @($p | Sort-Object TimeCreated | ForEach-Object {
        $dd = @{}; try { $xx = [xml]$_.ToXml(); foreach ($d in $xx.Event.EventData.Data) { $dd[$d.Name] = $d.'#text' } } catch {}
        [ordered]@{ t = $_.TimeCreated.ToString('o'); bugcheck = $dd['BugcheckCode']; sleepInProgress = $dd['SleepInProgress'] } })
} catch {}

# ---- 3. what this computer is made of ----------------------------------------------------------------------------------
$sys = [ordered]@{}
try { $sys.os = "$($osInfo.Caption) build $($osInfo.BuildNumber)" } catch {}
try { $b = Get-CimInstance Win32_BIOS; $sys.bios = "$($b.Manufacturer) $($b.SMBIOSBIOSVersion) ($($b.ReleaseDate))" } catch {}
try { $bb = Get-CimInstance Win32_BaseBoard; $sys.board = "$($bb.Manufacturer) $($bb.Product)" } catch {}
try { $sys.cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name } catch {}
try { $sys.ram = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object { "$($_.Manufacturer) $($_.PartNumber) $([math]::Round($_.Capacity/1GB))GB @ $($_.ConfiguredClockSpeed)MHz" }) } catch {}
try { $sys.gpu = @(Get-CimInstance Win32_VideoController | ForEach-Object { "$($_.Name) driver $($_.DriverVersion) ($($_.DriverDate))" }) } catch {}
try { $sys.disks = @(Get-PhysicalDisk | ForEach-Object { "$($_.FriendlyName) fw $($_.FirmwareVersion) $($_.HealthStatus)" }) } catch {}
try { $sys.fastStartup = [int](Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power').HiberbootEnabled } catch {}
try { $sys.dumps = @(Get-ChildItem 'C:\Windows\Minidump', 'C:\Windows\LiveKernelReports' -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $lastAlive.AddDays(-1) } | ForEach-Object { $_.FullName }); if (Test-Path 'C:\Windows\MEMORY.DMP') { $sys.dumps += 'C:\Windows\MEMORY.DMP' } } catch {}

# ---- 4. the watch trace for the 24 hours before the last-alive moment -----------------------------------------------------
$traceLines = New-Object System.Collections.Generic.List[string]
$nStarts = 0; $nEnds = 0; $firstT = $null; $lastT = $null
try {
    $since = $lastAlive.AddHours(-$windowHours)
    $rxT = [regex]'"(?:t|start)":"([^"]+)"'
    foreach ($f in (Get-ChildItem $watchDir -Filter 'trace_*.jsonl' -File -ErrorAction SilentlyContinue | Sort-Object Name)) {
        $fd = $null; try { $fd = [datetime]::ParseExact(($f.BaseName -replace '^trace_', ''), 'yyyy-MM-dd', $null) } catch {}
        if ($fd -and ($fd -lt $since.Date -or $fd -gt $bootTime.Date)) { continue }
        foreach ($ln in [System.IO.File]::ReadAllLines($f.FullName)) {
            $mm = $rxT.Match($ln); if (-not $mm.Success) { continue }
            $tt = $null; try { $tt = [datetimeoffset]::Parse($mm.Groups[1].Value).LocalDateTime } catch { continue }
            if ($tt -lt $since -or $tt -gt $bootTime) { continue }
            $traceLines.Add($ln)
            if ($ln.StartsWith('{"start"')) { $nStarts++ } elseif ($ln.StartsWith('{"end"')) { $nEnds++ }
            if (-not $firstT) { $firstT = $tt }; $lastT = $tt
        }
    }
} catch {}
$readings = @($traceLines | Where-Object { -not $_.StartsWith('{"start"') -and -not $_.StartsWith('{"end"') }).Count
if ($traceLines.Count -gt 3500) { $traceLines.RemoveRange(0, $traceLines.Count - 3500) }
$traceGapSec = if ($lastT) { [math]::Round(($lastAlive - $lastT).TotalSeconds) } else { $null }

# ---- 5. build, compress, queue -------------------------------------------------------------------------------------------
$fmt = 'h:mm:ss tt on MMM d'
$summary = "Hard shutdown: the computer was last alive at $($lastAlive.ToString($fmt)) and restarted at $($bootTime.ToString('h:mm tt')) ($gapMin min later). $readings recorded readings before it."
$dump = [ordered]@{
    schema = 1; kind = 'hard_crash'; summary = $summary
    detectedAt = (Get-Date).ToString('o'); eventTime = $evIso; bootAt = $bootTime.ToString('o'); lastAliveAt = $lastAlive.ToString('o'); lastAliveExact = $lastAliveExact
    bugcheck = $evData['BugcheckCode']; bugcheckParams = @($evData['BugcheckParameter1'], $evData['BugcheckParameter2'], $evData['BugcheckParameter3'], $evData['BugcheckParameter4'])
    sleepInProgress = $evData['SleepInProgress']; powerButtonTimestamp = $evData['PowerButtonTimestamp']
    system = $sys; windowsEvents = @($sysEvents + $appEvents); recentChanges = $changes; priorCrashes = $prior
    staleDumpReports = [ordered]@{ count = $staleDumps.Count; dates = @($staleDumps.Values | Sort-Object -Unique); note = 'Old blue-screen dump files that Windows Error Reporting re-reports at every boot. Not this crash.' }
    traceInfo = [ordered]@{ readings = $readings; starts = $nStarts; cleanEnds = $nEnds; firstT = $(if ($firstT) { $firstT.ToString('o') } else { $null }); lastT = $(if ($lastT) { $lastT.ToString('o') } else { $null }); lastReadingToLastAliveSec = $traceGapSec; windowHours = $windowHours; watchOnSince = [string]$ws.since }
    trace = ($traceLines -join "`n")
}
$json = $dump | ConvertTo-Json -Depth 8 -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$ms = New-Object System.IO.MemoryStream
$gz = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Compress, $true)
$gz.Write($bytes, 0, $bytes.Length); $gz.Dispose()
$b64 = [Convert]::ToBase64String($ms.ToArray()); $ms.Dispose()
$stamp = $lastAlive.ToUniversalTime().ToString('yyyyMMddHHmmss')
$pend = [ordered]@{
    type = 'crash'; sessionEndTime = $lastAlive.ToUniversalTime().ToString('o'); recovered = $false
    crash = [ordered]@{ id = $stamp; detectedAt = $dump.detectedAt; bootAt = $dump.bootAt; lastAliveAt = $dump.lastAliveAt; summary = $summary; rawBytes = $bytes.Length; readings = $readings; payloadGz = $b64 }
    rows = @()
} | ConvertTo-Json -Depth 5 -Compress
if (Write-DurableFile "$pendingDir\zcrash_$stamp.json" $pend) {
    Log "packaged crash dump zcrash_$stamp.json : $readings readings, $($sysEvents.Count + $appEvents.Count) Windows events, raw $([math]::Round($bytes.Length/1KB)) KB, queued $([math]::Round($pend.Length/1KB)) KB"
    $state.lastCrashProcessed = $evIso; $state.lastDumpId = $stamp; Save-State
    Write-Notice $stamp $readings
    Open-PageOnce $stamp
} else {
    Log 'could not write the crash dump file'
}

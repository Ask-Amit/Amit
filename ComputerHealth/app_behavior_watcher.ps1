# Amit Watcher - App Behavior Tracker
# Usage: app_behavior_watcher.ps1 -TargetProcess "notepad"
#    or: app_behavior_watcher.ps1               (auto-detect mode)
#
# Requiring someone to know an app's exact process name upfront doesn't work
# for the actual use case this exists for - checking a program you just
# downloaded and don't recognize yet, whose real process name is rarely the
# same as its display name or file you double-clicked (caught live
# 2026-07-13 - Ryan: "people don't know exactly how it's gonna be named when
# the app runs"). Auto-detect mode fixes this the same way Install Watch
# already does: snapshot what's running BEFORE, then whatever NEW process
# name appears after that point is adopted automatically - point-and-click,
# no typing required. Explicitly naming a process is still supported for
# anyone who already knows it and wants to skip the wait.
#
# Run this, then go use the app you're evaluating. When you're done, either
# Ctrl+C this window, or create the stop flag file:
#   New-Item "$env:TEMP\app_behavior_stop.flag" -ItemType File
# Report is written continuously to $env:TEMP\app_behavior_result.txt so you
# can review it any time - no need to wait for the session to "end."
#
# HONESTY NOTE ON WHAT THIS CAN AND CAN'T PROVE:
# - Network connections ARE attributed exactly to the target process (Windows
#   gives us the owning PID directly - no guessing).
# - File writes are NOT attributed with certainty. True per-process file
#   attribution requires a kernel ETW trace, which this script does not run.
#   Instead, this watches common write-prone folders system-wide and reports
#   anything that changed while the target process was running, flagged as
#   "correlated in time" - not "proven caused by." Treat file findings as a
#   lead to check, not a verdict.
# - This does not decrypt network traffic. It shows WHERE data goes (remote
#   IP, resolved hostname, port), never WHAT is in it.
# - VirusTotal hash lookup gives a real third-party verdict on written files,
#   if you've set a free API key below. Without a key, files are hashed and
#   logged but not verdict-checked.

param(
    [string]$TargetProcess = "",

    [string]$VirusTotalApiKey = ""
)

# Keeps Windows from sleeping while App Behavior is actively watching -
# same fix as resource_watcher.ps1, same reasoning: Ryan raised 2026-07-16
# that a long watch session would otherwise get silently interrupted the
# moment the machine sleeps. Releases itself automatically the instant
# this process exits - normal sleep behavior resumes the moment watching
# stops, nothing to remember to undo.
try {
    Add-Type -Name Sleep -Namespace Amit -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);' -ErrorAction SilentlyContinue
    [Amit.Sleep]::SetThreadExecutionState(0x80000000 -bor 0x00000001) | Out-Null
} catch {}

$out = "$env:TEMP\app_behavior_result.txt"
$stopFlag = "$env:TEMP\app_behavior_stop.flag"
Remove-Item $stopFlag -ErrorAction SilentlyContinue

$watchPaths = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE\Downloads",
    "$env:LOCALAPPDATA",
    "$env:APPDATA",
    "$env:TEMP",
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
)

$autoDetect = [string]::IsNullOrWhiteSpace($TargetProcess)
$watchedNames = New-Object System.Collections.Generic.HashSet[string]
if (-not $autoDetect) { [void]$watchedNames.Add($TargetProcess) }
$baselinePidSet = $null

if ($autoDetect) {
    "Amit App Behavior Watcher started at $(Get-Date -Format 'HH:mm:ss.fff') - auto-detect mode: go open the program you want to check, it'll be picked up automatically." | Out-File -FilePath $out -Encoding utf8
    $baselinePidSet = New-Object System.Collections.Generic.HashSet[int]
    Get-Process | ForEach-Object { [void]$baselinePidSet.Add($_.Id) }
} else {
    "Amit App Behavior Watcher started at $(Get-Date -Format 'HH:mm:ss.fff') - target process: '$TargetProcess'" | Out-File -FilePath $out -Encoding utf8
}
"Watching for file writes under: $($watchPaths -join ', ')" | Add-Content -Path $out -Encoding utf8
"To stop: create $stopFlag, or Ctrl+C this window." | Add-Content -Path $out -Encoding utf8
"" | Add-Content -Path $out -Encoding utf8

$knownFiles = @{}
$seenConnections = @{}
$startupPaths = @(
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
)

function Test-IsStartupPath($path) {
    foreach ($sp in $startupPaths) {
        if ($path -like "$sp*") { return $true }
    }
    return $false
}

function Get-VTVerdict($hash) {
    if (-not $VirusTotalApiKey) { return "no API key set" }
    try {
        $headers = @{ "x-apikey" = $VirusTotalApiKey }
        $resp = Invoke-RestMethod -Uri "https://www.virustotal.com/api/v3/files/$hash" -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        $stats = $resp.data.attributes.last_analysis_stats
        if ($stats.malicious -gt 0 -or $stats.suspicious -gt 0) {
            return "FLAGGED: $($stats.malicious) engines malicious, $($stats.suspicious) suspicious (of $($stats.malicious+$stats.suspicious+$stats.undetected+$stats.harmless))"
        } else {
            return "clean per VirusTotal ($($stats.harmless+$stats.undetected) engines, 0 flags)"
        }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) { return "unknown to VirusTotal (not previously submitted)" }
        return "lookup failed: $($_.Exception.Message)"
    }
}

function Resolve-RemoteHost($ip) {
    try {
        $entry = [System.Net.Dns]::GetHostEntry($ip)
        return $entry.HostName
    } catch {
        return "(no reverse DNS)"
    }
}

# One shared table, not two - Ryan's direct request 2026-07-15: rather
# than App Behavior keeping its own separate resource log alongside
# resource_watcher.ps1's, every snapshot App Behavior needs (session start,
# every 10 seconds while running, the instant a new real program is
# detected, session stop) gets written into the SAME file
# resource_watcher.ps1 already writes to, in the exact same line format.
# resource_watcher.ps1's own independent 30-second cycle keeps running
# completely unaffected - this just adds extra entries into that one
# table when App Behavior needs a tighter reading than 30 seconds. At the
# end, the summary is built by reading that ONE shared table for
# everything between session-start and session-stop, not from a separate
# in-memory list - so there is only ever one place resource history lives,
# and future changes to how sensors are read only ever need to happen in
# one spot.
$sharedResourceLog = "$env:TEMP\resource_watch_result.txt"

function Get-SensorFlat($node, $path = "") {
    $results = @()
    $currentPath = if ($path) { "$path>$($node.Text)" } else { $node.Text }
    if ($node.Children -is [array] -and $node.Children.Count -gt 0) {
        foreach ($child in $node.Children) { $results += Get-SensorFlat $child $currentPath }
    } elseif ($node.Value -and $node.Value -ne "") {
        $results += "$currentPath=$($node.Value)"
    }
    return $results
}

# Mirrors categorizeHardware()'s name-based matching in
# ComputerHealth_Dashboard.html exactly (same regex order, same
# precedence rules) so a sensor's assigned component here always agrees
# with how the Hardware tab would categorize the same device - one
# classification rule, not two that could quietly drift apart.
function Get-ComponentCategory($title) {
    $t = $title.ToLower()
    if ($t -match 'ryzen|intel core|celeron|pentium|xeon') { return 'CPU' }
    if ($t -match 'geforce|radeon|nvidia|quadro|rtx|gtx') { return 'GPU' }
    if ($t -match 'ethernet|wi-?fi|wireless|network') { return 'Network' }
    if ($t -match 'asus|msi|gigabyte|asrock|biostar|ms-\d' -and $t -notmatch 'geforce|radeon') { return 'Motherboard' }
    if ($t -eq 'virtual memory') { return 'RAM' }
    if ($t -in @('total memory', 'generic memory', 'physical memory')) { return 'RAM' }
    if ($t -match 'ssd|nvme|hdd|hard disk') { return 'Storage' }
    # Kept byte-for-byte equivalent with resource_watcher.ps1's copy of this
    # same fix - real bug caught live 2026-07-18 (Ryan): Kingston SSD model
    # numbers (e.g. "KINGSTON SA400S37240G") don't literally contain "ssd",
    # so they fell through to the generic Kingston-brand match below and got
    # mislabeled component='RAM' instead of 'Storage'.
    # Same fix as resource_watcher.ps1: trailing \b never matched since
    # Kingston concatenates capacity directly onto the model code with no
    # boundary ("SA400S37240G").
    if ($t -match 'kingston.*(sa400|suv|skc|snv|shss|sedc)') { return 'Storage' }
    if ($t -match 'g\.?skill|corsair|crucial|kingston|hyperx|f4-|f5-|ddr\d') { return 'RAM' }
    return 'Other'
}

# Splits a trimmed sensor path like "MSI B450M PRO-VDH MAX (MS-7A38)>Nuvoton
# NCT6795D>Voltages>Voltage #2" into the four identity fields the metrics
# table uses: metric_name is always the last segment, category the one
# before it, everything earlier joins into title (the actual hardware/chip
# name), and component is derived from title via the same rule as the
# Hardware tab so it stays consistent no matter what's plugged in.
function Get-MetricIdentity($rawPath) {
    $segments = $rawPath -split '>'
    if ($segments.Count -lt 2) { return $null }
    $metricName = $segments[-1]
    if ($segments.Count -eq 2) {
        $category = '(uncategorized)'
        $title = $segments[0]
    } else {
        $category = $segments[-2]
        $title = ($segments[0..($segments.Count - 3)]) -join ' - '
    }
    $component = Get-ComponentCategory $title
    return [PSCustomObject]@{ component = $component; title = $title; metricName = $metricName; category = $category }
}

# Running count/sum/sumOfSquares/min/max per (component, title, metric,
# category) - exact min/max/average/standard-deviation can be reconstructed
# from these four numbers alone at session-end, without ever storing or
# re-reading individual per-second readings. Confirmed live 2026-07-15
# (worked through the actual math with Ryan) rather than assumed.
function Update-MetricStats($stats, $identity, [double]$value) {
    if (-not $identity) { return }
    $key = "$($identity.component)|$($identity.title)|$($identity.metricName)|$($identity.category)"
    if (-not $stats.ContainsKey($key)) {
        $stats[$key] = [PSCustomObject]@{
            component = $identity.component; title = $identity.title
            metricName = $identity.metricName; category = $identity.category
            count = 0; sum = 0.0; sumSq = 0.0
            min = [double]::MaxValue; max = [double]::MinValue
        }
    }
    $s = $stats[$key]
    $s.count++
    $s.sum += $value
    $s.sumSq += ($value * $value)
    if ($value -lt $s.min) { $s.min = $value }
    if ($value -gt $s.max) { $s.max = $value }
}

# Reduces the running accumulators into the final rows the Supabase table
# expects. Population variance formula (sumSq/count - avg^2), floor-clamped
# at 0 to guard against a tiny negative from floating-point rounding on
# near-constant values (e.g. a voltage that never moved at all).
function Get-FinalMetricRows($stats) {
    $rows = @()
    foreach ($s in $stats.Values) {
        if ($s.count -eq 0) { continue }
        $avg = $s.sum / $s.count
        $variance = ($s.sumSq / $s.count) - ($avg * $avg)
        if ($variance -lt 0) { $variance = 0 }
        $rows += [PSCustomObject]@{
            component = $s.component; title = $s.title
            metric_name = $s.metricName; category = $s.category
            min_value = $s.min; max_value = $s.max; avg_value = $avg
            stddev_value = [math]::Sqrt($variance); sample_count = $s.count
        }
    }
    return $rows
}

# Same RAM/CPU/sensor-dump calc and line FORMAT resource_watcher.ps1 uses,
# so a line written by either script is indistinguishable and parses the
# same way. Appends to the shared file (safe for two processes to append
# to the same file concurrently - each write opens, writes, and closes
# immediately, no held lock) and also returns the values immediately, for
# the few call sites that need a number right now (the "RESOURCE at
# detection of X" log line, per-program ramAtDetect/cpuAtDetect).
function Write-SharedResourceSample($metricStats = $null) {
    $os = Get-CimInstance Win32_OperatingSystem
    $totalMB = [math]::Round($os.TotalVisibleMemorySize/1024, 0)
    $freeMB = [math]::Round($os.FreePhysicalMemory/1024, 0)
    $usedPct = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 1)
    $topProcs = Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Name)=$([math]::Round($_.WorkingSet/1MB,0))MB" }
    $topStr = $topProcs -join ", "
    $sensorDump = ""
    $trimmed = $null
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8085/data.json" -TimeoutSec 5 -ErrorAction Stop
        $flat = Get-SensorFlat $response
        $trimmed = $flat | ForEach-Object { $_ -replace '^[^>]+>[^>]+>', '' }
        $sensorDump = ($trimmed -join " || ")
    } catch {
        $sensorDump = "[LibreHardwareMonitor web server not reachable - check Options > Remote Web Server > Run is enabled]"
    }
    # Same fix as resource_watcher.ps1, kept consistent - Ryan's direct
    # request 2026-07-15: read CPU% from the LHM data already fetched
    # above instead of a separate ~1.1-second WMI call. Both scripts write
    # into the same shared table now, so both need to measure CPU the same
    # way or the table would silently mix two slightly different
    # methodologies depending on which script wrote a given line.
    $cpuLine = if ($trimmed) { $trimmed | Where-Object { $_ -match 'Load>CPU Total=([\d.]+)' } | Select-Object -First 1 } else { $null }
    $cpu = if ($cpuLine -and $cpuLine -match 'Load>CPU Total=([\d.]+)') { [double]$matches[1] } else { (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average }
    $now = Get-Date
    Add-Content -Path $sharedResourceLog -Value "$($now.ToString('HH:mm:ss.fff')) RAM:${freeMB}MB-free/${totalMB}MB-total(${usedPct}%used) CPU:${cpu}% TOP5:[$topStr] SENSORS:[$sensorDump]" -Encoding utf8

    $tempC = $null
    $tempLine = ($sensorDump -split ' \|\| ') | Where-Object { $_ -match 'CPU Package.*=(.+?)\s*°?C' } | Select-Object -First 1
    if ($tempLine -and $tempLine -match '=\s*([\d.]+)') { $tempC = [double]$matches[1] }

    # Feed every individual sensor reading from this sample into the
    # running min/max/sum/sumSq accumulators (Update-MetricStats), plus
    # RAM% and CPU% themselves since those are computed here, not part of
    # the raw LHM dump. This is what lets a full session end with min/max/
    # avg/stddev for literally everything the hardware monitor exposed,
    # without ever storing the per-second readings themselves anywhere.
    if ($metricStats -and $trimmed) {
        foreach ($line in $trimmed) {
            $eq = $line.LastIndexOf('=')
            if ($eq -lt 1) { continue }
            $rawPath = $line.Substring(0, $eq)
            $valueStr = $line.Substring($eq + 1)
            $numMatch = [regex]::Match($valueStr, '^-?[\d.]+')
            if (-not $numMatch.Success) { continue }
            $value = [double]$numMatch.Value
            $identity = Get-MetricIdentity $rawPath
            Update-MetricStats $metricStats $identity $value
        }
        Update-MetricStats $metricStats ([PSCustomObject]@{ component = 'RAM'; title = 'System Memory'; metricName = 'Used %'; category = 'Load' }) $usedPct
        Update-MetricStats $metricStats ([PSCustomObject]@{ component = 'CPU'; title = 'CPU Total'; metricName = 'Total Load %'; category = 'Load' }) $cpu
    }

    return [PSCustomObject]@{ time = $now; ramPct = $usedPct; cpuPct = $cpu; tempC = $tempC }
}

# Reads the shared table (not an in-memory list App Behavior kept itself)
# for every line - from either script - falling inside [$startTime,
# $endTime], and parses each into the same shape the summary logic below
# already expects. This is the one and only place resource history for
# the summary comes from.
function Get-SharedResourceSamplesInWindow($startTime, $endTime) {
    $samples = New-Object System.Collections.Generic.List[object]
    if (-not (Test-Path $sharedResourceLog)) { return $samples }
    $lines = Get-Content -Path $sharedResourceLog -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        if ($line -notmatch '^(\d{2}):(\d{2}):(\d{2})\.(\d+)\s+RAM:') { continue }
        $lineTime = Get-Date -Hour $matches[1] -Minute $matches[2] -Second $matches[3] -Millisecond ([int]$matches[4].Substring(0,[Math]::Min(3,$matches[4].Length)).PadRight(3,'0')) -Year $startTime.Year -Month $startTime.Month -Day $startTime.Day
        # A session that crosses midnight would make lineTime look earlier
        # than startTime by a full day - shift it forward a day in that one
        # edge case rather than silently dropping real data.
        if ($lineTime -lt $startTime.Date) { $lineTime = $lineTime.AddDays(1) }
        if ($lineTime -lt $startTime -or $lineTime -gt $endTime) { continue }

        $ramMatch = $line -match '\((\d+\.?\d*)%used\)'; $ramPct = if ($ramMatch) { [double]$matches[1] } else { $null }
        $cpuMatch = $line -match 'CPU:(\d+\.?\d*)%'; $cpuPct = if ($cpuMatch) { [double]$matches[1] } else { $null }
        $sensors = @{}
        $tempC = $null
        if ($line -match 'SENSORS:\[(.*)\]$') {
            foreach ($entry in ($matches[1] -split ' \|\| ')) {
                $eq = $entry.IndexOf('=')
                if ($eq -lt 0) { continue }
                $path = $entry.Substring(0, $eq)
                $valStr = $entry.Substring($eq + 1)
                if ($valStr -match '([\-\d.]+)') { $sensors[$path] = [double]$matches[1] }
            }
            $tempLine = ($matches[1] -split ' \|\| ') | Where-Object { $_ -match 'CPU Package.*=(.+?)\s*°?C' } | Select-Object -First 1
            if ($tempLine -and $tempLine -match '=\s*([\d.]+)') { $tempC = [double]$matches[1] }
        }
        if ($ramPct -ne $null -or $cpuPct -ne $null) {
            $samples.Add([PSCustomObject]@{ time = $lineTime; ramPct = $ramPct; cpuPct = $cpuPct; tempC = $tempC; sensors = $sensors })
        }
    }
    return $samples
}

$sessionStartTime = Get-Date
$startSnapshot = Write-SharedResourceSample
Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') RESOURCE (session start) RAM:$($startSnapshot.ramPct)% CPU:$($startSnapshot.cpuPct)%$(if ($startSnapshot.tempC) { " CPU-Temp:$($startSnapshot.tempC)C" })" -Encoding utf8

if ($autoDetect) {
    Write-Host "Amit App Behavior Watcher in auto-detect mode. Go open the program you want to check now - it'll be picked up automatically."
} else {
    Write-Host "Amit App Behavior Watcher running against '$TargetProcess'. Go use the app now."
}
Write-Host "Log: $out"
Write-Host "Stop with: New-Item `"$stopFlag`" -ItemType File   (or Ctrl+C)"

$connCounts = @{}
$everSeenRunning = $false
$goneWarned = $false
# Which new process actually launched which - Ryan's direct request
# 2026-07-14: seeing "Claude started, conhost started, PowerShell started"
# as unrelated flat lines doesn't say what's really happening, when in
# fact PowerShell and conhost are children Claude itself spawned. Parent
# PID is cheap to look up once at detection time and turns a flat list
# into an actual cause-and-effect story in the summary.
$detectedProcs = New-Object System.Collections.Generic.List[object]
# Grouped by which real program is "in play" when something else appears,
# not literal OS parent-PID lineage - Ryan's direct request 2026-07-15,
# after watching Claude open in VS Code and seeing conhost/OpenConsole/
# PowerShell/SearchProtocolHost all detected within a few seconds of it:
# "the subsequent ones are because of the primary program that was
# opened." The literal process tree doesn't always reflect that (VS Code's
# own launch chain doesn't make conhost a child of claude.exe), but the
# real-world cause is still Claude. Each REAL (non-known-Windows) program
# detected starts a new "burst" - everything detected after it, until the
# next real program appears, gets attributed to it. Each real target also
# gets its own resource snapshot the instant it's detected, and its own
# tracked duration (first detected -> last seen still running), so
# multiple real programs in one session (Claude the whole time, Chrome
# only briefly) are reported separately instead of flattened together.
$realTargetSessions = New-Object System.Collections.Generic.List[object]
$burstMembers = @{}
$currentBurst = $null
# Tallies for the full-picture summary at the end - not just resources.
# Ryan's direct request 2026-07-14: the summary should describe everything
# the session actually captured (network, files, process activity), not
# just temperature/RAM/CPU, and say plainly when nothing happened at all
# rather than always finding something to report.
$externalHosts = New-Object System.Collections.Generic.HashSet[string]
$localHosts = New-Object System.Collections.Generic.HashSet[string]
$flaggedConnCount = 0
$flaggedFileCount = 0
$plainFileCount = 0

# Hard ceiling so a watcher can never run forever, regardless of what
# happens to the browser tab - Ryan's direct request 2026-07-14. A
# reliable "the tab actually closed" signal doesn't exist in browsers (the
# same event fires identically on a plain page refresh - already learned
# the hard way for the main tracker), so this is the real backstop:
# same 8-hour ceiling resource_watcher.ps1 already uses for the same
# reason, rather than trying to detect tab closure directly.
$deadline = (Get-Date).AddHours(8)

# Direct proof for next time, not another after-the-fact guess - Ryan's
# correction 2026-07-15: a session ran for ~3 minutes past Stop being
# clicked, actively producing new data the whole time, which doesn't match
# a loop that checks the stop flag every 5-9 seconds. Two real possible
# causes exist (a second watcher instance nobody noticed launching, or the
# flag genuinely not being seen) and there wasn't hard evidence to tell
# which one actually happened. This records both directly: own PID/start
# time, whether another instance of this same script was already running
# at launch, and - at the bottom of the loop - the exact reason and
# moment it actually exited.
# The file-write scan below recurses LOCALAPPDATA/APPDATA/TEMP/Documents
# every pass - genuinely expensive disk I/O (thousands of subfolders in
# LOCALAPPDATA alone), confirmed live 2026-07-15 as the actual cause of
# multi-second-to-30-second stalls once resource sampling was made
# unconditional every 1s. Resource sampling stays every pass (cheap);
# this scan is throttled to its own slower cadence so it can never block
# the fast timeline the way it was.
$fileScanIntervalSec = 5
$lastFileScanTime = [datetime]::MinValue
# Get-NetTCPConnection is a known-slow cmdlet on Windows - called once per
# watched PID, unthrottled, it was the remaining cause of multi-second
# stalls even after the file-scan throttle (confirmed live 2026-07-15:
# stalls got worse, not better, after that fix alone - this was still
# running every single 1s pass for every PID in $pids). Same throttle
# pattern as the file scan, its own cadence, decoupled from resource
# sampling.
$netScanIntervalSec = 3
$lastNetScanTime = [datetime]::MinValue

# Every distinct (component, title, metric, category) key seen this
# session gets one running accumulator here - updated every sample by
# Write-SharedResourceSample, reduced to min/max/avg/stddev/count once at
# session-end via Get-FinalMetricRows. Nothing per-second is ever kept.
$metricStats = @{}
$metricsOutFile = "$env:TEMP\app_behavior_metrics.json"
Remove-Item $metricsOutFile -ErrorAction SilentlyContinue

Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WATCHER PID=$PID started." -Encoding utf8
try {
    $others = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -match 'app_behavior_watcher\.ps1' }
    if ($others) {
        Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WARNING: another app_behavior_watcher.ps1 instance is already running (PID $($others.ProcessId -join ', ')) - two watchers may now be active simultaneously." -Encoding utf8
    }
} catch {}

while (-not (Test-Path $stopFlag) -and (Get-Date) -lt $deadline) {
    # Moved to the very top of the loop, before anything that can
    # `continue` past it - Ryan caught this live 2026-07-15: a 57-second
    # session produced exactly ONE resource line, not ~57, because this
    # check used to sit near the bottom of the loop body, after several
    # early-exit `continue` statements (nothing detected yet, nothing
    # currently alive) that skip everything below them. Sampling here
    # first means nothing can ever prevent it from firing every pass.
    Write-SharedResourceSample $metricStats | Out-Null

    # One process-table snapshot per pass, reused below for autodetect,
    # building $pids, and the liveness check - previously each of those
    # three did its own separate Get-Process call (the autodetect scan plus
    # one Get-Process -Name per watched name plus another per tracked
    # session), which multiplied into real cost as $watchedNames grew over
    # a session. Confirmed live 2026-07-15: even with the file-scan and
    # network-scan throttles both in place, direct HTTP polling still
    # showed 8+ second freezes - this redundant process enumeration was
    # the remaining cause, worst in autodetect mode where $watchedNames
    # keeps growing.
    $allProcs = @(Get-Process)

    if ($autoDetect) {
        # Any process alive right now that wasn't in the baseline snapshot is
        # something the user just launched - adopt its name automatically.
        # Everything with that same name (the app could have more than one
        # process, e.g. a helper/updater) gets watched from here on, exactly
        # like manually naming it would have.
        foreach ($p in $allProcs) {
            if (-not $baselinePidSet.Contains($p.Id) -and -not $watchedNames.Contains($p.ProcessName)) {
                [void]$watchedNames.Add($p.ProcessName)
                $parentPid = $null
                $cmdLine = $null
                try {
                    $wp = Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)" -ErrorAction Stop
                    $parentPid = $wp.ParentProcessId
                    $cmdLine = $wp.CommandLine
                } catch {}
                # Common Windows helper processes tagged as expected/background
                # so they don't read as equally significant as the actual
                # program being tested - Ryan's direct request 2026-07-14,
                # matching the "context tags" idea from the Copilot review he
                # brought back (Session 2026-07-14): a bare flat list of
                # dllhost/conhost/svchost alongside the real target buries the
                # one detection that actually matters.
                # StoreDesktopExtension added 2026-07-15 - caught live posing
                # as the session's headline "you launched this" item when it
                # was just Microsoft Store background activity unrelated to
                # anything Ryan actually opened.
                $isKnownWindows = $p.ProcessName -in @('dllhost','conhost','svchost','SearchProtocolHost','SearchFilterHost','SearchIndexer','FileCoAuth','RuntimeBroker','ApplicationFrameHost','TextInputHost','WmiPrvSE','backgroundTaskHost','SecurityHealthService','StoreDesktopExtension','WerFault','WerFaultSecure','SgrmBroker','MoUsoCoreWorker','UsoClient')
                $detectedProcs.Add([PSCustomObject]@{ name = $p.ProcessName; pid_ = $p.Id; parentPid = $parentPid; cmdLine = $cmdLine; isKnownWindows = $isKnownWindows; time = Get-Date })
                $tagStr = if ($isKnownWindows) { " [expected Windows background process]" } else { "" }

                if (-not $isKnownWindows) {
                    # A new real program - starts a new burst. No longer
                    # taking a special immediate snapshot here - Ryan's
                    # direct request 2026-07-15: now that the regular
                    # interval samples every 1 second (down from 10, made
                    # possible by the CPU-read speedup), any detection is
                    # already within a second of a real sample in the
                    # shared table - a dedicated extra one is redundant
                    # complexity that a fast, dense timeline replaces.
                    # ramAtDetect/cpuAtDetect get filled in later from the
                    # shared table's nearest sample, not a live query here.
                    $currentBurst = $p.ProcessName
                    $now = Get-Date
                    $realTargetSessions.Add([PSCustomObject]@{ name = $p.ProcessName; detectedTime = $now; lastSeenTime = $now; ramAtDetect = $null; cpuAtDetect = $null; closed = $false })
                } elseif ($currentBurst) {
                    if (-not $burstMembers.ContainsKey($currentBurst)) { $burstMembers[$currentBurst] = New-Object System.Collections.Generic.List[string] }
                    $burstMembers[$currentBurst].Add($p.ProcessName)
                }

                Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') DETECTED new program: '$($p.ProcessName)' (PID=$($p.Id))$tagStr - now watching it." -Encoding utf8
            }
        }
        if ($watchedNames.Count -eq 0) {
            Start-Sleep -Seconds 1
            continue
        }
    }

    $pids = @($allProcs | Where-Object { $watchedNames.Contains($_.ProcessName) } | Select-Object -ExpandProperty Id)
    # Keep each real target's own "still running" clock updated, AND log
    # the exact moment one closes - Ryan's direct request 2026-07-15: he
    # closed Chrome mid-session (Claude/VS Code stayed open) and saw
    # nothing in the log marking that. The existing "watched program is no
    # longer running" warning only ever fired when EVERYTHING watched was
    # gone at once, not when one specific program closes while others are
    # still active - a real, separate gap from that one.
    $aliveNames = [System.Collections.Generic.HashSet[string]]::new([string[]]($allProcs | Select-Object -ExpandProperty ProcessName -Unique))
    foreach ($rt in $realTargetSessions) {
        if ($aliveNames.Contains($rt.name)) {
            $rt.lastSeenTime = Get-Date
        } elseif (-not $rt.closed) {
            $rt.closed = $true
            $dur = $rt.lastSeenTime - $rt.detectedTime
            $durStr = if ($dur.TotalMinutes -ge 1) { "{0:N1} minutes" -f $dur.TotalMinutes } else { "{0:N0} seconds" -f [math]::Max(0, $dur.TotalSeconds) }
            Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') CLOSED: '$($rt.name)' is no longer running - it was open for $durStr." -Encoding utf8
        }
    }
    if ($pids.Count -eq 0) {
        # Distinguish "quietly not doing anything" from "it closed or
        # crashed" - Ryan's direct request 2026-07-14: a session that ends
        # with an empty log reads the same whether the program behaved or
        # the watcher lost it, and those are very different things worth
        # knowing. Only fires once per disappearance, not every 3-second
        # loop, so it doesn't spam the log while waiting for auto-detect.
        if ($everSeenRunning -and -not $goneWarned) {
            Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WARNING: watched program ($($watchedNames -join ', ')) is no longer running - it may have closed normally or crashed. Still watching in case it restarts." -Encoding utf8
            $goneWarned = $true
        }
        Start-Sleep -Seconds 1
        continue
    }
    $everSeenRunning = $true
    $goneWarned = $false

    # --- Network connections, exactly attributed to the target process ---
    # Throttled - Get-NetTCPConnection is a known-slow Windows cmdlet, and
    # was being called once per watched PID every single 1s pass. This was
    # the actual remaining cause of stalls even after the file-scan
    # throttle alone (confirmed live 2026-07-15: stalls got worse, not
    # better, when only the file scan was throttled).
    if (((Get-Date) - $lastNetScanTime).TotalSeconds -ge $netScanIntervalSec) {
        $lastNetScanTime = Get-Date
        foreach ($p in $pids) {
            $conns = Get-NetTCPConnection -OwningProcess $p -State Established -ErrorAction SilentlyContinue
            foreach ($c in $conns) {
                $key = "$p-$($c.RemoteAddress)-$($c.RemotePort)"
                if (-not $seenConnections.ContainsKey($key)) {
                    $seenConnections[$key] = $true
                    $hostname = Resolve-RemoteHost $c.RemoteAddress
                    $isPrivate = $c.RemoteAddress -match '^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)'
                    $tag = if ($isPrivate) { "[local network]" } else { "[external]" }
                    if ($isPrivate) { [void]$localHosts.Add($c.RemoteAddress) } else { [void]$externalHosts.Add($(if ($hostname -and $hostname -ne '(no reverse DNS)') { $hostname } else { $c.RemoteAddress })) }
                    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') NETWORK $tag PID=$p -> $($c.RemoteAddress):$($c.RemotePort) ($hostname)" -Encoding utf8
                }
                $connCounts[$key] = ($connCounts[$key] + 1)
                if ($connCounts[$key] -eq 20) {
                    $flaggedConnCount++
                    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') NETWORK FLAG: repeated/sustained connection to $($c.RemoteAddress):$($c.RemotePort) from PID=$p - possible beaconing or streaming, worth a closer look if unexpected" -Encoding utf8
                }
            }
        }
    }

    # --- File writes, correlated in time (not proven causation) ---
    # Throttled separately from resource sampling above - recursing
    # LOCALAPPDATA/APPDATA/TEMP/Documents every single pass was the real
    # cause of the multi-second-to-30-second stalls Ryan caught live
    # 2026-07-15. This scan doesn't need sub-second precision; it only
    # needs to run often enough to catch writes within its own 6-second
    # lookback window below.
    if (((Get-Date) - $lastFileScanTime).TotalSeconds -ge $fileScanIntervalSec) {
        $lastFileScanTime = Get-Date
        foreach ($base in $watchPaths) {
            if (-not (Test-Path $base)) { continue }
            try {
                $recent = Get-ChildItem -Path $base -File -ErrorAction SilentlyContinue -Recurse -Depth 1 |
                    Where-Object { $_.LastWriteTime -gt (Get-Date).AddSeconds(-6) -and $_.FullName -ne $out -and $_.FullName -ne $stopFlag }
                foreach ($f in $recent) {
                    if ($knownFiles.ContainsKey($f.FullName) -and $knownFiles[$f.FullName] -eq $f.LastWriteTime) { continue }
                    $knownFiles[$f.FullName] = $f.LastWriteTime

                    $sizeKB = [math]::Round($f.Length / 1KB, 1)
                    $isExec = $f.Extension -match '\.(exe|dll|scr|bat|ps1|vbs|cmd)$'
                    $flags = @()
                    if (Test-IsStartupPath $f.FullName) { $flags += "PERSISTENCE-LOCATION(Startup folder)" }
                    if ($isExec) { $flags += "EXECUTABLE" }
                    $flagStr = if ($flags.Count -gt 0) { " FLAGS:[$($flags -join ',')]" } else { "" }
                    if ($flags.Count -gt 0) { $flaggedFileCount++ } else { $plainFileCount++ }

                    $hashStr = ""
                    if ($isExec -or $flags.Count -gt 0) {
                        try {
                            $hash = (Get-FileHash -Path $f.FullName -Algorithm SHA256 -ErrorAction Stop).Hash
                            $verdict = Get-VTVerdict $hash
                            $hashStr = " SHA256=$hash VERDICT=$verdict"
                        } catch {}
                    }

                    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') FILEWRITE (correlated, not proven) $($f.FullName) size=${sizeKB}KB$flagStr$hashStr" -Encoding utf8
                }
            } catch {
                # Previously swallowed silently - Ryan's direct request
                # 2026-07-14: a real error here (permissions, a locked file, a
                # path that vanished mid-scan) looked identical to "nothing
                # happened," when it actually means part of the watch failed.
                Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WARNING: file-write scan failed for $base - $($_.Exception.Message)" -Encoding utf8
            }
        }
    }

    Start-Sleep -Seconds 1
}

$exitReason = if (Test-Path $stopFlag) { "stop flag detected" } else { "8-hour deadline reached" }
Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WATCHER PID=$PID exiting main loop - reason: $exitReason." -Encoding utf8

# Reduce the whole session's running accumulators to final min/max/avg/
# stddev/count rows and write them out as JSON - the dashboard picks this
# up via the bridge server right after the session's History report gets
# saved, and bulk-inserts it into amit_device_session_metrics tagged with
# that report's event_id. Written even on an empty session (0 rows) so the
# dashboard has a definite answer rather than a missing file to guess about.
try {
    $finalRows = @(Get-FinalMetricRows $metricStats)
    # -AsArray isn't available on Windows PowerShell 5.1's ConvertTo-Json
    # (added in PS 6.2+) - without it, 0 rows serializes as "null" and
    # exactly 1 row serializes as a bare object instead of a one-item
    # array, both of which would break the dashboard's d.rows.map() on the
    # receiving end. Handled explicitly for all three cases instead.
    if ($finalRows.Count -eq 0) {
        $rowsJson = "[]"
    } elseif ($finalRows.Count -eq 1) {
        $rowsJson = "[" + ($finalRows[0] | ConvertTo-Json -Depth 3 -Compress) + "]"
    } else {
        $rowsJson = $finalRows | ConvertTo-Json -Depth 3
    }
    # sessionEndTime added for parity with resource_watcher.ps1 - Ryan's
    # direct request 2026-07-16: the dashboard's reconciliation check
    # needs the same timestamp field from both tracker types to know
    # whether a given local summary has already reached Supabase.
    $sessionEndTime = (Get-Date).ToUniversalTime().ToString("o")
    $payload = '{"sessionEndTime":"' + $sessionEndTime + '","rows":' + $rowsJson + '}'
    $payload | Out-File -FilePath $metricsOutFile -Encoding utf8
    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') Wrote $($finalRows.Count) aggregated metric rows to $metricsOutFile." -Encoding utf8
} catch {
    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WARNING: failed to write aggregated metrics - $($_.Exception.Message)" -Encoding utf8
}
$watchedList = if ($watchedNames.Count -gt 0) { ($watchedNames -join ', ') } else { "(nothing detected)" }
Add-Content -Path $out -Value "" -Encoding utf8

# --- Plain-language session summary ---
# Cheap and safe - no external calls - computed and written FIRST, before
# any of the riskier analysis below (WMI/CIM re-snapshot, hardware sweep
# math, the Event Log background job). Real bug caught live 2026-07-15:
# several completed sessions had NO "SESSION SUMMARY" line at all and the
# dashboard fell back to "unknown duration" - something inside the old
# unguarded block below was throwing and killing the script before it
# ever got here. Now the basic completion record + duration is guaranteed
# regardless of what happens in the richer analysis that follows.
$elapsed = (Get-Date) - $sessionStartTime
$elapsedStr = if ($elapsed.TotalMinutes -ge 1) {
    "{0} minute{1}" -f [math]::Round($elapsed.TotalMinutes, 1), $(if ([math]::Round($elapsed.TotalMinutes,1) -eq 1) { "" } else { "s" })
} else {
    "{0} second{1}" -f [math]::Round($elapsed.TotalSeconds, 0), $(if ([math]::Round($elapsed.TotalSeconds,0) -eq 1) { "" } else { "s" })
}
Add-Content -Path $out -Value "SESSION SUMMARY - watched '$watchedList' for $elapsedStr" -Encoding utf8

try {
$endSnapshot = Write-SharedResourceSample
# The summary is built from the ONE shared table, for the whole session
# window, not from a separately-kept list - covers both App Behavior's own
# supplemental writes above AND resource_watcher.ps1's regular 30-second
# ticks that happened to land during this session, all in one place.
$resourceSamples = Get-SharedResourceSamplesInWindow $sessionStartTime (Get-Date)
if ($resourceSamples.Count -eq 0) { $resourceSamples.Add($startSnapshot); $resourceSamples.Add($endSnapshot) }

# Fill in each real program's "resources at the moment it was detected"
# from the nearest shared-table sample, now that there's no dedicated
# live snapshot taken at detection time anymore - with 1-second sampling
# density, the nearest sample is never more than ~1 second off from the
# real moment.
if ($resourceSamples.Count -gt 0) {
    foreach ($rt in $realTargetSessions) {
        $nearest = $resourceSamples | Sort-Object { [math]::Abs(($_.time - $rt.detectedTime).TotalSeconds) } | Select-Object -First 1
        if ($nearest) { $rt.ramAtDetect = $nearest.ramPct; $rt.cpuAtDetect = $nearest.cpuPct }
    }
}

$ramPeak = ($resourceSamples | Measure-Object -Property ramPct -Maximum).Maximum
$cpuPeak = ($resourceSamples | Measure-Object -Property cpuPct -Maximum).Maximum
$tempSamples = $resourceSamples | Where-Object { $null -ne $_.tempC }
$tempPeak = if ($tempSamples) { ($tempSamples | Measure-Object -Property tempC -Maximum).Maximum } else { $null }

# Same RAM 70/90 and CPU 60/85 thresholds already shown on the live
# Resources/Diagnostics cards, so "elevated" and "abnormal" mean the exact
# same thing here that they do everywhere else in the app. Returns $null
# for a genuinely flat, unremarkable metric instead of a sentence, so the
# summary can fold every boring metric into one line ("everything else
# performed normally") rather than listing each one that didn't move -
# Ryan's direct request 2026-07-14.
function Format-MetricSummary($name, $start, $end, $peak, $warnThreshold, $abnormalThreshold, $unit) {
    $moved = ($end -gt $start + 2) -or ($end -lt $start - 2)
    $notable = $moved -or ($peak -ge $warnThreshold)
    if (-not $notable) { return $null }
    $direction = if ($end -gt $start + 2) { "rose" } elseif ($end -lt $start - 2) { "dropped" } else { "stayed roughly steady" }
    $peakNote = if ($peak -ge $abnormalThreshold) {
        "peaked at $peak$unit, which is above the normal range"
    } else {
        "peaked at $peak$unit - a bit elevated, but within normal boundaries"
    }
    return "$name $direction (started at $start$unit, ended at $end$unit) and $peakNote."
}

$summaryLines = @()
$flatMetricNames = @()
$ramLine = Format-MetricSummary "RAM usage" $startSnapshot.ramPct $endSnapshot.ramPct $ramPeak 70 90 "%"
if ($ramLine) { $summaryLines += $ramLine } else { $flatMetricNames += "RAM" }
$cpuLine = Format-MetricSummary "CPU usage" $startSnapshot.cpuPct $endSnapshot.cpuPct $cpuPeak 60 85 "%"
if ($cpuLine) { $summaryLines += $cpuLine } else { $flatMetricNames += "CPU" }
if ($tempPeak) {
    $tempLine = Format-MetricSummary "CPU temperature" $startSnapshot.tempC $endSnapshot.tempC $tempPeak 75 90 "C"
    if ($tempLine) { $summaryLines += $tempLine } else { $flatMetricNames += "temperature" }
} else {
    $summaryLines += "CPU temperature - not available this session (LibreHardwareMonitor's web server wasn't reachable)."
}
if ($flatMetricNames.Count -gt 0) {
    $summaryLines += "$($flatMetricNames -join ', ') performed normally throughout - no meaningful change."
}

# --- Full hardware sweep, one paragraph per component - Ryan's direct
# request 2026-07-14: "make each one of these sections like a separate
# paragraph... CPU and a discussion on the CPU including usage and
# temperature... then GPU." Bucketed by the DEVICE name LibreHardwareMonitor
# reports (the first segment of each sensor's path - e.g. "Intel Core
# i7-...", "NVIDIA GeForce RTX...", "Generic Memory"), not just sensor type,
# so usage and temperature for the same component land in the same
# paragraph instead of being scattered across a flat list. A component with
# no sensors reported this session (e.g. no discrete GPU) simply gets no
# paragraph, rather than a hardcoded section claiming to cover hardware
# that isn't there.
$sensorPaths = New-Object System.Collections.Generic.HashSet[string]
foreach ($s in $resourceSamples) { foreach ($k in $s.sensors.Keys) { [void]$sensorPaths.Add($k) } }
$categories = [ordered]@{ CPU = @(); GPU = @(); RAM = @(); Storage = @(); Other = @() }
$criticalHw = @()
foreach ($path in $sensorPaths) {
    $vals = $resourceSamples | Where-Object { $_.sensors.ContainsKey($path) } | ForEach-Object { $_.sensors[$path] }
    if (-not $vals -or $vals.Count -lt 2) { continue }
    $start = $vals[0]; $end = $vals[-1]; $peak = ($vals | Measure-Object -Maximum).Maximum
    $device = ($path -split '>')[0]
    $label = ($path -split '>')[-1]
    $isTemp = $path -match 'Temperature'
    $isFan = $path -match 'Fan'
    $isVoltage = $path -match 'Voltage'
    $isLoad = $path -match 'Load'
    $isPower = $path -match 'Power'
    $unit = if ($isTemp) { "C" } elseif ($isFan) { " RPM" } elseif ($isVoltage) { "V" } elseif ($isLoad) { "%" } elseif ($isPower) { "W" } else { "" }

    $category = if ($device -match 'CPU|Core i\d|Ryzen|Threadripper') { 'CPU' }
        elseif ($device -match 'GPU|NVIDIA|GeForce|Radeon|RTX|RX \d') { 'GPU' }
        elseif ($device -match 'Memory|RAM') { 'RAM' }
        elseif ($device -match 'SSD|HDD|NVMe|Disk|WD |Samsung|Crucial|Kingston|Seagate') { 'Storage' }
        else { 'Other' }

    if ($isTemp -and $peak -ge 95) {
        $criticalHw += "CRITICAL: $device $label reached $peak°C during this session - that's a genuinely high temperature, worth checking cooling/airflow if this wasn't an intentional stress test."
    } elseif ($isTemp -and $peak -ge 85) {
        $criticalHw += "$device $label peaked at $peak°C - elevated, not yet critical, but worth watching."
    }

    $moved = [math]::Abs($end - $start) -gt ([math]::Max(1, [math]::Abs($start) * 0.08))
    $categories[$category] += [PSCustomObject]@{ label = $label; start = $start; end = $end; peak = $peak; unit = $unit; moved = $moved; isTemp = $isTemp; isLoad = $isLoad }
}

foreach ($catName in $categories.Keys) {
    $items = $categories[$catName]
    if ($items.Count -eq 0) { continue }
    $moving = $items | Where-Object { $_.moved }
    $flatCount = $items.Count - $moving.Count
    if ($moving.Count -eq 0) {
        $summaryLines += "$($catName): performed normally throughout - no meaningful change across $($items.Count) sensor(s)."
        continue
    }
    $bits = $moving | ForEach-Object {
        $direction = if ($_.end -gt $_.start) { "rose" } else { "dropped" }
        "$($_.label) $direction from $($_.start)$($_.unit) to $($_.end)$($_.unit) (peak $($_.peak)$($_.unit))"
    }
    $line = "$($catName): " + ($bits -join '; ') + "."
    if ($flatCount -gt 0) { $line += " ($flatCount other sensor(s) in this component stayed steady.)" }
    $summaryLines += $line
}
foreach ($c in $criticalHw) { $summaryLines += $c }

# --- Network and file activity, in the same plain language ---
$netLine = if ($externalHosts.Count -eq 0 -and $localHosts.Count -eq 0) {
    "No network connections were made during this session."
} else {
    $bits = @()
    if ($externalHosts.Count -gt 0) { $bits += "connected to $($externalHosts.Count) external service(s) ($($($externalHosts | Select-Object -First 5) -join ', ')$(if ($externalHosts.Count -gt 5) { ', ...' }))" }
    if ($localHosts.Count -gt 0) { $bits += "$($localHosts.Count) local network address(es)" }
    ($bits -join ' and ') + "." + $(if ($flaggedConnCount -gt 0) { " $flaggedConnCount connection(s) were flagged as unusually sustained - worth a closer look if that's not expected for this program." } else { "" })
}
$summaryLines += $netLine

$fileLine = if ($knownFiles.Count -eq 0) {
    "No files were written during this session."
} else {
    "Wrote $($knownFiles.Count) file(s) to disk$(if ($flaggedFileCount -gt 0) { " ($flaggedFileCount flagged as worth a closer look - see FILEWRITE lines above for detail)" } else { ", nothing flagged as concerning" })."
}
$summaryLines += $fileLine

# Windows' own error/warning log for the exact session window - catches
# real system-level trouble (driver faults, crashes, service failures) that
# resource numbers alone wouldn't show. Ryan's direct request 2026-07-14:
# "an air check before it ran and then another air check by the Windows
# log after it ran."
$eventWarning = ""
try {
    # Get-WinEvent on a large/fragmented System log can genuinely take a long
    # time even for a narrow time window - confirmed live 2026-07-14: this
    # single call was the reason "Stop" appeared hung for a long stretch,
    # with no feedback while it ran. Bounded on a background job with a
    # hard 8-second cap so a slow log can never hold up the rest of the
    # session summary - worst case, this one check is silently skipped.
    $job = Start-Job -ScriptBlock {
        param($start, $end)
        Get-WinEvent -FilterHashtable @{ LogName = 'System'; Level = 1,2,3; StartTime = $start; EndTime = $end } -MaxEvents 50 -ErrorAction SilentlyContinue |
            Select-Object ProviderName, Message
    } -ArgumentList $sessionStartTime, (Get-Date)
    $done = Wait-Job -Job $job -Timeout 8
    if ($done) {
        $winEvents = Receive-Job -Job $job
        if ($winEvents -and $winEvents.Count -gt 0) {
            $eventSummaries = $winEvents | Select-Object -First 5 | ForEach-Object {
                $msg = ($_.Message -replace "`r`n", ' ').Trim()
                if ($msg.Length -gt 100) { $msg = $msg.Substring(0, 100) + '...' }
                "[$($_.ProviderName)] $msg"
            }
            $eventWarning = "WARNING: $($winEvents.Count) system error/warning event(s) were logged in Windows during this session - worth a look: " + ($eventSummaries -join ' || ')
        }
    }
    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
} catch {}

# Story built from the time-burst grouping tracked live during the loop
# (not literal OS parent-PID lineage - Ryan's direct request 2026-07-15;
# see $realTargetSessions/$burstMembers setup above for why). Each real
# program gets its own sentence with its own tracked duration, so "Claude
# ran the whole session, Chrome only ran briefly" reports as two distinct
# facts instead of one flattened list.
$storyLine = ""
if ($realTargetSessions.Count -gt 0) {
    $parts = foreach ($rt in $realTargetSessions) {
        $dur = $rt.lastSeenTime - $rt.detectedTime
        $durStr = if ($dur.TotalMinutes -ge 1) { "{0:N1} minutes" -f $dur.TotalMinutes } else { "{0:N0} seconds" -f [math]::Max(0, $dur.TotalSeconds) }
        $children = if ($burstMembers.ContainsKey($rt.name) -and $burstMembers[$rt.name].Count -gt 0) { " (which opened: $($burstMembers[$rt.name] -join ', '))" } else { "" }
        "$($rt.name) ran for $durStr$children"
    }
    $storyLine = $parts -join '. '
}

# One flowing narrative sentence up top, in addition to the structured
# detail below it - Ryan's direct request 2026-07-14, after seeing the
# Copilot review's "session story" example ("User launched FurMark, causing
# expected GPU load... No suspicious network activity"). Built from data
# already computed above, not a separate pass.
$realTargets = $realTargetSessions | ForEach-Object { $_.name }
$narrativeParts = @()
if ($realTargets.Count -gt 0) {
    $narrativeParts += "You launched $($realTargets -join ', ')."
} elseif ($detectedProcs.Count -gt 0) {
    $narrativeParts += "Only background Windows activity was observed - no specific application launch was detected."
}
if ($categories['GPU'].Count -gt 0 -and ($categories['GPU'] | Where-Object { $_.moved }).Count -gt 0) {
    $narrativeParts += "This caused real GPU load."
}
$narrativeParts += $(if ($externalHosts.Count -eq 0 -and $localHosts.Count -eq 0) { "No network activity was observed." } else { "Network activity was observed - see detail below." })

# If truly nothing of note happened anywhere - no new programs, no
# network activity, no file writes, flat resources, no system errors -
# say that plainly in one line instead of padding out a report with
# several sentences that all just restate "normal." Ryan's direct request
# 2026-07-14: "you can say nothing actually was done." (Computed before the
# narrative's closing line below, which needs to know this.)
$anyHwMovement = ($categories.Values | ForEach-Object { $_ } | Where-Object { $_.moved }).Count -gt 0
$nothingHappened = $detectedProcs.Count -eq 0 -and $externalHosts.Count -eq 0 -and $localHosts.Count -eq 0 -and
    $knownFiles.Count -eq 0 -and -not $ramLine -and -not $cpuLine -and $flaggedConnCount -eq 0 -and $flaggedFileCount -eq 0 -and
    -not $eventWarning -and -not $anyHwMovement -and $criticalHw.Count -eq 0

if ($criticalHw.Count -gt 0) {
    $narrativeParts += "A hardware temperature reached a level worth checking - see the critical note below."
} elseif (-not $nothingHappened) {
    $narrativeParts += "Nothing here looks abnormal."
}
$narrativeLine = "STORY: " + ($narrativeParts -join ' ')

if (-not $nothingHappened) { Add-Content -Path $out -Value $narrativeLine -Encoding utf8 }
if ($nothingHappened) {
    Add-Content -Path $out -Value "Nothing changed during the course of this test - no new programs, network activity, or file changes were detected, and resource usage stayed flat the whole time." -Encoding utf8
} else {
    if ($storyLine) { Add-Content -Path $out -Value $storyLine -Encoding utf8 }
    foreach ($line in $summaryLines) { Add-Content -Path $out -Value $line -Encoding utf8 }
    if ($eventWarning) {
        Add-Content -Path $out -Value $eventWarning -Encoding utf8
    } else {
        Add-Content -Path $out -Value "No new system errors or warnings were logged in Windows during this session." -Encoding utf8
    }
}
} catch {
    # The basic "SESSION SUMMARY - watched X for Y" line above already
    # landed regardless - this only means the richer detail (hardware
    # sweep, story, event log check) didn't finish. Recorded honestly
    # instead of silently vanishing the way it did before 2026-07-15.
    Add-Content -Path $out -Value "Detailed analysis did not complete: $($_.Exception.Message)" -Encoding utf8
}

Add-Content -Path $out -Value "" -Encoding utf8
Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') Session stopped. Watched: $watchedList. Summary: $($seenConnections.Count) distinct network connections, $($knownFiles.Count) file writes observed during window." -Encoding utf8
Remove-Item $stopFlag -ErrorAction SilentlyContinue
Write-Host "Stopped. Full report: $out"

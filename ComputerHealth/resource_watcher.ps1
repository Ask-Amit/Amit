# Keeps Windows from sleeping while this tracker is actively running - a
# real gap Ryan raised 2026-07-16: an all-day tracking session would
# otherwise get silently interrupted the moment the machine sleeps. This
# is the same standard Windows mechanism apps like video players use
# (SetThreadExecutionState) so the screen/system doesn't sleep mid-use -
# one call here, and it automatically releases itself the instant this
# script's process exits, so sleep behaves completely normally again the
# moment tracking stops. Does not force the display to stay on, only the
# system itself - the screen can still turn off/lock on its own schedule,
# this only stops the machine from fully sleeping/hibernating and
# suspending this process along with everything else.
try {
    Add-Type -Name Sleep -Namespace Amit -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);' -ErrorAction SilentlyContinue
    [Amit.Sleep]::SetThreadExecutionState(0x80000000 -bor 0x00000001) | Out-Null
} catch {}

$out = "$env:TEMP\resource_watch_result.txt"
$maxLines = 500
# Checked every pass now, alongside the 8-hour deadline - Ryan's direct
# request 2026-07-16: the main tracker previously had no graceful-stop
# mechanism at all, only a hard Stop-Process kill from the bridge server,
# which meant it could never get a chance to write a final session
# summary the way App Behavior already does. Removed at startup so a
# stale flag from a previous run can't immediately stop a fresh one.
$stopFlag = "$env:TEMP\tracker_stop.flag"
Remove-Item $stopFlag -ErrorAction SilentlyContinue
$metricsOutFile = "$env:TEMP\tracker_metrics.json"
# Real gap caught live 2026-07-18 (Ryan, watching the Performance gauge sit
# frozen during an active session): $metricsOutFile above is only ever
# written ONCE, at the very end when this script exits - there was never
# an interim snapshot for a live view to poll while the session is still
# running. This is purely additive - a SEPARATE file, rewritten every loop
# pass from the same running $metricStats accumulators the final write
# already uses, so the dashboard's live gauge has something real to read
# mid-session. Does not touch the final-summary write or its timing at all.
$liveMetricsOutFile = "$env:TEMP\tracker_metrics_live.json"

"Resource watcher started at $(Get-Date -Format 'HH:mm:ss.fff') - RAM, CPU, top memory consumers, and FULL sensor dump (all voltages/temps/fans/power/clocks) - first 3 captures 5 seconds apart, then every 30 seconds" | Out-File -FilePath $out -Encoding utf8

function Get-SensorFlat($node, $path = "") {
    $results = @()
    $currentPath = if ($path) { "$path>$($node.Text)" } else { $node.Text }
    if ($node.Children -is [array] -and $node.Children.Count -gt 0) {
        foreach ($child in $node.Children) {
            $results += Get-SensorFlat $child $currentPath
        }
    } elseif ($node.Value -and $node.Value -ne "") {
        $results += "$currentPath=$($node.Value)"
    }
    return $results
}

# The following four functions are the exact same logic as
# app_behavior_watcher.ps1's copies (component/title/metric/category
# parsing, running min/max/sum/sumSq accumulation, final row reduction) -
# duplicated here rather than shared, since this codebase has no include
# mechanism, but kept byte-for-byte equivalent in behavior so a metrics
# row written by either script means exactly the same thing.
function Get-ComponentCategory($title) {
    $t = $title.ToLower()
    if ($t -match 'ryzen|intel core|celeron|pentium|xeon') { return 'CPU' }
    if ($t -match 'geforce|radeon|nvidia|quadro|rtx|gtx') { return 'GPU' }
    if ($t -match 'ethernet|wi-?fi|wireless|network') { return 'Network' }
    if ($t -match 'asus|msi|gigabyte|asrock|biostar|ms-\d' -and $t -notmatch 'geforce|radeon') { return 'Motherboard' }
    if ($t -eq 'virtual memory') { return 'RAM' }
    if ($t -in @('total memory', 'generic memory', 'physical memory')) { return 'RAM' }
    if ($t -match 'ssd|nvme|hdd|hard disk') { return 'Storage' }
    # Real bug caught live 2026-07-18 (Ryan): Kingston makes both RAM and
    # SSDs, and a Kingston SSD's own model number often doesn't literally
    # contain the word "ssd" (e.g. "KINGSTON SA400S37240G") - so it was
    # falling through to the generic Kingston-brand match below and getting
    # tagged component='RAM', mislabeling real SSD wear/Power-On-Hours data
    # as if it were a RAM stick's. Kingston's actual SSD model-line prefixes
    # (SA400, SUV, SKC, SNV, SHSS, SEDC) are checked first so they route to
    # Storage before the brand-only check below ever runs.
    # Real bug caught live 2026-07-18 (Ryan): a trailing \b after the model
    # prefix never matched, since Kingston concatenates the capacity right
    # onto the model code with no boundary ("SA400S37240G" - digit directly
    # into another letter). Plain substring match, no boundary needed.
    if ($t -match 'kingston.*(sa400|suv|skc|snv|shss|sedc)') { return 'Storage' }
    if ($t -match 'g\.?skill|corsair|crucial|kingston|hyperx|f4-|f5-|ddr\d') { return 'RAM' }
    return 'Other'
}

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

$metricStats = @{}
$deadline = (Get-Date).AddHours(8)
$lineCount = 1
# Fast-start ramp (Ryan's direct request 2026-07-19): the first few captures
# used to be instantaneous - a flat 30-second cadence from the very first
# loop pass meant a freshly-started tracker could sit on "No history
# captured yet" for up to 30 seconds before anything showed up at all.
# First 3 captures are 5 seconds apart (covers the first ~15-20 seconds),
# then settles into the normal 30-second cadence - gets the Hardware tab
# and other history views populated fast without capturing continuously
# at that rate for the whole session.
$captureCount = 0
$fastStartCaptures = 3
$fastStartIntervalSeconds = 5
while ((Get-Date) -lt $deadline -and -not (Test-Path $stopFlag)) {
    $os = Get-CimInstance Win32_OperatingSystem
    $totalMB = [math]::Round($os.TotalVisibleMemorySize/1024, 0)
    $freeMB = [math]::Round($os.FreePhysicalMemory/1024, 0)
    $usedPct = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 1)

    $topProcs = Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Name)=$([math]::Round($_.WorkingSet/1MB,0))MB" }
    $topStr = $topProcs -join ", "

    $sensorDump = ""
    $trimmed = $null
    try {
        # PERMANENT FIX (2026-07-19): reads AmitSensorReader.exe's own output
        # file directly instead of LibreHardwareMonitor's GUI web server -
        # see amit_bridge_server.ps1 for the full story on why that toggle
        # was replaced.
        $sensorDataPath = "$env:TEMP\amit_sensor_data.json"
        if (-not (Test-Path $sensorDataPath)) { throw "sensor data not available yet" }
        $response = Get-Content $sensorDataPath -Raw -ErrorAction Stop | ConvertFrom-Json
        $flat = Get-SensorFlat $response
        # Strip the redundant "Sensor>COMPUTERNAME>" prefix from every entry to keep lines shorter
        $trimmed = $flat | ForEach-Object { $_ -replace '^[^>]+>[^>]+>', '' }
        $sensorDump = ($trimmed -join " || ")
    } catch {
        $sensorDump = "[Sensor data not available - tracker may still be starting or admin approval wasn't granted]"
    }

    # CPU% read from the sensor dump just pulled above, instead of a
    # separate Get-CimInstance Win32_Processor call - measured live
    # 2026-07-15: that WMI call alone takes ~1.1 SECONDS (a known Windows
    # quirk in how that counter is sampled, not a bug here), while this
    # value is already sitting in the LHM data fetched a moment ago,
    # essentially free. Falls back to the slow WMI method only if LHM
    # itself wasn't reachable, so CPU% is never simply missing.
    $cpuLine = if ($trimmed) { $trimmed | Where-Object { $_ -match 'Load>CPU Total=([\d.]+)' } | Select-Object -First 1 } else { $null }
    $cpu = if ($cpuLine -and $cpuLine -match 'Load>CPU Total=([\d.]+)') { [double]$matches[1] } else { (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average }

    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') RAM:${freeMB}MB-free/${totalMB}MB-total(${usedPct}%used) CPU:${cpu}% TOP5:[$topStr] SENSORS:[$sensorDump]" -Encoding utf8
    $lineCount++

    # Same running-tally feed App Behavior does - every sensor reading
    # from this sample folded into the min/max/sum/sumSq accumulators,
    # plus RAM%/CPU% themselves since those are computed here rather than
    # coming straight from the raw sensor dump.
    if ($trimmed) {
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
    }
    Update-MetricStats $metricStats ([PSCustomObject]@{ component = 'RAM'; title = 'System Memory'; metricName = 'Used %'; category = 'Load' }) $usedPct
    Update-MetricStats $metricStats ([PSCustomObject]@{ component = 'CPU'; title = 'CPU Total'; metricName = 'Total Load %'; category = 'Load' }) $cpu

    # Live snapshot, every pass - same reduction the final write uses, just
    # run against the running totals as they stand RIGHT NOW instead of
    # waiting for the session to end. Non-fatal on failure (a live view
    # missing one refresh is not worth interrupting real tracking for).
    try {
        $liveRows = @(Get-FinalMetricRows $metricStats)
        $liveRowsJson = if ($liveRows.Count -eq 0) { "[]" } elseif ($liveRows.Count -eq 1) { "[" + ($liveRows[0] | ConvertTo-Json -Depth 3 -Compress) + "]" } else { $liveRows | ConvertTo-Json -Depth 3 }
        $liveSnapshotTime = (Get-Date).ToUniversalTime().ToString("o")
        ('{"sessionEndTime":"' + $liveSnapshotTime + '","rows":' + $liveRowsJson + '}') | Out-File -FilePath $liveMetricsOutFile -Encoding utf8
    } catch {
        Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WARNING: failed to write live metrics snapshot - $($_.Exception.Message)" -Encoding utf8
    }

    if ($lineCount -gt $maxLines) {
        $lines = Get-Content $out -Tail $maxLines
        Set-Content -Path $out -Value $lines -Encoding utf8
        $lineCount = $lines.Count
    }

    $captureCount++
    $sleepSeconds = if ($captureCount -le $fastStartCaptures) { $fastStartIntervalSeconds } else { 30 }

    # Slept in 1-second increments, checking the stop flag each time,
    # instead of one flat sleep - confirmed live 2026-07-16: with a single
    # 30s sleep, the loop only ever notices the stop flag at the TOP of the
    # next iteration, so a stop request right after a sample could take up
    # to 30 seconds to be seen at all - longer than the bridge server's
    # 8-second graceful-wait window, which would mean it almost always fell
    # back to a force-kill anyway, defeating the entire point of adding a
    # graceful exit in the first place.
    for ($i = 0; $i -lt $sleepSeconds; $i++) {
        if (Test-Path $stopFlag) { break }
        Start-Sleep -Seconds 1
    }
}

$exitReason = if (Test-Path $stopFlag) { "stop flag detected" } else { "8-hour deadline reached" }
Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') Watch window ended - reason: $exitReason." -Encoding utf8

# Written once, right here, whenever this script actually exits (Stop
# button, or the 8-hour cap) - the dashboard's reconciliation check reads
# sessionEndTime to know whether this summary has already reached
# Supabase or still needs to be pushed, in case tracking was stopped from
# the desktop app while no browser tab was open to catch it live.
try {
    $finalRows = @(Get-FinalMetricRows $metricStats)
    if ($finalRows.Count -eq 0) {
        $rowsJson = "[]"
    } elseif ($finalRows.Count -eq 1) {
        $rowsJson = "[" + ($finalRows[0] | ConvertTo-Json -Depth 3 -Compress) + "]"
    } else {
        $rowsJson = $finalRows | ConvertTo-Json -Depth 3
    }
    $sessionEndTime = (Get-Date).ToUniversalTime().ToString("o")
    $payload = '{"sessionEndTime":"' + $sessionEndTime + '","rows":' + $rowsJson + '}'
    $payload | Out-File -FilePath $metricsOutFile -Encoding utf8
    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') Wrote $($finalRows.Count) aggregated metric rows to $metricsOutFile." -Encoding utf8
} catch {
    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WARNING: failed to write aggregated metrics - $($_.Exception.Message)" -Encoding utf8
}

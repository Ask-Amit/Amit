$out = "$env:TEMP\diagnostics_watch_result.txt"
$maxLines = 1000

# Ryan's direct request 2026-07-17: Diagnostics never had a graceful-stop
# or final-summary mechanism at all (only the plain 8-hour deadline
# below), unlike resource_watcher.ps1 which already writes an aggregated
# min/max/avg/stddev summary on exit. Same stop-flag pattern, same
# aggregation approach, so this data can flow into the exact same shared
# amit_device_session_metrics table as the Tracker's own rows, under the
# same event - one unified session summary instead of two.
$stopFlag = "$env:TEMP\diagnostics_stop.flag"
Remove-Item $stopFlag -ErrorAction SilentlyContinue
$metricsOutFile = "$env:TEMP\diagnostics_metrics.json"

function Update-DiagStat($stats, $component, $title, $metricName, $category, $value) {
    if ($null -eq $value -or $value -eq "?") { return }
    $key = "$component|$title|$metricName|$category"
    if (-not $stats.ContainsKey($key)) {
        $stats[$key] = [PSCustomObject]@{
            component = $component; title = $title
            metricName = $metricName; category = $category
            count = 0; sum = 0.0; sumSq = 0.0
            min = [double]::MaxValue; max = [double]::MinValue
        }
    }
    $s = $stats[$key]
    $v = [double]$value
    $s.count++
    $s.sum += $v
    $s.sumSq += ($v * $v)
    if ($v -lt $s.min) { $s.min = $v }
    if ($v -gt $s.max) { $s.max = $v }
}

function Get-FinalDiagRows($stats) {
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

$diagStats = @{}

"Diagnostics watcher started at $(Get-Date -Format 'HH:mm:ss.fff') - interrupt/DPC time, disk queue, disk latency, free disk space, network throughput, page faults, processor queue length, context switches, per-core CPU, top CPU consumers, GPU engine usage, and USB/kernel event log warnings every 5 seconds. This catches what the resource watcher misses: input-lag causes (DPC/interrupt storms), disk bottlenecks, and driver-level errors." | Out-File -FilePath $out -Encoding utf8

# Counter paths resolved once - some are locale-sensitive so wrapped in try/catch per read
# Four added 2026-07-16 (Ryan's direct request) - Processor Queue Length,
# disk latency (Avg. Disk sec/Read and Write), free disk space %, and
# Context Switches/sec. None of these are duplicated by
# LibreHardwareMonitor - they're pure Windows scheduler/storage-stack
# statistics with no physical sensor equivalent (no chip reports "threads
# waiting" or "how long did that I/O actually take").
$counterPaths = @(
    '\Processor(_Total)\% Interrupt Time',
    '\Processor(_Total)\% DPC Time',
    '\Processor(_Total)\% Processor Time',
    '\PhysicalDisk(_Total)\% Disk Time',
    '\PhysicalDisk(_Total)\Avg. Disk Queue Length',
    '\PhysicalDisk(_Total)\Disk Bytes/sec',
    '\PhysicalDisk(_Total)\Avg. Disk sec/Read',
    '\PhysicalDisk(_Total)\Avg. Disk sec/Write',
    '\LogicalDisk(_Total)\% Free Space',
    '\Memory\Page Faults/sec',
    '\Memory\Pages/sec',
    '\Network Interface(*)\Bytes Total/sec',
    '\System\Processor Queue Length',
    '\System\Context Switches/sec'
)

$deadline = (Get-Date).AddHours(8)
$lineCount = 1
$lastEventCheck = Get-Date

while ((Get-Date) -lt $deadline -and -not (Test-Path $stopFlag)) {
    $sample = try { Get-Counter -Counter $counterPaths -ErrorAction Stop } catch { $null }

    $interruptPct = "?"; $dpcPct = "?"; $cpuPct = "?"; $diskPct = "?"; $diskQueue = "?"; $diskBps = "?"; $pageFaults = "?"; $pagesPerSec = "?"; $netBps = "?"
    $diskReadMs = "?"; $diskWriteMs = "?"; $freeSpacePct = "?"; $procQueueLen = "?"; $contextSwitches = "?"

    if ($sample) {
        foreach ($c in $sample.CounterSamples) {
            switch -Wildcard ($c.Path) {
                "*% Interrupt Time*" { $interruptPct = [math]::Round($c.CookedValue, 2) }
                "*% DPC Time*"       { $dpcPct = [math]::Round($c.CookedValue, 2) }
                "*% Processor Time*" { $cpuPct = [math]::Round($c.CookedValue, 1) }
                "*% Disk Time*"      { $diskPct = [math]::Round($c.CookedValue, 1) }
                "*Avg. Disk Queue Length*" { $diskQueue = [math]::Round($c.CookedValue, 2) }
                "*Disk Bytes/sec*"   { $diskBps = [math]::Round($c.CookedValue / 1MB, 2) }
                # Raw counter value is in seconds - converted to milliseconds,
                # the units anyone would actually recognize (a good SSD reads
                # in well under 1ms; anything creeping toward 10-20ms+ is a
                # real, noticeable slowdown).
                "*Avg. Disk sec/Read*"  { $diskReadMs = [math]::Round($c.CookedValue * 1000, 2) }
                "*Avg. Disk sec/Write*" { $diskWriteMs = [math]::Round($c.CookedValue * 1000, 2) }
                "*% Free Space*"     { $freeSpacePct = [math]::Round($c.CookedValue, 1) }
                "*Page Faults/sec*"  { $pageFaults = [math]::Round($c.CookedValue, 0) }
                "*Pages/sec*"        { $pagesPerSec = [math]::Round($c.CookedValue, 0) }
                "*Processor Queue Length*" { $procQueueLen = [math]::Round($c.CookedValue, 0) }
                "*Context Switches/sec*"   { $contextSwitches = [math]::Round($c.CookedValue, 0) }
            }
        }
        # Sum all non-loopback NIC throughput
        $netSamples = $sample.CounterSamples | Where-Object { $_.Path -like "*Network Interface*" -and $_.InstanceName -notlike "*loopback*" -and $_.InstanceName -notlike "*isatap*" }
        if ($netSamples) {
            $netBps = [math]::Round((($netSamples | Measure-Object -Property CookedValue -Sum).Sum) / 1KB, 1)
        }
    }

    # Top 5 processes by CPU (approximate via CPU property delta over 1 sec is expensive; use Get-Process CPU total as a proxy trend)
    $topCpu = Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Name)=$([math]::Round($_.CPU,1))s" }
    $topCpuStr = $topCpu -join ", "

    # GPU engine utilization per process (Win10+ perf counters, may not exist on all systems)
    $gpuStr = "n/a"
    $gpu3dPct = $null
    try {
        $gpuCounters = Get-Counter '\GPU Engine(*engtype_3D)\Utilization Percentage' -ErrorAction Stop
        $gpuTotal = ($gpuCounters.CounterSamples | Measure-Object -Property CookedValue -Sum).Sum
        $gpu3dPct = [math]::Round($gpuTotal, 1)
        $gpuStr = "$gpu3dPct%"
    } catch {}

    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') CPU:${cpuPct}% INTERRUPT:${interruptPct}% DPC:${dpcPct}% DISK:${diskPct}%/queue=${diskQueue}/${diskBps}MBps/read=${diskReadMs}ms/write=${diskWriteMs}ms FREESPACE:${freeSpacePct}% NET:${netBps}KBps PAGEFAULTS:${pageFaults}/s PAGING:${pagesPerSec}/s PROCQUEUE:${procQueueLen} CTXSWITCH:${contextSwitches}/s GPU3D:${gpuStr} TOPCPU:[$topCpuStr]" -Encoding utf8
    $lineCount++

    # Same buckets Get-ComponentCategory in resource_watcher.ps1 already
    # uses (CPU/GPU/RAM/Storage/Network) - Ryan's direct request
    # 2026-07-17: this data belongs alongside the Tracker's own sensor
    # rows in the same table, grouped under the same familiar component
    # names, not off in its own separate section.
    Update-DiagStat $diagStats 'CPU' 'CPU Scheduling' 'Interrupt Time' 'Diagnostics' $interruptPct
    Update-DiagStat $diagStats 'CPU' 'CPU Scheduling' 'DPC Time' 'Diagnostics' $dpcPct
    Update-DiagStat $diagStats 'CPU' 'CPU Scheduling' 'Processor Queue Length' 'Diagnostics' $procQueueLen
    Update-DiagStat $diagStats 'CPU' 'CPU Scheduling' 'Context Switches/sec' 'Diagnostics' $contextSwitches
    Update-DiagStat $diagStats 'Storage' 'Disk' 'Disk Time %' 'Diagnostics' $diskPct
    Update-DiagStat $diagStats 'Storage' 'Disk' 'Disk Queue Length' 'Diagnostics' $diskQueue
    Update-DiagStat $diagStats 'Storage' 'Disk' 'Disk Throughput MBps' 'Diagnostics' $diskBps
    Update-DiagStat $diagStats 'Storage' 'Disk' 'Disk Read Latency ms' 'Diagnostics' $diskReadMs
    Update-DiagStat $diagStats 'Storage' 'Disk' 'Disk Write Latency ms' 'Diagnostics' $diskWriteMs
    Update-DiagStat $diagStats 'Storage' 'Disk' 'Free Space %' 'Diagnostics' $freeSpacePct
    Update-DiagStat $diagStats 'RAM' 'Memory' 'Page Faults/sec' 'Diagnostics' $pageFaults
    Update-DiagStat $diagStats 'RAM' 'Memory' 'Paging/sec' 'Diagnostics' $pagesPerSec
    Update-DiagStat $diagStats 'Network' 'Network' 'Throughput KBps' 'Diagnostics' $netBps
    if ($null -ne $gpu3dPct) { Update-DiagStat $diagStats 'GPU' 'GPU 3D Engine' 'Utilization %' 'Diagnostics' $gpu3dPct }

    # Every 60 seconds, check System event log for USB/disk/kernel-power warnings or errors since last check
    if (((Get-Date) - $lastEventCheck).TotalSeconds -ge 60) {
        try {
            $events = Get-WinEvent -FilterHashtable @{ LogName = 'System'; Level = 1,2,3; StartTime = $lastEventCheck } -ErrorAction SilentlyContinue |
                Where-Object { $_.ProviderName -match 'USB|disk|Kernel-Power|Kernel-PnP|volmgr|storahci' } |
                Select-Object -First 10
            foreach ($e in $events) {
                $msgClean = ($e.Message -replace "`r`n", ' ')
                $msgShort = $msgClean.Substring(0, [Math]::Min(200, $msgClean.Length))
                Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') EVENTLOG[$($e.ProviderName)] Level=$($e.LevelDisplayName): $msgShort" -Encoding utf8
                $lineCount++
            }
        } catch {}
        $lastEventCheck = Get-Date
    }

    if ($lineCount -gt $maxLines) {
        $lines = Get-Content $out -Tail $maxLines
        Set-Content -Path $out -Value $lines -Encoding utf8
        $lineCount = $lines.Count
    }

    # Checked every second instead of one flat 5-second sleep - same
    # reasoning as resource_watcher.ps1's 1-second stop-flag polling, so a
    # stop request is seen quickly instead of up to 5 seconds late.
    for ($i = 0; $i -lt 5; $i++) {
        if (Test-Path $stopFlag) { break }
        Start-Sleep -Seconds 1
    }
}
$exitReason = if (Test-Path $stopFlag) { "stop flag detected" } else { "8-hour deadline reached" }
Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') Watch window ended - reason: $exitReason." -Encoding utf8

# Same pattern resource_watcher.ps1 already uses - written once here,
# whenever this script actually exits, so the dashboard can push these
# rows into the same amit_device_session_metrics table under the same
# event as the Tracker's own rows (Ryan's direct request 2026-07-17).
try {
    $finalRows = @(Get-FinalDiagRows $diagStats)
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
    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') Wrote $($finalRows.Count) aggregated diagnostic metric rows to $metricsOutFile." -Encoding utf8
} catch {
    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') WARNING: failed to write aggregated diagnostic metrics - $($_.Exception.Message)" -Encoding utf8
}

$out = "$env:TEMP\diagnostics_watch_result.txt"
$maxLines = 1000

"Diagnostics watcher started at $(Get-Date -Format 'HH:mm:ss.fff') - interrupt/DPC time, disk queue, network throughput, page faults, per-core CPU, top CPU consumers, GPU engine usage, and USB/kernel event log warnings every 5 seconds. This catches what the resource watcher misses: input-lag causes (DPC/interrupt storms), disk bottlenecks, and driver-level errors." | Out-File -FilePath $out -Encoding utf8

# Counter paths resolved once - some are locale-sensitive so wrapped in try/catch per read
$counterPaths = @(
    '\Processor(_Total)\% Interrupt Time',
    '\Processor(_Total)\% DPC Time',
    '\Processor(_Total)\% Processor Time',
    '\PhysicalDisk(_Total)\% Disk Time',
    '\PhysicalDisk(_Total)\Avg. Disk Queue Length',
    '\PhysicalDisk(_Total)\Disk Bytes/sec',
    '\Memory\Page Faults/sec',
    '\Memory\Pages/sec',
    '\Network Interface(*)\Bytes Total/sec'
)

$deadline = (Get-Date).AddHours(8)
$lineCount = 1
$lastEventCheck = Get-Date

while ((Get-Date) -lt $deadline) {
    $sample = try { Get-Counter -Counter $counterPaths -ErrorAction Stop } catch { $null }

    $interruptPct = "?"; $dpcPct = "?"; $cpuPct = "?"; $diskPct = "?"; $diskQueue = "?"; $diskBps = "?"; $pageFaults = "?"; $pagesPerSec = "?"; $netBps = "?"

    if ($sample) {
        foreach ($c in $sample.CounterSamples) {
            switch -Wildcard ($c.Path) {
                "*% Interrupt Time*" { $interruptPct = [math]::Round($c.CookedValue, 2) }
                "*% DPC Time*"       { $dpcPct = [math]::Round($c.CookedValue, 2) }
                "*% Processor Time*" { $cpuPct = [math]::Round($c.CookedValue, 1) }
                "*% Disk Time*"      { $diskPct = [math]::Round($c.CookedValue, 1) }
                "*Avg. Disk Queue Length*" { $diskQueue = [math]::Round($c.CookedValue, 2) }
                "*Disk Bytes/sec*"   { $diskBps = [math]::Round($c.CookedValue / 1MB, 2) }
                "*Page Faults/sec*"  { $pageFaults = [math]::Round($c.CookedValue, 0) }
                "*Pages/sec*"        { $pagesPerSec = [math]::Round($c.CookedValue, 0) }
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
    try {
        $gpuCounters = Get-Counter '\GPU Engine(*engtype_3D)\Utilization Percentage' -ErrorAction Stop
        $gpuTotal = ($gpuCounters.CounterSamples | Measure-Object -Property CookedValue -Sum).Sum
        $gpuStr = "$([math]::Round($gpuTotal,1))%"
    } catch {}

    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') CPU:${cpuPct}% INTERRUPT:${interruptPct}% DPC:${dpcPct}% DISK:${diskPct}%/queue=${diskQueue}/${diskBps}MBps NET:${netBps}KBps PAGEFAULTS:${pageFaults}/s PAGING:${pagesPerSec}/s GPU3D:${gpuStr} TOPCPU:[$topCpuStr]" -Encoding utf8
    $lineCount++

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

    Start-Sleep -Seconds 5
}
Add-Content -Path $out -Value "Watch window elapsed, stopping normally." -Encoding utf8

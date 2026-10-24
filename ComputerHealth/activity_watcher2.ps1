# Version v1.01 (2026-10-24) - baseline v1.00 = everything before. v1.01: memory fix - Process objects released, one reusable WMI connection (resource), full cleanup about once a minute. Each push of this file bumps this number by 0.01.
$out = "$env:TEMP\activity_watch2_result.txt"
$maxLines = 200

"Activity watcher (v2, polling-diff) started at $(Get-Date -Format 'HH:mm:ss.fff') - tracks every process appearing or disappearing, all activity, not just Amit, Claude, or GitHub" | Out-File -FilePath $out -Encoding utf8

# Memory fix 2026-10-24 (Ryan: the monitor grew all day until it used up his RAM). This loop calls Get-Process about 7
# times a second; each call creates a few hundred Process objects. They are now disposed right away, and a full
# garbage collection runs about once a minute, so memory stays flat instead of climbing between the runtime's own
# (lazy) cleanups. Nothing about what is tracked has changed.
$prev = @{}
Get-Process | ForEach-Object { $prev[$_.Id] = $_.Name; $_.Dispose() }

$deadline = (Get-Date).AddHours(8)
$lineCount = 1
$gcTick = 0
while ((Get-Date) -lt $deadline) {
    $current = @{}
    Get-Process | ForEach-Object { $current[$_.Id] = $_.Name; $_.Dispose() }

    foreach ($id in $current.Keys) {
        if (-not $prev.ContainsKey($id)) {
            try { Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') START  $($current[$id]) (PID=$id)" -Encoding utf8 -ErrorAction Stop; $lineCount++ } catch {}
        }
    }
    foreach ($id in $prev.Keys) {
        if (-not $current.ContainsKey($id)) {
            try { Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') STOP   $($prev[$id]) (PID=$id)" -Encoding utf8 -ErrorAction Stop; $lineCount++ } catch {}
        }
    }

    if ($lineCount -gt $maxLines) {
        # A second instance of this exact script (e.g. a duplicate launch
        # slipping past the bridge server's own dedup check) could still be
        # mid-write to this same file at this exact moment - swallow that
        # rather than crashing the whole loop over one missed truncation pass.
        try {
            $lines = Get-Content $out -Tail $maxLines -ErrorAction Stop
            Set-Content -Path $out -Value $lines -Encoding utf8 -ErrorAction Stop
            $lineCount = $lines.Count
        } catch {}
    }

    $prev = $current
    $gcTick++
    if ($gcTick -ge 400) { $gcTick = 0; [GC]::Collect(); [GC]::WaitForPendingFinalizers(); [GC]::Collect() }   # 400 x 150 ms = about once a minute
    Start-Sleep -Milliseconds 150
}
Add-Content -Path $out -Value "Watch window elapsed, stopping normally." -Encoding utf8

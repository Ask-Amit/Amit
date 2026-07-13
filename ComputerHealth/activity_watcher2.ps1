$out = "$env:TEMP\activity_watch2_result.txt"
$maxLines = 200

"Activity watcher (v2, polling-diff) started at $(Get-Date -Format 'HH:mm:ss.fff') - tracks every process appearing or disappearing, all activity, not just Amit, Claude, or GitHub" | Out-File -FilePath $out -Encoding utf8

$prev = @{}
Get-Process | ForEach-Object { $prev[$_.Id] = $_.Name }

$deadline = (Get-Date).AddHours(8)
$lineCount = 1
while ((Get-Date) -lt $deadline) {
    $current = @{}
    Get-Process | ForEach-Object { $current[$_.Id] = $_.Name }

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
    Start-Sleep -Milliseconds 150
}
Add-Content -Path $out -Value "Watch window elapsed, stopping normally." -Encoding utf8

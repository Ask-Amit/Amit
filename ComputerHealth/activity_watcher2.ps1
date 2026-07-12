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
            Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') START  $($current[$id]) (PID=$id)" -Encoding utf8
            $lineCount++
        }
    }
    foreach ($id in $prev.Keys) {
        if (-not $current.ContainsKey($id)) {
            Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') STOP   $($prev[$id]) (PID=$id)" -Encoding utf8
            $lineCount++
        }
    }

    if ($lineCount -gt $maxLines) {
        $lines = Get-Content $out -Tail $maxLines
        Set-Content -Path $out -Value $lines -Encoding utf8
        $lineCount = $lines.Count
    }

    $prev = $current
    Start-Sleep -Milliseconds 150
}
Add-Content -Path $out -Value "Watch window elapsed, stopping normally." -Encoding utf8

$out = "$env:TEMP\resource_watch_result.txt"
$maxLines = 500

"Resource watcher started at $(Get-Date -Format 'HH:mm:ss.fff') - RAM, CPU, top memory consumers, and FULL sensor dump (all voltages/temps/fans/power/clocks via LibreHardwareMonitor web server) every 30 seconds" | Out-File -FilePath $out -Encoding utf8

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

$deadline = (Get-Date).AddHours(8)
$lineCount = 1
while ((Get-Date) -lt $deadline) {
    $os = Get-CimInstance Win32_OperatingSystem
    $totalMB = [math]::Round($os.TotalVisibleMemorySize/1024, 0)
    $freeMB = [math]::Round($os.FreePhysicalMemory/1024, 0)
    $usedPct = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 1)
    $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average

    $topProcs = Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Name)=$([math]::Round($_.WorkingSet/1MB,0))MB" }
    $topStr = $topProcs -join ", "

    $sensorDump = ""
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8085/data.json" -TimeoutSec 5 -ErrorAction Stop
        $flat = Get-SensorFlat $response
        # Strip the redundant "Sensor>COMPUTERNAME>" prefix from every entry to keep lines shorter
        $trimmed = $flat | ForEach-Object { $_ -replace '^[^>]+>[^>]+>', '' }
        $sensorDump = ($trimmed -join " || ")
    } catch {
        $sensorDump = "[LibreHardwareMonitor web server not reachable - check Options > Remote Web Server > Run is enabled]"
    }

    Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') RAM:${freeMB}MB-free/${totalMB}MB-total(${usedPct}%used) CPU:${cpu}% TOP5:[$topStr] SENSORS:[$sensorDump]" -Encoding utf8
    $lineCount++

    if ($lineCount -gt $maxLines) {
        $lines = Get-Content $out -Tail $maxLines
        Set-Content -Path $out -Value $lines -Encoding utf8
        $lineCount = $lines.Count
    }

    Start-Sleep -Seconds 30
}
Add-Content -Path $out -Value "Watch window elapsed, stopping normally." -Encoding utf8

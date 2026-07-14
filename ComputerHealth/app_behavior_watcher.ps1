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

if ($autoDetect) {
    Write-Host "Amit App Behavior Watcher in auto-detect mode. Go open the program you want to check now - it'll be picked up automatically."
} else {
    Write-Host "Amit App Behavior Watcher running against '$TargetProcess'. Go use the app now."
}
Write-Host "Log: $out"
Write-Host "Stop with: New-Item `"$stopFlag`" -ItemType File   (or Ctrl+C)"

$connCounts = @{}

while (-not (Test-Path $stopFlag)) {
    if ($autoDetect) {
        # Any process alive right now that wasn't in the baseline snapshot is
        # something the user just launched - adopt its name automatically.
        # Everything with that same name (the app could have more than one
        # process, e.g. a helper/updater) gets watched from here on, exactly
        # like manually naming it would have.
        foreach ($p in (Get-Process)) {
            if (-not $baselinePidSet.Contains($p.Id) -and -not $watchedNames.Contains($p.ProcessName)) {
                [void]$watchedNames.Add($p.ProcessName)
                Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') DETECTED new program: '$($p.ProcessName)' (PID=$($p.Id)) - now watching it." -Encoding utf8
            }
        }
        if ($watchedNames.Count -eq 0) {
            Start-Sleep -Seconds 2
            continue
        }
    }

    $pids = @()
    foreach ($name in $watchedNames) {
        $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
        if ($procs) { $pids += ($procs | Select-Object -ExpandProperty Id) }
    }
    if ($pids.Count -eq 0) {
        Start-Sleep -Seconds 3
        continue
    }

    # --- Network connections, exactly attributed to the target process ---
    foreach ($p in $pids) {
        $conns = Get-NetTCPConnection -OwningProcess $p -State Established -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            $key = "$p-$($c.RemoteAddress)-$($c.RemotePort)"
            if (-not $seenConnections.ContainsKey($key)) {
                $seenConnections[$key] = $true
                $hostname = Resolve-RemoteHost $c.RemoteAddress
                $isPrivate = $c.RemoteAddress -match '^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)'
                $tag = if ($isPrivate) { "[local network]" } else { "[external]" }
                Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') NETWORK $tag PID=$p -> $($c.RemoteAddress):$($c.RemotePort) ($hostname)" -Encoding utf8
            }
            $connCounts[$key] = ($connCounts[$key] + 1)
            if ($connCounts[$key] -eq 20) {
                Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') NETWORK FLAG: repeated/sustained connection to $($c.RemoteAddress):$($c.RemotePort) from PID=$p - possible beaconing or streaming, worth a closer look if unexpected" -Encoding utf8
            }
        }
    }

    # --- File writes, correlated in time (not proven causation) ---
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
        } catch {}
    }

    Start-Sleep -Seconds 5
}

$watchedList = if ($watchedNames.Count -gt 0) { ($watchedNames -join ', ') } else { "(nothing detected)" }
Add-Content -Path $out -Value "" -Encoding utf8
Add-Content -Path $out -Value "$(Get-Date -Format 'HH:mm:ss.fff') Session stopped. Watched: $watchedList. Summary: $($seenConnections.Count) distinct network connections, $($knownFiles.Count) file writes observed during window." -Encoding utf8
Remove-Item $stopFlag -ErrorAction SilentlyContinue
Write-Host "Stopped. Full report: $out"

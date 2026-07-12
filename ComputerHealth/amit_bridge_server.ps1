# Amit Computer Health - Local Bridge Server
# Serves the dashboard HTML and exposes local watcher data/controls over HTTP
# so a browser page (which cannot see the filesystem or processes directly)
# can read tracker output and push events to Supabase.
#
# Each request is handled on its own runspace. This matters because a client
# that times out mid-request can leave the server-side connection half-open,
# and a naive single-threaded accept loop would then hang on every request
# after that one forever. Concurrent handling means one stuck connection
# never blocks the rest.
#
# Run this, then open http://localhost:8710/ in a browser.

$port = 8710
$watcherDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$dashboardPath = "$watcherDir\ComputerHealth_Dashboard.html"
$deviceIdFile = "$watcherDir\device_id.txt"

if (-not (Test-Path $deviceIdFile)) {
    [guid]::NewGuid().ToString() | Set-Content -Path $deviceIdFile -Encoding utf8
}
$deviceId = (Get-Content $deviceIdFile -Raw).Trim()
$deviceName = $env:COMPUTERNAME

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
} catch {
    Write-Host "Could not bind to port $port - it may already be in use. Error: $($_.Exception.Message)"
    exit 1
}

Write-Host "Amit Computer Health bridge server running at http://localhost:$port/"
Write-Host "Device ID: $deviceId  |  Device Name: $deviceName"
Write-Host "Press Ctrl+C to stop."

$handlerScript = {
    param($context, $watcherDir, $dashboardPath, $deviceId, $deviceName)

    function ConvertTo-JsonString($text) {
        # Manual JSON string escaping - avoids ConvertTo-Json, which has a real
        # slowness/hang issue on some fresh runspaces in Windows PowerShell 5.1
        # (confirmed via tracing: identical code hangs on a cold runspace but not
        # a warm one, purely from the cmdlet call itself, not the data size).
        if ($null -eq $text) { return '""' }
        $escaped = $text -replace '\\', '\\\\' -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t'
        return '"' + $escaped + '"'
    }

    function Send-JsonRaw($response, $jsonString, $statusCode = 200) {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonString)
        $response.StatusCode = $statusCode
        $response.ContentType = "application/json"
        $response.KeepAlive = $false
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    }

    function Send-JsonLines($response, $lines) {
        $itemsJson = ($lines | ForEach-Object { ConvertTo-JsonString $_ }) -join ","
        Send-JsonRaw $response ('{"lines":[' + $itemsJson + ']}')
    }

    function Send-Json($response, $obj, $statusCode = 200) {
        $json = $obj | ConvertTo-Json -Depth 8 -Compress
        Send-JsonRaw $response $json $statusCode
    }
    function Send-Html($response, $content) {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        $response.ContentType = "text/html; charset=utf-8"
        $response.KeepAlive = $false
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    }
    function Get-TailSafe($path, $lines = 100, $maxLineLen = 400) {
        if (Test-Path $path) {
            try {
                $raw = @(Get-Content $path -Tail $lines -Encoding UTF8)
                return @($raw | ForEach-Object { if ($_.Length -gt $maxLineLen) { $_.Substring(0, $maxLineLen) + "..." } else { $_ } })
            } catch { return @() }
        }
        return @()
    }

    function Get-BrowserBreakdown() {
        # Same breakdown Amit did manually when Ryan asked "why does Edge have 41
        # processes for 2 tabs" - now built into Computer Health as its own tab.
        $browsers = @(
            @{ Name = "Edge"; ProcName = "msedge"; ExtPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Extensions" },
            @{ Name = "Chrome"; ProcName = "chrome"; ExtPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions" },
            @{ Name = "Firefox"; ProcName = "firefox"; ExtPath = $null }
        )
        $results = @()
        foreach ($b in $browsers) {
            $procs = Get-CimInstance Win32_Process -Filter "Name='$($b.ProcName).exe'" -ErrorAction SilentlyContinue
            if (-not $procs) { continue }

            $renderer = 0; $gpu = 0; $utility = 0; $other = 0
            $totalMemMB = 0
            foreach ($p in $procs) {
                $cmd = $p.CommandLine
                if ($cmd -match '--type=renderer') { $renderer++ }
                elseif ($cmd -match '--type=gpu-process') { $gpu++ }
                elseif ($cmd -match '--type=utility') { $utility++ }
                elseif ($cmd -notmatch '--type=') { } # main process, not counted separately here
                else { $other++ }
                $procObj = Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue
                if ($procObj) { $totalMemMB += [math]::Round($procObj.WS / 1MB, 1) }
            }

            $extCount = 0
            if ($b.ExtPath -and (Test-Path $b.ExtPath)) {
                $extCount = @(Get-ChildItem $b.ExtPath -Directory -ErrorAction SilentlyContinue).Count
            }

            $results += [PSCustomObject]@{
                browser = $b.Name
                totalProcesses = $procs.Count
                rendererProcesses = $renderer
                gpuProcesses = $gpu
                utilityProcesses = $utility
                extensionCount = $extCount
                totalMemMB = [math]::Round($totalMemMB, 0)
            }
        }
        return $results
    }

    $trackerPidFile = "$env:TEMP\amit_tracker_pids.txt"
    # The installer records the exact real path (existing install or freshly
    # downloaded) at install time - read that instead of guessing, so this
    # never launches a second copy alongside one the user already has.
    $lhmPathFile = "$watcherDir\lhm_path.txt"
    $lhmPath = $null
    if (Test-Path $lhmPathFile) {
        $recorded = (Get-Content $lhmPathFile -Raw -ErrorAction SilentlyContinue).Trim()
        if ($recorded -and (Test-Path $recorded)) { $lhmPath = $recorded }
    }

    function Get-TrackerStatus() {
        $running = $false
        $pids = @()
        if (Test-Path $trackerPidFile) {
            $savedPids = Get-Content $trackerPidFile -ErrorAction SilentlyContinue
            foreach ($spid in $savedPids) {
                if ($spid -match '^\d+$') {
                    $p = Get-Process -Id $spid -ErrorAction SilentlyContinue
                    if ($p) { $running = $true; $pids += $spid }
                }
            }
        }
        return @{ running = $running; pids = $pids }
    }

    function Start-Tracking() {
        # Each piece starts independently - LibreHardwareMonitor requires admin
        # (it prompts UAC on its own), and if that prompt is denied or can't be
        # shown, that alone must not stop the other three watchers from starting.
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
        $newPids = @()
        $warnings = @()

        if ($lhmPath -and (Test-Path $lhmPath)) {
            try {
                $lhmProc = Start-Process -FilePath $lhmPath -PassThru -ErrorAction Stop
                $newPids += $lhmProc.Id
            } catch {
                $warnings += "LibreHardwareMonitor needs admin approval to run (UAC) - sensor readings (temps/voltages/fans) won't be available this session. Resource and diagnostic tracking still work."
            }
        }
        try {
            $activityProc = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watcherDir\activity_watcher2.ps1`"" -PassThru -ErrorAction Stop
            $newPids += $activityProc.Id
        } catch { $warnings += "activity watcher failed to start: $($_.Exception.Message)" }
        try {
            $resourceProc = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watcherDir\resource_watcher.ps1`"" -PassThru -ErrorAction Stop
            $newPids += $resourceProc.Id
        } catch { $warnings += "resource watcher failed to start: $($_.Exception.Message)" }
        try {
            $diagProc = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watcherDir\diagnostics_watcher.ps1`"" -PassThru -ErrorAction Stop
            $newPids += $diagProc.Id
        } catch { $warnings += "diagnostics watcher failed to start: $($_.Exception.Message)" }

        $newPids -join "`n" | Set-Content -Path $trackerPidFile -Encoding utf8
        return @{ started = $true; pids = $newPids; elevated = $isAdmin; warnings = $warnings }
    }

    function Stop-Tracking() {
        $stopped = @()
        if (Test-Path $trackerPidFile) {
            $savedPids = Get-Content $trackerPidFile -ErrorAction SilentlyContinue
            foreach ($spid in $savedPids) {
                if ($spid -match '^\d+$') {
                    try {
                        Stop-Process -Id $spid -Force -ErrorAction SilentlyContinue
                        $stopped += $spid
                    } catch {}
                }
            }
            Remove-Item $trackerPidFile -ErrorAction SilentlyContinue
        }
        return @{ stopped = $true; pids = $stopped }
    }

    function Send-BrowserJson($response) {
        $data = @(Get-BrowserBreakdown)
        $items = $data | ForEach-Object {
            '{"browser":' + (ConvertTo-JsonString $_.browser) + ',"totalProcesses":' + $_.totalProcesses + ',"rendererProcesses":' + $_.rendererProcesses + ',"gpuProcesses":' + $_.gpuProcesses + ',"utilityProcesses":' + $_.utilityProcesses + ',"extensionCount":' + $_.extensionCount + ',"totalMemMB":' + $_.totalMemMB + '}'
        }
        Send-JsonRaw $response ('{"browsers":[' + ($items -join ",") + ']}')
    }

    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.AbsolutePath

    try {
        switch ($path) {
            "/" {
                if (Test-Path $dashboardPath) { Send-Html $response (Get-Content $dashboardPath -Raw -Encoding UTF8) }
                else { Send-Html $response "<h1>Dashboard file not found at $dashboardPath</h1>" }
            }
            "/api/device" { Send-Json $response @{ deviceId = $deviceId; deviceName = $deviceName } }
            "/api/resource" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\resource_watch_result.txt" 20) }
            "/api/diagnostics" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\diagnostics_watch_result.txt" 30) }
            "/api/activity" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\activity_watch2_result.txt" 30) }
            "/api/behavior" { Send-JsonLines $response (Get-TailSafe "$env:TEMP\app_behavior_result.txt" 50) }
            "/api/browser" { Send-BrowserJson $response }
            "/api/tracker-status" {
                $s = Get-TrackerStatus
                Send-JsonRaw $response ('{"running":' + $(if ($s.running) {'true'} else {'false'}) + ',"pidCount":' + $s.pids.Count + '}')
            }
            "/api/start-tracking" {
                $r = Start-Tracking
                Send-JsonRaw $response ('{"started":true,"pidCount":' + $r.pids.Count + ',"elevated":' + $(if ($r.elevated) {'true'} else {'false'}) + '}')
            }
            "/api/stop-tracking" {
                $r = Stop-Tracking
                Send-JsonRaw $response ('{"stopped":true,"pidCount":' + $r.pids.Count + '}')
            }
            "/api/install-diff-latest" {
                $snapDir = "$env:TEMP\amit_install_snapshots"
                $latest = if (Test-Path $snapDir) { Get-ChildItem "$snapDir\diff_report_*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 } else { $null }
                if ($latest) { Send-Json $response @{ found = $true; content = (Get-Content $latest.FullName -Raw) } }
                else { Send-Json $response @{ found = $false } }
            }
            "/api/start-behavior" {
                $body = New-Object System.IO.StreamReader($request.InputStream)
                $data = $body.ReadToEnd() | ConvertFrom-Json
                Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watcherDir\app_behavior_watcher.ps1`" -TargetProcess `"$($data.processName)`""
                Send-Json $response @{ started = $true; processName = $data.processName }
            }
            "/api/stop-behavior" {
                New-Item "$env:TEMP\app_behavior_stop.flag" -ItemType File -Force | Out-Null
                Send-Json $response @{ stopped = $true }
            }
            "/api/install-start" {
                Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\install_snapshot_watcher.ps1`" -Start" -WindowStyle Hidden -Wait
                Send-Json $response @{ baselineStarted = $true }
            }
            "/api/install-compare" {
                Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$watcherDir\install_snapshot_watcher.ps1`" -Compare" -WindowStyle Hidden -Wait
                $snapDir = "$env:TEMP\amit_install_snapshots"
                $latest = Get-ChildItem "$snapDir\diff_report_*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                if ($latest) { Send-Json $response @{ found = $true; content = (Get-Content $latest.FullName -Raw) } }
                else { Send-Json $response @{ found = $false } }
            }
            default {
                $response.StatusCode = 404
                Send-Html $response "Not found"
            }
        }
    } catch {
        try { Send-Json $response @{ error = $_.Exception.Message } 500 } catch {}
    }
}

$pool = [runspacefactory]::CreateRunspacePool(1, 8)
$pool.Open()
$running = New-Object System.Collections.ArrayList

while ($listener.IsListening) {
    $context = $listener.GetContext()

    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($handlerScript).AddArgument($context).AddArgument($watcherDir).AddArgument($dashboardPath).AddArgument($deviceId).AddArgument($deviceName)
    $handle = $ps.BeginInvoke()
    [void]$running.Add(@{ PS = $ps; Handle = $handle })

    # Clean up completed handlers so the list doesn't grow forever
    for ($i = $running.Count - 1; $i -ge 0; $i--) {
        if ($running[$i].Handle.IsCompleted) {
            try { $running[$i].PS.EndInvoke($running[$i].Handle) } catch {}
            $running[$i].PS.Dispose()
            $running.RemoveAt($i)
        }
    }
}

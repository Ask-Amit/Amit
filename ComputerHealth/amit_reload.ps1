# amit_reload.ps1 - "Update and reload": restarts this computer's Amit bar, the Amit helper (Amit Live) and the helper's hidden windows,
# and brings in any waiting update on the way. Plain ASCII on purpose (PowerShell 5.1).
# The bar's reload tile starts it (hidden, detached) after the person has said yes. Nobody has to wait for a quiet moment: the person asked.
#
# In this order:
#   1. Stops the bar, the hidden Whisper and Talk windows, and the helper (Amit Live lives inside the helper).
#   2. Runs the helper's own updater (amit_update.ps1), which downloads, checks and installs any published update and starts the helper again.
#      With the helper stopped it sees nothing busy, so a waiting update goes ahead instead of waiting.
#   3. Makes sure the helper is running (starts it if the updater had nothing to do) and waits until it answers.
#   4. Starts the bar again and shows it.
# It leaves alone: Computer Health's own trackers, the Ask Amit answering program, and every other program on the computer.
# -DryRun writes what it would do to reload.log and does nothing else (for tests).
param([switch]$DryRun, [int]$Port = 8710)
$ErrorActionPreference = 'Continue'
$amitHome = Join-Path $env:LOCALAPPDATA 'AmitComputerHealth'
$dir = Join-Path $amitHome 'Watchers'
$logPath = Join-Path $amitHome 'reload.log'
$stamp = Join-Path $amitHome 'reload.running'
$bridge = Join-Path $dir 'amit_bridge_server.ps1'
$updater = Join-Path $dir 'amit_update.ps1'
$bar = Join-Path $dir 'AmitBar.exe'
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
function Log([string]$m) { try { Add-Content -Path $logPath -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $m) } catch {} }
function Answers { try { $wc = New-Object System.Net.WebClient; $t = $wc.DownloadString("http://localhost:$Port/api/whisper/status"); $wc.Dispose(); return $true } catch { return $false } }

# one reload at a time (a second press within two minutes is ignored)
if (Test-Path $stamp) { if (((Get-Date) - (Get-Item $stamp).LastWriteTime).TotalMinutes -lt 2) { Log 'a reload is already running; this one stops'; exit 0 } }
try { Set-Content -Path $stamp -Value $PID -Encoding ASCII } catch {}
Log ('reload started' + $(if ($DryRun) { ' (dry run: nothing will be stopped or started)' } else { '' }))

try {
    # 1. stop
    $procs = @()
    $procs += @(Get-Process -Name AmitBar -ErrorAction SilentlyContinue | ForEach-Object { ,@('bar', $_.Id) })
    $procs += @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*whisper_profile*' -or $_.CommandLine -like '*talk_profile*' } | ForEach-Object { ,@('hidden Whisper/Talk window', $_.ProcessId) })
    $procs += @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*amit_bridge_server.ps1*' } | ForEach-Object { ,@('helper', $_.ProcessId) })
    foreach ($p in $procs) {
        Log ('stopping ' + $p[0] + ' (process ' + $p[1] + ')')
        if (-not $DryRun) { Stop-Process -Id $p[1] -Force -ErrorAction SilentlyContinue }
    }
    if (-not $DryRun) { Start-Sleep -Seconds 2 }

    # 2. update (a stale lock from a finished run must not stop it)
    $lock = Join-Path $amitHome 'update.lock'
    $running = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*amit_update.ps1*' })
    if ((Test-Path $lock) -and $running.Count -eq 0) { Log 'removing a stale update lock'; if (-not $DryRun) { Remove-Item $lock -Force -ErrorAction SilentlyContinue } }
    if (Test-Path $updater) {
        Log 'running the updater'
        if (-not $DryRun) {
            $runId = 'reload' + (Get-Date -Format 'HHmmss')
            $u = Start-Process -FilePath $ps -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $updater + '"'),'-RunId',$runId -WindowStyle Hidden -PassThru
            if (-not $u.WaitForExit(150000)) { Log 'the updater took longer than 150 seconds; moving on'; }
        }
    } else { Log 'no updater on this computer; skipping the update step' }

    # 3. the helper must be running
    if (-not $DryRun) {
        if (-not (Answers)) {
            $already = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*amit_bridge_server.ps1*' })
            if ($already.Count -eq 0) { Log 'starting the helper'; Start-Process -FilePath $ps -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $bridge + '"') -WindowStyle Hidden }
        }
        $t0 = Get-Date; $up = $false
        while (((Get-Date) - $t0).TotalSeconds -lt 45) { if (Answers) { $up = $true; break }; Start-Sleep -Seconds 2 }
        Log ('the helper ' + $(if ($up) { 'answers again' } else { 'did not answer within 45 seconds' }))
    } else { Log 'would start the helper if it is not running, and wait for it to answer' }

    # 4. the bar
    if (Test-Path $bar) { Log 'starting the bar'; if (-not $DryRun) { Start-Process -FilePath $bar -ArgumentList '--show' } } else { Log 'no bar on this computer; nothing to start' }
    Log 'reload finished'
}
catch { Log ('reload stopped by an error: ' + $_.Exception.Message) }
finally { try { Remove-Item $stamp -Force -ErrorAction SilentlyContinue } catch {} }

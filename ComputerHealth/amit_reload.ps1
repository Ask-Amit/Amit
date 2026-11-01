# amit_reload.ps1 - "Update and reload": restarts this computer's Amit bar, the Amit helper (Amit Live) and the helper's hidden windows,
# brings in any waiting update, and rebuilds the bar program when its source (AmitBar.cs) has changed. Plain ASCII on purpose (PowerShell 5.1).
# The bar's reload tile starts it (hidden, detached) after the person has said yes. Nobody has to wait for a quiet moment: the person asked.
#
# In this order:
#   1. Stops the bar, the hidden Whisper and Talk windows, and the helper (Amit Live lives inside the helper).
#   2. Runs the helper's own updater (amit_update.ps1), which downloads, checks and installs any published update and starts the helper again.
#      With the helper stopped it sees nothing busy, so a waiting update goes ahead instead of waiting.
#      If the update replaced THIS script, the new copy takes over (-Resume) so a new reload script works on the same press.
#   3. Makes sure the helper is running (starts it if the updater had nothing to do) and waits until it answers.
#   4. Rebuilds AmitBar.exe from AmitBar.cs with the compiler that ships with Windows, only when the source changed since the last build.
#   5. Starts the bar again and shows it.
# It leaves alone: Computer Health's own trackers, the Ask Amit answering program, and every other program on the computer.
# -DryRun writes what it would do to reload.log and does nothing else (for tests).
# -BuildOnly only does step 4 (the installer uses it after copying the files, so a new computer has its bar program).
param([switch]$DryRun, [switch]$BuildOnly, [switch]$Resume, [int]$Port = 8710)
$ErrorActionPreference = 'Continue'
$amitHome = Join-Path $env:LOCALAPPDATA 'AmitComputerHealth'
$dir = Join-Path $amitHome 'Watchers'
$logPath = Join-Path $amitHome 'reload.log'
$stamp = Join-Path $amitHome 'reload.running'
$bridge = Join-Path $dir 'amit_bridge_server.ps1'
$updater = Join-Path $dir 'amit_update.ps1'
$bar = Join-Path $dir 'AmitBar.exe'
$self = Join-Path $dir 'amit_reload.ps1'
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
function Log([string]$m) { try { Add-Content -Path $logPath -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $m) } catch {} }
function Answers { try { $wc = New-Object System.Net.WebClient; $t = $wc.DownloadString("http://localhost:$Port/api/whisper/status"); $wc.Dispose(); return $true } catch { return $false } }
function Get-Sha([string]$p) { $s = [System.Security.Cryptography.SHA256]::Create(); try { return ([BitConverter]::ToString($s.ComputeHash([System.IO.File]::ReadAllBytes($p)))).Replace('-', '').ToLowerInvariant() } finally { $s.Dispose() } }

# rebuilds AmitBar.exe from AmitBar.cs when the source changed (or the program is missing); the old program stays if anything goes wrong
function Build-Bar {
    $cs = Join-Path $dir 'AmitBar.cs'
    if (-not (Test-Path $cs)) { Log 'no AmitBar.cs on this computer; the bar program is left as it is'; return }
    $shaFile = Join-Path $amitHome 'AmitBar.built.sha'
    $h = Get-Sha $cs
    $have = ''; if (Test-Path $shaFile) { $have = (Get-Content $shaFile -Raw).Trim() }
    if ($h -eq $have -and (Test-Path $bar)) { Log 'the bar program is already built from this source'; return }
    $csc = $null
    foreach ($c in @("$env:windir\Microsoft.NET\Framework64\v4.0.30319\csc.exe", "$env:windir\Microsoft.NET\Framework\v4.0.30319\csc.exe")) { if (Test-Path $c) { $csc = $c; break } }
    if (-not $csc) { Log 'no C# compiler found on this computer; the bar program is left as it is'; return }
    $speech = "$env:windir\Microsoft.NET\assembly\GAC_MSIL\System.Speech\v4.0_4.0.0.0__31bf3856ad364e35\System.Speech.dll"
    if (-not (Test-Path $speech)) { Log 'System.Speech is missing; the bar program is left as it is'; return }
    $ico = Join-Path $dir 'amit_icon.ico'
    $out = Join-Path $dir 'AmitBar.new.exe'
    Log 'building the bar program from AmitBar.cs'
    if ($DryRun) { Log 'would build and replace AmitBar.exe'; return }
    Remove-Item $out -Force -ErrorAction SilentlyContinue
    $args = @('/nologo', '/target:winexe', ('/out:"' + $out + '"'), '/r:System.Windows.Forms.dll', '/r:System.Drawing.dll', ('/r:"' + $speech + '"'))
    if (Test-Path $ico) { $args += ('/win32icon:"' + $ico + '"') }
    $args += ('"' + $cs + '"')
    $p = Start-Process -FilePath $csc -ArgumentList $args -WindowStyle Hidden -PassThru -Wait
    if ($p.ExitCode -eq 0 -and (Test-Path $out)) {
        Get-Process -Name AmitBar -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 700
        try { Move-Item -LiteralPath $out -Destination $bar -Force; Set-Content -Path $shaFile -Value $h -Encoding ASCII; Log 'the bar program was rebuilt' }
        catch { Log ('could not replace the bar program: ' + $_.Exception.Message); Remove-Item $out -Force -ErrorAction SilentlyContinue }
    } else { Log ('the bar program did not build (compiler exit ' + $p.ExitCode + '); the old one is kept'); Remove-Item $out -Force -ErrorAction SilentlyContinue }
}

if ($BuildOnly) { Log 'build only'; Build-Bar; exit 0 }

# one reload at a time (a second press within two minutes is ignored; the resumed copy is the same reload)
if (-not $Resume) {
    if (Test-Path $stamp) { if (((Get-Date) - (Get-Item $stamp).LastWriteTime).TotalMinutes -lt 2) { Log 'a reload is already running; this one stops'; exit 0 } }
    try { Set-Content -Path $stamp -Value $PID -Encoding ASCII } catch {}
}
Log ($(if ($Resume) { 'reload continues with the updated script' } else { 'reload started' }) + $(if ($DryRun) { ' (dry run: nothing will be stopped or started)' } else { '' }))

try {
    if (-not $Resume) {
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
        $selfBefore = ''; if (Test-Path $self) { $selfBefore = Get-Sha $self }
        if (Test-Path $updater) {
            Log 'running the updater'
            if (-not $DryRun) {
                $runId = 'reload' + (Get-Date -Format 'HHmmss')
                $u = Start-Process -FilePath $ps -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $updater + '"'),'-RunId',$runId -WindowStyle Hidden -PassThru
                if (-not $u.WaitForExit(150000)) { Log 'the updater took longer than 150 seconds; moving on' }
            }
        } else { Log 'no updater on this computer; skipping the update step' }
        # a new reload script takes over on the same press
        if (-not $DryRun -and (Test-Path $self) -and $selfBefore -and ((Get-Sha $self) -ne $selfBefore)) {
            Log 'this script was updated; handing over to the new copy'
            Start-Process -FilePath $ps -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',('"' + $self + '"'),'-Resume' -WindowStyle Hidden
            exit 0
        }
    }

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

    # 4. the bar program, rebuilt if its source changed
    Build-Bar

    # 5. the bar
    if (Test-Path $bar) { Log 'starting the bar'; if (-not $DryRun) { Start-Process -FilePath $bar -ArgumentList '--show' } } else { Log 'no bar on this computer; nothing to start' }
    Log 'reload finished'
}
catch { Log ('reload stopped by an error: ' + $_.Exception.Message) }
finally { try { Remove-Item $stamp -Force -ErrorAction SilentlyContinue } catch {} }

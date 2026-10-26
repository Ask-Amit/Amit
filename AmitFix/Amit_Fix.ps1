# Amit Fix - one small program that does whatever the person chose on the Amit Fix page.
# Version 1.00. Plain PowerShell 5.1, ASCII only, no administrator rights needed (everything Amit installs is per-user).
#
#   -Actions  a comma list of: check, restart, voice-off, voice-on, voice-reset, startup-off, startup-on,
#             tidy, forget-data, shortcuts-remove, remove, reinstall
#   -Yes      do not ask "are you sure" (the exe and the .cmd have already asked)
#   -Pause    keep the window open at the end so the person can read the result
#
# Safe by design: it only touches what Amit itself created (see the "What is on my computer" tab of the Amit Fix page for the full list).
# It never touches documents, the AmitInbox folder, Edge, or Chrome. Node.js and Claude Code CLI (which the installer adds only when missing, for AmitBooks receipts) are
# deliberately left in place because they are general-purpose; the person removes them in Windows Settings > Apps if they wish. It never closes a program Amit did not start.
# Test hooks (used only by the tests, never by a person): AMIT_FIX_HOME replaces %LOCALAPPDATA%, AMIT_FIX_DESKTOP replaces the desktop,
# AMIT_FIX_NOREG=1 skips every registry change, AMIT_FIX_NOSTOP=1 skips stopping programs.

param([string]$Actions = "check", [switch]$Yes, [switch]$Pause)

$ErrorActionPreference = "Continue"
$local    = if ($env:AMIT_FIX_HOME) { $env:AMIT_FIX_HOME } else { $env:LOCALAPPDATA }
$home_    = Join-Path $local "AmitComputerHealth"
$watchers = Join-Path $home_ "Watchers"
$desktop  = if ($env:AMIT_FIX_DESKTOP) { $env:AMIT_FIX_DESKTOP } else { [Environment]::GetFolderPath("Desktop") }
$tempInst = Join-Path ([IO.Path]::GetTempPath()) "AmitInstallerFiles"
$runKey   = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$protoKeys = @("HKCU:\Software\Classes\amit-tracker", "HKCU:\Software\Classes\amit-helper")
$shortcuts = @("Amit.url", "Amit Live.lnk", "Amit Tracker.lnk")
$installerUrl = "https://raw.githubusercontent.com/Ask-Amit/Amit/main/ComputerHealth/install-Amit.exe"
$noReg  = ($env:AMIT_FIX_NOREG -eq "1")
$noStop = ($env:AMIT_FIX_NOSTOP -eq "1")
$list = @($Actions -split "[,\s]+" | Where-Object { $_ })
$global:AmitFixResults = New-Object System.Collections.ArrayList
$procPattern = 'amit_bridge_server\.ps1|activity_watcher2\.ps1|resource_watcher\.ps1|diagnostics_watcher\.ps1|app_behavior_watcher\.ps1|amit_mobile_watcher\.ps1|install_snapshot_watcher\.ps1|ask_watcher'

function Say($t, $c = "Gray") { Write-Host $t -ForegroundColor $c }
function Step($t) { Write-Host ""; Write-Host ("  " + $t) -ForegroundColor Yellow }
function Note($ok, $t) { [void]$global:AmitFixResults.Add([pscustomobject]@{ Ok = [bool]$ok; Text = $t }); if ($ok) { Say ("    [ OK ] " + $t) "Green" } else { Say ("    [ !! ] " + $t) "Red" } }

function Get-AmitProcesses {
    $found = @()
    try { $found += @(Get-Process -Name "AmitTracker", "AmitSensorReader" -ErrorAction SilentlyContinue) } catch {}
    try {
        $found += @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -match $procPattern -and $_.CommandLine -notmatch 'Amit_Fix' })
        $found += @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like '*AmitComputerHealth*whisper_profile*' })
    } catch {}
    return $found
}

function Stop-Amit {
    if ($noStop) { return }
    try { Get-Process -Name "AmitTracker", "AmitSensorReader" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}
    try {
        Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -match $procPattern -and $_.CommandLine -notmatch 'Amit_Fix' } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    } catch {}
    # only the small Edge window Amit opened for listening (its own private profile) - never your own Edge
    try {
        Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like '*AmitComputerHealth*whisper_profile*' } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    } catch {}
    Start-Sleep -Seconds 2
}

function Remove-Tree($path) {
    if (-not (Test-Path $path)) { return $true }
    for ($i = 0; $i -lt 4; $i++) {
        try { Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction Stop } catch {}
        if (-not (Test-Path $path)) { return $true }
        Start-Sleep -Milliseconds 700
    }
    return (-not (Test-Path $path))
}

function Is-Installed { return (Test-Path (Join-Path $watchers "amit_bridge_server.ps1")) }

function Start-Amit {
    $run = Join-Path $watchers "Run_AmitTracker.ps1"
    if (-not (Test-Path $run)) { return $false }
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$run`" -NoOpenDashboard" -WindowStyle Hidden
    return $true
}

function Set-SettingValue($name, $value) {
    $file = Join-Path $home_ "whisper_settings.txt"
    $lines = @(); if (Test-Path $file) { $lines = @(Get-Content $file) }
    $done = $false
    $out = foreach ($l in $lines) { if ($l -match ("^" + $name + "=")) { $done = $true; "$name=$value" } else { $l } }
    if (-not $done) { $out = @($out) + "$name=$value" }
    if (-not (Test-Path $home_)) { New-Item -ItemType Directory -Force $home_ | Out-Null }
    Set-Content -Path $file -Value $out -Encoding ASCII
}

# ---------------------------------------------------------------- the actions
function Do-Check {
    Step "Looking at what is on this computer (nothing is changed)"
    if (Is-Installed) { Say ("    Amit's helper is installed (" + $watchers + ")") "Green" } else { Say "    Amit's helper is not installed on this computer." "Yellow" }
    $ver = Join-Path $watchers "installed_version.txt"
    if (Test-Path $ver) { Say ("    version " + (Get-Content $ver -Raw).Trim()) }
    $n = @(Get-AmitProcesses).Count
    Say ("    running now: " + $(if ($n -gt 0) { "yes ($n small program(s))" } else { "no" }))
    $rk = $null; try { $rk = (Get-ItemProperty -Path $runKey -Name "AmitComputerHealth" -ErrorAction Stop).AmitComputerHealth } catch {}
    Say ("    starts with Windows: " + $(if ($rk) { "yes" } else { "no" }))
    $f = Join-Path $home_ "whisper_settings.txt"
    if (Test-Path $f) { $e = (Get-Content $f | Where-Object { $_ -match '^enabled=' } | Select-Object -First 1); Say ("    voice typing (Whisper mode): " + $(if ($e -eq 'enabled=0') { "turned off" } else { "on" })) }
    foreach ($s in $shortcuts) { if (Test-Path (Join-Path $desktop $s)) { Say ("    desktop shortcut: " + $s) } }
}

function Do-Restart {
    Step "Restarting Amit's helper"
    if (-not (Is-Installed)) { Note $false "Amit's helper is not installed here, so there is nothing to restart. Use Fresh start to install it."; return }
    Stop-Amit
    $ok = Start-Amit
    Note $ok $(if ($ok) { "Amit's helper was stopped and started again. Give it about 10 seconds." } else { "Could not start it (a file is missing). Use Fresh start." })
}

function Do-Voice($on) {
    Step $(if ($on) { "Turning voice typing on" } else { "Turning voice typing off" })
    if (-not (Is-Installed)) { Note $false "Amit's helper is not installed here."; return }
    Set-SettingValue "enabled" $(if ($on) { "1" } else { "0" })
    Stop-Amit; [void](Start-Amit)
    Note $true $(if ($on) { "Voice typing is on. Hold your mouse button where you want words typed." } else { "Voice typing is off. The mouse works normally everywhere; nothing is listening." })
}

function Do-VoiceReset {
    Step "Resetting voice typing to how it came"
    Stop-Amit
    $a = Remove-Tree (Join-Path $home_ "whisper_profile")
    foreach ($f in @("whisper_settings.txt", "whisper.log", "whisper_box_test.png")) { Remove-Item -LiteralPath (Join-Path $home_ $f) -Force -ErrorAction SilentlyContinue }
    Note ($a -and -not (Test-Path (Join-Path $home_ "whisper_settings.txt"))) "Voice typing settings and its private listening window were cleared. It starts fresh and asks for the microphone once."
    if (Is-Installed) { [void](Start-Amit) }
}

function Do-Startup($on) {
    Step $(if ($on) { "Making Amit start with Windows" } else { "Stopping Amit from starting with Windows" })
    if ($noReg) { Note $true "(test: registry not touched)"; return }
    if ($on) {
        $exe = Join-Path $watchers "AmitTracker.exe"
        if (-not (Test-Path $exe)) { Note $false "Amit is not installed here."; return }
        Set-ItemProperty -Path $runKey -Name "AmitComputerHealth" -Value ("`"$exe`" --tray-only --at-logon")
        Note $true "Amit will start when you sign in to Windows."
    } else {
        Remove-ItemProperty -Path $runKey -Name "AmitComputerHealth" -ErrorAction SilentlyContinue
        $still = $null; try { $still = (Get-ItemProperty -Path $runKey -Name "AmitComputerHealth" -ErrorAction Stop).AmitComputerHealth } catch {}
        Note (-not $still) "Amit will not start with Windows any more (it still works when you open it yourself)."
    }
}

function Do-Tidy {
    Step "Tidying (logs and the private listening window's saved files)"
    Stop-Amit
    $a = Remove-Tree (Join-Path $home_ "whisper_profile")
    foreach ($f in @("whisper.log", "ask_watcher.log", "whisper_box_test.png")) { Remove-Item -LiteralPath (Join-Path $home_ $f) -Force -ErrorAction SilentlyContinue }
    Get-ChildItem -Path $watchers -Filter "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Remove-Tree $tempInst | Out-Null
    Note $a "Old logs and saved listening-window files were cleared. Your settings were kept."
    if (Is-Installed) { [void](Start-Amit) }
}

function Do-ForgetData {
    Step "Forgetting the readings Amit kept on this computer"
    Stop-Amit
    $ok = Remove-Tree (Join-Path $home_ "data")
    foreach ($f in @("device_id.txt")) { Remove-Item -LiteralPath (Join-Path $watchers $f) -Force -ErrorAction SilentlyContinue }
    Note $ok "The readings and history stored on this computer were erased. (What you saved in your online account stays there.)"
    if (Is-Installed) { [void](Start-Amit) }
}

function Do-Shortcuts {
    Step "Removing Amit's desktop shortcuts"
    foreach ($s in $shortcuts) { Remove-Item -LiteralPath (Join-Path $desktop $s) -Force -ErrorAction SilentlyContinue }
    $left = @($shortcuts | Where-Object { Test-Path (Join-Path $desktop $_) })
    Note ($left.Count -eq 0) "Desktop shortcuts removed."
}

function Do-Remove {
    Step "Removing Amit from this computer"
    Say "    1. closing Amit's small programs..."
    Stop-Amit
    Note (@(Get-AmitProcesses).Count -eq 0) "None of Amit's programs are running"
    Say "    2. turning off start-with-Windows and Amit's links..."
    if (-not $noReg) {
        Remove-ItemProperty -Path $runKey -Name "AmitComputerHealth" -ErrorAction SilentlyContinue
        foreach ($k in $protoKeys) { Remove-Item -Path $k -Recurse -Force -ErrorAction SilentlyContinue }
        $rk = $null; try { $rk = (Get-ItemProperty -Path $runKey -Name "AmitComputerHealth" -ErrorAction Stop).AmitComputerHealth } catch {}
        Note (-not $rk) "Amit no longer starts with Windows"
        Note (-not (Test-Path $protoKeys[0]) -and -not (Test-Path $protoKeys[1])) "Amit's two web-link handlers are gone from Windows"
    } else { Note $true "(test: registry not touched)" }
    Say "    3. removing the desktop shortcuts..."
    foreach ($s in $shortcuts) { Remove-Item -LiteralPath (Join-Path $desktop $s) -Force -ErrorAction SilentlyContinue }
    Note (@($shortcuts | Where-Object { Test-Path (Join-Path $desktop $_) }).Count -eq 0) "Desktop shortcuts are gone"
    Say "    4. deleting Amit's files and saved data..."
    $a = Remove-Tree $home_
    $b = Remove-Tree $tempInst
    Note $a "Amit's folder and everything saved in it is deleted"
    Note $b "Installer leftovers in the temporary folder are deleted"
    Say "    5. checking it is really gone..."
    $left = @(Get-AmitProcesses).Count
    Note ($left -eq 0) "Nothing of Amit is running"
    Say ""
    Say "    Left alone on purpose: Amit himself (he lives online; sign in any time), your documents, the AmitInbox folder if you made one, your Amit account online, Edge and Chrome." "DarkGray"
    Say "    Also left in place: Node.js and Claude Code (the installer adds them only if missing, for AmitBooks receipts). Remove them in Windows Settings > Apps if you wish." "DarkGray"
}

function Do-Reinstall {
    Step "Getting the newest Amit installer"
    try { Start-Process $installerUrl; Note $true "Your browser is downloading the newest installer. Open it when it finishes." }
    catch { Note $false "Could not open the browser. Go to https://ask-amit.github.io/Amit/AmitFix/AmitFix.html and press Fresh start." }
}

# ---------------------------------------------------------------- run
Clear-Host
Write-Host ""
Write-Host "  Amit Fix" -ForegroundColor Yellow
Write-Host "  You choose; this does only what you chose. Nothing leaves your computer." -ForegroundColor DarkGray

$needsSure = ($list -contains "remove") -or ($list -contains "forget-data") -or ($list -contains "voice-reset")
if ($needsSure -and -not $Yes) {
    Write-Host ""
    Write-Host ("  You chose: " + ($list -join ", ")) -ForegroundColor White
    $a = Read-Host "  Type YES to go ahead, anything else to cancel"
    if ($a -ne "YES" -and $a -ne "yes") { Write-Host "  Cancelled. Nothing was changed." -ForegroundColor Green; if ($Pause) { Read-Host "  Press Enter to close" | Out-Null }; exit 0 }
}

foreach ($act in $list) {
    switch ($act) {
        "check"            { Do-Check }
        "restart"          { Do-Restart }
        "voice-off"        { Do-Voice $false }
        "voice-on"         { Do-Voice $true }
        "voice-reset"      { Do-VoiceReset }
        "startup-off"      { Do-Startup $false }
        "startup-on"       { Do-Startup $true }
        "tidy"             { Do-Tidy }
        "forget-data"      { Do-ForgetData }
        "shortcuts-remove" { Do-Shortcuts }
        "remove"           { Do-Remove }
        "reinstall"        { Do-Reinstall }
        default            { Say ("  (unknown action skipped: " + $act + ")") "DarkYellow" }
    }
}

$bad = @($global:AmitFixResults | Where-Object { -not $_.Ok }).Count
Write-Host ""
if ($bad -eq 0) { Write-Host "  All done. Everything you chose checked out." -ForegroundColor Green }
else { Write-Host ("  Finished, but " + $bad + " thing(s) above need a look. You can run this again, or ask Amit on the Amit Fix page.") -ForegroundColor Yellow }
if ($list -contains "remove" -and $bad -eq 0) {
    Write-Host ""
    Write-Host "  Thank you for trying Amit. Our heart was only ever to walk alongside you." -ForegroundColor Yellow
    Write-Host "  The door stays open. Come back any time:  ask-amit.github.io/Amit" -ForegroundColor Yellow
}
if ($Pause) { Write-Host ""; Read-Host "  Press Enter to close" | Out-Null }
exit $(if ($bad -eq 0) { 0 } else { 1 })

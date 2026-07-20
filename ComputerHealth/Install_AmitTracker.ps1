# Amit Computer Health - Installer
# Run once. Sets up everything needed so the online dashboard can talk to this
# computer: copies (or downloads) the watcher/bridge scripts and the
# self-contained AmitSensorReader.exe to a permanent local folder, and
# creates a "Run Amit Tracker" desktop shortcut that starts tracking and
# opens the dashboard in one click. Nothing is registered to run
# automatically at login - tracking only ever starts when that shortcut is
# used.
#
# Safe to run again later - it checks what's already installed and skips
# steps that are already done, unless -Force is passed.
#
# Works two ways: if run from inside a full copy of the ComputerHealth folder
# (the sibling scripts sitting right next to this one), it copies from there.
# If run standalone - e.g. downloaded as this one file from the dashboard's
# "Download the Installer" link - it fetches every other required file
# directly from GitHub instead, since nothing else exists locally yet.

param([switch]$Force)

$installDir = "$env:LOCALAPPDATA\AmitComputerHealth"
$watcherInstallDir = "$installDir\Watchers"
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$githubRawBase = "https://raw.githubusercontent.com/Ask-Amit/Amit/main/ComputerHealth"
$dashboardUrl = "https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html"

# Same fix already applied to the compiled AmitInstaller.exe - Windows
# PowerShell 5.1's Invoke-WebRequest inherits .NET's default security
# protocol, which on some systems doesn't include TLS 1.2, causing GitHub
# downloads to time out or fail outright ("The operation has timed out" /
# "Could not create SSL/TLS secure channel"). Force it explicitly.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Amit Computer Health Installer"
Write-Host "Install location: $installDir"
Write-Host ""

# --- Step 1: copy watcher/bridge scripts ---
$alreadyInstalled = (Test-Path "$watcherInstallDir\amit_bridge_server.ps1") -and -not $Force
if ($alreadyInstalled) {
    Write-Host "[1/4] Watcher scripts already installed - skipping (use -Force to reinstall)."
} else {
    Write-Host "[1/4] Installing watcher scripts..."
    New-Item -ItemType Directory -Path $watcherInstallDir -Force | Out-Null
    $filesToCopy = @(
        "amit_bridge_server.ps1", "ComputerHealth_Dashboard.html",
        "activity_watcher2.ps1", "resource_watcher.ps1", "diagnostics_watcher.ps1",
        "app_behavior_watcher.ps1", "install_snapshot_watcher.ps1",
        "Run_AmitTracker.ps1", "AmitTracker.exe", "AmitSensorReader.exe"
    )
    foreach ($f in $filesToCopy) {
        $src = "$scriptDir\$f"
        if (Test-Path $src) {
            Copy-Item $src "$watcherInstallDir\$f" -Force
        } else {
            try {
                Invoke-WebRequest -Uri "$githubRawBase/$f" -OutFile "$watcherInstallDir\$f" -TimeoutSec 20 -ErrorAction Stop
            } catch {
                Write-Host "  Warning: could not get $f (checked locally and from GitHub) - $($_.Exception.Message)"
            }
        }
    }
    Write-Host "  Done."
}

# --- Step 2: sensor reading ---
# PERMANENT FIX (2026-07-19): this used to hunt down, download, and manage a
# separate LibreHardwareMonitor GUI installation (~80 lines - dedup checks,
# GitHub release fetching, path recording) because the dashboard needed to
# talk to that app's own "Remote Web Server" toggle. That toggle proved
# unreliable on a real deployment - a real user's saved config claimed it was
# on and it silently wasn't, with no way to force it from outside the GUI.
# AmitSensorReader.exe (copied in Step 1 above) reads the exact same sensors
# by linking straight to LibreHardwareMonitor's own open-source library and
# is fully self-contained (its own .NET runtime, the library itself, and
# every dependency bundled into that one file) - proven live by hiding
# LibreHardwareMonitor's install folder entirely and confirming it still
# read real sensors. Nothing left to find, download, or manage here.
Write-Host "[2/4] Sensor reading is self-contained in AmitSensorReader.exe - nothing separate to install."

# --- Step 3: (deliberately no Task Scheduler / login auto-start) ---
# The bridge server is started on demand by the "Run Amit Tracker" desktop
# shortcut instead of silently launching at every Windows login. This means
# a 1-2 second delay the first time you click the shortcut each session,
# in exchange for nothing running in the background until you ask for it.
Write-Host "[3/4] Skipping auto-start-at-login by design - the desktop shortcut starts everything on demand instead."

# --- Step 4: desktop shortcut ---
# (Run_AmitTracker.ps1 itself is installed in Step 1 - AmitTracker.exe finds
# it next to itself at runtime, no path needs tracking here.)
$trackerExePath = "$watcherInstallDir\AmitTracker.exe"

# Icon - placeholder (gold "A" on dark circle, matches the dashboard's
# color scheme), swap the .ico file later without touching this script.
$iconDest = "$watcherInstallDir\amit_icon.ico"
$iconSrc = "$scriptDir\amit_icon.ico"
if (Test-Path $iconSrc) {
    Copy-Item $iconSrc $iconDest -Force -ErrorAction SilentlyContinue
} elseif (-not (Test-Path $iconDest) -or $Force) {
    try { Invoke-WebRequest -Uri "$githubRawBase/amit_icon.ico" -OutFile $iconDest -TimeoutSec 20 -ErrorAction Stop } catch {}
}
$iconLocation = if (Test-Path $iconDest) { "$iconDest,0" } else { "shell32.dll,137" }

$hubUrl = "https://ask-amit.github.io/Amit/Hub/amit-hub.html"
$desktopPath = [Environment]::GetFolderPath("Desktop")
# A .lnk shortcut (WScript.Shell CreateShortcut) does not reliably support a
# plain web URL as its target - TargetPath silently ends up empty. Windows'
# real mechanism for a desktop icon that opens a website is a .url file
# (Internet Shortcut), a simple INI-format text file - not a COM object.
$shortcutPath = "$desktopPath\Amit.url"
if ((Test-Path $shortcutPath) -and -not $Force) {
    Write-Host "[3/4] Desktop shortcut already exists - skipping."
} else {
    Write-Host "[3/4] Creating desktop shortcut..."
    $urlFileContent = @"
[InternetShortcut]
URL=$hubUrl
IconFile=$iconDest
IconIndex=0
"@
    Set-Content -Path $shortcutPath -Value $urlFileContent -Encoding ASCII
    Write-Host "  Shortcut created on your desktop: 'Amit' - opens the Hub."
}

# Second desktop shortcut - "Amit Tracker" launches tracking directly,
# bypassing the browser entirely (no amit-tracker:// protocol involved), so
# it can never be affected by a browser silently remembering a blocked
# permission decision (real bug hit live 2026-07-13 - Ryan: "that can't
# happen with the deployed version, we need a workaround"). Unlike the Hub
# shortcut above, this targets a local .exe, so a real .lnk (WScript.Shell
# CreateShortcut) is the correct mechanism here - the .lnk-can't-hold-a-web-
# URL problem noted above doesn't apply to a local file target.
$trackerShortcutPath = "$desktopPath\Amit Tracker.lnk"
if ((Test-Path $trackerShortcutPath) -and -not $Force) {
    Write-Host "[3/4] 'Amit Tracker' desktop shortcut already exists - skipping."
} else {
    Write-Host "[3/4] Creating 'Amit Tracker' desktop shortcut..."
    try {
        $wshShell = New-Object -ComObject WScript.Shell
        $trackerShortcut = $wshShell.CreateShortcut($trackerShortcutPath)
        $trackerShortcut.TargetPath = $trackerExePath
        $trackerShortcut.WorkingDirectory = $watcherInstallDir
        $trackerShortcut.IconLocation = $iconLocation
        $trackerShortcut.Description = "Start Amit's computer tracker directly - no browser involved"
        $trackerShortcut.Save()
        Write-Host "  Shortcut created on your desktop: 'Amit Tracker' - starts tracking directly."
    } catch {
        Write-Host "  Could not create the 'Amit Tracker' shortcut ($($_.Exception.Message)) - you can still start tracking from the dashboard's Launch Tracker button."
    }
}

# --- Step 5: register amit-tracker:// so the dashboard's Launch Tracker
# button can start local tracking without hunting for a desktop icon ---
Write-Host "[4/4] Registering amit-tracker:// link handler..."
try {
    # Points at AmitTracker.exe - a small named wrapper with its own file
    # metadata (FileDescription/ProductName = "Amit Tracker") - instead of
    # powershell.exe directly. Some browsers show the launched program's own
    # name in the permission dialog rather than this registry description,
    # so this is what makes "Amit Tracker" show up either way.
    New-Item -Path "HKCU:\Software\Classes\amit-tracker" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker" -Name "(Default)" -Value "URL:Amit Tracker"
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker" -Name "URL Protocol" -Value ""
    New-Item -Path "HKCU:\Software\Classes\amit-tracker\DefaultIcon" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker\DefaultIcon" -Name "(Default)" -Value $iconDest
    New-Item -Path "HKCU:\Software\Classes\amit-tracker\shell\open\command" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker\shell\open\command" -Name "(Default)" -Value "`"$trackerExePath`""
    Write-Host "  Registered. Links starting with amit-tracker:// will now launch the tracker (Windows will always ask permission first - by design, not something we can silence)."
} catch {
    Write-Host "  Could not register the link handler ($($_.Exception.Message)) - the dashboard's Launch Tracker button won't work yet, but the Amit desktop shortcut and manual tracking still will."
}

Write-Host ""
Write-Host "Install complete."
Write-Host "Double-click 'Amit' on your desktop to open the Hub. From there, Computer Health has its own Launch Tracker button."
Write-Host "Dashboard: $dashboardUrl"

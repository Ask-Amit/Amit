# Amit Computer Health - Installer
# Run once. Sets up everything needed so the online dashboard can talk to this
# computer: copies (or downloads) the watcher/bridge scripts to a permanent
# local folder, finds or fetches LibreHardwareMonitor, and creates a
# "Run Amit Tracker" desktop shortcut that starts tracking and opens the
# dashboard in one click. Nothing is registered to run automatically at
# login - tracking only ever starts when that shortcut is used.
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
$lhmInstallDir = "$installDir\LibreHardwareMonitor"
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$githubRawBase = "https://raw.githubusercontent.com/Ask-Amit/Amit/main/ComputerHealth"
$dashboardUrl = "https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html"

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
        "app_behavior_watcher.ps1", "install_snapshot_watcher.ps1"
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

# --- Step 2: LibreHardwareMonitor ---
# Check every place it could reasonably already exist before downloading a
# second copy - this is the exact bug that caused two instances to run
# simultaneously and confused a real user during testing (2026-07-12).
$lhmSearchPaths = @(
    "$lhmInstallDir\LibreHardwareMonitor.exe",
    "$env:USERPROFILE\Downloads\LibreHardwareMonitor\LibreHardwareMonitor.exe",
    "$env:ProgramFiles\LibreHardwareMonitor\LibreHardwareMonitor.exe",
    "${env:ProgramFiles(x86)}\LibreHardwareMonitor\LibreHardwareMonitor.exe"
)
$existingLhm = $lhmSearchPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($existingLhm -and -not $Force) {
    Write-Host "[2/4] LibreHardwareMonitor already found at: $existingLhm - using that, not downloading another copy."
} else {
    Write-Host "[2/4] No existing LibreHardwareMonitor found. Fetching it (open-source, official GitHub releases)..."
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/LibreHardwareMonitor/LibreHardwareMonitor/releases/latest" -Headers @{ "User-Agent" = "AmitComputerHealth" } -TimeoutSec 15
        $asset = $release.assets | Where-Object { $_.name -like "*.zip" } | Select-Object -First 1
        if ($asset) {
            $zipPath = "$env:TEMP\lhm_download.zip"
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -TimeoutSec 60
            New-Item -ItemType Directory -Path $lhmInstallDir -Force | Out-Null
            Expand-Archive -Path $zipPath -DestinationPath $lhmInstallDir -Force
            Remove-Item $zipPath -ErrorAction SilentlyContinue
            Write-Host "  LibreHardwareMonitor installed."
        } else {
            Write-Host "  Could not find a downloadable release - skipping. Full sensor data (temps/voltages/fans) won't be available until this is installed manually."
        }
    } catch {
        Write-Host "  Could not download LibreHardwareMonitor ($($_.Exception.Message)) - skipping. Resource/diagnostic tracking will still work, just without temperature/voltage/fan sensor data."
    }
}

# Record exactly where LibreHardwareMonitor actually lives (existing or freshly
# installed) so the bridge server reads this instead of guessing from a fixed
# list of paths - this is what makes the "don't duplicate" fix actually stick.
$finalLhmPath = if ($existingLhm) { $existingLhm } elseif (Test-Path "$lhmInstallDir\LibreHardwareMonitor.exe") { "$lhmInstallDir\LibreHardwareMonitor.exe" } else { "" }
$finalLhmPath | Set-Content -Path "$watcherInstallDir\lhm_path.txt" -Encoding utf8

# --- Step 3: (deliberately no Task Scheduler / login auto-start) ---
# The bridge server is started on demand by the "Run Amit Tracker" desktop
# shortcut instead of silently launching at every Windows login. This means
# a 1-2 second delay the first time you click the shortcut each session,
# in exchange for nothing running in the background until you ask for it.
Write-Host "[3/4] Skipping auto-start-at-login by design - the desktop shortcut starts everything on demand instead."

# --- Step 4: desktop shortcut ---
$launcherPath = "$watcherInstallDir\Run_AmitTracker.ps1"
$launcherSrc = "$scriptDir\Run_AmitTracker.ps1"
if (Test-Path $launcherSrc) {
    Copy-Item $launcherSrc $launcherPath -Force -ErrorAction SilentlyContinue
} elseif (-not (Test-Path $launcherPath) -or $Force) {
    try { Invoke-WebRequest -Uri "$githubRawBase/Run_AmitTracker.ps1" -OutFile $launcherPath -TimeoutSec 20 -ErrorAction Stop } catch {}
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = "$desktopPath\Run Amit Tracker.lnk"
if ((Test-Path $shortcutPath) -and -not $Force) {
    Write-Host "[4/4] Desktop shortcut already exists - skipping."
} else {
    Write-Host "[4/4] Creating desktop shortcut..."
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
    $shortcut.WorkingDirectory = $watcherInstallDir
    $shortcut.IconLocation = "shell32.dll,137"
    $shortcut.Description = "Start Amit Computer Health tracking and open the dashboard"
    $shortcut.Save()
    Write-Host "  Shortcut created on your desktop: 'Run Amit Tracker'"
}

Write-Host ""
Write-Host "Install complete."
Write-Host "Double-click 'Run Amit Tracker' on your desktop any time to start tracking and open the dashboard."
Write-Host "Dashboard: $dashboardUrl"

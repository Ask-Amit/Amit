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
    Write-Host "[1/5] Watcher scripts already installed - skipping (use -Force to reinstall)."
} else {
    Write-Host "[1/5] Installing watcher scripts..."
    New-Item -ItemType Directory -Path $watcherInstallDir -Force | Out-Null
    $filesToCopy = @(
        "amit_bridge_server.ps1", "ComputerHealth_Dashboard.html",
        "activity_watcher2.ps1", "resource_watcher.ps1", "diagnostics_watcher.ps1",
        "app_behavior_watcher.ps1", "install_snapshot_watcher.ps1",
        "Run_AmitTracker.ps1", "AmitTracker.exe"
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
#
# A file existing at the right name/path isn't enough on its own - a
# leftover empty file, a truncated download, or an unrelated file someone
# renamed would all pass a plain Test-Path check. Verify the file's actual
# embedded metadata genuinely identifies it as LibreHardwareMonitor (same
# technique used to name AmitTracker.exe) and that its size is reasonable,
# not a 0-byte or corrupted leftover. This can't prove the program has ever
# been run - nothing short of deep OS forensics can - but it does prove
# it's a real, complete, launchable copy, which is what actually matters.
function Test-IsRealLibreHardwareMonitor($path) {
    if (-not (Test-Path $path)) { return $false }
    $file = Get-Item $path
    if ($file.Length -lt 10KB) { return $false }
    try {
        $info = $file.VersionInfo
        return ($info.ProductName -like "*LibreHardwareMonitor*" -or $info.FileDescription -like "*LibreHardwareMonitor*" -or $info.CompanyName -like "*LibreHardwareMonitor*")
    } catch { return $false }
}

# If it's already running right now, that's the one source of truth that
# can't be fooled by a moved or deleted file - a person who cleans out their
# Downloads folder regularly (a normal habit) would otherwise cause a
# perfectly working, currently-running LibreHardwareMonitor to look "not
# installed" and get duplicated. Check the live process first.
$runningLhm = Get-Process -Name "LibreHardwareMonitor" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($runningLhm -and $runningLhm.Path -and (Test-IsRealLibreHardwareMonitor $runningLhm.Path)) {
    $existingLhm = $runningLhm.Path
    Write-Host "[2/5] LibreHardwareMonitor is already running (from $existingLhm) - using that."
} else {
    $lhmSearchPaths = @(
        "$lhmInstallDir\LibreHardwareMonitor.exe",
        "$env:USERPROFILE\Downloads\LibreHardwareMonitor\LibreHardwareMonitor.exe",
        "$env:ProgramFiles\LibreHardwareMonitor\LibreHardwareMonitor.exe",
        "${env:ProgramFiles(x86)}\LibreHardwareMonitor\LibreHardwareMonitor.exe"
    )
    $existingLhm = $lhmSearchPaths | Where-Object { Test-IsRealLibreHardwareMonitor $_ } | Select-Object -First 1
}

# Once found ANYWHERE (even our own managed folder), make sure our own
# managed copy exists too - so a future run never depends on wherever this
# one happened to be found today. If someone wipes their Downloads folder
# next week, our own copy (never touched by that cleanup) is still there.
if ($existingLhm -and -not (Test-IsRealLibreHardwareMonitor "$lhmInstallDir\LibreHardwareMonitor.exe")) {
    $sourceLhmDir = Split-Path -Parent $existingLhm
    if ($sourceLhmDir -ne $lhmInstallDir) {
        Write-Host "  Copying LibreHardwareMonitor to Amit's own managed folder so future runs don't depend on $sourceLhmDir still existing..."
        New-Item -ItemType Directory -Path $lhmInstallDir -Force | Out-Null
        Copy-Item "$sourceLhmDir\*" $lhmInstallDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
if (Test-IsRealLibreHardwareMonitor "$lhmInstallDir\LibreHardwareMonitor.exe") {
    $existingLhm = "$lhmInstallDir\LibreHardwareMonitor.exe"
}

if ($existingLhm -and -not $Force) {
    Write-Host "[2/5] LibreHardwareMonitor already found at: $existingLhm - using that, not downloading another copy."
} else {
    Write-Host "[2/5] No existing LibreHardwareMonitor found. Fetching it (open-source, official GitHub releases)..."
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
Write-Host "[3/5] Skipping auto-start-at-login by design - the desktop shortcut starts everything on demand instead."

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
    Write-Host "[4/5] Desktop shortcut already exists - skipping."
} else {
    Write-Host "[4/5] Creating desktop shortcut..."
    $urlFileContent = @"
[InternetShortcut]
URL=$hubUrl
IconFile=$iconDest
IconIndex=0
"@
    Set-Content -Path $shortcutPath -Value $urlFileContent -Encoding ASCII
    Write-Host "  Shortcut created on your desktop: 'Amit' - opens the Hub."
}

# --- Step 5: register amit-tracker:// so the dashboard's Launch Tracker
# button can start local tracking without hunting for a desktop icon ---
Write-Host "[5/5] Registering amit-tracker:// link handler..."
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

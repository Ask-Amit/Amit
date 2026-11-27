# Amit Computer Health - Installer
# Run once. Sets up everything needed so the online dashboard can talk to this
# computer: copies (or downloads) the watcher/bridge scripts and the
# self-contained AmitSensorReader.exe to a permanent local folder, and
# creates a "Run Amit Tracker" desktop shortcut that starts tracking and
# opens the dashboard in one click. Since 2026-10-20 it also registers a
# per-user startup entry so Amit's helper starts when Windows does
# (pass -NoAutoStart to skip that).
#
# Safe to run again later - it checks what's already installed and skips
# steps that are already done, unless -Force is passed.
#
# UPDATING (2026-10-26): the installer program passes -InstallerVersion (its own version). A version note is kept next to the installed files
# (installed_version.txt). If an install already exists and its recorded version is OLDER than the installer's (or no version is recorded,
# which is every install made before this), the running helper is stopped, every program file is replaced with the new one, and the helper is
# started again by the installer program. Before this, running a newer installer over an old install silently skipped the copy and left the
# old program in place. Settings (Whisper mode choices, device id) live outside the replaced files and are kept.
#
# Works two ways: if run from inside a full copy of the ComputerHealth folder
# (the sibling scripts sitting right next to this one), it copies from there.
# If run standalone - e.g. downloaded as this one file from the dashboard's
# "Download the Installer" link - it fetches every other required file
# directly from GitHub instead, since nothing else exists locally yet.

# -WithClaude (added 2026-11-11, Ryan's direct instruction): Steps 1b and 1c (Node.js, the Claude Code CLI and the offer to connect a Claude account)
# are OFF by default (the installer program turns them ON again from 5.43, 2026-11-26). The Helper (bar, voice, Read, Show Amit, the updater) needs none of them; for now the receipt processing, the phone watcher and
# Ask Amit answering all run through Ryan's own Claude account. The steps are kept, not deleted, so a later release can ask the person to set them up.
param([switch]$Force, [switch]$NoAutoStart, [switch]$WithClaude, [string]$InstallerVersion = "")

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
$versionFile = "$watcherInstallDir\installed_version.txt"
$isInstalled = Test-Path "$watcherInstallDir\amit_bridge_server.ps1"
$installedVersion = ""
if (Test-Path $versionFile) { try { $installedVersion = (Get-Content $versionFile -Raw).Trim() } catch {} }
$upgrading = $false
if ($isInstalled -and $InstallerVersion -ne "") {
    try { $upgrading = ($installedVersion -eq "") -or ([version]$installedVersion -lt [version]$InstallerVersion) } catch { $upgrading = ($installedVersion -ne $InstallerVersion) }
}
$redo = $Force -or $upgrading     # replace shortcuts and settings entries too, not only the program files

# Stops Amit's helper (the tray program, the bridge, the watchers and the Whisper window) so its files can be replaced. Only this person's
# own Amit programs; never the installer itself ($PID).
function Stop-AmitHelper([string]$CommandPattern = 'amit_bridge_server\.ps1|activity_watcher2\.ps1|resource_watcher\.ps1|diagnostics_watcher\.ps1|app_behavior_watcher\.ps1|amit_mobile_watcher\.ps1|install_snapshot_watcher\.ps1', [string]$TrayName = 'AmitTracker', [string]$EdgeMatch = '*AmitComputerHealth*whisper_profile*') {
    if (-not $PSBoundParameters.ContainsKey('CommandPattern')) {
        # an Amit Coder job that is running is never cut off without waiting for it (up to 10 minutes)
        $coderEnd = (Get-Date).AddMinutes(10); $told = $false
        while ((Get-Date) -lt $coderEnd) {
            $working = $false
            try { $ce = Get-Content (Join-Path $env:LOCALAPPDATA 'AmitComputerHealth\AmitCoder\engine.json') -Raw -ErrorAction Stop | ConvertFrom-Json; $working = ($ce.busy -eq $true -and ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() - [int64]$ce.at) -lt 15000) } catch {}
            if (-not $working) { break }
            if (-not $told) { Write-Host "  Amit Coder is in the middle of a job. Waiting for it to finish (answer any question it is asking)..."; $told = $true }
            Start-Sleep -Seconds 3
        }
    }
    Write-Host "  Stopping the running Amit helper so its files can be replaced..."
    try { Get-Process -Name $TrayName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}
    try {
        Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -match $CommandPattern } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    } catch {}
    try {
        Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like $EdgeMatch } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    } catch {}
    if (-not $PSBoundParameters.ContainsKey('CommandPattern')) {
        # the coding engine and the bar are replaced too (the bar is started again after the files are in place)
        try { Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'amit_coder_engine\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } } catch {}
        try { Get-Process -Name AmitBar -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}
    }
    Start-Sleep -Seconds 2
}

$alreadyInstalled = $isInstalled -and -not $Force -and -not $upgrading
if ($alreadyInstalled) {
    Write-Host "[1/4] Amit's helper is already installed and up to date - skipping (use -Force to reinstall)."
} else {
    if ($upgrading) {
        Write-Host ("[1/4] Updating Amit's helper" + $(if ($installedVersion) { " from version $installedVersion" } else { " (an earlier version)" }) + " to version $InstallerVersion...")
        if (-not $env:AMIT_INSTALL_TEST_NO_STOP) { Stop-AmitHelper }
    } else {
        Write-Host "[1/4] Installing watcher scripts..."
    }
    New-Item -ItemType Directory -Path $watcherInstallDir -Force | Out-Null
    $filesToCopy = @(
        "amit_bridge_server.ps1", "ComputerHealth_Dashboard.html",
        "activity_watcher2.ps1", "resource_watcher.ps1", "diagnostics_watcher.ps1",
        "app_behavior_watcher.ps1", "install_snapshot_watcher.ps1",
        "Run_AmitTracker.ps1", "AmitTracker.exe",      # AmitSensorReader.exe (72 MB) is no longer installed here: Computer Health's Hardware tab adds it on request (helper route /api/sensors/install)
        "process_inbox.bat", "process_inbox_prompt.txt",
        "amit_whisper.cs", "amit_whisper.html", "amit_dictate.html", "amit_talk.html", "AmitPreview.html", "amit_update.ps1", "amit_reload.ps1", "amit_crash_check.ps1", "amit_appcrash.ps1", "amit_pad.html", "amit_pad_pair.html", "AmitBar.cs", "AmitToolkit.psm1", "never_list.json", "amit_script_check.ps1", "amit_script_host.ps1", "amit_run_script.ps1", "amit_script_routes.ps1", "amit_coder_routes.ps1", "amit_coder_engine.js", "amit_coder_sessions.js", "AmitScriptPopup.html", "amit_claude_run.ps1", "amit_claude_hook.ps1", "AmitClaudePopup.html",
        "amit_icon_whisper.ico", "amit_icon_read.ico", "amit_icon_showamit.ico"
    )
    # NEVER GO BACKWARDS (Ryan, 2026-11-07): this installer must never put an OLDER Amit Helper over a newer one. The Helper's own files (bridge, voice program,
    # bar, previewer page, updater) are kept when the Helper already installed is newer than the one this installer carries; the automatic updater delivers
    # the newer ones to every computer, so an old installer run later must not undo them. The version is the one in amit_whisper.cs.
    function Get-HelperVersion([string]$p) { try { if (Test-Path $p) { $m = [regex]::Match([System.IO.File]::ReadAllText($p), 'public const string Version = "([0-9.]+)"'); if ($m.Success) { return [version]$m.Groups[1].Value } } } catch {}; return $null }
    $helperOwned = @("amit_bridge_server.ps1", "amit_whisper.cs", "amit_whisper.html", "amit_dictate.html", "amit_talk.html", "AmitPreview.html", "amit_update.ps1", "amit_reload.ps1", "amit_crash_check.ps1", "amit_appcrash.ps1", "amit_pad.html", "amit_pad_pair.html", "AmitBar.cs", "AmitToolkit.psm1", "never_list.json", "amit_script_check.ps1", "amit_script_host.ps1", "amit_run_script.ps1", "amit_script_routes.ps1", "amit_coder_routes.ps1", "amit_coder_engine.js", "amit_coder_sessions.js", "AmitScriptPopup.html", "amit_claude_run.ps1", "amit_claude_hook.ps1", "AmitClaudePopup.html")
    $vCarried = Get-HelperVersion "$scriptDir\amit_whisper.cs"
    $vInstalled = Get-HelperVersion "$watcherInstallDir\amit_whisper.cs"
    $keepNewerHelper = $false
    if ($vCarried -and $vInstalled -and ($vInstalled -gt $vCarried)) {
        $keepNewerHelper = $true
        Write-Host ("  The Helper already installed (version $vInstalled) is NEWER than the one this installer carries (version $vCarried): its own files are kept, not replaced.")
    }
    foreach ($f in $filesToCopy) {
        if ($keepNewerHelper -and ($helperOwned -contains $f)) { continue }
        $src = "$scriptDir\$f"
        if (Test-Path $src) {
            # the sensor reader is large (about 75 MB), runs elevated, and rarely changes: do not replace it when it is already the same file
            if ($f -eq "AmitSensorReader.exe" -and (Test-Path "$watcherInstallDir\$f") -and ((Get-Item "$watcherInstallDir\$f").Length -eq (Get-Item $src).Length)) { continue }
            try { Copy-Item $src "$watcherInstallDir\$f" -Force -ErrorAction Stop } catch { Write-Host "  Warning: could not replace $f ($($_.Exception.Message)) - it may still be running; restart the computer and run the installer again." }
        } else {
            try {
                Invoke-WebRequest -Uri "$githubRawBase/$f" -OutFile "$watcherInstallDir\$f" -TimeoutSec 20 -ErrorAction Stop
            } catch {
                Write-Host "  Warning: could not get $f (checked locally and from GitHub) - $($_.Exception.Message)"
            }
        }
    }
    if ($InstallerVersion -ne "") { try { Set-Content -Path $versionFile -Value $InstallerVersion -Encoding ASCII } catch {} }
    # the Amit bar program is built here from AmitBar.cs with the compiler that ships with Windows (the same step "Update and reload" uses), so a new computer has its bar
    if (Test-Path "$watcherInstallDir\amit_reload.ps1") {
        try { Start-Process -FilePath powershell.exe -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',"`"$watcherInstallDir\amit_reload.ps1`"",'-BuildOnly' -WindowStyle Hidden -Wait }
        catch { Write-Host "  Warning: could not build the Amit bar ($($_.Exception.Message))" }
        $barProgram = "$watcherInstallDir\AmitBar.exe"
        if (-not $env:AMIT_INSTALL_TEST_NO_STOP -and -not $env:AMIT_INSTALL_TEST_COPY_ONLY -and (Test-Path $barProgram) -and -not (Get-Process -Name AmitBar -ErrorAction SilentlyContinue)) {
            try { Start-Process -FilePath $barProgram -WorkingDirectory $watcherInstallDir } catch { Write-Host "  Warning: could not start the Amit bar ($($_.Exception.Message))" }
        }
    }
    Write-Host "  Done."
}
if ($env:AMIT_INSTALL_TEST_COPY_ONLY) { Write-Host "(test run: stopping after step 1)"; exit 0 }

if (-not $WithClaude) {
    Write-Host ""
    Write-Host "Node.js and a Claude account are not needed here, so nothing about them is installed or asked."
} else {
# --- Step 1b: Claude Code + Node.js - optional, non-fatal if either fails.
# Claude Code is installed with Anthropic's own one-line (native) installer
# (decided 2026-11-26; it needs neither Node.js nor VS Code). A computer that
# already has the older npm copy keeps it. Node.js 22 or later is installed
# separately because Amit's own coding engine runs on it.
#
# Does NOT sign anyone into a Claude account here - that's a separate,
# explicit, explained step (1c), never silently triggered during install.
$nativeClaude = "$env:USERPROFILE\.local\bin\claude.exe"
$npmClaude = "$env:APPDATA\npm\claude.cmd"

Write-Host "[1b] Checking for Claude Code..."
if ((Test-Path $nativeClaude) -or (Test-Path $npmClaude)) {
    Write-Host "  Already installed."
} else {
    Write-Host "  Not found - running Anthropic's installer (this can take a few minutes and shows little while it downloads)..."
    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072; Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression" | Out-Null
    } catch {
        Write-Host "  Warning: the Claude Code installer reported a problem ($($_.Exception.Message))."
    }
    if (Test-Path $nativeClaude) { Write-Host "  Claude Code is installed." }
    else { Write-Host "  Warning: Claude Code did not install. Amit's Claude features won't work until it does, but the rest of Amit is unaffected." }
}

Write-Host "  Checking for Node.js 22 or later..."
try {
    $nodeExe = "$env:ProgramFiles\nodejs\node.exe"
    $nodeMajor = { if (Test-Path $nodeExe) { try { [int]((& $nodeExe -v) -replace '^v(\d+).*$', '$1') } catch { 0 } } else { 0 } }
    $have = & $nodeMajor
    if ($have -ge 22) {
        Write-Host "  Node.js $have is already installed."
    } else {
        $verb = if ($have -eq 0) { 'install' } else { 'upgrade' }
        Write-Host "  Running winget $verb for Node.js (silent)..."
        winget $verb OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Null
        if ((& $nodeMajor) -ge 22) { Write-Host "  Node.js is ready." }
        else { Write-Host "  Warning: Node.js 22 or later is not ready - Amit's coding connection needs it. Get it from https://nodejs.org" }
    }
} catch {
    Write-Host "  Warning: could not set up Node.js ($($_.Exception.Message)) - the rest of Amit is unaffected."
}

# --- Step 1c: Connect your Claude account (2026-09-05, built for the shared
# AmitMobile/Hub readiness-check work - see AmitMobile\CLAUDE.md "Connect
# Amit" section). Two genuinely separate checks, reported distinctly:
# (1) is Claude Code (the CLI, `claude` - NOT Claude Desktop, a different
# Anthropic product not used anywhere in this mechanism) installed at all -
# Step 1b above already tries to install it; this step just re-checks
# whether that succeeded rather than re-inventing the install. (2) is it
# actually signed in - if not, this OFFERS (never silently forces) to run
# `claude login`, which opens Anthropic's own sign-in page in the browser.
Write-Host ""
Write-Host "[1c] Checking your Claude account connection..."
$claudeCmd = $null
foreach ($c in @($nativeClaude, $npmClaude)) { if (Test-Path $c) { $claudeCmd = $c; break } }
if (-not $claudeCmd) { $g = Get-Command claude -ErrorAction SilentlyContinue | Select-Object -First 1; if ($g) { $claudeCmd = $g.Source } }
if (-not $claudeCmd) {
    Write-Host "  Claude Code isn't installed yet (Step 1b did not complete) - skipping the account-connection step for now. Amit's Claude features won't work until Claude Code is installed; re-run this installer, or paste this into PowerShell: irm https://claude.ai/install.ps1 | iex"
} else {
    $connected = $false
    $credPath = "$env:USERPROFILE\.claude\.credentials.json"
    if (Test-Path $credPath) {
        try {
            $cred = Get-Content $credPath -Raw | ConvertFrom-Json
            $oauth = $cred.claudeAiOauth
            if ($oauth -and $oauth.accessToken) {
                $refreshExpired = $false
                if ($oauth.refreshTokenExpiresAt) {
                    try {
                        $refreshExpiry = [DateTimeOffset]::FromUnixTimeMilliseconds([int64]$oauth.refreshTokenExpiresAt).UtcDateTime
                        if ($refreshExpiry -lt (Get-Date).ToUniversalTime()) { $refreshExpired = $true }
                    } catch { }
                }
                $connected = -not $refreshExpired
            }
        } catch { }
    }
    if ($connected) {
        Write-Host "  Claude Code is installed and already connected - nothing to do."
    } else {
        Write-Host "  Claude Code is installed but not yet connected to a Claude account."
        Write-Host "  To use Amit's live features, this computer needs to connect to your own Claude account - this is separate from your Amit sign-in. Clicking Connect opens Anthropic's own login page directly; your Claude credentials go straight to them, never through Amit or stored anywhere here. This only needs to happen once on this computer."
        try {
            $ans = Read-Host "  Connect your Claude account now? (Y/n)"
        } catch {
            $ans = 'n'
        }
        if ($ans -eq '' -or $ans -match '^(?i)y') {
            try {
                & $claudeCmd auth login
            } catch {
                Write-Host "  Could not start the Claude sign-in automatically ($($_.Exception.Message)) - run it yourself from PowerShell any time: claude auth login"
            }
        } else {
            Write-Host "  Skipped - you can connect any time later by running 'claude auth login' in PowerShell, or from the Hub's Connect Amit panel."
        }
    }
}
}   # end of: if ($WithClaude)

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

# --- Step 3: start Amit's helper automatically when this person signs in to Windows ---
# CHANGED 2026-10-20 (Ryan's direct instruction). This step used to skip auto-start on purpose
# (nothing ran in the background until the person asked). Now the helper starts with Windows so
# Computer Health keeps tracking and recording with no window or page open, and the Hub finds it
# already running. One per-user startup entry (HKCU Run - no administrator needed) that runs
# AmitTracker.exe in its quiet tray-only mode. --at-logon makes it start the helper only; the
# helper itself then starts tracking, and respects a Stop the person chose on purpose.
# Anyone who does not want this passes -NoAutoStart, or deletes the "AmitComputerHealth" value
# under HKCU\Software\Microsoft\Windows\CurrentVersion\Run (Task Manager > Startup apps also lists it).
$runKeyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
if ($NoAutoStart) {
    try { Remove-ItemProperty -Path $runKeyPath -Name "AmitComputerHealth" -ErrorAction SilentlyContinue } catch {}
    Write-Host "[3/4] Start-with-Windows skipped (-NoAutoStart) - Amit's helper will only start when you start it."
} else {
    try {
        Set-ItemProperty -Path $runKeyPath -Name "AmitComputerHealth" -Value ("`"$watcherInstallDir\AmitTracker.exe`" --tray-only --at-logon")
        Write-Host "[3/4] Amit's helper will now start automatically when you sign in to Windows (a small tray icon shows it is running)."
    } catch {
        Write-Host "[3/4] Could not set up start-with-Windows ($($_.Exception.Message)) - the desktop shortcut still starts everything."
    }
}

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
if ((Test-Path $shortcutPath) -and -not $redo) {
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
$trackerShortcutPath = "$desktopPath\Amit Helper.lnk"
$oldLiveShortcutPath = "$desktopPath\Amit Live.lnk"   # the name 2026-10-26 to 2026-11-14 (Ryan: Amit Live is now the characters; this is the Helper): replaced, not duplicated
if (Test-Path $oldLiveShortcutPath) { try { Remove-Item $oldLiveShortcutPath -Force -ErrorAction Stop } catch {} }
$oldTrackerShortcutPath = "$desktopPath\Amit Tracker.lnk"   # the name this shortcut had before it was called Amit Live: replaced, not duplicated
if (Test-Path $oldTrackerShortcutPath) { try { Remove-Item $oldTrackerShortcutPath -Force -ErrorAction Stop } catch {} }
if ((Test-Path $trackerShortcutPath) -and -not $redo) {
    Write-Host "[3/4] 'Amit Helper' desktop shortcut already exists - skipping."
} else {
    Write-Host "[3/4] Creating 'Amit Helper' desktop shortcut..."
    try {
        $wshShell = New-Object -ComObject WScript.Shell
        $trackerShortcut = $wshShell.CreateShortcut($trackerShortcutPath)
        $trackerShortcut.TargetPath = $trackerExePath
        $trackerShortcut.WorkingDirectory = $watcherInstallDir
        $trackerShortcut.IconLocation = $iconLocation
        $trackerShortcut.Description = "Amit Helper: starts Amit's helper (Whisper mode and your computer's health check) - no browser involved"
        $trackerShortcut.Save()
        Write-Host "  Shortcut created on your desktop: 'Amit Helper' - starts Amit's helper directly."
    } catch {
        Write-Host "  Could not create the 'Amit Helper' shortcut ($($_.Exception.Message)) - you can still start it from the dashboard's Launch Amit Helper button."
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
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker" -Name "(Default)" -Value "URL:Amit Helper"
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker" -Name "URL Protocol" -Value ""
    New-Item -Path "HKCU:\Software\Classes\amit-tracker\DefaultIcon" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker\DefaultIcon" -Name "(Default)" -Value $iconDest
    New-Item -Path "HKCU:\Software\Classes\amit-tracker\shell\open\command" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-tracker\shell\open\command" -Name "(Default)" -Value "`"$trackerExePath`""
    Write-Host "  Registered. Links starting with amit-tracker:// will now launch the tracker (Windows will always ask permission first - by design, not something we can silence)."
    # amit-helper:// (added 2026-10-22): the QUIET launch link the Hub uses to start Amit's helper - the same as the start-with-Windows
    # entry (tray icon only, no window, no dashboard tab). The Hub tries this first, then amit-tracker:// for installs that predate it.
    New-Item -Path "HKCU:\Software\Classes\amit-helper" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-helper" -Name "(Default)" -Value "URL:Amit Helper"
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-helper" -Name "URL Protocol" -Value ""
    New-Item -Path "HKCU:\Software\Classes\amit-helper\DefaultIcon" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-helper\DefaultIcon" -Name "(Default)" -Value $iconDest
    New-Item -Path "HKCU:\Software\Classes\amit-helper\shell\open\command" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\Software\Classes\amit-helper\shell\open\command" -Name "(Default)" -Value "`"$trackerExePath`" --tray-only --at-logon"
} catch {
    Write-Host "  Could not register the link handler ($($_.Exception.Message)) - the dashboard's Launch Amit Helper button won't work yet, but the Amit desktop shortcut and manual tracking still will."
}

Write-Host ""
Write-Host "Install complete."
Write-Host "Double-click 'Amit' on your desktop to open the Hub. From there, Computer Health has its own Launch Amit Helper button."
Write-Host "Dashboard: $dashboardUrl"

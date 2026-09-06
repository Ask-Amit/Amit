# Amit Computer Health - "Run Amit Tracker" desktop shortcut target.
# Ensures the bridge server is up, starts the watchers, and opens the
# dashboard - one double-click, no manual steps.
#
# -NoOpenDashboard (added 2026-09-05, Ryan's direct correction): the
# installer calls this same script to start the bridge/tracking right
# after a fresh install, but a first-time person installing from the Hub
# (via Amit Mobile's Connect Amit flow) should stay on the Hub, not get
# yanked into Computer Health's dashboard just because tracking also
# started in the background. The desktop shortcut path (a person
# deliberately double-clicking "Run Amit Tracker" to open Computer
# Health) is unaffected - it still opens the dashboard, since that IS
# what they clicked for.
#
# REVISED 2026-09-05 (real gap found live during testing): this branch
# used to start the bridge directly over raw HTTP with nothing visible
# left running - someone who installed purely for their phone had zero
# indication anything was active in the background and no discoverable
# way to shut it down (no window, no tray icon, nothing). Now this branch
# launches AmitTracker.exe with --tray-only instead, which shows a real
# system tray icon (right-click: Open Dashboard / Stop Tracker) and
# starts the bridge/tracking itself, headlessly - same discoverability
# the normal desktop-shortcut path already had, just without popping the
# full window or the dashboard tab. The normal (no-switch) path below is
# completely unchanged from before.
param([switch]$NoOpenDashboard)

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$bridgeScript = "$scriptDir\amit_bridge_server.ps1"
$trackerExe = "$scriptDir\AmitTracker.exe"
$dashboardUrl = "https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html"

function Test-BridgeUp {
    try {
        Invoke-RestMethod -Uri "http://localhost:8710/api/device" -TimeoutSec 2 -ErrorAction Stop | Out-Null
        return $true
    } catch { return $false }
}

if ($NoOpenDashboard) {
    # Amit Mobile / installer path - AmitTracker.exe's own --tray-only mode
    # ensures the bridge is up and calls /api/start-tracking itself; this
    # script's only job here is to launch it and stop, no dashboard tab.
    Start-Process -FilePath $trackerExe -ArgumentList "--tray-only" -WindowStyle Hidden
    return
}

if (-not (Test-BridgeUp)) {
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$bridgeScript`"" -WindowStyle Hidden
    $tries = 0
    while (-not (Test-BridgeUp) -and $tries -lt 10) {
        Start-Sleep -Milliseconds 500
        $tries++
    }
}

try {
    Invoke-RestMethod -Uri "http://localhost:8710/api/start-tracking" -Method Post -Body "" -TimeoutSec 30 -ErrorAction Stop | Out-Null
} catch {}

# ?justLaunched=1 tells the dashboard it can auto-connect on load instead of
# waiting for another manual click - consent is implicit here, since running
# this script (via the installer or the desktop/tray icon) IS the person's
# explicit action. Without this, someone who just finished the install saw
# "Not connected yet - click Launch Tracker" despite tracking already being
# live, a redundant extra click after "no other clicks needed" (2026-07-13).
Start-Process ($dashboardUrl + "?justLaunched=1")

# Amit Computer Health - "Run Amit Tracker" desktop shortcut target.
# Ensures the bridge server is up, starts the watchers, and opens the
# dashboard - one double-click, no manual steps.

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$bridgeScript = "$scriptDir\amit_bridge_server.ps1"
$dashboardUrl = "https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html"

function Test-BridgeUp {
    try {
        Invoke-RestMethod -Uri "http://localhost:8710/api/device" -TimeoutSec 2 -ErrorAction Stop | Out-Null
        return $true
    } catch { return $false }
}

if (-not (Test-BridgeUp)) {
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$bridgeScript`""
    $tries = 0
    while (-not (Test-BridgeUp) -and $tries -lt 10) {
        Start-Sleep -Milliseconds 500
        $tries++
    }
}

try {
    Invoke-RestMethod -Uri "http://localhost:8710/api/start-tracking" -Method Post -Body "" -TimeoutSec 10 -ErrorAction Stop | Out-Null
} catch {}

# ?justLaunched=1 tells the dashboard it can auto-connect on load instead of
# waiting for another manual click - consent is implicit here, since running
# this script (via the installer or the desktop/tray icon) IS the person's
# explicit action. Without this, someone who just finished the install saw
# "Not connected yet - click Launch Tracker" despite tracking already being
# live, a redundant extra click after "no other clicks needed" (2026-07-13).
Start-Process ($dashboardUrl + "?justLaunched=1")

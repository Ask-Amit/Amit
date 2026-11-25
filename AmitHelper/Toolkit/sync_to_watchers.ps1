# sync_to_watchers.ps1 (2026-11-24, flat since the Helper is delivered flat). Copies the RUNTIME files of custom script buttons from AmitHelper\Toolkit into ComputerHealth\Watchers\
# (the Helper's master folder), where the bridge looks for them: amit_bridge_server.ps1 loads amit_script_routes.ps1 from its own folder when a /api/script/* request arrives.
# Tests, README and this script are NOT copied. This does NOT install anything and does NOT release the Helper: the release rules (AmitHelper\HELPER_RELEASE_RULES.md) must still be followed.
# Also copies the bar source to its master AmitHelper\Bar\AmitBar.cs in the other direction only if asked (-BarFromWatchers).
# Run:  powershell -NoProfile -ExecutionPolicy Bypass -File sync_to_watchers.ps1 [-DryRun]
param([switch]$DryRun)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = Join-Path (Split-Path -Parent (Split-Path -Parent $here)) 'ComputerHealth\Watchers'
$files = @('never_list.json', 'AmitToolkit.psm1', 'amit_script_check.ps1', 'amit_script_host.ps1', 'amit_run_script.ps1', 'amit_script_routes.ps1', 'AmitScriptPopup.html', 'amit_claude_run.ps1', 'amit_claude_hook.ps1', 'AmitClaudePopup.html')
foreach ($f in $files) {
    $src = Join-Path $here $f
    if (-not (Test-Path $src)) { Write-Host ('MISSING source: ' + $f); continue }
    if ($DryRun) { Write-Host ('would copy ' + $f) } else { Copy-Item -LiteralPath $src -Destination (Join-Path $dest $f) -Force; Write-Host ('copied ' + $f) }
}

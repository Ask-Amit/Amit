# amit_script_host.ps1 v0.1 (2026-11-24). Runs ONE custom script button's script inside the safe toolkit and always writes a result file.
# Started by amit_run_script.ps1 (the runner), which owns the time limit and Stop. Plain ASCII (Windows PowerShell 5.1).
param([Parameter(Mandatory = $true)][string]$JobPath)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path $here 'AmitToolkit.psm1') -Force -Global -DisableNameChecking
Initialize-AmitJob -JobPath $JobPath
$job = [System.IO.File]::ReadAllText($JobPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
try {
    & ([string]$job.scriptPath)
    Complete-AmitJob -Outcome 'done'
}
catch {
    $ex = $_.Exception
    $kind = 'script_error'
    $plain = 'The script ran into a problem and stopped.'
    if ($ex.Data -and $ex.Data.Contains('AmitKind')) { $kind = [string]$ex.Data['AmitKind']; $plain = [string]$ex.Message }
    else {
        # the technical text stays in the person's private local log, never on the result card
        try { [System.IO.File]::AppendAllText((Join-Path $job.dirs.logs 'run.log'), ((Get-Date).ToString('s') + ' script error: ' + $ex.Message + "`r`n")) } catch { }
    }
    $outcome = 'failed'
    if ($kind -eq 'limit_reached') { $outcome = 'limit_reached' }
    Complete-AmitJob -Outcome $outcome -ErrorKind $kind -ErrorPlain $plain
}

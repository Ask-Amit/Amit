# amit_run_script.ps1 v0.1 (2026-11-24). The RUNNER for a custom script button: what the Helper calls when a "Run script" step is pressed.
# Plain ASCII (Windows PowerShell 5.1). Input: a job file (json). Output: the result file named in the job (always written).
#   1. refuses if the script is missing, or its fingerprint (SHA256) is not the one the person approved (job.expectedHash)
#   2. refuses if the static scan (amit_script_check.ps1 + never_list.json) finds anything
#   3. starts the script in a hidden child PowerShell through amit_script_host.ps1 (which uses the safe toolkit)
#   4. owns the time limit (smaller of permissions.maxSeconds and settings.scriptTimeLimitSec, default 60) and Stop (a file named stop.flag in dirs.state;
#      the Helper's Stop / STOP ALL button creates it) and kills the whole process tree when either happens
#   5. if it was stopped or crashed, builds the result from progress.json (what had finished) so the result card is still true
# The job file (written by the Helper before the press): buttonId, buttonName, mode ("practice" or "real"), scriptPath, expectedHash (or empty), answers {name: value},
#   permissions {reads, writes, sends, clipboard, folders[], allowedRecipients[], maxActions, maxSeconds},
#   settings {blockedRecipients[], noSendFrom, noSendTo, sendingUnlocked, scriptTimeLimitSec},
#   dirs {work, backups, outbox, logs, state, scripts}, resultPath
param([Parameter(Mandatory = $true)][string]$JobPath)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$job = [System.IO.File]::ReadAllText($JobPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$enc = New-Object System.Text.UTF8Encoding($false)

function Write-Fail {
    param([string]$Outcome, [string]$Kind, [string]$Plain)
    $prog = $null
    $pf = Join-Path $job.dirs.state 'progress.json'
    if (Test-Path -LiteralPath $pf) { try { $prog = [System.IO.File]::ReadAllText($pf, [System.Text.Encoding]::UTF8) | ConvertFrom-Json } catch { $prog = $null } }
    if ($null -eq $prog) {
        $prog = [pscustomobject]@{ ok = $false; outcome = $Outcome; mode = [string]$job.mode; startedAt = (Get-Date).ToString('o'); finishedAt = $null
            counts = [pscustomobject]@{ read = 0; drafted = 0; sent = 0; changed = 0; actions = 0 }; finished = @(); notDone = @(); wouldHave = @(); notices = @(); backups = @(); error = $null; summary = '' }
    }
    $prog.ok = $false
    $prog.outcome = $Outcome
    $prog.finishedAt = (Get-Date).ToString('o')
    $prog.error = [pscustomobject]@{ kind = $Kind; plain = $Plain }
    $n = [int]$prog.counts.actions
    if ($Outcome -eq 'stopped') { $prog.summary = 'It was stopped. ' + $n + ' thing(s) were done before it stopped.' } else { $prog.summary = 'The button stopped. ' + $n + ' thing(s) were done before it stopped.' }
    [System.IO.File]::WriteAllText([string]$job.resultPath, ($prog | ConvertTo-Json -Depth 6), $enc)
}

foreach ($d in @($job.dirs.state, $job.dirs.logs)) { if ($d -and -not (Test-Path -LiteralPath $d)) { [void](New-Item -ItemType Directory -Force -Path $d) } }
$stopFlag = Join-Path $job.dirs.state 'stop.flag'
if (Test-Path -LiteralPath $stopFlag) { [System.IO.File]::Delete($stopFlag) }
$progFile = Join-Path $job.dirs.state 'progress.json'
if (Test-Path -LiteralPath $progFile) { [System.IO.File]::Delete($progFile) }
if (Test-Path -LiteralPath ([string]$job.resultPath)) { [System.IO.File]::Delete([string]$job.resultPath) }

# 1. the script and its fingerprint
$sp = [string]$job.scriptPath
if (-not (Test-Path -LiteralPath $sp)) { Write-Fail 'failed' 'script_missing' 'The script for this button is not on this computer. Ask Amit to rebuild it.'; exit 0 }
if ($job.PSObject.Properties['expectedHash'] -and $job.expectedHash) {
    $h = (Get-FileHash -LiteralPath $sp -Algorithm SHA256).Hash
    if ($h -ne ([string]$job.expectedHash).ToUpper()) { Write-Fail 'failed' 'script_changed' 'This script was changed since you approved it, so it was not run. Ask Amit to check the change.'; exit 0 }
}

# 2. the static scan, before EVERY run
$scan = & (Join-Path $here 'amit_script_check.ps1') -Path $sp
$res = $null
try { $res = (@($scan) -join '') | ConvertFrom-Json } catch { $res = $null }
if ($null -eq $res -or -not $res.ok) {
    $why = 'it could not be checked.'
    if ($null -ne $res) {
        $parts = New-Object System.Collections.ArrayList
        foreach ($v in @($res.violations)) { if (-not $parts.Contains([string]$v.plain)) { [void]$parts.Add([string]$v.plain) } }
        foreach ($e in @($res.parseErrors)) { [void]$parts.Add('it is not written correctly (' + $e + ')') }
        $why = ($parts -join ' ')
    }
    Write-Fail 'failed' 'refused' ('Amit will not run this script. ' + $why)
    exit 0
}

# 3. start the script in a hidden child
$limit = 60
if ($job.permissions.PSObject.Properties['maxSeconds'] -and [int]$job.permissions.maxSeconds -gt 0) { $limit = [int]$job.permissions.maxSeconds }
if ($job.settings.PSObject.Properties['scriptTimeLimitSec'] -and [int]$job.settings.scriptTimeLimitSec -gt 0 -and [int]$job.settings.scriptTimeLimitSec -lt $limit) { $limit = [int]$job.settings.scriptTimeLimitSec }
$hostScript = Join-Path $here 'amit_script_host.ps1'
$argLine = '-NoProfile -ExecutionPolicy Bypass -File "' + $hostScript + '" -JobPath "' + $JobPath + '"'
$p = Start-Process -FilePath 'powershell.exe' -ArgumentList $argLine -PassThru -WindowStyle Hidden

# 4. wait, owning the time limit and Stop
$deadline = (Get-Date).AddSeconds($limit)
$killed = ''
while (-not $p.HasExited) {
    if (Test-Path -LiteralPath $stopFlag) { $killed = 'user'; break }
    if ((Get-Date) -gt $deadline) { $killed = 'timeout'; break }
    Start-Sleep -Milliseconds 150
}
if ($killed) {
    & taskkill.exe /PID $p.Id /T /F | Out-Null
    Start-Sleep -Milliseconds 300
    if ($killed -eq 'user') { Write-Fail 'stopped' 'stopped_by_user' 'You pressed Stop.' }
    else { Write-Fail 'stopped' 'time_limit' ('It ran longer than its time limit of ' + $limit + ' seconds, so it was stopped.') }
    exit 0
}

# 5. finished by itself: the host writes the result; if it did not, say so truthfully
if (-not (Test-Path -LiteralPath ([string]$job.resultPath))) { Write-Fail 'failed' 'script_crashed' 'The script closed without finishing.' }
exit 0

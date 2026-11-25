# test_claude_run.ps1 (2026-11-25). Runs the REAL runner and the REAL permission hook with the REAL Claude Code on this computer (smallest model, two short runs, temp folders).
# The person's Allow / Don't allow is given by this test writing the answer files. The account check is the real one; this test makes the "Hub login fingerprint" match the account
# signed in on this computer (computed here, never printed). Run: powershell -NoProfile -ExecutionPolicy Bypass -File test_claude_run.ps1
$ErrorActionPreference = 'Stop'
$tk = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$root = Join-Path $env:TEMP ('amit_run_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8)); [void](New-Item -ItemType Directory -Force $root)
$env:AMIT_SCRIPTS_ROOT = $root
$script:pass = 0; $script:fail = 0
function Say($c, $l) { if ($c) { $script:pass++; Write-Host ('  PASS  ' + $l) } else { $script:fail++; Write-Host ('  FAIL  ' + $l) } }
. (Join-Path $tk 'amit_script_routes.ps1')
$me = As-ClaudeStatus
As-WriteText (As-ClaudeFile) (As-ToJson (@{ 'me-1' = @{ emailPrint = (As-EmailPrint ([string]$me['email'])) }; 'other-2' = @{ emailPrint = (As-EmailPrint 'nobody@example.com') } }))
function Start-Run($name, $user, $text) {
    $st = Join-Path $root ($name + '\state'); $wk = Join-Path $root ($name + '\work'); [void](New-Item -ItemType Directory -Force $st, $wk)
    $jp = Join-Path $st 'claude_job.json'
    As-WriteText $jp (As-ToJson (@{ userId = $user; stateDir = $st; workDir = $wk; shortcutName = 'F test'; shortcutText = $text; model = 'haiku' }))
    $p = Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $tk 'amit_claude_run.ps1') + '" -JobPath "' + $jp + '"') -PassThru -WindowStyle Hidden
    return @{ p = $p; state = $st; work = $wk }
}
function Wait-For($run, $allow, $until, $secs = 150) {
    $end = (Get-Date).AddSeconds($secs); $asked = @()
    while ((Get-Date) -lt $end) {
        $pm = As-ReadJson (Join-Path $run.state 'perm.json')
        if ($pm -and -not ($asked -contains $pm['id'])) { $asked += $pm['id']; $run.lastAsk = $pm; As-WriteText (Join-Path $run.state ('perm_' + $pm['id'] + '.json')) (As-ToJson (@{ allow = $allow })) }
        $t = As-ReadJson (Join-Path $run.state 'turn.json')
        if ($t -and $until -contains $t['status']) { $run.asked = $asked.Count; return $t }
        Start-Sleep -Milliseconds 300
    }
    $run.asked = $asked.Count; return (As-ReadJson (Join-Path $run.state 'turn.json'))
}
$r = Start-Run 'wrong' 'other-2' 'Say hello.'
$t = Wait-For $r $false @('refused', 'waiting', 'failed') 60
Say ($t['status'] -eq 'refused' -and $t['text'] -match 'different email') 'a login whose email does not match: the runner refuses before Claude is started'
$job = 'First ask the person what word to put in the file. After they answer, create note.txt in your working folder containing exactly that word.'
$r = Start-Run 'yes' 'me-1' $job
$t = Wait-For $r $true @('waiting', 'failed', 'refused')
Say ($t['status'] -eq 'waiting' -and $t['text'].Length -gt 3) ('Claude asks its question and waits: ' + (([string]$t['text']) -replace '\s+', ' '))
As-WriteText (Join-Path $r.state 'reply.json') (As-ToJson (@{ answer = 'shalom' }))
Start-Sleep -Seconds 2
$end = (Get-Date).AddSeconds(150); $t = $null
while ((Get-Date) -lt $end) { $t = Wait-For $r $true @('waiting', 'failed', 'refused') 150; if ($t['turn'] -ge 2) { break }; Start-Sleep -Milliseconds 400 }
$f = Join-Path $r.work 'note.txt'
Say ($r.asked -ge 1 -and $r.lastAsk['plain'] -match 'file' -and (Test-Path $f) -and ([IO.File]::ReadAllText($f).Trim() -eq 'shalom')) 'the answer reaches the same conversation, it asks permission, and Allow makes the file'
As-WriteText (Join-Path $r.state 'stop.flag') 'stop'; [void]$r.p.WaitForExit(20000)
Say ($r.p.HasExited -and (As-ReadJson (Join-Path $r.state 'turn.json'))['status'] -eq 'finished') 'Finish ends the run'
$r = Start-Run 'no' 'me-1' 'Create note.txt in your working folder containing the word hi. Do not ask any question first.'
$t = Wait-For $r $false @('waiting', 'failed', 'refused')
Say ($r.asked -ge 1 -and -not (Test-Path (Join-Path $r.work 'note.txt')) -and $t['status'] -eq 'waiting') 'Don''t allow: no file'
As-WriteText (Join-Path $r.state 'stop.flag') 'stop'; [void]$r.p.WaitForExit(20000)
# the hook on its own
function Ask-Hook($tool, $inputObj, $work, $state) {
    $env:AMIT_STATE_DIR = $state; $env:AMIT_WORK_DIR = $work; $env:AMIT_PERM_WAIT = '2'
    $o = (@{ tool_name = $tool; tool_input = $inputObj } | ConvertTo-Json -Compress) | & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $tk 'amit_claude_hook.ps1')
    return (($o -join '') | ConvertFrom-Json).hookSpecificOutput.permissionDecision
}
$st = Join-Path $root 'h\state'; $wk = Join-Path $root 'h\work'; [void](New-Item -ItemType Directory -Force $st, $wk)
Say ((Ask-Hook 'Read' @{ file_path = (Join-Path $wk 'a.txt') } $wk $st) -eq 'allow') 'reading inside the button folder needs no question'
Say ((Ask-Hook 'Read' @{ file_path = (Join-Path $wk '..\..\secret.txt') } $wk $st) -eq 'deny') 'walking out of the folder is asked (no answer = deny)'
Say ((Ask-Hook 'Read' @{ file_path = ($wk + '2\a.txt') } $wk $st) -eq 'deny') 'a look-alike folder is asked'
Say ((Ask-Hook 'Glob' @{ pattern = '../../**/*.txt' } $wk $st) -eq 'deny') 'a search pattern that walks out is asked'
Say ((Ask-Hook 'PowerShell' @{ command = 'Get-Date' } $wk $st) -eq 'deny') 'a command with no answer is denied'
Say ((Ask-Hook 'SomethingNew' @{ x = 1 } $wk $st) -eq 'deny') 'a tool we do not know is asked'
Remove-Item -Recurse -Force $root -ErrorAction SilentlyContinue
Write-Host ''; Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed'); if ($script:fail) { exit 1 }

# test_toolkit.ps1 (2026-11-24). Proves the safe toolkit, the static scan and the runner. Everything happens in a temporary folder; nothing outside it is touched,
# nothing is shown on screen (child PowerShell windows are hidden). Run: powershell -NoProfile -ExecutionPolicy Bypass -File test_toolkit.ps1
# Plain ASCII (Windows PowerShell 5.1). Exit code 0 only when every check passes.
$ErrorActionPreference = 'Stop'
$tk = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$tk = Join-Path $tk 'Toolkit'
if (-not (Test-Path (Join-Path $tk 'amit_run_script.ps1'))) { $tk = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
$runner = Join-Path $tk 'amit_run_script.ps1'
$checker = Join-Path $tk 'amit_script_check.ps1'
$root = Join-Path $env:TEMP ('amit_toolkit_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8))
[void](New-Item -ItemType Directory -Force -Path $root)
$enc = New-Object System.Text.UTF8Encoding($false)
$script:pass = 0; $script:fail = 0

function Check {
    param([bool]$Cond, [string]$Label)
    if ($Cond) { $script:pass++; Write-Host ('  PASS  ' + $Label) } else { $script:fail++; Write-Host ('  FAIL  ' + $Label) -ForegroundColor Red }
}

function New-TestJob {
    param([string]$Name, [string]$ScriptText, [string]$Mode = 'real', $Perm = $null, $Settings = $null, $Answers = $null, [string]$Hash = '')
    $dir = Join-Path $root $Name
    $dirs = @{ work = (Join-Path $dir 'work'); backups = (Join-Path $dir 'backups'); outbox = (Join-Path $dir 'outbox'); logs = (Join-Path $dir 'logs'); state = (Join-Path $dir 'state'); scripts = (Join-Path $dir 'scripts') }
    foreach ($d in $dirs.Values) { [void](New-Item -ItemType Directory -Force -Path $d) }
    $data = Join-Path $dir 'data'
    [void](New-Item -ItemType Directory -Force -Path $data)
    [System.IO.File]::WriteAllText((Join-Path $data 'in.csv'), "a,1`r`nb,2`r`nc,3`r`n", $enc)
    $sp = Join-Path $dirs.scripts 'v1.ps1'
    [System.IO.File]::WriteAllText($sp, ($ScriptText.Replace('@@DATA@@', $data)), $enc)
    if ($null -eq $Perm) { $Perm = @{ reads = $true; writes = $true; sends = $false; clipboard = $false; folders = @($data); maxActions = 20; maxSeconds = 20 } }
    $fl = @(); foreach ($f in @($Perm.folders)) { $fl += ([string]$f).Replace('@@DATA@@', $data) }
    $Perm.folders = $fl
    if ($null -eq $Settings) { $Settings = @{ blockedRecipients = @(); sendingUnlocked = $false } }
    if ($null -eq $Answers) { $Answers = @{} }
    $job = @{ buttonId = $Name; buttonName = $Name; mode = $Mode; scriptPath = $sp; expectedHash = $Hash; answers = $Answers; permissions = $Perm; settings = $Settings; dirs = $dirs; resultPath = (Join-Path $dir 'result.json') }
    $jp = Join-Path $dir 'job.json'
    [System.IO.File]::WriteAllText($jp, ($job | ConvertTo-Json -Depth 6), $enc)
    return @{ Dir = $dir; JobPath = $jp; Data = $data; Dirs = $dirs; Result = (Join-Path $dir 'result.json'); Script = $sp }
}

function Start-TestRun {
    param($J)
    return (Start-Process -FilePath 'powershell.exe' -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $runner + '" -JobPath "' + $J.JobPath + '"') -PassThru -WindowStyle Hidden)
}

function Get-TestResult {
    param($J, $Proc, [int]$WaitMs = 90000)
    [void]$Proc.WaitForExit($WaitMs)
    if (Test-Path $J.Result) { return ([System.IO.File]::ReadAllText($J.Result, [System.Text.Encoding]::UTF8) | ConvertFrom-Json) }
    return $null
}

function Invoke-TestRun {
    param($J)
    $p = Start-TestRun $J
    return (Get-TestResult $J $p)
}

$good = @'
$rows = (Read-AmitFile -Path '@@DATA@@\in.csv') -split "`r?`n" | Where-Object { $_ -ne '' }
$who = Get-AmitAnswer -Name 'from_whom' -Default 'everyone'
Write-AmitFile -Path '@@DATA@@\out.txt' -Content ("rows=" + $rows.Count + " who=" + $who)
New-AmitDraft -To 'ann@example.com' -Subject 'Hello' -Body 'Hi Ann'
Show-AmitNotice -Text 'ok'
'@

try {
    Write-Host '1. practice mode changes nothing'
    $j = New-TestJob 't1' $good 'practice'
    $r = Invoke-TestRun $j
    Check ($null -ne $r -and $r.outcome -eq 'done') 'practice run finishes done'
    Check (-not (Test-Path (Join-Path $j.Data 'out.txt'))) 'practice wrote no file'
    Check ((@(Get-ChildItem $j.Dirs.outbox -ErrorAction SilentlyContinue)).Count -eq 0) 'practice prepared no message'
    Check ($r.wouldHave.Count -eq 2) 'practice recorded 2 things it WOULD do'
    Check ($r.counts.read -eq 1 -and $r.mode -eq 'practice') 'practice read the file and says it is practice'

    Write-Host '2. real run writes, prepares, and backs up on the second run'
    $j = New-TestJob 't2' $good 'real' $null $null @{ from_whom = 'Sue' }
    $r = Invoke-TestRun $j
    Check ($r.outcome -eq 'done' -and $r.counts.changed -eq 1 -and $r.counts.drafted -eq 1) 'first real run: 1 changed, 1 prepared'
    Check ((Get-Content (Join-Path $j.Data 'out.txt') -Raw).Contains('who=Sue')) 'the answer reached the script as data'
    Check ((@(Get-ChildItem $j.Dirs.outbox)).Count -eq 1) 'the message is waiting in the outbox'
    $r2 = Invoke-TestRun $j
    Check ($r2.backups.Count -eq 1 -and (Test-Path $r2.backups[0])) 'second real run made a dated backup of the old file'
    Check (-not (Test-Path ((Join-Path $j.Data 'out.txt') + '.amit-tmp'))) 'no temporary file left behind'

    Write-Host '3. the limit per press stops it'
    $lim = @'
1..5 | ForEach-Object { Write-AmitFile -Path ('@@DATA@@\f' + $_ + '.txt') -Content 'x' }
'@
    $j = New-TestJob 't3' $lim 'real' @{ reads = $true; writes = $true; folders = @('@@DATA@@'); maxActions = 2; maxSeconds = 20 }
    $r = Invoke-TestRun $j
    Check ($r.outcome -eq 'limit_reached' -and $r.error.kind -eq 'limit_reached') 'outcome is limit_reached'
    Check ($r.counts.changed -eq 2 -and (@(Get-ChildItem $j.Data -Filter 'f*.txt')).Count -eq 2) 'exactly 2 files were written, no more'

    Write-Host '4. folder jail and permissions'
    $outside = @'
Write-AmitFile -Path '@@DATA@@\..\outside.txt' -Content 'x'
'@
    $j = New-TestJob 't4' $outside 'real'
    $r = Invoke-TestRun $j
    Check ($r.outcome -eq 'failed' -and $r.error.kind -eq 'path_not_allowed') 'a folder it was not given is refused'
    Check (-not (Test-Path (Join-Path $j.Dir 'outside.txt'))) 'nothing was written outside'
    $j = New-TestJob 't4b' $good 'real' @{ reads = $true; writes = $false; folders = @('@@DATA@@'); maxActions = 20; maxSeconds = 20 }
    $r = Invoke-TestRun $j
    Check ($r.error.kind -eq 'not_permitted') 'writing without permission is refused'

    Write-Host '5. the never-list scan'
    $cases = @(
        @('delete', "Remove-Item 'C:\x'"),
        @('internet', "Invoke-WebRequest https://example.com"),
        @('writes_directly', "Set-Content -Path x -Value y"),
        @('writes_directly', "    Set-Content -Path x -Value y"),
        @('runs_other_code', "Start-Process notepad"),
        @('secrets_written_in', '$k = "sk-abcdefghijklmnopqrstuvwxyz123456"'),
        @('admin', '#Requires -RunAsAdministrator'),
        @('press_keys', 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("a")'),
        @('passwords', '$password = "x"'),
        @('system_settings', 'Set-ExecutionPolicy Bypass')
    )
    $n = 0
    foreach ($c in $cases) {
        $n++
        $p = Join-Path $root ('scan' + $n + '.ps1')
        [System.IO.File]::WriteAllText($p, $c[1], $enc)
        $out = (@(& $checker -Path $p) -join '') | ConvertFrom-Json
        $ids = @($out.violations | ForEach-Object { $_.ruleId })
        Check ((-not $out.ok) -and ($ids -contains $c[0])) ('scan refuses: ' + $c[0] + '  (' + $c[1].Trim().Substring(0, [Math]::Min(40, $c[1].Trim().Length)) + ')')
    }
    $p = Join-Path $root 'scan_syntax.ps1'
    [System.IO.File]::WriteAllText($p, 'if (', $enc)
    $out = (@(& $checker -Path $p) -join '') | ConvertFrom-Json
    Check ((-not $out.ok) -and @($out.parseErrors).Count -gt 0) 'scan refuses a script that is not written correctly'
    $p = Join-Path $root 'scan_ok.ps1'
    [System.IO.File]::WriteAllText($p, ($good.Replace('@@DATA@@', 'C:\x') + "`r`n# Remove-Item is not allowed here`r`n<# block`r`nInvoke-WebRequest x`r`n#>`r`n"), $enc)
    $out = (@(& $checker -Path $p) -join '') | ConvertFrom-Json
    Check ($out.ok) 'scan passes a good script, and ignores comments'
    $j = New-TestJob 't5' "Remove-Item 'C:\x'" 'real'
    $r = Invoke-TestRun $j
    Check ($r.outcome -eq 'failed' -and $r.error.kind -eq 'refused' -and $r.error.plain.Contains('deletes')) 'the runner refuses a flagged script and says why in plain words'

    Write-Host '6. the time limit kills it'
    $slow = @'
Start-Sleep -Seconds 40
'@
    $j = New-TestJob 't6' $slow 'real' @{ reads = $true; writes = $true; folders = @(); maxActions = 20; maxSeconds = 3 }
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $r = Invoke-TestRun $j
    $sw.Stop()
    Check ($r.outcome -eq 'stopped' -and $r.error.kind -eq 'time_limit') 'outcome is stopped by the time limit'
    Check ($sw.Elapsed.TotalSeconds -lt 15) ('it ended in ' + [int]$sw.Elapsed.TotalSeconds + ' seconds, not 40')
    Start-Sleep -Milliseconds 600
    $left = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*amit_script_host*t6*' })
    Check ($left.Count -eq 0) 'no script process was left running'

    Write-Host '7. Stop keeps what had finished'
    $stopme = @'
Write-AmitFile -Path '@@DATA@@\before_stop.txt' -Content 'done before stop'
Start-Sleep -Seconds 40
'@
    $j = New-TestJob 't7' $stopme 'real' @{ reads = $true; writes = $true; folders = @('@@DATA@@'); maxActions = 20; maxSeconds = 60 }
    $p = Start-TestRun $j
    Start-Sleep -Milliseconds 2500
    [System.IO.File]::WriteAllText((Join-Path $j.Dirs.state 'stop.flag'), 'stop', $enc)
    $r = Get-TestResult $j $p 20000
    Check ($r.outcome -eq 'stopped' -and $r.error.kind -eq 'stopped_by_user') 'outcome is stopped by the person'
    Check ($r.counts.changed -eq 1 -and $r.finished.Count -eq 1) 'the result still says one file was changed before Stop'

    Write-Host '8. a changed script is not run'
    $j = New-TestJob 't8' $good 'real' $null $null $null 'ABCDEF0123456789'
    $r = Invoke-TestRun $j
    Check ($r.error.kind -eq 'script_changed') 'a script that does not match the approved fingerprint is refused'
    $realHash = (Get-FileHash -LiteralPath $j.Script -Algorithm SHA256).Hash
    $j2 = New-TestJob 't8b' $good 'real'
    $h2 = (Get-FileHash -LiteralPath $j2.Script -Algorithm SHA256).Hash
    $jobObj = [System.IO.File]::ReadAllText($j2.JobPath) | ConvertFrom-Json
    $jobObj.expectedHash = $h2
    [System.IO.File]::WriteAllText($j2.JobPath, ($jobObj | ConvertTo-Json -Depth 6), $enc)
    $r = Invoke-TestRun $j2
    Check ($r.outcome -eq 'done') 'a script with the approved fingerprint runs'

    Write-Host '9. the done-list prevents a second send'
    $dl = @'
foreach ($n in 'a','b','c') {
    if (-not (Test-AmitDone -Key $n)) { New-AmitDraft -To ($n + '@example.com') -Subject 's' -Body 'b'; Add-AmitDone -Key $n }
}
'@
    $j = New-TestJob 't9' $dl 'real'
    [void](Invoke-TestRun $j)
    Check ((@(Get-ChildItem $j.Dirs.outbox)).Count -eq 3) 'first run prepared 3 messages'
    [void](Invoke-TestRun $j)
    Check ((@(Get-ChildItem $j.Dirs.outbox)).Count -eq 3) 'second run prepared none again (nothing is done twice)'

    Write-Host '10. recipients and sending'
    $to = @'
New-AmitDraft -To 'ann@example.com' -Subject 's' -Body 'b'
'@
    $j = New-TestJob 't10' $to 'real' $null @{ blockedRecipients = @('ann@example.com'); sendingUnlocked = $false }
    $r = Invoke-TestRun $j
    Check ($r.error.kind -eq 'recipient_blocked' -and (@(Get-ChildItem $j.Dirs.outbox)).Count -eq 0) 'a person on the do-not-contact list is refused'
    $snd = @'
Send-AmitMessage -To 'ann@example.com' -Subject 's' -Body 'b'
'@
    $sperm = @{ reads = $true; writes = $false; sends = $true; folders = @(); maxActions = 20; maxSeconds = 20 }
    $j = New-TestJob 't11' $snd 'practice' $sperm
    $r = Invoke-TestRun $j
    Check ($r.outcome -eq 'done' -and $r.wouldHave.Count -eq 1 -and $r.wouldHave[0].kind -eq 'send') 'practice shows what it would send and sends nothing'
    $j = New-TestJob 't11b' $snd 'real' $sperm
    $r = Invoke-TestRun $j
    Check ($r.error.kind -eq 'sending_locked') 'real sending stays locked until the person unlocks it'
    $j = New-TestJob 't11c' $snd 'real' $sperm @{ blockedRecipients = @(); sendingUnlocked = $true }
    $r = Invoke-TestRun $j
    Check ($r.error.kind -eq 'no_transport' -and $r.counts.sent -eq 0) 'unlocked, it still says plainly there is no mail connection yet, and sends nothing'

    Write-Host '11. a question in the middle of a run'
    $mid = @'
$a = Request-AmitAnswer -Question 'Which?' -Choices 'x','y' -TimeoutSeconds 20
Write-AmitFile -Path '@@DATA@@\mid.txt' -Content ('answer=' + $a)
'@
    $j = New-TestJob 't12' $mid 'real'
    $p = Start-TestRun $j
    $ask = Join-Path $j.Dirs.state 'ask.json'
    $waited = 0
    while (-not (Test-Path $ask) -and $waited -lt 15000) { Start-Sleep -Milliseconds 200; $waited += 200 }
    Check (Test-Path $ask) 'the script asked its question (ask.json appeared)'
    [System.IO.File]::WriteAllText((Join-Path $j.Dirs.state 'answer.json'), '{"answer":"y"}', $enc)
    $r = Get-TestResult $j $p 30000
    Check ($r.outcome -eq 'done' -and (Get-Content (Join-Path $j.Data 'mid.txt') -Raw).Contains('answer=y')) 'the answer reached the script and it finished'

    Write-Host '12. technical errors stay off the result card'
    $boom = @'
throw 'boom secret technical detail'
'@
    $j = New-TestJob 't13' $boom 'real'
    $r = Invoke-TestRun $j
    Check ($r.error.kind -eq 'script_error' -and -not $r.error.plain.Contains('boom')) 'the person sees a plain sentence, not the technical text'
    Check ((Get-Content (Join-Path $j.Dirs.logs 'run.log') -Raw).Contains('boom')) 'the technical text is kept in the private local log'

    Write-Host '13. a file open elsewhere is left unchanged'
    $j = New-TestJob 't14' $good 'real'
    [System.IO.File]::WriteAllText((Join-Path $j.Data 'out.txt'), 'original', $enc)
    $fs = [System.IO.File]::Open((Join-Path $j.Data 'out.txt'), 'Open', 'Read', 'None')
    try { $r = Invoke-TestRun $j } finally { $fs.Close() }
    Check ($r.error.kind -eq 'file_busy') 'it stops with a plain message when the file is open in another program'
    Check ((Get-Content (Join-Path $j.Data 'out.txt') -Raw) -eq 'original') 'the original file is unchanged'
}
finally {
    Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host ''
Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed')
if ($script:fail -gt 0) { exit 1 } else { exit 0 }

# test_own_build.ps1 (2026-11-25). Building a custom button on the person's own Claude: the real account check and ONE real Claude run (the small model).
# The Hub sign-in is pretended inside this test only; Amit's rules are read from the local files, standing in for the published copies. Temp folder only.
$ErrorActionPreference = 'Stop'
$tk = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path); $amit = Split-Path -Parent (Split-Path -Parent $tk)
$root = Join-Path $env:TEMP ('amit_build_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8)); [void](New-Item -ItemType Directory -Force $root)
$env:AMIT_SCRIPTS_ROOT = $root; $env:AMIT_TEST_NO_RUNNER = '1'
$script:pass = 0; $script:fail = 0
function Say($c, $l) { if ($c) { $script:pass++; Write-Host ('  PASS  ' + $l) } else { $script:fail++; Write-Host ('  FAIL  ' + $l) } }
. (Join-Path $tk 'amit_script_routes.ps1')
$me = As-ClaudeStatus
$global:amitDir = $amit; $global:hubMail = [string]$me['email']; $global:breakHeart = $false
function global:As-WebText([string]$url) { if ($global:breakHeart) { throw 'offline' }; return [IO.File]::ReadAllText((Join-Path $global:amitDir (($url -replace '^.*/Amit/main/', '').Replace('/', '\'))), [Text.Encoding]::UTF8) }
function global:As-HubUser([string]$token) { if ($token -ne 'good.test.token') { return $null }; return @{ id = 'user-build-0001'; email = $global:hubMail; linked = @() } }
$req = "BUILD REQUEST FROM THE HUB (data for you; follow the Button Builder Rules)`nBUTTON: Note (id b1)`nTHE JOB IN THE PERSON'S OWN WORDS: write the word hello into a text file`nQUESTIONS ALREADY SET (the script must use these variable names):`n (none yet)`nTHE PERSON'S LATEST WORDS: (nothing new)`n"
$s = As-StartOwnBuild 'bad.test.token' $req
Say ($s.allowed -ne $true -and -not $s.job) 'no confirmed Hub login: nothing starts'
$global:hubMail = 'someone.else@example.com'
$s = As-StartOwnBuild 'good.test.token' $req
Say ($s.allowed -ne $true -and $s.reason -eq 'email_mismatch' -and -not $s.job) 'a Claude account that does not match the login: nothing starts'
$global:hubMail = [string]$me['email']
$s = As-StartOwnBuild 'good.test.token' ('x' * 60001)
Say (-not $s.job) 'a request that is too long is refused'
$s = As-StartOwnBuild 'good.test.token' $req
Say ($s.job -match '^[a-f0-9]{32}$' -and (As-OwnBuildState $s.job).status -eq 'working') 'their own matching Claude: a build starts and reports that it is working'
$global:breakHeart = $true
Invoke-AmitOwnBuild $s.job 'user-build-0001' 'haiku'
$r = As-OwnBuildState $s.job
Say ($r.status -eq 'failed' -and -not $r.answer) 'if Amit''s rules cannot be read, nothing is built'
$global:breakHeart = $false
$s = As-StartOwnBuild 'good.test.token' $req
Invoke-AmitOwnBuild $s.job 'user-build-0001' 'haiku'
Say (-not (Test-Path (As-BuildFile $s.job 'request'))) 'the request text is removed from the computer once used'
$r = As-OwnBuildState $s.job
Say ($r.status -eq 'answered' -and $r.answer.Length -gt 10) ('a real reply from this computer''s own Claude (' + ([string]$r.answer).Length + ' characters): ' + (([string]$r.answer) -replace '\s+', ' ').Substring(0, [Math]::Min(120, ([string]$r.answer).Length)))
Say ((As-OwnBuildState $s.job).status -eq 'failed') 'the reply is handed over once, then removed'
Say ((As-OwnBuildState '..\..\x').status -eq 'failed') 'a made-up job name reads nothing'
$log = [IO.File]::ReadAllText((Join-Path $root 'own_claude_log.txt'))
Say ($log -match 'button built with their own Claude \(pro\)' -and $log -notmatch '@') 'the record says whose Claude built it, with no email'
Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ''; Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed'); if ($script:fail) { exit 1 }

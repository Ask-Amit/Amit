# test_claude_check.ps1 (2026-11-25). The premium check "is this the person's own paid Claude account?". Claude Code and the sign-in server are stood in for inside THIS test only
# (the real functions are replaced after loading; the shipped code has no test switch). Temp folder only. Run: powershell -NoProfile -ExecutionPolicy Bypass -File test_claude_check.ps1
$ErrorActionPreference = 'Stop'
$tk = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$root = Join-Path $env:TEMP ('amit_claude_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8)); [void](New-Item -ItemType Directory -Force $root)
$env:AMIT_SCRIPTS_ROOT = $root
$script:pass = 0; $script:fail = 0
function Say($c, $l) { if ($c) { $script:pass++; Write-Host ('  PASS  ' + $l) } else { $script:fail++; Write-Host ('  FAIL  ' + $l) } }
. (Join-Path $tk 'amit_script_routes.ps1')
$realStatus = ${function:As-ClaudeStatus}; $realHub = ${function:As-HubUser}
$global:fake = $null; $global:hub = @{ id = 'user-1'; email = 'Pat.Person@example.com' }
function global:As-ClaudeStatus { return $global:fake }
function global:As-HubUser([string]$t) { if ($t -eq 'good') { return $global:hub }; return $null }
function Acct($mail, $plan, $in = $true, $method = 'claude.ai') { return @{ loggedIn = $in; authMethod = $method; email = $mail; subscriptionType = $plan } }

$global:fake = Acct 'pat.person@example.com' 'pro'; $r = As-ClaudeChoose 'good'; Say ($r.allowed -and $r.plan -eq 'pro') 'same email (different capitals) on a paid plan is allowed'
Say (-not ((As-ToJson $r) -match '@')) 'the answer to the page carries no email'
$saved = [IO.File]::ReadAllText((Join-Path $root '_claude_check.json')); Say ($saved -notmatch '@|example' -and $saved -match 'user-1') 'nothing written holds an email'
foreach ($p in 'max', 'team', 'enterprise') { $global:fake = Acct 'pat.person@example.com' $p; Say ((As-ClaudeChoose 'good').allowed) ('allowed plan: ' + $p) }
foreach ($p in 'free', '') { $global:fake = Acct 'pat.person@example.com' $p; $r = As-ClaudeChoose 'good'; Say (-not $r.allowed -and $r.reason -eq 'not_paid') ('refused plan: "' + $p + '"') }
$global:fake = Acct 'pat.person@example.com' 'pro' $true 'api_key'; Say ((As-ClaudeChoose 'good').reason -eq 'not_paid') 'an API key sign-in is not the person''s plan'
$global:fake = Acct 'someone.else@example.com' 'max'; Say ((As-ClaudeChoose 'good').reason -eq 'email_mismatch') 'another person''s Claude account is refused'
$global:fake = Acct '' 'pro'; Say ((As-ClaudeChoose 'good').reason -eq 'email_mismatch') 'no email reported is refused'
$global:fake = Acct 'pat.person@example.com' 'pro' $false; Say ((As-ClaudeChoose 'good').reason -eq 'not_signed_in') 'signed out is refused'
$global:fake = $null; Say ((As-ClaudeChoose 'good').reason -eq 'no_claude_code') 'no Claude Code is refused'
$global:fake = @{ failed = $true }; Say ((As-ClaudeChoose 'good').reason -eq 'check_failed') 'a check that fails runs nothing'
$global:fake = Acct 'pat.person@example.com' 'pro'; Say ((As-ClaudeChoose 'bad').reason -eq 'hub_sign_in') 'an unconfirmed Hub login is refused'
Say ((As-ClaudeAtRun 'user-1').allowed) 'at press time the same account still passes'
$global:fake = Acct 'robin.other@example.com' 'pro'; Say ((As-ClaudeAtRun 'user-1').reason -eq 'email_mismatch') 'at press time, a second person signed in to Claude on a shared computer is refused'
$global:fake = Acct 'pat.person@example.com' 'pro'; Say ((As-ClaudeAtRun 'user-2').reason -eq 'not_checked') 'a login that was never checked is refused'
${function:global:As-HubUser} = $realHub
Say ($null -eq (As-HubUser 'not-a-token') -and $null -eq (As-HubUser 'aaa.bbb.ccc')) 'the real sign-in server refuses a made-up token'
${function:global:As-ClaudeStatus} = $realStatus
$s = As-ClaudeStatus
Say ($null -ne $s -and $s.ContainsKey('loggedIn')) 'the real Claude Code on this computer answers'
if ($null -ne $s) { Write-Host ('        signed in: ' + $s['loggedIn'] + ', plan: ' + $s['subscriptionType']) }
Remove-Item -Recurse -Force $root -ErrorAction SilentlyContinue
Write-Host ''; Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed'); if ($script:fail) { exit 1 }

# test_claude_routes.ps1 (2026-11-25). The Helper routes for J / F shortcut buttons, over a test server with the real routes. No window is opened and Claude is NOT started.
# The account check is the real one. Temp folders only. Run: powershell -NoProfile -ExecutionPolicy Bypass -File test_claude_routes.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path; $tk = Split-Path -Parent $here
$root = Join-Path $env:TEMP ('amit_croute_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8)); [void](New-Item -ItemType Directory -Force $root)
$env:AMIT_SCRIPTS_ROOT = $root; $env:AMIT_BUTTON_FILES_ROOT = (Join-Path $root 'docs'); $env:AMIT_TEST_NO_WINDOW = '1'; $env:AMIT_TEST_NO_RUNNER = '1'
$script:pass = 0; $script:fail = 0
function Say($c, $l) { if ($c) { $script:pass++; Write-Host ('  PASS  ' + $l) } else { $script:fail++; Write-Host ('  FAIL  ' + $l) } }
. (Join-Path $tk 'amit_script_routes.ps1')
$me = As-ClaudeStatus
As-WriteText (As-ClaudeFile) (As-ToJson (@{ 'me-1' = @{ emailPrint = (As-EmailPrint ([string]$me['email'])) }; 'other-2' = @{ emailPrint = (As-EmailPrint 'nobody@example.com') } }))
$port = 18737
function Call($method, $path, $body = $null, $origin = $null) {
    $rq = [System.Net.HttpWebRequest]::Create('http://localhost:' + $port + $path); $rq.Method = $method; $rq.Timeout = 60000
    if ($origin) { $rq.Headers.Add('Origin', $origin) }
    if ($null -ne $body) { $bytes = [Text.Encoding]::UTF8.GetBytes((As-ToJson $body)); $rq.ContentType = 'text/plain'; $rq.ContentLength = $bytes.Length; $s = $rq.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close() }
    try { $rs = $rq.GetResponse() } catch [System.Net.WebException] { $rs = $_.Exception.Response; if (-not $rs) { return @{ status = 0 } } }
    $t = (New-Object IO.StreamReader($rs.GetResponseStream())).ReadToEnd(); $code = [int]$rs.StatusCode; $rs.Close()
    $j = $null; try { $j = $t | ConvertFrom-Json } catch { }
    return @{ status = $code; json = $j; text = $t }
}
$a = 'cc-11111111-aaaa'; $b = 'cc-22222222-bbbb'; $site = 'https://askamit.org'
$cfg = @{ buttons = @(@{ id = $a; kind = 'claude'; name = 'Mine'; userId = 'me-1'; shortcutName = 'F mine'; shortcutText = 'Say hello.' }, @{ id = $b; kind = 'claude'; name = 'Theirs'; userId = 'other-2'; shortcutName = 'F theirs'; shortcutText = 'Say hello.' }) }
$srv = Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $here 'route_test_server.ps1') + '" -Port ' + $port) -PassThru -WindowStyle Hidden
try {
    $up = $false; for ($i = 0; $i -lt 40 -and -not $up; $i++) { Start-Sleep -Milliseconds 300; $up = (Call 'GET' '/api/script/status').status -eq 200 }
    Say ($up -and (Call 'POST' '/api/script/sync' $cfg $site).json.ok) 'the Hub sends two shortcut buttons'
    Say ((Call 'POST' '/api/script/claude-check' @{ token = 'x' } '').status -eq 403 -and (Call 'POST' '/api/script/claude-check' @{ token = 'x' } 'https://evil.example').status -eq 403) 'only an Amit page may ask for the account check'
    $r = Call 'POST' '/api/script/claude-check' @{ token = 'aaa.bbb.ccc' } $site
    Say ($r.json.allowed -eq $false -and $r.json.reason -eq 'hub_sign_in') 'a made-up Hub sign-in is refused'
    $ta = (Call 'GET' ('/api/script/open?button=' + $a)).json.token; $tb = (Call 'GET' ('/api/script/open?button=' + $b)).json.token
    Say ($ta.Length -eq 32 -and $tb.Length -eq 32) 'pressing the button on the bar opens it with a one-time token'
    Say ((Call 'GET' ('/api/script/claude-config?b=' + $a + '&t=' + $tb) $null 'null').status -eq 403) 'one button''s token does not open another'
    Say ((Call 'GET' ('/api/script/claude-config?b=' + $a + '&t=' + $ta) $null 'https://evil.example').status -eq 403) 'another website is refused'
    $r = Call 'GET' ('/api/script/claude-config?b=' + $a + '&t=' + $ta) $null 'null'
    Say ($r.json.check.allowed -eq $true -and $r.text -notmatch '@') 'my button: allowed, and no email in the answer'
    $r = Call 'GET' ('/api/script/claude-config?b=' + $b + '&t=' + $tb) $null 'null'
    Say ($r.json.check.allowed -eq $false -and $r.json.check.reason -eq 'email_mismatch') 'a button of another login: refused'
    $r = Call 'POST' ('/api/script/claude-start?b=' + $b + '&t=' + $tb) @{} 'null'
    Say ($r.status -eq 403 -and -not (Test-Path (Join-Path $root ($b + '\state\claude_job.json')))) 'it cannot be started by calling the route directly'
    Say ((Call 'POST' ('/api/script/claude-start?b=' + $a + '&t=' + $ta) @{} 'null').json.ok -and (Test-Path (Join-Path $root ($a + '\state\claude_job.json')))) 'mine starts'
    Say ((Call 'POST' ('/api/script/claude-reply?b=' + $a + '&t=' + $ta) @{ answer = 'hi' } 'null').status -eq 409) 'an answer is refused when Claude is not waiting for one'
    $st = Join-Path $root ($a + '\state'); $pid1 = [guid]::NewGuid().ToString('N')
    As-WriteText (Join-Path $st 'perm.json') (As-ToJson (@{ id = $pid1; plain = 'Claude wants to x'; detail = 'x' }))
    Say ((Call 'POST' ('/api/script/claude-perm?b=' + $a + '&t=' + $ta) @{ id = ('0' * 32); allow = $true } 'null').status -eq 409) 'Allow for a request the person was not shown is refused'
    $r = Call 'POST' ('/api/script/claude-perm?b=' + $a + '&t=' + $ta) @{ id = $pid1; allow = $true } 'null'
    Say ($r.json.ok -and ((Get-Content (Join-Path $st ('perm_' + $pid1 + '.json')) -Raw) -match '"allow":true')) 'Allow for the shown request is recorded'
    Say ((Call 'POST' ('/api/script/claude-stop?b=' + $a + '&t=' + $ta) @{} 'null').json.ok -and (Test-Path (Join-Path $st 'stop.flag'))) 'Stop is recorded'
} finally { Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force $root -ErrorAction SilentlyContinue }
Write-Host ''; Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed'); if ($script:fail) { exit 1 }

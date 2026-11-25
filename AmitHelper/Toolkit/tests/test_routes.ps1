# test_routes.ps1 (2026-11-24). Proves the /api/script/* routes with the REAL amit_script_routes.ps1 behind a small test server on a spare local port.
# Everything lives in a temp folder; no browser window opens (AMIT_TEST_NO_WINDOW). Plain ASCII (Windows PowerShell 5.1). Exit 0 only when every check passes.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 18731
$root = Join-Path $env:TEMP ('amit_routes_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8))
[void](New-Item -ItemType Directory -Force -Path $root)
$env:AMIT_SCRIPTS_ROOT = Join-Path $root 'scripts'
$env:AMIT_BUTTON_FILES_ROOT = Join-Path $root 'docs'
$env:AMIT_TEST_NO_WINDOW = '1'
$enc = New-Object System.Text.UTF8Encoding($false)
$script:pass = 0; $script:fail = 0
function Check { param([bool]$Cond, [string]$Label) if ($Cond) { $script:pass++; Write-Host ('  PASS  ' + $Label) } else { $script:fail++; Write-Host ('  FAIL  ' + $Label) -ForegroundColor Red } }

function Call {
    param([string]$Method, [string]$Route, $Body = $null, [string]$Origin = '')
    $h = @{}; if ($Origin) { $h['Origin'] = $Origin }
    $args2 = @{ Uri = ('http://localhost:' + $port + $Route); Method = $Method; UseBasicParsing = $true; Headers = $h; TimeoutSec = 20 }
    if ($null -ne $Body) { $args2['Body'] = ($Body | ConvertTo-Json -Depth 8); $args2['ContentType'] = 'text/plain' }
    try { $r = Invoke-WebRequest @args2; $status = [int]$r.StatusCode; $text = $r.Content }
    catch {
        $status = 0; $text = ''
        if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $text = $_.ErrorDetails.Message }   # Windows PowerShell 5.1 keeps the error body here
    }
    $j = $null; try { $j = $text | ConvertFrom-Json } catch { }
    return @{ status = $status; json = $j; text = $text }
}
function Get-Sha { param([string]$t) $s = [System.Security.Cryptography.SHA256]::Create(); return ([System.BitConverter]::ToString($s.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($t)))).Replace('-', '') }
function Wait-Done {
    param([string]$Id, [string]$Tok, [int]$Sec = 40)
    $end = (Get-Date).AddSeconds($Sec)
    while ((Get-Date) -lt $end) {
        $r = Call 'GET' ('/api/script/result?b=' + $Id + '&t=' + $Tok)
        if ($r.json -and -not $r.json.running -and $r.json.result) { return $r.json }
        Start-Sleep -Milliseconds 300
    }
    return $null
}

$data = Join-Path $root 'data'; [void](New-Item -ItemType Directory -Force -Path $data)
[System.IO.File]::WriteAllText((Join-Path $data 'in.csv'), "a,1`r`nb,2`r`n", $enc)
$id = 'btn-test-0001'
$good = @"
`$rows = (Read-AmitFile -Path '$data\in.csv') -split "``r?``n" | Where-Object { `$_ -ne '' }
`$who = Get-AmitAnswer -Name 'from_whom' -Default 'everyone'
Write-AmitFile -Path '$data\out.txt' -Content ('rows=' + `$rows.Count + ' who=' + `$who)
"@
$goodHash = Get-Sha $good
$site = 'https://askamit.org'
function New-Cfg {
    param([string]$State = 'active', [string]$Approved = '', [int]$Version = 1, $Questions = $null)
    if ($null -eq $Questions) { $Questions = @(@{ variable = 'from_whom'; label = 'From whom'; kind = 'text'; required = $false; askMode = 'remember'; status = 'active' }) }
    return @{ buttons = @(@{ id = $id; name = 'Test button'; version = $Version; approvedHash = $Approved; state = $State; sendingUnlocked = $false
        permissions = @{ reads = $true; writes = $true; sends = $false; folders = @($data); maxActions = 20; maxSeconds = 20 }
        questions = $Questions; settings = @{ blockedRecipients = @(); scriptTimeLimitSec = 20 }; card = @{ worstCase = 'x' } }) }
}

$srv = Start-Process -FilePath 'powershell.exe' -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $here 'route_test_server.ps1') + '" -Port ' + $port) -PassThru -WindowStyle Hidden
try {
    $up = $false
    for ($i = 0; $i -lt 40 -and -not $up; $i++) { Start-Sleep -Milliseconds 300; $r = Call 'GET' '/api/script/status'; if ($r.status -eq 200) { $up = $true } }
    Check $up 'the test server is up (local route answers with no Origin)'

    Write-Host '1. who may call what'
    Check ((Call 'GET' '/api/script/status' $null 'https://evil.example').status -eq 403) 'a local route refuses any web page (an Origin header)'
    Check ((Call 'POST' '/api/script/sync' (New-Cfg) '').status -eq 403) 'the Hub route refuses a caller with no Origin'
    Check ((Call 'POST' '/api/script/sync' (New-Cfg) 'https://evil.example').status -eq 403) 'the Hub route refuses another site'
    Check ((Call 'POST' '/api/script/sync' (New-Cfg) 'null').status -eq 403) 'the Hub route refuses a sandboxed page (Origin null)'
    $r = Call 'POST' '/api/script/sync' (New-Cfg 'practice_only') $site
    Check ($r.status -eq 200 -and $r.json.ok -and $r.json.buttons -eq 1) 'the Hub (an Amit site) can send the button settings'
    $bad = New-Cfg; $bad.buttons[0].id = '../x'
    Check ((Call 'POST' '/api/script/sync' $bad $site).status -eq 400) 'a button id that could climb out of the folder is refused'

    Write-Host '2. placing a script'
    $r = Call 'POST' '/api/script/place' @{ buttonId = $id; version = 1; text = $good; hash = 'ABC' } $site
    Check ($r.status -eq 400) 'a script whose fingerprint does not match is refused'
    $evil = "Remove-Item 'C:\x'`r`n" + $good
    $r = Call 'POST' '/api/script/place' @{ buttonId = $id; version = 1; text = $evil; hash = (Get-Sha $evil) } $site
    Check ($r.status -eq 422 -and $null -ne $r.json -and -not $r.json.ok -and @($r.json.violations).Count -ge 1) 'a script on the never list is refused, with the reasons'
    Check (-not (Test-Path (Join-Path (Join-Path (Join-Path $env:AMIT_SCRIPTS_ROOT $id) 'scripts') 'v1.ps1'))) 'and nothing was written'
    $r = Call 'POST' '/api/script/place' @{ buttonId = $id; version = 1; text = $good; hash = $goodHash } $site
    Check ($r.status -eq 200 -and $r.json.ok) 'a good script is placed'
    $placed = Join-Path (Join-Path (Join-Path $env:AMIT_SCRIPTS_ROOT $id) 'scripts') 'v1.ps1'
    Check ((Get-FileHash -LiteralPath $placed -Algorithm SHA256).Hash -eq $goodHash) 'the file on disk has exactly the approved fingerprint'
    Check ((Call 'POST' '/api/script/place' @{ buttonId = $id; version = 1; text = $good; hash = $goodHash } '').status -eq 403) 'placing needs the Hub origin too'

    Write-Host '3. opening and the token'
    $r = Call 'GET' ('/api/script/open?button=' + $id)
    Check ($r.status -eq 200 -and $r.json.token.Length -eq 32) 'open (from the bar, no Origin) gives a one-time token'
    $tok = $r.json.token
    Check ((Call 'GET' ('/api/script/open?button=nope-nope-nope')).status -eq 404) 'open for a button this computer does not know says so plainly'
    Check ((Call 'GET' ('/api/script/popup-config?b=' + $id + '&t=' + ('0' * 32))).status -eq 403) 'a wrong token is refused'
    Check ((Call 'GET' ('/api/script/popup-config?b=' + $id + '&t=' + $tok) $null 'https://evil.example').status -eq 403) 'a right token from another site is refused'
    $r = Call 'GET' ('/api/script/popup-config?b=' + $id + '&t=' + $tok) $null 'null'
    Check ($r.status -eq 200 -and $r.json.questions.Count -eq 1 -and $r.json.approved -eq $false) 'the pop-up can read its questions; the button is NOT approved yet'

    Write-Host '4. approval and trial'
    $r = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'practice'; answers = @{} } 'null'
    Check ($r.status -eq 403 -and $r.json.error -eq 'not_approved') 'a button the person has not approved will not run, even in practice'
    [void](Call 'POST' '/api/script/sync' (New-Cfg 'practice_only' $goodHash) $site)
    $r = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'real'; answers = @{} } 'null'
    Check ($r.status -eq 403 -and $r.json.error -eq 'practice_only') 'a button on trial will not run for real'

    Write-Host '5. a practice run, then a real run'
    $r = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'practice'; answers = @{ from_whom = 'Sue'; sneaky = 'x' } } 'null'
    Check ($r.status -eq 200 -and $r.json.ok) 'practice starts'
    $w = Wait-Done $id $tok
    Check ($null -ne $w -and $w.result.outcome -eq 'done' -and $w.result.mode -eq 'practice' -and $w.result.wouldHave.Count -eq 1) 'practice finishes and lists what it would change'
    Check (-not (Test-Path (Join-Path $data 'out.txt'))) 'practice changed nothing'
    [void](Call 'POST' '/api/script/sync' (New-Cfg 'active' $goodHash) $site)
    $r = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'real'; answers = @{ from_whom = 'Sue' } } 'null'
    Check ($r.status -eq 200) 'real starts once the button is active'
    $w = Wait-Done $id $tok
    Check ($null -ne $w -and $w.result.outcome -eq 'done' -and $w.result.counts.changed -eq 1) 'real finishes and changed one file'
    Check ((Get-Content (Join-Path $data 'out.txt') -Raw).Contains('who=Sue')) 'the answer reached the script as data'

    Write-Host '6. remembering and forgetting answers'
    $r = Call 'GET' ('/api/script/popup-config?b=' + $id + '&t=' + $tok) $null 'null'
    Check ($r.json.remembered.from_whom -eq 'Sue') 'the answer the person asked to be remembered comes back as "from last time"'
    [void](Call 'POST' ('/api/script/answers?b=' + $id + '&t=' + $tok) @{ forget = 'from_whom' } 'null')
    $r = Call 'GET' ('/api/script/answers?b=' + $id + '&t=' + $tok) $null 'null'
    Check ($null -eq $r.json.remembered.from_whom) 'forgetting one answer works'

    Write-Host '7. a missing required answer'
    $req = New-Cfg 'active' $goodHash 1 @(@{ variable = 'from_whom'; label = 'From whom'; kind = 'text'; required = $true; askMode = 'every_time'; status = 'active' })
    [void](Call 'POST' '/api/script/sync' $req $site)
    $r = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'practice'; answers = @{} } 'null'
    Check ($r.status -eq 400 -and $r.json.error -eq 'missing') 'a required question left empty is refused with a plain sentence'

    Write-Host '8. Stop, and a script changed after approval'
    $slow = "Write-AmitFile -Path '$data\before.txt' -Content 'x'`r`nStart-Sleep -Seconds 40`r`n"
    $r = Call 'POST' '/api/script/place' @{ buttonId = $id; version = 2; text = $slow; hash = (Get-Sha $slow) } $site
    Check ($r.status -eq 200) 'a second version is placed'
    [void](Call 'POST' '/api/script/sync' (New-Cfg 'active' (Get-Sha $slow) 2 @()) $site)
    $r = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'real'; answers = @{} } 'null'
    Check ($r.status -eq 200) 'the slow script starts'
    Start-Sleep -Milliseconds 2500
    $r2 = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'real'; answers = @{} } 'null'
    Check ($r2.status -eq 409) 'a second press while it runs is refused'
    [void](Call 'POST' ('/api/script/stop?b=' + $id + '&t=' + $tok) @{} 'null')
    $w = Wait-Done $id $tok 20
    Check ($null -ne $w -and $w.result.outcome -eq 'stopped' -and $w.result.error.kind -eq 'stopped_by_user') 'Stop from the pop-up stops it'
    Check ($w.result.counts.changed -eq 1) 'and the result still says what finished'
    $v2 = Join-Path (Join-Path (Join-Path $env:AMIT_SCRIPTS_ROOT $id) 'scripts') 'v2.ps1'
    [System.IO.File]::AppendAllText($v2, "`r`n# changed after approval")
    $r = Call 'POST' ('/api/script/run?b=' + $id + '&t=' + $tok) @{ mode = 'real'; answers = @{} } 'null'
    Check ($r.status -eq 403 -and $r.json.error -eq 'not_approved') 'a script edited on disk after approval will not run'
}
catch { Write-Host ('  ERROR  ' + $_.Exception.Message) -ForegroundColor Red; $script:fail++ }
finally {
    try { Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue } catch { }
    Start-Sleep -Milliseconds 400
    Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host ''
Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed')
if ($script:fail -gt 0) { exit 1 } else { exit 0 }

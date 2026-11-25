# test_websites.ps1 (2026-11-25). The safe "open website" tool: attack scripts must be refused by the check; honest ones must pass and run inside the limits.
# Temp folders only; no browser is opened (AMIT_TEST_NO_BROWSER). Run: powershell -NoProfile -ExecutionPolicy Bypass -File test_websites.ps1
$ErrorActionPreference = 'Stop'
$tk = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$root = Join-Path $env:TEMP ('amit_web_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8)); [void](New-Item -ItemType Directory -Force $root)
$env:AMIT_TEST_NO_BROWSER = '1'
$script:pass = 0; $script:fail = 0
function Say($c, $l) { if ($c) { $script:pass++; Write-Host ('  PASS  ' + $l) } else { $script:fail++; Write-Host ('  FAIL  ' + $l) } }
function Scan($code) { $f = Join-Path $root 's.ps1'; [IO.File]::WriteAllText($f, $code); $o = & (Join-Path $tk 'amit_script_check.ps1') -Path $f; return ((@($o) -join '') | ConvertFrom-Json) }

$good = @'
$music = Get-AmitAnswer -Name 'music' -Default 'psionic Hebrew'
$site = Get-AmitAnswer -Name 'site' -Default ''
$urls = @(('https://www.google.com/search?tbm=isch&q=' + [uri]::EscapeDataString('snow mountains')), ('https://www.youtube.com/results?search_query=' + [uri]::EscapeDataString("$music music")))
foreach ($u in $urls) { Open-AmitWebsite -Url $u; Start-Sleep -Milliseconds 50 }
if (-not [string]::IsNullOrWhiteSpace($site)) { Open-AmitWebsite -Url $site.Trim() }
Show-AmitNotice -Text "Your morning is ready."
'@
$r = Scan $good; Say ($r.ok -and $r.websites) ('an honest website script passes' + $(if (-not $r.ok) { ': ' + (($r.violations | ForEach-Object { "$($_.line) $($_.plain)" }) -join '; ') }))

$tail = "`r`nOpen-AmitWebsite -Url ('https://google.com/?q=' + `$x)"
$attacks = [ordered]@{
  'reads a file with Get-Content'           = '$x = Get-Content C:\a.txt'
  'reads with the short name gc'            = '$x = gc C:\a.txt'
  'lists files'                             = '$x = Get-ChildItem C:\Users'
  'reads through the toolkit'               = '$x = Read-AmitFile -Path C:\a.txt'
  'reads the clipboard'                     = '$x = Get-AmitClipboardText'
  'reads an environment value'              = '$x = $env:USERNAME'
  'reads a file as a drive variable'        = '$x = ${C:\a.txt}'
  'reads the home folder value'             = '$x = $HOME'
  'reads the host script job'               = '$x = $job.dirs.work'
  'uses a file class'                       = '$x = [IO.File]::ReadAllText(''C:\a.txt'')'
  'casts to a file class'                   = '$x = ([IO.FileInfo]''C:\a.txt'').Length'
  'casts with -as'                          = '$x = ''C:\a.txt'' -as ''IO.FileInfo'''
  'reads who the computer is'               = '$x = [Environment]::UserName'
  'calls a command by a built name'         = '$c = ''Get-'' + ''Content''; $x = & $c C:\a.txt'
  'reads with switch -File'                 = '$x = ''''; switch -File C:\a.txt { default { $x = $_ } }'
  'invokes a hidden method'                 = '$x = ''a''.PSObject.Methods[''ToString''].Invoke()'
  'calls a method by a built name'          = '$m = ''ToString''; $x = ''a''.$m()'
  'uses ForEach-Object member name'         = '$x = ''a'' | ForEach-Object ToString'
  'writes by redirection'                   = '$x = ''a''; $x > C:\a.txt'
  'defines its own function'                = 'function q { 1 }; $x = q'
  'reads registry'                          = '$x = Get-ItemProperty HKCU:\Software'
  'asks Windows about the computer'         = '$x = Get-CimInstance Win32_ComputerSystem'
  'starts a program itself'                 = 'Start-Process notepad; $x = 1'
}
foreach ($k in $attacks.Keys) { $r = Scan ($attacks[$k] + $tail); Say (-not $r.ok) ('refused: ' + $k) }
$r = Scan '$a = Get-Content -Path (Join-Path $env:TEMP ''x''); $a'; Say ($r.ok -and -not $r.websites) 'a script that opens no websites is checked the old way (unchanged)'
$r = Scan 'Start-Process https://example.com'; Say (-not $r.ok) 'Start-Process is still refused in every script'

# running it
function Run($code, $mode, $answers, $perm) {
  $d = Join-Path $root ([guid]::NewGuid().ToString('N').Substring(0, 6)); foreach ($s in 'work','backups','outbox','logs','state') { [void](New-Item -ItemType Directory -Force (Join-Path $d $s)) }
  $sp = Join-Path $d 'v1.ps1'; [IO.File]::WriteAllText($sp, $code)
  $job = @{ buttonId = 'b'; buttonName = 'web'; mode = $mode; scriptPath = $sp; expectedHash = ''; answers = $answers; permissions = $perm; settings = @{ scriptTimeLimitSec = 40 }
    dirs = @{ work = (Join-Path $d 'work'); backups = (Join-Path $d 'backups'); outbox = (Join-Path $d 'outbox'); logs = (Join-Path $d 'logs'); state = (Join-Path $d 'state'); scripts = $d }; resultPath = (Join-Path $d 'state\result.json') }
  $jp = Join-Path $d 'state\job.json'; [IO.File]::WriteAllText($jp, ($job | ConvertTo-Json -Depth 8))
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $tk 'amit_run_script.ps1') -JobPath $jp | Out-Null
  return (Get-Content (Join-Path $d 'state\result.json') -Raw | ConvertFrom-Json)
}
$perm = @{ opensWebsites = $true; websites = @('youtube.com', 'google.com'); reads = $true; clipboard = $true; maxActions = 20; maxSeconds = 40 }
$a = @{ music = 'psionic Hebrew'; site = 'cdn.pixabay.com/photo/x.jpg' }
$res = Run $good 'practice' $a $perm
Say ($res.outcome -eq 'done' -and @($res.wouldHave).Count -eq 3 -and $res.wouldHave[1].detail -match 'youtube\.com.*psionic%20Hebrew' -and $res.wouldHave[2].detail -match 'https://cdn\.pixabay\.com/photo/x\.jpg') ('practice lists the three exact addresses and opens nothing ' + $res.error.plain)
$res = Run $good 'real' $a $perm; Say ($res.outcome -eq 'done' -and $res.counts.opened -eq 3 -and $res.summary -match 'Opened 3') 'a real run opens them (browser switched off for the test)'
$res = Run 'Open-AmitWebsite -Url ''https://evil.example.com/a''' 'real' @{} $perm; Say ($res.error.kind -eq 'website_not_approved') 'a site that is neither approved nor typed is refused'
$res = Run 'Open-AmitWebsite -Url ''https://youtube.com.evil.com/a''' 'real' @{} $perm; Say ($res.error.kind -eq 'website_not_approved') 'a look-alike of an approved site is refused'
foreach ($bad in 'http://youtube.com', 'file:///C:/a.txt', 'https://user:pw@youtube.com', 'https://127.0.0.1/x', 'https://localhost/x', 'ms-settings:privacy') {
  $res = Run ("Open-AmitWebsite -Url '" + $bad + "'") 'real' @{} $perm; Say ($res.outcome -ne 'done' -and $res.counts.opened -eq 0) ('not opened: ' + $bad) }
$res = Run '1..12 | ForEach-Object { Open-AmitWebsite -Url ''https://youtube.com/'' }' 'real' @{} $perm; Say ($res.counts.opened -eq 10 -and $res.outcome -eq 'limit_reached') 'stops at 10 websites a press'
$res = Run 'Open-AmitWebsite -Url ''https://youtube.com/''' 'real' @{} @{ websites = @('youtube.com'); maxActions = 5 }; Say ($res.error.kind -eq 'not_permitted') 'without the permission nothing opens'
Remove-Item -Recurse -Force $root -ErrorAction SilentlyContinue
Write-Host ''; Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed'); if ($script:fail) { exit 1 }

# amit_script_routes.ps1 v0.1 (2026-11-24). The Helper bridge's routes for custom script buttons. Dot-sourced by amit_bridge_server.ps1 (inside its request handler) only when a
# /api/script/* request arrives. Plain ASCII (Windows PowerShell 5.1). Spec: AmitHelper\Button_Creator_SPEC.md section 11.
# Who may call what (the bridge listens on this computer only, but a web page can still try):
#   HUB routes  (sync, place)        : the Origin header must be one of the Amit site addresses (a sandboxed page or another site cannot fake that)
#   LOCAL routes (open, stopall, status): NO Origin header at all (the bar and local programs send none; a web page always does)
#   POPUP routes (popup-config, run, result, stop, answer, answers): a one-time token that /api/script/open made for ONE button and put only in the pop-up window's address;
#       the Origin may be absent, "null" (the page is a local file) or an Amit site address, never another site
# Handlers run in pooled runspaces, so nothing is kept in memory: tokens, config, remembered answers, job and result are small files under the scripts root.
# The JavaScriptSerializer is used for json in here, not ConvertTo-Json (that can hang on a cold runspace, see the bridge's own note).

function global:As-Root { if ($env:AMIT_SCRIPTS_ROOT) { return $env:AMIT_SCRIPTS_ROOT }; return (Join-Path $env:LOCALAPPDATA 'AmitComputerHealth\AmitScripts') }
function global:As-DocsRoot { if ($env:AMIT_BUTTON_FILES_ROOT) { return $env:AMIT_BUTTON_FILES_ROOT }; return (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Amit Button Files') }
function global:As-Js {
    Add-Type -AssemblyName System.Web.Extensions -ErrorAction SilentlyContinue
    $j = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $j.MaxJsonLength = 8000000
    return $j
}
function global:As-Q([string]$s) {
    $t = $s.Replace('\', '\\').Replace('"', '\"').Replace("`r", '\r').Replace("`n", '\n').Replace("`t", '\t')
    $t = [regex]::Replace($t, '[\x00-\x1f]', { param($m) ('\u' + ([int][char]$m.Value).ToString('x4')) })
    return ('"' + $t + '"')
}
# our own json writer: the built-in one trips over PowerShell's wrapper objects ("circular reference"), the same trap the bridge's own notes describe
function global:As-ToJson($o) {
    if ($null -eq $o) { return 'null' }
    $base = $o.psobject.BaseObject
    if ($base -isnot [System.Management.Automation.PSCustomObject]) { $o = $base }
    if ($null -eq $o) { return 'null' }
    if ($o -is [bool]) { if ($o) { return 'true' } else { return 'false' } }
    if ($o -is [string] -or $o -is [char]) { return (As-Q ([string]$o)) }
    if ($o -is [int] -or $o -is [long] -or $o -is [double] -or $o -is [single] -or $o -is [decimal] -or $o -is [int16] -or $o -is [byte] -or $o -is [uint32] -or $o -is [uint64]) { return [string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0}', $o) }
    if ($o -is [datetime]) { return (As-Q ($o.ToString('o'))) }
    if ($o -is [System.Collections.IDictionary]) {
        $p = New-Object System.Collections.ArrayList
        foreach ($k in @($o.Keys)) { [void]$p.Add((As-Q ([string]$k)) + ':' + (As-ToJson $o[$k])) }
        return ('{' + ($p -join ',') + '}')
    }
    if ($o -is [System.Management.Automation.PSCustomObject]) {
        $p = New-Object System.Collections.ArrayList
        foreach ($pr in $o.PSObject.Properties) { [void]$p.Add((As-Q ([string]$pr.Name)) + ':' + (As-ToJson $pr.Value)) }
        return ('{' + ($p -join ',') + '}')
    }
    if ($o -is [System.Collections.IEnumerable]) {
        $p = New-Object System.Collections.ArrayList
        foreach ($x in $o) { [void]$p.Add((As-ToJson $x)) }
        return ('[' + ($p -join ',') + ']')
    }
    return (As-Q ([string]$o))
}
function global:As-Get($d, [string]$k, $def = $null) { if ($d -is [System.Collections.IDictionary] -and $d.ContainsKey($k) -and $null -ne $d[$k]) { return $d[$k] }; return $def }
function global:As-SafeId([string]$id) { if ($id -match '^[A-Za-z0-9-]{8,64}$') { return $id }; return $null }
function global:As-Send($Response, $Obj, [int]$Status = 200) { Send-JsonRaw $Response (As-ToJson ($Obj)) $Status }
function global:As-Body($Request) {
    $sr = New-Object System.IO.StreamReader($Request.InputStream, [System.Text.Encoding]::UTF8)
    $t = $sr.ReadToEnd(); $sr.Dispose()
    if ($t.Length -gt 4000000) { return $null }
    return $t
}
function global:As-ReadJson([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    try { return (As-Js).DeserializeObject([System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)) } catch { return $null }
}
function global:As-WriteText([string]$Path, [string]$Text) {
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $dir)) { [void](New-Item -ItemType Directory -Force -Path $dir) }
    $tmp = $Path + '.tmp'
    [System.IO.File]::WriteAllText($tmp, $Text, (New-Object System.Text.UTF8Encoding($false)))
    [System.IO.File]::Copy($tmp, $Path, $true); [System.IO.File]::Delete($tmp)
}
function global:As-Dirs([string]$id) {
    $base = Join-Path (As-Root) $id
    $docs = Join-Path (As-DocsRoot) $id
    return @{ base = $base; scripts = (Join-Path $base 'scripts'); state = (Join-Path $base 'state'); logs = (Join-Path $base 'logs'); backups = (Join-Path $base 'backups'); work = (Join-Path $docs 'Work'); outbox = (Join-Path $docs 'Outbox') }
}
function global:As-ScriptPath([string]$id, [int]$version) { return (Join-Path (As-Dirs $id).scripts ('v' + $version + '.ps1')) }
function global:As-Sha([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash }
function global:As-Config { $c = As-ReadJson (Join-Path (As-Root) '_config.json'); if ($null -eq $c) { return @{ buttons = @() } }; return $c }
function global:As-Button([string]$id) {
    foreach ($b in @((As-Get (As-Config) 'buttons' @()))) { if ([string](As-Get $b 'id') -eq $id) { return $b } }
    return $null
}
function global:As-OriginKind($Request, $Sites) {
    $o = $Request.Headers['Origin']
    if ([string]::IsNullOrEmpty($o)) { return 'none' }
    if ($o -eq 'null') { if ($env:AMIT_TEST_NULL_IS_SITE) { return 'site' }; return 'null' }   # the env switch is for the automated tests only (a local page has Origin null)
    if (@($Sites) -contains $o) { return 'site' }
    return 'other'
}
function global:As-TokenFile { return (Join-Path (As-Root) '_tokens.json') }
function global:As-NewToken([string]$id) {
    $tokens = As-ReadJson (As-TokenFile); if ($null -eq $tokens) { $tokens = @{} }
    $now = [DateTime]::UtcNow.Ticks
    $keep = @{}
    foreach ($k in @($tokens.Keys)) { if ([int64](As-Get $tokens[$k] 'exp' 0) -gt $now) { $keep[$k] = $tokens[$k] } }
    $t = [guid]::NewGuid().ToString('N')
    $keep[$t] = @{ b = $id; exp = [DateTime]::UtcNow.AddHours(8).Ticks }
    As-WriteText (As-TokenFile) (As-ToJson ($keep))
    return $t
}
function global:As-CheckToken([string]$token, [string]$id) {
    if ($token -notmatch '^[0-9a-f]{32}$') { return $false }
    $tokens = As-ReadJson (As-TokenFile); if ($null -eq $tokens -or -not $tokens.ContainsKey($token)) { return $false }
    $e = $tokens[$token]
    return ([string](As-Get $e 'b') -eq $id -and [int64](As-Get $e 'exp' 0) -gt [DateTime]::UtcNow.Ticks)
}
function global:As-Alive([string]$id) {
    $pf = Join-Path (As-Dirs $id).state 'run.pid'
    if (-not (Test-Path -LiteralPath $pf)) { return $false }
    try { $pidv = [int]([System.IO.File]::ReadAllText($pf).Trim()); $p = Get-Process -Id $pidv -ErrorAction Stop; return (-not $p.HasExited) } catch { return $false }
}
function global:As-Remembered([string]$id, $questions) {
    $a = As-ReadJson (Join-Path (As-Dirs $id).state 'answers.json'); $out = @{}
    if ($null -eq $a) { return $out }
    foreach ($q in @($questions)) {
        $v = [string](As-Get $q 'variable'); if (-not $a.ContainsKey($v)) { continue }
        $days = [int](As-Get $q 'rememberDays' 0); $saved = As-Get $a[$v] 'savedAt'
        if ($days -gt 0 -and $saved) { try { if (([DateTime]::UtcNow - [DateTime]::Parse([string]$saved).ToUniversalTime()).TotalDays -gt $days) { continue } } catch { continue } }
        $out[$v] = As-Get $a[$v] 'value'
    }
    return $out
}
function global:As-OpenPopup([string]$id, [string]$token) {
    if ($env:AMIT_TEST_NO_WINDOW) { return $true }
    $exe = $null
    foreach ($c in @((Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'), (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'), (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'), (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'))) { if ($c -and (Test-Path -LiteralPath $c)) { $exe = $c; break } }
    $page = Join-Path $PSScriptRoot 'AmitScriptPopup.html'
    if (-not $exe -or -not (Test-Path -LiteralPath $page)) { return $false }
    $url = ([Uri]$page).AbsoluteUri + '?b=' + $id + '&t=' + $token
    $w = 480; $h = 760; $x = 40; $y = 30
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
        $h = [Math]::Min(760, $wa.Height - 40); $x = [Math]::Max(0, $wa.Right - 96 - $w - 14); $y = $wa.Top + 20
    } catch { }
    Start-Process -FilePath $exe -ArgumentList ('--app="' + $url + '" --window-size=' + $w + ',' + $h + ' --window-position=' + $x + ',' + $y) | Out-Null
    return $true
}

function global:Invoke-AmitScriptRoute {
    param($Path, $Request, $Response, $SiteOrigins)
    $ok = $Request.HttpMethod
    $kind = As-OriginKind $Request $SiteOrigins
    $q = $Request.QueryString
    $route = ([string]$Path).Substring('/api/script/'.Length)

    # ---- HUB read routes (GET): the Helper's never list, and the text of a script already on this computer (so Amit can be shown the current script when a change is asked for) ----
    if ($route -eq 'neverlist' -or $route -eq 'source' -or $route -eq 'inbox') {
        if ($kind -ne 'site' -or $ok -ne 'GET') { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
        if ($route -eq 'inbox') {
            # the drop folder the person's OWN Claude writes into (the "make button" shortcut): one folder per button, holding script.ps1, definition.json, questions.json (optional), summary.txt (optional)
            $items = New-Object System.Collections.ArrayList
            $ib = Join-Path (As-Root) '_inbox'
            if (Test-Path -LiteralPath $ib) {
                foreach ($dir in @(Get-ChildItem -LiteralPath $ib -Directory -ErrorAction SilentlyContinue | Select-Object -First 10)) {
                    $sp2 = Join-Path $dir.FullName 'script.ps1'; $dp = Join-Path $dir.FullName 'definition.json'
                    if (-not ((Test-Path -LiteralPath $sp2) -and (Test-Path -LiteralPath $dp))) { continue }
                    $qp = Join-Path $dir.FullName 'questions.json'; $sm = Join-Path $dir.FullName 'summary.txt'
                    $qt = '[]'; if (Test-Path -LiteralPath $qp) { $qt = [System.IO.File]::ReadAllText($qp, [System.Text.Encoding]::UTF8) }
                    $st = ''; if (Test-Path -LiteralPath $sm) { $st = [System.IO.File]::ReadAllText($sm, [System.Text.Encoding]::UTF8) }
                    [void]$items.Add(@{ name = $dir.Name; script = [System.IO.File]::ReadAllText($sp2, [System.Text.Encoding]::UTF8); definition = [System.IO.File]::ReadAllText($dp, [System.Text.Encoding]::UTF8); questions = $qt; summary = $st })
                }
            }
            As-Send $Response @{ ok = $true; items = $items }; return
        }
        if ($route -eq 'neverlist') {
            $nf = Join-Path $PSScriptRoot 'never_list.json'
            if (-not (Test-Path -LiteralPath $nf)) { As-Send $Response @{ ok = $false; error = 'no never list' } 404; return }
            Send-JsonRaw $Response ('{"ok":true,"list":' + [System.IO.File]::ReadAllText($nf, [System.Text.Encoding]::UTF8) + '}'); return
        }
        $sid = As-SafeId ([string]$q['button']); $sver = 0; [void][int]::TryParse([string]$q['version'], [ref]$sver)
        if (-not $sid -or $sver -lt 1 -or -not (Test-Path -LiteralPath (As-ScriptPath $sid $sver))) { As-Send $Response @{ ok = $false; error = 'no such script on this computer' } 404; return }
        As-Send $Response @{ ok = $true; text = [System.IO.File]::ReadAllText((As-ScriptPath $sid $sver), [System.Text.Encoding]::UTF8) }; return
    }

    # ---- HUB routes: Origin must be an Amit site address ----
    if ($route -eq 'sync' -or $route -eq 'place' -or $route -eq 'inbox-done') {
        if ($kind -ne 'site' -or $ok -ne 'POST') { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
        $body = As-Body $Request; if ($null -eq $body) { As-Send $Response @{ ok = $false; error = 'too big' } 413; return }
        try { $in = (As-Js).DeserializeObject($body) } catch { As-Send $Response @{ ok = $false; error = 'not readable' } 400; return }
        if ($route -eq 'inbox-done') {
            $nm = [string](As-Get $in 'name' '')
            if ($nm -notmatch '^[A-Za-z0-9][A-Za-z0-9 _.-]{0,59}$' -or $nm -like '*..*') { As-Send $Response @{ ok = $false; error = 'bad name' } 400; return }
            $target = Join-Path (Join-Path (As-Root) '_inbox') $nm
            if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue }
            As-Send $Response @{ ok = $true }; return
        }
        if ($route -eq 'sync') {
            $list = New-Object System.Collections.ArrayList
            foreach ($b in @((As-Get $in 'buttons' @()))) {
                $id = As-SafeId ([string](As-Get $b 'id')); if (-not $id) { As-Send $Response @{ ok = $false; error = 'a button id is not valid' } 400; return }
                [void]$list.Add($b)
                if ($list.Count -gt 200) { As-Send $Response @{ ok = $false; error = 'too many buttons' } 400; return }
            }
            As-WriteText (Join-Path (As-Root) '_config.json') (As-ToJson (@{ buttons = $list; syncedAt = (Get-Date).ToString('o') }))
            As-Send $Response @{ ok = $true; buttons = $list.Count }; return
        }
        # place: write the script file exactly as received, only if its fingerprint matches and the never-list scan passes
        $id = As-SafeId ([string](As-Get $in 'buttonId')); $ver = [int](As-Get $in 'version' 0); $text = [string](As-Get $in 'text' ''); $hash = ([string](As-Get $in 'hash' '')).ToUpper()
        if (-not $id -or $ver -lt 1 -or $ver -gt 9999 -or $text.Length -lt 1 -or $text.Length -gt 200000) { As-Send $Response @{ ok = $false; error = 'the script, button id or version is not valid' } 400; return }
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $have = ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text)))).Replace('-', '')
        if ($have -ne $hash) { As-Send $Response @{ ok = $false; error = 'the fingerprint does not match the script' } 400; return }
        $d = As-Dirs $id
        foreach ($x in @($d.scripts, $d.state, $d.logs, $d.backups)) { if (-not (Test-Path -LiteralPath $x)) { [void](New-Item -ItemType Directory -Force -Path $x) } }
        $tmpScript = Join-Path $d.scripts ('v' + $ver + '.check.ps1')
        [System.IO.File]::WriteAllText($tmpScript, $text, (New-Object System.Text.UTF8Encoding($false)))
        $scan = & (Join-Path $PSScriptRoot 'amit_script_check.ps1') -Path $tmpScript
        [System.IO.File]::Delete($tmpScript)
        $res = $null; try { $res = (As-Js).DeserializeObject((@($scan) -join '')) } catch { $res = $null }
        if ($null -eq $res -or $res['ok'] -ne $true) { As-Send $Response @{ ok = $false; error = 'refused'; violations = (As-Get $res 'violations' @()); parseErrors = (As-Get $res 'parseErrors' @()) } 422; return }
        [System.IO.File]::WriteAllText((As-ScriptPath $id $ver), $text, (New-Object System.Text.UTF8Encoding($false)))
        As-Send $Response @{ ok = $true; hash = $hash; version = $ver }; return
    }

    # ---- LOCAL routes: no Origin header at all ----
    if ($route -eq 'open' -or $route -eq 'stopall' -or $route -eq 'status') {
        if ($kind -ne 'none') { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
        if ($route -eq 'status') { As-Send $Response @{ ok = $true; buttons = @((As-Get (As-Config) 'buttons' @())).Count }; return }
        if ($route -eq 'stopall') {
            $n = 0
            foreach ($b in @((As-Get (As-Config) 'buttons' @()))) { $bid = [string](As-Get $b 'id'); if ($bid -and (As-Alive $bid)) { As-WriteText (Join-Path (As-Dirs $bid).state 'stop.flag') 'stop'; $n++ } }
            As-Send $Response @{ ok = $true; stopped = $n }; return
        }
        $id = As-SafeId ([string]$q['button']); if (-not $id) { As-Send $Response @{ ok = $false; error = 'no such button' } 400; return }
        $b = As-Button $id
        if ($null -eq $b) { As-Send $Response @{ ok = $false; error = 'This button has not been sent to this computer yet. Open the Hub once so it can.' } 404; return }
        $ver = [int](As-Get $b 'version' 0)
        if ($ver -lt 1 -or -not (Test-Path -LiteralPath (As-ScriptPath $id $ver))) { As-Send $Response @{ ok = $false; error = 'The script for this button is not on this computer. Ask Amit to rebuild it.' } 404; return }
        $tok = As-NewToken $id
        $opened = As-OpenPopup $id $tok
        if ($env:AMIT_TEST_NO_WINDOW) { As-Send $Response @{ ok = $true; token = $tok } } else { As-Send $Response @{ ok = $opened } }
        return
    }

    # ---- POPUP routes: a token for this button ----
    if ($kind -eq 'other') { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
    $id = As-SafeId ([string]$q['b']); $tok = [string]$q['t']
    if (-not $id -or -not (As-CheckToken $tok $id)) { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
    $b = As-Button $id
    if ($null -eq $b) { As-Send $Response @{ ok = $false; error = 'no such button' } 404; return }
    $d = As-Dirs $id; $ver = [int](As-Get $b 'version' 0); $sp = As-ScriptPath $id $ver
    $questions = @((As-Get $b 'questions' @()) | Where-Object { (As-Get $_ 'status' 'active') -eq 'active' })

    if ($route -eq 'popup-config') {
        $approved = $false
        if (Test-Path -LiteralPath $sp) { $ah = [string](As-Get $b 'approvedHash' ''); if ($ah -and ((As-Sha $sp) -eq $ah.ToUpper())) { $approved = $true } }
        As-Send $Response @{ ok = $true; id = $id; name = (As-Get $b 'name' 'Button'); version = $ver; approved = $approved; state = (As-Get $b 'state' 'practice_only'); sendingUnlocked = ((As-Get $b 'sendingUnlocked' $false) -eq $true)
            card = (As-Get $b 'card' @{}); questions = $questions; remembered = (As-Remembered $id $questions); settings = (As-Get $b 'settings' @{}); running = (As-Alive $id) }
        return
    }
    if ($route -eq 'run') {
        if ($ok -ne 'POST') { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
        $body = As-Body $Request; try { $in = (As-Js).DeserializeObject($body) } catch { As-Send $Response @{ ok = $false; error = 'not readable' } 400; return }
        $mode = [string](As-Get $in 'mode' 'practice'); if ($mode -ne 'practice' -and $mode -ne 'real') { As-Send $Response @{ ok = $false; error = 'bad mode' } 400; return }
        if (-not (Test-Path -LiteralPath $sp)) { As-Send $Response @{ ok = $false; error = 'The script for this button is not on this computer.' } 404; return }
        $ah = [string](As-Get $b 'approvedHash' ''); if (-not $ah -or ((As-Sha $sp) -ne $ah.ToUpper())) { As-Send $Response @{ ok = $false; error = 'not_approved'; plain = 'This button needs your approval in the Hub before it can run.' } 403; return }
        $state = [string](As-Get $b 'state' 'practice_only')
        if ($state -eq 'paused' -or $state -eq 'needs_attention') { As-Send $Response @{ ok = $false; error = $state; plain = 'This button is paused.' } 403; return }
        if ($mode -eq 'real' -and $state -ne 'active') { As-Send $Response @{ ok = $false; error = 'practice_only'; plain = 'This button is still on trial. Practice first, then allow it in the Hub.' } 403; return }
        if (As-Alive $id) { As-Send $Response @{ ok = $false; error = 'already_running'; plain = 'This button is already running.' } 409; return }
        # the answers: only variables this button asks, as plain data, with a length limit
        $given = As-Get $in 'answers' @{}; $answers = @{}; $missing = New-Object System.Collections.ArrayList; $extra = New-Object System.Collections.ArrayList
        foreach ($qq in $questions) {
            $v = [string](As-Get $qq 'variable'); $val = As-Get $given $v
            $isEmpty = ($null -eq $val -or ([string]$val) -eq '')
            if ($isEmpty -and (As-Get $qq 'required' $true) -eq $true -and (As-Get $qq 'showIfVariable' '') -eq '') { [void]$missing.Add([string](As-Get $qq 'label' $v)); continue }
            if ($isEmpty) { continue }
            if ($val -is [System.Collections.IEnumerable] -and $val -isnot [string]) { $answers[$v] = @(@($val) | ForEach-Object { ([string]$_).Substring(0, [Math]::Min(500, ([string]$_).Length)) }) }
            else { $s = [string]$val; $answers[$v] = $s.Substring(0, [Math]::Min(2000, $s.Length)) }
            $k = [string](As-Get $qq 'kind')
            if (($k -eq 'file' -or $k -eq 'folder') -and $answers[$v] -is [string] -and $answers[$v].Length -gt 2) { [void]$extra.Add($answers[$v]) }
        }
        if ($missing.Count -gt 0) { As-Send $Response @{ ok = $false; error = 'missing'; plain = ('Please answer: ' + ($missing -join ', ')); missing = $missing } 400; return }
        foreach ($qq in $questions) { }
        $perm = As-Get $b 'permissions' @{}
        $folders = New-Object System.Collections.ArrayList
        foreach ($f in @((As-Get $perm 'folders' @()))) { if ($f) { [void]$folders.Add([string]$f) } }
        foreach ($f in $extra) { [void]$folders.Add([string]$f) }
        $set = As-Get $b 'settings' @{}
        foreach ($x in @($d.state, $d.logs, $d.work, $d.outbox)) { if (-not (Test-Path -LiteralPath $x)) { [void](New-Item -ItemType Directory -Force -Path $x) } }
        $job = @{ buttonId = $id; buttonName = (As-Get $b 'name' 'Button'); mode = $mode; scriptPath = $sp; expectedHash = $ah.ToUpper(); answers = $answers
            permissions = @{ reads = ((As-Get $perm 'reads' $true) -eq $true); writes = ((As-Get $perm 'writes' $false) -eq $true); sends = ((As-Get $perm 'sends' $false) -eq $true); clipboard = ((As-Get $perm 'clipboard' $false) -eq $true)
                folders = @($folders); allowedRecipients = @((As-Get $perm 'allowedRecipients' @())); maxActions = [int](As-Get $perm 'maxActions' 20); maxSeconds = [int](As-Get $perm 'maxSeconds' 60) }
            settings = @{ blockedRecipients = @((As-Get $set 'blockedRecipients' @())); noSendFrom = (As-Get $set 'noSendFrom'); noSendTo = (As-Get $set 'noSendTo'); sendingUnlocked = ((As-Get $b 'sendingUnlocked' $false) -eq $true); scriptTimeLimitSec = [int](As-Get $set 'scriptTimeLimitSec' 60) }
            dirs = @{ work = $d.work; backups = $d.backups; outbox = $d.outbox; logs = $d.logs; state = $d.state; scripts = $d.scripts }; resultPath = (Join-Path $d.state 'result.json') }
        $jobPath = Join-Path $d.state 'job.json'
        As-WriteText $jobPath (As-ToJson ($job))
        # remember the answers the person asked to be remembered (never the ones typed for a button that keeps asking)
        $mem = As-ReadJson (Join-Path $d.state 'answers.json'); if ($null -eq $mem) { $mem = @{} }
        foreach ($qq in $questions) { $v = [string](As-Get $qq 'variable'); if ((As-Get $qq 'askMode' 'every_time') -eq 'remember' -and $answers.ContainsKey($v)) { $mem[$v] = @{ value = $answers[$v]; savedAt = (Get-Date).ToUniversalTime().ToString('o') } } }
        As-WriteText (Join-Path $d.state 'answers.json') (As-ToJson ($mem))
        foreach ($f in @('result.json', 'stop.flag', 'ask.json', 'answer.json', 'progress.json')) { $fp = Join-Path $d.state $f; if (Test-Path -LiteralPath $fp) { [System.IO.File]::Delete($fp) } }
        $runner = Join-Path $PSScriptRoot 'amit_run_script.ps1'
        $p = Start-Process -FilePath 'powershell.exe' -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $runner + '" -JobPath "' + $jobPath + '"') -PassThru -WindowStyle Hidden
        As-WriteText (Join-Path $d.state 'run.pid') ([string]$p.Id)
        As-Send $Response @{ ok = $true; mode = $mode }; return
    }
    if ($route -eq 'result') {
        $alive = As-Alive $id
        $res = As-ReadJson (Join-Path $d.state 'result.json'); $prog = As-ReadJson (Join-Path $d.state 'progress.json'); $ask = As-ReadJson (Join-Path $d.state 'ask.json')
        if (-not $alive -and $null -eq $res -and (Test-Path -LiteralPath (Join-Path $d.state 'run.pid'))) { $res = @{ ok = $false; outcome = 'failed'; error = @{ kind = 'script_crashed'; plain = 'The script closed without finishing.' }; summary = 'The button stopped.' } }
        As-Send $Response @{ ok = $true; running = $alive; result = $res; progress = $prog; ask = $ask }; return
    }
    if ($route -eq 'stop') {
        if ($ok -ne 'POST') { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
        As-WriteText (Join-Path $d.state 'stop.flag') 'stop'
        As-Send $Response @{ ok = $true }; return
    }
    if ($route -eq 'answer') {
        if ($ok -ne 'POST') { As-Send $Response @{ ok = $false; error = 'forbidden' } 403; return }
        $body = As-Body $Request; try { $in = (As-Js).DeserializeObject($body) } catch { As-Send $Response @{ ok = $false; error = 'not readable' } 400; return }
        if (-not (Test-Path -LiteralPath (Join-Path $d.state 'ask.json'))) { As-Send $Response @{ ok = $false; error = 'nothing is waiting for an answer' } 409; return }
        $a = [string](As-Get $in 'answer' ''); if ($a.Length -gt 2000) { $a = $a.Substring(0, 2000) }
        As-WriteText (Join-Path $d.state 'answer.json') (As-ToJson (@{ answer = $a }))
        As-Send $Response @{ ok = $true }; return
    }
    if ($route -eq 'answers') {
        $af = Join-Path $d.state 'answers.json'
        if ($ok -eq 'POST') {
            $body = As-Body $Request; try { $in = (As-Js).DeserializeObject($body) } catch { As-Send $Response @{ ok = $false; error = 'not readable' } 400; return }
            $var = [string](As-Get $in 'forget' '')
            if ($var -eq '*') { if (Test-Path -LiteralPath $af) { [System.IO.File]::Delete($af) } }
            elseif ($var -match '^[a-z][a-z0-9_]{0,39}$') { $mem = As-ReadJson $af; if ($null -ne $mem -and $mem.ContainsKey($var)) { [void]$mem.Remove($var); As-WriteText $af (As-ToJson ($mem)) } }
            As-Send $Response @{ ok = $true }; return
        }
        As-Send $Response @{ ok = $true; remembered = (As-Remembered $id $questions) }; return
    }
    As-Send $Response @{ ok = $false; error = 'unknown route' } 404
}

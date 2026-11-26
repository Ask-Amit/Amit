# amit_coder_routes.ps1 v0.01 (Amit Helper, 2026-11-26). The Helper bridge's Amit Coder routes, everything under /api/coder/.
# Dot-sourced by amit_bridge_server.ps1 only when such a request arrives. Uses the account checks already in amit_script_routes.ps1. Plain ASCII (Windows PowerShell 5.1).
# Who may call:
#   status                : anyone local; it says only that the coding routes exist.
#   everything else       : ONLY a page from an Amit site address (a preview, a local file or any other site is refused), and after connect, only with that connection's session key.
# connect checks: the Amit sign-in (asked of Amit's own sign-in server), owner only while this is being built, the person's OWN paid Claude account (root premium rule),
# the Amit folder, and Node.js. The Claude account is checked again on EVERY message sent. This program holds no database key and never stores the person's sign-in.
# The coding work is done by amit_coder_engine.js, which has no port; commands go to it as files.

function global:Ac-Root { if ($env:AMIT_CODER_STATE) { return $env:AMIT_CODER_STATE }; return (Join-Path $env:LOCALAPPDATA 'AmitComputerHealth\AmitCoder') }
function global:Ac-Hex([int]$bytes) { $b = New-Object byte[] $bytes; $r = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $r.GetBytes($b); return ([System.BitConverter]::ToString($b)).Replace('-', '').ToLowerInvariant() }
function global:Ac-Sha([string]$s) { $h = [System.Security.Cryptography.SHA256]::Create(); return ([System.BitConverter]::ToString($h.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($s)))).Replace('-', '') }
function global:Ac-Config { return (As-ReadJson (Join-Path (Ac-Root) 'config.json')) }
function global:Ac-Folder { $c = Ac-Config; $f = [string](As-Get $c 'amitFolder' ''); if ($f -and (Test-Path -LiteralPath (Join-Path $f 'CLAUDE.md'))) { return $f }; return $null }
function global:Ac-Node { $g = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1; if ($g) { return $g.Source }; $p = Join-Path $env:ProgramFiles 'nodejs\node.exe'; if (Test-Path -LiteralPath $p) { return $p }; return $null }
function global:Ac-EngineAlive {
    $e = As-ReadJson (Join-Path (Ac-Root) 'engine.json')
    if ($null -eq $e) { return $false }
    $p = Get-Process -Id ([int](As-Get $e 'pid' 0)) -ErrorAction SilentlyContinue
    if (-not $p -or $p.ProcessName -ne 'node') { return $false }
    $now = [int64]([DateTime]::UtcNow - (Get-Date '1970-01-01')).TotalMilliseconds
    return (($now - [int64](As-Get $e 'at' 0)) -lt 15000)
}
function global:Ac-StartEngine([string]$watchers, [string]$folder, [string]$node, [string]$claude) {
    if (Ac-EngineAlive) { return $true }
    $engine = Join-Path $watchers 'amit_coder_engine.js'
    if (-not (Test-Path -LiteralPath $engine)) { return $false }
    Remove-Item -LiteralPath (Join-Path (Ac-Root) 'engine.json') -ErrorAction SilentlyContinue
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $node; $psi.Arguments = ('"{0}" "{1}" "{2}" "{3}"' -f $engine, (Ac-Root), $folder.TrimEnd('\'), $claude)
    $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true; $psi.WorkingDirectory = $watchers
    [void][System.Diagnostics.Process]::Start($psi)
    for ($i = 0; $i -lt 60; $i++) { Start-Sleep -Milliseconds 100; if (Ac-EngineAlive) { return $true } }
    return $false
}
function global:Ac-Command([string]$what, $body, [bool]$wantReply) {
    $inbox = Join-Path (Ac-Root) 'inbox'
    $id = Ac-Hex 8
    $o = @{ what = $what; body = $body }
    if ($wantReply) { $o.reply = $id }
    $name = '{0:D20}_{1}' -f [DateTime]::UtcNow.Ticks, $id
    $tmp = Join-Path $inbox ($name + '.tmp')
    [System.IO.File]::WriteAllText($tmp, (As-ToJson $o), (New-Object System.Text.UTF8Encoding($false)))
    Move-Item -LiteralPath $tmp -Destination (Join-Path $inbox ($name + '.json')) -Force
    return $id
}
# send a command and wait for the engine's answer (as the JSON text it wrote)
function global:Ac-Ask([string]$what, $body, [int]$waitMs = 20000) {
    $id = Ac-Command $what $body $true
    $file = Join-Path (Join-Path (Ac-Root) 'reply') ($id + '.json')
    $end = [DateTime]::UtcNow.AddMilliseconds($waitMs)
    while ([DateTime]::UtcNow -lt $end) {
        if (Test-Path -LiteralPath $file) { $t = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8); Remove-Item -LiteralPath $file -ErrorAction SilentlyContinue; return $t }
        Start-Sleep -Milliseconds 40
    }
    return $null
}
# the events newer than $after, as the raw JSON lines the engine wrote
function global:Ac-NewEvents([int64]$after) {
    $file = Join-Path (Ac-Root) 'events.jsonl'
    $out = New-Object System.Collections.ArrayList
    try {
        $fs = New-Object System.IO.FileStream($file, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $sr = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8)
        $text = $sr.ReadToEnd(); $sr.Dispose(); $fs.Dispose()
    } catch { return , $out }
    $cut = $text.LastIndexOf("`n"); if ($cut -lt 0) { return , $out }   # a half-written last line waits for the next look
    foreach ($line in $text.Substring(0, $cut).Split("`n")) {
        if ($line.Length -lt 8) { continue }
        $m = [regex]::Match($line, '^\{"n":([0-9]+),')
        if ($m.Success -and [int64]$m.Groups[1].Value -gt $after) { [void]$out.Add($line); if ($out.Count -ge 400) { break } }
    }
    return , $out
}

function global:Invoke-AmitCoderRoute {
    param($Path, $Request, $Response, $SiteOrigins, $WatcherDir)
    $what = $Path.Substring('/api/coder/'.Length)
    if ($what -eq 'status') { As-Send $Response @{ coder = $true; version = '0.01' }; return }
    if ((As-OriginKind $Request $SiteOrigins) -ne 'site') { As-Send $Response @{ ok = $false; error = 'Refused: only the Amit website may use the coding connection.' } 403; return }
    foreach ($d in @((Ac-Root), (Join-Path (Ac-Root) 'inbox'), (Join-Path (Ac-Root) 'reply'))) { if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null } }
    $keyFile = Join-Path (Ac-Root) 'connection.json'

    if ($what -eq 'connect') {
        if ($Request.HttpMethod -ne 'POST') { As-Send $Response @{ ok = $false } 405; return }
        $b = $null; try { $b = (As-Js).DeserializeObject((As-Body $Request)) } catch { }
        $token = [string](As-Get $b 'token' '')
        $checks = @{ user = $false; claude = $false; folder = $false }
        $missing = New-Object System.Collections.ArrayList
        $user = As-HubUser $token
        if ($null -eq $user) { [void]$missing.Add('The Helper could not confirm your Amit sign-in.') }
        else {
            $owner = $false
            try { $r = Invoke-RestMethod -Method Post -Uri 'https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/rpc/cha_is_owner' -Headers @{ apikey = 'sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF'; Authorization = ('Bearer ' + $token) } -ContentType 'application/json' -Body '{}' -TimeoutSec 15; $owner = ($r -eq $true) } catch { }
            if (-not $owner) { [void]$missing.Add('The coding connection is open to the owner only while it is being built.') }
            else {
                $checks.user = $true
                $d = As-ClaudeChoose $token
                if ((As-Get $d 'allowed' $false) -eq $true) { $checks.claude = $true } else { [void]$missing.Add([string](As-Get $d 'plain' 'Your Claude account could not be checked.')) }
            }
        }
        $folder = Ac-Folder; $node = Ac-Node; $claude = As-ClaudeExe
        if ($folder) { $checks.folder = $true } else { [void]$missing.Add('The Helper does not know where your Amit folder is on this computer.') }
        if (-not $node) { [void]$missing.Add('Node.js was not found on this computer; the coding connection needs it for now.') }
        $ok = ($checks.user -and $checks.claude -and $checks.folder -and [bool]$node)
        $session = ''
        if ($ok) {
            if (-not (Ac-StartEngine $WatcherDir $folder $node $claude)) { $ok = $false; [void]$missing.Add('The coding engine did not start.') }
        }
        if ($ok) {
            $session = Ac-Hex 32
            # only the fingerprint of the session key is kept; several open pages may each hold their own (the newest six)
            $old = As-ReadJson $keyFile; $keys = New-Object System.Collections.ArrayList
            foreach ($k in @(As-Get $old 'connections' @())) { [void]$keys.Add($k) }
            while ($keys.Count -ge 6) { $keys.RemoveAt(0) }
            [void]$keys.Add(@{ sha = (Ac-Sha $session); user = $user.id; origin = [string]$Request.Headers['Origin']; made = (Get-Date).ToString('s') })
            As-WriteText $keyFile (As-ToJson @{ connections = $keys.ToArray() })
        }
        As-Send $Response @{ ok = $ok; session = $session; computer = $env:COMPUTERNAME; checks = $checks; missing = $missing.ToArray() }
        return
    }

    # every other route needs this connection's session key, from the same site that made it
    $given = [string]$Request.QueryString['s']
    $entry = $null
    if ($given -match '^[a-f0-9]{64}$') { $sha = Ac-Sha $given; foreach ($k in @(As-Get (As-ReadJson $keyFile) 'connections' @())) { if ([string]$k['sha'] -eq $sha -and [string]$k['origin'] -eq [string]$Request.Headers['Origin']) { $entry = $k } } }
    if ($null -eq $entry) { As-Send $Response @{ ok = $false; error = 'Not connected.' } 401; return }
    try { [System.IO.File]::WriteAllText((Join-Path (Ac-Root) 'alive.touch'), '') } catch { }
    if (-not (Ac-EngineAlive)) { As-Send $Response @{ ok = $false; error = 'The coding engine is not running.' } 410; return }

    if ($what -eq 'events') {
        $after = [int64]0; [void][int64]::TryParse([string]$Request.QueryString['after'], [ref]$after)
        # wait up to 5 seconds for something new, so a reply is passed on at once without constant asking
        $end = [DateTime]::UtcNow.AddSeconds(5); $file = Join-Path (Ac-Root) 'events.jsonl'; $size = -1
        $lines = New-Object System.Collections.ArrayList
        while ($true) {
            $len = 0; try { $len = (New-Object System.IO.FileInfo($file)).Length } catch { }
            if ($len -ne $size) { $size = $len; $lines = Ac-NewEvents $after }
            if ($lines.Count -gt 0 -or [DateTime]::UtcNow -ge $end) { break }
            Start-Sleep -Milliseconds 60
        }
        Send-JsonRaw $Response ('{"ok":true,"events":[' + (($lines.ToArray()) -join ',') + ']}')
        return
    }
    if ($what -eq 'sessions' -or $what -eq 'projects') {
        $t = Ac-Ask $what @{} 30000
        if (-not $t) { As-Send $Response @{ ok = $false } 504; return }
        Send-JsonRaw $Response $t
        return
    }
    if (@('new', 'send', 'permission', 'stop', 'name', 'open') -contains $what -and $Request.HttpMethod -eq 'POST') {
        $b = $null; try { $b = (As-Js).DeserializeObject((As-Body $Request)) } catch { }
        if ($null -eq $b) { $b = @{} }
        if ($what -eq 'send' -or $what -eq 'open') {
            # the premium rule: the person's own Claude account is checked every time it runs
            $d = As-ClaudeAtRun ([string]$entry['user'])
            if ((As-Get $d 'allowed' $false) -ne $true) { As-Send $Response @{ ok = $false; error = [string](As-Get $d 'plain' 'Your Claude account could not be checked.') } 403; return }
        }
        $t = Ac-Ask $what $b 20000
        if (-not $t) { As-Send $Response @{ ok = $false } 504; return }
        Send-JsonRaw $Response $t
        return
    }
    As-Send $Response @{ ok = $false; error = 'Unknown route.' } 404
}

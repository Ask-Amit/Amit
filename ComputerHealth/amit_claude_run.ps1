# amit_claude_run.ps1 (2026-11-25). Runs one J or F shortcut button on the PERSON'S OWN Claude (their Claude Code, their sign-in, their plan limits), turn by turn.
# The premium check (root CLAUDE.md) is made HERE, by the program that runs it, before EVERY turn. Every tool Claude wants goes through amit_claude_hook.ps1 (allow / don't allow).
# Files in the button's state folder: claude_job.json (in), turn.json (what to show), reply.json (the person's answer), perm.json / perm_<id>.json, stop.flag. Plain ASCII.
param([string]$JobPath)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'amit_script_routes.ps1')

function global:As-ClaudeCommand {
    foreach ($c in @((Join-Path $env:APPDATA 'npm\claude.cmd'), (Join-Path $env:USERPROFILE '.local\bin\claude.exe'))) { if (Test-Path -LiteralPath $c) { return $c } }
    $g = Get-Command claude -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($g) { return $g.Source }
    return $null
}
function global:As-Turn($state, [string]$status, [string]$text, [int]$n) {
    As-WriteText (Join-Path $state 'turn.json') (As-ToJson (@{ status = $status; text = $text; turn = $n; at = (Get-Date).ToUniversalTime().ToString('o') }))
}
function global:Invoke-AmitClaudeTurn($job, [string]$prompt, [string]$session) {
    $exe = As-ClaudeCommand
    $state = [string]$job['stateDir']; $work = [string]$job['workDir']
    $hook = (Join-Path $PSScriptRoot 'amit_claude_hook.ps1').Replace('\', '/')
    $settings = @{ hooks = @{ PreToolUse = @(@{ matcher = '*'; hooks = @(@{ type = 'command'; command = ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $hook + '"'); timeout = 600 }) }) } }
    $sf = Join-Path $state 'claude_settings.json'
    As-WriteText $sf (As-ToJson $settings)
    # no personal settings, rules or add-on servers are loaded: only our hook decides what may happen
    $args2 = '-p --output-format json --setting-sources "" --strict-mcp-config --tools "Read,Glob,Grep,Write,Edit,PowerShell,WebFetch,WebSearch" --settings "' + $sf + '"'
    if ($job.ContainsKey('model') -and [string]$job['model'] -match '^[a-z0-9-]{2,40}$') { $args2 += ' --model ' + $job['model'] }
    if ($session -match '^[A-Za-z0-9-]{8,64}$') { $args2 += ' --resume ' + $session }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    if ($exe -like '*.exe') { $psi.FileName = $exe; $psi.Arguments = $args2 } else { $psi.FileName = $env:ComSpec; $psi.Arguments = '/d /s /c ""' + $exe + '" ' + $args2 + '"' }
    $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true; $psi.RedirectStandardInput = $true; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
    $psi.WorkingDirectory = $work; $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    foreach ($k in @('ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT')) { if ($psi.EnvironmentVariables.ContainsKey($k)) { $psi.EnvironmentVariables.Remove($k) } }
    $psi.EnvironmentVariables['AMIT_STATE_DIR'] = $state; $psi.EnvironmentVariables['AMIT_WORK_DIR'] = $work
    $p = [System.Diagnostics.Process]::Start($psi)
    $out = $p.StandardOutput.ReadToEndAsync(); $err = $p.StandardError.ReadToEndAsync()
    $bytes = (New-Object System.Text.UTF8Encoding($false)).GetBytes($prompt)
    $p.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length); $p.StandardInput.Close()
    $limit = (Get-Date).AddMinutes(30)
    while (-not $p.WaitForExit(400)) {
        if ((Test-Path -LiteralPath (Join-Path $state 'stop.flag')) -or (Get-Date) -gt $limit) {
            & "$env:SystemRoot\System32\taskkill.exe" /PID $p.Id /T /F 2>$null | Out-Null
            return @{ stopped = $true }
        }
    }
    $t = [string]$out.Result; $i = $t.IndexOf('{'); $j = $t.LastIndexOf('}')
    $r = $null; if ($i -ge 0 -and $j -gt $i) { try { $r = (As-Js).DeserializeObject($t.Substring($i, $j - $i + 1)) } catch { } }
    if ($null -eq $r) { return @{ ok = $false; text = 'Claude did not give an answer. It may be at its usage limit, or not signed in. Nothing else will run.' } }
    $text = [string](As-Get $r 'result' '')
    if ((As-Get $r 'is_error' $false) -eq $true) { if (-not $text) { $text = 'Claude reported a problem. It may be at its usage limit.' }; return @{ ok = $false; text = $text } }
    return @{ ok = $true; text = $text; session = [string](As-Get $r 'session_id' '') }
}
function global:Invoke-AmitClaudeRun([string]$path) {
    $job = As-ReadJson $path
    if ($null -eq $job) { return }
    $state = [string]$job['stateDir']; $work = [string]$job['workDir']
    foreach ($x in @($state, $work)) { if (-not (Test-Path -LiteralPath $x)) { [void](New-Item -ItemType Directory -Force -Path $x) } }
    $prompt = "A person pressed a button on their computer that runs their saved shortcut. Follow the shortcut below. If you need something from them, ask ONE plain question and stop; they will answer. Use plain words. Your working folder is: $work`n`nSHORTCUT: " + [string]$job['shortcutName'] + "`n" + [string]$job['shortcutText']
    $session = ''; $n = 0
    $replyFile = Join-Path $state 'reply.json'
    try {
        while ($n -lt 100) {
            $n++
            $gate = As-ClaudeAtRun ([string]$job['userId'])
            if ($gate.allowed -ne $true) { As-Turn $state 'refused' ([string]$gate.plain) $n; return }
            As-Turn $state 'working' '' $n
            $r = Invoke-AmitClaudeTurn $job $prompt $session
            if ($r.stopped) { As-Turn $state 'stopped' 'Stopped. Nothing more will run.' $n; return }
            if (-not $r.ok) { As-Turn $state 'failed' ([string]$r.text) $n; return }
            $session = [string]$r.session
            As-Turn $state 'waiting' ([string]$r.text) $n
            $until = (Get-Date).AddMinutes(30); $got = $null
            while ($null -eq $got) {
                if (Test-Path -LiteralPath (Join-Path $state 'stop.flag')) { As-Turn $state 'finished' ([string]$r.text) $n; return }
                if (Test-Path -LiteralPath $replyFile) { Start-Sleep -Milliseconds 100; $got = As-ReadJson $replyFile; [IO.File]::Delete($replyFile) }
                elseif ((Get-Date) -gt $until) { As-Turn $state 'finished' ([string]$r.text) $n; return }
                else { Start-Sleep -Milliseconds 400 }
            }
            $prompt = [string](As-Get $got 'answer' '')
        }
        As-Turn $state 'finished' 'This run reached its limit of 100 turns.' $n
    } catch { As-Turn $state 'failed' ('Something went wrong: ' + $_.Exception.Message) $n }
}
if ($JobPath) { Invoke-AmitClaudeRun $JobPath }

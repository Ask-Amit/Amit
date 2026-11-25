# amit_claude_hook.ps1 (2026-11-25). Claude Code calls this BEFORE every tool it wants to use while a button runs a shortcut. It answers allow or deny.
# Reading inside the button's own work folder is allowed; EVERYTHING else is shown to the person and waits for their answer. No answer, Stop, or any error = deny.
# (If this script fails to run at all, Claude Code falls back to its own rules, which deny changes in this mode: proven 2026-11-25.) Plain ASCII.
$ErrorActionPreference = 'Stop'
function Out-Decision([string]$d, [string]$why) {
    $o = @{ hookSpecificOutput = @{ hookEventName = 'PreToolUse'; permissionDecision = $d; permissionDecisionReason = $why } }
    [Console]::Out.Write(($o | ConvertTo-Json -Compress -Depth 5)); exit 0
}
try {
    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
    $in = [Console]::In.ReadToEnd() | ConvertFrom-Json
    $state = $env:AMIT_STATE_DIR; $work = $env:AMIT_WORK_DIR
    if (-not $state -or -not (Test-Path -LiteralPath $state)) { Out-Decision 'deny' 'Amit could not ask the person.' }
    if (Test-Path -LiteralPath (Join-Path $state 'stop.flag')) { Out-Decision 'deny' 'The person pressed Stop.' }
    $tool = [string]$in.tool_name; $a = $in.tool_input
    if (@('Read', 'Glob', 'Grep') -contains $tool) {
        $p = [string]$a.file_path; if (-not $p) { $p = [string]$a.path }; if (-not $p) { $p = $work }
        if (-not [IO.Path]::IsPathRooted($p)) { $p = Join-Path $work $p }
        $full = [IO.Path]::GetFullPath($p); $root = [IO.Path]::GetFullPath($work).TrimEnd('\') + '\'
        # a search pattern that walks out of the folder is asked about like anything else
        $pat = [string]$a.pattern; $walks = ($tool -eq 'Glob' -and ($pat.Contains('..') -or $pat -match '^([A-Za-z]:|[\\/])'))
        if (-not $walks -and ($full.TrimEnd('\') + '\').StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { Out-Decision 'allow' 'Reading inside this button''s own folder.' }
    }
    $verb = switch ($tool) { 'Read' { 'read a file' } 'Glob' { 'look for files' } 'Grep' { 'search inside files' } 'Write' { 'create or replace a file' } 'Edit' { 'change a file' }
        'PowerShell' { 'run a command on this computer' } 'Bash' { 'run a command on this computer' } 'WebFetch' { 'open a web page' } 'WebSearch' { 'search the web' } default { 'use ' + $tool } }
    $parts = New-Object System.Collections.ArrayList
    foreach ($k in 'file_path', 'path', 'command', 'url', 'query', 'pattern') { $v = [string]$a.$k; if ($v) { [void]$parts.Add($v) } }
    foreach ($k in @(@('content', 'New text'), @('old_string', 'Replace'), @('new_string', 'With'))) { $v = [string]$a.($k[0]); if ($v) { [void]$parts.Add($k[1] + ': ' + $v) } }
    if ($parts.Count -eq 0) { [void]$parts.Add(($a | ConvertTo-Json -Compress -Depth 4)) }
    $detail = $parts -join "`n"; $long = $detail.Length -gt 6000; if ($long) { $detail = $detail.Substring(0, 6000) + "`n... (more not shown)" }
    $id = [guid]::NewGuid().ToString('N')
    $ansFile = Join-Path $state ('perm_' + $id + '.json')
    $ask = @{ id = $id; tool = $tool; plain = ('Claude wants to ' + $verb); detail = $detail; cut = $long }
    [IO.File]::WriteAllText((Join-Path $state 'perm.json'), ($ask | ConvertTo-Json -Compress), (New-Object System.Text.UTF8Encoding($false)))
    $wait = 540; if ($env:AMIT_PERM_WAIT) { $wait = [int]$env:AMIT_PERM_WAIT }
    $until = (Get-Date).AddSeconds($wait)
    $decision = 'deny'; $why = 'The person did not answer in time.'
    while ((Get-Date) -lt $until) {
        if (Test-Path -LiteralPath (Join-Path $state 'stop.flag')) { $why = 'The person pressed Stop.'; break }
        if (Test-Path -LiteralPath $ansFile) {
            Start-Sleep -Milliseconds 100
            $r = [IO.File]::ReadAllText($ansFile) | ConvertFrom-Json
            if ($r.allow -eq $true) { $decision = 'allow'; $why = 'The person allowed this once.' } else { $why = 'The person did not allow it.' }
            break
        }
        Start-Sleep -Milliseconds 300
    }
    Remove-Item -LiteralPath (Join-Path $state 'perm.json'), $ansFile -Force -ErrorAction SilentlyContinue
    Out-Decision $decision $why
} catch { Out-Decision 'deny' 'Amit could not check this safely.' }

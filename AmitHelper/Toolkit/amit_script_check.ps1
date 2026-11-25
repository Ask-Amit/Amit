# amit_script_check.ps1 v0.1 (2026-11-24). The static scan every custom script passes BEFORE it is saved and before EVERY run.
# Reads never_list.json (the one never list) and checks the script's text; also checks that it parses as PowerShell.
# Prints ONE json line: { "ok": bool, "violations": [ { "ruleId", "plain", "line", "text" } ], "parseErrors": [ ... ] }. Exit code 0 when ok, 2 when not.
# This catches honest mistakes and careless scripts. It is NOT a sandbox (see never_list.json "note"). Plain ASCII (Windows PowerShell 5.1).
param([Parameter(Mandatory = $true)][string]$Path, [string]$RulesPath = '')
$ErrorActionPreference = 'Stop'
if (-not $RulesPath) { $RulesPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'never_list.json' }
$rules = @(([System.IO.File]::ReadAllText($RulesPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json).rules)
$lines = [System.IO.File]::ReadAllLines($Path)
$viol = New-Object System.Collections.ArrayList
$inBlock = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $t = $line.Trim()
    if ($inBlock) { if ($t -match '#>') { $inBlock = $false }; continue }
    if ($t.StartsWith('<#')) { if (-not ($t -match '#>')) { $inBlock = $true }; continue }
    if ($t.StartsWith('#') -and ($t -notmatch '^#Requires')) { continue }
    foreach ($r in $rules) {
        if ([regex]::IsMatch($line, [string]$r.pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
            $txt = $t; if ($txt.Length -gt 120) { $txt = $txt.Substring(0, 120) }
            [void]$viol.Add([ordered]@{ ruleId = [string]$r.id; plain = [string]$r.plain; line = ($i + 1); text = $txt })
        }
    }
}
$tokens = $null; $errs = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$tokens, [ref]$errs)
$perr = New-Object System.Collections.ArrayList
foreach ($e in @($errs)) { [void]$perr.Add(('line ' + $e.Extent.StartLineNumber + ': ' + $e.Message)) }
$ok = ($viol.Count -eq 0 -and $perr.Count -eq 0)
$out = [ordered]@{ ok = $ok; violations = $viol; parseErrors = $perr }
Write-Output ($out | ConvertTo-Json -Depth 5 -Compress)
if ($ok) { exit 0 } else { exit 2 }

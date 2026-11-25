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
$ast = [System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$tokens, [ref]$errs)

# SCRIPTS THAT OPEN WEBSITES (2026-11-25). A web address can carry information out, so for a script that uses Open-AmitWebsite the check is turned around:
# only what is listed here may appear, everything else is refused. Such a script cannot read files, the clipboard or anything about the computer.
$web = $false
if ($null -ne $ast) {
    $cmds = @($ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true))
    foreach ($c in $cmds) { if ([string]$c.GetCommandName() -eq 'Open-AmitWebsite') { $web = $true } }
}
if ($web) {
    $okCmd = @('Get-AmitAnswer', 'Open-AmitWebsite', 'Show-AmitNotice', 'Request-AmitAnswer', 'Test-AmitPractice', 'Test-AmitDone', 'Add-AmitDone', 'Write-AmitFile', 'ForEach-Object', 'Where-Object', 'Select-Object', 'Sort-Object', 'Get-Date', 'Start-Sleep', 'Out-Null', 'Write-Output')
    $okType = @('string', 'string[]', 'int', 'long', 'double', 'decimal', 'bool', 'switch', 'array', 'object[]', 'uri', 'math', 'datetime', 'regex', 'pscustomobject', 'ordered', 'hashtable')
    $okStatic = @('uri::EscapeDataString', 'string::IsNullOrWhiteSpace', 'string::IsNullOrEmpty', 'string::Join', 'string::Format', 'math::Min', 'math::Max', 'math::Floor', 'math::Round', 'datetime::Now', 'datetime::Today')
    $okMethod = @('Trim', 'TrimStart', 'TrimEnd', 'ToLower', 'ToUpper', 'ToLowerInvariant', 'ToUpperInvariant', 'Split', 'Replace', 'StartsWith', 'EndsWith', 'Contains', 'Substring', 'IndexOf', 'ToString', 'AddDays')
    $never = @('home', 'host', 'pwd', 'profile', 'pshome', 'pid', 'executioncontext', 'myinvocation', 'psscriptroot', 'pscommandpath', 'psboundparameters', 'pscmdlet', 'args', 'input', 'error', 'psversiontable', 'psculture', 'psuiculture', 'shellid', 'stacktrace', 'pssenderinfo', 'psdefaultparametervalues')
    $L = 'System.Management.Automation.Language.'
    $made = @{ 'true' = $true; 'false' = $true; 'null' = $true; '_' = $true; 'psitem' = $true }
    foreach ($n in @($ast.FindAll({ param($n) $true }, $true))) {
        if ($n -is [System.Management.Automation.Language.AssignmentStatementAst]) {
            $left = $n.Left
            while ($left -is [System.Management.Automation.Language.AttributedExpressionAst]) { $left = $left.Child }
            if ($left -is [System.Management.Automation.Language.VariableExpressionAst]) { $made[$left.VariablePath.UserPath.ToLower()] = $true }
        }
        elseif ($n -is [System.Management.Automation.Language.ForEachStatementAst]) { $made[$n.Variable.VariablePath.UserPath.ToLower()] = $true }
        elseif ($n -is [System.Management.Automation.Language.ParameterAst]) { $made[$n.Name.VariablePath.UserPath.ToLower()] = $true }
    }
    $why = @{}
    function Add-Web($node, $plain) {
        $t = [string]$node.Extent.Text; if ($t.Length -gt 120) { $t = $t.Substring(0, 120) }
        $key = [string]$node.Extent.StartLineNumber + '|' + $plain
        if (-not $why.ContainsKey($key)) { $why[$key] = $true; [void]$viol.Add([ordered]@{ ruleId = 'website_script'; plain = $plain; line = $node.Extent.StartLineNumber; text = $t }) }
    }
    foreach ($n in @($ast.FindAll({ param($n) $true }, $true))) {
        if ($n -is [System.Management.Automation.Language.CommandAst]) {
            $name = [string]$n.GetCommandName()
            if ([string]$n.InvocationOperator -ne 'Unknown') { Add-Web $n 'A button that opens websites may not run anything with & or a leading dot.' }
            elseif (-not $name -or ($okCmd -notcontains $name)) { Add-Web $n ('A button that opens websites may not use "' + $name + '". It can ask, build addresses and open them, and cannot read anything on the computer.') }
            if ($name -eq 'ForEach-Object' -or $name -eq 'Where-Object') {
                foreach ($el in @($n.CommandElements | Select-Object -Skip 1)) { if (-not ($el -is [System.Management.Automation.Language.ScriptBlockExpressionAst])) { Add-Web $n ($name + ' must be written with a { } block in a button that opens websites.') } }
            }
        }
        elseif ($n -is [System.Management.Automation.Language.VariableExpressionAst]) {
            $v = $n.VariablePath.UserPath.ToLower()
            if ($n.VariablePath.IsDriveQualified -or $v.Contains(':') -or ($never -contains $v) -or -not $made.ContainsKey($v)) { Add-Web $n ('A button that opens websites may only use values it made itself, not "$' + $n.VariablePath.UserPath + '".') }
        }
        elseif ($n -is [System.Management.Automation.Language.InvokeMemberExpressionAst]) {
            $mn = ''; if ($n.Member -is [System.Management.Automation.Language.StringConstantExpressionAst]) { $mn = [string]$n.Member.Value }
            if ($n.Static) {
                $tn = ''; if ($n.Expression -is [System.Management.Automation.Language.TypeExpressionAst]) { $tn = $n.Expression.TypeName.FullName.ToLower() }
                if (-not $mn -or ($okStatic -notcontains ($tn + '::' + $mn))) { Add-Web $n 'That command is not on the approved list for a button that opens websites.' }
            }
            elseif (-not $mn -or ($okMethod -notcontains $mn)) { Add-Web $n 'That command is not on the approved list for a button that opens websites.' }
        }
        elseif ($n -is [System.Management.Automation.Language.MemberExpressionAst]) {
            if (-not ($n.Member -is [System.Management.Automation.Language.StringConstantExpressionAst])) { Add-Web $n 'Names must be written out in full in a button that opens websites.' }
            elseif ($n.Static) {
                $tn = ''; if ($n.Expression -is [System.Management.Automation.Language.TypeExpressionAst]) { $tn = $n.Expression.TypeName.FullName.ToLower() }
                if ($okStatic -notcontains ($tn + '::' + [string]$n.Member.Value)) { Add-Web $n 'That command is not on the approved list for a button that opens websites.' }
            }
        }
        elseif ($n -is [System.Management.Automation.Language.TypeExpressionAst] -or $n -is [System.Management.Automation.Language.TypeConstraintAst]) {
            if ($okType -notcontains $n.TypeName.FullName.ToLower()) { Add-Web $n ('A button that opens websites may not use the type "' + $n.TypeName.FullName + '".') }
        }
        elseif ($n -is [System.Management.Automation.Language.BinaryExpressionAst]) { if ([string]$n.Operator -eq 'As') { Add-Web $n 'A button that opens websites may not use -as.' } }
        elseif ($n -is [System.Management.Automation.Language.SwitchStatementAst]) { if (([string]$n.Flags) -match 'File') { Add-Web $n 'A button that opens websites may not read a file.' } }
        elseif ($n -is [System.Management.Automation.Language.FileRedirectionAst] -or $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -or $n -is [System.Management.Automation.Language.TypeDefinitionAst] -or $n -is [System.Management.Automation.Language.UsingStatementAst] -or $n -is [System.Management.Automation.Language.DataStatementAst]) { Add-Web $n 'That kind of code is not allowed in a button that opens websites.' }
    }
}
$perr = New-Object System.Collections.ArrayList
foreach ($e in @($errs)) { [void]$perr.Add(('line ' + $e.Extent.StartLineNumber + ': ' + $e.Message)) }
$ok = ($viol.Count -eq 0 -and $perr.Count -eq 0)
$out = [ordered]@{ ok = $ok; violations = $viol; parseErrors = $perr; websites = $web }
Write-Output ($out | ConvertTo-Json -Depth 5 -Compress)
if ($ok) { exit 0 } else { exit 2 }

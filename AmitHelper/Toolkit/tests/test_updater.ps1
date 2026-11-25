# test_updater.ps1 (2026-11-25). The REAL updater in its test mode (temp folders, file:// addresses; nothing is stopped or started).
# Proves: a release with a file the updater never heard of goes through, missing files come back, and it never writes a person's own settings or outside its folder.
$ErrorActionPreference = 'Stop'
$amit = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)))
$upd = Join-Path $amit 'ComputerHealth\Watchers\amit_update.ps1'
$script:pass = 0; $script:fail = 0
function Say($c, $l) { if ($c) { $script:pass++; Write-Host ('  PASS  ' + $l) } else { $script:fail++; Write-Host ('  FAIL  ' + $l) } }
function Hash($p) { (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower() }
function Run-Case([hashtable]$published, [hashtable]$installed, [string]$ver) {
    $root = Join-Path $env:TEMP ('amit_upd_' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    $pub = Join-Path $root 'site'; $dir = Join-Path $root 'home\Watchers'; [void](New-Item -ItemType Directory -Force $pub, $dir)
    $files = @()
    foreach ($n in $published.Keys) { $safe = ($n -replace '[\\/]', '_'); $p = Join-Path $pub $safe; [IO.File]::WriteAllText($p, $published[$n]); $files += @{ name = $n; sha256 = (Hash $p); bytes = (Get-Item $p).Length } }
    foreach ($n in $installed.Keys) { [IO.File]::WriteAllText((Join-Path $dir $n), $installed[$n]) }
    $man = Join-Path $root 'm.json'
    @{ manifestFormat = 1; helperVersion = $ver; baseUrl = ([Uri]($pub + '\')).AbsoluteUri; files = $files } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $man -Encoding ASCII
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $upd -ManifestUrl (([Uri]$man).AbsoluteUri) -InstallDir $dir -TestMode | Out-Null
    $res = Get-Content (Join-Path $root 'home\update_result.json') -Raw | ConvertFrom-Json
    return @{ res = $res; dir = $dir; root = $root }
}
function Cs($v) { return ('public const string Version = "' + $v + '";') }
$c = Run-Case @{ 'amit_whisper.cs' = (Cs '9.00'); 'amit_bridge_server.ps1' = 'new bridge'; 'a_part_added_next_year.psm1' = 'brand new'; 'another_new_page.html' = 'page' } @{ 'amit_whisper.cs' = (Cs '8.00') } '9.00'
Say ($c.res.status -eq 'ok' -and (Test-Path (Join-Path $c.dir 'a_part_added_next_year.psm1')) -and (Test-Path (Join-Path $c.dir 'another_new_page.html'))) ('a release with files the updater never heard of goes through: ' + $c.res.status)
Say ((Get-Content (Join-Path $c.dir 'amit_bridge_server.ps1') -Raw) -eq 'new bridge') 'a missing file is put in'
$c = Run-Case @{ 'amit_whisper.cs' = (Cs '9.00'); 'amit_pad.html' = 'p' } @{ 'amit_whisper.cs' = (Cs '9.00') } '9.00'
Say ($c.res.status -eq 'ok' -and (Test-Path (Join-Path $c.dir 'amit_pad.html'))) 'same version but a part is missing: it is restored'
foreach ($bad in '..\outside.ps1', 'sub\file.ps1', 'amit_bar.json', 'ring_sets.txt', 'program.exe', 'installed_version.txt', 'supabase_config.json') {
    $c = Run-Case @{ 'amit_whisper.cs' = (Cs '9.00'); $bad = 'x' } @{ 'amit_whisper.cs' = (Cs '8.00') } '9.00'
    Say ($c.res.status -eq 'failed' -and (Get-Content (Join-Path $c.dir 'amit_whisper.cs') -Raw) -match '8\.00') ('refused, and nothing changed: ' + $bad)
}
$c = Run-Case @{ 'amit_whisper.cs' = (Cs '7.00') } @{ 'amit_whisper.cs' = (Cs '8.00') } '7.00'
Say ($c.res.status -eq 'current' -and (Get-Content (Join-Path $c.dir 'amit_whisper.cs') -Raw) -match '8\.00') 'it still never goes backwards'
$man = Join-Path $env:USERPROFILE 'GitHub\Amit\ComputerHealth\amit_helper_manifest.json'
$t = [IO.File]::ReadAllText($upd); $sn = [regex]::Match($t, "(?m)^\`$safeName = '([^']+)'").Groups[1].Value; $pn = [regex]::Match($t, "(?m)^\`$personal = '([^']+)'").Groups[1].Value
$bad = @((Get-Content $man -Raw | ConvertFrom-Json).files | Where-Object { $_.name -notmatch $sn -or $_.name -match $pn } | ForEach-Object { $_.name })
Say ($bad.Count -eq 0) ('every file in the current release is accepted ' + ($bad -join ', '))
Get-ChildItem $env:TEMP -Directory -Filter 'amit_upd_*' | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ''; Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed'); if ($script:fail) { exit 1 }

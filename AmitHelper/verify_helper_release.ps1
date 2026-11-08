# verify_helper_release.ps1 - checks that a Helper release is complete and consistent BEFORE it is pushed (and again after).
# Written 2026-11-07 for Ryan, who should never have to explain a Helper release again. The rules are in HELPER_RELEASE_RULES.md (same folder).
# Every line must PASS. Run:  powershell -NoProfile -ExecutionPolicy Bypass -File verify_helper_release.ps1 [-Live] [-AllowInstaller]
#   -Live            also compare the published manifest on the Amit site with this release
#   (it also checks that the installer, install-Amit.exe, was built from the current files and sits identical in its four places)
# Plain ASCII on purpose (PowerShell 5.1). Changes nothing. Exit code 1 when anything FAILs.
param([switch]$Live)
$ErrorActionPreference = 'Continue'
$amit = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$watch = Join-Path $amit 'ComputerHealth\Watchers'
$repo = Join-Path $env:USERPROFILE 'GitHub\Amit'
$repoCH = Join-Path $repo 'ComputerHealth'
$inst = Join-Path $env:LOCALAPPDATA 'AmitComputerHealth\Watchers'
$git = Join-Path $env:LOCALAPPDATA 'GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe'
$script:fails = 0; $script:warns = 0
function Pass($m) { Write-Host ("PASS  " + $m) }
function Fail($m) { Write-Host ("FAIL  " + $m); $script:fails++ }
function Warn($m) { Write-Host ("WARN  " + $m); $script:warns++ }

# git stores text with LF, and the manifest fingerprints what git stores, so compare text files with their line endings normalized
function NormHash([string]$p) {
  $b = [System.IO.File]::ReadAllBytes($p)
  $ext = [System.IO.Path]::GetExtension($p).ToLower()
  if ($ext -in '.cs', '.ps1', '.html', '.json', '.md', '.txt', '.bat') {
    $l1 = [System.Text.Encoding]::GetEncoding(28591)   # one byte per character, so the bytes come back exactly as they were, minus the carriage returns
    $b = $l1.GetBytes($l1.GetString($b).Replace("`r`n", "`n"))
  }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash($b))).Replace('-', '').ToLower() } finally { $sha.Dispose() }
}
function HelperVer([string]$p) {
  if (-not (Test-Path $p)) { return $null }
  $m = [regex]::Match([System.IO.File]::ReadAllText($p), 'public const string Version = "([0-9.]+)"')
  if ($m.Success) { return $m.Groups[1].Value } else { return $null }
}

Write-Host "Helper release check ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
Write-Host ""

# 1. one Helper version everywhere
$vW = HelperVer (Join-Path $watch 'amit_whisper.cs'); $vR = HelperVer (Join-Path $repoCH 'amit_whisper.cs'); $vI = HelperVer (Join-Path $inst 'amit_whisper.cs')
$manPath = Join-Path $repoCH 'amit_helper_manifest.json'
$man = $null; if (Test-Path $manPath) { try { $man = [System.IO.File]::ReadAllText($manPath) | ConvertFrom-Json } catch { } }
if (-not $man) { Fail "the manifest in the repo cannot be read: $manPath" } else {
  $vM = [string]$man.helperVersion
  if ($vW -and $vW -eq $vR -and $vW -eq $vI -and $vW -eq $vM) { Pass "Helper version $vW is the same in the source, the repo, the installed copy and the manifest" }
  else { Fail "Helper version differs: source=$vW repo=$vR installed=$vI manifest=$vM (bump it in Watchers\amit_whisper.cs, copy it everywhere, rebuild the manifest)" }
}

# 2. the manifest fingerprints name exactly what the repo holds (what git will store)
if ($man) {
  $bad = @()
  foreach ($e in $man.files) { $p = Join-Path $repoCH ([string]$e.name); if (-not (Test-Path $p)) { $bad += ($e.name + ' (missing in the repo)'); continue }; if ((NormHash $p) -ne [string]$e.sha256) { $bad += [string]$e.name } }
  if ($bad.Count -eq 0) { Pass ("the manifest fingerprints match the repo for all " + @($man.files).Count + " files") } else { Fail ("the manifest is out of date for: " + ($bad -join ', ') + " (rebuild it AFTER copying the files, BEFORE committing)") }

  # 3. source = repo = installed, file by file
  $d1 = @(); $d2 = @()
  foreach ($e in $man.files) {
    $n = [string]$e.name; $ws = Join-Path $watch $n; $rp = Join-Path $repoCH $n; $ip = Join-Path $inst $n
    if (-not (Test-Path $ws)) { $d1 += "$n (not in the source)"; continue }
    if (-not (Test-Path $rp) -or (NormHash $ws) -ne (NormHash $rp)) { $d1 += $n }
    if (-not (Test-Path $ip) -or (NormHash $ws) -ne (NormHash $ip)) { $d2 += $n }
  }
  if ($d1.Count -eq 0) { Pass "the source (Watchers) and the repo agree on every delivered file" } else { Fail ("source and repo differ: " + ($d1 -join ', ')) }
  if ($d2.Count -eq 0) { Pass "the installed copy on this computer matches the source on every delivered file" } else { Fail ("installed copy differs from the source: " + ($d2 -join ', ') + " (copy them, with a backup first)") }

  # 6. the updater must allow every file the manifest names, and the installed updater must be the current one
  $ut = Join-Path $watch 'amit_update.ps1'
  if (Test-Path $ut) {
    $line = ([System.IO.File]::ReadAllLines($ut) | Where-Object { $_ -match '^\$allowed\s*=' } | Select-Object -First 1)
    $names = @(); if ($line) { $names = [regex]::Matches($line, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value } }
    $notAllowed = @(); foreach ($e in $man.files) { if ($names -notcontains [string]$e.name) { $notAllowed += [string]$e.name } }
    if ($names.Count -gt 0 -and $notAllowed.Count -eq 0) { Pass "the updater allows every file the manifest names" } else { Fail ("the updater would REFUSE this manifest, it does not allow: " + ($notAllowed -join ', ') + " (add them to `$allowed in amit_update.ps1 AND copy the updater to the installed folder once by hand)") }
  } else { Fail "amit_update.ps1 not found in the source" }
}

# 4. the page master and the bar master
$pm = Join-Path $amit 'AmitCoder\AmitPreview.html'
if ((Test-Path $pm) -and (Test-Path (Join-Path $watch 'AmitPreview.html')) -and (NormHash $pm) -eq (NormHash (Join-Path $watch 'AmitPreview.html'))) { Pass "the page master (AmitCoder\AmitPreview.html) is the page that is delivered" } else { Fail "the page master AmitCoder\AmitPreview.html differs from Watchers\AmitPreview.html" }
$rpg = Join-Path $repo 'AmitCoder\AmitPreview.html'
if ((Test-Path $rpg) -and (Test-Path $pm) -and (NormHash $rpg) -eq (NormHash $pm)) { Pass "the web copy of the page (repo AmitCoder) matches the master" } else { Fail "the repo copy AmitCoder\AmitPreview.html differs from the master" }
$bm = Join-Path $amit 'AmitHelper\Bar\AmitBar.cs'
if ((Test-Path $bm) -and (NormHash $bm) -eq (NormHash (Join-Path $watch 'AmitBar.cs'))) { Pass "the bar master (AmitHelper\Bar\AmitBar.cs) is the bar source that is delivered" } else { Warn "the bar master AmitHelper\Bar\AmitBar.cs differs from Watchers\AmitBar.cs (known: unpublished changes in the master; check that nothing newer is being left out by mistake)" }

# 7. the recorded installer version on this computer
$iv = Join-Path $inst 'installed_version.txt'
$ivt = ''; if (Test-Path $iv) { $ivt = ([System.IO.File]::ReadAllText($iv)).Trim() }
if ($ivt) { Pass "installed_version.txt records installer version $ivt on this computer" } else { Fail "installed_version.txt is empty or missing: an installer run here would treat the install as old and replace the Helper files (write the version in)" }

# 8. the installer (install-Amit.exe, the Helper's own package) must carry THIS release, in all four places, with one version number
$bmf = Join-Path $watch 'AmitInstaller\BUILD_MANIFEST.json'
if (Test-Path $bmf) {
  try {
    $bm = [System.IO.File]::ReadAllText($bmf) | ConvertFrom-Json
    $stale = @()
    foreach ($pr in $bm.files.PSObject.Properties) {
      $srcf = Join-Path $watch $pr.Name
      if (-not (Test-Path $srcf)) { continue }
      $md5 = [System.Security.Cryptography.MD5]::Create()
      try { $h5 = ([BitConverter]::ToString($md5.ComputeHash([System.IO.File]::ReadAllBytes($srcf)))).Replace('-', '').ToLower() } finally { $md5.Dispose() }
      if ($h5 -ne [string]$pr.Value) { $stale += $pr.Name }
    }
    if ($stale.Count -eq 0) { Pass "the installer was built from the current files (every embedded file matches the source)" } else { Fail ("the installer is OLD: these files changed after it was built: " + ($stale -join ', ') + " (rebuild it: rule 5)") }
  } catch { Fail ("the installer's BUILD_MANIFEST.json could not be read: " + $_.Exception.Message) }
} else { Fail "no BUILD_MANIFEST.json in Watchers\AmitInstaller: the installer has not been built (rule 5)" }
$exes = @((Join-Path $watch 'AmitInstaller\install-Amit.exe'), (Join-Path $watch 'install-Amit.exe'), (Join-Path $repoCH 'install-Amit.exe'), (Join-Path $repoCH 'Watchers\install-Amit.exe'))
$exeMissing = @(); $exeHashes = @()
foreach ($x in $exes) { if (Test-Path $x) { $exeHashes += (Get-FileHash $x -Algorithm SHA256).Hash } else { $exeMissing += $x } }
if ($exeMissing.Count -gt 0) { Fail ("an install-Amit.exe copy is missing: " + ($exeMissing -join ', ')) }
elseif (@($exeHashes | Select-Object -Unique).Count -eq 1) { Pass "the four install-Amit.exe copies are identical" }
else { Fail "the four install-Amit.exe copies differ (copy the new build to all four places: rule 5)" }
$icsF = Join-Path $watch 'AmitInstaller\AmitInstaller.cs'; $iaiF = Join-Path $watch 'AmitInstaller\AssemblyInfo.cs'
$vCs = ''; $vAi = ''
if (Test-Path $icsF) { $m1 = [regex]::Match([System.IO.File]::ReadAllText($icsF), 'CURRENT_VERSION\s*=\s*"([0-9.]+)"'); if ($m1.Success) { $vCs = $m1.Groups[1].Value } }
if (Test-Path $iaiF) { $m2 = [regex]::Match([System.IO.File]::ReadAllText($iaiF), 'AssemblyVersion\("([0-9]+\.[0-9]+)'); if ($m2.Success) { $vAi = $m2.Groups[1].Value } }
if ($vCs -and $vCs -eq $vAi) { Pass "the installer has one version number ($vCs) in AmitInstaller.cs and AssemblyInfo.cs" } else { Fail "the installer version differs: AmitInstaller.cs says '$vCs', AssemblyInfo.cs says '$vAi' (bump both together)" }
$rIns = Join-Path $repoCH 'Watchers\AmitInstaller'
$srcOk = $true; foreach ($n in 'AmitInstaller.cs', 'AssemblyInfo.cs') { if (-not (Test-Path (Join-Path $rIns $n)) -or (NormHash (Join-Path $watch "AmitInstaller\$n")) -ne (NormHash (Join-Path $rIns $n))) { $srcOk = $false } }
if ($srcOk) { Pass "the installer's own source files in the repo match the source" } else { Fail "the installer's source files (AmitInstaller.cs, AssemblyInfo.cs) in the repo differ from the source" }

# 8b. every menu and pop-up the Helper can open is in the list, and the list holds nothing the code does not have (Ryan, 2026-11-08)
$csT = [System.IO.File]::ReadAllText((Join-Path $watch 'amit_whisper.cs'))
$mkIds = @([regex]::Matches($csT, '//\s*AMIT-MENU(?:-EXTERNAL)?:\s*([a-z0-9-]+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$liIds = @([regex]::Matches($csT, 'MenuItemDef\("([a-z0-9-]+)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$inCodeOnly = @($mkIds | Where-Object { $liIds -notcontains $_ }); $inListOnly = @($liIds | Where-Object { $mkIds -notcontains $_ })
if ($mkIds.Count -gt 0 -and $inCodeOnly.Count -eq 0 -and $inListOnly.Count -eq 0) { Pass ("the list of menus matches the code (" + $liIds.Count + " menus: " + ($liIds -join ', ') + ")") }
else { Fail ("the list of menus and the // AMIT-MENU markers in the code differ. In the code but not in the list: [" + ($inCodeOnly -join ', ') + "]. In the list but not in the code: [" + ($inListOnly -join ', ') + "]. Every new menu or pop-up needs a MenuItemDef entry AND a marker (HELPER_RELEASE_RULES.md)") }

# 8c. every default trigger the code uses (OpenDefaultMenu("...")) names a menu that is in the list (so a computer can never ship with nothing behind the middle button)
$dfCalls = @([regex]::Matches($csT, 'OpenDefaultMenu\("([^"]+)"\)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$dfDecl = @{}; foreach ($mm in [regex]::Matches($csT, '//\s*AMIT-DEFAULT:\s*([a-z ]+?)\s*=\s*([a-z0-9-]+)')) { $dfDecl[$mm.Groups[1].Value] = $mm.Groups[2].Value }
$dfBad = @($dfCalls | Where-Object { -not $dfDecl.ContainsKey($_) -or ($liIds -notcontains $dfDecl[$_]) })
if ($dfCalls.Count -gt 0 -and $dfBad.Count -eq 0) { Pass ("every default trigger has its menu in the list (" + (($dfCalls | ForEach-Object { $_ + ' = ' + $dfDecl[$_] }) -join '; ') + ")") }
else { Fail ("a default trigger has no menu in the list: [" + ($dfBad -join ', ') + "] (the code calls OpenDefaultMenu; the list must say which menu with // AMIT-DEFAULT: <trigger> = <id>)") }

# 9. the published manifest (optional)
if ($Live -and $man) {
  try {
    $ts = [int][double]::Parse((Get-Date -UFormat %s))
    $lm = (Invoke-WebRequest -UseBasicParsing -Uri ("https://ask-amit.github.io/Amit/ComputerHealth/amit_helper_manifest.json?x=" + $ts) -TimeoutSec 20).Content | ConvertFrom-Json
    if ([string]$lm.helperVersion -eq [string]$man.helperVersion) { Pass ("the published manifest is Helper " + $lm.helperVersion) } else { Fail ("the published manifest is Helper " + $lm.helperVersion + ", this release is " + $man.helperVersion + " (not pushed yet, or GitHub Pages has not published it: wait, then check again)") }
  } catch { Warn ("the published manifest could not be read: " + $_.Exception.Message) }
}

Write-Host ""
if ($script:fails -eq 0) { Write-Host ("ALL PASS" + $(if ($script:warns) { " (" + $script:warns + " warning" + $(if ($script:warns -gt 1) { 's' }) + ")" } else { '' })); exit 0 }
else { Write-Host (([string]$script:fails) + " FAIL: fix them and run this again. Do not push."); exit 1 }

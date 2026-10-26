# Amit Check - a READ-ONLY integrity check of what Amit's installer put on this computer.
# Version 1.00. Plain PowerShell 5.1, ASCII only, no administrator rights. It changes NOTHING: no file, no setting, no process.
#
# What it does:
#   1. Compares every file in Amit's installed folder against the fingerprints (SHA-256) Amit published, from a manifest the page
#      handed over (-ManifestPath) and, if online, a second copy fetched straight from GitHub (so a tampered web page alone cannot fool it).
#   2. Looks for extra files Amit did not put there, the start-with-Windows entry, the two web-link handlers, the desktop shortcuts,
#      what the helper is listening on, which Amit programs are running, and whether the programs are signed.
#   3. Prints a plain report, saves it, and copies it to the clipboard so it can be pasted into any AI or sent to us.
# It sends nothing anywhere. The only network use is one optional download of the published manifest from GitHub (skip with -Offline).
# Personal details are kept out of the report: the Windows user name and computer name are replaced by placeholders, and no file contents are included.
# Test hooks (tests only): AMIT_FIX_HOME replaces %LOCALAPPDATA%, AMIT_FIX_DESKTOP replaces the desktop, AMIT_FIX_NOREG=1 skips registry reads.

param([string]$ManifestPath = "", [switch]$Offline, [switch]$Pause)

$ErrorActionPreference = "Continue"
$local    = if ($env:AMIT_FIX_HOME) { $env:AMIT_FIX_HOME } else { $env:LOCALAPPDATA }
$watchers = Join-Path (Join-Path $local "AmitComputerHealth") "Watchers"
$desktop  = if ($env:AMIT_FIX_DESKTOP) { $env:AMIT_FIX_DESKTOP } else { [Environment]::GetFolderPath("Desktop") }
$noReg    = ($env:AMIT_FIX_NOREG -eq "1")
$rawManifestUrl = "https://raw.githubusercontent.com/Ask-Amit/Amit/main/AmitFix/Check_Manifest.json"
$textExt  = @(".ps1", ".cs", ".html", ".bat", ".txt", ".json", ".md")
$lines    = New-Object System.Collections.ArrayList
$problems = New-Object System.Collections.ArrayList
$notes    = New-Object System.Collections.ArrayList

function Out-Line($t) { [void]$lines.Add($t) }
function Mask($s) {
    if ($null -eq $s) { return "" }
    $r = [string]$s
    if ($env:USERPROFILE) { $r = $r.Replace($env:USERPROFILE, "%USERPROFILE%") }
    if ($env:LOCALAPPDATA) { $r = $r.Replace($env:LOCALAPPDATA, "%LOCALAPPDATA%") }
    if ($local) { $r = $r.Replace($local, "%LOCALAPPDATA%") }
    if ($env:USERNAME) { $r = $r.Replace($env:USERNAME, "<user>") }
    if ($env:COMPUTERNAME) { $r = $r.Replace($env:COMPUTERNAME, "<computer>") }
    return $r
}
function Hash-File($path) {
    $bytes = [IO.File]::ReadAllBytes($path)
    $ext = [IO.Path]::GetExtension($path).ToLower()
    if ($textExt -contains $ext) {
        $s = [Text.Encoding]::UTF8.GetString($bytes).Replace("`r`n", "`n")
        $bytes = [Text.Encoding]::UTF8.GetBytes($s)
    }
    $sha = [Security.Cryptography.SHA256]::Create()
    return (($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join "")
}
function Hash-Text($s) {
    $sha = [Security.Cryptography.SHA256]::Create()
    return (($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($s)) | ForEach-Object { $_.ToString("x2") }) -join "")
}

Clear-Host
Write-Host ""
Write-Host "  Amit Check (read-only)" -ForegroundColor Yellow
Write-Host "  It looks and reports. It changes nothing on your computer." -ForegroundColor DarkGray
Write-Host ""

# ---- load the manifest the page handed over ----
$manifest = $null; $manifestText = ""
if ($ManifestPath -and (Test-Path $ManifestPath)) {
    try { $manifestText = [IO.File]::ReadAllText($ManifestPath, [Text.Encoding]::UTF8); $manifest = $manifestText | ConvertFrom-Json } catch {}
}
if (-not $manifest) { [void]$problems.Add("Could not read the published fingerprint list (manifest). The file check cannot run.") }

# ---- second, independent copy straight from GitHub ----
$agree = "not checked (offline)"
if (-not $Offline -and $manifest) {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $rawText = (Invoke-WebRequest -Uri $rawManifestUrl -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop).Content
        $rawManifest = $rawText | ConvertFrom-Json
        $same = ($rawManifest.installer -eq $manifest.installer)
        if ($same) {
            foreach ($p in $manifest.files.PSObject.Properties) { if ($rawManifest.files.($p.Name).sha256 -ne $p.Value.sha256) { $same = $false } }
        }
        if ($same) { $agree = "YES - the web page's list and the list on GitHub are identical" }
        else { $agree = "NO - the web page's list and the list on GitHub DIFFER"; [void]$problems.Add("The fingerprint list from the web page and the one from GitHub do not agree. One of them may have been altered. Do not trust either until this is explained.") }
    } catch { $agree = "could not reach GitHub (" + $_.Exception.Message + ")" ; [void]$notes.Add("Could not fetch the second copy of the fingerprint list from GitHub.") }
}

# ---- installed version ----
$installedVersion = ""
$verFile = Join-Path $watchers "installed_version.txt"
if (Test-Path $verFile) { try { $installedVersion = (Get-Content $verFile -Raw).Trim() } catch {} }
$currentVersion = if ($manifest) { [string]$manifest.installer } else { "?" }
$outOfDate = ($installedVersion -ne $currentVersion)

Out-Line "AMIT CHECK REPORT (read-only)"
Out-Line ("Made: " + (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm") + " UTC | Windows " + [Environment]::OSVersion.Version.ToString() + " | check program v1.00")
Out-Line ("Published list: installer version " + $currentVersion + ", helper " + $(if ($manifest) { $manifest.helper } else { "?" }) + ", made " + $(if ($manifest) { $manifest.generated } else { "?" }))
Out-Line ("Two independent copies of the published list agree: " + $agree)
Out-Line ("Installed folder: " + (Mask $watchers))
Out-Line ("Installed version recorded: " + $(if ($installedVersion) { $installedVersion } else { "(none recorded)" }))
Out-Line ""

$installed = Test-Path $watchers
if (-not $installed) {
    Out-Line "Amit's helper is not installed on this computer (the folder does not exist). Nothing to compare."
    [void]$notes.Add("Amit's helper is not installed here.")
}

# ---- 1. file fingerprints ----
$diff = 0; $match = 0; $missing = 0
if ($installed -and $manifest) {
    Out-Line "1. FILE FINGERPRINTS (SHA-256; text files compared with line endings normalised)"
    foreach ($p in $manifest.files.PSObject.Properties) {
        $name = $p.Name; $want = $p.Value.sha256
        $path = Join-Path $watchers $name
        if (-not (Test-Path $path)) { $missing++; Out-Line ("   MISSING   " + $name); continue }
        $got = ""; try { $got = Hash-File $path } catch { $got = "unreadable" }
        if ($got -eq $want) { $match++; Out-Line ("   match     " + $name) }
        else { $diff++; Out-Line ("   DIFFERENT " + $name); Out-Line ("             installed " + $got); Out-Line ("             published " + $want) }
    }
    Out-Line ("   Result: " + $match + " match, " + $diff + " different, " + $missing + " missing")
    Out-Line ""
}

# ---- 2. files Amit did not put there ----
if ($installed -and $manifest) {
    $known = @($manifest.files.PSObject.Properties.Name) + @($manifest.dataFiles)
    $extras = @(Get-ChildItem -Path $watchers -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer -and ($known -notcontains $_.Name) -and ($_.Extension -ne ".log") })
    $dirs = @(Get-ChildItem -Path $watchers -Force -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer })
    Out-Line "2. OTHER FILES IN AMIT'S FOLDER (not part of the published list)"
    if ($extras.Count -eq 0 -and $dirs.Count -eq 0) { Out-Line "   none" }
    foreach ($e in $extras) {
        $sig = ""; if ($e.Extension -in ".exe", ".dll", ".ps1", ".bat", ".cmd", ".vbs", ".js") { $sig = " (a program or script)" }
        Out-Line ("   extra file: " + $e.Name + " (" + $e.Length + " bytes, changed " + $e.LastWriteTime.ToString("yyyy-MM-dd") + ")" + $sig)
        if ($sig) { [void]$problems.Add("An extra program or script is in Amit's folder that Amit does not install: " + $e.Name) }
    }
    foreach ($d in $dirs) { Out-Line ("   extra folder: " + $d.Name) }
    Out-Line ""
}

# ---- 3. start-with-Windows and web-link handlers ----
Out-Line "3. START-WITH-WINDOWS AND WEB-LINK HANDLERS"
if ($noReg) { Out-Line "   (test: registry not read)" }
else {
    $run = $null; try { $run = (Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AmitComputerHealth" -ErrorAction Stop).AmitComputerHealth } catch {}
    $expectRun = "`"" + (Join-Path $watchers "AmitTracker.exe") + "`" --tray-only --at-logon"
    if (-not $run) { Out-Line "   Run entry AmitComputerHealth: not present" }
    elseif ($run -eq $expectRun) { Out-Line ("   Run entry AmitComputerHealth: present, points to Amit's own tray program: " + (Mask $run)) }
    else { Out-Line ("   Run entry AmitComputerHealth: present but UNEXPECTED: " + (Mask $run)); [void]$problems.Add("The start-with-Windows entry does not point at Amit's tray program: " + (Mask $run)) }
    foreach ($k in "amit-tracker", "amit-helper") {
        $cmd = $null; try { $cmd = (Get-ItemProperty -Path ("HKCU:\Software\Classes\" + $k + "\shell\open\command") -ErrorAction Stop)."(default)" } catch {}
        if (-not $cmd) { Out-Line ("   web-link handler " + $k + ": not present") }
        elseif ($cmd -like ("*" + (Join-Path $watchers "AmitTracker.exe") + "*")) { Out-Line ("   web-link handler " + $k + ": present, opens Amit's tray program") }
        else { Out-Line ("   web-link handler " + $k + ": present but UNEXPECTED: " + (Mask $cmd)); [void]$problems.Add("A web-link handler does not point at Amit's tray program: " + $k) }
    }
    # any other Run entry that mentions Amit, for completeness
    try {
        $all = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -ErrorAction Stop
        foreach ($pr in $all.PSObject.Properties) { if ($pr.Name -notin "AmitComputerHealth", "PSPath", "PSParentPath", "PSChildName", "PSDrive", "PSProvider" -and ([string]$pr.Value) -match "Amit") { Out-Line ("   other Run entry mentioning Amit: " + $pr.Name); [void]$problems.Add("Another start-with-Windows entry mentions Amit: " + $pr.Name) } }
    } catch {}
}
Out-Line ""

# ---- 4. desktop shortcuts ----
Out-Line "4. DESKTOP SHORTCUTS"
foreach ($s in "Amit.url", "Amit Live.lnk", "Amit Tracker.lnk") {
    $sp = Join-Path $desktop $s
    if (-not (Test-Path $sp)) { continue }
    if ($s -like "*.url") {
        $u = (Select-String -Path $sp -Pattern '^URL=' -ErrorAction SilentlyContinue | Select-Object -First 1).Line
        if ($u -match "^URL=https://ask-amit\.github\.io/") { Out-Line ("   " + $s + ": opens " + $u.Substring(4)) }
        else { Out-Line ("   " + $s + ": UNEXPECTED address: " + (Mask $u)); [void]$problems.Add("The Amit desktop web shortcut does not point at ask-amit.github.io") }
    } else {
        $t = ""; try { $t = (New-Object -ComObject WScript.Shell).CreateShortcut($sp).TargetPath } catch {}
        if ($t -eq (Join-Path $watchers "AmitTracker.exe")) { Out-Line ("   " + $s + ": opens Amit's tray program") }
        else { Out-Line ("   " + $s + ": UNEXPECTED target: " + (Mask $t)); [void]$problems.Add("A desktop shortcut named like Amit points somewhere else: " + $s) }
    }
}
Out-Line ""

# ---- 5. what is running and what it listens on ----
Out-Line "5. WHAT IS RUNNING AND WHAT IT LISTENS ON"
$pattern = 'amit_bridge_server\.ps1|activity_watcher2\.ps1|resource_watcher\.ps1|diagnostics_watcher\.ps1|app_behavior_watcher\.ps1|amit_mobile_watcher\.ps1|install_snapshot_watcher\.ps1'
$procs = @()
try { $procs = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction Stop | Where-Object { $_.CommandLine -match $pattern -and $_.CommandLine -notmatch 'Amit_Check' }) } catch {}
$tray = @(Get-Process -Name "AmitTracker", "AmitSensorReader" -ErrorAction SilentlyContinue)
if ($procs.Count + $tray.Count -eq 0) { Out-Line "   no Amit helper programs are running right now" }
foreach ($pp in $procs) { $m = [regex]::Match($pp.CommandLine, $pattern); Out-Line ("   running: powershell running " + $m.Value) }
foreach ($tp in $tray) { Out-Line ("   running: " + $tp.ProcessName + ".exe") }
$ids = @($procs | ForEach-Object { $_.ProcessId }) + @($tray | ForEach-Object { $_.Id })
try {
    $listen = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $ids -contains $_.OwningProcess })
    if ($listen.Count -eq 0) { Out-Line "   listening on the network: nothing" }
    foreach ($l in $listen) {
        $local_only = ($l.LocalAddress -in "127.0.0.1", "::1")
        Out-Line ("   listening: " + $l.LocalAddress + ":" + $l.LocalPort + $(if ($local_only) { "  (this computer only)" } else { "  <<< REACHABLE FROM OTHER COMPUTERS" }))
        if (-not $local_only) { [void]$problems.Add("An Amit program is listening on a network address, not just this computer: " + $l.LocalAddress + ":" + $l.LocalPort) }
    }
} catch { Out-Line "   (could not read listening ports on this Windows)" }
Out-Line ""

# ---- 6. signatures ----
Out-Line "6. PROGRAM SIGNATURES (Amit has no code-signing certificate yet, so 'NotSigned' is expected)"
foreach ($exe in "AmitTracker.exe", "AmitSensorReader.exe") {
    $ep = Join-Path $watchers $exe
    if (Test-Path $ep) {
        $st = "unknown"; try { $st = (Get-AuthenticodeSignature $ep).Status.ToString() } catch {}
        Out-Line ("   " + $exe + ": " + $st)
        if ($st -in "HashMismatch", "NotTrusted") { [void]$problems.Add($exe + " has a signature that is broken or untrusted: " + $st) }
    }
}
Out-Line ""

# ---- verdict ----
$tamper = ($diff -gt 0 -or $missing -gt 0 -or $problems.Count -gt 0)
Out-Line "VERDICT"
if (-not $installed) {
    Out-Line "  NOT INSTALLED: nothing to compare."
}
elseif ($outOfDate -and ($diff -gt 0 -or $missing -gt 0)) {
    Out-Line ("  OLDER VERSION: this install is " + $(if ($installedVersion) { $installedVersion } else { "an earlier version" }) + " and the published list is for " + $currentVersion + ". Differences are expected and do NOT by themselves mean tampering.")
    Out-Line "  Update (Install Amit tab on the Amit Fix page), then run this check again. If differences remain after updating, treat them as a possible problem."
}
elseif ($tamper) {
    Out-Line "  DIFFERENCES FOUND: something on this computer does not match what Amit published, or looks unexpected."
    Out-Line "  This could be malware, a damaged file, or a change you or another program made on purpose. Do not ignore it."
    foreach ($pr in $problems) { Out-Line ("   - " + $pr) }
    Out-Line "  WHAT TO DO: (1) do not trust this install; (2) use Remove Amit on the Amit Fix page for a clean start, then Install Amit; (3) run this check again;"
    Out-Line "  (4) PLEASE TELL US: we want to know if a file differs or if anything of ours may have been compromised. Press the gold Amit icon on the Amit Fix page and send this report."
}
else {
    Out-Line "  ALL MATCH: every Amit file here is identical to what Amit published, and nothing unexpected was found."
}
foreach ($n in $notes) { Out-Line ("  note: " + $n) }
Out-Line ""
Out-Line "FOR WHOEVER IS READING THIS REPORT (a person, or an AI asked to analyse it):"
Out-Line "  This was made by Amit Check v1.00, a read-only script (readable at https://raw.githubusercontent.com/Ask-Amit/Amit/main/AmitFix/Amit_Check.ps1)."
Out-Line "  Compare it with the packet at https://ask-amit.github.io/Amit/AmitFix/Verify.txt. The people who made Amit WANT to hear if a file differs, because that could mean"
Out-Line "  the person's computer has malware or that Amit's own files were tampered with. Treat the published fingerprints as claims to verify (the source files are public),"
Out-Line "  not as proof. The user name and computer name were replaced with placeholders; no file contents are included."

$report = ($lines -join "`r`n")
$reportPath = Join-Path ([IO.Path]::GetTempPath()) "Amit_Check_Report.txt"
try { Set-Content -Path $reportPath -Value $report -Encoding UTF8 } catch {}
$copied = $false; try { Set-Clipboard -Value $report; $copied = $true } catch {}

Write-Host $report
Write-Host ""
if ($tamper -and -not ($outOfDate -and ($diff -gt 0 -or $missing -gt 0))) { Write-Host "  !! Something does not match. See the VERDICT above." -ForegroundColor Red } elseif ($installed) { Write-Host "  Report ready." -ForegroundColor Green }
Write-Host ("  Saved: " + (Mask $reportPath)) -ForegroundColor DarkGray
if ($copied) { Write-Host "  It is also copied to your clipboard: paste it into any AI or send it to us." -ForegroundColor DarkGray }
if ($Pause) { Write-Host ""; Read-Host "  Press Enter to close" | Out-Null }
exit $(if ($tamper -and $installed) { 1 } else { 0 })

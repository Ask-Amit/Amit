# amit_update.ps1 - keeps Amit's helper on this computer current, by itself. Plain ASCII on purpose (PowerShell 5.1).
# The helper starts this (hidden, detached) when the Hub asks (/api/helper/update), which the Hub does after sign-in whenever the published
# manifest (amit_helper_manifest.json) says this computer is behind. Nobody has to press anything.
#
# What it does, in this order, and stops at the first problem WITHOUT having changed anything:
#   1. Reads the published manifest (https://ask-amit.github.io/Amit/...), checks it is well formed and that every file name is on the allowed list.
#   2. Compares each file with the installed one (SHA-256). Nothing differs = done.
#   3. WAITS if the person is busy: dictating, a Show Amit window is open, or a Computer Health session is running. It never interrupts.
#   4. Downloads every changed file to a staging folder and checks each one's SHA-256 and size against the manifest.
#   5. Keeps a copy of every file it is about to replace (update_backup).
#   6. Stops the helper, copies the new files in, starts the helper again.
#   7. Waits up to 40 seconds for the new helper to answer with the right version. If it does not, the old files are put back and the helper is started again.
# The result of every run is written to update_result.json (the Hub reads it) and update.log.
param(
    [string]$ManifestUrl = "https://ask-amit.github.io/Amit/ComputerHealth/amit_helper_manifest.json",
    [string]$InstallDir = "",
    [string]$RunId = "",
    [int]$Port = 8710,
    [switch]$TestMode,         # tests only: no program is stopped or started, file:// addresses are allowed, the health check is a hash check
    [switch]$TestFailHealth    # tests only: pretend the new helper never answered, to prove the roll-back
)
$ErrorActionPreference = 'Stop'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$amitHome = Join-Path $env:LOCALAPPDATA 'AmitComputerHealth'
if (-not $InstallDir) { $InstallDir = Join-Path $amitHome 'Watchers' }
if ($TestMode) { $amitHome = Split-Path $InstallDir -Parent }
$resultPath = Join-Path $amitHome 'update_result.json'
$logPath    = Join-Path $amitHome 'update.log'
$lockPath   = Join-Path $amitHome 'update.lock'
$stageDir   = Join-Path $amitHome 'update_staging'
$backupDir  = Join-Path $amitHome 'update_backup'

# the only files this program may ever write, and only into the install folder (no paths, no other names)
$allowed = @('amit_bridge_server.ps1','ComputerHealth_Dashboard.html','activity_watcher2.ps1','resource_watcher.ps1','diagnostics_watcher.ps1','app_behavior_watcher.ps1','install_snapshot_watcher.ps1','Run_AmitTracker.ps1','process_inbox.bat','process_inbox_prompt.txt','amit_whisper.cs','amit_whisper.html','amit_update.ps1')

function Log([string]$m) { try { Add-Content -Path $logPath -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $m) } catch {} }
function JsonEsc([string]$s) { if ($null -eq $s) { return '' }; return $s.Replace('\', '\\').Replace('"', '\"').Replace("`r", ' ').Replace("`n", ' ') }
function Write-Result([string]$status, [string]$message, [string]$from, [string]$to) {
    try {
        $j = '{"id":"' + (JsonEsc $RunId) + '","status":"' + $status + '","message":"' + (JsonEsc $message) + '","from":"' + (JsonEsc $from) + '","to":"' + (JsonEsc $to) + '","at":"' + (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') + '"}'
        [System.IO.File]::WriteAllText($resultPath, $j, (New-Object System.Text.UTF8Encoding $false))
    } catch {}
    Log ($status + ': ' + $message)
}
function Get-Hash([string]$path) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash([System.IO.File]::ReadAllBytes($path)))).Replace('-', '').ToLowerInvariant() } finally { $sha.Dispose() }
}
function Get-Web([string]$url, [string]$toFile) {
    $u = $url
    if ($u -notlike 'file:*') { $u = $u + $(if ($u.Contains('?')) { '&' } else { '?' }) + 't=' + [DateTime]::UtcNow.Ticks }   # the site's cache must not hand back an old copy
    $wc = New-Object System.Net.WebClient
    try { if ($toFile) { $wc.DownloadFile($u, $toFile); return $null } else { return $wc.DownloadString($u) } } finally { $wc.Dispose() }
}
function Get-Json([string]$url) { try { $wc = New-Object System.Net.WebClient; $t = $wc.DownloadString($url); $wc.Dispose(); return ($t | ConvertFrom-Json) } catch { return $null } }
function Stop-Bridge {
    Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*whisper_profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*amit_bridge_server.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
function Start-Bridge {
    Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',(Join-Path $InstallDir 'amit_bridge_server.ps1') -WindowStyle Hidden
}

$fromVer = ''; $toVer = ''
$gotLock = $false
try {
    # one update at a time
    if (Test-Path $lockPath) {
        if (((Get-Date) - (Get-Item $lockPath).LastWriteTime).TotalMinutes -lt 20) { Log 'another update is already running; this one stops'; exit 0 }
    }
    Set-Content -Path $lockPath -Value $PID -Encoding ASCII; $gotLock = $true
    Write-Result 'running' 'Looking at what is published' '' ''

    # 1. the published manifest
    $text = Get-Web $ManifestUrl $null
    $m = $text | ConvertFrom-Json
    if ($m.manifestFormat -ne 1) { throw 'The published manifest is in a format this helper does not understand.' }
    $toVer = [string]$m.helperVersion
    $baseUrl = [string]$m.baseUrl
    $okBase = $baseUrl.StartsWith('https://ask-amit.github.io/Amit/') -or ($TestMode -and $baseUrl.StartsWith('file:'))
    if (-not $okBase) { throw 'The published manifest points somewhere that is not the Amit site.' }
    if (-not $baseUrl.EndsWith('/')) { $baseUrl += '/' }
    foreach ($f in $m.files) {
        if ($allowed -notcontains [string]$f.name -or ([string]$f.name) -notmatch '^[A-Za-z0-9_.\-]+$') { throw ('The manifest names a file this helper never updates: ' + $f.name) }
        if (([string]$f.sha256) -notmatch '^[0-9a-f]{64}$') { throw ('The manifest has no usable fingerprint for ' + $f.name) }
    }

    # 2. what differs
    $todo = @()
    foreach ($f in $m.files) {
        $p = Join-Path $InstallDir $f.name
        if (-not (Test-Path $p) -or (Get-Hash $p) -ne [string]$f.sha256) { $todo += $f }
    }
    $csPath = Join-Path $InstallDir 'amit_whisper.cs'
    if (Test-Path $csPath) { $mm = [regex]::Match([System.IO.File]::ReadAllText($csPath), 'public const string Version = "([0-9.]+)"'); if ($mm.Success) { $fromVer = $mm.Groups[1].Value } }
    if ($todo.Count -eq 0) { Write-Result 'current' 'Already the current version' $fromVer $toVer; exit 0 }
    Log ('differing files: ' + (($todo | ForEach-Object { $_.name }) -join ', '))

    # 3. never interrupt the person
    if (-not $TestMode) {
        $waited = 0; $busy = ''
        while ($true) {
            $busy = ''
            $st = Get-Json ("http://localhost:$Port/api/whisper/status")
            if ($st) {
                if ($st.state -ne 'idle') { $busy = 'Amit is being used right now' }
                elseif ($st.editors -gt 0) { $busy = 'a Show Amit window is open' }
            }
            $tr = Get-Json ("http://localhost:$Port/api/tracker-status")
            if (-not $busy -and $tr -and $tr.running -eq $true) { $busy = 'a Computer Health session is running' }
            if (-not $busy) { break }
            if ($waited -ge 120) { Write-Result 'postponed' ('The update to version ' + $toVer + ' is ready and waits for you to finish: ' + $busy) $fromVer $toVer; exit 0 }
            Start-Sleep -Seconds 10; $waited += 10
        }
    }

    # 4. download and check everything BEFORE touching anything
    Write-Result 'running' ('Downloading version ' + $toVer) $fromVer $toVer
    if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
    New-Item -ItemType Directory -Path $stageDir -Force | Out-Null
    foreach ($f in $todo) {
        $dest = Join-Path $stageDir $f.name
        [void](Get-Web ($baseUrl + $f.name) $dest)
        $len = (Get-Item $dest).Length
        if ($f.bytes -and $len -ne [int64]$f.bytes) { throw ('Downloaded ' + $f.name + ' is the wrong size.') }
        if ((Get-Hash $dest) -ne [string]$f.sha256) { throw ('Downloaded ' + $f.name + ' does not match its fingerprint.') }
    }

    # 5. keep what is about to be replaced
    if (Test-Path $backupDir) { Remove-Item $backupDir -Recurse -Force }
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $had = @{}
    foreach ($f in $todo) {
        $p = Join-Path $InstallDir $f.name
        if (Test-Path $p) { Copy-Item $p (Join-Path $backupDir $f.name) -Force; $had[$f.name] = $true } else { $had[$f.name] = $false }
    }

    # 6. swap (this program replaces itself last)
    Write-Result 'running' ('Installing version ' + $toVer) $fromVer $toVer
    if (-not $TestMode) { Stop-Bridge; Start-Sleep -Seconds 2 }
    $order = @($todo | Where-Object { $_.name -ne 'amit_update.ps1' }) + @($todo | Where-Object { $_.name -eq 'amit_update.ps1' })
    foreach ($f in $order) { Copy-Item (Join-Path $stageDir $f.name) (Join-Path $InstallDir $f.name) -Force }
    if (-not $TestMode) { Stop-Bridge; Start-Bridge }

    # 7. is the new helper really working?
    $healthy = $false
    if ($TestMode) {
        $healthy = -not $TestFailHealth
        if ($healthy) { foreach ($f in $m.files) { if ((Get-Hash (Join-Path $InstallDir $f.name)) -ne [string]$f.sha256) { $healthy = $false } } }
    } else {
        $t0 = Get-Date
        while (((Get-Date) - $t0).TotalSeconds -lt 40) {
            Start-Sleep -Seconds 3
            $s2 = Get-Json ("http://localhost:$Port/api/whisper/status")
            if ($s2 -and [string]$s2.version -eq $toVer) { $healthy = $true; break }
        }
    }
    if ($healthy) {
        Write-Result 'ok' ('Updated to version ' + $toVer) $fromVer $toVer
        try { Remove-Item $stageDir -Recurse -Force -ErrorAction SilentlyContinue } catch {}
        exit 0
    }

    # roll back
    Log 'the new helper did not answer correctly: putting the old files back'
    if (-not $TestMode) { Stop-Bridge; Start-Sleep -Seconds 2 }
    foreach ($f in $todo) {
        $p = Join-Path $InstallDir $f.name
        if ($had[$f.name]) { Copy-Item (Join-Path $backupDir $f.name) $p -Force } elseif (Test-Path $p) { Remove-Item $p -Force }
    }
    if (-not $TestMode) { Start-Bridge }
    Write-Result 'failed' ('Version ' + $toVer + ' did not start correctly, so the previous version was put back. Nothing was lost.') $fromVer $toVer
}
catch {
    Write-Result 'failed' ('The update did not go ahead and nothing was changed: ' + $_.Exception.Message) $fromVer $toVer
}
finally {
    if ($gotLock) { try { Remove-Item $lockPath -Force -ErrorAction SilentlyContinue } catch {} }
}

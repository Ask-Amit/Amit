# make_helper_manifest.ps1 - writes amit_helper_manifest.json: the published list of what "current" is for Amit's helper.
# Run it at PUSH time, against the files that are about to be published (the repo mirror), and publish the manifest beside them.
# The Hub fetches this file and compares it with what the helper on the person's computer reports at /api/helper/status.
# Plain ASCII on purpose (PowerShell 5.1).
#   .\make_helper_manifest.ps1                         (uses this folder, writes the manifest here)
#   .\make_helper_manifest.ps1 -Dir C:\path\to\files    (hash the files in another folder, write the manifest there)
#
# IMPORTANT (found 2026-10-29): git converts Windows line endings when it commits (core.autocrlf), so the bytes GitHub Pages serves can be
# a few bytes different from the file on disk. The updater checks what it DOWNLOADS, so the fingerprint must be of the bytes git will store.
# When -Dir is inside a git repository this script therefore stages each file (git add, which is part of publishing anyway) and fingerprints
# the staged copy. Outside a repository it fingerprints the file as it is.
param([string]$Dir = $PSScriptRoot, [string]$Notes = "", [string]$GitExe = "C:\Users\user1\AppData\Local\GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe")

# The files the helper keeps on the person's computer that can change. Programs (.exe) are left out on purpose: they are large and rarely change.
# KEEP THIS LIST THE SAME AS THE ONE IN /api/helper/status in amit_bridge_server.ps1.
$names = @(
    "amit_bridge_server.ps1", "ComputerHealth_Dashboard.html",
    "activity_watcher2.ps1", "resource_watcher.ps1", "diagnostics_watcher.ps1", "app_behavior_watcher.ps1", "install_snapshot_watcher.ps1",
    "Run_AmitTracker.ps1", "process_inbox.bat", "process_inbox_prompt.txt",
    "amit_whisper.cs", "amit_whisper.html", "amit_update.ps1"
)
# where the helper downloads the changed files from (the Amit site; the updater refuses any other address)
$baseUrl = "https://ask-amit.github.io/Amit/ComputerHealth/"

function Invoke-GitBytes([string[]]$GitArgs) {
    # runs git and returns what it printed, as raw bytes (null if git failed)
    $psi = New-Object System.Diagnostics.ProcessStartInfo($GitExe, ($GitArgs -join ' '))
    $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true; $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
    $proc = [System.Diagnostics.Process]::Start($psi)
    $ms = New-Object System.IO.MemoryStream
    $proc.StandardOutput.BaseStream.CopyTo($ms)
    [void]$proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    if ($proc.ExitCode -ne 0) { return $null }
    return $ms.ToArray()
}
$useGit = $false
if (Test-Path $GitExe) { $top = Invoke-GitBytes @('-C', ('"' + $Dir + '"'), 'rev-parse', '--show-toplevel'); if ($top) { $useGit = $true } }
if ($useGit) { Write-Host "  (inside a git repository: fingerprinting the bytes git will store)" }

$sha = [System.Security.Cryptography.SHA256]::Create()
$files = @()
foreach ($n in $names) {
    $p = Join-Path $Dir $n
    if (-not (Test-Path $p)) { Write-Host ("  not found, left out: " + $n); continue }
    $bytes = [System.IO.File]::ReadAllBytes($p)
    if ($useGit) {
        [void](Invoke-GitBytes @('-C', ('"' + $Dir + '"'), 'add', '--', ('"' + $n + '"')))
        $staged = Invoke-GitBytes @('-C', ('"' + $Dir + '"'), 'show', (':./' + $n))
        if ($staged) { $bytes = $staged }
    }
    $hash = ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace("-", "").ToLowerInvariant()
    $files += [ordered]@{ name = $n; sha256 = $hash; bytes = $bytes.Length }
}
$sha.Dispose()

# the helper's own version number is the one written in amit_whisper.cs
$ver = ""
$cs = Join-Path $Dir "amit_whisper.cs"
if (Test-Path $cs) {
    $m = [regex]::Match([System.IO.File]::ReadAllText($cs), 'public const string Version = "([0-9.]+)"')
    if ($m.Success) { $ver = $m.Groups[1].Value }
}

$manifest = [ordered]@{
    manifestFormat = 1
    helperVersion  = $ver
    baseUrl        = $baseUrl
    generated      = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    notes          = $Notes
    files          = $files
}
$out = Join-Path $Dir "amit_helper_manifest.json"
[System.IO.File]::WriteAllText($out, ($manifest | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding $false))
Write-Host ("Wrote " + $out + " (helper " + $ver + ", " + $files.Count + " files)")

# show_preview.ps1 v1.20 (2026-11-07) - shows a preview in the AMIT PREVIEW window (the one the voice command "preview" opens: paste box on the left,
# the picture on the right) with NOTHING to paste. This is how Amit shows Ryan every visual preview (Ryan, 2026-11-06: "always use that preview").
# Every preview that is sent is ALSO FILED, with what it is, so it can be found again (Ryan, 2026-11-06: "a title of what's being displayed ... the app,
# the date, the version number ... so it's trackable in the future ... pull up the views and the history from a menu item"):
#   - App      which Amit application it belongs to (default: the folder that holds the Previews folder, e.g. AmitHelper)
#   - Title    what is being displayed, in plain words (default: the page's <title> without " Preview")
#   - Version  counts up by itself for the same App + Title (1, 2, 3 ...)
#   - Sent     the date and time it was sent
# What it does:
#   1. Files the preview in %LOCALAPPDATA%\AmitComputerHealth\preview_history\ (the page + its details + an index.json). A database table can take these over later.
#   2. Saves it as preview_current.html with its details, which the Helper hands to the Amit Preview page. An open window shows it within about two seconds,
#      with the title line above the picture, so the SAME window is reused and previews never pile up.
#   3. Asks the Helper to open the Amit Preview window, or bring it to the front. The Helper splits the screen beside the conversation by itself.
#   4. If the Helper is not running (or is too old to know the route), falls back to open_preview.ps1 (the file in its own app window).
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File show_preview.ps1 -Path "C:\path\to\X_preview.html" -App AmitHelper -Title "Mouse screen, set picker"
#   -Goal "..."      the PURPOSE in one or two plain sentences (what it is FOR, not what it looks like). The Improve / Better / Reimagine briefs carry it, so an AI is not led
#                      by the current look. Always give it for anything that will be sent for reimagining.
#   -How "..."       how it works, in a few plain sentences (what it does and how a person uses it). Also carried by the briefs.
#   -Vars "..."      the sample / placeholder values in it and what each one stands for. REQUIRED by the Amit Preview page (v2.17 on): a send without Goal, How or Vars,
#                      or without -App and -Title given on purpose, is refused by the page. This script prints the page's verdict and the rules.
#   -Name "..."      the label of Version 1 (default "Amit"). A preview is one subject (app + title); a re-send of the same app + title updates Version 1 only.
#   -NoOpen            only save and file it (an open window refreshes by itself)
# Plain ASCII on purpose (PowerShell 5.1).
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [int]$Port = 8710,
  [string]$Name = 'Amit',
  [string]$App = '',
  [string]$Title = '',
  [string]$Goal = '',
  [string]$How = '',
  [string]$Vars = '',
  [switch]$NoOpen
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Path)) { Write-Host "No such file: $Path"; exit 1 }
$full = (Resolve-Path $Path).Path
$html = [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)

# ---- what is it? (App, Title) ----
# which details were given ON PURPOSE (the page refuses a send whose App or Title was only guessed from the folder or the file)
$given = New-Object System.Collections.ArrayList
if ($App) { [void]$given.Add('app') }; if ($Title) { [void]$given.Add('title') }
if (-not $App) {
  $dir = Split-Path -Parent $full
  if ((Split-Path -Leaf $dir) -ieq 'Previews') { $dir = Split-Path -Parent $dir }
  $App = Split-Path -Leaf $dir
}
if (-not $Title) {
  $m = [regex]::Match($html, '<title>\s*([^<]+?)\s*</title>', 'IgnoreCase')
  if ($m.Success) { $Title = ($m.Groups[1].Value -replace '\s+Preview\s*$', '').Trim() }
  if (-not $Title) { $Title = [System.IO.Path]::GetFileNameWithoutExtension($full) }
}
if ($Title.Length -gt 90) { $Title = $Title.Substring(0, 90) }
if ($App.Length -gt 40) { $App = $App.Substring(0, 40) }

$amitHome = Join-Path $env:LOCALAPPDATA 'AmitComputerHealth'
if (-not (Test-Path $amitHome)) { New-Item -ItemType Directory -Force -Path $amitHome | Out-Null }
$histDir = Join-Path $amitHome 'preview_history'
if (-not (Test-Path $histDir)) { New-Item -ItemType Directory -Force -Path $histDir | Out-Null }
$indexFile = Join-Path $histDir 'index.json'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ---- the history index and the next version number for this App + Title ----
# (read and written with the .NET JSON serializer: PowerShell 5.1's own ConvertTo-Json / ConvertFrom-Json turn lists of one item or none into the wrong shape)
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = 104857600
$list = New-Object System.Collections.ArrayList
if (Test-Path $indexFile) {
  try {
    $raw = [System.IO.File]::ReadAllText($indexFile, [System.Text.Encoding]::UTF8)
    if ($raw.Trim().Length -gt 0) {
      foreach ($d in @($ser.DeserializeObject($raw))) {
        if ($d -is [System.Collections.IDictionary] -and $d['id'] -and $d['app'] -and $d['title']) { [void]$list.Add($d) }   # anything that is not a real entry is dropped
      }
    }
  } catch { $list.Clear() }
}
$version = 1
foreach ($d in $list) {
  $iv = 0; [void][int]::TryParse([string]$d['version'], [ref]$iv)
  if ([string]$d['app'] -ieq $App -and [string]$d['title'] -ieq $Title -and $iv -ge $version) { $version = $iv + 1 }
}
$now = Get-Date
$id = $now.ToString('yyyyMMdd-HHmmss') + '-' + ([guid]::NewGuid().ToString('N').Substring(0, 4))
$meta = New-Object System.Collections.Specialized.OrderedDictionary
$meta['id'] = $id; $meta['app'] = $App; $meta['title'] = $Title; $meta['tab'] = $Name; $meta['version'] = [int]$version
$meta['sentAt'] = $now.ToString('yyyy-MM-ddTHH:mm:sszzz'); $meta['sizeChars'] = [int]$html.Length; $meta['source'] = 'claude'
if ($Goal) { if ($Goal.Length -gt 500) { $Goal = $Goal.Substring(0, 500) }; $meta['goal'] = $Goal }
if ($How) { if ($How.Length -gt 1200) { $How = $How.Substring(0, 1200) }; $meta['how'] = $How }
if ($Vars) { if ($Vars.Length -gt 1500) { $Vars = $Vars.Substring(0, 1500) }; $meta['vars'] = $Vars }
$meta['given'] = @($given)

# ---- file it ----
[System.IO.File]::WriteAllText((Join-Path $histDir ($id + '.html')), $html, $utf8)
$metaJson = $ser.Serialize($meta)
[System.IO.File]::WriteAllText((Join-Path $histDir ($id + '.json')), $metaJson, $utf8)
$parts = New-Object System.Collections.ArrayList
[void]$parts.Add($metaJson)
foreach ($d in $list) { if ($parts.Count -ge 1000) { break }; [void]$parts.Add($ser.Serialize($d)) }
[System.IO.File]::WriteAllText($indexFile, ('[' + ($parts -join ',') + ']'), $utf8)
# ---- hand it to the open window (name and details first, so the page sees them with the new stamp) ----
[System.IO.File]::WriteAllText((Join-Path $amitHome 'preview_current.name'), $Name, $utf8)
[System.IO.File]::WriteAllText((Join-Path $amitHome 'preview_current.meta.json'), ($meta | ConvertTo-Json -Compress), $utf8)
$dest = Join-Path $amitHome 'preview_current.html'
$tmp = $dest + '.tmp'
[System.IO.File]::WriteAllText($tmp, $html, $utf8)
Move-Item -LiteralPath $tmp -Destination $dest -Force
(Get-Item $dest).LastWriteTimeUtc = [DateTime]::UtcNow      # a new stamp, so an open window always sees a change
Write-Host ("Filed: {0} | {1} | version {2} | {3}" -f $App, $Title, $version, $now.ToString('yyyy-MM-dd HH:mm'))
if ($NoOpen) { Write-Host "Saved the preview (the Amit Preview window refreshes by itself)."; exit 0 }
# ---- what the Amit Preview page says about this send (v1.20): the page checks that the details are there and tells the Helper; read it here so the sender sees it ----
function Get-PageVerdict {
  $ticks = [string](Get-Item $dest).LastWriteTimeUtc.Ticks
  for ($i = 0; $i -lt 8; $i++) {
    try {
      $s = Invoke-RestMethod -Uri "http://localhost:$Port/api/preview/status" -TimeoutSec 4
      if ($s -and [string]$s.stamp -eq $ticks) { return $s }
    } catch {
      if ("$($_.Exception.Message)" -match '404|Not Found') { return 'old' }   # a Helper that does not have the route yet
    }
    Start-Sleep -Seconds 1
  }
  return $null
}
function Show-Verdict($v) {
  if ($v -is [string] -and $v -eq 'old') { Write-Host "The Helper is an older version and cannot report what the page decided. Check the Amit Preview window: if it says the preview was not shown, a detail is missing."; return 0 }
  if ($null -eq $v) { Write-Host "The page has not confirmed (the window may still be opening, or it is an older page that does not report back). Check the Amit Preview window."; return 0 }
  if ($v.ok) { Write-Host "The Amit Preview page ACCEPTED the preview (all required details were there)."; return 0 }
  Write-Host ("The Amit Preview page REFUSED the preview. Missing: " + (@($v.missing) -join '; ') + ".")
  Write-Host "Send it again with every detail. The rules the page gave:"
  Write-Host $v.rules
  return 3
}
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
try {
  $r = Invoke-RestMethod -Uri "http://localhost:$Port/api/preview/open" -TimeoutSec 8
  if ($r.ok) { Write-Host "Amit Preview: sent to the window (live, nothing to paste)."; exit (Show-Verdict (Get-PageVerdict)) }
  throw "the Helper could not open the window"
} catch {
  Write-Host ("Amit Preview is not available (" + $_.Exception.Message + "): opening the preview file in its own window instead.")
  & (Join-Path $here 'open_preview.ps1') -Path $Path
}

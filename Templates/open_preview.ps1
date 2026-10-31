# open_preview.ps1 v1.00 (2026-10-31) - opens an Amit preview page in ONE app window.
# Any earlier preview window is closed first (gracefully), so previews never pile up.
# Only windows whose title ends with " Preview" and contains no " - " are touched, so a normal
# browser window (title like "Page - Profile - Microsoft Edge") is never closed.
# Rule for preview pages: the <title> must end with " Preview" and must not contain " - ".
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File open_preview.ps1 -Path "C:\path\to\X_preview.html"
#         add -List to only print the open preview windows.
param(
  [Parameter(Mandatory=$true)][string]$Path,
  [int]$Width = 1500,
  [int]$Height = 950,
  [switch]$List
)
$ErrorActionPreference = 'Stop'

if (-not ([System.Management.Automation.PSTypeName]'AmitWin').Type) {
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class AmitWin {
  delegate bool CB(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(CB cb, IntPtr l);
  [DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  public static List<string> Previews(bool close) {
    List<string> found = new List<string>();
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h)) return true;
      StringBuilder sb = new StringBuilder(256);
      GetWindowText(h, sb, 256);
      string t = sb.ToString();
      if (t.EndsWith(" Preview") && t.IndexOf(" - ") < 0) {
        found.Add(t);
        if (close) PostMessage(h, 0x0010, IntPtr.Zero, IntPtr.Zero);
      }
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
"@
}

if ($List) {
  $w = [AmitWin]::Previews($false)
  "preview windows open: " + $w.Count
  $w | ForEach-Object { "  " + $_ }
  exit 0
}

$full = (Resolve-Path -LiteralPath $Path).Path
$url = ([System.Uri]$full).AbsoluteUri
$closed = [AmitWin]::Previews($true)
if ($closed.Count -gt 0) { Start-Sleep -Milliseconds 800 }

$exe = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $exe) { Start-Process $full; "no Edge or Chrome found: opened in the default browser"; exit 0 }
Start-Process -FilePath $exe -ArgumentList @("--app=$url", "--window-size=$Width,$Height")
"opened: $full (closed " + $closed.Count + " earlier preview window(s))"

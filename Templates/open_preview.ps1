# open_preview.ps1 v1.10 (2026-10-31) - opens an Amit preview page in ONE app window, SPLIT-SCREEN beside the person's coding window.
# What it does, every time:
#   1. Finds the person's current window (VS Code) before anything else.
#   2. Closes any earlier preview window (gracefully), so previews never pile up.
#   3. Opens the preview as its own app window.
#   4. Puts VS Code on the LEFT half of its screen and the preview on the RIGHT half, so the person sees the conversation
#      and the preview at the same time, then hands the focus back to VS Code. (Their original VS Code size is remembered once.)
# Only windows whose title ends with " Preview" and contains no " - " are touched as previews, so a normal browser window
# (title like "Page - Profile - Microsoft Edge") is never closed.
# Rule for preview pages: the <title> must end with " Preview" and must not contain " - ".
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File open_preview.ps1 -Path "C:\path\to\X_preview.html"
#   -LeftPercent 50   how much of the screen the coding window keeps (default half)
#   -NoSplit          only open the preview, do not move any window
#   -Restore          close the preview and put VS Code back the way it was
#   -List             only print the open preview window and VS Code rectangles
# Plain ASCII on purpose (PowerShell 5.1).
param(
  [string]$Path = "",
  [int]$LeftPercent = 50,
  [switch]$NoSplit,
  [switch]$Restore,
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
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [StructLayout(LayoutKind.Sequential)] public struct MONITORINFO { public int cbSize; public RECT rcMonitor; public RECT rcWork; public uint dwFlags; }
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool EnumWindows(CB cb, IntPtr l);
  [DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] static extern IntPtr MonitorFromWindow(IntPtr h, uint flags);
  [DllImport("user32.dll")] static extern bool GetMonitorInfo(IntPtr mon, ref MONITORINFO mi);
  [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int attr, out RECT r, int size);
  static string Title(IntPtr h) { StringBuilder sb = new StringBuilder(300); GetWindowText(h, sb, 300); return sb.ToString(); }
  static bool IsPreviewTitle(string t) { return t.EndsWith(" Preview") && t.IndexOf(" - ") < 0; }
  public static List<IntPtr> Previews() {
    List<IntPtr> r = new List<IntPtr>();
    EnumWindows(delegate(IntPtr h, IntPtr l) { if (IsWindowVisible(h) && IsPreviewTitle(Title(h))) r.Add(h); return true; }, IntPtr.Zero);
    return r;
  }
  public static void ClosePreviews() { foreach (IntPtr h in Previews()) PostMessage(h, 0x0010, IntPtr.Zero, IntPtr.Zero); }
  public static IntPtr FindVsCode() {
    IntPtr fg = GetForegroundWindow();
    if (Title(fg).IndexOf("Visual Studio Code") >= 0) return fg;
    IntPtr found = IntPtr.Zero;
    EnumWindows(delegate(IntPtr h, IntPtr l) { if (found == IntPtr.Zero && IsWindowVisible(h) && Title(h).IndexOf("Visual Studio Code") >= 0) found = h; return true; }, IntPtr.Zero);
    return found;
  }
  public static int[] WorkArea(IntPtr h) {
    MONITORINFO mi = new MONITORINFO(); mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
    GetMonitorInfo(MonitorFromWindow(h, 2), ref mi);
    return new int[] { mi.rcWork.L, mi.rcWork.T, mi.rcWork.R, mi.rcWork.B };
  }
  public static int[] Rect(IntPtr h) { RECT r; GetWindowRect(h, out r); return new int[] { r.L, r.T, r.R, r.B }; }
  public static bool Maximized(IntPtr h) { return IsZoomed(h); }
  public static void Maximize(IntPtr h) { ShowWindow(h, 3); }
  public static void Place(IntPtr h, int x, int y, int w, int ht) {
    ShowWindow(h, 9);
    RECT win; RECT frame;
    GetWindowRect(h, out win);
    int il = 0, it = 0, ir = 0, ib = 0;
    if (DwmGetWindowAttribute(h, 9, out frame, Marshal.SizeOf(typeof(RECT))) == 0) { il = frame.L - win.L; it = frame.T - win.T; ir = win.R - frame.R; ib = win.B - frame.B; }
    SetWindowPos(h, IntPtr.Zero, x - il, y - it, w + il + ir, ht + it + ib, 0x0054);
  }
  public static void Focus(IntPtr h) {
    keybd_event(0x12, 0, 0, UIntPtr.Zero); keybd_event(0x12, 0, 2, UIntPtr.Zero);
    ShowWindow(h, 5); SetForegroundWindow(h);
  }
}
"@
}
[void][AmitWin]::SetProcessDPIAware()
$stateFile = Join-Path $env:TEMP "amit_preview_layout.json"

if ($List) {
  $p = [AmitWin]::Previews()
  "preview windows open: " + $p.Count
  foreach ($h in $p) { "  preview rect: " + ([AmitWin]::Rect($h) -join ",") }
  $v = [AmitWin]::FindVsCode()
  if ($v -ne [IntPtr]::Zero) { "  VS Code rect: " + ([AmitWin]::Rect($v) -join ",") + "  maximized=" + [AmitWin]::Maximized($v) }
  exit 0
}

if ($Restore) {
  $v = [AmitWin]::FindVsCode()
  [AmitWin]::ClosePreviews()
  Start-Sleep -Milliseconds 500
  if ((Test-Path $stateFile) -and ($v -ne [IntPtr]::Zero)) {
    $s = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    if ($s.maximized) { [AmitWin]::Maximize($v) } else { [AmitWin]::Place($v, [int]$s.l, [int]$s.t, [int]($s.r - $s.l), [int]($s.b - $s.t)) }
    Remove-Item -LiteralPath $stateFile -Force
    "preview closed; VS Code put back the way it was"
  } else { "preview closed; nothing to put back" }
  exit 0
}

if (-not $Path) { throw "give -Path <the preview file>" }
$full = (Resolve-Path -LiteralPath $Path).Path
$url = ([System.Uri]$full).AbsoluteUri

# 1. find the person's window FIRST, while it is still the front one
$vs = [AmitWin]::FindVsCode()

# 2. close earlier preview windows
$had = [AmitWin]::Previews().Count
[AmitWin]::ClosePreviews()
if ($had -gt 0) { Start-Sleep -Milliseconds 800 }

# 3. open the preview as its own app window
$exe = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $exe) { Start-Process $full; "no Edge or Chrome found: opened in the default browser"; exit 0 }
Start-Process -FilePath $exe -ArgumentList @("--app=$url")

# 4. split the screen: VS Code left, preview right, focus back to VS Code
if ($NoSplit -or ($vs -eq [IntPtr]::Zero)) {
  if ($vs -eq [IntPtr]::Zero) { "opened (VS Code window not found, so nothing was moved)" } else { "opened (no split asked for)" }
  exit 0
}
if (-not (Test-Path $stateFile)) {
  $rc = [AmitWin]::Rect($vs)
  @{ maximized = [AmitWin]::Maximized($vs); l = $rc[0]; t = $rc[1]; r = $rc[2]; b = $rc[3] } | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding ascii
}
$wa = [AmitWin]::WorkArea($vs)
$mid = $wa[0] + [int](($wa[2] - $wa[0]) * $LeftPercent / 100)
$pv = [IntPtr]::Zero
for ($i = 0; ($i -lt 75) -and ($pv -eq [IntPtr]::Zero); $i++) {
  Start-Sleep -Milliseconds 200
  $l = [AmitWin]::Previews()
  if ($l.Count -gt 0) { $pv = $l[0] }
}
if ($pv -eq [IntPtr]::Zero) { "the preview window did not appear in time; nothing was moved"; exit 0 }
[AmitWin]::Place($vs, $wa[0], $wa[1], ($mid - $wa[0]), ($wa[3] - $wa[1]))
[AmitWin]::Place($pv, $mid, $wa[1], ($wa[2] - $mid), ($wa[3] - $wa[1]))
Start-Sleep -Milliseconds 300
[AmitWin]::Focus($vs)
"split done: VS Code on the left, preview on the right (focus is back on VS Code)"

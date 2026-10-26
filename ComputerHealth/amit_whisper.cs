// Amit Whisper mode v1.00 (2026-10-26) - hold a mouse button anywhere on the computer, speak, let go, and the words are typed
// where the cursor is. Part of the shared local Amit agent: this file is compiled and started INSIDE amit_bridge_server.ps1
// (Add-Type), so there is no extra program and no extra port. Plain ASCII on purpose (PowerShell 5.1 compiles it: C# 5 only).
//
// How it works:
//  1. A low-level mouse hook watches ONE button (default: right). A quick tap is replayed as a normal click, so menus still work.
//     Holding it for HoldMs (default 300 ms) starts dictation; the button press is swallowed so no context menu opens.
//  2. The words come from a small page (amit_whisper.html, served by the bridge at /whisper) running in its own Edge/Chrome window
//     with its own profile. It uses the browser's speech recognition, the same engine the Amit chat uses.
//  3. Words still changing show in a small box next to the cursor. Settled phrases are typed into whatever has the cursor
//     (SendInput, as text; the clipboard is never touched).
//  4. Letting go stops listening; anything left over is typed.
// Nothing about where you click or type is recorded or sent anywhere. The audio goes only to the browser's speech service,
// exactly as it already does in the Amit chat.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using System.Windows.Automation;

public static class AmitWhisper
{
    public const string Version = "1.02";

    // ---------- settings (saved in %LOCALAPPDATA%\AmitComputerHealth\whisper_settings.txt) ----------
    static volatile bool enabled = true;
    static string button = "right";          // right | middle | x1 (back) | x2 (forward)
    static int holdMs = 300;
    static volatile bool micOk = false;      // the page has been allowed to use the microphone at least once
    static volatile bool setupShown = false; // the one-time "press Allow" window has been shown
    static string keepReady = "10";            // how long the listening window stays ready: "press" (only start it when the button is pressed), "5", "10", "30" minutes unused, or "never"
    static volatile bool textOnly = true;    // only type when the thing that has the keyboard focus is a text box (recommended); stops words and Enter going to a web page, a button, a menu
    static volatile bool targetChecked = false;
    static string abortMsg = "";             // why nothing was typed (shown when the person lets go, instead of "nothing heard")
    static volatile bool sendEnter = false;  // press Enter when the button is let go (only if something was typed); off unless the person turns it on
    static string settingsPath, logPath, profileDir, iconPath;
    static int bridgePort = 8710;

    // ---------- state ----------
    const int ST_IDLE = 0, ST_PENDING = 1, ST_LISTEN = 2, ST_PASS = 3, ST_FINISH = 4;
    static readonly object sync = new object();
    static int state = ST_IDLE;
    static int downX, downY;
    static long token = 0;                    // identifies one press (hold timer + dictation)
    // Every timer is kept in a field: .NET may throw away a Timer nobody refers to before it ever fires.
    static System.Threading.Timer holdTimer, capTimer, idleTimer, setupTimer, testTimer, readyTimer;
    static volatile bool startSent = false;
    static volatile bool typedAny = false;
    static volatile bool audioStarted = false;   // the page reported that it is really listening (only then is speaking useful)
    // Live typing: words of the phrase being spoken are typed as they settle. The last HoldBackWords words of a still-changing
    // phrase are held back because those are the ones the engine revises; segTyped counts the words of the current phrase already typed.
    static int segTyped = 0;
    const int HoldBackWords = 1;
    static readonly object typeLock = new object();
    // Self-correcting mode (ordinary text boxes only): every word is typed at once, and when the engine revises the end of the phrase the
    // difference is backspaced and retyped; when a phrase finishes, the engine's finished version (capitals, punctuation) replaces it.
    // Not used in a web address bar (it completes text by itself as you type, which makes counting backspaces unreliable) or when the field is unknown.
    static volatile bool correctionOk = false;
    static readonly ManualResetEvent modeReady = new ManualResetEvent(false);   // set once the field under the pointer has been looked at
    static string curTyped = "";             // what has been typed for the phrase in progress (self-correcting mode)
    static bool phraseStarted = false;
    const int MaxLiveBackspace = 14;         // while a phrase is still going, never rewrite more than this many characters
    const int MaxFinalRewrite = 260;         // when a phrase finishes, rewrite at most this many
    static IntPtr lastUserWnd = IntPtr.Zero;   // the last window the person was using that is not the Amit window: where words go if the Amit window has the focus
    static System.Threading.Timer fgTrack;
    static IntPtr fgAtStart = IntPtr.Zero;   // the window that had focus when listening began; if it changes, typing stops
    static volatile bool typingAborted = false;
    static string lastTargetName = "";
    static string lastInterim = "";
    static readonly ManualResetEvent endedEvt = new ManualResetEvent(false);
    static volatile bool learning = false;
    static int swallowUpMsg = 0;
    static volatile bool hookOk = false;
    static int lastHookTick = 0;                 // Environment.TickCount the last time Windows called our hook
    static DateTime lastHookRestart = DateTime.MinValue;
    static System.Threading.Timer hookWatch;
    static int prevTick = 0, prevX = 0, prevY = 0;
    [DllImport("user32.dll")] static extern bool GetCursorPos(out POINT p);
    static DateTime lastUse = DateTime.UtcNow;
    const int MaxListenSeconds = 120;

    // ---------- page link ----------
    static readonly object cmdLock = new object();
    static long cmdSeq = 0;
    static string cmdName = "none";
    static int pageWaiting = 0;          // requests from the CURRENT listening window that are waiting for a command
    static int hostGen = 0;              // changes every time the listening window closes or dies, so requests left over from a dead window are not counted
    static DateTime pageSeen = DateTime.MinValue;
    static Process host;
    static bool hostLaunchedVisible = false;
    static string browserUsed = "";

    // A secret made fresh every time the helper starts. Only the listening page (loaded straight into its own window, never fetched by
    // another site) is given it, and every call that can type or change settings must carry it. The bridge answers requests from any web
    // page, so without this a web page open while you dictate could post fake words that would be typed into your window.
    static string pageToken = "";
    public static string Token() { return pageToken; }
    public static bool CheckToken(string t) { return !String.IsNullOrEmpty(t) && !String.IsNullOrEmpty(pageToken) && t == pageToken; }

    static readonly IntPtr MARK = new IntPtr(0x41574D31);   // "AWM1": events we inject ourselves carry this and are never re-handled

    // ---------- native ----------
    delegate IntPtr LowLevelProc(int nCode, IntPtr wParam, IntPtr lParam);
    delegate bool EnumProc(IntPtr h, IntPtr l);
    [StructLayout(LayoutKind.Sequential)] struct POINT { public int x, y; }
    [StructLayout(LayoutKind.Sequential)] struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam, lParam; public uint time; public POINT pt; }
    [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT { public int dx, dy; public uint mouseData, dwFlags, time; public IntPtr dwExtraInfo; }
    [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT { public ushort wVk, wScan; public uint dwFlags, time; public IntPtr dwExtraInfo; }
    [StructLayout(LayoutKind.Explicit)] struct INPUTUNION { [FieldOffset(0)] public MOUSEINPUT mi; [FieldOffset(0)] public KEYBDINPUT ki; }
    [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public INPUTUNION u; }

    [DllImport("user32.dll", SetLastError = true)] static extern IntPtr SetWindowsHookEx(int id, LowLevelProc fn, IntPtr mod, uint thread);
    [DllImport("user32.dll")] static extern bool UnhookWindowsHookEx(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr h, int code, IntPtr w, IntPtr l);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr GetModuleHandle(string name);
    [DllImport("user32.dll")] static extern int GetMessage(out MSG m, IntPtr hwnd, uint min, uint max);
    [DllImport("user32.dll")] static extern bool TranslateMessage(ref MSG m);
    [DllImport("user32.dll")] static extern IntPtr DispatchMessage(ref MSG m);
    [DllImport("user32.dll")] static extern bool PostThreadMessage(uint thread, uint msg, IntPtr w, IntPtr l);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", SetLastError = true)] static extern uint SendInput(uint n, INPUT[] inputs, int size);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder sb, int max);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int left, top, right, bottom; }
    [StructLayout(LayoutKind.Sequential)] struct WINDOWPLACEMENT { public int length, flags, showCmd; public POINT ptMin, ptMax; public RECT rcNormal; }
    [DllImport("user32.dll")] static extern bool SetWindowPlacement(IntPtr h, ref WINDOWPLACEMENT p);

    static LowLevelProc hookProc;
    static IntPtr hookHandle = IntPtr.Zero;
    static uint hookThreadId = 0;
    static Thread hookThread;

    // =====================================================================================================
    //  Start / stop
    // =====================================================================================================
    public static void Start(string watcherDir, int port)
    {
        bridgePort = port;
        iconPath = Path.Combine(watcherDir ?? "", "amit_icon.ico");
        byte[] tb = new byte[16];
        using (System.Security.Cryptography.RNGCryptoServiceProvider rng = new System.Security.Cryptography.RNGCryptoServiceProvider()) { rng.GetBytes(tb); }
        pageToken = BitConverter.ToString(tb).Replace("-", "").ToLowerInvariant();
        string home = Path.Combine(Environment.GetEnvironmentVariable("LOCALAPPDATA") ?? Path.GetTempPath(), "AmitComputerHealth");
        try { Directory.CreateDirectory(home); } catch { }
        settingsPath = Path.Combine(home, "whisper_settings.txt");
        logPath = Path.Combine(home, "whisper.log");
        profileDir = Path.Combine(home, "whisper_profile");
        LoadSettings();
        Log("Whisper mode " + Version + " starting (button=" + button + ", hold=" + holdMs + " ms, enabled=" + enabled + ")");
        hookThread = new Thread(HookThread);
        hookThread.IsBackground = true;
        hookThread.SetApartmentState(ApartmentState.STA);
        hookThread.Start();
        idleTimer = new System.Threading.Timer(delegate { IdleCheck(); }, null, 10000, 10000);
        lastHookTick = Environment.TickCount; prevTick = lastHookTick;
        { POINT p0; if (GetCursorPos(out p0)) { prevX = p0.x; prevY = p0.y; } }   // start the hook watchdog from where the pointer really is
        fgTrack = new System.Threading.Timer(delegate { TrackForeground(); }, null, 1000, 400);
        hookWatch = new System.Threading.Timer(delegate { HookWatchdog(); }, null, 6000, 3000);
        // First run on this computer: show the listening window once so the person can press Allow for the microphone,
        // instead of meeting that question in the middle of their first dictation.
        if (enabled && !micOk && !setupShown && Environment.GetEnvironmentVariable("AMIT_WHISPER_NOSETUP") != "1")
            setupTimer = new System.Threading.Timer(delegate { setupShown = true; SaveSettings(); EnsureHost(); }, null, 5000, Timeout.Infinite);
        // Once the microphone has been allowed, have the listening window ready (off-screen, minimized) so the first press is quick.
        if (enabled && micOk && keepReady != "press" && Environment.GetEnvironmentVariable("AMIT_WHISPER_NOSETUP") != "1")
            readyTimer = new System.Threading.Timer(delegate { EnsureHost(); }, null, 6000, Timeout.Infinite);
        // test safety net: AMIT_WHISPER_TEST_SECONDS removes the hook after that many seconds
        string ts = Environment.GetEnvironmentVariable("AMIT_WHISPER_TEST_SECONDS");
        int tsec;
        if (!String.IsNullOrEmpty(ts) && Int32.TryParse(ts, out tsec) && tsec > 0)
            testTimer = new System.Threading.Timer(delegate { Stop(); }, null, tsec * 1000, Timeout.Infinite);
    }

    public static void Stop()
    {
        try { lock (sync) { state = ST_IDLE; token++; } } catch { }
        try { if (hookThreadId != 0) PostThreadMessage(hookThreadId, 0x0012, IntPtr.Zero, IntPtr.Zero); } catch { }
        try { CloseHost(); } catch { }
        try { HideOverlay(); } catch { }
        Log("Whisper mode stopped");
    }

    static void HookThread()
    {
        try
        {
            hookThreadId = GetCurrentThreadId();
            hookProc = new LowLevelProc(HookCb);
            hookHandle = SetWindowsHookEx(14, hookProc, GetModuleHandle(null), 0);
            if (hookHandle == IntPtr.Zero) { hookOk = false; Log("Could not install the mouse hook (error " + Marshal.GetLastWin32Error() + ")"); return; }
            hookOk = true;
            MSG m;
            while (GetMessage(out m, IntPtr.Zero, 0, 0) > 0) { TranslateMessage(ref m); DispatchMessage(ref m); }
        }
        catch (Exception ex) { Log("Hook thread error: " + ex.Message); }
        finally
        {
            try { if (hookHandle != IntPtr.Zero) UnhookWindowsHookEx(hookHandle); } catch { }
            hookHandle = IntPtr.Zero; hookOk = false;
        }
    }

    // =====================================================================================================
    //  The hook. Keep it quick: it runs on the mouse's own path and Windows drops a slow hook.
    // =====================================================================================================
    static IntPtr HookCb(int nCode, IntPtr wParam, IntPtr lParam)
    {
        try
        {
            lastHookTick = Environment.TickCount;
            if (nCode >= 0 && enabled)
            {
                int msg = wParam.ToInt32();
                if (msg == 0x200)   // mouse move: only matters while a press is waiting to become a hold
                {
                    if (state == ST_PENDING) { if (OnMove(Marshal.ReadInt32(lParam, 0), Marshal.ReadInt32(lParam, 4))) { } }
                }
                else if (msg == 0x204 || msg == 0x205 || msg == 0x207 || msg == 0x208 || msg == 0x20B || msg == 0x20C)
                {
                    IntPtr extra = Marshal.ReadIntPtr(lParam, IntPtr.Size == 8 ? 24 : 20);
                    if (extra != MARK)
                    {
                        int x = Marshal.ReadInt32(lParam, 0), y = Marshal.ReadInt32(lParam, 4);
                        uint md = (uint)Marshal.ReadInt32(lParam, 8);
                        if (HandleButton(msg, md, x, y)) return (IntPtr)1;
                    }
                }
            }
        }
        catch { }
        return CallNextHookEx(hookHandle, nCode, wParam, lParam);
    }

    // Windows removes a low-level mouse hook WITHOUT TELLING the program if the hook is ever too slow to answer. Then holding the button does
    // nothing and a right click behaves normally (seen in real use: dictation worked, then stopped, with nothing in the log). Every call of the
    // hook is timestamped. If the pointer has moved since the last check but the hook was not called at all, the hook is gone: put it back.
    static void HookWatchdog()
    {
        try
        {
            if (!enabled) return;
            POINT p;
            if (!GetCursorPos(out p)) return;
            int tick = lastHookTick;
            bool moved = p.x != prevX || p.y != prevY;
            bool hookSilent = tick == prevTick;
            prevX = p.x; prevY = p.y; prevTick = tick;
            if (moved && hookSilent && (DateTime.UtcNow - lastHookRestart).TotalSeconds > 8)
            {
                Log("Mouse hook stopped answering (the pointer moved but Windows did not call it): putting it back");
                RestartHook();
            }
        }
        catch { }
    }

    static void RestartHook()
    {
        lastHookRestart = DateTime.UtcNow;
        lock (sync) { state = ST_IDLE; token++; }
        try { if (hookThreadId != 0) PostThreadMessage(hookThreadId, 0x0012, IntPtr.Zero, IntPtr.Zero); } catch { }
        try { if (hookThread != null) hookThread.Join(1500); } catch { }
        hookOk = false;
        hookThread = new Thread(HookThread);
        hookThread.IsBackground = true;
        hookThread.SetApartmentState(ApartmentState.STA);
        hookThread.Start();
        lastHookTick = Environment.TickCount;
    }

    // Remember the last window the person was using, ignoring the Amit window itself. Seen in real use: dictations were typed into the Amit
    // window (or a browser page) because that was where the keyboard focus happened to be, so the words and the Enter never reached the chat.
    static void TrackForeground()
    {
        try
        {
            IntPtr fg = GetForegroundWindow();
            if (fg == IntPtr.Zero) return;
            if (WindowTitle(fg).Length == 0) return;                                              // not a real program window
            if (WindowTitle(fg).IndexOf("Amit Whisper mode", StringComparison.OrdinalIgnoreCase) >= 0) return;   // the Amit window
            uint pid; GetWindowThreadProcessId(fg, out pid);
            Process hp = host;
            try { if (hp != null && !hp.HasExited && hp.Id == (int)pid) return; } catch { }       // the window belongs to the helper's own listening browser
            lastUserWnd = fg;
        }
        catch { }
    }

    // Bring a window to the front and give it the keyboard focus. Windows normally refuses this from a background program, so the usual
    // workaround is used: join the input queue of the window that has the focus for a moment.
    static bool FocusWindow(IntPtr h)
    {
        try
        {
            if (h == IntPtr.Zero) return false;
            if (IsIconic(h)) ShowWindow(h, 9);
            IntPtr fg = GetForegroundWindow();
            uint pid; uint fgThread = GetWindowThreadProcessId(fg, out pid);
            uint me = GetCurrentThreadId();
            bool attached = (fgThread != 0 && fgThread != me) && AttachThreadInput(me, fgThread, true);
            SetForegroundWindow(h);
            if (attached) AttachThreadInput(me, fgThread, false);
            Thread.Sleep(150);
            return GetForegroundWindow() == h;
        }
        catch { return false; }
    }

    // What kind of thing has the KEYBOARD focus right now? 1 = a text box, 0 = clearly not (a web page, a button, a menu, a list...), -1 = cannot tell.
    // Measured in real use: VS Code's message box shows up as an Edit named "Message input" (editable); its conversation area is a Group.
    static int FocusedTextState(out string what)
    {
        int state = -1; string desc = "";
        Thread th = new Thread(delegate ()
        {
            try
            {
                AutomationElement el = AutomationElement.FocusedElement;
                if (el == null) return;
                ControlType ct = el.Current.ControlType;
                string cls = el.Current.ClassName ?? "";
                desc = ct.ProgrammaticName.Replace("ControlType.", "") + " \"" + (el.Current.Name ?? "") + "\"";
                if (ct == ControlType.Edit) { state = 1; return; }
                object vp;
                if (el.TryGetCurrentPattern(ValuePattern.Pattern, out vp) && !((ValuePattern)vp).Current.IsReadOnly) { state = 1; return; }
                if (ct == ControlType.Document && cls.IndexOf("edit", StringComparison.OrdinalIgnoreCase) >= 0) { state = 1; return; }
                if (ct == ControlType.Document || ct == ControlType.Group || ct == ControlType.Pane || ct == ControlType.Menu || ct == ControlType.MenuItem || ct == ControlType.MenuBar
                    || ct == ControlType.Button || ct == ControlType.Hyperlink || ct == ControlType.List || ct == ControlType.ListItem || ct == ControlType.Tab || ct == ControlType.TabItem
                    || ct == ControlType.Text || ct == ControlType.Image || ct == ControlType.ToolBar || ct == ControlType.TitleBar || ct == ControlType.Window || ct == ControlType.Tree
                    || ct == ControlType.TreeItem || ct == ControlType.DataItem || ct == ControlType.Table || ct == ControlType.CheckBox || ct == ControlType.RadioButton) state = 0;
            }
            catch { }
        });
        th.IsBackground = true;
        th.Start();
        if (!th.Join(600)) { what = "(timed out)"; return -1; }
        what = desc;
        return state;
    }

    static bool TerminalLike(string p)
    {
        switch (p)
        {
            case "windowsterminal": case "conhost": case "openconsole": case "cmd": case "powershell": case "pwsh": case "putty": case "mintty": case "wezterm-gui": case "alacritty":
            case "mstsc": case "vmconnect": case "vmware": case "virtualboxvm": case "wsl": case "wslhost": return true;
        }
        return false;
    }

    static string FriendlyProgram(string p)
    {
        switch (p) { case "msedge": return "Edge"; case "chrome": return "Chrome"; case "firefox": return "Firefox"; case "code": return "VS Code"; case "notepad": return "Notepad"; case "explorer": return "File Explorer"; }
        return p.Length == 0 ? "this window" : p;
    }

    // Once per dictation, just before the first word would be typed (after the click into a text box under the pointer has had time to happen):
    // if the keyboard focus is clearly NOT a text box, type nothing and press no Enter, and say so. Without this, words and Enter went into
    // web pages and buttons and were silently lost.
    static void CheckTarget()
    {
        if (targetChecked) return;
        targetChecked = true;
        if (!textOnly || typingAborted || TestSink != null) return;
        try
        {
            IntPtr fg = GetForegroundWindow();
            string pn = ProcessNameOf(fg);
            if (TerminalLike(pn)) return;     // terminals and remote desktops do not describe their input to Windows; trust the person
            string what;
            int st = FocusedTextState(out what);
            Log("Focus check in " + (pn.Length > 0 ? pn : "?") + ": " + (st == 1 ? "a text box" : st == 0 ? "NOT a text box" : "could not tell") + " (" + what + ")");
            if (st == 0)
            {
                typingAborted = true;
                abortMsg = "Amit can only type into a text box\nThe text box must have focus: click inside a text box, or any field that accepts text, then hold the button again.";
                ShowOverlay(abortMsg);
                HideOverlayLater(5000);
            }
        }
        catch { }
    }

    static bool IsMyDown(int msg, uint md)
    {
        switch (button)
        {
            case "right": return msg == 0x204;
            case "middle": return msg == 0x207;
            case "x1": return msg == 0x20B && (md >> 16) == 1;
            case "x2": return msg == 0x20B && (md >> 16) == 2;
        }
        return false;
    }
    static bool IsMyUp(int msg, uint md)
    {
        switch (button)
        {
            case "right": return msg == 0x205;
            case "middle": return msg == 0x208;
            case "x1": return msg == 0x20C && (md >> 16) == 1;
            case "x2": return msg == 0x20C && (md >> 16) == 2;
        }
        return false;
    }

    static bool HandleButton(int msg, uint md, int x, int y)
    {
        // "Set button" from the settings page: the next right/middle/side button pressed becomes the trigger.
        if (learning && (msg == 0x204 || msg == 0x207 || msg == 0x20B))
        {
            string b = msg == 0x204 ? "right" : msg == 0x207 ? "middle" : ((md >> 16) == 1 ? "x1" : "x2");
            button = b; learning = false; swallowUpMsg = msg + 1; SaveSettings();
            Log("Button set to " + b);
            return true;
        }
        if (swallowUpMsg != 0 && msg == swallowUpMsg) { swallowUpMsg = 0; return true; }

        lock (sync)
        {
            if (IsMyDown(msg, md))
            {
                if (state != ST_IDLE) return false;          // a press while still finishing the last one behaves as a normal click
                state = ST_PENDING; downX = x; downY = y;
                long t = ++token;
                if (holdTimer != null) holdTimer.Dispose();
                holdTimer = new System.Threading.Timer(delegate { OnHold(t); }, null, holdMs, Timeout.Infinite);
                return true;
            }
            if (IsMyUp(msg, md))
            {
                if (state == ST_PENDING)
                {
                    if (holdTimer != null) { holdTimer.Dispose(); holdTimer = null; }
                    state = ST_IDLE; token++;
                    ThreadPool.QueueUserWorkItem(delegate { InjectButton(true, true); });   // a plain tap: replay it as a normal click
                    return true;
                }
                if (state == ST_LISTEN)
                {
                    state = ST_FINISH;
                    long t = token;
                    ThreadPool.QueueUserWorkItem(delegate { EndDictation(t); });
                    return true;
                }
                if (state == ST_PASS) { state = ST_IDLE; return false; }   // the drag we let through ends normally
                return false;
            }
        }
        return false;
    }

    // moving more than a few pixels before the hold time means the person is dragging, not dictating
    static bool OnMove(int x, int y)
    {
        lock (sync)
        {
            if (state != ST_PENDING) return false;
            int dx = x - downX, dy = y - downY;
            if (dx * dx + dy * dy < 144) return false;
            if (holdTimer != null) { holdTimer.Dispose(); holdTimer = null; }
            state = ST_PASS; token++;
            ThreadPool.QueueUserWorkItem(delegate { InjectButton(true, false); });       // give the app the button press it never saw
        }
        return false;
    }

    static void OnHold(long t)
    {
        int x, y;
        lock (sync)
        {
            if (state != ST_PENDING || token != t) return;
            state = ST_LISTEN; x = downX; y = downY;
            startSent = false; typedAny = false; audioStarted = false; segTyped = 0; lastInterim = ""; endedEvt.Reset();
            correctionOk = false; curTyped = ""; phraseStarted = false; typingAborted = false; fgAtStart = IntPtr.Zero; lastTargetName = ""; modeReady.Reset(); typeModeDecided = false; typeMode = 0; targetChecked = false; abortMsg = "";
            if (capTimer != null) capTimer.Dispose();
            capTimer = new System.Threading.Timer(delegate { CapReached(t); }, null, MaxListenSeconds * 1000, Timeout.Infinite);
        }
        lastUse = DateTime.UtcNow;
        ThreadPool.QueueUserWorkItem(delegate { BeginDictation(x, y, t); });
    }

    static void CapReached(long t)
    {
        lock (sync) { if (state != ST_LISTEN || token != t) return; state = ST_FINISH; }
        EndDictation(t);
    }

    static bool StillHeld(long t) { lock (sync) { return state == ST_LISTEN && token == t; } }

    // =====================================================================================================
    //  Dictation
    // =====================================================================================================
    static void BeginDictation(int x, int y, long t)
    {
        try
        {
            ShowOverlay("Amit is getting ready...");
            if (!PageAlive())
            {
                ShowOverlay("Amit is getting ready\nThe first time takes a few seconds.");
                if (!EnsureHost()) { modeReady.Set(); ShowOverlay("Amit cannot listen here\nWhisper mode needs Microsoft Edge or Google Chrome."); HideOverlayLater(3500); lock (sync) { if (token == t) state = ST_IDLE; } return; }
                int waited = 0;
                while (!PageAlive() && waited < 15000 && StillHeld(t)) { Thread.Sleep(100); waited += 100; }
            }
            if (!StillHeld(t)) return;     // let go before it was ready: EndDictation deals with it
            if (!PageAlive()) { ShowOverlay("Amit could not start listening\nThe listening window did not start."); HideOverlayLater(3500); lock (sync) { if (token == t) state = ST_IDLE; } return; }
            Command("start");
            startSent = true;
            if (!StillHeld(t)) { Command("stop"); return; }   // let go in the instant it started: stop it again
            // "Listening, speak now" is shown when the page reports that it really is listening (OnPageEvent, audiostart).
            // The listening has already been asked to start; putting the cursor in the field under the pointer happens alongside it.
            bool editable = IsEditableAt(x, y);
            if (editable) InjectLeft();
            // self-correcting typing only where the field is known to be an ordinary text box and is not a web address bar
            correctionOk = editable && !AddressBarLike(lastTargetName);
            modeReady.Set();
        }
        catch (Exception ex) { Log("BeginDictation: " + ex.Message); }
        finally { modeReady.Set(); }
    }

    static bool AddressBarLike(string name)
    {
        if (String.IsNullOrEmpty(name)) return false;
        return name.IndexOf("address", StringComparison.OrdinalIgnoreCase) >= 0 || name.IndexOf("search bar", StringComparison.OrdinalIgnoreCase) >= 0
            || name.IndexOf("omnibox", StringComparison.OrdinalIgnoreCase) >= 0 || name.IndexOf("location bar", StringComparison.OrdinalIgnoreCase) >= 0;
    }

    static void EndDictation(long t)
    {
        try
        {
            if (capTimer != null) { capTimer.Dispose(); capTimer = null; }
            if (!startSent)
            {
                HideOverlayLater(300);
                lock (sync) { if (token == t) state = ST_IDLE; }
                return;
            }
            bool tooQuick = !audioStarted;
            if (tooQuick) { ShowOverlay("Amit was not ready yet\nWait until it says Amit is listening, then speak."); HideOverlayLater(2400); }
            else Thread.Sleep(350);   // keep listening a moment longer so the last word is not cut off
            Command("stop");
            DateTime stopAt = DateTime.UtcNow;
            bool gotEnd = endedEvt.WaitOne(3000);
            Log("Stopped listening: the page confirmed in " + (int)(DateTime.UtcNow - stopAt).TotalMilliseconds + " ms" + (gotEnd ? "" : " (no confirmation, timed out)"));
            string left; int leftFrom;
            lock (sync) { left = lastInterim; lastInterim = ""; leftFrom = segTyped; segTyped = 0; }
            // (self-correcting mode has already typed every word of the unfinished phrase)
            if (!correctionOk && left != null && left.Trim().Length > 0) { string[] lw = Words(left); TypeWords(lw, Math.Min(leftFrom, lw.Length), lw.Length); }
            curTyped = ""; phraseStarted = false;
            // Optional: letting go also means "send". Only if words were really typed, and only if the window you were typing in
            // still has focus (never press Enter somewhere else).
            if (sendEnter && typedAny && !tooQuick && ForegroundOk())
            {
                Thread.Sleep(120);   // let the last typed characters land first
                PressEnter();
                Log("Pressed Enter (send on release)");
            }
            startSent = false;
            if (typingAborted && abortMsg.Length > 0 && !typedAny) { ShowOverlay(abortMsg); HideOverlayLater(4500); }
            else if (!tooQuick) { ShowOverlay(typedAny ? (sendEnter ? "Amit heard you\nSending..." : "Amit heard you") : "Amit did not hear anything\nTry again, a little closer to the microphone."); HideOverlayLater(typedAny ? 800 : 1800); }
        }
        catch (Exception ex) { Log("EndDictation: " + ex.Message); }
        finally { lock (sync) { if (token == t && state == ST_FINISH) state = ST_IDLE; } }
    }

    static bool SessionActive() { lock (sync) { return (state == ST_LISTEN || state == ST_FINISH) && startSent; } }

    // Called by the bridge for every event the page posts: "kind\ntext"
    public static void OnPageEvent(string body)
    {
        try
        {
            if (body == null) return;
            int nl = body.IndexOf('\n');
            string kind = nl < 0 ? body.Trim() : body.Substring(0, nl).Trim();
            string text = nl < 0 ? "" : body.Substring(nl + 1).Trim();
            switch (kind)
            {
                case "micok":
                    if (!micOk) { micOk = true; SaveSettings(); }
                    if (hostLaunchedVisible) { hostLaunchedVisible = false; MinimizeHost(); }
                    break;
                case "diag":
                    Log("Page: " + text);
                    break;
                case "audiostart":
                    if (!micOk) { micOk = true; SaveSettings(); }
                    if (SessionActive())
                    {
                        audioStarted = true;
                        ShowOverlay("Amit is listening\nSpeak now");
                        // Where will the words go? Remember which window has the focus now; if that changes while typing, typing stops.
                        // If the Amit window itself has the focus, typing would go into it and be lost: put the focus back on the window the
                        // person was last using, or, if that is not possible, type nothing and say why.
                        IntPtr fg = GetForegroundWindow();
                        bool ours = WindowTitle(fg).IndexOf("Amit Whisper mode", StringComparison.OrdinalIgnoreCase) >= 0;
                        if (ours && FocusWindow(lastUserWnd)) { fg = GetForegroundWindow(); ours = WindowTitle(fg).IndexOf("Amit Whisper mode", StringComparison.OrdinalIgnoreCase) >= 0; Log("The Amit window had the focus; moved it back to " + ProcessNameOf(fg)); }
                        if (ours)
                        {
                            typingAborted = true;
                            abortMsg = "Amit can't type into its own window\nClick where you want the words, then hold the button again.";
                            Log("Dictation target: the Amit window itself - nothing typed, no Enter");
                            ShowOverlay(abortMsg);
                            HideOverlayLater(4500);
                        }
                        else
                        {
                            fgAtStart = fg;
                            string tt = WindowTitle(fg); if (tt.Length > 50) tt = tt.Substring(0, 50);
                            Log("Dictation target: " + ProcessNameOf(fg) + " \"" + tt + "\"");
                        }
                    }
                    break;
                case "interim":
                    if (SessionActive())
                    {
                        modeReady.WaitOne(700);   // wait (briefly) until we know what kind of field this is
                        CheckTarget();
                        lock (sync) { lastInterim = text; }
                        if (correctionOk)
                        {
                            if (text.Length > 0) ApplyPhrase(Capitalize(text), false);
                        }
                        else
                        {
                            // append-only: type the words that have settled; keep the last one back (the engine still revises it)
                            string[] w = Words(text);
                            int from, upto;
                            lock (sync) { from = segTyped; upto = Math.Max(segTyped, w.Length - HoldBackWords); segTyped = upto; }
                            TypeWords(w, from, upto);
                        }
                        if (text.Length > 0) ShowOverlay("Amit is listening\n" + Tail(text));
                    }
                    break;
                case "final":
                    if (SessionActive() && text.Length > 0)
                    {
                        modeReady.WaitOne(700);
                        CheckTarget();
                        if (correctionOk)
                        {
                            // the phrase is finished: replace what was typed with the engine's finished version (capitals, punctuation)
                            ApplyPhrase(text, true);
                            lock (sync) { lastInterim = ""; segTyped = 0; }
                            curTyped = ""; phraseStarted = false;
                        }
                        else
                        {
                            // append-only: type whatever of the phrase has not been typed yet
                            string[] w = Words(text);
                            int from;
                            lock (sync) { from = Math.Min(segTyped, w.Length); segTyped = 0; lastInterim = ""; }
                            TypeWords(w, from, w.Length);
                        }
                        ShowOverlay("Amit is listening\n" + Tail(text));
                    }
                    break;
                case "ended":
                    endedEvt.Set();
                    break;
                case "error":
                    if (SessionActive())
                    {
                        if (text == "not-allowed" || text == "service-not-allowed") ShowOverlay("Amit cannot hear you\nThe microphone is not allowed. Open the Amit Whisper window and press Allow.");
                        else if (text == "no-mic") ShowOverlay("Amit cannot hear you\nNo microphone was found.");
                        else if (text == "network") ShowOverlay("Amit cannot hear you\nThe speech service could not be reached.");
                        else ShowOverlay("Amit cannot listen\n" + text);
                        HideOverlayLater(3000);
                    }
                    Log("Page reported: " + text);
                    endedEvt.Set();
                    break;
            }
        }
        catch (Exception ex) { Log("OnPageEvent: " + ex.Message); }
    }

    static string[] Words(string s) { return s.Split(new char[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries); }

    static string Capitalize(string s) { return s.Length == 0 ? s : Char.ToUpperInvariant(s[0]) + s.Substring(1); }

    static int CommonPrefixLength(string a, string b)
    {
        int n = Math.Min(a.Length, b.Length), i = 0;
        while (i < n && a[i] == b[i]) i++;
        return i;
    }

    static string WindowTitle(IntPtr h)
    {
        try { StringBuilder sb = new StringBuilder(256); GetWindowText(h, sb, 256); return sb.ToString(); } catch { return ""; }
    }

    // Typing is allowed only while the window that had focus when listening began still has it.
    static bool ForegroundOk()
    {
        if (TestSink != null) return true;
        if (typingAborted) return false;
        if (fgAtStart == IntPtr.Zero) return true;     // not known: do not block
        if (GetForegroundWindow() == fgAtStart) return true;
        typingAborted = true;
        abortMsg = "Amit stopped typing\nThe window you were typing in is no longer in front.";
        Log("Stopped typing: the window that had focus changed");
        ShowOverlay(abortMsg);
        HideOverlayLater(3000);
        return false;
    }

    static void PressEnter()
    {
        if (TestSink != null) { TestSink("\n"); return; }
        INPUT[] a = new INPUT[2];
        a[0].type = 1; a[0].u.ki.wVk = 0x0D; a[0].u.ki.dwExtraInfo = MARK;
        a[1].type = 1; a[1].u.ki.wVk = 0x0D; a[1].u.ki.dwFlags = 0x0002; a[1].u.ki.dwExtraInfo = MARK;
        SendInput(2, a, Marshal.SizeOf(typeof(INPUT)));
    }

    static void SendBackspaces(int n)
    {
        if (n <= 0) return;
        if (TestSink != null) { TestSink(new String('\b', n)); return; }
        AutoTypeMode();
        int size = Marshal.SizeOf(typeof(INPUT));
        if (typeMode == 1)
        {
            for (int k = 0; k < n; k++)
            {
                INPUT[] bs = new INPUT[2];
                bs[0].type = 1; bs[0].u.ki.wVk = 0x08; bs[0].u.ki.dwExtraInfo = MARK;
                bs[1].type = 1; bs[1].u.ki.wVk = 0x08; bs[1].u.ki.dwFlags = 0x0002; bs[1].u.ki.dwExtraInfo = MARK;
                SendInput(2, bs, size);
                Thread.Sleep(typeDelayMs);
            }
            return;
        }
        while (n > 0)
        {
            int c = Math.Min(n, 100);
            INPUT[] a = new INPUT[c * 2];
            for (int i = 0; i < c; i++)
            {
                a[i * 2].type = 1; a[i * 2].u.ki.wVk = 0x08; a[i * 2].u.ki.dwExtraInfo = MARK;
                a[i * 2 + 1].type = 1; a[i * 2 + 1].u.ki.wVk = 0x08; a[i * 2 + 1].u.ki.dwFlags = 0x0002; a[i * 2 + 1].u.ki.dwExtraInfo = MARK;
            }
            SendInput((uint)(c * 2), a, size);
            n -= c;
            if (n > 0) Thread.Sleep(4);
        }
    }

    // Self-correcting typing: make what is typed for this phrase equal "desired" by backspacing the part that differs and typing the rest.
    static void ApplyPhrase(string desired, bool isFinal)
    {
        lock (typeLock)
        {
            if (!ForegroundOk()) return;
            string old = curTyped;
            int p = CommonPrefixLength(old, desired);
            int back = old.Length - p;
            string add = desired.Substring(p);
            if (back == 0 && add.Length == 0) return;
            if (back > (isFinal ? MaxFinalRewrite : MaxLiveBackspace)) return;   // too big a change: wait for a later update
            string sep = (!phraseStarted && typedAny) ? " " : "";
            SendBackspaces(back);
            TypeText(sep + add);
            curTyped = desired; phraseStarted = true; typedAny = true;
            if (TestSink == null) Log("Typed: [" + (back > 0 ? "<-" + back + ">" : "") + sep + add + "]");
        }
    }

    // types words[from..to) as one piece of text, with a space in front of it if something was already typed this time
    static void TypeWords(string[] w, int from, int to)
    {
        if (w == null || to <= from) return;
        lock (typeLock)
        {
            if (!ForegroundOk()) return;
            string piece = (typedAny ? " " : "") + String.Join(" ", w, from, to - from);
            TypeText(piece);
            typedAny = true;
            if (TestSink == null) Log("Typed: [" + piece + "]");
        }
    }

    static string Tail(string s) { return s.Length > 110 ? "..." + s.Substring(s.Length - 110) : s; }

    // =====================================================================================================
    //  The listening page link (the bridge's /api/whisper/wait calls WaitCommand)
    // =====================================================================================================
    static void Command(string name) { lock (cmdLock) { cmdSeq++; cmdName = name; Monitor.PulseAll(cmdLock); } }

    // since < 0: tell me where you are now (a freshly loaded page ignores old commands)
    public static string WaitCommand(long since, int timeoutMs)
    {
        int myGen;
        lock (cmdLock) { myGen = hostGen; pageWaiting++; pageSeen = DateTime.UtcNow; }
        try
        {
            lock (cmdLock)
            {
                if (since < 0 || since > cmdSeq) return "{\"seq\":" + cmdSeq + ",\"cmd\":\"none\"}";   // new page, or the helper restarted: just say where we are
                if (cmdSeq <= since) Monitor.Wait(cmdLock, timeoutMs);
                return "{\"seq\":" + cmdSeq + ",\"cmd\":\"" + (cmdSeq > since ? cmdName : "none") + "\"}";
            }
        }
        finally { lock (cmdLock) { if (myGen == hostGen) { pageWaiting--; pageSeen = DateTime.UtcNow; } } }   // a request left over from a window that has since closed must not make the page look alive
    }

    // Is a listening window really there? Seen in real use: after the window closed (turned itself off, or was closed by hand) its last
    // "waiting for a command" request stayed open inside the helper for up to 20 seconds, so the helper thought the page was alive,
    // sent "start listening" into nothing, and the person talked for ten seconds with nothing captured. So: if the window process is gone,
    // the page is dead at once, and requests left over from it are forgotten.
    static bool PageAlive()
    {
        lock (cmdLock)
        {
            if (host != null)
            {
                bool dead = false;
                try { dead = host.HasExited; } catch { dead = true; }
                if (dead) { host = null; hostGen++; pageWaiting = 0; pageSeen = DateTime.MinValue; }
            }
            return pageWaiting > 0 || (DateTime.UtcNow - pageSeen).TotalSeconds < 4;
        }
    }

    // =====================================================================================================
    //  The browser window that does the listening
    // =====================================================================================================
    static string FindBrowser()
    {
        string pf = Environment.GetEnvironmentVariable("ProgramFiles") ?? @"C:\Program Files";
        string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? @"C:\Program Files (x86)";
        string lad = Environment.GetEnvironmentVariable("LOCALAPPDATA") ?? "";
        string[] paths = new string[] {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(lad, @"Google\Chrome\Application\chrome.exe") };
        foreach (string p in paths) { try { if (File.Exists(p)) return p; } catch { } }
        return null;
    }

    static bool EnsureHost()
    {
        lock (cmdLock)
        {
            if (host != null) { try { if (!host.HasExited) return true; } catch { } }
            string exe = FindBrowser();
            if (exe == null) { Log("No Edge or Chrome found"); return false; }
            try
            {
                browserUsed = exe.IndexOf("msedge", StringComparison.OrdinalIgnoreCase) >= 0 ? "edge" : "chrome";
                Directory.CreateDirectory(profileDir);
                Rectangle wa = Screen.PrimaryScreen.WorkingArea;
                // First run: a visible window in the bottom right corner so the person can press Allow for the microphone.
                // Afterwards: started off-screen and minimized so it never shows, and focus is handed straight back.
                string pos = micOk ? "-32000,-32000" : (wa.Right - 440) + "," + (wa.Bottom - 280);
                // The anti-slowdown switches keep a minimized/hidden window running at full speed (a hidden browser window is normally slowed down).
                string args = "--user-data-dir=\"" + profileDir + "\" --no-first-run --no-default-browser-check --disable-sync"
                    + " --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --autoplay-policy=no-user-gesture-required"
                    + " --disable-features=Translate,CalculateNativeWinOcclusion,IntensiveWakeUpThrottling,OptimizationHints,MediaRouter"
                    + " --renderer-process-limit=1 --disable-gpu --disable-extensions --disable-background-networking --disable-component-update --disable-default-apps --disable-breakpad --disable-domain-reliability --disable-client-side-phishing-detection --no-pings"
                    + " --app=http://localhost:" + bridgePort + "/whisper?host=1 --window-size=560,600 --window-position=" + pos;
                IntPtr fg = GetForegroundWindow();
                ProcessStartInfo psi = new ProcessStartInfo(exe, args);
                psi.UseShellExecute = true;
                psi.WindowStyle = micOk ? ProcessWindowStyle.Minimized : ProcessWindowStyle.Normal;
                hostLaunchedVisible = !micOk;
                host = Process.Start(psi);
                Log("Started the listening page in " + browserUsed + (micOk ? " (off-screen, minimized)" : " (visible, first run)"));
                if (micOk) ThreadPool.QueueUserWorkItem(delegate { KeepHostHidden(fg); });
                return true;
            }
            catch (Exception ex) { Log("Could not start the browser: " + ex.Message); return false; }
        }
    }

    static void CloseHost()
    {
        Process h;
        lock (cmdLock) { h = host; host = null; hostGen++; pageWaiting = 0; pageSeen = DateTime.MinValue; }
        if (h == null) return;
        try { if (!h.HasExited) { h.CloseMainWindow(); if (!h.WaitForExit(1500)) h.Kill(); } } catch { }
    }

    static IntPtr FindHostWindow()
    {
        IntPtr found = IntPtr.Zero;
        try
        {
            EnumWindows(delegate (IntPtr h, IntPtr l)
            {
                if (!IsWindowVisible(h)) return true;
                StringBuilder sb = new StringBuilder(256);
                GetWindowText(h, sb, 256);
                if (sb.ToString().IndexOf("Amit Whisper mode (listening)", StringComparison.OrdinalIgnoreCase) >= 0) { found = h; return false; }
                return true;
            }, IntPtr.Zero);
        }
        catch { }
        return found;
    }

    // Sets the size and place the window has when someone restores it from the taskbar, and leaves it minimized. (A browser app window
    // remembers its last size; the first version of it was small, so it opened tiny.)
    static void PlaceHostMinimized(IntPtr h)
    {
        try
        {
            Rectangle wa = Screen.PrimaryScreen.WorkingArea;
            int w = Math.Min(wa.Width - 80, Math.Max(640, (int)(wa.Width * 0.32)));
            int ht = Math.Min(wa.Height - 80, Math.Max(760, (int)(wa.Height * 0.62)));
            WINDOWPLACEMENT wp = new WINDOWPLACEMENT();
            wp.length = Marshal.SizeOf(typeof(WINDOWPLACEMENT));
            wp.showCmd = 7;   // minimized, without taking focus
            wp.rcNormal.left = wa.Left + (wa.Width - w) / 2; wp.rcNormal.top = wa.Top + (wa.Height - ht) / 2;
            wp.rcNormal.right = wp.rcNormal.left + w; wp.rcNormal.bottom = wp.rcNormal.top + ht;
            SetWindowPlacement(h, ref wp);
        }
        catch { }
    }

    // Minimizes the listening window if it is showing. Returns true if it had to (it was not already minimized).
    static bool MinimizeHost()
    {
        bool changed = false;
        try { IntPtr hp = FindHostWindow(); if (hp != IntPtr.Zero && !IsIconic(hp)) { PlaceHostMinimized(hp); changed = true; } } catch { }
        try
        {
            EnumWindows(delegate (IntPtr h, IntPtr l)
            {
                if (!IsWindowVisible(h)) return true;
                StringBuilder sb = new StringBuilder(256);
                GetWindowText(h, sb, 256);
                if (sb.ToString().IndexOf("Amit Whisper mode (listening)", StringComparison.OrdinalIgnoreCase) >= 0 && !IsIconic(h)) { ShowWindow(h, 7); changed = true; }   // minimize without taking focus
                return true;
            }, IntPtr.Zero);
        }
        catch { }
        return changed;
    }

    // For the first few seconds after the listening window starts: if it has come up anyway, minimize it, and give focus back to
    // the window the person was using (a new window grabs focus, and typed words would otherwise go into it).
    static void KeepHostHidden(IntPtr previous)
    {
        try
        {
            bool refocused = false, placed = false;
            for (int n = 0; n < 40; n++)
            {
                Thread.Sleep(150);
                if (!placed)
                {
                    IntPtr hw = FindHostWindow();
                    if (hw != IntPtr.Zero)
                    {
                        bool wasShowing = !IsIconic(hw);
                        PlaceHostMinimized(hw);
                        placed = true;
                        if (wasShowing && !refocused) { refocused = true; if (previous != IntPtr.Zero && !IsIconic(previous)) SetForegroundWindow(previous); }
                    }
                }
                if (MinimizeHost() && !refocused)
                {
                    refocused = true;
                    if (previous != IntPtr.Zero && !IsIconic(previous)) SetForegroundWindow(previous);
                }
                if (refocused && n > 6) { /* keep checking a little longer in case it reappears */ }
                if (refocused && n > 20) break;
            }
        }
        catch { }
    }

    static bool HostGone() { lock (cmdLock) { if (host == null) return true; try { return host.HasExited; } catch { return true; } } }

    // not used for the time the person chose (Keep ready): close the listening window so it does not hold memory for nothing
    static void IdleCheck()
    {
        try
        {
            int closeAfter = CloseAfterSeconds();
            // If the person asked for it to be kept ready but the window is gone (closed by hand, or it stopped), bring it back quietly.
            if (keepReady != "press" && enabled && micOk && HostGone() && (closeAfter == 0 || (DateTime.UtcNow - lastUse).TotalSeconds < closeAfter)) { EnsureHost(); return; }
            if (closeAfter == 0) return;   // "never": the person chose to keep it running all the time
            if ((DateTime.UtcNow - lastUse).TotalSeconds < closeAfter) return;
            lock (sync) { if (state != ST_IDLE) return; }
            if (host != null) { Log("Closing the idle listening page"); CloseHost(); }
        }
        catch { }
    }

    // =====================================================================================================
    //  Typing and clicking
    // =====================================================================================================
    static void InjectButton(bool down, bool up)
    {
        uint dn, upf, data = 0;
        switch (button)
        {
            case "middle": dn = 0x0020; upf = 0x0040; break;
            case "x1": dn = 0x0080; upf = 0x0100; data = 1; break;
            case "x2": dn = 0x0080; upf = 0x0100; data = 2; break;
            default: dn = 0x0008; upf = 0x0010; break;
        }
        List<INPUT> l = new List<INPUT>();
        if (down) l.Add(Mouse(dn, data));
        if (up) l.Add(Mouse(upf, data));
        SendInput((uint)l.Count, l.ToArray(), Marshal.SizeOf(typeof(INPUT)));
    }
    static void InjectLeft()
    {
        INPUT[] a = new INPUT[] { Mouse(0x0002, 0), Mouse(0x0004, 0) };
        SendInput(2, a, Marshal.SizeOf(typeof(INPUT)));
    }
    static INPUT Mouse(uint flags, uint data)
    {
        INPUT i = new INPUT(); i.type = 0;
        i.u.mi.dwFlags = flags; i.u.mi.mouseData = data; i.u.mi.dwExtraInfo = MARK;
        return i;
    }

    public static Action<string> TestSink;   // tests only: when set, text is handed here instead of being typed into a window

    // How text reaches the window that has focus:
    //   0 = all characters in one batch (fast; works in nearly every program)
    //   1 = one character at a time with a short pause (Notepad and some Store apps drop or garble characters that arrive too fast:
    //       measured in a fresh Notepad: all at once 3 of 8 correct, 3 ms apart 7 of 8, 10 ms apart 8 of 8)
    static int typeMode = 0;
    static int typeDelayMs = 12;
    static bool typeModeDecided = false;

    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    static string ProcessNameOf(IntPtr h) { try { uint pid; GetWindowThreadProcessId(h, out pid); return Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant(); } catch { return ""; } }
    static bool SlowInputApp(string name) { return name == "notepad" || name == "applicationframehost" || name == "stickynotes"; }

    // Decide, once per dictation, how to type into the window that has focus.
    static void AutoTypeMode()
    {
        if (typeModeDecided || TestSink != null) return;
        IntPtr fg = GetForegroundWindow();
        if (fg == IntPtr.Zero || WindowTitle(fg).IndexOf("Amit Whisper mode", StringComparison.OrdinalIgnoreCase) >= 0) return;
        string n = ProcessNameOf(fg);
        typeMode = SlowInputApp(n) ? 1 : 0; typeModeDecided = true;
        Log("Typing into " + (n.Length > 0 ? n : "an unknown program") + ": " + (typeMode == 1 ? "paced, one character at a time" : "normal"));
    }

    static void TypeText(string s)
    {
        if (String.IsNullOrEmpty(s)) return;
        if (TestSink != null) { TestSink(s); return; }
        AutoTypeMode();
        if (typeMode == 1)
        {
            int size1 = Marshal.SizeOf(typeof(INPUT));
            foreach (char c in s)
            {
                if (c == '\r' || c == '\n') continue;
                INPUT[] one = new INPUT[2];
                one[0].type = 1; one[0].u.ki.wScan = c; one[0].u.ki.dwFlags = 0x0004; one[0].u.ki.dwExtraInfo = MARK;
                one[1].type = 1; one[1].u.ki.wScan = c; one[1].u.ki.dwFlags = 0x0004 | 0x0002; one[1].u.ki.dwExtraInfo = MARK;
                SendInput(2, one, size1);
                Thread.Sleep(typeDelayMs);
            }
            return;
        }
        List<INPUT> l = new List<INPUT>();
        foreach (char c in s)
        {
            if (c == '\r' || c == '\n') continue;
            INPUT d = new INPUT(); d.type = 1; d.u.ki.wScan = c; d.u.ki.dwFlags = 0x0004; d.u.ki.dwExtraInfo = MARK;
            INPUT u = new INPUT(); u.type = 1; u.u.ki.wScan = c; u.u.ki.dwFlags = 0x0004 | 0x0002; u.u.ki.dwExtraInfo = MARK;
            l.Add(d); l.Add(u);
        }
        int size = Marshal.SizeOf(typeof(INPUT));
        for (int i = 0; i < l.Count; i += 120)
        {
            int n = Math.Min(120, l.Count - i);
            INPUT[] chunk = new INPUT[n];
            l.CopyTo(i, chunk, 0, n);
            SendInput((uint)n, chunk, size);
            if (l.Count > 120) Thread.Sleep(4);
        }
    }

    // Is there a text box under the pointer? Windows accessibility can say (it can be slow or hang, so it gets 400 ms).
    static bool IsEditableAt(int x, int y)
    {
        bool result = false;
        string seen = "nothing";
        Thread th = new Thread(delegate ()
        {
            try
            {
                AutomationElement el = AutomationElement.FromPoint(new System.Windows.Point(x, y));
                if (el == null) return;
                seen = el.Current.ControlType.ProgrammaticName;
                lastTargetName = el.Current.Name ?? "";
                if (el.Current.ControlType == ControlType.Edit) { result = true; return; }
                object vp;
                if (el.TryGetCurrentPattern(ValuePattern.Pattern, out vp)) result = !((ValuePattern)vp).Current.IsReadOnly;
                // Multi-line boxes (Notepad, Word-style editors, WinForms) are reported as a "Document" whose window class says Edit
                if (!result && el.Current.ControlType == ControlType.Document)
                {
                    string cls = el.Current.ClassName ?? "";
                    seen += " " + cls;
                    if (cls.IndexOf("edit", StringComparison.OrdinalIgnoreCase) >= 0) result = true;
                }
            }
            catch (Exception ex) { seen = "error " + ex.Message; }
        });
        th.IsBackground = true;
        th.Start();
        if (!th.Join(400)) { Log("Press at " + x + "," + y + ": accessibility check took too long, no click-first"); return false; }
        Log("Press at " + x + "," + y + ": under the pointer is " + seen + " \"" + lastTargetName + "\"" + (result ? " (a text box: clicking into it first)" : " (not a text box: typing where the cursor already is)"));
        return result;
    }

    // =====================================================================================================
    //  The box next to the cursor
    // =====================================================================================================
    class OverlayForm : Form
    {
        Label lblTitle, lblBody;
        PictureBox pic;
        FlowLayoutPanel head, bodyPanel;
        static readonly Color Dark = Color.FromArgb(24, 26, 32);
        public OverlayForm()
        {
            FormBorderStyle = FormBorderStyle.None; ShowInTaskbar = false; TopMost = true;
            StartPosition = FormStartPosition.Manual;
            BackColor = Dark; Opacity = 0.96;
            AutoSize = true; AutoSizeMode = AutoSizeMode.GrowAndShrink;
            Padding = new Padding(0);
            // The window is cut to a shape (see ApplyShape): Amit's icon floats on its own, and only the words get a dark card behind them.
            FlowLayoutPanel flow = new FlowLayoutPanel();
            flow.FlowDirection = FlowDirection.TopDown; flow.WrapContents = false;
            flow.AutoSize = true; flow.AutoSizeMode = AutoSizeMode.GrowAndShrink; flow.Margin = new Padding(0); flow.Padding = new Padding(0); flow.BackColor = Dark;
            head = new FlowLayoutPanel();
            head.FlowDirection = FlowDirection.LeftToRight; head.WrapContents = false;
            head.AutoSize = true; head.AutoSizeMode = AutoSizeMode.GrowAndShrink; head.Margin = new Padding(0, 0, 0, 6); head.Padding = new Padding(0); head.BackColor = Dark;
            pic = new PictureBox();
            pic.SizeMode = PictureBoxSizeMode.Zoom; pic.Size = new Size(60, 60); pic.Margin = new Padding(0, 0, 8, 0); pic.BackColor = Dark;
            try
            {
                if (iconPath != null && File.Exists(iconPath))
                {
                    // Drawn ONCE at its exact size, over gold, so the soft edge blends into gold and not into the dark card (which looked like a
                    // blurry black rim). The icon's gold ring sits about 1.5% inside its picture, so it is drawn slightly larger to reach the edge.
                    using (Bitmap src = new Bitmap(iconPath))
                    {
                        int S = pic.Width;
                        Bitmap b = new Bitmap(S, S);
                        using (Graphics g = Graphics.FromImage(b))
                        {
                            g.Clear(Color.FromArgb(212, 175, 55));
                            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                            g.SmoothingMode = SmoothingMode.HighQuality;
                            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                            float d = S * 4f / 256f;
                            g.DrawImage(src, new RectangleF(-d, -d, S + 2 * d, S + 2 * d));
                            // a thin gold rim over the very edge, so no dark or half-blended pixel can show around the circle
                            using (Pen rim = new Pen(Color.FromArgb(212, 175, 55), 3.4f)) { g.DrawEllipse(rim, 1.7f, 1.7f, S - 3.4f, S - 3.4f); }
                        }
                        pic.Image = b;
                        pic.SizeMode = PictureBoxSizeMode.Normal;
                        pic.BackColor = Color.FromArgb(212, 175, 55);
                    }
                }
            }
            catch (Exception ex) { Log("Box icon not loaded: " + ex.Message); }
            lblTitle = new Label();
            lblTitle.AutoSize = true; lblTitle.Margin = new Padding(0, 8, 0, 0); lblTitle.Padding = new Padding(12, 6, 12, 6); lblTitle.BackColor = Dark;
            lblTitle.ForeColor = Color.FromArgb(232, 201, 106); lblTitle.Font = new Font("Segoe UI Semibold", 13f);
            bodyPanel = new FlowLayoutPanel();
            bodyPanel.FlowDirection = FlowDirection.TopDown; bodyPanel.WrapContents = false;
            bodyPanel.AutoSize = true; bodyPanel.AutoSizeMode = AutoSizeMode.GrowAndShrink; bodyPanel.Margin = new Padding(0); bodyPanel.Padding = new Padding(18, 12, 18, 12); bodyPanel.BackColor = Dark;
            lblBody = new Label();
            lblBody.AutoSize = true; lblBody.Margin = new Padding(0); lblBody.MaximumSize = new Size(760, 0); lblBody.BackColor = Dark;
            lblBody.ForeColor = Color.FromArgb(240, 238, 230); lblBody.Font = new Font("Segoe UI", 17f);
            if (pic.Image != null) head.Controls.Add(pic);
            head.Controls.Add(lblTitle);
            bodyPanel.Controls.Add(lblBody);
            flow.Controls.Add(head); flow.Controls.Add(bodyPanel);
            Controls.Add(flow);
        }
        protected override bool ShowWithoutActivation { get { return true; } }
        protected override CreateParams CreateParams
        {
            get { CreateParams cp = base.CreateParams; cp.ExStyle |= 0x08000000 | 0x00000080 | 0x00000020; return cp; }   // no focus, no taskbar button, clicks pass through
        }

        // where a control sits inside this window
        Rectangle InForm(Control c)
        {
            Point p = Point.Empty;
            for (Control x = c; x != null && x != this; x = x.Parent) p.Offset(x.Left, x.Top);
            return new Rectangle(p, c.Size);
        }

        // Cut the window to its outline: a circle for the icon, a box for the title (when there is one), a box for the words.
        // Everything else is see-through.
        void ApplyShape()
        {
            GraphicsPath gp = new GraphicsPath();
            if (pic.Image != null && head.Visible) gp.AddEllipse(InForm(pic));
            if (lblTitle.Visible) gp.AddRectangle(InForm(lblTitle));
            if (bodyPanel.Visible) gp.AddRectangle(InForm(bodyPanel));
            if (gp.PointCount == 0) gp.AddRectangle(new Rectangle(0, 0, Math.Max(1, Width), Math.Max(1, Height)));
            Region old = Region;
            Region = new Region(gp);
            if (old != null) old.Dispose();
            gp.Dispose();
        }

        // a picture of the box as it looks (see-through parts shown light grey), for the self-test
        public Bitmap Snapshot()
        {
            using (Bitmap raw = new Bitmap(Width, Height))
            {
                DrawToBitmap(raw, new Rectangle(0, 0, Width, Height));
                Bitmap outp = new Bitmap(Width, Height);
                using (Graphics g = Graphics.FromImage(outp))
                {
                    g.Clear(Color.FromArgb(235, 235, 235));
                    if (Region != null) g.SetClip(Region, CombineMode.Replace);
                    g.DrawImage(raw, 0, 0);
                }
                return outp;
            }
        }

        public void SetMsg(string t)
        {
            // the first line is the title; anything after a line break is the body
            int nl = t.IndexOf('\n');
            string title = nl < 0 ? t : t.Substring(0, nl);
            bool iconSaysIt = pic.Image != null && title == "Amit is listening";   // the icon already says it is Amit
            lblTitle.Text = iconSaysIt ? "" : title;
            lblTitle.Visible = !iconSaysIt;
            lblBody.Text = nl < 0 ? "" : t.Substring(nl + 1);
            bodyPanel.Visible = lblBody.Text.Length > 0;
            head.Visible = pic.Image != null || lblTitle.Visible;
            PerformLayout();
            Point p = Cursor.Position;
            Rectangle wa = Screen.FromPoint(p).WorkingArea;
            int x = p.X + 18, y = p.Y + 26;
            Size sz = PreferredSize;
            if (x + sz.Width > wa.Right) x = wa.Right - sz.Width - 4;
            if (y + sz.Height > wa.Bottom) y = p.Y - sz.Height - 12;
            Location = new Point(Math.Max(wa.Left, x), Math.Max(wa.Top, y));
            if (!Visible) Show();
            PerformLayout();
            ApplyShape();
            // "Always on top" is not kept by a window shown this way (measured: the box was visible but sat BEHIND Edge), so ask for it every time.
            SetWindowPos(Handle, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010);   // HWND_TOPMOST, no move, no resize, no activation
        }
    }
    static OverlayForm overlay;
    static Thread overlayThread;
    static readonly ManualResetEvent overlayReady = new ManualResetEvent(false);
    static long hideToken = 0;

    static void EnsureOverlay()
    {
        if (overlayThread != null) { overlayReady.WaitOne(2000); return; }
        lock (sync)
        {
            if (overlayThread != null) return;
            overlayThread = new Thread(delegate ()
            {
                try
                {
                    overlay = new OverlayForm();
                    IntPtr h = overlay.Handle;
                    // The helper is started as a hidden process, and Windows gives the FIRST window such a process shows the "hidden"
                    // setting it was started with, so the live-words box never appeared (measured). Use up that first call on the
                    // box while it is off-screen, so every real showing afterwards works.
                    overlay.Location = new Point(-32000, -32000);
                    ShowWindow(h, 4);   // SW_SHOWNOACTIVATE
                    ShowWindow(h, 0);   // SW_HIDE
                    overlayReady.Set();
                    Application.Run();
                }
                catch (Exception ex) { Log("Overlay: " + ex.Message); }
            });
            overlayThread.IsBackground = true;
            overlayThread.SetApartmentState(ApartmentState.STA);
            overlayThread.Start();
        }
        overlayReady.WaitOne(3000);
    }

    static void ShowOverlay(string text)
    {
        try
        {
            Interlocked.Increment(ref hideToken);
            EnsureOverlay();
            OverlayForm f = overlay;
            if (f != null && f.IsHandleCreated) f.BeginInvoke(new Action(delegate { f.SetMsg(text); }));
        }
        catch { }
    }
    [DllImport("user32.dll", EntryPoint = "GetWindowLongW")] static extern int GetWindowLong(IntPtr h, int index);

    // Self-test of the live-words box from inside the running helper: shows it, then reports what Windows says about it.
    public static string TestOverlay(string msg)
    {
        try
        {
            ShowOverlay("Amit is listening\nThis is the live words box");
            Thread.Sleep(700);
            OverlayForm f = overlay;
            if (f == null || !f.IsHandleCreated) return "no box window was created";
            string r = "";
            f.Invoke(new Action(delegate
            {
                Rectangle b = f.Bounds;
                int ex = GetWindowLong(f.Handle, -20);
                try { using (Bitmap pngBmp = f.Snapshot()) { pngBmp.Save(Path.Combine(Path.GetDirectoryName(logPath), "whisper_box_test.png"), System.Drawing.Imaging.ImageFormat.Png); } } catch { }
                r = "windowVisible=" + IsWindowVisible(f.Handle) + ";formVisible=" + f.Visible + ";bounds=" + b.X + "," + b.Y + "," + b.Width + "x" + b.Height + ";topmost=" + ((ex & 0x8) != 0);
            }));
            HideOverlayLater(7000);
            return r;
        }
        catch (Exception ex) { return "error: " + ex.Message; }
    }

    static void HideOverlay()
    {
        try { OverlayForm f = overlay; if (f != null && f.IsHandleCreated) f.BeginInvoke(new Action(delegate { f.Hide(); })); } catch { }
    }
    static void HideOverlayLater(int ms)
    {
        long t = Interlocked.Read(ref hideToken);
        System.Threading.Timer tm = null;
        tm = new System.Threading.Timer(delegate { if (Interlocked.Read(ref hideToken) == t) HideOverlay(); if (tm != null) tm.Dispose(); }, null, ms, Timeout.Infinite);
    }

    // =====================================================================================================
    //  Settings, status, log (the bridge's /api/whisper/* calls these)
    // =====================================================================================================
    static void LoadSettings()
    {
        try
        {
            if (!File.Exists(settingsPath)) return;
            foreach (string line in File.ReadAllLines(settingsPath))
            {
                int eq = line.IndexOf('=');
                if (eq < 1) continue;
                string k = line.Substring(0, eq).Trim(), v = line.Substring(eq + 1).Trim();
                if (k == "enabled") enabled = v != "0";
                else if (k == "button" && (v == "right" || v == "middle" || v == "x1" || v == "x2")) button = v;
                else if (k == "holdMs") { int n; if (Int32.TryParse(v, out n) && n >= 150 && n <= 1500) holdMs = n; }
                else if (k == "micOk") micOk = v == "1";
                else if (k == "setupShown") setupShown = v == "1";
                else if (k == "sendEnter") sendEnter = v == "1";
                else if (k == "textOnly") textOnly = v != "0";
                else if (k == "keepReady" && (v == "press" || v == "30s" || v == "5" || v == "10" || v == "30" || v == "never")) keepReady = v;
            }
        }
        catch { }
    }
    static void SaveSettings()
    {
        try { File.WriteAllText(settingsPath, "enabled=" + (enabled ? "1" : "0") + "\r\nbutton=" + button + "\r\nholdMs=" + holdMs + "\r\nmicOk=" + (micOk ? "1" : "0") + "\r\nsetupShown=" + (setupShown ? "1" : "0") + "\r\nsendEnter=" + (sendEnter ? "1" : "0") + "\r\nkeepReady=" + keepReady + "\r\ntextOnly=" + (textOnly ? "1" : "0") + "\r\n"); } catch { }
    }

    // enabledStr "1"/"0" or empty to leave alone; holdStr milliseconds or empty
    public static string Configure(string enabledStr, string holdStr, string buttonStr)
    {
        if (!String.IsNullOrEmpty(enabledStr)) enabled = enabledStr != "0";
        int n;
        if (!String.IsNullOrEmpty(holdStr) && Int32.TryParse(holdStr, out n) && n >= 150 && n <= 1500) holdMs = n;
        if (buttonStr == "right" || buttonStr == "middle" || buttonStr == "x1" || buttonStr == "x2") button = buttonStr;
        SaveSettings();
        if (!enabled) { lock (sync) { if (state == ST_PENDING) { state = ST_IDLE; token++; } } }
        return StatusJson();
    }

    // "1" turns on pressing Enter when the button is let go; "0" turns it off
    public static string SetSendEnter(string v) { sendEnter = v == "1"; SaveSettings(); return StatusJson(); }

    // "1" = only type into a text box (default); "0" = type wherever the focus is
    public static string SetTextOnly(string v) { textOnly = v != "0"; SaveSettings(); return StatusJson(); }

    // Opens the Amit Hub in the person's own default browser (so their existing sign-in is used). The address is fixed here on purpose.
    public static string OpenHub()
    {
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("https://ask-amit.github.io/Amit/Hub/amit-hub.html");
            psi.UseShellExecute = true;
            Process.Start(psi);
            Log("Opened the Amit Hub in the default browser");
            return "{\"ok\":true}";
        }
        catch (Exception ex) { return "{\"error\":\"" + ex.Message.Replace("\"", "'").Replace("\\", "/") + "\"}"; }
    }
    // seconds unused before the listening window is closed (0 = never). "press" = only started when the button is pressed, closed after 2 minutes;
    // "30s" = 30 seconds; "5", "10", "30" = that many minutes.
    static int CloseAfterSeconds()
    {
        if (keepReady == "press") return 120;
        if (keepReady == "never") return 0;
        if (keepReady == "30s") return 30;
        int m; return Int32.TryParse(keepReady, out m) && m > 0 ? m * 60 : 600;
    }

    // "press", "5", "10", "30" or "never"
    public static string SetKeepReady(string v)
    {
        if (v == "press" || v == "30s" || v == "5" || v == "10" || v == "30" || v == "never")
        {
            keepReady = v; SaveSettings();
            lastUse = DateTime.UtcNow;
            // asked to keep it ready: have it ready now
            if (v != "press" && enabled && micOk && HostGone()) ThreadPool.QueueUserWorkItem(delegate { EnsureHost(); });
        }
        return StatusJson();
    }

    public static string StartLearn() { learning = true; return StatusJson(); }
    public static string CancelLearn() { learning = false; return StatusJson(); }

    public static string StatusJson()
    {
        string st;
        lock (sync) { st = state == ST_IDLE ? "idle" : state == ST_PENDING ? "pending" : state == ST_LISTEN ? "listening" : state == ST_FINISH ? "finishing" : "drag"; }
        return "{\"version\":\"" + Version + "\",\"enabled\":" + (enabled ? "true" : "false") + ",\"button\":\"" + button + "\",\"holdMs\":" + holdMs
            + ",\"sendEnter\":" + (sendEnter ? "true" : "false") + ",\"keepReady\":\"" + keepReady + "\",\"textOnly\":" + (textOnly ? "true" : "false") + ",\"hook\":" + (hookOk ? "true" : "false") + ",\"page\":" + (PageAlive() ? "true" : "false") + ",\"micOk\":" + (micOk ? "true" : "false")
            + ",\"learning\":" + (learning ? "true" : "false") + ",\"state\":\"" + st + "\",\"browser\":\"" + browserUsed + "\"}";
    }

    static void Log(string s)
    {
        try
        {
            if (logPath == null) return;
            lock (logPath)
            {
                FileInfo fi = new FileInfo(logPath);
                if (fi.Exists && fi.Length > 200000) File.Delete(logPath);
                File.AppendAllText(logPath, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + s + "\r\n");
            }
        }
        catch { }
    }
}

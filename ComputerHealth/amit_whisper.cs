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
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using System.Windows.Automation;

public static class AmitWhisper
{
    public const string Version = "1.32";   // 1.32: a SHOW AMIT button in the Show Amit editor: saves the shot, hands it to the Amit Live window, which posts it into the person's own Ask Amit chat for today (under their own sign-in; the helper holds no login) and asks Amit to look at it (new bridge routes /api/showamit/pending and /api/showamit/pending.png, offered for 5 minutes, only to the Amit site). 1.31: the Amit Live window closes itself after 60 seconds without the focus (never while music plays; the no-internet page too). ONE Amit Live window only: choosing Ask Amit when its window is already open brings that window to the front instead of opening another (and a second press while the first is still opening starts nothing). 1.30: the Amit Live window opens a quarter of the screen wide and half as tall (never under 480 x 520); its title is "Ask Amit" and it shows the Amit icon in the taskbar; the offline page has the same header. 1.29: no internet: the Amit Live window opens a page served by the helper (it says plainly that Amit could not connect, offers Windows network settings and Try again, rechecks every 15 s, and keeps My Computer and Computer Health working). 1.28: hold the trigger button until the ring opens and let go WITHOUT moving (the pointer is over the Amit icon in the middle) = Ask Amit opens at once, like letting go over any wedge; the ring no longer stays open after a release in the middle. 1.27: the Amit Live window is brought IN FRONT when it opens (it came up behind VS Code): waits for the window, makes it topmost for a moment, gives it the focus. 1.26: the Amit icon in the middle of the Amit Live ring IS the Ask Amit button (no extra wedge): a click on it opens the Amit Live window (tabs Ask Amit, My Computer, My Words, Computer Health) in a small window of its own, under the person's own browser login; a gold halo shows when the pointer is on it. 1.25 (superseded: a fourth wedge was tried and removed). 1.24.2: Amit Live ring: pressing ANY mouse button off the ring closes it (the press is not passed on), and the small grey "Click a choice / Esc closes" line under the ring is gone. 1.24.1: Amit Live ring: hold, slide to a choice, let go to choose (left click still works). 1.24: one plain press of the MIDDLE mouse button (or any button the person picks for the mouse row "voice") starts Voice, like Pause/Break; the press is not passed on while Amit Live is on, so the middle button no longer opens links in a new tab. 1.23: VOICE - a new choice in Amit Live (and the Pause/Break key, or any key the person sets): say what to do instead of typing. Exact match runs it; unclear = a numbered list and the spoken number; commands that ask first wait for yes/no. MY WORDS sync: the person's list (mishearing fixes, shortcuts, voice/key/mouse commands) is kept in the database and mirrored here in my_words.txt, sent down by the Hub (/api/words/sync) and collected back (/api/words/ack). 1.22.1: Save View also saves the whole shot with its layers (picture + .amitshot). 1.22: the format bar shows only while a mark is selected (floats over the picture); with any drawing tool on, a click selects a mark and a drag draws. 1.21: a format bar under the top bar: the selected words get font, size, bold, italic, underline and color; drawings get color and line width; images get a size. 1.20: with the Text tool on, a click on existing words selects them instead of opening a new box. 1.19: marks can be selected after the fact (click), deleted (Delete, Ctrl+Z brings it back) and edited or added to (double-click). 1.18: LAYERS in the Show Amit editor (text, drawing and image layers, each with a name, an on/off tick, who made it and when), saved with the shot in a .amitshot file; Open... brings a shot back with its layers. 1.17: Live Shots lists only the Show Amit windows open right now (saved shots are reached with Open folder). 1.16: the Show Amit windows show Amit's icon in the taskbar instead of the PowerShell icon; the Pictures button/panel is now called Live Shots and closes after one is chosen. 1.15: Show Amit editor has a Pictures button: a panel on the right lists the Show Amit windows open right now (click to bring one to the front) and every picture saved in the Show Amit folder (thumbnails, newest first; click one to open it in the editor). 1.14: Show Amit editor has zoom buttons (-, percent, +, 100%) in its top bar, the same zoom as the wheel. 1.13: Show Amit editor has a Save View button: saves exactly what is on screen now (zoomed part) as its own picture. 1.12: Show Amit editor enlarges the picture smoothly (bicubic) instead of blocky pixels, until 8x. 1.11: in the Show Amit editor the mouse wheel zooms around the pointer and holding the left button and dragging moves the picture (Ctrl+0 resets). 1.10: the Show Amit editor opens in front of the program the person was in (it opened behind VS Code). 1.09: Show Amit picks the area with one window per screen (one window over two different screens did not take the mouse everywhere), and logs what the picker does. 1.08: closing the Show Amit window saves the picture (if not already saved) and puts it on the clipboard. 1.07: the Snapshot choice is renamed Show Amit and built: drag a screen area, an editor opens (title, text, Save, Save As, Open folder).1.06: Amit Live look made flat (no gradients or glow), the choice under the pointer fills solid gold. 1.05: AMIT LIVE - holding the button opens a ring of choices around the pointer; Dictate is one of them. 1.04: while latched, ONE plain press of the button stops dictation (no hold needed)

    // v1.03 (2026-10-29, Ryan): LATCH MODE. Hold the button to start; let go and dictation keeps going, so long dictations do not need the
    // button held. Hold the button again (same hold time) to stop; a quick tap during dictation is still a normal click. Dictation also
    // stops by itself after SilenceStopSeconds with no speech, and after LatchCapSeconds in all. Every finished phrase is also kept in
    // whisper_last_dictation.txt. If nothing could be typed (no text box), the words are held, the person is told to click where they
    // should go (Esc cancels), and the next left click on a text box types them there.
    static volatile bool latchMode = true;
    static volatile bool latched = false;
    const int ST_STOPPEND = 5;
    const int SilenceStopSeconds = 120;
    const int LatchCapSeconds = 900;
    const int PlaceWaitSeconds = 180;
    static DateTime lastSpeech = DateTime.UtcNow;
    static System.Threading.Timer silenceTimer, placeTimer;
    static readonly object holdLock = new object();
    static StringBuilder holdBuf = new StringBuilder();
    static volatile bool placing = false;
    static string placeText = "";
    static DateTime placeStart = DateTime.UtcNow;
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int vKey);

    // v1.05 (2026-10-29, Ryan): AMIT LIVE. Holding the trigger button (the one chosen in the settings) no longer starts dictation straight away.
    // It opens Amit Live: a ring of choices around the pointer. Let go of the button and the ring stays open. Click a choice and the ring
    // goes away and that choice runs ("Dictate" starts exactly the dictation that was here before, already latched: one plain press of the
    // trigger button stops it). Esc closes the ring without choosing, and so does pressing any mouse button while the pointer is off the ring (v1.24.2). Moving off and back without pressing changes nothing. Plus a 90 second safety.
    // While it is open every click is held back from the program underneath, and the Esc key is held back from it too, so closing the ring
    // never interrupts whatever you were working in. "live=0" in whisper_settings.txt turns this off and gives the old hold-to-dictate back.
    const int ST_MENU = 6;
    static volatile bool liveMenu = true;
    static volatile int liveHover = -1;      // which choice the pointer is over (-1 = none)
    static int menuCx, menuCy;               // where the middle of the ring is (moved in from a screen edge if need be)
    static int menuOpenX, menuOpenY;         // where the pointer was when it opened (the text box under it is where words go)
    static volatile bool liveOpen = false, menuReady = false;
    static volatile bool escSwallowUp = false;
    static IntPtr kbdHandle = IntPtr.Zero;
    static System.Threading.Timer menuEscTimer, menuFailTimer, kbdOffTimer;

    // ---------- settings (saved in %LOCALAPPDATA%\AmitComputerHealth\whisper_settings.txt) ----------
    static volatile bool enabled = true;
    static string voiceButton = "middle";    // the button whose single press starts Voice: right | middle | x1 | x2 | "" (none); never the same as the ring button
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
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)] static extern int SetCurrentProcessExplicitAppUserModelID(string appId);
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
        // Windows groups a program's windows under that program's own icon, and this helper is a PowerShell process, so the Show Amit windows showed the
        // PowerShell icon in the taskbar. Giving the process its own identity makes the taskbar use the window's icon (Amit's) instead.
        try { SetCurrentProcessExplicitAppUserModelID("Amit.ShowAmit"); } catch { }
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
        WordsLoad();
        ApplyBindings();
        if (enabled) StartHotkeys();
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
        try { HideMenuUi(); } catch { }
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
            while (GetMessage(out m, IntPtr.Zero, 0, 0) > 0)
            {
                // thread messages from the rest of the helper: the Esc-key hook is only in place while Amit Live is open
                if (m.message == 0x8001) { InstallKbd(); continue; }
                if (m.message == 0x8002) { if (state != ST_MENU) RemoveKbd(); continue; }
                TranslateMessage(ref m); DispatchMessage(ref m);
            }
        }
        catch (Exception ex) { Log("Hook thread error: " + ex.Message); }
        finally
        {
            try { RemoveKbd(); } catch { }
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
                    else if (state == ST_MENU) MenuMove(Marshal.ReadInt32(lParam, 0), Marshal.ReadInt32(lParam, 4));
                }
                else if (msg == 0x201 || msg == 0x202 || msg == 0x204 || msg == 0x205 || msg == 0x207 || msg == 0x208 || msg == 0x20B || msg == 0x20C)
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
        try { HideMenuUi(); } catch { }
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

    static bool IsVoiceDown(int msg, uint md)
    {
        if (voiceButton.Length == 0 || voiceButton == button) return false;
        switch (voiceButton)
        {
            case "right": return msg == 0x204;
            case "middle": return msg == 0x207;
            case "x1": return msg == 0x20B && (md >> 16) == 1;
            case "x2": return msg == 0x20B && (md >> 16) == 2;
        }
        return false;
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

        // Amit Live is open: the ring owns the mouse buttons until a choice is made or Esc is pressed
        if (state == ST_MENU)
        {
            // v1.24.2: any button pressed while the pointer is off the ring closes it (the press and its release are held back from the program underneath)
            if ((msg == 0x201 || msg == 0x204 || msg == 0x207 || msg == 0x20B) && IsOffRing(x, y))
            {
                swallowUpMsg = msg + 1;
                ThreadPool.QueueUserWorkItem(delegate { CloseMenu("a button was pressed away from the ring"); });
                return true;
            }
            if (msg == 0x201)   // left button: a choice is made where the pointer is (a click off the ring does nothing, and is not passed on)
            {
                swallowUpMsg = 0x202;
                int hit = LiveHit(x, y);
                if (hit >= 0) ThreadPool.QueueUserWorkItem(delegate { ChooseLive(hit); });
                else if (hit == -2) ThreadPool.QueueUserWorkItem(delegate { ChooseCenter(); });
                return true;
            }
            if (IsMyDown(msg, md)) { swallowUpMsg = msg + 1; return true; }
            if (IsMyUp(msg, md))
            {
                // v1.22.2: hold, slide to a choice, let go = chosen. Letting go in the middle (or barely moving) leaves the ring open,
                // where a left click on a choice still works.
                int ddx = x - menuOpenX, ddy = y - menuOpenY;
                // v1.28: letting go over the Amit icon in the middle (which is where the pointer is when the ring opens) chooses Ask Amit at once, like letting go over any wedge
                int hitUp = LiveHit(x, y);
                int up = (ddx * ddx + ddy * ddy >= 400) ? hitUp : -1;
                if (hitUp == -2) ThreadPool.QueueUserWorkItem(delegate { ChooseCenter(); });
                else if (up >= 0) ThreadPool.QueueUserWorkItem(delegate { ChooseLive(up); });
                return true;
            }
            return false;
        }

        // a single press of the Voice button: starts Voice (a second press while Voice is listening ends it). The press and its release are not passed on.
        // While the ring is open or Amit is busy dictating, the button behaves normally.
        if (IsVoiceDown(msg, md))
        {
            bool start = false, stop = false; long vt = 0;
            lock (sync)
            {
                if (state == ST_IDLE) start = true;
                else if (state == ST_LISTEN && voiceMode) { state = ST_FINISH; vt = token; stop = true; }
            }
            if (start || stop)
            {
                swallowUpMsg = msg + 1;
                if (start) ThreadPool.QueueUserWorkItem(delegate { StartVoice(); });
                else ThreadPool.QueueUserWorkItem(delegate { EndVoice(vt, ""); });
                return true;
            }
            return false;
        }

        // waiting for the person to click where held words should go: a left click on a text box types them there (the click itself goes through)
        if (msg == 0x201) { if (placing) ThreadPool.QueueUserWorkItem(delegate { PlaceAfterClick(); }); return false; }

        lock (sync)
        {
            if (IsMyDown(msg, md))
            {
                if (state == ST_LISTEN && latched)
                {
                    // latched dictation: one plain press of the button stops it (the press and its release are swallowed so no menu opens)
                    state = ST_FINISH; swallowUpMsg = msg + 1;
                    long ts = token;
                    ThreadPool.QueueUserWorkItem(delegate { EndDictation(ts); });
                    return true;
                }
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
                if (state == ST_LISTEN && latched) return false;
                if (state == ST_LISTEN && latchMode)
                {
                    // the first release: keep listening
                    latched = true; lastSpeech = DateTime.UtcNow;
                    if (capTimer != null) capTimer.Dispose();
                    long tc = token;
                    capTimer = new System.Threading.Timer(delegate { CapReached(tc); }, null, LatchCapSeconds * 1000, Timeout.Infinite);
                    if (silenceTimer != null) silenceTimer.Dispose();
                    silenceTimer = new System.Threading.Timer(delegate { SilenceCheck(); }, null, 10000, 10000);
                    ThreadPool.QueueUserWorkItem(delegate { ShowOverlay("Amit is listening\nKeep talking. Right-click once to stop."); });
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
            if (liveMenu)
            {
                // Amit Live: open the ring around the pointer instead of starting to listen
                state = ST_MENU; x = downX; y = downY;
                menuReady = false; liveHover = -1; menuOpenX = x; menuOpenY = y; lastUse = DateTime.UtcNow;
                ThreadPool.QueueUserWorkItem(delegate { OpenMenu(x, y, t); });
                return;
            }
            state = ST_LISTEN; x = downX; y = downY;
            voiceMode = false;
            latched = false; placing = false; lastSpeech = DateTime.UtcNow;
            if (silenceTimer != null) { silenceTimer.Dispose(); silenceTimer = null; }
            lock (holdLock) { holdBuf.Length = 0; }
            startSent = false; typedAny = false; audioStarted = false; segTyped = 0; lastInterim = ""; endedEvt.Reset();
            correctionOk = false; curTyped = ""; phraseStarted = false; typingAborted = false; fgAtStart = IntPtr.Zero; lastTargetName = ""; modeReady.Reset(); typeModeDecided = false; typeMode = 0; targetChecked = false; abortMsg = "";
            if (capTimer != null) capTimer.Dispose();
            capTimer = new System.Threading.Timer(delegate { CapReached(t); }, null, MaxListenSeconds * 1000, Timeout.Infinite);
        }
        lastUse = DateTime.UtcNow;
        ThreadPool.QueueUserWorkItem(delegate { BeginDictation(x, y, t, true); });
    }

    static void SilenceCheck()
    {
        long t;
        lock (sync)
        {
            if (!(state == ST_LISTEN && latched)) return;
            if ((DateTime.UtcNow - lastSpeech).TotalSeconds < SilenceStopSeconds) return;
            state = ST_FINISH; t = token;
        }
        Log("Stopped listening: no speech for " + SilenceStopSeconds + " seconds");
        ThreadPool.QueueUserWorkItem(delegate { EndDictation(t); });
    }

    // Holding area: nothing someone says is lost. Written to a file as well, so it survives a crash or a cancelled placement.
    static string HoldFilePath() { return Path.Combine(Path.GetDirectoryName(settingsPath), "whisper_last_dictation.txt"); }

    static void PlaceCancel(string why)
    {
        placing = false;
        if (placeTimer != null) { placeTimer.Dispose(); placeTimer = null; }
        ShowOverlay(why + "\nYour words are saved in:\n" + HoldFilePath());
        HideOverlayLater(5000);
    }

    static void PlaceTick()
    {
        if (!placing) return;
        if ((GetAsyncKeyState(0x1B) & 0x8000) != 0) { PlaceCancel("Cancelled."); return; }
        if ((DateTime.UtcNow - placeStart).TotalSeconds > PlaceWaitSeconds) PlaceCancel("Nobody picked a place in time.");
    }

    static void PlaceAfterClick()
    {
        try
        {
            if (!placing) return;
            Thread.Sleep(350);          // let the click land and give the field the focus
            if (!placing) return;
            string what;
            int st = FocusedTextState(out what);
            if (st == 0)
            {
                ShowOverlay("That is not a text box\nClick inside one, or press Esc to cancel.");
                return;
            }
            string text = placeText;
            placing = false;
            if (placeTimer != null) { placeTimer.Dispose(); placeTimer = null; }
            fgAtStart = IntPtr.Zero; typingAborted = false;
            TypeText(text);
            Log("Placed held words (" + text.Length + " characters) into: " + what);
            ShowOverlay("Done\nYour words were typed there.");
            HideOverlayLater(1500);
        }
        catch (Exception ex) { Log("PlaceAfterClick: " + ex.Message); }
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
    static void BeginDictation(int x, int y, long t, bool clickInto)
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
            if (editable && clickInto) InjectLeft();     // from Amit Live the pointer has moved on, so no click: the text box that already has the focus gets the words
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
            // Keep everything that was said (holding area + file). If nothing could be typed because there was no text box, offer to place it.
            string heldAll;
            lock (holdLock)
            {
                string lt = left == null ? "" : left.Trim();
                if (lt.Length > 0 && !holdBuf.ToString().EndsWith(lt)) { if (holdBuf.Length > 0) holdBuf.Append(' '); holdBuf.Append(lt); }
                heldAll = holdBuf.ToString();
            }
            if (heldAll.Trim().Length > 0) { try { File.WriteAllText(HoldFilePath(), heldAll, Encoding.UTF8); } catch { } }
            bool needPlace = typingAborted && !typedAny && heldAll.Trim().Length > 0 && !tooQuick;
            if (needPlace)
            {
                placeText = heldAll; placeStart = DateTime.UtcNow; placing = true;
                if (placeTimer != null) placeTimer.Dispose();
                placeTimer = new System.Threading.Timer(delegate { PlaceTick(); }, null, 100, 100);
                Log("No text box: holding " + heldAll.Length + " characters until a text box is clicked");
                ShowOverlay("Amit heard you, but there is no text box\nClick where you want this, or press Esc to cancel.");
            }
            // Optional: letting go also means "send". Only if words were really typed, and only if the window you were typing in
            // still has focus (never press Enter somewhere else).
            if (sendEnter && typedAny && !tooQuick && ForegroundOk())
            {
                Thread.Sleep(120);   // let the last typed characters land first
                PressEnter();
                Log("Pressed Enter (send on release)");
            }
            startSent = false;
            if (needPlace) { }
            else if (typingAborted && abortMsg.Length > 0 && !typedAny) { ShowOverlay(abortMsg); HideOverlayLater(4500); }
            else if (!tooQuick) { ShowOverlay(typedAny ? (sendEnter ? "Amit heard you\nSending..." : "Amit heard you") : "Amit did not hear anything\nTry again, a little closer to the microphone."); HideOverlayLater(typedAny ? 800 : 1800); }
        }
        catch (Exception ex) { Log("EndDictation: " + ex.Message); }
        finally
        {
            latched = false;
            if (silenceTimer != null) { silenceTimer.Dispose(); silenceTimer = null; }
            lock (sync) { if (token == t && state == ST_FINISH) state = ST_IDLE; }
        }
    }

    static bool SessionActive() { lock (sync) { return (state == ST_LISTEN || state == ST_FINISH || state == ST_STOPPEND) && startSent; } }

    static string ListenHead() { return latched ? "Amit is listening (right-click to stop)" : "Amit is listening"; }

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
                        if (voiceMode) { ShowOverlay(VoiceHelpText()); break; }
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
                        if (voiceMode) { VoiceInterim(text); break; }
                        modeReady.WaitOne(700);   // wait (briefly) until we know what kind of field this is
                        CheckTarget();
                        lock (sync) { lastInterim = text; }
                        if (text.Length > 0) lastSpeech = DateTime.UtcNow;
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
                        if (text.Length > 0) ShowOverlay(ListenHead() + "\n" + Tail(text));
                    }
                    break;
                case "final":
                    if (SessionActive() && text.Length > 0)
                    {
                        if (voiceMode) { VoiceFinal(text); break; }
                        lastSpeech = DateTime.UtcNow;
                        lock (holdLock) { if (holdBuf.Length > 0) holdBuf.Append(' '); holdBuf.Append(text); }
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
                        ShowOverlay(ListenHead() + "\n" + Tail(text));
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
    //  Amit Live (v1.05): the ring of choices around the pointer
    // =====================================================================================================
    class LiveItem
    {
        public string Id, Label, Caption;
        public LiveItem(string id, string label, string caption) { Id = id; Label = label; Caption = caption; }
    }

    // What is in the ring. Fixed for now; later this list comes from each person's own choices, saved under their Hub login
    // (2 choices, 6, 10 - the ring divides itself into however many there are).
    static List<LiveItem> liveItems = DefaultLiveItems();
    static List<LiveItem> DefaultLiveItems()
    {
        List<LiveItem> l = new List<LiveItem>();
        l.Add(new LiveItem("dictate", "Dictate", "Talk to type"));
        l.Add(new LiveItem("showamit", "Show Amit", "Show an area"));
        l.Add(new LiveItem("voice", "Voice", "Say what to do"));
        return l;
    }

    const int LiveHalf = 200;     // half the width of the window (the ring, its glow and the hint line all fit inside)
    const int LiveCenter = 56;    // pointer closer than this to the middle: it is on the Amit icon, which is the Ask Amit button (v1.26)
    const int LiveDead = 66;     // pointer closer than this to the middle: nothing is chosen
    const int LiveInner = 74;     // the ring is drawn from here...
    const int LiveOuter = 160;    // ...to here
    const int LiveReach = 176;    // pointer farther out than this: nothing is chosen
    const int LiveFailSeconds = 90;   // safety: if nobody chooses or presses Esc, it closes by itself
    static readonly Color[] LiveColors = new Color[] {
        Color.FromArgb(232, 190, 70), Color.FromArgb(70, 160, 255), Color.FromArgb(80, 215, 140),
        Color.FromArgb(172, 110, 255), Color.FromArgb(255, 132, 98), Color.FromArgb(60, 208, 210) };
    static readonly Color LiveHot = Color.FromArgb(244, 232, 190, 70);   // the choice under the pointer: Amit gold, solid (the one colour to change if a different highlight is wanted)
    static Bitmap liveIcon;
    static bool liveIconTried = false;

    [StructLayout(LayoutKind.Sequential)] struct SIZE { public int cx, cy; }
    [StructLayout(LayoutKind.Sequential)] struct BLENDFUNCTION { public byte BlendOp, BlendFlags, SourceConstantAlpha, AlphaFormat; }
    [DllImport("user32.dll", SetLastError = true)] static extern bool UpdateLayeredWindow(IntPtr hwnd, IntPtr hdcDst, ref POINT pptDst, ref SIZE psize, IntPtr hdcSrc, ref POINT pprSrc, uint crKey, ref BLENDFUNCTION pblend, uint dwFlags);
    [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr hwnd);
    [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr hwnd, IntPtr dc);
    [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleDC(IntPtr dc);
    [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr dc);
    [DllImport("gdi32.dll")] static extern IntPtr SelectObject(IntPtr dc, IntPtr obj);
    [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr obj);

    // The window that shows the ring: see-through everywhere except the drawing (per-pixel transparency), never takes the focus,
    // never shows a taskbar button, and the mouse passes straight through it (the hook below does the picking).
    class LiveForm : Form
    {
        public LiveForm()
        {
            FormBorderStyle = FormBorderStyle.None; ShowInTaskbar = false; StartPosition = FormStartPosition.Manual;
            Text = "Amit Live"; Size = new Size(LiveHalf * 2, LiveHalf * 2);
        }
        protected override bool ShowWithoutActivation { get { return true; } }
        protected override CreateParams CreateParams
        {
            get { CreateParams cp = base.CreateParams; cp.ExStyle |= 0x00080000 | 0x08000000 | 0x00000080 | 0x00000020 | 0x00000008; return cp; }   // layered, no focus, tool window, click-through, topmost
        }
    }
    static LiveForm liveForm;
    static Thread liveThread;
    static readonly ManualResetEvent liveReady = new ManualResetEvent(false);

    static void EnsureLiveForm()
    {
        EnsureOverlay();   // the live-words box takes the "first window of a hidden process" quirk (see EnsureOverlay) so this one never does
        if (liveThread != null) { liveReady.WaitOne(2000); return; }
        lock (sync)
        {
            if (liveThread != null) return;
            liveThread = new Thread(delegate ()
            {
                try
                {
                    liveForm = new LiveForm();
                    IntPtr h = liveForm.Handle;
                    liveReady.Set();
                    Application.Run();
                }
                catch (Exception ex) { Log("Amit Live window: " + ex.Message); }
            });
            liveThread.IsBackground = true;
            liveThread.SetApartmentState(ApartmentState.STA);
            liveThread.Start();
        }
        liveReady.WaitOne(3000);
    }

    // is this point outside the ring (farther out than the ring reaches)? false while the ring is not yet painted
    static bool IsOffRing(int x, int y)
    {
        if (!menuReady) return false;
        double dx = x - menuCx, dy = y - menuCy;
        return dx * dx + dy * dy > (double)LiveReach * LiveReach;
    }

    // which choice is at this screen point (-1 = none: the middle, off the ring, or no ring open)
    static int LiveHit(int x, int y)
    {
        if (!menuReady) return -1;
        List<LiveItem> items = liveItems;
        int n = items.Count;
        if (n == 0) return -1;
        double dx = x - menuCx, dy = y - menuCy;
        double r = Math.Sqrt(dx * dx + dy * dy);
        if (r < LiveCenter) return -2;      // the Amit icon in the middle (Ask Amit)
        if (r < LiveDead || r > LiveReach) return -1;
        double ang = Math.Atan2(dy, dx) * 180.0 / Math.PI;     // degrees clockwise from 3 o'clock (the screen's y grows downward)
        double w = 360.0 / n;
        double a = (ang + 90.0 + w / 2.0) % 360.0;              // the first choice is centred at the top
        if (a < 0) a += 360.0;
        int i = (int)(a / w);
        return i >= n ? n - 1 : i;
    }

    static GraphicsPath LiveSector(float cx, float cy, float rIn, float rOut, float start, float sweep)
    {
        GraphicsPath p = new GraphicsPath();
        p.AddArc(cx - rOut, cy - rOut, rOut * 2f, rOut * 2f, start, sweep);
        p.AddArc(cx - rIn, cy - rIn, rIn * 2f, rIn * 2f, start + sweep, -sweep);
        p.CloseFigure();
        return p;
    }

    static void DrawGlyph(Graphics g, string id, float cx, float cy, Color col)
    {
        using (Pen p = new Pen(col, 2.2f))
        {
            p.StartCap = LineCap.Round; p.EndCap = LineCap.Round; p.LineJoin = LineJoin.Round;
            if (id == "dictate")           // a microphone
            {
                using (GraphicsPath cap = new GraphicsPath())
                {
                    cap.AddArc(cx - 5f, cy - 13f, 10f, 10f, 180f, 180f);
                    cap.AddArc(cx - 5f, cy - 3f, 10f, 10f, 0f, 180f);
                    cap.CloseFigure();
                    g.DrawPath(p, cap);
                }
                g.DrawArc(p, cx - 9f, cy - 9f, 18f, 16f, 0f, 180f);
                g.DrawLine(p, cx, cy + 7f, cx, cy + 12f);
                g.DrawLine(p, cx - 5f, cy + 12f, cx + 5f, cy + 12f);
            }
            else if (id == "showamit")     // a camera
            {
                g.DrawRectangle(p, cx - 11f, cy - 6f, 22f, 16f);
                g.DrawLine(p, cx - 5f, cy - 6f, cx - 3f, cy - 10f);
                g.DrawLine(p, cx - 3f, cy - 10f, cx + 3f, cy - 10f);
                g.DrawLine(p, cx + 3f, cy - 10f, cx + 5f, cy - 6f);
                g.DrawEllipse(p, cx - 5f, cy - 3f, 10f, 10f);
            }
            else if (id == "voice")        // a speech bubble with a sound wave inside
            {
                g.DrawRectangle(p, cx - 11f, cy - 10f, 22f, 15f);
                g.DrawLine(p, cx - 5f, cy + 5f, cx - 7f, cy + 11f);
                g.DrawLine(p, cx - 7f, cy + 11f, cx + 1f, cy + 5f);
                g.DrawLine(p, cx - 6f, cy - 4f, cx - 6f, cy - 1f);
                g.DrawLine(p, cx - 2f, cy - 7f, cx - 2f, cy + 2f);
                g.DrawLine(p, cx + 2f, cy - 5f, cx + 2f, cy);
                g.DrawLine(p, cx + 6f, cy - 4f, cx + 6f, cy - 1f);
            }
            else g.DrawEllipse(p, cx - 6f, cy - 6f, 12f, 12f);
        }
    }

    static Bitmap LiveIcon()
    {
        if (liveIconTried) return liveIcon;
        liveIconTried = true;
        try { if (iconPath != null && File.Exists(iconPath)) liveIcon = new Bitmap(iconPath); }
        catch (Exception ex) { Log("Amit Live icon not loaded: " + ex.Message); }
        return liveIcon;
    }

    // Windows wants the colours of a see-through picture already multiplied by their opacity
    static void Premultiply(Bitmap bmp)
    {
        Rectangle r = new Rectangle(0, 0, bmp.Width, bmp.Height);
        BitmapData bd = bmp.LockBits(r, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int bytes = Math.Abs(bd.Stride) * bd.Height;
            byte[] buf = new byte[bytes];
            Marshal.Copy(bd.Scan0, buf, 0, bytes);
            for (int i = 0; i + 3 < bytes; i += 4)
            {
                int a = buf[i + 3];
                if (a == 255) continue;
                if (a == 0) { buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; continue; }
                buf[i] = (byte)(buf[i] * a / 255); buf[i + 1] = (byte)(buf[i + 1] * a / 255); buf[i + 2] = (byte)(buf[i + 2] * a / 255);
            }
            Marshal.Copy(buf, 0, bd.Scan0, bytes);
        }
        finally { bmp.UnlockBits(bd); }
    }

    // Draws the whole ring: a dark glass plate, one glowing wedge per choice (the one under the pointer burns brighter), Amit in the middle.
    static Bitmap RenderLive(List<LiveItem> items, int hover, bool premultiply)
    {
        int S = LiveHalf * 2;
        float C = LiveHalf;
        Bitmap bmp = new Bitmap(S, S, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAlias;
            g.Clear(Color.Transparent);
            int n = items.Count;
            float pr = LiveOuter + 10f;
            using (SolidBrush plate = new SolidBrush(Color.FromArgb(170, 9, 11, 18))) g.FillEllipse(plate, C - pr, C - pr, pr * 2f, pr * 2f);
            if (n > 0)
            {
                float w = 360f / n;
                float gap = n > 1 ? 2.4f : 0f;
                for (int i = 0; i < n; i++)
                {
                    Color col = LiveColors[i % LiveColors.Length];
                    bool hot = i == hover;
                    float mid = -90f + i * w;
                    float start = mid - w / 2f + gap / 2f;
                    float sweep = Math.Min(w - gap, 359.5f);
                    double rad = mid * Math.PI / 180.0;
                    // flat, no gradient: every choice is one even, see-through tint; the one under the pointer fills solid with the highlight colour
                    using (GraphicsPath sec = LiveSector(C, C, LiveInner, LiveOuter, start, sweep))
                    {
                        using (SolidBrush fill = new SolidBrush(hot ? LiveHot : Color.FromArgb(92, col))) g.FillPath(fill, sec);
                        using (Pen edge = new Pen(hot ? Color.FromArgb(255, 255, 244, 205) : Color.FromArgb(215, col), hot ? 3f : 1.6f)) g.DrawPath(edge, sec);
                    }
                    float lr = (LiveInner + LiveOuter) / 2f;
                    float lx = C + (float)(Math.Cos(rad) * lr), ly = C + (float)(Math.Sin(rad) * lr);
                    Color tc = hot ? Color.FromArgb(24, 22, 30) : Color.FromArgb(240, 240, 236);
                    DrawGlyph(g, items[i].Id, lx, ly - 17f, hot ? Color.FromArgb(24, 22, 30) : col);
                    using (Font f1 = new Font("Segoe UI Semibold", n > 6 ? 9.5f : 12f))
                    using (Font f2 = new Font("Segoe UI", 8.5f))
                    using (SolidBrush b1 = new SolidBrush(tc))
                    using (SolidBrush b2 = new SolidBrush(Color.FromArgb(hot ? 230 : 170, tc)))
                    using (StringFormat sf = new StringFormat())
                    {
                        sf.Alignment = StringAlignment.Center; sf.LineAlignment = StringAlignment.Center;
                        g.DrawString(items[i].Label, f1, b1, lx, ly + 12f, sf);
                        if (n <= 6 && items[i].Caption.Length > 0) g.DrawString(items[i].Caption, f2, b2, lx, ly + 29f, sf);
                    }
                }
            }
            // Amit in the middle (v1.26: it is the Ask Amit button; a gold halo shows when the pointer is on it)
            if (hover == -2) using (SolidBrush halo = new SolidBrush(LiveHot)) g.FillEllipse(halo, C - 56f, C - 56f, 112f, 112f);
            Bitmap ic = LiveIcon();
            if (ic != null)
            {
                using (GraphicsPath cp = new GraphicsPath())
                {
                    cp.AddEllipse(C - 50f, C - 50f, 100f, 100f);
                    g.SetClip(cp);
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.DrawImage(ic, C - 52f, C - 52f, 104f, 104f);
                    g.ResetClip();
                }
                using (Pen ring = new Pen(Color.FromArgb(235, 212, 175, 55), 3f)) g.DrawEllipse(ring, C - 50f, C - 50f, 100f, 100f);
            }
            else
            {
                using (SolidBrush cd = new SolidBrush(Color.FromArgb(240, 14, 16, 24))) g.FillEllipse(cd, C - 48f, C - 48f, 96f, 96f);
                using (Pen ring = new Pen(Color.FromArgb(235, 212, 175, 55), 3f)) g.DrawEllipse(ring, C - 48f, C - 48f, 96f, 96f);
                using (Font cf = new Font("Segoe UI Semibold", 15f))
                using (SolidBrush cb = new SolidBrush(Color.FromArgb(232, 201, 106)))
                using (StringFormat csf = new StringFormat())
                {
                    csf.Alignment = StringAlignment.Center; csf.LineAlignment = StringAlignment.Center;
                    g.DrawString("Amit", cf, cb, C, C, csf);
                }
            }
        }
        if (premultiply) Premultiply(bmp);
        return bmp;
    }

    static void PaintLayered(IntPtr hwnd, Bitmap bmp, int left, int top)
    {
        IntPtr screenDc = GetDC(IntPtr.Zero);
        IntPtr memDc = CreateCompatibleDC(screenDc);
        IntPtr hBmp = IntPtr.Zero, old = IntPtr.Zero;
        try
        {
            hBmp = bmp.GetHbitmap(Color.FromArgb(0));
            old = SelectObject(memDc, hBmp);
            SIZE sz = new SIZE(); sz.cx = bmp.Width; sz.cy = bmp.Height;
            POINT src = new POINT();
            POINT dst = new POINT(); dst.x = left; dst.y = top;
            BLENDFUNCTION bf = new BLENDFUNCTION(); bf.BlendOp = 0; bf.BlendFlags = 0; bf.SourceConstantAlpha = 255; bf.AlphaFormat = 1;
            UpdateLayeredWindow(hwnd, screenDc, ref dst, ref sz, memDc, ref src, 0, ref bf, 2);
        }
        finally
        {
            if (old != IntPtr.Zero) SelectObject(memDc, old);
            if (hBmp != IntPtr.Zero) DeleteObject(hBmp);
            DeleteDC(memDc);
            ReleaseDC(IntPtr.Zero, screenDc);
        }
    }

    // draw the ring (with this choice lit) at its place; called whenever it opens or the pointer crosses into another choice
    static void ShowLive(int hover)
    {
        LiveForm f = liveForm;
        if (f == null || !f.IsHandleCreated) return;
        List<LiveItem> items = liveItems;
        int cx = menuCx, cy = menuCy;
        f.BeginInvoke(new Action(delegate
        {
            if (!liveOpen) return;
            Bitmap b = RenderLive(items, hover, true);
            try
            {
                IntPtr h = f.Handle;
                if (!IsWindowVisible(h)) ShowWindow(h, 4);   // SW_SHOWNOACTIVATE
                PaintLayered(h, b, cx - LiveHalf, cy - LiveHalf);
                SetWindowPos(h, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010);   // topmost, no move, no resize, no activation
            }
            finally { b.Dispose(); }
        }));
    }

    static void PostKbd(bool on)
    {
        try { if (hookThreadId != 0) PostThreadMessage(hookThreadId, on ? 0x8001u : 0x8002u, IntPtr.Zero, IntPtr.Zero); } catch { }
    }

    static void InstallKbd()
    {
        if (kbdHandle != IntPtr.Zero) return;
        kbdProc = new LowLevelProc(KbdCb);
        kbdHandle = SetWindowsHookEx(13, kbdProc, GetModuleHandle(null), 0);
        if (kbdHandle == IntPtr.Zero) Log("Amit Live: could not watch for Esc (error " + Marshal.GetLastWin32Error() + "); Esc will still close it but the program underneath will see it too");
    }
    static void RemoveKbd()
    {
        if (kbdHandle != IntPtr.Zero) { try { UnhookWindowsHookEx(kbdHandle); } catch { } kbdHandle = IntPtr.Zero; }
    }
    static LowLevelProc kbdProc;

    // Watches ONLY for the Esc key, and ONLY while Amit Live is open: it closes the ring and keeps that Esc from the program underneath
    // (so closing the ring never cancels whatever you were doing in it). Nothing else typed is looked at, kept or sent anywhere.
    static IntPtr KbdCb(int nCode, IntPtr wParam, IntPtr lParam)
    {
        try
        {
            if (nCode >= 0 && Marshal.ReadInt32(lParam, 0) == 0x1B)
            {
                int msg = wParam.ToInt32();
                bool down = msg == 0x100 || msg == 0x104;
                if (down && state == ST_MENU)
                {
                    escSwallowUp = true;
                    ThreadPool.QueueUserWorkItem(delegate { CloseMenu("Esc pressed"); });
                    return (IntPtr)1;
                }
                if (escSwallowUp) { if (!down) escSwallowUp = false; return (IntPtr)1; }   // the key coming back up, or held down and repeating
            }
        }
        catch { }
        return CallNextHookEx(kbdHandle, nCode, wParam, lParam);
    }

    // The ring is opened where the pointer was; near a screen edge it is moved inward so all of it shows.
    static void OpenMenu(int x, int y, long t)
    {
        try
        {
            EnsureLiveForm();
            LiveForm f = liveForm;
            if (f == null || !f.IsHandleCreated)
            {
                Log("Amit Live could not open its window");
                lock (sync) { if (token == t && state == ST_MENU) state = ST_IDLE; }
                return;
            }
            Rectangle wa = Screen.FromPoint(new Point(x, y)).WorkingArea;
            int R = LiveHalf - 14;
            int cx = wa.Width < R * 2 ? wa.Left + wa.Width / 2 : Math.Max(wa.Left + R, Math.Min(wa.Right - R, x));
            int cy = wa.Height < R * 2 ? wa.Top + wa.Height / 2 : Math.Max(wa.Top + R, Math.Min(wa.Bottom - R, y));
            lock (sync) { if (state != ST_MENU || token != t) return; }
            menuCx = cx; menuCy = cy; liveOpen = true; menuReady = true;
            liveHover = LiveHit(x, y);
            PostKbd(true);
            ShowLive(liveHover);
            if (menuEscTimer != null) menuEscTimer.Dispose();
            menuEscTimer = new System.Threading.Timer(delegate { MenuTick(); }, null, 60, 60);
            if (menuFailTimer != null) menuFailTimer.Dispose();
            menuFailTimer = new System.Threading.Timer(delegate { CloseMenu("nobody chose in " + LiveFailSeconds + " seconds"); }, null, LiveFailSeconds * 1000, Timeout.Infinite);
            Log("Amit Live opened at " + cx + "," + cy + " (pointer was at " + x + "," + y + ")");
        }
        catch (Exception ex) { Log("OpenMenu: " + ex.Message); lock (sync) { if (state == ST_MENU) state = ST_IDLE; } HideMenuUi(); }
    }

    // a second way to notice Esc, in case the Esc watcher could not be installed
    static void MenuTick()
    {
        try
        {
            if (state != ST_MENU) return;
            if ((GetAsyncKeyState(0x1B) & 0x8000) != 0) CloseMenu("Esc pressed");
        }
        catch { }
    }

    static void MenuMove(int x, int y)
    {
        if (!menuReady) return;
        int h = LiveHit(x, y);
        if (h == liveHover) return;
        liveHover = h;
        ShowLive(h);
    }

    static void HideMenuUi()
    {
        liveOpen = false; menuReady = false; liveHover = -1;
        try { if (menuEscTimer != null) { menuEscTimer.Dispose(); menuEscTimer = null; } } catch { }
        try { if (menuFailTimer != null) { menuFailTimer.Dispose(); menuFailTimer = null; } } catch { }
        try
        {
            LiveForm f = liveForm;
            if (f != null && f.IsHandleCreated) f.BeginInvoke(new Action(delegate { ShowWindow(f.Handle, 0); }));
        }
        catch { }
        // the Esc watcher stays a moment longer so a held-down Esc (it repeats) does not reach the program underneath, then goes away
        try
        {
            if (hookThreadId != 0)
            {
                if (kbdOffTimer != null) kbdOffTimer.Dispose();
                kbdOffTimer = new System.Threading.Timer(delegate { PostKbd(false); }, null, 1000, Timeout.Infinite);
            }
        }
        catch { }
    }

    static void CloseMenu(string why)
    {
        lock (sync) { if (state != ST_MENU) return; state = ST_IDLE; token++; }
        HideMenuUi();
        Log("Amit Live closed: " + why);
    }

    // a click on a choice: the ring goes away, then that choice runs
    static void ChooseLive(int idx)
    {
        LiveItem it = null;
        List<LiveItem> items = liveItems;
        lock (sync)
        {
            if (state != ST_MENU) return;
            if (idx >= 0 && idx < items.Count) it = items[idx];
            if (it == null) return;
            state = ST_IDLE; token++;
        }
        HideMenuUi();
        Log("Amit Live: chose " + it.Id);
        if (it.Id == "dictate") StartDictationFromMenu(menuOpenX, menuOpenY);
        else if (it.Id == "showamit") StartShowAmit();
        else if (it.Id == "voice") StartVoiceListen(menuOpenX, menuOpenY, 1);
    }

    // v1.26: the Amit icon in the middle of the ring IS Ask Amit: a click on it closes the ring and opens the Amit Live window (Ask Amit tab first)
    static void ChooseCenter()
    {
        lock (sync)
        {
            if (state != ST_MENU) return;
            state = ST_IDLE; token++;
        }
        HideMenuUi();
        Log("Amit Live: chose the Amit icon (Ask Amit)");
        ShowOverlay("Opening Amit's chat"); HideOverlayLater(1500); OpenChatWindow();
    }

    // "Dictate" in Amit Live: the same dictation as before, started already latched (the button is not being held any more),
    // so it keeps listening until one plain press of the trigger button, 120 seconds of silence, or the time limit.
    static void StartDictationFromMenu(int x, int y)
    {
        long t;
        lock (sync)
        {
            if (state != ST_IDLE) return;
            state = ST_LISTEN; t = ++token;
            voiceMode = false;
            latched = true; placing = false; lastSpeech = DateTime.UtcNow;
            if (silenceTimer != null) { silenceTimer.Dispose(); silenceTimer = null; }
            lock (holdLock) { holdBuf.Length = 0; }
            startSent = false; typedAny = false; audioStarted = false; segTyped = 0; lastInterim = ""; endedEvt.Reset();
            correctionOk = false; curTyped = ""; phraseStarted = false; typingAborted = false; fgAtStart = IntPtr.Zero; lastTargetName = ""; modeReady.Reset(); typeModeDecided = false; typeMode = 0; targetChecked = false; abortMsg = "";
            if (capTimer != null) capTimer.Dispose();
            capTimer = new System.Threading.Timer(delegate { CapReached(t); }, null, LatchCapSeconds * 1000, Timeout.Infinite);
            silenceTimer = new System.Threading.Timer(delegate { SilenceCheck(); }, null, 10000, 10000);
        }
        lastUse = DateTime.UtcNow;
        ThreadPool.QueueUserWorkItem(delegate { BeginDictation(x, y, t, false); });
    }

    // =====================================================================================================
    //  Show Amit (v1.07): the person drags an area of the screen, then a small editor opens with that picture:
    //  a title (it becomes the file name), text written on the picture, Save, Save As and Open folder.
    //  Nothing here uses a Windows program (no Snipping Tool): it is plain drawing code.
    // =====================================================================================================
    static volatile bool showAmitBusy = false;
    // Live Shots lists only the Show Amit windows open right now (Ryan, 2026-10-29); the saved files are reached with Open folder. Set true to list the saved shots again.
    static bool liveShotsShowSaved = false;
    // every Show Amit editor window that is open right now (each runs on its own thread), so any of them can list and switch to the others
    static readonly List<ShowAmitForm> openEditors = new List<ShowAmitForm>();
    static readonly object editorsLock = new object();
    static int editorSeq = 0;
    static event Action EditorsChanged;
    static void RaiseEditorsChanged() { Action a = EditorsChanged; if (a != null) { try { a(); } catch { } } }
    static string showAmitFolderOverride = null;     // tests only

    // where pictures are saved unless the person chooses otherwise: Pictures\Show Amit
    static string ShowAmitFolder()
    {
        if (showAmitFolderOverride != null) return showAmitFolderOverride;
        string pics = Environment.GetFolderPath(Environment.SpecialFolder.MyPictures);
        if (string.IsNullOrEmpty(pics)) pics = Path.Combine(Environment.GetEnvironmentVariable("USERPROFILE") ?? Path.GetTempPath(), "Pictures");
        return Path.Combine(pics, "Show Amit");
    }

    // the title the person typed, made safe to use as a file name (no \ / : * ? " < > |, no dots or spaces at the end);
    // with no title it is "Show Amit" and the date and time
    static string SafeFileBase(string title)
    {
        string t = (title ?? "").Trim();
        StringBuilder sb = new StringBuilder();
        char[] bad = Path.GetInvalidFileNameChars();
        foreach (char c in t) sb.Append((c < ' ' || Array.IndexOf(bad, c) >= 0) ? '_' : c);
        t = sb.ToString().Trim().TrimEnd('.', ' ');
        if (t.Length > 80) t = t.Substring(0, 80).TrimEnd('.', ' ');
        if (t.Length == 0) return "Show Amit " + DateTime.Now.ToString("yyyy-MM-dd HH.mm.ss");
        string up = t.ToUpperInvariant();
        string[] reserved = new string[] { "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9" };
        if (Array.IndexOf(reserved, up) >= 0) t = t + "_";
        return t;
    }

    static string UniqueFilePath(string dir, string baseName, string ext)
    {
        string p = Path.Combine(dir, baseName + ext);
        int n = 2;
        while (File.Exists(p)) { p = Path.Combine(dir, baseName + " (" + n + ")" + ext); n++; }
        return p;
    }

    // opens a ".amitshot" file (a shot saved with its layers) in a new editor window
    static void OpenLayeredShot(string file)
    {
        Thread t = new Thread(delegate ()
        {
            try
            {
                Bitmap b; List<ShotLayer> ls; string creator; DateTime at;
                if (!ShowAmitForm.ReadShotFile(file, out b, out ls, out creator, out at)) { Log("Show Amit: not a shot file: " + file); return; }
                string png = Path.ChangeExtension(file, ".png");
                if (!File.Exists(png)) { string jpg = Path.ChangeExtension(file, ".jpg"); if (File.Exists(jpg)) png = jpg; }
                Log("Show Amit: opened shot with " + ls.Count + " layer(s): " + file);
                using (ShowAmitForm ef = new ShowAmitForm(b, ls, creator, at, png)) { Application.Run(ef); }
            }
            catch (Exception ex) { Log("Show Amit: could not open the shot (" + ex.Message + ")"); }
        });
        t.IsBackground = true;
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
    }

    // a click on Show Amit in the ring: take the screen, let the person drag an area, then open the editor
    static void StartShowAmit()
    {
        if (showAmitBusy) return;
        showAmitBusy = true;
        Thread t = new Thread(delegate ()
        {
            Bitmap crop = null;
            try
            {
                Thread.Sleep(220);   // the ring is hidden before this runs; this gives Windows time to take it off the screen
                Rectangle vs = SystemInformation.VirtualScreen;
                Bitmap shot = new Bitmap(vs.Width, vs.Height, PixelFormat.Format24bppRgb);
                using (Graphics g = Graphics.FromImage(shot)) { g.CopyFromScreen(vs.Left, vs.Top, 0, 0, vs.Size, CopyPixelOperation.SourceCopy); }
                // one picker window for each screen (a single window stretched over two screens of different size and scaling
                // did not take the mouse everywhere)
                PickGroup grp = new PickGroup();
                Screen[] scr = Screen.AllScreens;
                Log("Show Amit: " + scr.Length + " screen(s), whole area " + vs.X + "," + vs.Y + " " + vs.Width + "x" + vs.Height);
                foreach (Screen sc in scr)
                {
                    grp.Forms.Add(new PickForm(shot, vs, sc.Bounds, grp));
                    Log("Show Amit: picker for " + sc.DeviceName + " at " + sc.Bounds.X + "," + sc.Bounds.Y + " " + sc.Bounds.Width + "x" + sc.Bounds.Height);
                }
                foreach (PickForm pf in grp.Forms) pf.Show();
                Application.Run(grp.Context);
                crop = grp.Result;
                foreach (PickForm pf in grp.Forms) { try { pf.Dispose(); } catch { } }
                shot.Dispose();
            }
            catch (Exception ex) { Log("Show Amit: could not take the screen (" + ex.Message + ")"); }
            finally { showAmitBusy = false; }
            if (crop == null) { Log("Show Amit: nothing chosen"); return; }
            try
            {
                Log("Show Amit: area " + crop.Width + "x" + crop.Height + ", opening the editor");
                using (ShowAmitForm ef = new ShowAmitForm(crop)) { Application.Run(ef); }
            }
            catch (Exception ex) { Log("Show Amit editor: " + ex.Message); }
        });
        t.IsBackground = true;
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
    }

    // the pickers of all screens belong to one group: the first one to finish (an area dragged, Esc, right-click, time up) closes the rest
    class PickGroup
    {
        public List<PickForm> Forms = new List<PickForm>();
        public ApplicationContext Context = new ApplicationContext();
        public Bitmap Result;
        bool done;
        public void Finish(Bitmap r, string why)
        {
            if (done) { if (r != null) r.Dispose(); return; }
            done = true;
            Result = r;
            Log("Show Amit: picker closed (" + why + ")");
            foreach (PickForm f in Forms) { try { f.Close(); } catch { } }
            Context.ExitThread();
        }
    }

    // covers one screen, showing the picture of it taken a moment ago, dimmed; the dragged area is shown bright
    class PickForm : Form
    {
        readonly Bitmap shot;
        readonly Rectangle vs, area;
        readonly int ox, oy;          // where this screen's part starts inside the picture of all screens
        readonly PickGroup group;
        Point a, b;
        bool drag;
        System.Windows.Forms.Timer limit;

        public PickForm(Bitmap s, Rectangle v, Rectangle ar, PickGroup grp)
        {
            shot = s; vs = v; area = ar; group = grp;
            ox = ar.X - v.X; oy = ar.Y - v.Y;
            FormBorderStyle = FormBorderStyle.None; StartPosition = FormStartPosition.Manual; ShowInTaskbar = false;
            Bounds = ar; TopMost = true; Cursor = Cursors.Cross; DoubleBuffered = true; KeyPreview = true; Text = "Show Amit";
            limit = new System.Windows.Forms.Timer();
            limit.Interval = 120000;   // safety: never leave windows over the screens
            limit.Tick += delegate { limit.Stop(); group.Finish(null, "time up"); };
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            limit.Start();
            Log("Show Amit: picker shown, window " + Bounds.X + "," + Bounds.Y + " " + Bounds.Width + "x" + Bounds.Height);
            if (area.Contains(Control.MousePosition)) FocusWindow(Handle);   // the one under the pointer takes the keyboard (for Esc)
        }

        Rectangle Sel()
        {
            Rectangle r = new Rectangle(Math.Min(a.X, b.X), Math.Min(a.Y, b.Y), Math.Abs(a.X - b.X), Math.Abs(a.Y - b.Y));
            r.Intersect(new Rectangle(0, 0, area.Width, area.Height));
            return r;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.DrawImage(shot, new Rectangle(0, 0, area.Width, area.Height), new Rectangle(ox, oy, area.Width, area.Height), GraphicsUnit.Pixel);
            using (SolidBrush dim = new SolidBrush(Color.FromArgb(120, 0, 0, 0))) g.FillRectangle(dim, new Rectangle(0, 0, area.Width, area.Height));
            string label;
            Rectangle lr;
            if (drag)
            {
                Rectangle r = Sel();
                if (r.Width < 1 || r.Height < 1) return;
                g.DrawImage(shot, r, new Rectangle(r.X + ox, r.Y + oy, r.Width, r.Height), GraphicsUnit.Pixel);
                using (Pen p = new Pen(Color.FromArgb(212, 175, 55), 2f)) g.DrawRectangle(p, r);
                label = r.Width + " x " + r.Height;
                lr = new Rectangle(r.X, r.Y > 30 ? r.Y - 28 : r.Bottom + 4, 110, 24);
            }
            else
            {
                label = "Drag the area to show Amit.   Esc or right-click: cancel";
                lr = new Rectangle((area.Width - 470) / 2, 24, 470, 30);
            }
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(230, 18, 20, 26))) g.FillRectangle(bg, lr);
            using (Font f = new Font("Segoe UI", 10f, FontStyle.Bold))
            using (SolidBrush fg = new SolidBrush(Color.FromArgb(212, 175, 55)))
            {
                StringFormat sf = new StringFormat(); sf.Alignment = StringAlignment.Center; sf.LineAlignment = StringAlignment.Center;
                g.DrawString(label, f, fg, lr, sf);
                sf.Dispose();
            }
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Right) { group.Finish(null, "right-click"); return; }
            if (e.Button != MouseButtons.Left) return;
            Log("Show Amit: drag started at " + e.X + "," + e.Y + " on the screen at " + area.X + "," + area.Y);
            a = e.Location; b = e.Location; drag = true;
            Invalidate();
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            if (!drag) return;
            Rectangle old = Sel();
            b = e.Location;
            Rectangle now = Sel();
            Rectangle u = Rectangle.Union(old, now);
            u.Inflate(60, 60);
            Invalidate(u);
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            if (!drag || e.Button != MouseButtons.Left) return;
            drag = false;
            b = e.Location;
            Rectangle r = Sel();
            if (r.Width >= 6 && r.Height >= 6)
            {
                group.Finish(shot.Clone(new Rectangle(r.X + ox, r.Y + oy, r.Width, r.Height), shot.PixelFormat), "area chosen");
            }
            else Invalidate();   // a plain click, not a drag: keep waiting
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Escape) group.Finish(null, "Esc");
            base.OnKeyDown(e);
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            try { limit.Stop(); limit.Dispose(); } catch { }
            base.OnFormClosed(e);
        }
    }

    // The picture area of the editor: the mouse wheel zooms in or out around the pointer, and holding the left button and dragging
    // moves the picture (left, right, up, down). A plain click (no drag) is passed on as a click, so the Text tool still works.
    class ZoomCanvas : Control
    {
        public Bitmap Img;
        public float Zoom = 1f;
        float offX = 0f, offY = 0f;
        bool pressed, panning;
        Point down, last;
        public Cursor BaseCursor = Cursors.Default;
        public event Action<Point> ClickedAt;
        public event Action ViewChanging;     // just before the view moves or zooms (the editor commits any words being typed)
        public event Action ViewChanged;
        // the layers: painted in the picture's own pixel space (so marks stay sharp when zoomed), set by the editor window
        public Action<Graphics> LayerPainter;
        // the active tool: "move" (the left button drags the picture), "text" and "image" (a click places something), or a drawing
        // tool ("pen", "marker", "line", "arrow", "box", "oval") where the left button draws; Ctrl + drag moves the picture in any tool
        public string Mode = "move";
        bool toolDrag;
        public event Action<PointF> ToolDown;
        public event Action<PointF> ToolMove;
        public event Action<PointF> ToolUp;
        public event Action<Point> DoubleClickedAt;
        public bool Exporting;                    // true while a picture is being made for saving: the selection outline is then left out

        public Point ToScreen(PointF p) { return new Point((int)Math.Round(p.X * Zoom + offX), (int)Math.Round(p.Y * Zoom + offY)); }

        protected override void OnMouseDoubleClick(MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left && DoubleClickedAt != null) DoubleClickedAt(e.Location);
            base.OnMouseDoubleClick(e);
        }

        public bool IsDrawTool()
        {
            return Mode == "pen" || Mode == "marker" || Mode == "line" || Mode == "arrow" || Mode == "box" || Mode == "oval";
        }

        public ZoomCanvas(Bitmap b)
        {
            Img = b;
            DoubleBuffered = true;
            BackColor = Color.FromArgb(44, 46, 54);
        }

        public PointF ToImage(Point p) { return new PointF((p.X - offX) / Zoom, (p.Y - offY) / Zoom); }

        void ClampView()
        {
            float keep = 60f;     // never let the picture be dragged completely out of sight
            float w = Img.Width * Zoom, h = Img.Height * Zoom;
            offX = Math.Max(keep - w, Math.Min(Width - keep, offX));
            offY = Math.Max(keep - h, Math.Min(Height - keep, offY));
        }

        public void ZoomAt(Point p, int wheelDelta)
        {
            float nz = Zoom * (float)Math.Pow(1.2, wheelDelta / 120.0);
            nz = Math.Max(0.1f, Math.Min(16f, nz));
            if (Math.Abs(nz - Zoom) < 0.0001f) return;
            if (ViewChanging != null) ViewChanging();
            // keep the point under the pointer where it is
            offX = p.X - (p.X - offX) * nz / Zoom;
            offY = p.Y - (p.Y - offY) * nz / Zoom;
            Zoom = nz;
            ClampView(); Invalidate();
            if (ViewChanged != null) ViewChanged();
        }

        public void PanBy(int dx, int dy)
        {
            if (ViewChanging != null) ViewChanging();
            offX += dx; offY += dy;
            ClampView(); Invalidate();
            if (ViewChanged != null) ViewChanged();
        }

        public void ResetView()
        {
            if (ViewChanging != null) ViewChanging();
            Zoom = 1f; offX = 0f; offY = 0f;
            Invalidate();
            if (ViewChanged != null) ViewChanged();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.Clear(BackColor);
            DrawPicture(g, offX, offY);
            RectangleF dest = new RectangleF(offX, offY, Img.Width * Zoom, Img.Height * Zoom);
            using (Pen p = new Pen(Color.FromArgb(90, 212, 175, 55), 1f)) g.DrawRectangle(p, dest.X - 1, dest.Y - 1, dest.Width + 1, dest.Height + 1);
        }

        // draws the picture at the current zoom with its top-left corner at (x, y)
        void DrawPicture(Graphics g, float x, float y)
        {
            // Smooth enlarging reads far better than blocky pixels (text stays legible); only at extreme zoom, where each screen pixel
            // is a big square anyway, are the exact pixels shown.
            g.InterpolationMode = Zoom >= 8f ? InterpolationMode.NearestNeighbor : InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.Half;
            RectangleF dest = new RectangleF(x, y, Img.Width * Zoom, Img.Height * Zoom);
            PointF[] corners = new PointF[] { new PointF(dest.Left, dest.Top), new PointF(dest.Right, dest.Top), new PointF(dest.Left, dest.Bottom) };
            using (ImageAttributes ia = new ImageAttributes())
            {
                ia.SetWrapMode(WrapMode.TileFlipXY);   // no faint edge line around the picture while it is smoothed
                g.DrawImage(Img, corners, new RectangleF(0, 0, Img.Width, Img.Height), GraphicsUnit.Pixel, ia);
            }
            if (LayerPainter != null)
            {
                GraphicsState st = g.Save();
                g.TranslateTransform(x, y);
                g.ScaleTransform(Zoom, Zoom);
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAlias;
                try { LayerPainter(g); } catch { }
                g.Restore(st);
            }
        }

        // the part of the picture that is on screen right now, drawn exactly as it looks (same zoom, same place); null if none of it shows
        public Bitmap RenderView()
        {
            RectangleF dest = new RectangleF(offX, offY, Img.Width * Zoom, Img.Height * Zoom);
            RectangleF vis = RectangleF.Intersect(dest, new RectangleF(0, 0, Width, Height));
            int w = (int)Math.Round(vis.Width), h = (int)Math.Round(vis.Height);
            if (w < 1 || h < 1) return null;
            Bitmap bm = new Bitmap(w, h, PixelFormat.Format24bppRgb);
            Exporting = true;
            try { using (Graphics g = Graphics.FromImage(bm)) { DrawPicture(g, offX - vis.X, offY - vis.Y); } }
            finally { Exporting = false; }
            return bm;
        }

        // With a drawing tool on: a DRAG draws (the mark starts once the pointer has moved a few pixels), a plain CLICK is passed on as a
        // click, which selects the mark under it. Otherwise a drag moves the picture and a click is a click.
        bool toolPending;
        Point toolDownPt;

        protected override void OnMouseDown(MouseEventArgs e)
        {
            Focus();     // so keys such as Delete and Esc go to the picture, not to a box the cursor was left in
            if (e.Button != MouseButtons.Left) return;
            if (IsDrawTool() && (Control.ModifierKeys & Keys.Control) == 0)
            {
                toolPending = true; toolDrag = false; toolDownPt = e.Location;
                return;
            }
            pressed = true; panning = false; down = e.Location; last = e.Location;
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            if (toolPending)
            {
                if (!toolDrag)
                {
                    if (Math.Abs(e.X - toolDownPt.X) + Math.Abs(e.Y - toolDownPt.Y) < 5) return;   // still a click
                    toolDrag = true;
                    if (ToolDown != null) ToolDown(ToImage(toolDownPt));
                }
                if (ToolMove != null) ToolMove(ToImage(e.Location));
                return;
            }
            if (!pressed) return;
            if (!panning)
            {
                if (Math.Abs(e.X - down.X) + Math.Abs(e.Y - down.Y) < 5) return;   // still a click
                panning = true; Cursor = Cursors.SizeAll;
            }
            PanBy(e.X - last.X, e.Y - last.Y);
            last = e.Location;
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            if (toolPending && e.Button == MouseButtons.Left)
            {
                bool drew = toolDrag;
                toolPending = false; toolDrag = false;
                if (drew) { if (ToolUp != null) ToolUp(ToImage(e.Location)); }
                else if (ClickedAt != null) ClickedAt(e.Location);
                return;
            }
            if (!pressed || e.Button != MouseButtons.Left) return;
            bool wasPan = panning;
            pressed = false; panning = false; Cursor = BaseCursor;
            if (!wasPan && ClickedAt != null) ClickedAt(e.Location);
        }
    }

    // Sends the mouse wheel to the picture whenever the pointer is over it, whichever box has the keyboard (so the wheel works
    // even while the cursor is in the Title box).
    class WheelFilter : IMessageFilter
    {
        readonly ZoomCanvas canvas;
        readonly Form form;
        public Func<bool> Suppress;                          // true while the wheel belongs to something else (the open font list, the format bar)
        public WheelFilter(ZoomCanvas c, Form f) { canvas = c; form = f; }
        public bool PreFilterMessage(ref Message m)
        {
            if (m.Msg != 0x020A) return false;               // WM_MOUSEWHEEL
            if (Form.ActiveForm != form) return false;
            if (Suppress != null && Suppress()) return false;
            Point p = Control.MousePosition;
            if (!canvas.RectangleToScreen(canvas.ClientRectangle).Contains(p)) return false;
            int delta = (short)((m.WParam.ToInt64() >> 16) & 0xFFFF);
            canvas.ZoomAt(canvas.PointToClient(p), delta);
            return true;
        }
    }

    // ---- layers: the picture stays as it was captured; everything added to it lives in layers on top ----
    // A mark on a layer (a drawn stroke or shape, a piece of text, or an image), in the picture's own pixel space.
    class LayerItem
    {
        public string Kind;                       // pen, marker, line, arrow, box, oval, text, image
        public List<PointF> Pts = new List<PointF>();
        public PointF A, B;
        public Color Col;
        public float W = 4f;
        public string Text;
        public float Size = 18f;                  // text size, in points
        public string FontName = "Segoe UI";      // text look (v1.21)
        public bool Bold = true, Italic, Underline;
        public Bitmap Img;                        // image marks
        public float Scale = 1f;
    }

    // One layer: a name the person chooses ("Is there plumbing here?"), an on/off switch, who made it and who last changed it.
    class ShotLayer
    {
        public string Name, Type;                 // Type: text, draw, image
        public bool Visible = true;
        public string Author, LastBy;
        public DateTime Created, LastAt;
        public List<LayerItem> Items = new List<LayerItem>();
    }

    // the small window that opens with the picture: Title, Text, Save, Save As, Open folder
    class ShowAmitForm : Form
    {
        Bitmap img;
        ZoomCanvas canvas;
        WheelFilter wheel;
        Panel top;
        TextBox title, editor;
        PointF editorImg;         // where, in the picture's own pixels, the words being typed will be drawn
        Label status;
        Button bText, bSave, bSaveView, bSaveAs, bFolder, bZoomOut, bZoomIn, bZoom100;
        Label zoomLbl;
        // layers
        List<ShotLayer> layers = new List<ShotLayer>();
        ShotLayer active;
        Color penColor = Color.FromArgb(229, 57, 53);
        LayerItem draft;                       // the mark being drawn right now
        Bitmap pendingImage;                   // an image waiting to be placed with a click
        string curTool = "move";
        string creator = WhoAmI();             // who made this shot, and when
        DateTime createdAt = DateTime.Now;
        Panel lpanel;
        ListView llist;
        Label layerInfo;
        Button bLayers, bOpenShot, bAmit, bAddText, bAddDraw, bAddImage, bDelLayer, bUp, bDown, bUndo, bColor;
        Dictionary<string, Button> toolBtns = new Dictionary<string, Button>();
        bool lopen, suppressLayerUi;
        int lwidened;
        Panel side;
        ListView list;
        ImageList thumbs;
        Button bPics;
        bool sideOpen, widened, suppressPick;
        public int Seq;                       // which capture this window is (the number in its title bar)
        volatile string displayName = "";     // its name in the "Open now" list (read by the other windows)
        Bitmap thumbCache;                    // a small picture of it for the other windows' lists
        readonly object thumbLock = new object();
        ListViewGroup gOpen, gSaved;
        int loadGen;
        bool textMode, dirty;     // dirty: the picture was changed (words written) since it was last saved
        string lastPath, lastBase, lastViewPath;      // lastViewPath: the file Save View last wrote (the Show Amit button sends it)
        static readonly Font TextFont = new Font("Segoe UI", 18f, FontStyle.Bold);
        static readonly Color Gold = Color.FromArgb(212, 175, 55);
        static readonly Color Dark = Color.FromArgb(18, 20, 26);

        public ShowAmitForm(Bitmap image)
        {
            img = image;
            lock (editorsLock) { Seq = ++editorSeq; }
            Text = "Show Amit #" + Seq; StartPosition = FormStartPosition.CenterScreen; KeyPreview = true; BackColor = Dark;
            try { Icon = new Icon(iconPath); } catch { }

            top = new Panel(); top.Dock = DockStyle.Top; top.Height = 48; top.BackColor = Dark;
            Label lt = new Label(); lt.Text = "Title"; lt.ForeColor = Gold; lt.AutoSize = true; lt.Location = new Point(12, 15); lt.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            title = new TextBox(); title.Location = new Point(54, 11); title.Width = 214; title.Font = new Font("Segoe UI", 10f);
            bText = MakeButton("Text", 280, 58, false);
            bSave = MakeButton("Save", 344, 58, true);
            bSaveView = MakeButton("Save View", 408, 96, false);
            bSaveAs = MakeButton("Save As...", 510, 88, false);
            bFolder = MakeButton("Open folder", 604, 104, false);
            bPics = MakeButton("Live Shots", 718, 96, false);
            bLayers = MakeButton("Layers", 822, 80, false);
            bOpenShot = MakeButton("Open...", 906, 80, false);
            bAmit = MakeButton("Show Amit", 990, 100, true);
            ToolTip tip = new ToolTip();
            tip.SetToolTip(bLayers, "Layers: text, drawings and images on top of the picture, each one can be switched on and off");
            tip.SetToolTip(bOpenShot, "Open a shot you saved earlier, with all its layers");
            tip.SetToolTip(bAmit, "Send this shot to Amit: it is saved, then posted in your own Ask Amit chat for today, and the Amit Live window opens on it. It goes to Amit's team in your chat.");
            tip.SetToolTip(bSaveView, "Save exactly what you see now: the zoomed part, as its own picture");
            tip.SetToolTip(bSave, "Save the whole picture (with any words written on it)");
            top.Controls.Add(lt); top.Controls.Add(title); top.Controls.Add(bText); top.Controls.Add(bSave); top.Controls.Add(bSaveView); top.Controls.Add(bSaveAs); top.Controls.Add(bFolder); top.Controls.Add(bPics); top.Controls.Add(bLayers); top.Controls.Add(bOpenShot); top.Controls.Add(bAmit);

            status = new Label(); status.Dock = DockStyle.Bottom; status.Height = 28; status.ForeColor = Color.FromArgb(220, 220, 220); status.BackColor = Dark;
            status.Font = new Font("Segoe UI", 9.5f); status.TextAlign = ContentAlignment.MiddleLeft; status.AutoEllipsis = true; status.Padding = new Padding(10, 0, 0, 0);
            status.Text = "Title = file name. Mouse wheel zooms, hold the left button and drag to move the picture, Ctrl+0 resets. Text: click it, then click the picture.";

            canvas = new ZoomCanvas(img); canvas.Dock = DockStyle.Fill;
            wheel = new WheelFilter(canvas, this);
            wheel.Suppress = delegate { return (fFont != null && fFont.DroppedDown) || (fbar != null && fbar.Visible && fbar.RectangleToScreen(fbar.ClientRectangle).Contains(Control.MousePosition)); };
            Application.AddMessageFilter(wheel);

            BuildSidePanel();
            BuildLayerPanel();
            BuildFormatBar();
            Controls.Add(canvas); Controls.Add(side); Controls.Add(lpanel); Controls.Add(status); Controls.Add(top);   // the one that fills is added first
            canvas.Controls.Add(fbar);     // the format bar floats over the top (or bottom) of the picture only while a mark is selected, so nothing shifts

            Rectangle wa = Screen.FromPoint(Cursor.Position).WorkingArea;
            int w = Math.Max(1400, Math.Min(img.Width + 4, wa.Width * 85 / 100));
            int h = Math.Max(320, Math.Min(img.Height + 4 + 48 + 28, wa.Height * 85 / 100));
            ClientSize = new Size(w, h);

            // zoom controls at the right end of the bar: the same zoom the wheel does, for anyone without a wheel or who prefers buttons
            bZoomOut = MakeButton("-", w - 262, 34, false);
            zoomLbl = new Label(); zoomLbl.Text = "100%"; zoomLbl.ForeColor = Gold; zoomLbl.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            zoomLbl.TextAlign = ContentAlignment.MiddleCenter; zoomLbl.Location = new Point(w - 224, 9); zoomLbl.Size = new Size(58, 30);
            bZoomIn = MakeButton("+", w - 162, 34, false);
            bZoom100 = MakeButton("100%", w - 122, 54, false);
            bZoomOut.Anchor = bZoomIn.Anchor = bZoom100.Anchor = zoomLbl.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            top.Controls.Add(bZoomOut); top.Controls.Add(zoomLbl); top.Controls.Add(bZoomIn); top.Controls.Add(bZoom100);
            ToolTip ztip = new ToolTip();
            ztip.SetToolTip(bZoomOut, "Zoom out (or turn the mouse wheel back)");
            ztip.SetToolTip(bZoomIn, "Zoom in (or turn the mouse wheel forward)");
            ztip.SetToolTip(bZoom100, "Back to 100% (Ctrl+0)");
            bZoomOut.Click += delegate { canvas.ZoomAt(new Point(canvas.Width / 2, canvas.Height / 2), -120); };
            bZoomIn.Click += delegate { canvas.ZoomAt(new Point(canvas.Width / 2, canvas.Height / 2), 120); };
            bZoom100.Click += delegate { canvas.ResetView(); };

            bText.Click += delegate { SetTool(curTool == "text" ? "move" : "text"); };
            bLayers.Click += delegate { ToggleLayers(); };
            bOpenShot.Click += delegate { DoOpenShot(); };
            canvas.LayerPainter = PaintLayers;
            canvas.DoubleClickedAt += OnCanvasDoubleClick;
            canvas.ToolDown += OnToolDown; canvas.ToolMove += OnToolMove; canvas.ToolUp += OnToolUp;
            bSave.Click += delegate { DoSave(); };
            bAmit.Click += delegate { DoSendToAmit(); };
            bSaveAs.Click += delegate { DoSaveAs(); };
            bFolder.Click += delegate { DoOpenFolder(); };
            bSaveView.Click += delegate { DoSaveView(); };
            canvas.ClickedAt += PicClick;
            canvas.ViewChanging += CommitEditor;       // words being typed are placed before the picture moves or zooms
            canvas.ViewChanged += delegate { int pct = (int)Math.Round(canvas.Zoom * 100); Text = "Show Amit #" + Seq + " - " + pct + "%"; zoomLbl.Text = pct + "%"; PlaceFormatBar(); };
            KeyDown += delegate (object s, KeyEventArgs e)
            {
                if (e.Control && e.KeyCode == Keys.S) { e.SuppressKeyPress = true; DoSave(); }
                else if (e.Control && (e.KeyCode == Keys.D0 || e.KeyCode == Keys.NumPad0)) { e.SuppressKeyPress = true; canvas.ResetView(); }
                else if (e.KeyCode == Keys.Delete && selItem != null && !(ActiveControl is TextBox) && ActiveControl != llist) { e.SuppressKeyPress = true; DeleteSelected(); }
                else if (e.KeyCode == Keys.Escape && selItem != null && !(ActiveControl is TextBox)) { e.SuppressKeyPress = true; ClearSelection(); }
                else if (e.Control && e.KeyCode == Keys.Z && !(ActiveControl is TextBox)) { e.SuppressKeyPress = true; UndoLast(); }
                else if (e.Control && e.KeyCode == Keys.V && !(ActiveControl is TextBox)) { e.SuppressKeyPress = true; PasteImageLayer(); }
            };

            // join the list of open windows so every other window can show this one and switch to it
            title.TextChanged += delegate { UpdateName(); };
            UpdateName(); UpdateThumb();
            lock (editorsLock) { openEditors.Add(this); }
            EditorsChanged += OnEditorsChanged;
            RaiseEditorsChanged();
        }

        // a shot opened from a ".amitshot" file: the original picture with its layers
        public ShowAmitForm(Bitmap image, List<ShotLayer> preLayers, string preCreator, DateTime preCreatedAt, string pngPath) : this(image)
        {
            creator = preCreator; createdAt = preCreatedAt;
            layers.AddRange(preLayers);
            active = layers.Count > 0 ? layers[layers.Count - 1] : null;
            title.Text = Path.GetFileNameWithoutExtension(pngPath);
            lastPath = pngPath; lastBase = BaseName(); dirty = false;
            RefreshLayerList(); UpdateThumb(); RaiseEditorsChanged();
            status.Text = "Opened with " + layers.Count + " layer(s). Shot made by " + creator + " on " + createdAt.ToString("g") + ". Press Layers to see them.";
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                EditorsChanged -= OnEditorsChanged;
                bool was;
                lock (editorsLock) { was = openEditors.Remove(this); }
                if (was) RaiseEditorsChanged();
                lock (thumbLock) { if (thumbCache != null) { thumbCache.Dispose(); thumbCache = null; } }
                if (wheel != null) { try { Application.RemoveMessageFilter(wheel); } catch { } wheel = null; }
            }
            base.Dispose(disposing);
        }

        void UpdateName()
        {
            string t = title.Text.Trim();
            displayName = t.Length > 0 ? t : "Capture " + Seq;
        }

        // a small picture of this window's picture, kept ready for the other windows' lists (made here, on this window's own thread)
        void UpdateThumb()
        {
            Bitmap t;
            using (Bitmap cmp = RenderComposite()) { t = ThumbFrom(cmp); }
            Bitmap old;
            lock (thumbLock) { old = thumbCache; thumbCache = t; }
            if (old != null) old.Dispose();
        }

        public Bitmap ThumbClone()
        {
            lock (thumbLock) { return thumbCache == null ? null : new Bitmap(thumbCache); }
        }

        // another window opened or closed: the list of open windows in this one's panel is rebuilt
        void OnEditorsChanged()
        {
            try { if (IsHandleCreated && !IsDisposed) BeginInvoke(new Action(RefreshList)); } catch { }
        }

        // brings this window to the front (called from another window's thread)
        public void BringFront()
        {
            try
            {
                BeginInvoke(new Action(delegate
                {
                    if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
                    TopMost = true;
                    Activate();
                    FocusWindow(Handle);
                    System.Windows.Forms.Timer tm = new System.Windows.Forms.Timer();
                    tm.Interval = 400;
                    tm.Tick += delegate { tm.Stop(); tm.Dispose(); TopMost = false; };
                    tm.Start();
                }));
            }
            catch { }
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            // it must come up IN FRONT of the program the person was in (measured: it opened behind VS Code). Being topmost for a
            // moment puts it above every other window; then it is let down to a normal window that stays in front because it is active.
            TopMost = true;
            Activate();
            FocusWindow(Handle);
            title.Focus();
            System.Windows.Forms.Timer tm = new System.Windows.Forms.Timer();
            tm.Interval = 600;
            tm.Tick += delegate
            {
                tm.Stop(); tm.Dispose();
                if (GetForegroundWindow() != Handle) FocusWindow(Handle);
                TopMost = false;
                Log("Show Amit: editor in front = " + (GetForegroundWindow() == Handle));
            };
            tm.Start();
        }

        // tests set this so a test run never touches the person's clipboard
        public static bool SkipClipboard;

        // puts a copy of the picture on the clipboard (stays after this window is gone); false if it could not
        bool CopyToClipboard(Bitmap src)
        {
            if (SkipClipboard) return false;
            try
            {
                using (Bitmap copy = new Bitmap(src))
                    Clipboard.SetDataObject(new DataObject(DataFormats.Bitmap, copy), true, 5, 100);
                return true;
            }
            catch (Exception ex) { Log("Show Amit: could not put the picture on the clipboard (" + ex.Message + ")"); return false; }
        }

        // Closing is an auto-save: the picture is saved if it is not already saved as it stands now, and it is put on the clipboard
        // so Ctrl+V pastes it anywhere.
        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            try
            {
                CommitEditor();
                if (NeedsSave()) { DoSave(); Log("Show Amit: saved on close"); }
                using (Bitmap cb = RenderComposite())
                    Clipboard.SetDataObject(new DataObject(DataFormats.Bitmap, cb), true);   // true: stays on the clipboard after this window is gone
                Log("Show Amit: picture put on the clipboard");
            }
            catch (Exception ex) { Log("Show Amit: close save/clipboard problem (" + ex.Message + ")"); }
            base.OnFormClosing(e);
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            try { if (img != null) img.Dispose(); } catch { }
            base.OnFormClosed(e);
        }

        Button MakeButton(string text, int x, int w, bool main)
        {
            Button b = new Button();
            b.Text = text; b.Location = new Point(x, 9); b.Size = new Size(w, 30);
            b.FlatStyle = FlatStyle.Flat; b.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold); b.Cursor = Cursors.Hand;
            b.FlatAppearance.BorderColor = Gold;
            b.BackColor = main ? Gold : Color.FromArgb(40, 43, 52);
            b.ForeColor = main ? Dark : Color.White;
            return b;
        }

        // ---- selecting marks after the fact (v1.19): one click selects, Delete removes, a double-click edits / adds to it ----
        LayerItem editingItem;
        LayerItem selItemField;
        // the selected mark; whenever it changes, the format bar shows (and can change) that mark's look
        LayerItem selItem { get { return selItemField; } set { selItemField = value; SyncFormat(); } }
        string defFont = "Segoe UI"; float defSize = 18f; bool defBold = true, defItalic, defUnderline;   // the look of the next new words
        ShotLayer selLayer;
        LayerItem delItem; ShotLayer delLayer; int delIndex;     // the last mark deleted, so Ctrl+Z can bring it back

        static float DistToSeg(PointF p, PointF a, PointF b)
        {
            float dx = b.X - a.X, dy = b.Y - a.Y;
            float l2 = dx * dx + dy * dy;
            float t = l2 < 0.0001f ? 0f : ((p.X - a.X) * dx + (p.Y - a.Y) * dy) / l2;
            t = Math.Max(0f, Math.Min(1f, t));
            float ex = p.X - (a.X + t * dx), ey = p.Y - (a.Y + t * dy);
            return (float)Math.Sqrt(ex * ex + ey * ey);
        }

        // the rectangle around a mark (where the selection outline is drawn and where a text or image mark is hit)
        static RectangleF ItemBounds(LayerItem it)
        {
            float inf = Math.Max(2f, it.W);
            switch (it.Kind)
            {
                case "pen":
                case "marker":
                    {
                        if (it.Pts.Count == 0) return new RectangleF(it.A.X, it.A.Y, 1f, 1f);
                        float x0 = float.MaxValue, y0 = float.MaxValue, x1 = float.MinValue, y1 = float.MinValue;
                        foreach (PointF p in it.Pts) { x0 = Math.Min(x0, p.X); y0 = Math.Min(y0, p.Y); x1 = Math.Max(x1, p.X); y1 = Math.Max(y1, p.Y); }
                        float pad = (it.Kind == "marker" ? Math.Max(it.W * 4f, 16f) : it.W) / 2f;
                        return new RectangleF(x0 - pad, y0 - pad, x1 - x0 + 2f * pad, y1 - y0 + 2f * pad);
                    }
                case "line":
                case "arrow":
                    { RectangleF r = NormRect(it.A, it.B); r.Inflate(inf, inf); return r; }
                case "box":
                case "oval":
                    { RectangleF r = NormRect(it.A, it.B); r.Inflate(inf / 2f, inf / 2f); return r; }
                case "text":
                    using (Bitmap bm = new Bitmap(1, 1))
                    using (Graphics g = Graphics.FromImage(bm))
                    using (Font f = MakeTextFont(it, 1f))
                    {
                        SizeF s = g.MeasureString(it.Text ?? "", f, 100000, StringFormat.GenericTypographic);
                        return new RectangleF(it.A.X, it.A.Y, Math.Max(s.Width, 8f), Math.Max(s.Height, 8f));
                    }
                case "image":
                    if (it.Img != null) return new RectangleF(it.A.X, it.A.Y, it.Img.Width * it.Scale, it.Img.Height * it.Scale);
                    break;
            }
            return new RectangleF(it.A.X, it.A.Y, 1f, 1f);
        }

        // is this point on the mark (lines and outlines are hit near the line, so a big box does not hide what is inside it)
        static bool HitItem(LayerItem it, PointF p, float tol)
        {
            float half = (it.Kind == "marker" ? Math.Max(it.W * 4f, 16f) : it.W) / 2f;
            float lim = tol + half;
            switch (it.Kind)
            {
                case "pen":
                case "marker":
                    if (it.Pts.Count == 1) return DistToSeg(p, it.Pts[0], it.Pts[0]) <= lim;
                    for (int i = 1; i < it.Pts.Count; i++) if (DistToSeg(p, it.Pts[i - 1], it.Pts[i]) <= lim) return true;
                    return false;
                case "line":
                case "arrow":
                    return DistToSeg(p, it.A, it.B) <= lim;
                case "box":
                    {
                        RectangleF r = NormRect(it.A, it.B);
                        PointF a = new PointF(r.Left, r.Top), b = new PointF(r.Right, r.Top), c = new PointF(r.Right, r.Bottom), d = new PointF(r.Left, r.Bottom);
                        return DistToSeg(p, a, b) <= lim || DistToSeg(p, b, c) <= lim || DistToSeg(p, c, d) <= lim || DistToSeg(p, d, a) <= lim;
                    }
                case "oval":
                    {
                        RectangleF r = NormRect(it.A, it.B);
                        float rx = r.Width / 2f, ry = r.Height / 2f;
                        if (rx < 1f || ry < 1f) return false;
                        float nx = (p.X - (r.Left + rx)) / rx, ny = (p.Y - (r.Top + ry)) / ry;
                        float dist = (float)Math.Sqrt(nx * nx + ny * ny);
                        return Math.Abs(dist - 1f) * Math.Min(rx, ry) <= lim;
                    }
                default:
                    {
                        RectangleF r = ItemBounds(it);
                        r.Inflate(tol, tol);
                        return r.Contains(p);
                    }
            }
        }

        // the top-most visible mark at this point of the picture
        LayerItem FindMarkAt(PointF p, out ShotLayer layer)
        {
            float tol = 7f / canvas.Zoom;
            for (int i = layers.Count - 1; i >= 0; i--)
            {
                ShotLayer L = layers[i];
                if (!L.Visible) continue;
                for (int j = L.Items.Count - 1; j >= 0; j--)
                    if (HitItem(L.Items[j], p, tol)) { layer = L; return L.Items[j]; }
            }
            layer = null;
            return null;
        }

        ShotLayer LayerOf(LayerItem it)
        {
            foreach (ShotLayer L in layers) if (L.Items.Contains(it)) return L;
            return null;
        }

        static string KindWord(LayerItem it)
        {
            switch (it.Kind)
            {
                case "text": return "text";
                case "image": return "image";
                case "pen": return "pen stroke";
                case "marker": return "marker stroke";
                default: return it.Kind;
            }
        }

        void SetSelection(LayerItem it, ShotLayer L)
        {
            selItem = it; selLayer = L;
            if (L != null && active != L) { active = L; RefreshLayerList(); }
            canvas.Invalidate();
            if (it != null) status.Text = "Selected a " + KindWord(it) + " on \"" + L.Name + "\". Delete removes it. Double-click to edit or add to it. Esc unselects.";
        }

        void ClearSelection()
        {
            if (selItem == null) return;
            selItem = null; selLayer = null;
            canvas.Invalidate();
        }

        void SelectAtImage(PointF p)
        {
            ShotLayer L; LayerItem it = FindMarkAt(p, out L);
            if (it == null) { ClearSelection(); return; }
            SetSelection(it, L);
        }

        void DeleteSelected()
        {
            if (selItem == null || selLayer == null) return;
            ShotLayer L = selLayer;
            delItem = selItem; delLayer = L; delIndex = L.Items.IndexOf(selItem);
            L.Items.Remove(selItem);
            selItem = null; selLayer = null;
            Touch(L);
            canvas.Invalidate(); ShowLayerInfo();
            UpdateThumb(); RaiseEditorsChanged();
            status.Text = "Deleted the mark from \"" + L.Name + "\". Ctrl+Z brings it back.";
        }

        // double-click a mark: words are edited in place; a drawing makes its layer and tool active so more can be added; an image just stays selected
        void OnCanvasDoubleClick(Point at)
        {
            if (curTool == "image") return;
            ShotLayer L; LayerItem it = FindMarkAt(canvas.ToImage(at), out L);
            if (it == null) return;
            SetSelection(it, L);
            if (it.Kind == "text") { StartEditText(it); return; }
            if (it.Kind == "image") { status.Text = "Image selected. Delete removes it. Use + Image to add another."; return; }
            SetTool(it.Kind);
            status.Text = "Adding to \"" + L.Name + "\": drag on the picture to add another " + it.Kind + ". The Move tool goes back to selecting.";
        }

        void StartEditText(LayerItem it)
        {
            CommitEditor();
            Point scr = canvas.ToScreen(it.A);
            OpenTextEditor(new Point(scr.X - 3, scr.Y - 3), it.Text, it);
        }

        // a plain click on the picture (a drag moves the picture instead): with Move on, it selects the mark under the pointer; with Text on, a
        // box for the words opens there; with an image waiting, the image is placed there
        void PicClick(Point at)
        {
            if (curTool == "image") { PlacePendingImage(at); return; }
            if (curTool == "move" || canvas.IsDrawTool()) { SelectAtImage(canvas.ToImage(at)); return; }   // a click selects, in every tool (a drag draws or moves)
            if (!textMode) return;
            // with Text on, a click ON existing words (or any other mark) selects it instead of opening a new box; a click on empty space starts new words
            { ShotLayer hl; LayerItem hit = FindMarkAt(canvas.ToImage(at), out hl); if (hit != null) { CommitEditor(); SetSelection(hit, hl); return; } }
            CommitEditor();
            OpenTextEditor(at, "", null);
        }

        // the box the words are typed in: as big as the words will be on screen at the current zoom, so what is typed looks like what is drawn
        void OpenTextEditor(Point at, string prefill, LayerItem editing)
        {
            TextBox tb = new TextBox();
            // the box looks like the words will: the mark's own font (or the look of the next new words), as big as it will be on screen at this zoom
            LayerItem proto = editing;
            if (proto == null) { proto = new LayerItem(); proto.FontName = defFont; proto.Size = defSize; proto.Bold = defBold; proto.Italic = defItalic; proto.Underline = defUnderline; proto.Col = penColor; }
            float escale = Math.Max(6f / proto.Size, Math.Min(120f / proto.Size, canvas.Zoom));
            tb.Font = MakeTextFont(proto, escale);
            tb.ForeColor = proto.Col; tb.BackColor = Color.FromArgb(255, 255, 238);
            tb.BorderStyle = BorderStyle.FixedSingle;
            tb.Width = Math.Max(140, Math.Min(460, canvas.Width - at.X - 2));
            tb.Location = at;
            tb.Text = prefill ?? "";
            editingItem = editing;
            editorImg = canvas.ToImage(at);
            tb.KeyDown += delegate (object s2, KeyEventArgs k)
            {
                if (k.KeyCode == Keys.Enter) { k.SuppressKeyPress = true; CommitEditor(); }
                else if (k.KeyCode == Keys.Escape) { k.SuppressKeyPress = true; DiscardEditor(); }
            };
            tb.Leave += delegate { CommitEditor(); };
            editor = tb;
            canvas.Controls.Add(tb);
            tb.Focus();
            if (editing != null) tb.SelectAll();
        }

        void DiscardEditor()
        {
            TextBox tb = editor;
            if (tb == null) return;
            editor = null; editingItem = null;
            canvas.Controls.Remove(tb); tb.Dispose();
        }

        void CommitEditor()
        {
            TextBox tb = editor;
            if (tb == null) return;
            editor = null;
            LayerItem ed = editingItem; editingItem = null;
            string t = tb.Text;
            canvas.Controls.Remove(tb); tb.Dispose();
            if (ed != null)
            {
                // an existing text mark was edited: its words change in place (empty words remove the mark)
                ShotLayer L = LayerOf(ed);
                if (L == null) return;
                if (t.Trim().Length == 0) { L.Items.Remove(ed); if (selItem == ed) { selItem = null; selLayer = null; } }
                else ed.Text = t;
                Touch(L);
                canvas.Invalidate(); ShowLayerInfo();
                UpdateThumb(); RaiseEditorsChanged();
                return;
            }
            if (t.Trim().Length == 0) return;
            DrawText(t, editorImg.X + 3f / canvas.Zoom, editorImg.Y + 3f / canvas.Zoom);   // the box's own 3-pixel margin, in picture pixels
            canvas.Invalidate();
        }

        // words typed on the picture go on the active TEXT layer (a new text layer is made if there is none), not into the picture itself
        public void DrawText(string t, float x, float y)
        {
            EnsureActive("text");
            LayerItem it = new LayerItem();
            it.Kind = "text"; it.Text = t; it.A = new PointF(x, y); it.Col = penColor; it.Size = defSize; it.FontName = defFont; it.Bold = defBold; it.Italic = defItalic; it.Underline = defUnderline;
            AddItem(it);
        }

        string BaseName() { return SafeFileBase(title.Text); }

        // the picture file holds the picture WITH the layers that are switched on; the ".amitshot" file next to it keeps the original
        // picture and every layer, so the shot can be opened again with all its layers
        void SaveImage(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            using (Bitmap c = RenderComposite())
            {
                if (ext == ".jpg" || ext == ".jpeg") c.Save(path, ImageFormat.Jpeg);
                else c.Save(path, ImageFormat.Png);
            }
            string side2 = Path.ChangeExtension(path, ".amitshot");
            if (layers.Count > 0) WriteShotFile(side2, img, layers, creator, createdAt);
            else { try { if (File.Exists(side2)) File.Delete(side2); } catch { } }
        }

        public void SetTitle(string t) { title.Text = t; }
        public void TestView(Point zoomAt, int wheelClicks, int panX, int panY)    // tests only
        {
            canvas.ZoomAt(zoomAt, wheelClicks * 120);
            if (panX != 0 || panY != 0) canvas.PanBy(panX, panY);
        }
        public float ZoomNow { get { return canvas.Zoom; } }
        public string StatusText { get { return status.Text; } }

        // Save: into Pictures\Show Amit, named after the title; saving again with the same title replaces that file
        public void DoSave()
        {
            CommitEditor();
            try
            {
                string dir = ShowAmitFolder();
                Directory.CreateDirectory(dir);
                string b = BaseName();
                string path = (lastPath != null && lastBase == b) ? lastPath : UniqueFilePath(dir, b, ".png");
                SaveImage(path);
                lastPath = path; lastBase = b; dirty = false; RefreshListSoon();
                bool onClip;
                using (Bitmap cb = RenderComposite()) onClip = CopyToClipboard(cb);
                status.Text = "Saved: " + path + (onClip ? "  |  on the clipboard (Ctrl+V)" : "");
                Log("Show Amit: saved " + path);
            }
            catch (Exception ex) { status.Text = "Could not save: " + ex.Message; Log("Show Amit: could not save (" + ex.Message + ")"); }
        }

        // ================================================================================================
        //  Layers (v1.18)
        // ================================================================================================
        // v1.32: the Show Amit button: save the shot, hand it to the Amit Live window (which posts it into the person's Ask Amit chat for today), and say so
        void DoSendToAmit()
        {
            try
            {
                lastViewPath = null;
                DoSaveView();     // the same save as the Save View button: exactly what is on screen, named after the title; the whole shot with its layers is saved too
                if (lastViewPath == null || !File.Exists(lastViewPath)) { status.Text = "Could not save the picture to send. Look at the message above, then try again."; return; }
                StringBuilder tx = new StringBuilder();
                foreach (ShotLayer L in layers)
                {
                    if (!L.Visible) continue;
                    foreach (LayerItem it in L.Items)
                        if (it.Kind == "text" && !String.IsNullOrEmpty(it.Text)) { if (tx.Length > 0) tx.Append(" | "); tx.Append(it.Text.Replace("\r", " ").Replace("\n", " ")); }
                }
                string res = SendShotToAmit(lastViewPath, title.Text, tx.ToString());
                status.Text = res.IndexOf("\"ok\":true") >= 0 ? "Sent to Amit. The Amit Live window is opening on your Ask Amit chat for today. It goes to Amit's team in your own chat." : "Could not send to Amit: " + res;
            }
            catch (Exception ex) { status.Text = "Could not send to Amit: " + ex.Message; Log("Show Amit send: " + ex.Message); }
        }

        static string WhoAmI()
        {
            try { return Environment.UserName; } catch { return "unknown"; }
        }

        static RectangleF NormRect(PointF a, PointF b)
        {
            return new RectangleF(Math.Min(a.X, b.X), Math.Min(a.Y, b.Y), Math.Abs(a.X - b.X), Math.Abs(a.Y - b.Y));
        }

        static Pen MakePen(LayerItem it)
        {
            bool marker = it.Kind == "marker";
            Color c = marker ? Color.FromArgb(110, it.Col) : it.Col;
            Pen p = new Pen(c, marker ? Math.Max(it.W * 4f, 16f) : it.W);
            p.StartCap = LineCap.Round; p.EndCap = LineCap.Round; p.LineJoin = LineJoin.Round;
            return p;
        }

        // draws one mark (in the picture's pixel space: the caller has set the zoom/placement)
        static void DrawItem(Graphics g, LayerItem it)
        {
            switch (it.Kind)
            {
                case "pen":
                case "marker":
                    using (Pen p = MakePen(it))
                    {
                        if (it.Pts.Count >= 2) g.DrawLines(p, it.Pts.ToArray());
                        else if (it.Pts.Count == 1)
                        {
                            float r = p.Width / 2f;
                            using (SolidBrush b = new SolidBrush(p.Color)) g.FillEllipse(b, it.Pts[0].X - r, it.Pts[0].Y - r, p.Width, p.Width);
                        }
                    }
                    break;
                case "line":
                    using (Pen p = MakePen(it)) g.DrawLine(p, it.A, it.B);
                    break;
                case "arrow":
                    using (Pen p = MakePen(it))
                    {
                        float ang = (float)Math.Atan2(it.B.Y - it.A.Y, it.B.X - it.A.X);
                        float hl = Math.Max(14f, it.W * 4.5f);
                        PointF h1 = new PointF(it.B.X - hl * (float)Math.Cos(ang - 0.5), it.B.Y - hl * (float)Math.Sin(ang - 0.5));
                        PointF h2 = new PointF(it.B.X - hl * (float)Math.Cos(ang + 0.5), it.B.Y - hl * (float)Math.Sin(ang + 0.5));
                        g.DrawLine(p, it.A, it.B); g.DrawLine(p, it.B, h1); g.DrawLine(p, it.B, h2);
                    }
                    break;
                case "box":
                    using (Pen p = MakePen(it))
                    {
                        RectangleF r = NormRect(it.A, it.B);
                        p.LineJoin = LineJoin.Miter;
                        g.DrawRectangle(p, r.X, r.Y, r.Width, r.Height);
                    }
                    break;
                case "oval":
                    using (Pen p = MakePen(it))
                    {
                        RectangleF r = NormRect(it.A, it.B);
                        if (r.Width > 0 && r.Height > 0) g.DrawEllipse(p, r);
                    }
                    break;
                case "text":
                    DrawTextMark(g, it);
                    break;
                case "image":
                    if (it.Img != null) g.DrawImage(it.Img, it.A.X, it.A.Y, it.Img.Width * it.Scale, it.Img.Height * it.Scale);
                    break;
            }
        }

        // words in the mark's color with a thin white edge so they can be read on a dark or a light picture
        static void DrawTextMark(Graphics g, LayerItem it)
        {
            if (string.IsNullOrEmpty(it.Text)) return;
            using (Font f = MakeTextFont(it, 1f))
            {
                StringFormat sf = StringFormat.GenericTypographic;
                float x = it.A.X, y = it.A.Y;
                using (SolidBrush w = new SolidBrush(Color.White))
                {
                    g.DrawString(it.Text, f, w, x - 1, y, sf); g.DrawString(it.Text, f, w, x + 1, y, sf);
                    g.DrawString(it.Text, f, w, x, y - 1, sf); g.DrawString(it.Text, f, w, x, y + 1, sf);
                }
                using (SolidBrush c = new SolidBrush(it.Col)) g.DrawString(it.Text, f, c, x, y, sf);
            }
        }

        // every layer that is switched on, bottom to top (and the mark being drawn right now, if any)
        void PaintLayers(Graphics g)
        {
            foreach (ShotLayer L in layers)
            {
                if (!L.Visible) continue;
                foreach (LayerItem it in L.Items) DrawItem(g, it);
            }
            if (draft != null) DrawItem(g, draft);
            // the selected mark gets a dashed gold outline (only on screen: never in a saved picture)
            if (selItem != null && selLayer != null && selLayer.Visible && !canvas.Exporting)
            {
                float z = canvas.Zoom;
                using (Pen sp = new Pen(Color.FromArgb(212, 175, 55), 2f / z))
                {
                    sp.DashStyle = DashStyle.Dash;
                    RectangleF b = ItemBounds(selItem);
                    b.Inflate(3f / z, 3f / z);
                    g.DrawRectangle(sp, b.X, b.Y, b.Width, b.Height);
                }
            }
        }

        // the picture with the layers that are switched on drawn into it, at its own size: what Save, Save As, the clipboard and Live Shots use
        public Bitmap RenderComposite()
        {
            Bitmap c = new Bitmap(img.Width, img.Height, PixelFormat.Format24bppRgb);
            using (Graphics g = Graphics.FromImage(c))
            {
                g.DrawImage(img, 0, 0, img.Width, img.Height);
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAlias;
                foreach (ShotLayer L in layers)
                {
                    if (!L.Visible) continue;
                    foreach (LayerItem it in L.Items) DrawItem(g, it);
                }
            }
            return c;
        }

        void Touch(ShotLayer L)
        {
            L.LastBy = WhoAmI(); L.LastAt = DateTime.Now;
            dirty = true;
        }

        ShotLayer NewLayer(string type)
        {
            ShotLayer L = new ShotLayer();
            L.Type = type;
            int n = 1;
            foreach (ShotLayer o in layers) if (o.Type == type) n++;
            L.Name = (type == "text" ? "Text" : type == "draw" ? "Drawing" : "Image") + " " + n;
            L.Author = WhoAmI(); L.LastBy = L.Author;
            L.Created = DateTime.Now; L.LastAt = L.Created;
            layers.Add(L);
            active = L;
            RefreshLayerList();
            return L;
        }

        // the active layer has to be of the kind the tool makes: otherwise the top layer of that kind is used, or a new one is made
        void EnsureActive(string type)
        {
            if (active != null && active.Type == type) return;
            for (int i = layers.Count - 1; i >= 0; i--)
                if (layers[i].Type == type) { active = layers[i]; RefreshLayerList(); return; }
            NewLayer(type);
        }

        void AddItem(LayerItem it)
        {
            ShotLayer L = active;
            if (L == null) return;
            delItem = null; delLayer = null;     // a new mark: the "bring back" of an earlier deletion no longer applies
            L.Items.Add(it);
            Touch(L);
            canvas.Invalidate();
            ShowLayerInfo();
            UpdateThumb(); RaiseEditorsChanged();   // the other windows' lists show the picture as it is now
        }

        float PenWidth() { return Math.Max(3f, Math.Max(img.Width, img.Height) / 350f); }

        void UndoLast()
        {
            // a mark that was just deleted comes back first
            if (delItem != null && delLayer != null && layers.Contains(delLayer))
            {
                ShotLayer L0 = delLayer;
                L0.Items.Insert(Math.Max(0, Math.Min(delIndex, L0.Items.Count)), delItem);
                delItem = null; delLayer = null;
                Touch(L0);
                canvas.Invalidate(); ShowLayerInfo();
                UpdateThumb(); RaiseEditorsChanged();
                status.Text = "Brought the deleted mark back.";
                return;
            }
            ShotLayer L = (active != null && active.Items.Count > 0) ? active : null;
            if (L == null) { for (int i = layers.Count - 1; i >= 0; i--) if (layers[i].Items.Count > 0) { L = layers[i]; break; } }
            if (L == null) { status.Text = "Nothing to undo."; return; }
            LayerItem last = L.Items[L.Items.Count - 1];
            if (selItem == last) { selItem = null; selLayer = null; }
            L.Items.RemoveAt(L.Items.Count - 1);
            if (last.Img != null) last.Img.Dispose();
            Touch(L);
            canvas.Invalidate(); ShowLayerInfo();
            UpdateThumb(); RaiseEditorsChanged();
            status.Text = "Undid the last mark on \"" + L.Name + "\".";
        }

        void DeleteActiveLayer()
        {
            if (active == null) return;
            ShotLayer L = active;
            if (selLayer == L) { selItem = null; selLayer = null; }
            if (delLayer == L) { delItem = null; delLayer = null; }
            foreach (LayerItem it in L.Items) if (it.Img != null) it.Img.Dispose();
            layers.Remove(L);
            active = layers.Count > 0 ? layers[layers.Count - 1] : null;
            dirty = true;
            RefreshLayerList(); canvas.Invalidate();
            UpdateThumb(); RaiseEditorsChanged();
            status.Text = "Deleted the layer \"" + L.Name + "\".";
        }

        // direction +1 = up (toward the top, drawn over the others), -1 = down
        void MoveActiveLayer(int direction)
        {
            if (active == null) return;
            int i = layers.IndexOf(active), j = i + direction;
            if (i < 0 || j < 0 || j >= layers.Count) return;
            ShotLayer t = layers[i]; layers[i] = layers[j]; layers[j] = t;
            dirty = true;
            RefreshLayerList(); canvas.Invalidate();
            UpdateThumb(); RaiseEditorsChanged();
        }

        void ShowLayerInfo()
        {
            if (layerInfo == null) return;
            if (active == null) { layerInfo.Text = "No layer yet. Press + Text, + Drawing or + Image, or pick a tool."; return; }
            layerInfo.Text = "\"" + active.Name + "\": " + active.Items.Count + " mark(s). Made by " + active.Author + " on " + active.Created.ToString("g")
                + ". Last changed by " + active.LastBy + " on " + active.LastAt.ToString("g") + ".";
        }

        // the list shows the top layer first; each row has a tick (shown / hidden)
        void RefreshLayerList()
        {
            if (llist == null) return;
            suppressLayerUi = true;
            try
            {
                llist.BeginUpdate();
                llist.Items.Clear();
                for (int i = layers.Count - 1; i >= 0; i--)
                {
                    ShotLayer L = layers[i];
                    ListViewItem it = new ListViewItem(L.Name);
                    it.SubItems.Add(L.Type == "text" ? "Text" : L.Type == "draw" ? "Drawing" : "Image");
                    it.SubItems.Add(L.Author);
                    it.Checked = L.Visible;
                    it.Tag = L;
                    llist.Items.Add(it);
                    if (L == active) it.Selected = true;
                }
                llist.EndUpdate();
            }
            finally { suppressLayerUi = false; }
            ShowLayerInfo();
        }

        Button SmallButton(string text, int x, int y, int w)
        {
            Button b = MakeButton(text, x, w, false);
            b.Location = new Point(x, y); b.Height = 28;
            return b;
        }

        void BuildLayerPanel()
        {
            lpanel = new Panel(); lpanel.Dock = DockStyle.Left; lpanel.Width = 300; lpanel.BackColor = Dark; lpanel.Visible = false;
            Label lh = new Label(); lh.Text = "Layers"; lh.Location = new Point(10, 6); lh.AutoSize = true; lh.ForeColor = Gold; lh.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            llist = new ListView(); llist.Location = new Point(8, 32); llist.Size = new Size(284, 200); llist.View = View.Details;
            llist.CheckBoxes = true; llist.FullRowSelect = true; llist.HideSelection = false; llist.MultiSelect = false; llist.LabelEdit = true;
            llist.HeaderStyle = ColumnHeaderStyle.Nonclickable;
            llist.BackColor = Color.FromArgb(24, 26, 32); llist.ForeColor = Color.White; llist.BorderStyle = BorderStyle.None; llist.Font = new Font("Segoe UI", 9f);
            llist.Columns.Add("Layer (tick = shown)", 146); llist.Columns.Add("Kind", 58); llist.Columns.Add("By", 66);
            layerInfo = new Label(); layerInfo.Location = new Point(8, 236); layerInfo.Size = new Size(284, 58); layerInfo.ForeColor = Color.FromArgb(190, 190, 200); layerInfo.Font = new Font("Segoe UI", 8.5f);

            bAddText = SmallButton("+ Text", 8, 298, 90); bAddDraw = SmallButton("+ Drawing", 102, 298, 96); bAddImage = SmallButton("+ Image", 202, 298, 90);
            bDelLayer = SmallButton("Delete", 8, 332, 90); bUp = SmallButton("Up", 102, 332, 46); bDown = SmallButton("Down", 152, 332, 60); bUndo = SmallButton("Undo", 216, 332, 76);

            Label tl = new Label(); tl.Text = "Tools"; tl.Location = new Point(10, 372); tl.AutoSize = true; tl.ForeColor = Gold; tl.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            string[] ids = new string[] { "move", "pen", "marker", "line", "arrow", "box", "oval", "text" };
            string[] labels = new string[] { "Move", "Pen", "Marker", "Line", "Arrow", "Box", "Oval", "Text" };
            for (int i = 0; i < ids.Length; i++)
            {
                int row = i / 3, col = i % 3;
                Button tb = SmallButton(labels[i], 8 + col * 94, 398 + row * 34, 90);
                string id = ids[i];
                tb.Click += delegate { SetTool(id); };
                toolBtns[id] = tb;
                lpanel.Controls.Add(tb);
            }
            bColor = SmallButton("Color", 196, 466, 96); bColor.BackColor = penColor; bColor.ForeColor = Color.White;
            Label hint = new Label(); hint.Location = new Point(8, 506); hint.Size = new Size(284, 90); hint.ForeColor = Color.FromArgb(170, 170, 180); hint.Font = new Font("Segoe UI", 8.5f);
            hint.Text = "Pick a tool, then draw or click on the picture. Ctrl + drag moves the picture while a drawing tool is on. Ctrl+Z undoes. Ctrl+V pastes an image from the clipboard as a new layer. Double-click a layer's name to rename it.";

            lpanel.Controls.Add(lh); lpanel.Controls.Add(llist); lpanel.Controls.Add(layerInfo);
            lpanel.Controls.Add(bAddText); lpanel.Controls.Add(bAddDraw); lpanel.Controls.Add(bAddImage);
            lpanel.Controls.Add(bDelLayer); lpanel.Controls.Add(bUp); lpanel.Controls.Add(bDown); lpanel.Controls.Add(bUndo);
            lpanel.Controls.Add(tl); lpanel.Controls.Add(bColor); lpanel.Controls.Add(hint);

            ToolTip lt = new ToolTip();
            lt.SetToolTip(bAddText, "A new text layer"); lt.SetToolTip(bAddDraw, "A new drawing layer (pen, marker, lines, arrows, boxes, ovals)");
            lt.SetToolTip(bAddImage, "A new image layer from a picture file"); lt.SetToolTip(bColor, "The color new marks are made in");

            bAddText.Click += delegate { NewLayer("text"); SetTool("text"); };
            bAddDraw.Click += delegate { NewLayer("draw"); if (!canvas.IsDrawTool()) SetTool("pen"); };
            bAddImage.Click += delegate { AddImageFromFile(); };
            bDelLayer.Click += delegate { DeleteActiveLayer(); };
            bUp.Click += delegate { MoveActiveLayer(1); };
            bDown.Click += delegate { MoveActiveLayer(-1); };
            bUndo.Click += delegate { UndoLast(); };
            bColor.Click += delegate
            {
                using (ColorDialog cd = new ColorDialog())
                {
                    cd.Color = penColor; cd.FullOpen = true;
                    if (cd.ShowDialog(this) == DialogResult.OK) { penColor = cd.Color; bColor.BackColor = penColor; bColor.ForeColor = (penColor.GetBrightness() > 0.6f) ? Dark : Color.White; }
                }
            };
            llist.ItemChecked += delegate (object s, ItemCheckedEventArgs e)
            {
                if (suppressLayerUi) return;
                ShotLayer L = e.Item.Tag as ShotLayer;
                if (L == null) return;
                L.Visible = e.Item.Checked;
                Touch(L);
                canvas.Invalidate();
                UpdateThumb(); RaiseEditorsChanged();
                status.Text = "\"" + L.Name + "\" is " + (L.Visible ? "shown." : "hidden.");
            };
            llist.SelectedIndexChanged += delegate
            {
                if (suppressLayerUi || llist.SelectedItems.Count == 0) return;
                ShotLayer L = llist.SelectedItems[0].Tag as ShotLayer;
                if (L != null) { active = L; ShowLayerInfo(); }
            };
            llist.AfterLabelEdit += delegate (object s, LabelEditEventArgs e)
            {
                ShotLayer L = llist.Items[e.Item].Tag as ShotLayer;
                if (L == null || e.Label == null || e.Label.Trim().Length == 0) { e.CancelEdit = true; return; }
                L.Name = e.Label.Trim();
                Touch(L);
                BeginInvoke(new Action(ShowLayerInfo));
            };
            llist.DoubleClick += delegate { if (llist.SelectedItems.Count > 0) llist.SelectedItems[0].BeginEdit(); };
            SetToolButtons();
        }

        void ToggleLayers()
        {
            lopen = !lopen;
            lpanel.Visible = lopen;
            bLayers.BackColor = lopen ? Gold : Color.FromArgb(40, 43, 52);
            bLayers.ForeColor = lopen ? Dark : Color.White;
            // the window grows by the width of the panel when there is room (to the right, else to the left) so the picture keeps its size
            if (lopen)
            {
                Rectangle wa = Screen.FromControl(this).WorkingArea;
                if (WindowState == FormWindowState.Normal)
                {
                    if (Right + 300 <= wa.Right) { Width += 300; lwidened = 1; }
                    else if (Left - 300 >= wa.Left) { Left -= 300; Width += 300; lwidened = 2; }
                }
                RefreshLayerList();
            }
            else
            {
                if (lwidened == 1) Width -= 300;
                else if (lwidened == 2) { Left += 300; Width -= 300; }
                lwidened = 0;
            }
        }

        void SetToolButtons()
        {
            foreach (KeyValuePair<string, Button> kv in toolBtns)
            {
                bool on = kv.Key == curTool;
                kv.Value.BackColor = on ? Gold : Color.FromArgb(40, 43, 52);
                kv.Value.ForeColor = on ? Dark : Color.White;
            }
            bText.BackColor = curTool == "text" ? Gold : Color.FromArgb(40, 43, 52);
            bText.ForeColor = curTool == "text" ? Dark : Color.White;
        }

        void SetTool(string t)
        {
            CommitEditor();
            if (t != "move") ClearSelection();
            curTool = t; textMode = (t == "text"); canvas.Mode = t;
            SetToolButtons();
            canvas.BaseCursor = t == "move" ? Cursors.Default : (t == "text" ? Cursors.IBeam : Cursors.Cross);
            canvas.Cursor = canvas.BaseCursor;
            if (t == "move") status.Text = "Move: hold the left button and drag to move the picture; the mouse wheel zooms.";
            else if (t == "text") status.Text = "Text: click where the words should start, type, press Enter. They go on the active text layer.";
            else if (t == "image") status.Text = "Image: click the picture where the image's top-left corner should go.";
            else status.Text = "Drawing (" + t + "): drag on the picture. Hold Ctrl and drag to move the picture. Ctrl+Z undoes.";
        }

        // ---- the tools that draw ----
        void OnToolDown(PointF p)
        {
            if (!canvas.IsDrawTool()) return;
            CommitEditor();
            EnsureActive("draw");
            LayerItem it = new LayerItem();
            it.Kind = curTool; it.Col = penColor; it.W = PenWidth();
            it.A = p; it.B = p; it.Pts.Add(p);
            draft = it;
            canvas.Invalidate();
        }

        void OnToolMove(PointF p)
        {
            if (draft == null) return;
            if (draft.Kind == "pen" || draft.Kind == "marker")
            {
                PointF last = draft.Pts[draft.Pts.Count - 1];
                float dx = p.X - last.X, dy = p.Y - last.Y;
                if (dx * dx + dy * dy < 2f) return;
                draft.Pts.Add(p);
            }
            else draft.B = p;
            canvas.Invalidate();
        }

        void OnToolUp(PointF p)
        {
            LayerItem it = draft;
            if (it == null) return;
            draft = null;
            if (it.Kind == "pen" || it.Kind == "marker") { if (it.Pts.Count < 2) it.Pts.Add(new PointF(p.X + 0.1f, p.Y)); }
            else
            {
                it.B = p;
                float dx = it.B.X - it.A.X, dy = it.B.Y - it.A.Y;
                if (dx * dx + dy * dy < 9f) { canvas.Invalidate(); return; }   // a click, not a drag: nothing is drawn
            }
            AddItem(it);
        }

        // ---- images as layers ----
        void AddImageFromFile()
        {
            try
            {
                using (OpenFileDialog d = new OpenFileDialog())
                {
                    d.Title = "Add an image as a new layer";
                    d.Filter = "Pictures (*.png;*.jpg;*.jpeg;*.bmp;*.gif)|*.png;*.jpg;*.jpeg;*.bmp;*.gif|All files (*.*)|*.*";
                    if (d.ShowDialog(this) != DialogResult.OK) return;
                    using (FileStream fs = new FileStream(d.FileName, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    using (Image src = Image.FromStream(fs)) { BeginPlaceImage(new Bitmap(src)); }
                }
            }
            catch (Exception ex) { status.Text = "Could not add that image: " + ex.Message; }
        }

        void PasteImageLayer()
        {
            try
            {
                if (!Clipboard.ContainsImage()) { status.Text = "There is no image on the clipboard."; return; }
                using (Image ci = Clipboard.GetImage()) { BeginPlaceImage(new Bitmap(ci)); }
            }
            catch (Exception ex) { status.Text = "Could not paste the image: " + ex.Message; }
        }

        void BeginPlaceImage(Bitmap b)
        {
            if (pendingImage != null) pendingImage.Dispose();
            pendingImage = b;
            SetTool("image");
        }

        void PlacePendingImage(Point at)
        {
            Bitmap b = pendingImage;
            if (b == null) { SetTool("move"); return; }
            pendingImage = null;
            ShotLayer L = NewLayer("image");
            LayerItem it = new LayerItem();
            it.Kind = "image"; it.Img = b; it.A = canvas.ToImage(at);
            float maxW = img.Width * 0.6f;
            it.Scale = b.Width > maxW ? maxW / b.Width : 1f;     // a big image is shrunk so it does not cover the whole picture
            AddItem(it);
            SetTool("move");
        }

        // ---- tests only ----
        public void TestAddText(string t, float x, float y) { DrawText(t, x, y); }
        public void TestAddShape(string kind, float x1, float y1, float x2, float y2)
        {
            EnsureActive("draw");
            LayerItem it = new LayerItem();
            it.Kind = kind; it.Col = penColor; it.W = PenWidth(); it.A = new PointF(x1, y1); it.B = new PointF(x2, y2); it.Pts.Add(it.A); it.Pts.Add(it.B);
            AddItem(it);
        }
        public void TestSetVisible(int fromBottom, bool on)
        {
            ShotLayer L = layers[fromBottom]; L.Visible = on; Touch(L); RefreshLayerList(); canvas.Invalidate();
        }
        public void TestRename(int fromBottom, string name) { layers[fromBottom].Name = name; Touch(layers[fromBottom]); RefreshLayerList(); }
        public void TestToggleLayers() { ToggleLayers(); }
        public void TestUndo() { UndoLast(); }
        public string TestSelectAt(float x, float y) { SelectAtImage(new PointF(x, y)); return selItem == null ? "nothing" : selItem.Kind + " on \"" + selLayer.Name + "\""; }
        public void TestDeleteSelected() { DeleteSelected(); }
        public void TestEditSelectedText(string t) { if (selItem != null) StartEditText(selItem); if (editor != null) { editor.Text = t; CommitEditor(); } }
        public string TestSelectedText() { return selItem == null ? "(none)" : (selItem.Text ?? "(not text)"); }
        public string TestMarkCounts() { StringBuilder sb = new StringBuilder(); foreach (ShotLayer L in layers) sb.Append(L.Name + "=" + L.Items.Count + " "); return sb.ToString().Trim(); }
        public void TestClearSelection() { ClearSelection(); }
        public string TestClickWith(string tool, float ix, float iy) { SetTool(tool); PicClick(canvas.ToScreen(new PointF(ix, iy))); string r = editor != null ? "a new text box opened" : (selItem != null ? "selected the " + selItem.Kind + " mark" : "nothing happened"); DiscardEditor(); return r; }
        public void TestRenderView(string path) { Bitmap v = canvas.RenderView(); if (v != null) { v.Save(path, ImageFormat.Png); v.Dispose(); } }
        public void TestDeleteTop() { active = layers[layers.Count - 1]; DeleteActiveLayer(); }
        public string TestLayerInfo()
        {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < layers.Count; i++)
            {
                ShotLayer L = layers[i];
                sb.Append("  [" + i + "] \"" + L.Name + "\" " + L.Type + ", " + (L.Visible ? "shown" : "hidden") + ", " + L.Items.Count + " mark(s), by " + L.Author + ", last changed by " + L.LastBy + "\n");
            }
            return sb.ToString();
        }
        public void TestComposite(string path) { using (Bitmap c = RenderComposite()) c.Save(path, ImageFormat.Png); }

        // ================================================================================================
        //  Saving the layers with the shot (v1.18). Next to "<name>.png" (the picture as it looks with the layers that are
        //  switched on) goes "<name>.amitshot": the ORIGINAL picture plus every layer (name, kind, on/off, who made it and when,
        //  who last changed it, and every mark), so the shot can be opened again with all its layers still editable.
        //  Plain System.IO only (no extra assemblies). Later the same data goes to the shared database.
        // ================================================================================================
        static byte[] PngBytes(Bitmap b)
        {
            using (MemoryStream ms = new MemoryStream()) { b.Save(ms, ImageFormat.Png); return ms.ToArray(); }
        }

        static Bitmap BitmapFromBytes(byte[] bytes)
        {
            using (MemoryStream ms = new MemoryStream(bytes))
            using (Image t = Image.FromStream(ms)) { return new Bitmap(t); }
        }

        public static void WriteShotFile(string path, Bitmap baseImg, List<ShotLayer> layers, string creator, DateTime createdAt)
        {
            string tmp = path + ".tmp";
            using (FileStream fs = new FileStream(tmp, FileMode.Create, FileAccess.Write))
            using (BinaryWriter w = new BinaryWriter(fs, Encoding.UTF8))
            {
                w.Write(Encoding.ASCII.GetBytes("AMITSHT1"));
                w.Write(2);                                           // format version
                w.Write(creator ?? ""); w.Write(createdAt.Ticks);
                byte[] bb = PngBytes(baseImg); w.Write(bb.Length); w.Write(bb);
                w.Write(layers.Count);
                foreach (ShotLayer L in layers)
                {
                    w.Write(L.Name ?? ""); w.Write(L.Type ?? ""); w.Write(L.Visible);
                    w.Write(L.Author ?? ""); w.Write(L.LastBy ?? ""); w.Write(L.Created.Ticks); w.Write(L.LastAt.Ticks);
                    w.Write(L.Items.Count);
                    foreach (LayerItem it in L.Items)
                    {
                        w.Write(it.Kind ?? ""); w.Write(it.A.X); w.Write(it.A.Y); w.Write(it.B.X); w.Write(it.B.Y);
                        w.Write(it.Col.ToArgb()); w.Write(it.W); w.Write(it.Text ?? ""); w.Write(it.Size); w.Write(it.Scale);
                        w.Write(it.FontName ?? "Segoe UI"); w.Write(it.Bold); w.Write(it.Italic); w.Write(it.Underline);
                        w.Write(it.Pts.Count);
                        foreach (PointF p in it.Pts) { w.Write(p.X); w.Write(p.Y); }
                        if (it.Img != null) { w.Write(true); byte[] ib = PngBytes(it.Img); w.Write(ib.Length); w.Write(ib); }
                        else w.Write(false);
                    }
                }
            }
            if (File.Exists(path)) File.Delete(path);
            File.Move(tmp, path);
        }

        public static bool ReadShotFile(string path, out Bitmap baseImg, out List<ShotLayer> layers, out string creator, out DateTime createdAt)
        {
            baseImg = null; layers = new List<ShotLayer>(); creator = ""; createdAt = DateTime.Now;
            using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            using (BinaryReader r = new BinaryReader(fs, Encoding.UTF8))
            {
                string magic = Encoding.ASCII.GetString(r.ReadBytes(8));
                if (magic != "AMITSHT1") return false;
                int ver = r.ReadInt32();
                if (ver != 1 && ver != 2) return false;
                creator = r.ReadString(); createdAt = new DateTime(r.ReadInt64());
                int bl = r.ReadInt32(); baseImg = BitmapFromBytes(r.ReadBytes(bl));
                int nl = r.ReadInt32();
                for (int i = 0; i < nl; i++)
                {
                    ShotLayer L = new ShotLayer();
                    L.Name = r.ReadString(); L.Type = r.ReadString(); L.Visible = r.ReadBoolean();
                    L.Author = r.ReadString(); L.LastBy = r.ReadString(); L.Created = new DateTime(r.ReadInt64()); L.LastAt = new DateTime(r.ReadInt64());
                    int ni = r.ReadInt32();
                    for (int j = 0; j < ni; j++)
                    {
                        LayerItem it = new LayerItem();
                        it.Kind = r.ReadString(); it.A = new PointF(r.ReadSingle(), r.ReadSingle()); it.B = new PointF(r.ReadSingle(), r.ReadSingle());
                        it.Col = Color.FromArgb(r.ReadInt32()); it.W = r.ReadSingle(); it.Text = r.ReadString(); it.Size = r.ReadSingle(); it.Scale = r.ReadSingle();
                        if (ver >= 2) { it.FontName = r.ReadString(); it.Bold = r.ReadBoolean(); it.Italic = r.ReadBoolean(); it.Underline = r.ReadBoolean(); }
                        int np = r.ReadInt32();
                        for (int k = 0; k < np; k++) it.Pts.Add(new PointF(r.ReadSingle(), r.ReadSingle()));
                        if (r.ReadBoolean()) { int ib = r.ReadInt32(); it.Img = BitmapFromBytes(r.ReadBytes(ib)); }
                        L.Items.Add(it);
                    }
                    layers.Add(L);
                }
            }
            return true;
        }

        // the "Open..." button: a shot saved with its layers opens in a new window
        void DoOpenShot()
        {
            try
            {
                string dir = ShowAmitFolder();
                Directory.CreateDirectory(dir);
                using (OpenFileDialog d = new OpenFileDialog())
                {
                    d.Title = "Open a shot with its layers";
                    d.Filter = "Show Amit shots with layers (*.amitshot)|*.amitshot";
                    d.InitialDirectory = dir;
                    if (d.ShowDialog(this) != DialogResult.OK) return;
                    OpenLayeredShot(d.FileName);
                }
            }
            catch (Exception ex) { status.Text = "Could not open that shot: " + ex.Message; }
        }

        // ================================================================================================
        //  The format bar (v1.21): whatever mark is selected can be restyled, like a word processor.
        //  Words: font, size, bold, italic, underline, color. Drawings: color and line width. Images: size.
        //  Always on screen under the top bar (greyed until something is selected) so the picture never jumps.
        // ================================================================================================
        static FontStyle StyleOf(LayerItem it)
        {
            FontStyle s = FontStyle.Regular;
            if (it.Bold) s |= FontStyle.Bold;
            if (it.Italic) s |= FontStyle.Italic;
            if (it.Underline) s |= FontStyle.Underline;
            return s;
        }

        // the mark's font at its own size times a scale (1 = the picture's pixels, the zoom = what is shown on screen)
        static Font MakeTextFont(LayerItem it, float scale)
        {
            float sz = Math.Max(1f, it.Size * scale);
            try { return new Font(string.IsNullOrEmpty(it.FontName) ? "Segoe UI" : it.FontName, sz, StyleOf(it)); }
            catch { return new Font("Segoe UI", sz, StyleOf(it)); }
        }

        Panel fbar;
        Label fLbl, fWidthLbl, fPctLbl;
        ComboBox fFont;
        NumericUpDown fSize, fWidth, fPct;
        Button fBold, fItalic, fUnder, fColor;
        bool suppressFmt;

        NumericUpDown MakeNum(int x, int w, decimal min, decimal max, decimal val)
        {
            NumericUpDown n = new NumericUpDown();
            n.Location = new Point(x, 9); n.Width = w; n.Minimum = min; n.Maximum = max; n.Value = val;
            n.Font = new Font("Segoe UI", 10f);
            return n;
        }

        Button MakeFmtButton(string text, int x, int w)
        {
            Button b = MakeButton(text, x, w, false);
            b.Location = new Point(x, 6); b.Height = 28;
            return b;
        }

        void BuildFormatBar()
        {
            fbar = new Panel(); fbar.Dock = DockStyle.Top; fbar.Height = 40; fbar.BackColor = Color.FromArgb(28, 30, 38); fbar.Visible = false;
            fLbl = new Label(); fLbl.Location = new Point(12, 11); fLbl.AutoSize = true; fLbl.ForeColor = Gold; fLbl.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            fLbl.Text = "Click a mark to change how it looks";

            fFont = new ComboBox(); fFont.DropDownStyle = ComboBoxStyle.DropDownList; fFont.Location = new Point(110, 8); fFont.Width = 200; fFont.Font = new Font("Segoe UI", 10f);
            fFont.MaxDropDownItems = 18;
            List<string> names = new List<string>();
            foreach (FontFamily ff in FontFamily.Families) names.Add(ff.Name);
            names.Sort();
            foreach (string n in names) fFont.Items.Add(n);
            fSize = MakeNum(318, 62, 6, 400, 18);
            fBold = MakeFmtButton("B", 388, 34); fBold.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            fItalic = MakeFmtButton("I", 426, 34); fItalic.Font = new Font("Segoe UI", 10f, FontStyle.Italic);
            fUnder = MakeFmtButton("U", 464, 34); fUnder.Font = new Font("Segoe UI", 10f, FontStyle.Underline);
            fColor = MakeFmtButton("Color", 506, 80);
            fWidthLbl = new Label(); fWidthLbl.Text = "Line width"; fWidthLbl.Location = new Point(110, 11); fWidthLbl.AutoSize = true; fWidthLbl.ForeColor = Color.White; fWidthLbl.Font = new Font("Segoe UI", 9.5f);
            fWidth = MakeNum(190, 62, 1, 80, 4);
            fPctLbl = new Label(); fPctLbl.Text = "Size %"; fPctLbl.Location = new Point(110, 11); fPctLbl.AutoSize = true; fPctLbl.ForeColor = Color.White; fPctLbl.Font = new Font("Segoe UI", 9.5f);
            fPct = MakeNum(170, 70, 5, 400, 100);

            fbar.Controls.Add(fLbl); fbar.Controls.Add(fFont); fbar.Controls.Add(fSize); fbar.Controls.Add(fBold); fbar.Controls.Add(fItalic);
            fbar.Controls.Add(fUnder); fbar.Controls.Add(fColor); fbar.Controls.Add(fWidthLbl); fbar.Controls.Add(fWidth); fbar.Controls.Add(fPctLbl); fbar.Controls.Add(fPct);

            ToolTip ft = new ToolTip();
            ft.SetToolTip(fFont, "Font of the selected words"); ft.SetToolTip(fSize, "Size of the selected words");
            ft.SetToolTip(fBold, "Bold"); ft.SetToolTip(fItalic, "Italic"); ft.SetToolTip(fUnder, "Underline");
            ft.SetToolTip(fColor, "Color of the selected mark"); ft.SetToolTip(fWidth, "Thickness of the selected line or shape");

            fFont.SelectedIndexChanged += delegate { if (!FmtReady(LayerKind.Text)) return; selItem.FontName = (string)fFont.SelectedItem; defFont = selItem.FontName; FormatChanged(); };
            fSize.ValueChanged += delegate { if (!FmtReady(LayerKind.Text)) return; selItem.Size = (float)fSize.Value; defSize = selItem.Size; FormatChanged(); };
            fBold.Click += delegate { if (!FmtReady(LayerKind.Text)) return; selItem.Bold = !selItem.Bold; defBold = selItem.Bold; FormatChanged(); SyncFormat(); };
            fItalic.Click += delegate { if (!FmtReady(LayerKind.Text)) return; selItem.Italic = !selItem.Italic; defItalic = selItem.Italic; FormatChanged(); SyncFormat(); };
            fUnder.Click += delegate { if (!FmtReady(LayerKind.Text)) return; selItem.Underline = !selItem.Underline; defUnderline = selItem.Underline; FormatChanged(); SyncFormat(); };
            fColor.Click += delegate
            {
                if (selItem == null || suppressFmt || selItem.Kind == "image") return;
                using (ColorDialog cd = new ColorDialog())
                {
                    cd.Color = selItem.Col; cd.FullOpen = true;
                    if (cd.ShowDialog(this) == DialogResult.OK) { ApplyColor(cd.Color); }
                }
            };
            fWidth.ValueChanged += delegate { if (!FmtReady(LayerKind.Shape)) return; selItem.W = (float)fWidth.Value; FormatChanged(); };
            fPct.ValueChanged += delegate { if (!FmtReady(LayerKind.Image)) return; selItem.Scale = (float)fPct.Value / 100f; FormatChanged(); };
            SyncFormat();
        }

        enum LayerKind { Text, Shape, Image }

        bool FmtReady(LayerKind k)
        {
            if (suppressFmt || selItem == null) return false;
            if (k == LayerKind.Text) return selItem.Kind == "text";
            if (k == LayerKind.Image) return selItem.Kind == "image";
            return selItem.Kind != "text" && selItem.Kind != "image";
        }

        void ApplyColor(Color c)
        {
            if (selItem == null) return;
            selItem.Col = c;
            penColor = c;                              // the next new marks use it too
            if (bColor != null) { bColor.BackColor = c; bColor.ForeColor = (c.GetBrightness() > 0.6f) ? Dark : Color.White; }
            FormatChanged(); SyncFormat();
        }

        // after any change in the bar: the picture, the layer's "last changed by", the thumbnails
        void FormatChanged()
        {
            if (selItem == null || selLayer == null) return;
            Touch(selLayer);
            if (editor != null && editingItem == selItem)
            {
                editor.Font = MakeTextFont(selItem, canvas.Zoom);      // the words being edited change look while typing
                editor.ForeColor = selItem.Col;
            }
            canvas.Invalidate(); ShowLayerInfo();
            UpdateThumb(); RaiseEditorsChanged();
        }

        // the bar shows the controls that fit the selected mark and their values; greyed text when nothing is selected
        void SyncFormat()
        {
            if (fbar == null) return;
            suppressFmt = true;
            try
            {
                LayerItem it = selItemField;
                bool text = it != null && it.Kind == "text", image = it != null && it.Kind == "image", shape = it != null && !text && !image;
                fbar.Visible = it != null;      // the bar is there only while something is selected
                fLbl.Visible = false;
                fFont.Visible = fSize.Visible = fBold.Visible = fItalic.Visible = fUnder.Visible = text;
                fWidthLbl.Visible = fWidth.Visible = shape;
                fPctLbl.Visible = fPct.Visible = image;
                fColor.Visible = it != null && !image;
                if (text)
                {
                    int idx = fFont.Items.IndexOf(it.FontName);
                    fFont.SelectedIndex = idx >= 0 ? idx : fFont.Items.IndexOf("Segoe UI");
                    fSize.Value = (decimal)Math.Max(6f, Math.Min(400f, it.Size));
                    SetToggle(fBold, it.Bold); SetToggle(fItalic, it.Italic); SetToggle(fUnder, it.Underline);
                }
                if (shape) fWidth.Value = (decimal)Math.Max(1f, Math.Min(80f, it.W));
                if (image) fPct.Value = (decimal)Math.Max(5f, Math.Min(400f, it.Scale * 100f));
                if (it != null && !image) { fColor.BackColor = it.Col; fColor.ForeColor = (it.Col.GetBrightness() > 0.6f) ? Dark : Color.White; }
            }
            finally { suppressFmt = false; }
            PlaceFormatBar();
        }

        static void SetToggle(Button b, bool on)
        {
            b.BackColor = on ? Gold : Color.FromArgb(40, 43, 52);
            b.ForeColor = on ? Dark : Color.White;
        }

        // the bar goes along the top of the picture, or along the bottom when the selected mark is up there (so it never covers it)
        void PlaceFormatBar()
        {
            if (fbar == null) return;
            DockStyle want = DockStyle.Top;
            if (selItemField != null && canvas != null)
            {
                RectangleF b = ItemBounds(selItemField);
                Point tl = canvas.ToScreen(new PointF(b.Left, b.Top));
                if (tl.Y < fbar.Height + 12) want = DockStyle.Bottom;
            }
            if (fbar.Dock != want) fbar.Dock = want;
        }

        // tests only: a real mouse gesture on the picture (down, move, up) with the given tool, through the canvas's own handlers
        public string TestMouse(string tool, int x1, int y1, int x2, int y2)
        {
            SetTool(tool);
            string before = TestMarkCounts();
            Type t = typeof(ZoomCanvas);
            System.Reflection.BindingFlags fl = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic;
            t.GetMethod("OnMouseDown", fl).Invoke(canvas, new object[] { new MouseEventArgs(MouseButtons.Left, 1, x1, y1, 0) });
            if (x2 != x1 || y2 != y1)
            {
                int steps = 6;
                for (int i = 1; i <= steps; i++)
                    t.GetMethod("OnMouseMove", fl).Invoke(canvas, new object[] { new MouseEventArgs(MouseButtons.Left, 0, x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, 0) });
            }
            t.GetMethod("OnMouseUp", fl).Invoke(canvas, new object[] { new MouseEventArgs(MouseButtons.Left, 1, x2, y2, 0) });
            return "marks " + before + " -> " + TestMarkCounts() + "; selected: " + (selItem == null ? "nothing" : selItem.Kind) + "; format bar " + (fbar.Visible ? "shown (" + fbar.Dock + ")" : "hidden");
        }
        public bool TestBarVisible { get { return fbar.Visible; } }
        public void TestSetTool(string t) { SetTool(t); }

        // tests only: change the look through the bar's own controls, so its real event handlers run
        public void TestFormat(string font, float size, bool bold, bool italic, bool underline, int argb)
        {
            if (selItem == null || selItem.Kind != "text") return;
            int idx = fFont.Items.IndexOf(font); if (idx >= 0) fFont.SelectedIndex = idx;
            fSize.Value = (decimal)size;
            if (selItem.Bold != bold) fBold.PerformClick();
            if (selItem.Italic != italic) fItalic.PerformClick();
            if (selItem.Underline != underline) fUnder.PerformClick();
            ApplyColor(Color.FromArgb(argb));
        }
        public string TestSelectedLook()
        {
            if (selItem == null) return "(nothing selected)";
            return selItem.Kind + ": font=" + selItem.FontName + " size=" + selItem.Size + " bold=" + selItem.Bold + " italic=" + selItem.Italic + " underline=" + selItem.Underline + " color=" + selItem.Col.R + "," + selItem.Col.G + "," + selItem.Col.B + " width=" + selItem.W + " scale=" + selItem.Scale;
        }
        public string TestBarShows()
        {
            return "font=" + fFont.Visible + " size=" + fSize.Visible + " B/I/U=" + fBold.Visible + " color=" + fColor.Visible + " width=" + fWidth.Visible + " size%=" + fPct.Visible + " hint=" + fLbl.Visible;
        }

        bool NeedsSave() { return lastPath == null || dirty || lastBase != BaseName() || !File.Exists(lastPath); }

        // ---- the pictures panel: everything saved in the Show Amit folder, newest first, click one to open it here ----
        void BuildSidePanel()
        {
            side = new Panel(); side.Dock = DockStyle.Right; side.Width = 232; side.BackColor = Dark; side.Visible = false;
            Label sh = new Label(); sh.Text = "Live Shots"; sh.Dock = DockStyle.Top; sh.Height = 30; sh.ForeColor = Gold;
            sh.Font = new Font("Segoe UI", 10f, FontStyle.Bold); sh.TextAlign = ContentAlignment.MiddleLeft; sh.Padding = new Padding(10, 0, 0, 0);
            thumbs = new ImageList(); thumbs.ImageSize = new Size(160, 100); thumbs.ColorDepth = ColorDepth.Depth32Bit;
            list = new ListView(); list.Dock = DockStyle.Fill; list.View = View.LargeIcon; list.LargeImageList = thumbs;
            list.BackColor = Color.FromArgb(24, 26, 32); list.ForeColor = Color.White; list.BorderStyle = BorderStyle.None;
            list.MultiSelect = false; list.HideSelection = false; list.Font = new Font("Segoe UI", 8.5f);
            gOpen = new ListViewGroup("Open now: click one to go to it"); gSaved = new ListViewGroup("Saved in the Show Amit folder (click to open)");
            list.Groups.Add(gOpen); list.Groups.Add(gSaved);
            Label sh2 = new Label(); sh2.Text = "Only the windows open right now are here. Saved shots: Open folder."; sh2.Dock = DockStyle.Bottom; sh2.Height = 46; sh2.ForeColor = Color.FromArgb(170, 170, 180);
            sh2.Font = new Font("Segoe UI", 8.5f); sh2.Padding = new Padding(10, 4, 8, 0);
            side.Controls.Add(list); side.Controls.Add(sh2); side.Controls.Add(sh);
            list.SelectedIndexChanged += delegate
            {
                if (suppressPick || list.SelectedItems.Count == 0) return;
                object tag = list.SelectedItems[0].Tag;
                ShowAmitForm other = tag as ShowAmitForm;
                if (other != null)
                {
                    // a window that is open right now: bring it to the front (the click is not left selected)
                    if (other != this) other.BringFront();
                    suppressPick = true; list.SelectedItems.Clear(); suppressPick = false;
                    CloseSideSoon();
                    return;
                }
                OpenPicture((string)tag);
                CloseSideSoon();
            };
            bPics.Click += delegate { ToggleSide(); };
            ToolTip pt = new ToolTip();
            pt.SetToolTip(bPics, "Live Shots: the Show Amit windows open right now; click one to go to it (the panel then closes)");
        }

        // once a shot is chosen the panel folds away again until the button is pressed (done after the click has finished)
        void CloseSideSoon()
        {
            try { BeginInvoke(new Action(delegate { if (sideOpen) ToggleSide(); })); } catch { }
        }

        void ToggleSide()
        {
            sideOpen = !sideOpen;
            side.Visible = sideOpen;
            bPics.BackColor = sideOpen ? Gold : Color.FromArgb(40, 43, 52);
            bPics.ForeColor = sideOpen ? Dark : Color.White;
            // the window grows by the width of the panel (when there is room) so the picture keeps its size
            if (sideOpen)
            {
                Rectangle wa = Screen.FromControl(this).WorkingArea;
                if (WindowState == FormWindowState.Normal && Right + 232 <= wa.Right) { Width += 232; widened = true; }
                RefreshList();
            }
            else if (widened) { Width -= 232; widened = false; }
        }

        void RefreshListSoon()
        {
            if (!sideOpen) return;
            try { BeginInvoke(new Action(RefreshList)); } catch { }
        }

        static Bitmap ThumbFrom(Image src)
        {
            try
            {
                Bitmap t = new Bitmap(160, 100);
                using (Graphics g = Graphics.FromImage(t))
                {
                    g.Clear(Color.FromArgb(34, 36, 44));
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    float s = Math.Min(160f / src.Width, 100f / src.Height);
                    int w = Math.Max(1, (int)(src.Width * s)), h = Math.Max(1, (int)(src.Height * s));
                    g.DrawImage(src, (160 - w) / 2, (100 - h) / 2, w, h);
                }
                return t;
            }
            catch { return null; }
        }

        static Bitmap MakeThumb(string path)
        {
            try
            {
                using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                using (Image src = Image.FromStream(fs, false, false)) { return ThumbFrom(src); }
            }
            catch { return null; }
        }

        // fills the panel: the newest 60 pictures, thumbnails made in the background so the window never waits
        public void RefreshList()
        {
            if (!sideOpen) return;
            int gen = ++loadGen;
            string dir = ShowAmitFolder();
            list.BeginUpdate(); list.Items.Clear(); thumbs.Images.Clear();
            // the windows open right now come first (this one marked), including captures that are not saved yet
            List<ShowAmitForm> eds;
            lock (editorsLock) { eds = new List<ShowAmitForm>(openEditors); }
            foreach (ShowAmitForm ed in eds)
            {
                Bitmap tb = ed.ThumbClone();
                if (tb == null) continue;
                thumbs.Images.Add(tb); tb.Dispose();
                ListViewItem oi = new ListViewItem("#" + ed.Seq + " " + ed.displayName + (ed == this ? " (this window)" : ""), thumbs.Images.Count - 1);
                oi.Group = gOpen; oi.Tag = ed;
                list.Items.Add(oi);
            }
            list.EndUpdate();
            if (!liveShotsShowSaved) return;
            ThreadPool.QueueUserWorkItem(delegate
            {
                try
                {
                    if (!Directory.Exists(dir)) return;
                    List<string> files = new List<string>();
                    files.AddRange(Directory.GetFiles(dir, "*.png"));
                    files.AddRange(Directory.GetFiles(dir, "*.jpg"));
                    files.Sort(delegate (string a, string b) { return File.GetLastWriteTime(b).CompareTo(File.GetLastWriteTime(a)); });
                    int n = 0;
                    foreach (string f in files)
                    {
                        if (n++ >= 60) break;
                        if (gen != loadGen) return;
                        Bitmap th = MakeThumb(f);
                        if (th == null) continue;
                        string fp = f;
                        try
                        {
                            BeginInvoke(new Action(delegate
                            {
                                if (gen != loadGen || IsDisposed) { th.Dispose(); return; }
                                thumbs.Images.Add(th); th.Dispose();
                                bool here = lastPath != null && string.Equals(fp, lastPath, StringComparison.OrdinalIgnoreCase);
                                ListViewItem it = new ListViewItem(Path.GetFileNameWithoutExtension(fp) + (here ? "  (open here)" : ""), thumbs.Images.Count - 1);
                                it.Tag = fp; it.Group = gSaved;
                                list.Items.Add(it);   // (not selected: selecting would scroll the list away from the "Open now" section)
                            }));
                        }
                        catch { th.Dispose(); return; }
                    }
                }
                catch (Exception ex) { Log("Show Amit: pictures panel (" + ex.Message + ")"); }
            });
        }

        // open another saved picture in this window; the picture being left is saved first (the same rule as closing) so nothing is lost
        public void OpenPicture(string path)
        {
            try
            {
                CommitEditor();
                if (lastPath != null && string.Equals(path, lastPath, StringComparison.OrdinalIgnoreCase)) return;
                if (NeedsSave()) { DoSave(); Log("Show Amit: saved before opening another picture"); }
                Bitmap n;
                using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                using (Image src = Image.FromStream(fs)) { n = new Bitmap(src); }
                Bitmap old = img;
                img = n; canvas.Img = n;
                foreach (ShotLayer ol in layers) foreach (LayerItem oi in ol.Items) if (oi.Img != null) oi.Img.Dispose();
                layers.Clear(); active = null; selItem = null; selLayer = null; delItem = null; delLayer = null; RefreshLayerList();   // a different picture: the layers belonged to the old one
                canvas.ResetView();
                if (old != null) old.Dispose();
                title.Text = Path.GetFileNameWithoutExtension(path);
                lastPath = path; lastBase = BaseName(); dirty = false;
                status.Text = "Opened: " + path;
                Log("Show Amit: opened " + path);
                UpdateThumb(); RaiseEditorsChanged();
            }
            catch (Exception ex) { status.Text = "Could not open that picture: " + ex.Message; Log("Show Amit: could not open a picture (" + ex.Message + ")"); }
        }

        public int PanelCount { get { return list.Items.Count; } }
        public int OpenNowCount { get { int n = 0; foreach (ListViewItem it in list.Items) if (it.Group == gOpen) n++; return n; } }
        public void TestToggleSide() { ToggleSide(); }
        public void BringFrontTest() { BringFront(); }

        // Save View: what is on screen right now (the zoomed part, as it looks) saved as its own picture next to the others, named
        // "<title> zoom". It does not replace the full picture and does not change what closing the window saves.
        public void DoSaveView()
        {
            CommitEditor();
            Bitmap bm = null;
            try
            {
                bm = canvas.RenderView();
                if (bm == null) { status.Text = "Nothing of the picture is showing to save."; return; }
                string dir = ShowAmitFolder();
                Directory.CreateDirectory(dir);
                string path = UniqueFilePath(dir, BaseName() + " zoom", ".png");
                bm.Save(path, ImageFormat.Png);
                lastViewPath = path;
                Log("Show Amit: saved view " + path);
                // the whole shot with its layers is saved too (picture + .amitshot), so the folder always matches what is on screen
                DoSave();
                // the clipboard gets the zoomed view (what is on screen), so Ctrl+V pastes exactly that
                bool onClip = CopyToClipboard(bm);
                status.Text = "Saved the view (" + bm.Width + " x " + bm.Height + "): " + path + "  |  whole shot with layers: " + lastPath + (onClip ? "  |  view is on the clipboard (Ctrl+V)" : "");
                RefreshListSoon();
            }
            catch (Exception ex) { status.Text = "Could not save the view: " + ex.Message; Log("Show Amit: could not save the view (" + ex.Message + ")"); }
            finally { if (bm != null) bm.Dispose(); }
        }

        void DoSaveAs()
        {
            CommitEditor();
            try
            {
                string dir = ShowAmitFolder();
                Directory.CreateDirectory(dir);
                using (SaveFileDialog d = new SaveFileDialog())
                {
                    d.Title = "Save the picture";
                    d.Filter = "PNG picture (*.png)|*.png|JPEG picture (*.jpg)|*.jpg";
                    d.DefaultExt = "png"; d.AddExtension = true; d.OverwritePrompt = true;
                    d.InitialDirectory = dir; d.FileName = BaseName();
                    if (d.ShowDialog(this) != DialogResult.OK) return;
                    SaveImage(d.FileName);
                    lastPath = d.FileName; lastBase = BaseName(); dirty = false;
                    status.Text = "Saved: " + d.FileName;
                    Log("Show Amit: saved " + d.FileName); RefreshListSoon();
                }
            }
            catch (Exception ex) { status.Text = "Could not save: " + ex.Message; Log("Show Amit: could not save as (" + ex.Message + ")"); }
        }

        // Open folder: Explorer, with the last saved picture selected; before anything is saved, the folder pictures go to
        void DoOpenFolder()
        {
            try
            {
                if (lastPath != null && File.Exists(lastPath)) Process.Start("explorer.exe", "/select,\"" + lastPath + "\"");
                else
                {
                    string dir = ShowAmitFolder();
                    Directory.CreateDirectory(dir);
                    Process.Start("explorer.exe", "\"" + dir + "\"");
                }
            }
            catch (Exception ex) { status.Text = "Could not open the folder: " + ex.Message; }
        }
    }

    static int PixDiff(string a, string b)
    {
        using (Bitmap x = new Bitmap(a))
        using (Bitmap y = new Bitmap(b))
        {
            if (x.Width != y.Width || x.Height != y.Height) return -1;
            int n = 0;
            for (int j = 0; j < x.Height; j += 1) for (int i = 0; i < x.Width; i += 1) if (x.GetPixel(i, j).ToArgb() != y.GetPixel(i, j).ToArgb()) n++;
            return n;
        }
    }

    // tests only: real mouse gestures through the canvas (drawing tools: a drag draws, a click selects), the bar showing and hiding
    public static string GestureTest(string srcPng, string outDir, string windowPng)
    { ShowAmitForm.SkipClipboard = true;
        showAmitFolderOverride = outDir;
        StringBuilder res = new StringBuilder();
        try
        {
            using (ShowAmitForm f = new ShowAmitForm(new Bitmap(srcPng)))
            {
                f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-32000, -32000); f.Show(); Application.DoEvents();
                res.Append("pen, drag                       : " + f.TestMouse("pen", 600, 400, 700, 460) + "\n");
                res.Append("pen, click on that stroke       : " + f.TestMouse("pen", 650, 430, 650, 430) + "\n");
                res.Append("pen, click on empty space       : " + f.TestMouse("pen", 900, 900, 900, 900) + "\n");
                res.Append("box, drag                       : " + f.TestMouse("box", 300, 200, 420, 300) + "\n");
                res.Append("box, click on its edge          : " + f.TestMouse("box", 300, 250, 300, 250) + "\n");
                res.Append("Move tool, click on the stroke  : " + f.TestMouse("move", 650, 430, 650, 430) + "\n");
                using (Bitmap pb = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pb, new Rectangle(0, 0, f.Width, f.Height)); pb.Save(windowPng, ImageFormat.Png); }
                f.TestDeleteSelected();
                res.Append("after Delete                    : " + f.TestMarkCounts() + "; bar " + (f.TestBarVisible ? "shown" : "hidden") + "\n");
                res.Append("Move tool, click on empty space : " + f.TestMouse("move", 900, 900, 900, 900) + "\n");
            }
        }
        finally { showAmitFolderOverride = null; }
        return res.ToString();
    }

    // tests only: the format bar end to end (off-screen, clipboard untouched)
    public static string FormatTest(string srcPng, string outDir, string windowPng)
    { ShowAmitForm.SkipClipboard = true;
        showAmitFolderOverride = outDir;
        StringBuilder res = new StringBuilder();
        string before = Path.Combine(outDir, "f_before.png"), after = Path.Combine(outDir, "f_after.png"), back = Path.Combine(outDir, "f_back.png");
        try
        {
            using (ShowAmitForm f = new ShowAmitForm(new Bitmap(srcPng)))
            {
                f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-32000, -32000); f.Show(); Application.DoEvents();
                f.SetTitle("format test");
                f.TestAddText("Is there plumbing here?", 40, 60);
                f.TestAddShape("box", 300, 200, 520, 320);
                res.Append("nothing selected, the bar shows: " + f.TestBarShows() + "\n");
                f.TestSelectAt(60, 75);
                res.Append("words selected, the bar shows:   " + f.TestBarShows() + "\n");
                res.Append("look before: " + f.TestSelectedLook() + "\n");
                f.TestComposite(before);
                f.TestFormat("Times New Roman", 40f, false, true, true, Color.FromArgb(30, 90, 220).ToArgb());
                res.Append("look after:  " + f.TestSelectedLook() + "\n");
                f.TestComposite(after);
                res.Append("picture changed: " + PixDiff(before, after) + " pixels differ\n");
                f.TestSelectAt(300, 260);
                res.Append("box selected, the bar shows:     " + f.TestBarShows() + "\n");
                Application.DoEvents();
                f.TestSelectAt(60, 75);
                using (Bitmap pb = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pb, new Rectangle(0, 0, f.Width, f.Height)); pb.Save(windowPng, ImageFormat.Png); }
                f.DoSave();
            }
            string shot = Directory.GetFiles(outDir, "*.amitshot")[0];
            Bitmap b; List<ShotLayer> ls; string cr; DateTime at;
            ShowAmitForm.ReadShotFile(shot, out b, out ls, out cr, out at);
            using (ShowAmitForm g2 = new ShowAmitForm(b, ls, cr, at, Path.ChangeExtension(shot, ".png")))
            {
                g2.StartPosition = FormStartPosition.Manual; g2.Location = new Point(-32000, -32000); g2.Show(); Application.DoEvents();
                g2.TestSelectAt(60, 75);
                res.Append("after save and reopen: " + g2.TestSelectedLook() + "\n");
                g2.TestComposite(back);
                res.Append("reopened picture vs saved picture: " + PixDiff(back, Path.ChangeExtension(shot, ".png")) + " pixels differ\n");
            }
        }
        finally { showAmitFolderOverride = null; }
        return res.ToString();
    }

    // tests only: selecting, editing, deleting and bringing back marks, off-screen, clipboard untouched
    public static string SelectTest(string srcPng, string outDir, string windowPng)
    { ShowAmitForm.SkipClipboard = true;
        showAmitFolderOverride = outDir;
        StringBuilder res = new StringBuilder();
        try
        {
            using (ShowAmitForm f = new ShowAmitForm(new Bitmap(srcPng)))
            {
                f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-32000, -32000); f.Show(); Application.DoEvents();
                f.TestAddText("Is there plumbing here?", 40, 60);
                f.TestAddShape("box", 300, 200, 520, 320);
                f.TestAddShape("arrow", 700, 400, 560, 330);
                f.TestAddShape("oval", 800, 100, 960, 180);
                res.Append("marks: " + f.TestMarkCounts() + "\n");
                res.Append("Text tool on, click on the existing words -> " + f.TestClickWith("text", 60, 75) + "\n");
                res.Append("Text tool on, click on the box edge        -> " + f.TestClickWith("text", 300, 260) + "\n");
                res.Append("Text tool on, click on empty space         -> " + f.TestClickWith("text", 1500, 700) + "\n");
                res.Append("Move tool, click on the existing words     -> " + f.TestClickWith("move", 60, 75) + "\n");
                res.Append("click on the text            -> " + f.TestSelectAt(60, 75) + "\n");
                res.Append("click on the box's edge      -> " + f.TestSelectAt(300, 260) + "\n");
                res.Append("click INSIDE the box (empty) -> " + f.TestSelectAt(410, 260) + "\n");
                res.Append("click on the arrow           -> " + f.TestSelectAt(630, 365) + "\n");
                res.Append("click on the oval's edge     -> " + f.TestSelectAt(800, 140) + "\n");
                res.Append("click on empty space        -> " + f.TestSelectAt(1500, 700) + "\n");
                f.TestSelectAt(60, 75);
                f.TestEditSelectedText("Is there a drain here?");
                res.Append("after editing the text: " + f.TestSelectedText() + "\n");
                f.TestSelectAt(300, 260);
                string withSel = Path.Combine(outDir, "v_selected.png"), noSel = Path.Combine(outDir, "v_unselected.png");
                f.TestRenderView(withSel); f.TestClearSelection(); f.TestRenderView(noSel);
                res.Append("saved view with a mark selected vs unselected: " + PixDiff(withSel, noSel) + " pixels differ (0 = the outline never reaches a saved picture)\n");
                f.TestSelectAt(300, 260);
                using (Bitmap pb = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pb, new Rectangle(0, 0, f.Width, f.Height)); pb.Save(windowPng, ImageFormat.Png); }
                f.TestDeleteSelected();
                res.Append("after Delete on the box: " + f.TestMarkCounts() + "\n");
                f.TestUndo();
                res.Append("after Ctrl+Z (brings it back): " + f.TestMarkCounts() + "\n");
            }
        }
        finally { showAmitFolderOverride = null; }
        return res.ToString();
    }

    // tests only: layers end to end, off-screen, clipboard untouched (the windows are never closed)
    public static string LayersTest(string srcPng, string outDir, string windowPng)
    { ShowAmitForm.SkipClipboard = true;
        showAmitFolderOverride = outDir;
        StringBuilder res = new StringBuilder();
        string all = Path.Combine(outDir, "c_all.png"), noDraw = Path.Combine(outDir, "c_nodrawing.png"), none = Path.Combine(outDir, "c_none.png"), back = Path.Combine(outDir, "c_back.png");
        try
        {
            using (ShowAmitForm f = new ShowAmitForm(new Bitmap(srcPng)))
            {
                f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-32000, -32000); f.Show(); Application.DoEvents();
                f.SetTitle("plumbing test");
                f.TestAddText("Is there plumbing here?", 40, 60);
                f.TestAddShape("box", 30, 40, 420, 120);
                f.TestAddShape("arrow", 500, 250, 330, 125);
                f.TestAddShape("oval", 600, 300, 760, 380);
                f.TestRename(1, "Plumbing question");
                f.TestToggleLayers(); Application.DoEvents();
                res.Append("layers:\n" + f.TestLayerInfo());
                f.TestComposite(all);
                f.TestSetVisible(1, false); f.TestComposite(noDraw);
                f.TestSetVisible(0, false); f.TestComposite(none);
                res.Append("pixels that differ: all vs drawing hidden = " + PixDiff(all, noDraw) + ", all vs both hidden = " + PixDiff(all, none) + ", both hidden vs the original capture = " + PixDiff(none, srcPng) + "\n");
                f.TestSetVisible(0, true); f.TestSetVisible(1, true);
                f.TestUndo();
                res.Append("after one Undo:\n" + f.TestLayerInfo());
                f.TestAddShape("oval", 600, 300, 760, 380);
                Application.DoEvents();
                using (Bitmap pb = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pb, new Rectangle(0, 0, f.Width, f.Height)); pb.Save(windowPng, ImageFormat.Png); }
                f.DoSave();
                res.Append("saved: " + f.StatusText + "\n");
            }
            string[] shots = Directory.GetFiles(outDir, "*.amitshot");
            res.Append("files in the folder: " + string.Join(", ", Array.ConvertAll(Directory.GetFiles(outDir, "plumbing*"), delegate (string s) { return Path.GetFileName(s); })) + "\n");
            Bitmap b; List<ShotLayer> ls; string cr; DateTime at;
            bool ok = ShowAmitForm.ReadShotFile(shots[0], out b, out ls, out cr, out at);
            res.Append("read back: ok=" + ok + ", made by " + cr + ", " + ls.Count + " layer(s)\n");
            foreach (ShotLayer L in ls) res.Append("  \"" + L.Name + "\" " + L.Type + " " + (L.Visible ? "shown" : "hidden") + ", " + L.Items.Count + " mark(s), by " + L.Author + ", last changed by " + L.LastBy + "\n");
            using (ShowAmitForm g2 = new ShowAmitForm(b, ls, cr, at, Path.ChangeExtension(shots[0], ".png")))
            {
                g2.StartPosition = FormStartPosition.Manual; g2.Location = new Point(-32000, -32000); g2.Show(); Application.DoEvents();
                g2.TestComposite(back);
                res.Append("reopened shot, its picture vs the saved picture: " + PixDiff(back, Path.ChangeExtension(shots[0], ".png")) + " pixels differ\n");
            }
        }
        finally { showAmitFolderOverride = null; }
        return res.ToString();
    }

    // tests only: opens the editor off-screen on one picture of a folder, opens the pictures panel, switches to another picture, and draws the window to a picture file; never closed (the clipboard is untouched)
    public static string SidePanelTest(string dir, string firstPng, string secondPng, string outPng)
    { ShowAmitForm.SkipClipboard = true;
        showAmitFolderOverride = dir;
        StringBuilder res = new StringBuilder();
        try
        {
            using (ShowAmitForm f = new ShowAmitForm(new Bitmap(firstPng)))
            {
                f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-32000, -32000);
                f.Show(); Application.DoEvents();
                f.SetTitle("first one");
                f.TestToggleSide();
                for (int i = 0; i < 40; i++) { Application.DoEvents(); Thread.Sleep(50); }
                res.Append("pictures in the panel: " + f.PanelCount + ", open windows listed: " + f.OpenNowCount + "\n");
                using (ShowAmitForm f2 = new ShowAmitForm(new Bitmap(secondPng)))
                {
                    f2.StartPosition = FormStartPosition.Manual; f2.Location = new Point(-32000, -32000); f2.Show(); f2.SetTitle("second window");
                    for (int i = 0; i < 30; i++) { Application.DoEvents(); Thread.Sleep(50); }
                    res.Append("after a second window opened, open windows listed in the first: " + f.OpenNowCount + "\n");
                    f.BringFrontTest();
                    for (int i = 0; i < 6; i++) { Application.DoEvents(); Thread.Sleep(50); }
                }
                for (int i = 0; i < 20; i++) { Application.DoEvents(); Thread.Sleep(50); }
                res.Append("after the second window closed, open windows listed in the first: " + f.OpenNowCount + "\n");
                f.OpenPicture(secondPng);
                res.Append("status after opening: " + f.StatusText + "\n");
                for (int i = 0; i < 40; i++) { Application.DoEvents(); Thread.Sleep(50); }
                res.Append("pictures in the panel after the switch (the first one was saved before leaving): " + f.PanelCount + "\n");
                using (Bitmap pb = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pb, new Rectangle(0, 0, f.Width, f.Height)); pb.Save(outPng, ImageFormat.Png); }
            }
        }
        finally { showAmitFolderOverride = null; }
        return res.ToString();
    }

    // tests only: opens the editor off-screen on a real picture, zooms in, presses Save View into saveDir, and draws the window to a picture file; never closes it (the clipboard is untouched)
    public static string SaveViewTest(string srcPng, string saveDir, string outPng)
    { ShowAmitForm.SkipClipboard = true;
        showAmitFolderOverride = saveDir;
        try
        {
            using (ShowAmitForm f = new ShowAmitForm(new Bitmap(srcPng)))
            {
                f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-32000, -32000);
                f.Show(); Application.DoEvents();
                f.SetTitle("view test");
                f.TestView(new Point(300, 200), 5, -60, -20);
                f.DoSaveView();
                string s = f.StatusText;
                using (Bitmap pb = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pb, new Rectangle(0, 0, f.Width, f.Height)); pb.Save(outPng, ImageFormat.Png); }
                return s;
            }
        }
        finally { showAmitFolderOverride = null; }
    }

    // tests only: draws a real picture file zoomed in the same way the editor does, to a picture file (no window shown, clipboard untouched)
    public static string ZoomPictureTest(string srcPng, string outPng, int wheelClicks, int atX, int atY, int w, int h)
    {
        using (Bitmap src = new Bitmap(srcPng))
        using (ZoomCanvas c = new ZoomCanvas(new Bitmap(src)))
        {
            c.Size = new Size(w, h);
            IntPtr hh = c.Handle;
            c.ZoomAt(new Point(atX, atY), wheelClicks * 120);
            System.Diagnostics.Stopwatch sw = System.Diagnostics.Stopwatch.StartNew();
            using (Bitmap o = new Bitmap(w, h)) { c.DrawToBitmap(o, new Rectangle(0, 0, w, h)); o.Save(outPng, ImageFormat.Png); }
            float zz = c.Zoom; return "zoom " + zz.ToString("0.00") + ", drawn in " + sw.ElapsedMilliseconds + " ms";
        }
    }

    // tests only: builds the editor on a made-up picture WITHOUT showing it, writes on it, saves it into saveDir, and draws the window to a picture file
    public static string ShowAmitSelfTest(string pngPath, string saveDir, string title)
    {
        showAmitFolderOverride = saveDir;
        StringBuilder res = new StringBuilder();
        Bitmap src = new Bitmap(520, 300, PixelFormat.Format24bppRgb);
        using (Graphics g = Graphics.FromImage(src))
        {
            using (LinearGradientBrush lg = new LinearGradientBrush(new Rectangle(0, 0, 520, 300), Color.FromArgb(40, 90, 160), Color.FromArgb(230, 230, 210), 45f)) g.FillRectangle(lg, 0, 0, 520, 300);
            g.FillEllipse(Brushes.Orange, 60, 60, 120, 120);
        }
        using (ShowAmitForm f = new ShowAmitForm(src))
        {
            f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-32000, -32000);
            f.Show(); Application.DoEvents();   // far off the screen: only so the buttons exist when the window is drawn to a picture
            f.SetTitle(title);
            f.DrawText("This is a test: hey, I need a picture of a dog", 30, 220);
            f.DoSave();
            res.Append("status: " + f.StatusText + "\n");
            f.DoSave();
            res.Append("status again: " + f.StatusText + "\n");
            f.SetTitle(title + "x");
            f.DoSave();
            res.Append("new title: " + f.StatusText + "\n");
            using (Bitmap pb = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pb, new Rectangle(0, 0, f.Width, f.Height)); pb.Save(pngPath, ImageFormat.Png); }
            f.TestView(new Point(200, 220), 3, -40, -30);       // three wheel clicks in around (200,220), then moved by (-40,-30)
            res.Append("zoom after 3 wheel clicks: " + f.ZoomNow.ToString("0.00") + "\n");
            using (Bitmap pz = new Bitmap(f.Width, f.Height)) { f.DrawToBitmap(pz, new Rectangle(0, 0, f.Width, f.Height)); pz.Save(pngPath.Replace(".png", ".zoom.png"), ImageFormat.Png); }
            f.TestView(new Point(200, 220), -3, 0, 0);
            res.Append("zoom after 3 wheel clicks back out: " + f.ZoomNow.ToString("0.00") + "\n");
            f.DrawText("added after the last save", 30, 150);   // changed since the last save, so closing must save again
            f.Close();                                          // closing = auto-save + clipboard
            res.Append("files in the folder after close: " + Directory.GetFiles(saveDir).Length + "\n");
        }
        res.Append("safe name of [" + title + "] = [" + SafeFileBase(title) + "]\n");
        res.Append("safe name of [a<b>c:d|e?.. ] = [" + SafeFileBase("a<b>c:d|e?.. ") + "]\n");
        res.Append("safe name of [CON] = [" + SafeFileBase("CON") + "]\n");
        res.Append("safe name of [] = [" + SafeFileBase("") + "]\n");
        showAmitFolderOverride = null;
        return res.ToString();
    }

    // tests only: draws the ring to a picture file (on a dark grey backdrop so the see-through parts show)
    public static string MenuSelfTest(string pngPath, string icon, int n, int hover)
    {
        try
        {
            iconPath = icon;
            List<LiveItem> items = new List<LiveItem>();
            for (int i = 0; i < n; i++) items.Add(i == 0 ? new LiveItem("dictate", "Dictate", "Talk to type") : i == 1 ? new LiveItem("showamit", "Show Amit", "Show an area") : i == 2 ? new LiveItem("voice", "Voice", "Say what to do") : new LiveItem("item" + i, "Choice " + (i + 1), "Example"));
            using (Bitmap b = RenderLive(items, hover, false))
            using (Bitmap outp = new Bitmap(b.Width, b.Height))
            using (Graphics g = Graphics.FromImage(outp))
            {
                g.Clear(Color.FromArgb(70, 80, 100));
                g.DrawImage(b, 0, 0);
                outp.Save(pngPath, ImageFormat.Png);
            }
            return "ok";
        }
        catch (Exception ex) { return "error: " + ex.Message; }
    }

    // tests only: shows the real see-through ring on screen for a few seconds (no mouse watching is started)
    public static string MenuShowTest(string icon, int cx, int cy, int hover, int ms)
    {
        try
        {
            iconPath = icon;
            EnsureLiveForm();
            menuCx = cx; menuCy = cy; liveOpen = true; menuReady = true; liveHover = hover;
            ShowLive(hover);
            Thread.Sleep(ms);
            HideMenuUi();
            Thread.Sleep(300);
            return "ok";
        }
        catch (Exception ex) { return "error: " + ex.Message; }
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
                else if (k == "latch") latchMode = v != "0";
                else if (k == "live") liveMenu = v != "0";
                else if (k == "keepReady" && (v == "press" || v == "30s" || v == "5" || v == "10" || v == "30" || v == "never")) keepReady = v;
            }
        }
        catch { }
    }
    static void SaveSettings()
    {
        try { File.WriteAllText(settingsPath, "enabled=" + (enabled ? "1" : "0") + "\r\nbutton=" + button + "\r\nholdMs=" + holdMs + "\r\nmicOk=" + (micOk ? "1" : "0") + "\r\nsetupShown=" + (setupShown ? "1" : "0") + "\r\nsendEnter=" + (sendEnter ? "1" : "0") + "\r\nkeepReady=" + keepReady + "\r\ntextOnly=" + (textOnly ? "1" : "0") + "\r\nlatch=" + (latchMode ? "1" : "0") + "\r\nlive=" + (liveMenu ? "1" : "0") + "\r\n"); } catch { }
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
    // v1.27: Windows keeps the program the person was in (VS Code) in front when a new browser window starts, so the Amit Live window came up behind it.
    // Wait for the window (its title is "Amit Live", owned by Edge or Chrome), then make it topmost for a moment, give it the focus, and let it down to a normal window.
    // v1.31: is an Amit Live window already open? Its title is "Ask Amit" (or "Ask Amit - ...", or the first page's "Amit Live"), owned by Edge or Chrome. Returns its handle, or zero.
    static int chatOpenedAt = 0;
    static IntPtr FindAmitLiveWindowNow()
    {
        IntPtr found = IntPtr.Zero;
        try
        {
            EnumWindows(delegate (IntPtr h, IntPtr l)
            {
                if (!IsWindowVisible(h)) return true;
                StringBuilder sb = new StringBuilder(256);
                GetWindowText(h, sb, 256);
                string t = sb.ToString().Trim();
                if (t != "Ask Amit" && !t.StartsWith("Ask Amit - ") && t != "Amit Live") return true;
                try
                {
                    uint pid; GetWindowThreadProcessId(h, out pid);
                    string pn = Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant();
                    if (pn == "msedge" || pn == "chrome") { found = h; return false; }
                }
                catch { }
                return true;
            }, IntPtr.Zero);
        }
        catch { }
        return found;
    }
    // bring an already open Amit Live window to the front (also from the taskbar if it was minimized) and give it the focus
    static void FrontWindow(IntPtr found)
    {
        try
        {
            SetWindowPos(found, (IntPtr)(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);
            FocusWindow(found);
            Thread.Sleep(300);
            if (GetForegroundWindow() != found) FocusWindow(found);
            SetWindowPos(found, (IntPtr)(-2), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);
        }
        catch (Exception ex) { Log("FrontWindow: " + ex.Message); }
    }
    static void BringAmitLiveFront()
    {
        try
        {
            IntPtr found = IntPtr.Zero;
            for (int i = 0; i < 50 && found == IntPtr.Zero; i++)          // up to about 10 seconds
            {
                Thread.Sleep(200);
                EnumWindows(delegate (IntPtr h, IntPtr l)
                {
                    if (!IsWindowVisible(h)) return true;
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(h, sb, 256);
                    string t = sb.ToString().Trim();
                    if (t != "Ask Amit" && !t.StartsWith("Ask Amit - ") && t != "Amit Live") return true;      // the page's title (also what the taskbar shows); "Amit Live" is the title the first published page had
                    try
                    {
                        uint pid; GetWindowThreadProcessId(h, out pid);
                        string pn = Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant();
                        if (pn == "msedge" || pn == "chrome") { found = h; return false; }
                    }
                    catch { }
                    return true;
                }, IntPtr.Zero);
            }
            if (found == IntPtr.Zero) { Log("Amit Live window: not found to bring in front"); return; }
            SetWindowPos(found, (IntPtr)(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);      // topmost, no move, no resize, show
            FocusWindow(found);
            Thread.Sleep(600);
            if (GetForegroundWindow() != found) FocusWindow(found);
            SetWindowPos(found, (IntPtr)(-2), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);      // back to a normal window (it stays in front because it is active)
            Log("Amit Live window in front = " + (GetForegroundWindow() == found));
        }
        catch (Exception ex) { Log("BringAmitLiveFront: " + ex.Message); }
    }
    // v1.29: is the internet reachable? Any answer from the Amit site counts (even an error page); no answer in 3 seconds means no.
    static bool InternetUp()
    {
        try
        {
            System.Net.ServicePointManager.SecurityProtocol |= (System.Net.SecurityProtocolType)3072;     // TLS 1.2
            System.Net.HttpWebRequest r = (System.Net.HttpWebRequest)System.Net.WebRequest.Create("https://ask-amit.github.io/Amit/ComputerHealth/amit_helper_manifest.json");
            r.Method = "HEAD"; r.Timeout = 3000; r.ReadWriteTimeout = 3000;
            using (System.Net.WebResponse w = r.GetResponse()) { return true; }
        }
        catch (System.Net.WebException wex) { return wex.Response != null; }
        catch { return false; }
    }

    // The page the Amit Live window shows when there is no internet. The bridge serves it at /amit-live-offline (it lives inside this file so no new file has to be installed).
    // It tells the person plainly, offers the Windows network settings and a Try again, and keeps the two tabs that only need the helper (My Computer, Computer Health).
    // Plain ASCII, no double quotes (this is a C# verbatim string).
    public static string OfflinePage()
    {
        return @"<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Ask Amit</title><link rel='icon' type='image/x-icon' href='/amit-icon.ico'>
<style>
:root{--bg:#09141f;--surface:#0f2338;--line:rgba(201,168,76,.55);--gold:#c9a84c;--text:#f0e8d0;--dim:rgba(240,232,208,.55)}
*{box-sizing:border-box}html,body{height:100%;margin:0;background:var(--bg);color:var(--text);font:14px/1.5 'Segoe UI',system-ui,sans-serif}
#head{position:fixed;top:0;left:0;right:0;height:64px;display:flex;align-items:center;gap:12px;padding:0 16px;background:var(--bg);border-bottom:1px solid var(--line)}
#head .brand{font-size:26px;font-weight:700;color:var(--gold);white-space:nowrap}#head .mid{flex:1;text-align:center;min-width:0}
#head .t{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#head .n{font-size:12px;color:var(--dim)}
#tabs{position:fixed;top:64px;left:0;right:0;height:38px;display:flex;gap:2px;padding:4px 8px 0;background:var(--bg);border-bottom:1px solid var(--line)}
.tab{flex:1;border:1px solid transparent;border-bottom:none;background:transparent;color:var(--dim);font:inherit;font-size:13px;font-weight:600;cursor:pointer;border-radius:8px 8px 0 0;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tab.on{background:var(--surface);color:var(--gold);border-color:var(--line)}
.pane{position:fixed;top:102px;left:0;right:0;bottom:0;display:none;overflow:auto;padding:16px;background:var(--surface)}.pane.on{display:block}
h2{margin:0 0 8px;font-size:16px;color:var(--gold)}p{margin:8px 0}.dim{color:var(--dim)}
.btn{display:inline-block;border:1px solid var(--line);background:transparent;color:var(--gold);padding:8px 12px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;margin:4px 6px 4px 0}.btn:hover{background:rgba(201,168,76,.12)}
.row{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)}
.good{color:#5fbf7a}.bad{color:#e07a6a}.warn{color:#e0b44a}
.verdict{font-size:15px;font-weight:600;margin:4px 0 12px}.tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tile{border:1px solid var(--line);border-radius:10px;padding:10px 12px}.tile .big{font-size:22px;font-weight:700;line-height:1.2}.tile .lbl{color:var(--dim);font-size:12px}
iframe{width:100%;height:430px;border:1px solid var(--line);border-radius:8px;background:#fff;margin-top:8px}
</style></head><body>
<div id='head'><div class='brand'>Amit Live</div><div class='mid'><div class='t'>Your personal computer configuration</div><div class='n' id='pcName'>&nbsp;</div></div></div>
<div id='tabs'><button class='tab on' data-t='ask'>Ask Amit</button><button class='tab' data-t='pc'>My Computer</button><button class='tab' data-t='words'>My Words</button><button class='tab' data-t='health'>Computer Health</button></div>
<div class='pane on' id='pane-ask'>
 <h2>We could not connect to your internet service</h2>
 <p>Amit needs the internet to talk with you. We would love to get you connected.</p>
 <p class='dim'>A few things to try: make sure Wi-Fi is on or the network cable is plugged in, then wait a minute. If it still does not work, turn your router off and on again.</p>
 <p><a class='btn' href='ms-settings:network-status'>Open Windows network settings</a> <a class='btn' href='ms-settings:troubleshoot'>Windows troubleshooters</a></p>
 <p><button class='btn' id='again'>Try again</button> <span id='state' class='dim'></span></p>
 <p class='dim'>This window checks again by itself every 15 seconds. The My Computer and Computer Health tabs still work without the internet.</p>
</div>
<div class='pane' id='pane-pc'><h2>My Computer</h2><div id='pcStatus'><p class='dim'>Checking the helper on this computer...</p></div><p><a class='btn' href='/whisper' target='_blank'>Open the full settings page</a></p><div id='pcFrame'></div></div>
<div class='pane' id='pane-words'><h2>My Words</h2><p>Your own fixes for how Amit hears you, spoken shortcuts, and your voice, key and mouse commands are kept with your Amit account, so they need the internet.</p><p class='dim'>They will be here again as soon as you are connected.</p></div>
<div class='pane' id='pane-health'><h2>Computer Health</h2><div id='chVerdict' class='verdict dim'>Looking at how this computer is doing...</div><div id='chTiles' class='tiles'></div><div id='chTop'></div><p class='dim' id='chStamp'></p><p class='dim'>The full Computer Health dashboard needs the internet.</p></div>
<script>
var cur='ask',frameMade=false,timer=null;
fetch('/api/device').then(function(r){return r.json();}).then(function(j){if(j&&j.deviceName)document.getElementById('pcName').textContent=j.deviceName;}).catch(function(){});
function row(a,b){return '<div class=\'row\'><span>'+a+'</span><span>'+b+'</span></div>';}
function show(t){cur=t;document.querySelectorAll('.tab').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-t')===t);});
 ['ask','pc','words','health'].forEach(function(n){document.getElementById('pane-'+n).classList.toggle('on',n===t);});
 if(t==='pc')pc(); if(t==='health')health();}
document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-t'));});});
function again(){var s=document.getElementById('state');s.textContent='Checking...';
 fetch('https://ask-amit.github.io/Amit/ComputerHealth/amit_helper_manifest.json',{mode:'no-cors',cache:'no-store'}).then(function(){location.href='https://ask-amit.github.io/Amit/ComputerHealth/AmitLive.html';}).catch(function(){s.textContent='Still not connected.';});}
document.getElementById('again').addEventListener('click',again);
setInterval(function(){if(cur==='ask')again();},15000);
function pc(){var box=document.getElementById('pcStatus');
 fetch('/api/helper/status').then(function(r){return r.json();}).then(function(j){
  box.innerHTML=row('Amit helper on this computer','<span class=\'good\'>running</span>')+row('Helper version',j.helperVersion||'unknown')+row('Can update itself',j.canUpdate?'<span class=\'good\'>yes</span>':'no');
  if(!frameMade){frameMade=true;var f=document.createElement('iframe');f.src='/whisper';document.getElementById('pcFrame').appendChild(f);}
 }).catch(function(){box.innerHTML=row('Amit helper on this computer','<span class=\'bad\'>not reachable</span>');});}
function tile(l,v,c,s){return '<div class=\'tile\'><div class=\'lbl\'>'+l+'</div><div class=\'big '+c+'\'>'+v+'</div><div class=\'lbl\'>'+(s||'')+'</div></div>';}
function health(){if(!timer){timer=setInterval(function(){if(cur==='health')health();},10000);}
 var vd=document.getElementById('chVerdict');
 fetch('/api/health-snapshot').then(function(r){return r.json();}).then(function(j){
  if(j.error)throw new Error(j.error);
  var cc=j.cpuPct>=90?'bad':j.cpuPct>=70?'warn':'good',rc=j.ramPct>=90?'bad':j.ramPct>=80?'warn':'good',dc=j.diskFreePct<10?'bad':j.diskFreePct<20?'warn':'good';
  var rk={good:0,warn:1,bad:2},w=Math.max(rk[cc],rk[rc],rk[dc]),n=[];
  if(cc!=='good')n.push('the processor is busy'); if(rc!=='good')n.push('memory is getting full'); if(dc!=='good')n.push('the main drive is running low on space');
  vd.className='verdict '+['good','warn','bad'][w];
  vd.textContent=w===0?'This computer is doing well right now.':(w===1?'Worth watching: ':'Needs attention: ')+n.join(', ')+'.';
  var up=j.uptimeHours>=48?Math.round(j.uptimeHours/24)+' days':Math.round(j.uptimeHours)+' hours';
  document.getElementById('chTiles').innerHTML=tile('Processor busy',j.cpuPct+'%',cc,'right now')+tile('Memory in use',j.ramPct+'%',rc,'of '+j.ramTotalGb+' GB')+tile('Main drive free',j.diskFreePct+'%',dc,j.diskFreeGb+' GB free')+tile('On for',up,'','since last restart');
  var top=(j.top||[]).map(function(x){return row(x.name,x.mb>=1024?(x.mb/1024).toFixed(1)+' GB':x.mb+' MB');}).join('');
  document.getElementById('chTop').innerHTML=top?'<h2 style=\'margin-top:14px\'>Using the most memory</h2>'+top:'';
  document.getElementById('chStamp').textContent='Updated '+new Date().toLocaleTimeString();
 }).catch(function(){vd.className='verdict bad';vd.textContent='Could not read this computer.';document.getElementById('chTiles').innerHTML='';document.getElementById('chTop').innerHTML='';});}
var lf=Date.now();setInterval(function(){if(document.hasFocus()){lf=Date.now();}else if(Date.now()-lf>=60000){try{window.close();}catch(e){}}},5000);
</script></body></html>";
    }

    public static string OpenHub() { return OpenHub(""); }
    // Ask Amit from the ring: the Amit Live window (ComputerHealth\AmitLive.html: tabs Ask Amit / My Computer / My Words, Ask Amit first) in a small window of its own (Edge/Chrome app mode: its own title bar and taskbar icon, movable and resizable).
    // It uses the browser's normal profile, so the person's existing Hub sign-in applies; the helper holds no login. Under 700 px wide the chat box fills the window.
    // No Edge or Chrome found: the Hub opens in the default browser instead.
    public static string OpenChatWindow()
    {
        try
        {
            // v1.31: one Amit Live window only. Already open: bring it to the front and stop (a second press used to open another one). Started a moment ago and still loading: start nothing.
            IntPtr already = FindAmitLiveWindowNow();
            if (already != IntPtr.Zero) { FrontWindow(already); Log("Amit Live window was already open: brought it to the front"); return "{\"ok\":true,\"already\":true}"; }
            if (chatOpenedAt != 0 && Environment.TickCount - chatOpenedAt < 12000) { Log("Amit Live window is still opening: no second one started"); return "{\"ok\":true,\"already\":true}"; }
            string exe = FindBrowser();
            if (exe == null) return OpenHub("?ask=amit");
            // v1.29: with no internet the live page cannot load at all (the browser would show its own error), so the helper opens its own offline page instead
            bool up = InternetUp();
            string url = up ? "https://ask-amit.github.io/Amit/ComputerHealth/AmitLive.html" : "http://localhost:" + bridgePort + "/amit-live-offline";
            if (!up) Log("No internet: opened the offline Amit Live page");
            // v1.30: a quarter of the screen's width and half its height (the screen the pointer was on), but never smaller than 480 x 520
            int w = 640, h = 720;
            try { Rectangle wa = Screen.FromPoint(new Point(menuOpenX, menuOpenY)).WorkingArea; w = Math.Max(480, wa.Width / 4); h = Math.Max(520, wa.Height / 2); } catch { }
            ProcessStartInfo psi = new ProcessStartInfo(exe, "--app=" + url + " --window-size=" + w + "," + h);
            psi.UseShellExecute = false;
            chatOpenedAt = Environment.TickCount;
            Process.Start(psi);
            Log("Opened the Ask Amit chat window");
            ThreadPool.QueueUserWorkItem(delegate { BringAmitLiveFront(); });   // v1.27: it opened BEHIND VS Code; put it in front
            return "{\"ok\":true}";
        }
        catch (Exception ex) { Log("OpenChatWindow: " + ex.Message); return OpenHub("?ask=amit"); }
    }
    // v1.32: the Show Amit button hands a saved picture to the Amit Live window, which posts it into the person's chat for today under their own sign-in
    // (the helper holds no login). The window asks /api/showamit/pending for it; it is offered for 5 minutes, then forgotten.
    static string shotPath, shotTitle = "", shotText = "", shotId = "";
    static DateTime shotAt = DateTime.MinValue;
    public static string SendShotToAmit(string pngPath, string title, string text)
    {
        try
        {
            if (String.IsNullOrEmpty(pngPath) || !File.Exists(pngPath)) return "{\"ok\":false,\"error\":\"no picture\"}";
            if (new FileInfo(pngPath).Length > 25 * 1024 * 1024) return "{\"ok\":false,\"error\":\"the picture is too large\"}";
            shotPath = pngPath; shotTitle = (title ?? "").Trim(); shotText = (text ?? "").Trim();
            if (shotText.Length > 600) shotText = shotText.Substring(0, 600);
            shotId = ((long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds).ToString(); shotAt = DateTime.UtcNow;
            Log("Show Amit: picture handed to the Amit Live window (" + Path.GetFileName(pngPath) + ")");
            ThreadPool.QueueUserWorkItem(delegate { OpenChatWindow(); });
            return "{\"ok\":true}";
        }
        catch (Exception ex) { return "{\"ok\":false,\"error\":\"" + JsonEsc(ex.Message) + "\"}"; }
    }
    public static string ShotPendingJson()
    {
        try
        {
            if (shotPath == null || !File.Exists(shotPath) || (DateTime.UtcNow - shotAt).TotalMinutes > 5) return "{\"id\":\"\"}";
            return "{\"id\":\"" + shotId + "\",\"name\":\"" + JsonEsc(Path.GetFileName(shotPath)) + "\",\"title\":\"" + JsonEsc(shotTitle) + "\",\"text\":\"" + JsonEsc(shotText) + "\",\"bytes\":" + new FileInfo(shotPath).Length + "}";
        }
        catch { return "{\"id\":\"\"}"; }
    }
    public static byte[] ShotPendingBytes(string id)
    {
        try { if (shotPath == null || id != shotId || (DateTime.UtcNow - shotAt).TotalMinutes > 5 || !File.Exists(shotPath)) return null; return File.ReadAllBytes(shotPath); }
        catch { return null; }
    }
    // query: "" for the plain Hub, "?ask=amit" to have the Hub open the Ask Amit chat box once the person is signed in (the browser's own login is used; the helper holds none)
    public static string OpenHub(string query)
    {
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("https://ask-amit.github.io/Amit/Hub/amit-hub.html" + query);
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

    // how many Show Amit windows are open (the updater never restarts the helper while one is, so nothing unsaved is lost)
    static int OpenEditorCount() { lock (editorsLock) { return openEditors.Count; } }

    public static string StartLearn() { learning = true; return StatusJson(); }
    public static string CancelLearn() { learning = false; return StatusJson(); }

    public static string StatusJson()
    {
        string st;
        lock (sync) { st = state == ST_IDLE ? "idle" : state == ST_PENDING ? "pending" : state == ST_LISTEN ? "listening" : state == ST_FINISH ? "finishing" : state == ST_STOPPEND ? "stopping" : state == ST_MENU ? "menu" : "drag"; }
        return "{\"version\":\"" + Version + "\",\"enabled\":" + (enabled ? "true" : "false") + ",\"button\":\"" + button + "\",\"holdMs\":" + holdMs
            + ",\"sendEnter\":" + (sendEnter ? "true" : "false") + ",\"keepReady\":\"" + keepReady + "\",\"textOnly\":" + (textOnly ? "true" : "false") + ",\"hook\":" + (hookOk ? "true" : "false") + ",\"page\":" + (PageAlive() ? "true" : "false") + ",\"micOk\":" + (micOk ? "true" : "false")
            + ",\"live\":" + (liveMenu ? "true" : "false") + ",\"hotkeyWarn\":\"" + JsonEsc(hotkeyWarn) + "\",\"editors\":" + OpenEditorCount() + ",\"learning\":" + (learning ? "true" : "false") + ",\"state\":\"" + st + "\",\"browser\":\"" + browserUsed + "\"}";
    }

    // =====================================================================================================
    //  My Words and Voice commands (v1.23)
    //  The person's list (mishearing fixes, spoken shortcuts, voice / key / mouse commands) is kept in the database under their Hub login.
    //  This computer keeps only a small plain-text copy, my_words.txt, loaded into memory once: matching a phrase never touches the
    //  disk or the network, and nothing here polls. The Hub (which has the login) sends the list down and collects any local changes
    //  (/api/words/sync, /api/words/ack). Escaped one-line-per-row format: kind|id|f1|f2|f3|f4|f5|f6|updated|pending
    //    fix      f1 = what it comes out as, f2 = what was meant
    //    shortcut f1 = the phrase said, f2 = the longer instruction it stands for
    //    command  f1 = trigger type (voice | key | mouse), f2 = the trigger (a phrase, a key such as pause, a mouse button),
    //             f3 = the action (dictate, showamit, openhub, cancel, voice, ring), f4 = label, f5 = 1 if it asks first, f6 = 1 if on
    // =====================================================================================================
    class WordRow
    {
        public string Kind = "", Id = "", F1 = "", F2 = "", F3 = "", F4 = "", F5 = "", F6 = "", Updated = "", Pending = "";
    }
    class VoiceCand
    {
        public string Phrase = "", Action = "", Label = "", Kind = "command", Text = "";
        public bool Confirm = false;
        public double Score = 0;
    }
    class VoiceResult
    {
        public string Mode = "none";     // run | pick | none
        public VoiceCand Chosen;
        public List<VoiceCand> Options = new List<VoiceCand>();
        public string Heard = "";
    }

    static readonly object wordsLock = new object();
    static List<WordRow> wordRows = new List<WordRow>();
    static string wordsPathOverride = null;
    static string hotkeyWarn = "";
    const int MaxWordRows = 2000;
    const int VoiceListenSeconds = 12;
    static readonly string[] KnownActions = new string[] { "dictate", "showamit", "openhub", "cancel", "voice", "ring" };

    static string WordsPath()
    {
        if (wordsPathOverride != null) return wordsPathOverride;
        return Path.Combine(Path.GetDirectoryName(settingsPath), "my_words.txt");
    }

    static string WEsc(string s) { if (s == null) return ""; return s.Replace("\\", "\\\\").Replace("|", "\\p").Replace("\r", "").Replace("\n", "\\n"); }
    static string WUnesc(string s)
    {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.Length; i++)
        {
            char c = s[i];
            if (c == '\\' && i + 1 < s.Length)
            {
                char n = s[i + 1];
                if (n == 'p') { sb.Append('|'); i++; continue; }
                if (n == 'n') { sb.Append('\n'); i++; continue; }
                if (n == '\\') { sb.Append('\\'); i++; continue; }
            }
            sb.Append(c);
        }
        return sb.ToString();
    }
    static string WClean(string s, int max)
    {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        foreach (char c in s) sb.Append(c == '\n' ? '\n' : (c < ' ' ? ' ' : c));
        string t = sb.ToString().Trim();
        return t.Length > max ? t.Substring(0, max) : t;
    }
    static string JsonEsc(string s)
    {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        foreach (char c in s)
        {
            if (c == '\\') sb.Append("\\\\");
            else if (c == '"') sb.Append("\\\"");
            else if (c == '\n') sb.Append("\\n");
            else if (c == '\r') { }
            else if (c == '\t') sb.Append("\\t");
            else if (c < ' ') sb.Append(' ');
            else sb.Append(c);
        }
        return sb.ToString();
    }

    static string WordsLine(WordRow r, bool withPending)
    {
        string s = WEsc(r.Kind) + "|" + WEsc(r.Id) + "|" + WEsc(r.F1) + "|" + WEsc(r.F2) + "|" + WEsc(r.F3) + "|" + WEsc(r.F4) + "|" + WEsc(r.F5) + "|" + WEsc(r.F6) + "|" + WEsc(r.Updated);
        return withPending ? s + "|" + WEsc(r.Pending) : s;
    }

    static WordRow ParseWordLine(string line, bool hasPending)
    {
        if (String.IsNullOrEmpty(line)) return null;
        string[] p = line.Split('|');
        if (p.Length < 9) return null;
        WordRow r = new WordRow();
        r.Kind = WClean(WUnesc(p[0]), 12).ToLowerInvariant();
        if (r.Kind != "fix" && r.Kind != "shortcut" && r.Kind != "command") return null;
        r.Id = WClean(WUnesc(p[1]), 64);
        if (r.Id.Length == 0) return null;
        r.F1 = WClean(WUnesc(p[2]), 120);
        r.F2 = WClean(WUnesc(p[3]), 1000);
        r.F3 = WClean(WUnesc(p[4]), 200);
        r.F4 = WClean(WUnesc(p[5]), 200);
        r.F5 = WClean(WUnesc(p[6]), 4);
        r.F6 = WClean(WUnesc(p[7]), 4);
        r.Updated = WClean(WUnesc(p[8]), 40);
        if (hasPending && p.Length > 9) { string pd = WClean(WUnesc(p[9]), 8); if (pd == "new" || pd == "edit" || pd == "del") r.Pending = pd; }
        if (r.F1.Length == 0) return null;
        return r;
    }

    static void WordsLoad()
    {
        lock (wordsLock)
        {
            wordRows = new List<WordRow>();
            try
            {
                string path = WordsPath();
                if (!File.Exists(path)) return;
                foreach (string line in File.ReadAllLines(path, Encoding.UTF8))
                {
                    WordRow r = ParseWordLine(line, true);
                    if (r != null && wordRows.Count < MaxWordRows) wordRows.Add(r);
                }
            }
            catch (Exception ex) { Log("Words: could not read my_words.txt (" + ex.Message + ")"); }
        }
    }

    // caller holds wordsLock
    static void WordsSave()
    {
        try
        {
            StringBuilder sb = new StringBuilder();
            foreach (WordRow r in wordRows) sb.Append(WordsLine(r, true)).Append("\r\n");
            string path = WordsPath();
            string tmp = path + ".tmp";
            File.WriteAllText(tmp, sb.ToString(), new UTF8Encoding(false));
            if (File.Exists(path)) File.Delete(path);
            File.Move(tmp, path);
        }
        catch (Exception ex) { Log("Words: could not save my_words.txt (" + ex.Message + ")"); }
    }

    // A web page can only reach these calls from the Amit site (or this computer): the browser fills in the Origin and a page cannot change it.
    public static bool OriginAllowed(string origin)
    {
        if (String.IsNullOrEmpty(origin)) return true;     // not a web page: a program on this computer (it could edit the file itself anyway)
        if (origin == "https://ask-amit.github.io") return true;
        if (origin.StartsWith("http://localhost") || origin.StartsWith("http://127.0.0.1")) return true;
        return false;
    }

    // ---------- the Hub sends the whole list; local changes not yet in the database are kept and handed back ----------
    // body: one row per line (kind|id|f1..f6|updated). Reply: "ok|<rows>|<warning>" then the rows still waiting to be saved to the database.
    public static string WordsSync(string body)
    {
        List<WordRow> incoming = new List<WordRow>();
        if (body != null)
            foreach (string line in body.Split('\n'))
            {
                WordRow r = ParseWordLine(line.TrimEnd('\r'), false);
                if (r != null && incoming.Count < MaxWordRows) incoming.Add(r);
            }
        string reply;
        lock (wordsLock)
        {
            List<WordRow> keep = new List<WordRow>();
            foreach (WordRow r in wordRows) if (r.Pending != "") keep.Add(r);
            List<WordRow> merged = new List<WordRow>();
            foreach (WordRow r in incoming)
            {
                bool shadow = false;
                foreach (WordRow k in keep) if (k.Id == r.Id) { shadow = true; break; }
                if (!shadow) merged.Add(r);
            }
            merged.AddRange(keep);
            wordRows = merged;
            WordsSave();
            StringBuilder sb = new StringBuilder();
            foreach (WordRow k in keep) sb.Append("\n").Append(WordsLine(k, true));
            reply = "ok|" + wordRows.Count + "|" + WEsc(hotkeyWarn) + sb.ToString();
        }
        Log("Words: the Hub sent " + incoming.Count + " rows");
        ApplyBindings();
        return reply;
    }

    // body: lines "id|newid" for rows the Hub has now saved to the database (a deleted row is removed, others become ordinary rows)
    public static string WordsAck(string body)
    {
        int n = 0;
        lock (wordsLock)
        {
            if (body != null)
                foreach (string line in body.Split('\n'))
                {
                    string[] p = line.TrimEnd('\r').Split('|');
                    if (p.Length < 1 || p[0].Length == 0) continue;
                    string id = WClean(WUnesc(p[0]), 64), newId = p.Length > 1 ? WClean(WUnesc(p[1]), 64) : "";
                    for (int i = 0; i < wordRows.Count; i++)
                    {
                        if (wordRows[i].Id != id || wordRows[i].Pending == "") continue;
                        if (wordRows[i].Pending == "del") wordRows.RemoveAt(i);
                        else { wordRows[i].Pending = ""; if (newId.Length > 0) wordRows[i].Id = newId; }
                        n++;
                        break;
                    }
                }
            WordsSave();
        }
        return "ok|" + n;
    }

    // a change made on this computer (not yet in the database). Used by Amit Live itself; the Hub collects it on its next sync.
    public static void WordsAddLocal(string kind, string f1, string f2)
    {
        if ((kind != "fix" && kind != "shortcut") || String.IsNullOrEmpty(f1)) return;
        lock (wordsLock)
        {
            WordRow r = new WordRow();
            r.Kind = kind; r.Id = "L" + DateTime.UtcNow.Ticks; r.F1 = WClean(f1, 120); r.F2 = WClean(f2, 1000);
            r.Updated = DateTime.UtcNow.ToString("o"); r.Pending = "new";
            wordRows.Add(r);
            WordsSave();
        }
    }

    public static string WordsGet()
    {
        lock (wordsLock)
        {
            StringBuilder sb = new StringBuilder();
            foreach (WordRow r in wordRows) sb.Append(WordsLine(r, true)).Append("\n");
            return "{\"ok\":true,\"count\":" + wordRows.Count + ",\"text\":\"" + JsonEsc(sb.ToString()) + "\"}";
        }
    }

    // ---------- turning the list into what can be said ----------
    static bool IsFiller(string w) { return w == "um" || w == "uh" || w == "er" || w == "erm" || w == "please" || w == "hey" || w == "okay" || w == "ok" || w == "the"; }

    static string NormPhrase(string s)
    {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        foreach (char ch in s.ToLowerInvariant()) sb.Append(Char.IsLetterOrDigit(ch) ? ch : ' ');
        string[] w = sb.ToString().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        StringBuilder o = new StringBuilder();
        foreach (string x in w) { if (IsFiller(x)) continue; if (o.Length > 0) o.Append(' '); o.Append(x); }
        return o.ToString();
    }

    static string ReplaceWords(string s, string from, string to)
    {
        if (from.Length == 0) return s;
        string p = " " + s + " ";
        p = p.Replace(" " + from + " ", " " + to + " ");
        return p.Trim();
    }

    static readonly string[] AmitSoundsLike = new string[] { "a meet", "emmet", "ammit", "a mitt", "hammett", "a mit", "amate", "ammet", "ah meet" };

    // the person's own mishearing fixes (and the common ways the speech engine writes "Amit") applied to what was heard
    static string ApplyFixes(string norm)
    {
        string s = norm;
        foreach (string a in AmitSoundsLike) s = ReplaceWords(s, a, "amit");
        lock (wordsLock)
        {
            foreach (WordRow r in wordRows)
            {
                if (r.Kind != "fix" || r.Pending == "del") continue;
                s = ReplaceWords(s, NormPhrase(r.F1), NormPhrase(r.F2));
            }
        }
        return s;
    }

    static void AddBuiltIn(List<VoiceCand> l, string action, string label, bool confirm, params string[] phrases)
    {
        foreach (string p in phrases)
        {
            VoiceCand c = new VoiceCand();
            c.Phrase = NormPhrase(p); c.Action = action; c.Label = label; c.Confirm = confirm;
            l.Add(c);
        }
    }

    static List<VoiceCand> BuiltInCommands()
    {
        List<VoiceCand> l = new List<VoiceCand>();
        AddBuiltIn(l, "dictate", "Dictate", false, "dictate", "dictation", "start dictation", "talk to type", "type for me");
        AddBuiltIn(l, "showamit", "Show Amit", false, "show amit", "snapshot", "screenshot", "show an area");
        AddBuiltIn(l, "openhub", "Open the Amit Hub", false, "open amit hub", "open hub", "amit hub", "open my hub", "go to hub");
        AddBuiltIn(l, "cancel", "Cancel", false, "cancel", "never mind", "stop", "close");
        return l;
    }

    // everything that can be said: the person's own rows first (so theirs win), then the built-in ones
    static List<VoiceCand> VoiceCands()
    {
        List<VoiceCand> l = new List<VoiceCand>();
        lock (wordsLock)
        {
            foreach (WordRow r in wordRows)
            {
                if (r.Pending == "del") continue;
                if (r.Kind == "command" && r.F1 == "voice" && r.F6 != "0")
                {
                    VoiceCand c = new VoiceCand();
                    c.Phrase = NormPhrase(r.F2); c.Action = r.F3.ToLowerInvariant(); c.Label = r.F4.Length > 0 ? r.F4 : r.F3; c.Confirm = r.F5 == "1";
                    if (c.Phrase.Length > 0) l.Add(c);
                }
                else if (r.Kind == "shortcut")
                {
                    VoiceCand c = new VoiceCand();
                    c.Phrase = NormPhrase(r.F1); c.Action = "shortcut"; c.Kind = "shortcut"; c.Label = r.F1; c.Text = r.F2;
                    if (c.Phrase.Length > 0) l.Add(c);
                }
            }
        }
        l.AddRange(BuiltInCommands());
        return l;
    }

    static int Lev(string a, string b)
    {
        int[] prev = new int[b.Length + 1], cur = new int[b.Length + 1];
        for (int j = 0; j <= b.Length; j++) prev[j] = j;
        for (int i = 1; i <= a.Length; i++)
        {
            cur[0] = i;
            for (int j = 1; j <= b.Length; j++)
            {
                int cost = a[i - 1] == b[j - 1] ? 0 : 1;
                cur[j] = Math.Min(Math.Min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] t = prev; prev = cur; cur = t;
        }
        return prev[b.Length];
    }

    static double Similarity(string a, string b)
    {
        int m = Math.Max(a.Length, b.Length);
        if (m == 0) return 0;
        double s = 1.0 - (double)Lev(a, b) / m;
        string pa = " " + a + " ", pb = " " + b + " ";
        if ((pa.Contains(pb) || pb.Contains(pa)) && Math.Min(a.Length, b.Length) >= 4) s = Math.Max(s, 0.8);
        return s;
    }

    static string CandKey(VoiceCand c) { return c.Action + "|" + c.Label + "|" + c.Text; }

    // exact match to one command = run it; unclear or several = a numbered list; nothing close = none
    static VoiceResult ResolveVoice(string heard)
    {
        VoiceResult r = new VoiceResult();
        r.Heard = heard ?? "";
        string n = ApplyFixes(NormPhrase(heard));
        if (n.Length == 0) return r;
        List<VoiceCand> cands = VoiceCands();
        List<VoiceCand> exact = new List<VoiceCand>();
        Dictionary<string, bool> seen = new Dictionary<string, bool>();
        foreach (VoiceCand c in cands)
            if (c.Phrase == n && !seen.ContainsKey(CandKey(c))) { seen[CandKey(c)] = true; exact.Add(c); }
        if (exact.Count == 1) { r.Mode = "run"; r.Chosen = exact[0]; return r; }
        if (exact.Count > 1) { r.Mode = "pick"; r.Options = exact; if (r.Options.Count > 5) r.Options.RemoveRange(5, r.Options.Count - 5); return r; }
        Dictionary<string, VoiceCand> best = new Dictionary<string, VoiceCand>();
        foreach (VoiceCand c in cands)
        {
            double s = Similarity(n, c.Phrase);
            if (s < 0.55) continue;
            string key = CandKey(c);
            if (best.ContainsKey(key) && best[key].Score >= s) continue;
            VoiceCand cp = new VoiceCand();
            cp.Phrase = c.Phrase; cp.Action = c.Action; cp.Label = c.Label; cp.Kind = c.Kind; cp.Text = c.Text; cp.Confirm = c.Confirm; cp.Score = s;
            best[key] = cp;
        }
        List<VoiceCand> list = new List<VoiceCand>(best.Values);
        list.Sort(delegate (VoiceCand a, VoiceCand b) { return b.Score.CompareTo(a.Score); });
        if (list.Count > 5) list.RemoveRange(5, list.Count - 5);
        if (list.Count > 0) { r.Mode = "pick"; r.Options = list; }
        return r;
    }

    // a spoken number or answer: 1..max = that choice, 0 = cancel / no, -1 = not understood
    static int ParseChoice(string heard, int max)
    {
        string s = NormPhrase(heard);
        if (s.StartsWith("number ")) s = s.Substring(7);
        if (s.Length == 0) return -1;
        string w = s.Split(' ')[0];
        if (w == "1" || w == "one" || w == "won" || w == "yes" || w == "yeah" || w == "yep" || w == "sure" || w == "confirm") return max >= 1 ? 1 : -1;
        if (w == "2" || w == "two" || w == "to" || w == "too" || w == "tu") return max >= 2 ? 2 : -1;
        if (w == "3" || w == "three" || w == "tree") return max >= 3 ? 3 : -1;
        if (w == "4" || w == "four" || w == "for" || w == "fore") return max >= 4 ? 4 : -1;
        if (w == "5" || w == "five") return max >= 5 ? 5 : -1;
        if (w == "no" || w == "nope" || w == "cancel" || w == "none" || w == "nothing" || w == "stop" || w == "never") return 0;
        return -1;
    }

    // ---------- Voice: one press, one phrase (a number or yes/no is the one follow-up) ----------
    static volatile bool voiceMode = false;
    static int voicePhase = 0;                 // 1 = a command, 2 = a number from a list, 3 = yes or no
    static List<VoiceCand> voiceOptions = new List<VoiceCand>();
    static VoiceCand voicePending = null;
    static int voiceX = 0, voiceY = 0;

    static string VoiceHelpText()
    {
        StringBuilder sb = new StringBuilder("Amit is listening\nYou can say: Dictate, Show Amit, Open the Hub, Cancel");
        int extra = 0;
        lock (wordsLock)
        {
            foreach (WordRow r in wordRows)
                if (r.Kind == "command" && r.F1 == "voice" && r.F6 != "0" && r.Pending != "del" && extra < 3) { sb.Append(", ").Append(r.F4.Length > 0 ? r.F4 : r.F2); extra++; }
        }
        return sb.ToString();
    }

    static void StartVoice()
    {
        POINT p; int x = 0, y = 0;
        if (GetCursorPos(out p)) { x = p.x; y = p.y; }
        StartVoiceListen(x, y, 1);
    }

    static void StartVoiceListen(int x, int y, int phase)
    {
        long t;
        lock (sync)
        {
            if (state != ST_IDLE) { Log("Voice: not started, Amit is busy (state " + state + ")"); return; }
            state = ST_LISTEN; t = ++token;
            voiceMode = true; voicePhase = phase; voiceX = x; voiceY = y;
            latched = false; placing = false; lastSpeech = DateTime.UtcNow;
            if (silenceTimer != null) { silenceTimer.Dispose(); silenceTimer = null; }
            lock (holdLock) { holdBuf.Length = 0; }
            startSent = false; typedAny = false; audioStarted = false; segTyped = 0; lastInterim = ""; endedEvt.Reset();
            correctionOk = false; curTyped = ""; phraseStarted = false; typingAborted = false; fgAtStart = IntPtr.Zero; lastTargetName = ""; modeReady.Reset(); typeModeDecided = false; typeMode = 0; targetChecked = false; abortMsg = "";
            if (capTimer != null) capTimer.Dispose();
            capTimer = new System.Threading.Timer(delegate { VoiceTimeout(t); }, null, VoiceListenSeconds * 1000, Timeout.Infinite);
        }
        lastUse = DateTime.UtcNow;
        Log("Voice: listening (phase " + phase + ")");
        ThreadPool.QueueUserWorkItem(delegate { BeginDictation(x, y, t, false); });
    }

    static void VoiceTimeout(long t)
    {
        lock (sync) { if (state != ST_LISTEN || token != t || !voiceMode) return; state = ST_FINISH; }
        EndVoice(t, "");
    }

    static void VoiceInterim(string text)
    {
        lock (sync) { lastInterim = text; }
        if (text.Length > 0) { lastSpeech = DateTime.UtcNow; ShowOverlay("Amit is listening\n" + Tail(text)); }
    }

    static void VoiceFinal(string text)
    {
        long t = 0; bool go = false;
        lock (sync) { if (state == ST_LISTEN && voiceMode) { state = ST_FINISH; t = token; go = true; } }
        if (!go) return;
        ThreadPool.QueueUserWorkItem(delegate { EndVoice(t, text); });
    }

    static void EndVoice(long t, string phrase)
    {
        int phase, x, y;
        try
        {
            if (capTimer != null) { capTimer.Dispose(); capTimer = null; }
            if (startSent)
            {
                Command("stop");
                endedEvt.WaitOne(2500);
                startSent = false;
            }
            if (String.IsNullOrEmpty(phrase)) { lock (sync) { phrase = lastInterim; } }
            lock (sync) { lastInterim = ""; }
        }
        catch (Exception ex) { Log("EndVoice: " + ex.Message); }
        phase = voicePhase; x = voiceX; y = voiceY;
        voiceMode = false;
        lock (sync) { if (token == t && state == ST_FINISH) state = ST_IDLE; }
        try { HandleVoicePhrase(phrase == null ? "" : phrase.Trim(), phase, x, y); }
        catch (Exception ex2) { Log("Voice: " + ex2.Message); }
    }

    static string VoiceListText(List<VoiceCand> opts)
    {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < opts.Count; i++) sb.Append("\n").Append(i + 1).Append("   ").Append(opts[i].Label);
        return sb.ToString();
    }

    static void HandleVoicePhrase(string phrase, int phase, int x, int y)
    {
        Log("Voice: heard \"" + phrase + "\" (phase " + phase + ")");
        if (phase == 2)
        {
            int n = ParseChoice(phrase, voiceOptions.Count);
            if (n > 0) { RunVoice(voiceOptions[n - 1], phrase, x, y); return; }
            ShowOverlay(n == 0 ? "Cancelled" : "Amit did not catch that number\nNothing was run.");
            HideOverlayLater(2200);
            return;
        }
        if (phase == 3)
        {
            int n = ParseChoice(phrase, 2);
            if (n == 1 && voicePending != null) { VoiceCand c = voicePending; voicePending = null; RunVoice(c, phrase, x, y, true); return; }
            voicePending = null;
            ShowOverlay("Cancelled\nNothing was run.");
            HideOverlayLater(2200);
            return;
        }
        if (phrase.Length == 0)
        {
            ShowOverlay("Amit did not hear anything\nPress the key and try again.");
            HideOverlayLater(2600);
            return;
        }
        VoiceResult r = ResolveVoice(phrase);
        if (r.Mode == "run")
        {
            if (r.Chosen.Confirm)
            {
                voicePending = r.Chosen;
                ShowOverlay("Run " + r.Chosen.Label + "?\n1   Yes\n2   No\nSay the number");
                StartVoiceListen(x, y, 3);
                return;
            }
            RunVoice(r.Chosen, phrase, x, y);
            return;
        }
        if (r.Mode == "pick")
        {
            voiceOptions = r.Options;
            ShowOverlay("Did you mean" + VoiceListText(r.Options) + "\nSay the number");
            StartVoiceListen(x, y, 2);
            return;
        }
        ShowOverlay("Amit did not catch that\nHeard: " + Tail(phrase) + "\nYou can say: Dictate, Show Amit, Open the Hub, Cancel");
        HideOverlayLater(6000);
    }

    static void RunVoice(VoiceCand c, string heard, int x, int y) { RunVoice(c, heard, x, y, false); }
    static void RunVoice(VoiceCand c, string heard, int x, int y, bool confirmed)
    {
        Log("Voice: running " + c.Action + " (" + c.Label + ")");
        if (c.Kind == "shortcut")
        {
            string txt = c.Text.Length > 90 ? c.Text.Substring(0, 90) + "..." : c.Text;
            ShowOverlay("Shortcut: " + c.Label + "\n" + txt + "\nSending shortcuts to Amit is not connected yet.");
            HideOverlayLater(7000);
            return;
        }
        if (c.Action == "dictate") { HideOverlay(); StartDictationFromMenu(x, y); return; }
        if (c.Action == "showamit") { HideOverlay(); StartShowAmit(); return; }
        if (c.Action == "openhub") { ShowOverlay("Opening the Amit Hub"); HideOverlayLater(1500); OpenHub(); return; }
        if (c.Action == "cancel") { ShowOverlay("Cancelled"); HideOverlayLater(1200); return; }
        if (c.Action == "voice") { StartVoiceListen(x, y, 1); return; }
        ShowOverlay(c.Label + "\nThat command is not available on this computer yet.");
        HideOverlayLater(3500);
    }

    // ---------- keys and the mouse: what the person set up in the Hub ----------
    // keys are registered with Windows (RegisterHotKey): nothing is watching the keyboard, so it costs nothing while idle, and Windows
    // refuses a key another program already holds (the warning below, shown in the Hub)
    [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h, int id, uint mods, uint vk);
    [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h, int id);
    [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);

    class HotkeyWindow : NativeWindow
    {
        protected override void WndProc(ref Message m)
        {
            if (m.Msg == 0x0312) { OnHotkey(m.WParam.ToInt32()); return; }
            if (m.Msg == 0x8010) { ReapplyKeys(this.Handle); return; }
            base.WndProc(ref m);
        }
    }
    static HotkeyWindow hotWin;
    static Thread hotThread;
    static readonly List<int> hotIds = new List<int>();
    static readonly Dictionary<int, string> hotActions = new Dictionary<int, string>();
    static int hotNext = 100;

    // "pause", "f9", "scrolllock", "ctrl+alt+v" ... Not allowed: the Windows key, Caps Lock, or a modifier on its own.
    static bool ParseKey(string spec, out uint mods, out uint vk)
    {
        mods = 0; vk = 0;
        if (String.IsNullOrEmpty(spec)) return false;
        string[] parts = spec.ToLowerInvariant().Replace(" ", "").Split('+');
        foreach (string p0 in parts)
        {
            string p = p0;
            if (p == "ctrl" || p == "control") { mods |= 2; continue; }
            if (p == "alt") { mods |= 1; continue; }
            if (p == "shift") { mods |= 4; continue; }
            if (p == "win" || p == "windows" || p == "capslock" || p == "caps") return false;
            if (vk != 0) return false;
            if (p == "pause" || p == "break" || p == "pausebreak") vk = 0x13;
            else if (p == "scrolllock" || p == "scroll") vk = 0x91;
            else if (p == "insert") vk = 0x2D;
            else if (p == "home") vk = 0x24;
            else if (p == "end") vk = 0x23;
            else if (p == "pageup") vk = 0x21;
            else if (p == "pagedown") vk = 0x22;
            else if (p.Length >= 2 && p[0] == 'f')
            {
                int n;
                if (Int32.TryParse(p.Substring(1), out n) && n >= 1 && n <= 24) vk = (uint)(0x70 + n - 1); else return false;
            }
            else if (p.Length == 1 && ((p[0] >= 'a' && p[0] <= 'z') || (p[0] >= '0' && p[0] <= '9'))) vk = (uint)Char.ToUpperInvariant(p[0]);
            else return false;
        }
        return vk != 0;
    }

    static List<string[]> KeyBindings()
    {
        List<string[]> l = new List<string[]>();
        bool hasVoice = false;
        lock (wordsLock)
        {
            foreach (WordRow r in wordRows)
            {
                if (r.Kind != "command" || r.F1 != "key" || r.F6 == "0" || r.Pending == "del") continue;
                string a = r.F3.ToLowerInvariant();
                if (Array.IndexOf(KnownActions, a) < 0) continue;
                l.Add(new string[] { r.F2, a });
                if (a == "voice") hasVoice = true;
            }
        }
        if (!hasVoice) l.Add(new string[] { "pause", "voice" });     // the default way to start Voice (Pause/Break)
        return l;
    }

    static void StartHotkeys()
    {
        if (hotThread != null) return;
        hotThread = new Thread(delegate ()
        {
            try
            {
                hotWin = new HotkeyWindow();
                hotWin.CreateHandle(new CreateParams());
                ReapplyKeys(hotWin.Handle);
                Application.Run();
            }
            catch (Exception ex) { Log("Hotkeys: " + ex.Message); }
        });
        hotThread.IsBackground = true;
        hotThread.SetApartmentState(ApartmentState.STA);
        hotThread.Start();
    }

    static void ReapplyKeys(IntPtr h)
    {
        foreach (int id in hotIds) { try { UnregisterHotKey(h, id); } catch { } }
        hotIds.Clear(); hotActions.Clear();
        StringBuilder warn = new StringBuilder();
        foreach (string[] kb in KeyBindings())
        {
            uint mods, vk;
            if (!ParseKey(kb[0], out mods, out vk)) { warn.Append("The key \"" + kb[0] + "\" cannot be used. "); continue; }
            int id = ++hotNext;
            if (RegisterHotKey(h, id, mods | 0x4000, vk)) { hotIds.Add(id); hotActions[id] = kb[1]; Log("Hotkey registered: " + kb[0] + " -> " + kb[1]); }
            else warn.Append("Windows would not give Amit the key \"" + kb[0] + "\" (another program is using it). ");
        }
        hotkeyWarn = warn.ToString();
        if (hotkeyWarn.Length > 0) Log("Hotkey warning: " + hotkeyWarn);
    }

    static void OnHotkey(int id)
    {
        string a;
        if (!hotActions.TryGetValue(id, out a)) return;
        if (!enabled) return;
        ThreadPool.QueueUserWorkItem(delegate { RunAction(a); });
    }

    static void RunAction(string a)
    {
        POINT p; int x = 0, y = 0;
        if (GetCursorPos(out p)) { x = p.x; y = p.y; }
        Log("Key: " + a);
        if (a == "voice") StartVoice();
        else if (a == "dictate") StartDictationFromMenu(x, y);
        else if (a == "showamit") StartShowAmit();
        else if (a == "openhub") OpenHub();
        else if (a == "cancel") { HideOverlay(); }
    }

    // after the list changes: the ring's trigger button follows the person's mouse row, and the keys are registered again
    static void ApplyBindings()
    {
        try
        {
            string newButton = null, newVoice = null;
            lock (wordsLock)
            {
                foreach (WordRow r in wordRows)
                {
                    if (r.Kind != "command" || r.F1 != "mouse" || r.F6 == "0" || r.Pending == "del") continue;
                    string b = r.F2.ToLowerInvariant();
                    bool okBtn = (b == "right" || b == "middle" || b == "x1" || b == "x2");
                    if (r.F3.ToLowerInvariant() == "ring" && okBtn) newButton = b;
                    else if (r.F3.ToLowerInvariant() == "voice" && okBtn) newVoice = b;
                    else if (r.F3.Length > 0) Log("Mouse row kept but not applied yet: " + b + " -> " + r.F3);
                }
            }
            voiceButton = (newVoice != null) ? newVoice : "middle";
            if (newButton != null && newButton != button) { button = newButton; SaveSettings(); Log("The ring's mouse button is now " + button + " (from the person's list)"); }
            if (hotWin != null && hotWin.Handle != IntPtr.Zero) PostMessage(hotWin.Handle, 0x8010, IntPtr.Zero, IntPtr.Zero);
        }
        catch (Exception ex) { Log("ApplyBindings: " + ex.Message); }
    }

    // ---------- test helpers (used only from a throwaway process, never by the running helper) ----------
    public static void UseWordsFile(string path) { wordsPathOverride = path; WordsLoad(); }
    public static string VoiceSelfTest(string heard)
    {
        VoiceResult r = ResolveVoice(heard);
        StringBuilder sb = new StringBuilder(r.Mode);
        if (r.Chosen != null) sb.Append(":").Append(r.Chosen.Action).Append(":").Append(r.Chosen.Label);
        foreach (VoiceCand c in r.Options) sb.Append(" [").Append(c.Label).Append(" ").Append(c.Score.ToString("0.00")).Append("]");
        return sb.ToString();
    }
    public static string ChoiceSelfTest(string heard, int max) { return ParseChoice(heard, max).ToString(); }
    public static string MouseSelfTest(string ringBtn, string voiceBtn, int msg, uint md) { string b0 = button, v0 = voiceButton; button = ringBtn; voiceButton = voiceBtn; bool r = IsVoiceDown(msg, md); button = b0; voiceButton = v0; return r.ToString(); }
    public static string BindingsSelfTest() { ApplyBindings(); return button + "|" + voiceButton; }
    public static string RingSelfTest(int cx, int cy, int x, int y) { int c0 = menuCx, c1 = menuCy; bool m0 = menuReady; menuCx = cx; menuCy = cy; menuReady = true; bool r = IsOffRing(x, y); menuCx = c0; menuCy = c1; menuReady = m0; return r.ToString(); }
    public static string KeySelfTest(string spec) { uint m, v; bool ok = ParseKey(spec, out m, out v); return ok ? ("ok mods=" + m + " vk=0x" + v.ToString("X")) : "refused"; }

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

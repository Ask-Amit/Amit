// AmitBar - the Amit Helper bar (prototype v0.10, 2026-10-31). A small native Windows program: a slim glass bar on the right edge of the screen
// with the person's own buttons (name, icon, description), in profiles. Windows only.
//   - Double-right-click brings it up; it stays while used and goes away after the idle time (default 2 minutes) unless "Always on" is set.
//   - Clicking the bar (its Amit icon or empty space) makes it wider and shows names; click again to narrow.
//   - Hover a button for its description; click it to run its safe steps (open an Amit app or a website, open a program, play music, speak, ask Amit, wait).
//   - Click the profile button at the top to switch profile; right-click the bar for settings (Always on, how long before it goes away, wide).
//   - Ctrl+Alt+B is a backup way to bring it up; the tray icon has the same choices.
// Settings, profiles and buttons live in %LOCALAPPDATA%\AmitComputerHealth\amit_bar.json (later written by the Hub page, under the person's login).
// NOTE: the double-right-click is watched here for the prototype; it is meant to move into the Amit Live program's mouse handling.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Printing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

public class Step { public string t { get; set; } public string url { get; set; } public string path { get; set; } public string text { get; set; } public int ms { get; set; } }
public class Btn { public string name { get; set; } public string kind { get; set; } public string desc { get; set; } public string icon { get; set; } public List<Step> steps { get; set; } public Btn() { steps = new List<Step>(); } }
public class Prof { public string name { get; set; } public string say { get; set; } public List<Btn> buttons { get; set; } public Prof() { buttons = new List<Btn>(); } }
public class Cfg
{
    public bool alwaysOn { get; set; }
    public int idleMinutes { get; set; }
    public bool widenOnClick { get; set; }
    public bool startWide { get; set; }
    public bool ownHook { get; set; }   // true = this program watches the double-right-click itself (only when the Amit Live program is not installed)
    public string current { get; set; }
    public List<Prof> profiles { get; set; }
    public Cfg() { idleMinutes = 2; widenOnClick = true; profiles = new List<Prof>(); }
}

static class Program
{
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    [STAThread]
    static void Main(string[] args)
    {
        try { SetProcessDPIAware(); } catch { }
        for (int q = 0; q < args.Length; q++)
        {
            if (args[q] == "--audio-list" && q + 1 < args.Length) { AudioCtl.WriteList(args[q + 1]); return; }
            if (args[q] == "--audio-step" && q + 2 < args.Length) { AudioCtl.RunToFile(args[q + 1], args[q + 2]); return; }
            if (args[q] == "--audio-selftest" && q + 1 < args.Length) { AudioCtl.SelfTest(args[q + 1]); return; }
            if (args[q] == "--print") { Application.EnableVisualStyles(); PrintCtl.RunHere(); return; }   // the Hub's Test button for a Print step (started by the helper)
            if (args[q] == "--print-selftest" && q + 1 < args.Length) { PrintCtl.SelfTest(args[q + 1]); return; }
        }
        string shot = null; bool wide = false, showNow = false;
        for (int i = 0; i < args.Length; i++) { if (args[i] == "--shot" && i + 1 < args.Length) shot = args[i + 1]; if (args[i] == "--wide") wide = true; if (args[i] == "--show") showNow = true; }
        Application.EnableVisualStyles();
        if (shot != null) { BarForm f = new BarForm(true, false); f.RenderTo(shot, wide); return; }   // picture only: no window is ever shown
        bool createdNew;
        using (Mutex m = new Mutex(true, "Local\\AmitBarSingle", out createdNew))
        {
            if (!createdNew) { try { EventWaitHandle.OpenExisting("Local\\AmitBarShow").Set(); } catch { } return; }
            Application.Run(new BarForm(false, showNow));
        }
    }
}

public class BarForm : Form
{
    [StructLayout(LayoutKind.Sequential)] struct PT { public int x, y; }
    [StructLayout(LayoutKind.Sequential)] struct MSLL { public PT pt; public uint mouseData, flags, time; public IntPtr extra; }
    delegate IntPtr LLProc(int n, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] static extern IntPtr SetWindowsHookEx(int id, LLProc p, IntPtr mod, uint th);
    [DllImport("user32.dll")] static extern bool UnhookWindowsHookEx(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr h, int n, IntPtr w, IntPtr l);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr GetModuleHandle(string n);
    [DllImport("user32.dll")] static extern uint GetDoubleClickTime();
    [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h, int id, uint mod, uint vk);
    [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h, int id);

    [StructLayout(LayoutKind.Sequential)] struct RECT { public int left, top, right, bottom; }
    [StructLayout(LayoutKind.Sequential)] struct APPBARDATA { public int cbSize; public IntPtr hWnd; public uint uCallbackMessage; public uint uEdge; public RECT rc; public IntPtr lParam; }
    [DllImport("shell32.dll")] static extern UIntPtr SHAppBarMessage(uint msg, ref APPBARDATA d);
    bool registered = false;
    void RegisterBar()
    {
        if (registered) return;
        APPBARDATA d = new APPBARDATA(); d.cbSize = Marshal.SizeOf(typeof(APPBARDATA)); d.hWnd = Handle; d.uCallbackMessage = 0x0401;
        SHAppBarMessage(0, ref d);   // ABM_NEW
        registered = true;
    }
    void UnregisterBar()
    {
        if (!registered) return;
        APPBARDATA d = new APPBARDATA(); d.cbSize = Marshal.SizeOf(typeof(APPBARDATA)); d.hWnd = Handle;
        SHAppBarMessage(1, ref d);   // ABM_REMOVE: windows get the space back
        registered = false;
    }
    void PlaceAppBar()
    {
        Rectangle sc = Screen.PrimaryScreen.Bounds, wa = Screen.PrimaryScreen.WorkingArea; int w = BarW();
        APPBARDATA d = new APPBARDATA(); d.cbSize = Marshal.SizeOf(typeof(APPBARDATA)); d.hWnd = Handle; d.uEdge = 2;   // ABE_RIGHT
        d.rc.left = sc.Right - w; d.rc.right = sc.Right; d.rc.top = wa.Top; d.rc.bottom = wa.Bottom;
        SHAppBarMessage(2, ref d);   // ABM_QUERYPOS
        d.rc.left = d.rc.right - w;
        SHAppBarMessage(3, ref d);   // ABM_SETPOS: Windows now keeps maximized windows out of this strip
        Bounds = Rectangle.FromLTRB(d.rc.left, d.rc.top, d.rc.right, d.rc.bottom);
    }

    static readonly Color[] KindColor = new Color[] { Color.FromArgb(232, 190, 70), Color.FromArgb(70, 160, 255), Color.FromArgb(172, 110, 255), Color.FromArgb(60, 208, 210), Color.FromArgb(255, 132, 98), Color.FromArgb(80, 215, 140) };
    static readonly string[] Kinds = new string[] { "app", "web", "music", "program", "multi", "ask" };

    Cfg cfg; string cfgPath; string iconPath; Image amitIcon;
    float K = 1f; int railW, wideW; bool wide = false; bool allowVisible = false; bool testMode;
    DateTime lastUse = DateTime.Now;
    int hover = -1; List<Rectangle> tiles = new List<Rectangle>(); Rectangle iconRect, chipRect, reloadRect; bool reloadHot = false;
    System.Windows.Forms.Timer idleTimer; ToolTip tip = new ToolTip(); NotifyIcon tray;
    LLProc hookProc; IntPtr hook = IntPtr.Zero; int lastRDown = 0, lastRX = 0, lastRY = 0; bool swallowRUp = false;
    EventWaitHandle showEvent, runEvent;

    public BarForm(bool test, bool showNow)
    {
        testMode = test;
        FormBorderStyle = FormBorderStyle.None; StartPosition = FormStartPosition.Manual; ShowInTaskbar = false; TopMost = true;
        BackColor = Color.FromArgb(15, 18, 27); DoubleBuffered = true; Text = "Amit Helper";
        string home = Path.Combine(Environment.GetEnvironmentVariable("LOCALAPPDATA") ?? Path.GetTempPath(), "AmitComputerHealth");
        try { Directory.CreateDirectory(home); } catch { }
        cfgPath = Path.Combine(home, "amit_bar.json");
        iconPath = Path.Combine(Path.Combine(home, "Watchers"), "amit_icon.ico");
        if (!File.Exists(iconPath)) iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "amit_icon.ico");
        try { if (File.Exists(iconPath)) { try { amitIcon = new Icon(iconPath, 48, 48).ToBitmap(); } catch { amitIcon = Icon.ExtractAssociatedIcon(iconPath).ToBitmap(); } } } catch { }
        LoadCfg(); Metrics(); wide = cfg.startWide;
        CreateHandle();
        if (testMode) return;
        idleTimer = new System.Windows.Forms.Timer(); idleTimer.Interval = 5000; idleTimer.Tick += delegate { IdleCheck(); }; idleTimer.Start();
        BuildTray();
        try { RegisterHotKey(Handle, 1, 0x0003, (uint)Keys.B); } catch { }      // Ctrl+Alt+B
        bool created; showEvent = new EventWaitHandle(false, EventResetMode.AutoReset, "Local\\AmitBarShow", out created);
        Thread t = new Thread(delegate () { while (true) { try { showEvent.WaitOne(); BeginInvoke(new MethodInvoker(delegate { ShowBar(); })); } catch { return; } } });
        t.IsBackground = true; t.Start();
        // Amit Live's voice menu runs a button by its title: it writes the request to bar_run.txt and sets this event (nothing is polled)
        bool created2; runEvent = new EventWaitHandle(false, EventResetMode.AutoReset, "Local\\AmitBarRun", out created2);
        Thread t2 = new Thread(delegate () { while (true) { try { runEvent.WaitOne(); BeginInvoke(new MethodInvoker(delegate { RunByVoice(); })); } catch { return; } } });
        t2.IsBackground = true; t2.Start();
        if (cfg.ownHook) { hookProc = HookCb; hook = SetWindowsHookEx(14, hookProc, GetModuleHandle(null), 0); }
        if (cfg.alwaysOn || showNow) ShowBar();
    }

    protected override bool ShowWithoutActivation { get { return true; } }
    protected override CreateParams CreateParams { get { CreateParams cp = base.CreateParams; cp.ExStyle |= 0x08000000 | 0x00000080; return cp; } }   // no focus stealing, not in the taskbar
    protected override void SetVisibleCore(bool value) { base.SetVisibleCore(allowVisible ? value : false); }
    protected override void WndProc(ref Message m)
    {
        if (m.Msg == 0x0312 && m.WParam.ToInt32() == 1) { if (Visible && !cfg.alwaysOn) HideBar(); else ShowBar(); return; }   // WM_HOTKEY
        if (m.Msg == 0x0401) { int code = m.WParam.ToInt32(); if (code == 1 && registered) PlaceAppBar(); else if (code == 2) TopMost = (m.LParam.ToInt64() == 0); return; }   // the Windows edge-bar messages: layout changed, a full-screen program started or ended
        base.WndProc(ref m);
    }
    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        try { UnregisterBar(); if (hook != IntPtr.Zero) UnhookWindowsHookEx(hook); UnregisterHotKey(Handle, 1); if (tray != null) tray.Visible = false; } catch { }
        base.OnFormClosed(e);
    }

    // ---------- settings, profiles, buttons ----------
    static Step S(string t, string url) { Step s = new Step(); s.t = t; s.url = url; return s; }
    static Btn B(string name, string kind, string desc, params Step[] steps) { Btn b = new Btn(); b.name = name; b.kind = kind; b.desc = desc; b.steps.AddRange(steps); return b; }
    Cfg Default()
    {
        string A = "https://ask-amit.github.io/Amit/"; Cfg c = new Cfg(); c.current = "Books";
        Prof p1 = new Prof(); p1.name = "AmitCoder"; p1.say = "profile coder";
        p1.buttons.Add(B("AmitCoder", "app", "Opens your AmitCoder workspace, already signed in.", S("open_app", A + "AmitCoder/AmitCoder.html")));
        p1.buttons.Add(B("GitHub", "web", "Opens GitHub in your browser.", S("open_url", "https://github.com")));
        p1.buttons.Add(B("Docs", "web", "Opens the GitHub documentation.", S("open_url", "https://docs.github.com")));
        Step sp = new Step(); sp.t = "speak"; sp.text = "Opening AmitCoder.";
        p1.buttons.Add(B("Run checks", "multi", "Says what it is doing, then opens AmitCoder.", sp, S("open_app", A + "AmitCoder/AmitCoder.html")));
        Step pg = new Step(); pg.t = "open_program"; pg.path = "notepad.exe";
        p1.buttons.Add(B("Notepad", "program", "Opens Notepad on this computer.", pg));
        p1.buttons.Add(B("Ask Amit", "ask", "Opens Ask Amit in the Hub.", S("ask_amit", A + "Hub/amit-hub.html?ask=amit")));
        Prof p2 = new Prof(); p2.name = "Books"; p2.say = "profile books";
        p2.buttons.Add(B("AmitBooks", "app", "Opens AmitBooks directly, signed in, without going through the Hub.", S("open_app", A + "AmitBooks/NEW.html")));
        Step calc = new Step(); calc.t = "open_program"; calc.path = "calc.exe";
        p2.buttons.Add(B("Calculator", "program", "Opens the Windows Calculator.", calc));
        p2.buttons.Add(B("Hub", "app", "Opens your Hub.", S("open_app", A + "Hub/amit-hub.html")));
        p2.buttons.Add(B("Ask Amit", "ask", "Opens Ask Amit so you can ask about your books.", S("ask_amit", A + "Hub/amit-hub.html?ask=amit")));
        Prof p3 = new Prof(); p3.name = "Shopping"; p3.say = "profile shopping";
        p3.buttons.Add(B("Amazon", "web", "Opens Amazon in your browser.", S("open_url", "https://www.amazon.com")));
        p3.buttons.Add(B("Compare", "multi", "Opens Amazon and Google Shopping so you can compare prices.", S("open_url", "https://www.amazon.com"), S("open_url", "https://www.google.com/shopping")));
        p3.buttons.Add(B("Calculator", "program", "Opens the Windows Calculator.", calc));
        c.profiles.Add(p1); c.profiles.Add(p2); c.profiles.Add(p3);
        return c;
    }
    DateTime cfgStamp = DateTime.MinValue;
    void LoadCfg()
    {
        JavaScriptSerializer js = new JavaScriptSerializer();
        try { if (File.Exists(cfgPath)) cfg = js.Deserialize<Cfg>(File.ReadAllText(cfgPath)); } catch { cfg = null; }
        if (cfg == null || cfg.profiles == null || cfg.profiles.Count == 0) { cfg = Default(); SaveCfg(); }
        if (cfg.idleMinutes < 1) cfg.idleMinutes = 2;
        try { cfgStamp = File.GetLastWriteTimeUtc(cfgPath); } catch { }
        WriteVoiceList();
    }
    // ---------- Voice: every button can be said by its title (2026-11-01) ----------
    // Nothing is set up per button. The bar keeps a plain list of every profile and button title (bar_buttons.txt, one "profile<TAB>title" per line) that Amit Live's
    // voice menu reads when someone speaks; a button added later is on the list the moment the bar takes in the new copy of its settings.
    string VoiceFile(string name) { return Path.Combine(Path.GetDirectoryName(cfgPath), name); }
    static string OneLine(string s) { return (s ?? "").Replace("\t", " ").Replace("\r", " ").Replace("\n", " ").Trim(); }
    void WriteVoiceList()
    {
        try
        {
            StringBuilder sb = new StringBuilder();
            foreach (Prof p in cfg.profiles) foreach (Btn b in p.buttons) if (!String.IsNullOrEmpty(b.name)) sb.Append(OneLine(p.name)).Append('\t').Append(OneLine(b.name)).Append("\r\n");
            File.WriteAllText(VoiceFile("bar_buttons.txt"), sb.ToString(), new UTF8Encoding(false));
        }
        catch { }
    }
    void RunByVoice()
    {
        try
        {
            string f = VoiceFile("bar_run.txt"); if (!File.Exists(f)) return;
            string[] a = File.ReadAllText(f, Encoding.UTF8).Split(new char[] { '\t' }, 2); try { File.Delete(f); } catch { }
            string prof = a.Length > 1 ? a[0].Trim() : "", name = (a.Length > 1 ? a[1] : a[0]).Trim();
            Btn hit = null;
            foreach (Prof p in cfg.profiles) { if (prof.Length > 0 && OneLine(p.name) != prof) continue; foreach (Btn b in p.buttons) if (OneLine(b.name) == name) { hit = b; break; } if (hit != null) break; }
            if (hit == null) { Say("Voice", "There is no button called " + name + " any more."); return; }
            lastUse = DateTime.Now; RunButton(hit);
        }
        catch { }
    }
    void SaveCfg() { try { File.WriteAllText(cfgPath, new JavaScriptSerializer().Serialize(cfg)); cfgStamp = File.GetLastWriteTimeUtc(cfgPath); } catch { } }
    // The Hub writes this file through the shared helper after every add, change or delete (2026-11-01): when it changes, take the new copy in whole.
    void ReloadIfChanged()
    {
        try
        {
            if (!File.Exists(cfgPath)) return;
            DateTime t = File.GetLastWriteTimeUtc(cfgPath); if (t == cfgStamp) return;
            Cfg c = new JavaScriptSerializer().Deserialize<Cfg>(File.ReadAllText(cfgPath));
            cfgStamp = t;
            if (c == null || c.profiles == null || c.profiles.Count == 0) return;
            if (c.idleMinutes < 1) c.idleMinutes = 2;
            cfg = c; WriteVoiceList(); hover = -1; tip.Hide(this); Current();
            if (Visible) Invalidate(); else if (cfg.alwaysOn) ShowBar();
        }
        catch { }
    }
    Prof Current()
    {
        foreach (Prof p in cfg.profiles) if (p.name == cfg.current) return p;
        cfg.current = cfg.profiles[0].name; return cfg.profiles[0];
    }

    // ---------- size follows the screen ----------
    void Metrics()
    {
        Rectangle b = Screen.PrimaryScreen.Bounds;
        K = Math.Max(0.85f, Math.Min(1.6f, b.Width / 1920f));
        railW = (int)(56 * K); wideW = (int)(110 * K);
    }
    int BarW() { return wide ? wideW : railW; }
    void PlaceBar()
    {
        Rectangle wa = Screen.PrimaryScreen.WorkingArea; int w = BarW();
        if (registered) { PlaceAppBar(); return; }   Bounds = new Rectangle(wa.Right - w, wa.Top, w, wa.Height);
    }

    // ---------- show, hide, idle ----------
    void ShowBar() { allowVisible = true; RegisterBar(); PlaceBar(); lastUse = DateTime.Now; if (!Visible) Show(); else Invalidate(); TopMost = true; }
    void HideBar() { if (cfg.alwaysOn) return; tip.Hide(this); UnregisterBar(); Hide(); }
    void IdleCheck() { ReloadIfChanged(); if (Visible && !cfg.alwaysOn && (DateTime.Now - lastUse).TotalMinutes >= cfg.idleMinutes) HideBar(); }
    void Used() { lastUse = DateTime.Now; }

    // ---------- the double-right-click (watched here for the prototype) ----------
    IntPtr HookCb(int n, IntPtr w, IntPtr l)
    {
        try
        {
            if (n >= 0)
            {
                int msg = w.ToInt32();
                MSLL m = (MSLL)Marshal.PtrToStructure(l, typeof(MSLL));
                if ((m.flags & 1) == 0)   // a real press, not one the Amit Live program replayed
                {
                    if (msg == 0x204)     // right button down
                    {
                        int now = Environment.TickCount; int dbl = (int)Math.Min(GetDoubleClickTime(), 450);
                        if (lastRDown != 0 && unchecked(now - lastRDown) < dbl && Math.Abs(m.pt.x - lastRX) < 6 && Math.Abs(m.pt.y - lastRY) < 6)
                        {
                            lastRDown = 0; swallowRUp = true;
                            BeginInvoke(new MethodInvoker(delegate { ShowBar(); }));
                            return (IntPtr)1;
                        }
                        lastRDown = now; lastRX = m.pt.x; lastRY = m.pt.y;
                    }
                    else if (msg == 0x205 && swallowRUp) { swallowRUp = false; return (IntPtr)1; }
                }
            }
        }
        catch { }
        return CallNextHookEx(hook, n, w, l);
    }

    // ---------- drawing ----------
    void LayoutBar()
    {
        tiles.Clear(); int pad = (int)(8 * K), gap = (int)(8 * K); int w = BarW();
        int icon = (int)(40 * K); iconRect = new Rectangle((w - icon) / 2, pad, icon, icon);
        int y = iconRect.Bottom + gap;
        if (wide) chipRect = new Rectangle((w - (int)(94 * K)) / 2, y, (int)(94 * K), (int)(46 * K)); else chipRect = new Rectangle((w - (int)(34 * K)) / 2, y, (int)(34 * K), (int)(34 * K));
        y = chipRect.Bottom + gap + (int)(4 * K);
        Prof p = Current();
        for (int i = 0; i < p.buttons.Count; i++)
        {
            Rectangle r = wide ? new Rectangle((w - (int)(94 * K)) / 2, y, (int)(94 * K), (int)(70 * K)) : new Rectangle((w - (int)(40 * K)) / 2, y, (int)(40 * K), (int)(40 * K));
            tiles.Add(r); y = r.Bottom + gap;
        }
        // the Update and reload tile, at the very bottom of the bar (Ryan, 2026-11-01)
        int rw = wide ? (int)(94 * K) : (int)(40 * K), rh2 = wide ? (int)(46 * K) : (int)(40 * K);
        reloadRect = new Rectangle((w - rw) / 2, Math.Max(y, Height - rh2 - pad), rw, rh2);
    }
    static GraphicsPath Round(Rectangle r, int rad)
    {
        GraphicsPath gp = new GraphicsPath(); int d = rad * 2;
        gp.AddArc(r.X, r.Y, d, d, 180, 90); gp.AddArc(r.Right - d, r.Y, d, d, 270, 90); gp.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90); gp.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        gp.CloseFigure(); return gp;
    }
    void Glyph(Graphics g, string kind, Rectangle area, Color c)
    {
        float s = Math.Min(area.Width, area.Height) * 0.5f; float cx = area.X + area.Width / 2f, cy = area.Y + area.Height / 2f; float x = cx - s / 2, y = cy - s / 2;
        using (Pen p = new Pen(c, Math.Max(1.5f, 1.8f * K)))
        {
            p.StartCap = LineCap.Round; p.EndCap = LineCap.Round; p.LineJoin = LineJoin.Round;
            if (kind == "app") { float q = s * 0.42f; g.DrawRectangle(p, x, y, q, q); g.DrawRectangle(p, x + s - q, y, q, q); g.DrawRectangle(p, x, y + s - q, q, q); g.DrawRectangle(p, x + s - q, y + s - q, q, q); }
            else if (kind == "web") { g.DrawEllipse(p, x, y, s, s); g.DrawLine(p, x, cy, x + s, cy); g.DrawEllipse(p, cx - s * 0.22f, y, s * 0.44f, s); }
            else if (kind == "music") { g.DrawLine(p, x + s * 0.3f, y + s * 0.8f, x + s * 0.3f, y + s * 0.1f); g.DrawLine(p, x + s * 0.3f, y + s * 0.1f, x + s * 0.9f, y); g.DrawLine(p, x + s * 0.9f, y, x + s * 0.9f, y + s * 0.7f); g.DrawEllipse(p, x, y + s * 0.65f, s * 0.35f, s * 0.3f); g.DrawEllipse(p, x + s * 0.6f, y + s * 0.55f, s * 0.35f, s * 0.3f); }
            else if (kind == "program") { g.DrawRectangle(p, x, y + s * 0.05f, s, s * 0.65f); g.DrawLine(p, cx, y + s * 0.7f, cx, y + s * 0.9f); g.DrawLine(p, x + s * 0.25f, y + s * 0.92f, x + s * 0.75f, y + s * 0.92f); }
            else if (kind == "multi") { for (int i = 0; i < 3; i++) { float yy = y + s * (0.15f + 0.35f * i); g.DrawLine(p, x, yy, x + s * 0.6f, yy); g.DrawLine(p, x + s * 0.72f, yy - s * 0.1f, x + s, yy); g.DrawLine(p, x + s, yy, x + s * 0.72f, yy + s * 0.1f); } }
            else { using (GraphicsPath gp = Round(new Rectangle((int)x, (int)y, (int)s, (int)(s * 0.75f)), Math.Max(2, (int)(s * 0.15f)))) g.DrawPath(p, gp); g.DrawLine(p, x + s * 0.2f, y + s * 0.75f, x + s * 0.2f, y + s); g.DrawLine(p, x + s * 0.2f, y + s, x + s * 0.45f, y + s * 0.75f); }
        }
    }
    // the icon the person picked in the Hub (a character from the Hub's icon library), drawn in the button's color; the kind glyph is used only when none was sent
    void DrawIcon(Graphics g, string icon, Rectangle area, Color c)
    {
        float px = Math.Max(10f, Math.Min(area.Width, area.Height) * 0.5f);
        // the font pads each glyph differently, so draw it once to a scratch picture, find where the ink really is, and center THAT
        string key = icon + "|" + (int)px + "|" + c.ToArgb();
        Bitmap bmp; Rectangle ink;
        if (!inkCache.ContainsKey(key))
        {
            int S = (int)(px * 2.2f) + 4; Bitmap t = new Bitmap(S, S, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
            using (Graphics tg = Graphics.FromImage(t))
            using (Font f = new Font("Segoe UI Emoji", px, FontStyle.Regular, GraphicsUnit.Pixel)) using (SolidBrush b = new SolidBrush(c)) using (StringFormat sf = new StringFormat())
            {
                tg.SmoothingMode = SmoothingMode.AntiAlias; tg.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
                sf.Alignment = StringAlignment.Center; sf.LineAlignment = StringAlignment.Center;
                tg.DrawString(icon, f, b, new RectangleF(0, 0, S, S), sf);
            }
            int x0 = S, y0 = S, x1 = -1, y1 = -1;
            for (int yy = 0; yy < S; yy++) for (int xx = 0; xx < S; xx++) if (t.GetPixel(xx, yy).A > 24) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
            if (x1 < 0) { x0 = 0; y0 = 0; x1 = S - 1; y1 = S - 1; }
            inkCache[key] = t; inkBox[key] = new Rectangle(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
        }
        bmp = inkCache[key]; ink = inkBox[key];
        float ix = area.X + (area.Width - ink.Width) / 2f, iy = area.Y + (area.Height - ink.Height) / 2f;
        g.DrawImage(bmp, new RectangleF(ix, iy, ink.Width, ink.Height), new RectangleF(ink.X, ink.Y, ink.Width, ink.Height), GraphicsUnit.Pixel);
    }
    Dictionary<string, Bitmap> inkCache = new Dictionary<string, Bitmap>(); Dictionary<string, Rectangle> inkBox = new Dictionary<string, Rectangle>();
    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics; g.SmoothingMode = SmoothingMode.AntiAlias; g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        LayoutBar(); Rectangle all = new Rectangle(0, 0, Width, Height);
        using (LinearGradientBrush bg = new LinearGradientBrush(all, Color.FromArgb(23, 27, 40), Color.FromArgb(15, 18, 27), 90f)) g.FillRectangle(bg, all);
        using (Pen edge = new Pen(Color.FromArgb(43, 49, 70))) g.DrawLine(edge, 0, 0, 0, Height);
        if (amitIcon != null) g.DrawImage(amitIcon, iconRect); else using (Pen gp = new Pen(Color.FromArgb(212, 175, 55), 3)) g.DrawEllipse(gp, iconRect);
        Prof p = Current(); Color gold = Color.FromArgb(232, 190, 70);
        using (GraphicsPath cp = Round(chipRect, wide ? (int)(12 * K) : chipRect.Width / 2))
        {
            using (SolidBrush fb = new SolidBrush(Color.FromArgb(29, 34, 50))) g.FillPath(fb, cp);
            using (Pen pen = new Pen(gold, Math.Max(2f, 2f * K))) g.DrawPath(pen, cp);
        }
        using (Font f1 = new Font("Segoe UI", wide ? 9.5f * K : 11f * K, FontStyle.Bold)) using (Font f2 = new Font("Segoe UI", 7f * K))
        using (StringFormat sf = new StringFormat()) using (SolidBrush gb = new SolidBrush(Color.FromArgb(251, 229, 164))) using (SolidBrush mb = new SolidBrush(Color.FromArgb(154, 148, 132)))
        {
            sf.Alignment = StringAlignment.Center; sf.LineAlignment = StringAlignment.Center;
            if (wide) { g.DrawString(p.name, f1, gb, new RectangleF(chipRect.X, chipRect.Y + 2, chipRect.Width, chipRect.Height * 0.55f), sf); g.DrawString("say: \"" + p.say + "\"", f2, mb, new RectangleF(chipRect.X, chipRect.Y + chipRect.Height * 0.5f, chipRect.Width, chipRect.Height * 0.45f), sf); }
            else g.DrawString(p.name.Substring(0, 1).ToUpper(), f1, gb, chipRect, sf);
        }
        using (Font nf = new Font("Segoe UI", 8f * K)) using (StringFormat sf2 = new StringFormat()) using (SolidBrush wb = new SolidBrush(Color.FromArgb(240, 238, 230)))
        {
            sf2.Alignment = StringAlignment.Center; sf2.LineAlignment = StringAlignment.Far;
            for (int i = 0; i < tiles.Count && i < p.buttons.Count; i++)
            {
                Rectangle r = tiles[i]; Btn b = p.buttons[i]; int ki = Math.Max(0, Array.IndexOf(Kinds, b.kind)); Color kc = KindColor[ki]; bool hot = (i == hover);
                using (GraphicsPath gp = Round(r, (int)(12 * K)))
                {
                    using (SolidBrush fb = new SolidBrush(hot ? Color.FromArgb(244, 232, 190, 70) : Color.FromArgb(77, kc))) g.FillPath(fb, gp);
                    using (Pen pen = new Pen(hot ? Color.FromArgb(255, 255, 244, 205) : Color.FromArgb(217, kc), Math.Max(1.6f, 1.6f * K))) g.DrawPath(pen, gp);
                }
                Rectangle ga = wide ? new Rectangle(r.X, r.Y, r.Width, (int)(r.Height * 0.62f)) : r;
                if (!String.IsNullOrEmpty(b.icon)) DrawIcon(g, b.icon, ga, hot ? Color.FromArgb(24, 22, 30) : kc); else Glyph(g, b.kind, ga, hot ? Color.FromArgb(24, 22, 30) : kc);
                if (wide) g.DrawString(b.name, nf, hot ? Brushes.Black : wb, new RectangleF(r.X, r.Y, r.Width, r.Height - 4 * K), sf2);
            }
            // Update and reload: gray glass so it is never taken for one of the person's own buttons; a circular arrow
            Color gray = Color.FromArgb(154, 148, 132);
            using (GraphicsPath rp = Round(reloadRect, (int)(12 * K)))
            {
                using (SolidBrush fb = new SolidBrush(reloadHot ? Color.FromArgb(244, 232, 190, 70) : Color.FromArgb(46, gray))) g.FillPath(fb, rp);
                using (Pen pen = new Pen(reloadHot ? Color.FromArgb(255, 255, 244, 205) : Color.FromArgb(170, gray), Math.Max(1.6f, 1.6f * K))) g.DrawPath(pen, rp);
            }
            Rectangle ra = wide ? new Rectangle(reloadRect.X, reloadRect.Y, reloadRect.Width, (int)(reloadRect.Height * 0.66f)) : reloadRect;
            float rs2 = Math.Min(ra.Width, ra.Height) * 0.42f; float rcx = ra.X + ra.Width / 2f, rcy = ra.Y + ra.Height / 2f;
            Color rc = reloadHot ? Color.FromArgb(24, 22, 30) : gray;
            using (Pen ap = new Pen(rc, Math.Max(1.8f, 1.8f * K)))
            {
                ap.StartCap = LineCap.Round; ap.EndCap = LineCap.Round;
                g.DrawArc(ap, rcx - rs2 / 2, rcy - rs2 / 2, rs2, rs2, 300, 290);
                float ex = rcx + (float)Math.Cos(300 * Math.PI / 180) * rs2 / 2, ey = rcy + (float)Math.Sin(300 * Math.PI / 180) * rs2 / 2;
                g.DrawLine(ap, ex, ey, ex + rs2 * 0.30f, ey - rs2 * 0.02f); g.DrawLine(ap, ex, ey, ex + rs2 * 0.02f, ey + rs2 * 0.30f);
            }
            if (wide) g.DrawString("Reload", nf, reloadHot ? Brushes.Black : wb, new RectangleF(reloadRect.X, reloadRect.Y, reloadRect.Width, reloadRect.Height - 4 * K), sf2);
        }
    }

    // ---------- the mouse on the bar ----------
    int HitTile(Point pt) { for (int i = 0; i < tiles.Count; i++) if (tiles[i].Contains(pt)) return i; return -1; }
    protected override void OnMouseMove(MouseEventArgs e)
    {
        Used(); int h = HitTile(e.Location);
        if (h != hover)
        {
            hover = h; Invalidate();
            if (h >= 0) { Btn b = Current().buttons[h]; tip.Show(b.name + "\n" + b.desc, this, -250, tiles[h].Top, 4000); } else tip.Hide(this);
        }
        bool rhot = reloadRect.Contains(e.Location);
        if (rhot != reloadHot)
        {
            reloadHot = rhot; Invalidate();
            if (rhot) tip.Show("Update and reload\nRefreshes Amit Live, the helper and this bar, and brings in any waiting update.", this, -330, reloadRect.Top, 5000); else tip.Hide(this);
        }
        base.OnMouseMove(e);
    }
    protected override void OnMouseLeave(EventArgs e) { hover = -1; reloadHot = false; tip.Hide(this); Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseUp(MouseEventArgs e)
    {
        Used();
        if (e.Button == MouseButtons.Right) { SettingsMenu().Show(this, e.Location); return; }
        if (e.Button != MouseButtons.Left) return;
        if (reloadRect.Contains(e.Location)) { DoReload(); return; }
        int h = HitTile(e.Location);
        if (h >= 0) { RunButton(Current().buttons[h]); return; }
        if (chipRect.Contains(e.Location)) { ProfileMenu().Show(this, new Point(chipRect.Left, chipRect.Bottom)); return; }
        if (cfg.widenOnClick) { wide = !wide; PlaceBar(); Invalidate(); }
    }
    ContextMenuStrip ProfileMenu()
    {
        ContextMenuStrip m = new ContextMenuStrip();
        foreach (Prof p in cfg.profiles) { Prof pp = p; ToolStripMenuItem it = new ToolStripMenuItem(pp.name + "   (say: " + pp.say + ")"); it.Checked = (pp.name == cfg.current); it.Click += delegate { cfg.current = pp.name; SaveCfg(); Invalidate(); }; m.Items.Add(it); }
        return m;
    }
    ContextMenuStrip SettingsMenu()
    {
        ContextMenuStrip m = new ContextMenuStrip();
        ToolStripMenuItem on = new ToolStripMenuItem("Always on (no double-right-click needed)"); on.Checked = cfg.alwaysOn; on.Click += delegate { cfg.alwaysOn = !cfg.alwaysOn; SaveCfg(); }; m.Items.Add(on);
        ToolStripMenuItem idle = new ToolStripMenuItem("Goes away after");
        foreach (int mins in new int[] { 1, 2, 5, 10 }) { int mm = mins; ToolStripMenuItem it = new ToolStripMenuItem(mm + (mm == 1 ? " minute" : " minutes")); it.Checked = (cfg.idleMinutes == mm); it.Click += delegate { cfg.idleMinutes = mm; SaveCfg(); }; idle.DropDownItems.Add(it); }
        m.Items.Add(idle);
        ToolStripMenuItem wd = new ToolStripMenuItem("Click the bar to widen it"); wd.Checked = cfg.widenOnClick; wd.Click += delegate { cfg.widenOnClick = !cfg.widenOnClick; SaveCfg(); }; m.Items.Add(wd);
        m.Items.Add(new ToolStripSeparator());
        ToolStripMenuItem hide = new ToolStripMenuItem("Hide the bar now"); hide.Click += delegate { bool a = cfg.alwaysOn; cfg.alwaysOn = false; HideBar(); cfg.alwaysOn = a; }; m.Items.Add(hide);
        return m;
    }
    void BuildTray()
    {
        tray = new NotifyIcon(); tray.Text = "Amit Helper (double-right-click, or Ctrl+Alt+B)";
        try { if (File.Exists(iconPath)) tray.Icon = new Icon(iconPath); else tray.Icon = SystemIcons.Application; } catch { tray.Icon = SystemIcons.Application; }
        ContextMenuStrip m = new ContextMenuStrip();
        ToolStripMenuItem sh = new ToolStripMenuItem("Show the bar"); sh.Click += delegate { ShowBar(); }; m.Items.Add(sh);
        ToolStripMenuItem on = new ToolStripMenuItem("Always on"); on.Click += delegate { cfg.alwaysOn = !cfg.alwaysOn; SaveCfg(); if (cfg.alwaysOn) ShowBar(); }; m.Items.Add(on);
        m.Opening += delegate { on.Checked = cfg.alwaysOn; };
        ToolStripMenuItem q = new ToolStripMenuItem("Quit Amit Helper"); q.Click += delegate { Close(); Application.Exit(); }; m.Items.Add(q);
        tray.ContextMenuStrip = m; tray.DoubleClick += delegate { ShowBar(); }; tray.Visible = true;
    }

    // ---------- Update and reload: runs amit_reload.ps1, which restarts this bar, the helper and Amit Live and brings in any waiting update ----------
    void DoReload()
    {
        string script = Path.Combine(Path.Combine(Path.Combine(Environment.GetEnvironmentVariable("LOCALAPPDATA") ?? "", "AmitComputerHealth"), "Watchers"), "amit_reload.ps1");
        if (!File.Exists(script)) { MessageBox.Show(this, "The reload program is not on this computer yet. It arrives with the next Amit helper update.", "Update and reload", MessageBoxButtons.OK, MessageBoxIcon.Information); return; }
        DialogResult dr = MessageBox.Show(this, "Restart Amit Live, the helper and this bar now, and bring in any waiting update?\n\nIt takes about half a minute. Anything open in Amit Live (dictation, Read, a Show Amit window) closes.", "Update and reload", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        if (dr != DialogResult.Yes) return;
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("powershell.exe", "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + script + "\"");
            psi.UseShellExecute = false; psi.CreateNoWindow = true; Process.Start(psi);
        }
        catch { }
    }

    // ---------- Open a file: the helper puts THIS computer's path for the person's chosen file into the step; only ordinary document and media types open ----------
    static readonly string[] FileExt = new string[] { "pdf", "doc", "docx", "rtf", "txt", "md", "csv", "tsv", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "png", "jpg", "jpeg", "gif", "bmp", "webp", "tif", "tiff", "mp3", "wav", "m4a", "flac", "mp4", "mov", "wmv", "mkv", "epub" };
    void Say(string title, string text)
    {
        try { BeginInvoke(new MethodInvoker(delegate { if (tray != null) { tray.BalloonTipTitle = title; tray.BalloonTipText = text; tray.ShowBalloonTip(6000); } })); } catch { }
    }
    void OpenFileStep(Step s)
    {
        string name = String.IsNullOrEmpty(s.text) ? "the file" : s.text; string p = s.path;
        try
        {
            string ext = String.IsNullOrEmpty(p) ? "" : Path.GetExtension(p).TrimStart('.').ToLowerInvariant();
            bool ok = !String.IsNullOrEmpty(p) && !p.StartsWith("\\\\") && File.Exists(p) && Array.IndexOf(FileExt, ext) >= 0;
            if (!ok) { Say("Could not open " + name, "It is not set up on this computer yet. Open the Hub, Amit Helper, and choose the file again."); return; }
            ProcessStartInfo psi = new ProcessStartInfo(p); psi.UseShellExecute = true; Process.Start(psi);
        }
        catch (Exception) { Say("Could not open " + name, "Windows could not open it. Check that a program is set to open this kind of file."); }
    }

    // The "preview" step: asks the Helper (the one shared local agent, http://localhost:8710) to open the Amit Preview window, or bring it forward. The Helper opens
    // the copy of the page that sits in its own folder (no internet needed) and splits the screen beside the window the person was in.
    void OpenPreviewStep()
    {
        try
        {
            System.Net.HttpWebRequest rq = (System.Net.HttpWebRequest)System.Net.WebRequest.Create("http://localhost:8710/api/preview/open");
            rq.Timeout = 6000;
            using (System.Net.WebResponse rs = rq.GetResponse()) { }
        }
        catch (Exception) { Say("Amit Preview", "The Amit Helper is not running, so the preview window could not be opened. Start the Amit Helper and press the button again."); }
    }

    // ---------- what a button does: only these safe steps ----------
    void RunButton(Btn b)
    {
        List<Step> steps = new List<Step>(b.steps);
        ThreadPool.QueueUserWorkItem(delegate
        {
            foreach (Step s in steps)
            {
                try
                {
                    if (s.t == "open_app" || s.t == "open_url" || s.t == "ask_amit") { if (!String.IsNullOrEmpty(s.url) && (s.url.StartsWith("https://") || s.url.StartsWith("http://"))) Process.Start(s.url); }
                    else if (s.t == "open_program") { if (!String.IsNullOrEmpty(s.path)) { if (s.path.StartsWith("shell:AppsFolder\\", StringComparison.OrdinalIgnoreCase)) Process.Start("explorer.exe", s.path); else Process.Start(s.path); } }   // a program picked from the Start menu list opens by its Start menu address
                    else if (s.t == "open_file") { OpenFileStep(s); }
                    else if (s.t == "print") { PrintCtl.RunSta(); }
                    else if (s.t == "audio") { string am = AudioCtl.RunStep(s.text); if (am != null) Say("Audio setting", am); }
                    else if (s.t == "play_music") { if (!String.IsNullOrEmpty(s.path)) Process.Start(s.path); else if (!String.IsNullOrEmpty(s.url)) Process.Start(s.url); }
                    else if (s.t == "speak") { using (System.Speech.Synthesis.SpeechSynthesizer sp = new System.Speech.Synthesis.SpeechSynthesizer()) sp.Speak(s.text ?? ""); }
                    else if (s.t == "wait") { Thread.Sleep(Math.Max(0, Math.Min(5000, s.ms))); }
                    else if (s.t == "preview") { OpenPreviewStep(); }   // opens (or brings forward) the Amit Preview window through the Helper
                    else if (s.t == "note") { }                          // carries written instructions with the button; pressing the button does nothing with it (a program or AI that presses the button through the Helper is handed the text)
                }
                catch { }
            }
        });
    }

    // ---------- a picture of the bar, for testing (no window is shown) ----------
    public void RenderTo(string path, bool asWide)
    {
        wide = asWide; Rectangle wa = Screen.PrimaryScreen.WorkingArea; int w = BarW(); int h = Math.Min(wa.Height, 760);
        Bounds = new Rectangle(0, 0, w, h);
        using (Bitmap bmp = new Bitmap(w, h)) { DrawToBitmap(bmp, new Rectangle(0, 0, w, h)); bmp.Save(path, System.Drawing.Imaging.ImageFormat.Png); }
    }
}

// ---------- Audio setting (Ryan, 2026-11-01): the sound devices on THIS computer, switching the default output, and the volume ----------
// Nothing here is tied to one computer: the device list is read from Windows each time, a button saves LABELS ("Speakers", "Headphones") and this computer keeps its own
// label-to-device list (audio_bindings.json, written by the helper). Setting the volume and opening Sound settings use documented Windows features. Switching the DEFAULT
// output device has no documented Windows interface; the audio tools people use go through the same undocumented one (IPolicyConfig). If Windows ever changes it, the step says so
// and opens the Sound settings page instead. Microphones are never listed or touched.
[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator
{
    [PreserveSig] int EnumAudioEndpoints(int dataFlow, int stateMask, out IMMDeviceCollection devices);
    [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
    [PreserveSig] int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string id, out IMMDevice device);
    [PreserveSig] int RegisterEndpointNotificationCallback(IntPtr client);
    [PreserveSig] int UnregisterEndpointNotificationCallback(IntPtr client);
}
[ComImport, Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceCollection
{
    [PreserveSig] int GetCount(out int count);
    [PreserveSig] int Item(int index, out IMMDevice device);
}
[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice
{
    [PreserveSig] int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
    [PreserveSig] int OpenPropertyStore(int access, out IPropertyStore props);
    [PreserveSig] int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
    [PreserveSig] int GetState(out int state);
}
[ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPropertyStore
{
    [PreserveSig] int GetCount(out int count);
    [PreserveSig] int GetAt(int index, out PropertyKey key);
    [PreserveSig] int GetValue(ref PropertyKey key, out PropVariant value);
    [PreserveSig] int SetValue(ref PropertyKey key, ref PropVariant value);
    [PreserveSig] int Commit();
}
[StructLayout(LayoutKind.Sequential)] struct PropertyKey { public Guid fmtid; public int pid; }
[StructLayout(LayoutKind.Sequential)] struct PropVariant { public ushort vt; public ushort r1, r2, r3; public IntPtr p; public IntPtr p2; }
[ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume
{
    [PreserveSig] int RegisterControlChangeNotify(IntPtr notify);
    [PreserveSig] int UnregisterControlChangeNotify(IntPtr notify);
    [PreserveSig] int GetChannelCount(out int count);
    [PreserveSig] int SetMasterVolumeLevel(float level, ref Guid context);
    [PreserveSig] int SetMasterVolumeLevelScalar(float level, ref Guid context);
    [PreserveSig] int GetMasterVolumeLevel(out float level);
    [PreserveSig] int GetMasterVolumeLevelScalar(out float level);
    [PreserveSig] int SetChannelVolumeLevel(uint channel, float level, ref Guid context);
    [PreserveSig] int SetChannelVolumeLevelScalar(uint channel, float level, ref Guid context);
    [PreserveSig] int GetChannelVolumeLevel(uint channel, out float level);
    [PreserveSig] int GetChannelVolumeLevelScalar(uint channel, out float level);
    [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid context);
    [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
}
[ComImport, Guid("F8679F50-850A-41CF-9C72-430F290290C8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPolicyConfig
{
    [PreserveSig] int GetMixFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceName, IntPtr format);
    [PreserveSig] int GetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceName, [MarshalAs(UnmanagedType.Bool)] bool isDefault, IntPtr format);
    [PreserveSig] int ResetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceName);
    [PreserveSig] int SetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceName, IntPtr endpointFormat, IntPtr mixFormat);
    [PreserveSig] int GetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string deviceName, [MarshalAs(UnmanagedType.Bool)] bool isDefault, IntPtr defaultPeriod, IntPtr minimumPeriod);
    [PreserveSig] int SetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string deviceName, IntPtr period);
    [PreserveSig] int GetShareMode([MarshalAs(UnmanagedType.LPWStr)] string deviceName, IntPtr mode);
    [PreserveSig] int SetShareMode([MarshalAs(UnmanagedType.LPWStr)] string deviceName, IntPtr mode);
    [PreserveSig] int GetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string deviceName, [MarshalAs(UnmanagedType.Bool)] bool fxStore, IntPtr key, IntPtr value);
    [PreserveSig] int SetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string deviceName, [MarshalAs(UnmanagedType.Bool)] bool fxStore, IntPtr key, IntPtr value);
    [PreserveSig] int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string deviceName, int role);
    [PreserveSig] int SetEndpointVisibility([MarshalAs(UnmanagedType.LPWStr)] string deviceName, [MarshalAs(UnmanagedType.Bool)] bool visible);
}

public static class AudioCtl
{
    public const int AudioMax = 80;     // the top volume a button can set (Ryan's suggestion 2026-11-01): switching to headphones must never blast the ears
    public class Dev { public string id; public string name; public string state; public bool isDefault; public int vol; }
    [DllImport("ole32.dll")] static extern int PropVariantClear(ref PropVariant pv);

    static IMMDeviceEnumerator Enumerator() { return (IMMDeviceEnumerator)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("BCDE0395-E52F-467C-8E3D-C4579291692E"))); }
    static string Friendly(IMMDevice d)
    {
        IPropertyStore ps; if (d.OpenPropertyStore(0, out ps) != 0 || ps == null) return "";
        string s = "";
        try
        {
            PropertyKey k = new PropertyKey(); k.fmtid = new Guid("A45C254E-DF1C-4EFD-8020-67D146A850E0"); k.pid = 14;
            PropVariant pv; if (ps.GetValue(ref k, out pv) == 0) { if (pv.vt == 31 && pv.p != IntPtr.Zero) s = Marshal.PtrToStringUni(pv.p); PropVariantClear(ref pv); }
        }
        finally { Marshal.ReleaseComObject(ps); }
        return s;
    }
    static IAudioEndpointVolume Volume(IMMDevice d)
    {
        object o; Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
        if (d.Activate(ref iid, 23, IntPtr.Zero, out o) != 0 || o == null) return null;
        return (IAudioEndpointVolume)o;
    }
    public static string DefaultId()
    {
        IMMDevice d; if (Enumerator().GetDefaultAudioEndpoint(0, 0, out d) != 0 || d == null) return null;
        string id; d.GetId(out id); return id;
    }
    // every playback device Windows knows about on this computer that is connected or merely unplugged (microphones are never included)
    public static List<Dev> List()
    {
        List<Dev> res = new List<Dev>(); IMMDeviceEnumerator e = Enumerator(); string def = DefaultId();
        IMMDeviceCollection col; if (e.EnumAudioEndpoints(0, 0x9, out col) != 0 || col == null) return res;
        int n; col.GetCount(out n);
        for (int i = 0; i < n; i++)
        {
            IMMDevice d; if (col.Item(i, out d) != 0 || d == null) continue;
            string id; d.GetId(out id); int st; d.GetState(out st);
            Dev x = new Dev(); x.id = id; x.name = Friendly(d); x.state = (st == 1) ? "active" : "not connected"; x.isDefault = (def != null && id == def); x.vol = -1;
            if (st == 1) { try { IAudioEndpointVolume ev = Volume(d); float f; if (ev != null && ev.GetMasterVolumeLevelScalar(out f) == 0) x.vol = (int)Math.Round(f * 100); } catch { } }
            res.Add(x);
        }
        return res;
    }
    public static bool SetDefault(string id)
    {
        IPolicyConfig pc = (IPolicyConfig)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9")));
        int r0 = pc.SetDefaultEndpoint(id, 0), r1 = pc.SetDefaultEndpoint(id, 1), r2 = pc.SetDefaultEndpoint(id, 2);
        return r0 == 0 && r1 == 0 && r2 == 0;
    }
    public static bool SetVolume(string id, int pct, bool unmute)
    {
        IMMDevice d; if (Enumerator().GetDevice(id, out d) != 0 || d == null) return false;
        IAudioEndpointVolume ev = Volume(d); if (ev == null) return false;
        Guid ctx = Guid.Empty; pct = ClampVol(pct); if (pct < 0) return true;
        bool ok = ev.SetMasterVolumeLevelScalar(pct / 100f, ref ctx) == 0;
        if (unmute && pct > 0) ev.SetMute(false, ref ctx);
        return ok;
    }
    public static bool SetMute(string id, bool mute)
    {
        IMMDevice d; if (Enumerator().GetDevice(id, out d) != 0 || d == null) return false;
        IAudioEndpointVolume ev = Volume(d); if (ev == null) return false; Guid ctx = Guid.Empty; return ev.SetMute(mute, ref ctx) == 0;
    }
    // -1 = leave the volume alone; otherwise 0 to the top allowed
    public static int ClampVol(int v) { if (v < 0) return -1; return Math.Min(v, AudioMax); }
    // pressing the button again flips to the other device; if the current device is neither, go to the first
    public static string NextDevice(string current, string a, string b) { return string.Equals(current, a, StringComparison.OrdinalIgnoreCase) ? b : a; }

    static string Str(Dictionary<string, object> o, string k) { object v; return (o != null && o.TryGetValue(k, out v) && v != null) ? Convert.ToString(v) : ""; }
    static int Num(Dictionary<string, object> o, string k, int dflt) { object v; try { return (o != null && o.TryGetValue(k, out v) && v != null) ? Convert.ToInt32(v) : dflt; } catch { return dflt; } }
    static Dictionary<string, object> Sub(Dictionary<string, object> o, string k) { object v; if (o != null && o.TryGetValue(k, out v)) return v as Dictionary<string, object>; return null; }
    static string BindFile() { return Path.Combine(Path.Combine(Environment.GetEnvironmentVariable("LOCALAPPDATA") ?? "", "AmitComputerHealth"), "audio_bindings.json"); }
    static string BoundId(string label)
    {
        try
        {
            if (!File.Exists(BindFile())) return null;
            Dictionary<string, Dictionary<string, object>> b = new JavaScriptSerializer().Deserialize<Dictionary<string, Dictionary<string, object>>>(File.ReadAllText(BindFile()));
            foreach (KeyValuePair<string, Dictionary<string, object>> kv in b) if (string.Equals(kv.Key, label, StringComparison.OrdinalIgnoreCase)) return Str(kv.Value, "id");
        }
        catch { }
        return null;
    }
    // returns null when it worked, otherwise a plain sentence for the person
    static string Go(string label, int vol, List<Dev> devs)
    {
        string id = BoundId(label);
        if (string.IsNullOrEmpty(id)) return "Choose which device is your \"" + label + "\" in the Hub (Amit Helper), on this computer.";
        Dev d = devs.Find(delegate (Dev x) { return string.Equals(x.id, id, StringComparison.OrdinalIgnoreCase); });
        if (d == null) return "The device you chose for \"" + label + "\" is not on this computer any more. Choose it again in the Hub (Amit Helper).";
        if (d.state != "active") return "\"" + d.name + "\" is not connected right now.";
        if (!SetDefault(id)) { try { Process.Start("ms-settings:sound"); } catch { } return "Windows would not switch to \"" + d.name + "\" from here, so Sound settings was opened for you."; }
        if (vol >= 0) SetVolume(id, vol, true);
        return null;
    }
    public static string RunStep(string json)
    {
        try
        {
            Dictionary<string, object> o = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(json); string m = Str(o, "m");
            if (m == "settings") { Process.Start("ms-settings:sound"); return null; }
            List<Dev> devs = List(); if (devs.Count == 0) return "No sound devices were found on this computer.";
            if (m == "volume")
            {
                string cur = DefaultId(); if (cur == null) return "No sound output is set on this computer.";
                string mu = Str(o, "mute"); if (mu == "mute") { SetMute(cur, true); return null; } if (mu == "unmute") SetMute(cur, false);
                int v = Num(o, "vol", -1); if (v >= 0) SetVolume(cur, v, true); return null;
            }
            Dictionary<string, object> a = Sub(o, "a"), b = Sub(o, "b");
            if (m == "set") { if (a == null) return "This audio step has no device."; return Go(Str(a, "l"), ClampVol(Num(a, "v", -1)), devs); }
            if (m == "toggle")
            {
                if (a == null || b == null) return "This audio step needs two devices.";
                string la = Str(a, "l"), lb = Str(b, "l"), ia = BoundId(la), ib = BoundId(lb);
                if (string.IsNullOrEmpty(ia) || string.IsNullOrEmpty(ib)) return "Choose which device is your \"" + (string.IsNullOrEmpty(ia) ? la : lb) + "\" in the Hub (Amit Helper), on this computer.";
                bool toB = string.Equals(DefaultId(), ia, StringComparison.OrdinalIgnoreCase);
                return toB ? Go(lb, ClampVol(Num(b, "v", -1)), devs) : Go(la, ClampVol(Num(a, "v", -1)), devs);
            }
            return "This audio step is not one this version knows.";
        }
        catch (Exception ex) { return "The audio setting did not work: " + ex.Message; }
    }
    // command-line helpers used by the Amit helper (output goes to a file, because this is a window program)
    public static void WriteList(string outFile)
    {
        JavaScriptSerializer js = new JavaScriptSerializer(); string text;
        try { List<Dev> l = List(); text = js.Serialize(new Dictionary<string, object> { { "ok", true }, { "devices", l }, { "max", AudioMax } }); }
        catch (Exception ex) { text = js.Serialize(new Dictionary<string, object> { { "ok", false }, { "error", ex.Message } }); }
        File.WriteAllText(outFile, text);
    }
    public static void RunToFile(string b64, string outFile)
    {
        string msg; try { msg = RunStep(System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(b64))); } catch (Exception ex) { msg = ex.Message; }
        File.WriteAllText(outFile, new JavaScriptSerializer().Serialize(new Dictionary<string, object> { { "ok", msg == null }, { "msg", msg ?? "done" } }));
    }
    public static void SelfTest(string outFile)
    {
        List<string> bad = new List<string>();
        if (NextDevice("a", "a", "b") != "b") bad.Add("flip a->b"); if (NextDevice("b", "a", "b") != "a") bad.Add("flip b->a"); if (NextDevice("x", "a", "b") != "a") bad.Add("neither->a");
        if (NextDevice("A", "a", "b") != "b") bad.Add("case");
        if (ClampVol(120) != AudioMax) bad.Add("cap"); if (ClampVol(-5) != -1) bad.Add("leave"); if (ClampVol(40) != 40) bad.Add("keep");
        File.WriteAllText(outFile, bad.Count == 0 ? "OK" : "FAILED: " + string.Join(", ", bad.ToArray()));
    }
}

// ---------- Print from the screen (Ryan, 2026-11-01) ----------
// The button shows a small choice (this window / select an area / whole screen), takes a picture of the screen, and shows Windows' own print preview with the printer,
// paper, direction, size and copies. Nothing prints until the person presses Print in the preview. The picture lives in memory only: it is never saved to disk.
// "This window" is the topmost ordinary window that is not this program (the one the person was just working in).
public static class PrintCtl
{
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
    [DllImport("user32.dll")] static extern IntPtr GetTopWindow(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint cmd);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a, uint b, bool attach);
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    // Started from the background (the bar, a voice command) Windows will not let a new window come in front of the one the person is using, so the Print
    // windows asked to be on top were left hidden behind it. This borrows the front window's input for a moment, which Windows allows, and takes the front.
    static void ForceFront(Form f)
    {
        try
        {
            uint pid; uint fgT = GetWindowThreadProcessId(GetForegroundWindow(), out pid), me = GetCurrentThreadId();
            bool att = fgT != 0 && fgT != me && AttachThreadInput(me, fgT, true);
            SetWindowPos(f.Handle, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);   // topmost, no move, no resize, show
            SetForegroundWindow(f.Handle); f.Activate();
            if (att) AttachThreadInput(me, fgT, false);
        }
        catch { }
    }
    [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
    [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int attr, out RECT r, int size);
    [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int attr, out int v, int size);

    static readonly Color Ink = Color.FromArgb(236, 232, 218), Mute = Color.FromArgb(154, 148, 132), Gold = Color.FromArgb(232, 190, 70);
    static readonly Color PanelBg = Color.FromArgb(20, 24, 36), Line = Color.FromArgb(42, 48, 66), Field = Color.FromArgb(15, 19, 32);

    static string SettingsFile { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AmitComputerHealth\\print_settings.txt"); } }
    static Dictionary<string, string> LoadSettings()
    {
        Dictionary<string, string> d = new Dictionary<string, string>();
        try { foreach (string ln in File.ReadAllLines(SettingsFile)) { int i = ln.IndexOf('='); if (i > 0) d[ln.Substring(0, i)] = ln.Substring(i + 1); } } catch { }
        return d;
    }
    static void SaveSettings(Dictionary<string, string> d)
    {
        try { Directory.CreateDirectory(Path.GetDirectoryName(SettingsFile)); List<string> l = new List<string>(); foreach (KeyValuePair<string, string> kv in d) l.Add(kv.Key + "=" + kv.Value); File.WriteAllLines(SettingsFile, l.ToArray()); } catch { }
    }

    public static void RunHere() { try { Run(); } catch { } }   // on the calling (already STA) thread

    public static void RunSta()
    {
        Thread t = new Thread(delegate() { try { Run(); } catch { } });
        t.SetApartmentState(ApartmentState.STA); t.Start(); t.Join(900000);
    }

    static bool TargetWindow(out Rectangle rc)
    {
        rc = Rectangle.Empty; uint me = (uint)Process.GetCurrentProcess().Id;
        IntPtr h = GetTopWindow(IntPtr.Zero); int guard = 0;
        while (h != IntPtr.Zero && guard++ < 500)
        {
            try
            {
                uint pid; GetWindowThreadProcessId(h, out pid); int ex = GetWindowLong(h, -20);
                if (pid != me && IsWindowVisible(h) && !IsIconic(h) && (ex & 0x80) == 0 && (ex & 0x08000000) == 0 && (ex & 0x20) == 0)
                {
                    int cloaked = 0; DwmGetWindowAttribute(h, 14, out cloaked, 4);
                    StringBuilder t = new StringBuilder(256); GetWindowText(h, t, 256);
                    StringBuilder c = new StringBuilder(128); GetClassName(h, c, 128); string cn = c.ToString();
                    if (cloaked == 0 && t.Length > 0 && cn != "Progman" && cn != "WorkerW" && cn != "Shell_TrayWnd" && cn != "Shell_SecondaryTrayWnd")
                    {
                        RECT r; if (DwmGetWindowAttribute(h, 9, out r, 16) != 0) GetWindowRect(h, out r);
                        Rectangle w = Rectangle.FromLTRB(r.L, r.T, r.R, r.B); w.Intersect(SystemInformation.VirtualScreen);
                        if (w.Width >= 120 && w.Height >= 80) { rc = w; return true; }
                    }
                }
            }
            catch { }
            h = GetWindow(h, 2);
        }
        return false;
    }

    static Bitmap Grab(Rectangle r)
    {
        Bitmap b = new Bitmap(r.Width, r.Height, System.Drawing.Imaging.PixelFormat.Format24bppRgb);
        using (Graphics g = Graphics.FromImage(b)) g.CopyFromScreen(r.Location, Point.Empty, r.Size);
        return b;
    }

    static void Run()
    {
        Rectangle winRc; bool haveWin = TargetWindow(out winRc);
        Dictionary<string, string> st = LoadSettings();
        string last = st.ContainsKey("mode") ? st["mode"] : "area";
        string mode = ChooseMode(last, haveWin);
        if (mode == null) return;
        st["mode"] = mode; SaveSettings(st);
        Thread.Sleep(350);   // let the choice window disappear before the picture is taken
        Bitmap pic = null;
        try
        {
            if (mode == "win") pic = Grab(winRc);
            else if (mode == "all") pic = Grab(Screen.PrimaryScreen.Bounds);
            else pic = PickArea();
            if (pic == null) return;
            using (Form f = BuildPreview(pic, st)) f.ShowDialog();
        }
        finally { if (pic != null) pic.Dispose(); }
    }

    static Button Opt(string title, string sub, int y, bool isLast, bool enabled)
    {
        Button b = new Button(); b.Text = title + "\r\n" + sub; b.Font = new Font("Segoe UI", 10f); b.TextAlign = ContentAlignment.MiddleLeft;
        b.SetBounds(16, y, 368, 62); b.FlatStyle = FlatStyle.Flat; b.BackColor = Color.FromArgb(26, 32, 48); b.ForeColor = Ink; b.Enabled = enabled;
        b.FlatAppearance.BorderSize = 2; b.FlatAppearance.BorderColor = isLast ? Gold : Line; b.Padding = new Padding(10, 0, 0, 0);
        return b;
    }
    static string ChooseMode(string last, bool haveWin)
    {
        string result = null;
        using (Form f = new Form())
        {
            f.FormBorderStyle = FormBorderStyle.None; f.StartPosition = FormStartPosition.CenterScreen; f.TopMost = true; f.ShowInTaskbar = false; f.KeyPreview = true;
            f.BackColor = PanelBg; f.ClientSize = new Size(400, 340);
            f.Paint += delegate(object o, PaintEventArgs e) { using (Pen p = new Pen(Line, 2)) e.Graphics.DrawRectangle(p, 1, 1, f.Width - 3, f.Height - 3); };
            Label h = new Label(); h.Text = "Print from the screen"; h.Font = new Font("Segoe UI", 13f, FontStyle.Bold); h.ForeColor = Ink; h.SetBounds(16, 12, 368, 28); f.Controls.Add(h);
            Label sub = new Label(); sub.Text = "Nothing prints until you have seen the preview and pressed Print."; sub.ForeColor = Mute; sub.SetBounds(16, 42, 368, 20); f.Controls.Add(sub);
            Button bw = Opt("Print this window", "The window you were just in", 72, last == "win", haveWin);
            Button ba = Opt("Select area to print", "Drag a box around only what you want", 142, last == "area", true);
            Button bs = Opt("Whole screen", "Everything you can see", 212, last == "all", true);
            bw.Click += delegate { result = "win"; f.Close(); };
            ba.Click += delegate { result = "area"; f.Close(); };
            bs.Click += delegate { result = "all"; f.Close(); };
            Button cn = new Button(); cn.Text = "Cancel"; cn.SetBounds(284, 290, 100, 32); cn.FlatStyle = FlatStyle.Flat; cn.BackColor = Color.FromArgb(26, 32, 48); cn.ForeColor = Ink; cn.FlatAppearance.BorderColor = Line;
            cn.Click += delegate { f.Close(); };
            Label gl = new Label(); gl.Text = "Gold edge = the way you used last time"; gl.ForeColor = Mute; gl.Font = new Font("Segoe UI", 8.5f); gl.SetBounds(16, 298, 260, 20);
            f.Controls.Add(bw); f.Controls.Add(ba); f.Controls.Add(bs); f.Controls.Add(cn); f.Controls.Add(gl);
            f.KeyDown += delegate(object o, KeyEventArgs e) { if (e.KeyCode == Keys.Escape) f.Close(); };
            f.Shown += delegate { ForceFront(f); };
            f.ShowDialog();
        }
        return result;
    }

    class PickForm : Form
    {
        public Bitmap Full; public Rectangle Sel = Rectangle.Empty; Point start; bool drag;
        public PickForm(Bitmap full, Rectangle vs)
        {
            Full = full; DoubleBuffered = true; FormBorderStyle = FormBorderStyle.None; StartPosition = FormStartPosition.Manual; Bounds = vs; TopMost = true; ShowInTaskbar = false; Cursor = Cursors.Cross; KeyPreview = true; Shown += delegate { ForceFront(this); };
            MouseDown += delegate(object o, MouseEventArgs e) { start = e.Location; drag = true; Sel = Rectangle.Empty; };
            MouseMove += delegate(object o, MouseEventArgs e) { if (!drag) return; Sel = Rectangle.FromLTRB(Math.Min(start.X, e.X), Math.Min(start.Y, e.Y), Math.Max(start.X, e.X), Math.Max(start.Y, e.Y)); Invalidate(); };
            MouseUp += delegate(object o, MouseEventArgs e) { if (!drag) return; drag = false; if (Sel.Width >= 12 && Sel.Height >= 12) DialogResult = DialogResult.OK; else { Sel = Rectangle.Empty; Invalidate(); } };
            KeyDown += delegate(object o, KeyEventArgs e) { if (e.KeyCode == Keys.Escape) DialogResult = DialogResult.Cancel; };
            Shown += delegate { Activate(); };
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics; g.DrawImage(Full, 0, 0);
            using (SolidBrush dim = new SolidBrush(Color.FromArgb(130, 0, 0, 0)))
            {
                if (Sel.Width > 0 && Sel.Height > 0)
                {
                    Region keep = new Region(ClientRectangle); keep.Exclude(Sel); g.FillRegion(dim, keep); keep.Dispose();
                    using (Pen p = new Pen(Gold, 2)) { p.DashStyle = DashStyle.Dash; g.DrawRectangle(p, Sel); }
                    string lbl = Sel.Width + " x " + Sel.Height + " pixels"; SizeF sz = g.MeasureString(lbl, Font); int ly = Sel.Top > 26 ? Sel.Top - 24 : Sel.Top + 4;
                    g.FillRectangle(Brushes.Black, Sel.Left, ly, sz.Width + 8, sz.Height + 2); g.DrawString(lbl, Font, Brushes.White, Sel.Left + 4, ly + 1);
                }
                else g.FillRectangle(dim, ClientRectangle);
            }
            string hint = "Drag to choose the area. Release to continue. Esc to cancel."; SizeF hs = g.MeasureString(hint, Font);
            float hx = (ClientSize.Width - hs.Width) / 2f; g.FillRectangle(Brushes.Black, hx - 8, 8, hs.Width + 16, hs.Height + 8); g.DrawString(hint, Font, Brushes.White, hx, 12);
        }
    }
    static Bitmap PickArea()
    {
        Rectangle vs = SystemInformation.VirtualScreen;
        using (Bitmap full = Grab(vs))
        using (PickForm f = new PickForm(full, vs))
        {
            if (f.ShowDialog() != DialogResult.OK) return null;
            Rectangle s = f.Sel; s.Intersect(new Rectangle(0, 0, full.Width, full.Height));
            if (s.Width < 1 || s.Height < 1) return null;
            return full.Clone(s, full.PixelFormat);
        }
    }

    static Label SideLbl(string t, int y) { Label l = new Label(); l.Text = t; l.ForeColor = Mute; l.AutoSize = true; l.Location = new Point(14, y); return l; }
    static ComboBox SideCombo(int y) { ComboBox c = new ComboBox(); c.DropDownStyle = ComboBoxStyle.DropDownList; c.SetBounds(14, y, 252, 26); c.BackColor = Field; c.ForeColor = Ink; c.FlatStyle = FlatStyle.Flat; return c; }

    static Form BuildPreview(Bitmap pic, Dictionary<string, string> st)
    {
        Form f = new Form(); f.Text = "Amit - Print preview"; f.StartPosition = FormStartPosition.CenterScreen; f.ClientSize = new Size(1000, 680); f.MinimumSize = new Size(760, 600);
        f.BackColor = PanelBg; f.ForeColor = Ink; f.ShowInTaskbar = true; f.TopMost = true; f.Shown += delegate { ForceFront(f); };
        PrintDocument doc = new PrintDocument(); doc.DocumentName = "Amit screen print";
        doc.DefaultPageSettings.Margins = new Margins(50, 50, 50, 50);
        int fitMode = 0;   // 0 fit to page, 1 fill page (may crop), 2 actual size (may take several pages)
        if (st.ContainsKey("fit")) fitMode = st["fit"] == "fill" ? 1 : (st["fit"] == "actual" ? 2 : 0);
        bool bw = st.ContainsKey("color") && st["color"] == "bw";
        int pgFrom = 0, pgTo = 0;   // 0 = all pages; otherwise the 1-based first and last page to print
        List<int> todo = new List<int>(); int pageNo = 0;
        // the pages (columns x rows) the picture takes at the chosen size; fit and fill are always one page
        Func<RectangleF, Size> grid = delegate(RectangleF box)
        {
            if (fitMode != 2 || box.Width < 1 || box.Height < 1) return new Size(1, 1);
            return new Size(Math.Max(1, (int)Math.Ceiling(pic.Width * 100f / 96f / box.Width - 0.001f)), Math.Max(1, (int)Math.Ceiling(pic.Height * 100f / 96f / box.Height - 0.001f)));
        };
        Func<RectangleF> marginBox = delegate
        {
            Rectangle b = doc.DefaultPageSettings.Bounds; return new RectangleF(50, 50, Math.Max(1, b.Width - 100), Math.Max(1, b.Height - 100));
        };
        doc.BeginPrint += delegate
        {
            todo.Clear(); pageNo = 0; Size gs = grid(marginBox()); int total = gs.Width * gs.Height;
            int a = pgFrom <= 0 ? 1 : Math.Min(pgFrom, total), z = pgTo <= 0 ? total : Math.Min(Math.Max(pgTo, a), total);
            for (int n = a; n <= z; n++) todo.Add(n - 1);
        };
        doc.PrintPage += delegate(object o, PrintPageEventArgs e)
        {
            Graphics g = e.Graphics; g.InterpolationMode = InterpolationMode.HighQualityBicubic; g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            RectangleF box = e.MarginBounds; int idx = pageNo < todo.Count ? todo[pageNo] : 0; pageNo++;
            System.Drawing.Imaging.ImageAttributes ia = null;
            if (bw)
            {
                ia = new System.Drawing.Imaging.ImageAttributes();
                ia.SetColorMatrix(new System.Drawing.Imaging.ColorMatrix(new float[][] { new float[] { .3f, .3f, .3f, 0, 0 }, new float[] { .59f, .59f, .59f, 0, 0 }, new float[] { .11f, .11f, .11f, 0, 0 }, new float[] { 0, 0, 0, 1, 0 }, new float[] { 0, 0, 0, 0, 1 } }));
            }
            float dw, dh, dx, dy;
            if (fitMode == 2)
            {
                Size gs = grid(box); float s = 100f / 96f; dw = pic.Width * s; dh = pic.Height * s;
                dx = box.X - (idx % gs.Width) * box.Width; dy = box.Y - (idx / gs.Width) * box.Height;
            }
            else
            {
                float sx = box.Width / pic.Width, sy = box.Height / pic.Height; float sc = fitMode == 1 ? Math.Max(sx, sy) : Math.Min(sx, sy);
                dw = pic.Width * sc; dh = pic.Height * sc; dx = box.X + (box.Width - dw) / 2f; dy = box.Y + (box.Height - dh) / 2f;
            }
            g.SetClip(box);
            if (ia == null) g.DrawImage(pic, dx, dy, dw, dh);
            else { g.DrawImage(pic, new Rectangle((int)dx, (int)dy, (int)dw, (int)dh), 0, 0, pic.Width, pic.Height, GraphicsUnit.Pixel, ia); ia.Dispose(); }
            e.HasMorePages = pageNo < todo.Count;
        };
        Panel side = new Panel(); side.Dock = DockStyle.Left; side.Width = 280; side.BackColor = PanelBg;
        PrintPreviewControl ppc = new PrintPreviewControl(); ppc.Dock = DockStyle.Fill; ppc.Document = doc; ppc.AutoZoom = true; ppc.UseAntiAlias = true; ppc.BackColor = Color.FromArgb(85, 90, 102);
        ComboBox prn = SideCombo(30), pap = SideCombo(86), dir = SideCombo(142), fit = SideCombo(198), col = SideCombo(254), pgs = SideCombo(366);
        NumericUpDown cop = new NumericUpDown(); cop.SetBounds(14, 310, 100, 26); cop.Minimum = 1; cop.Maximum = 20; cop.Value = 1; cop.BackColor = Field; cop.ForeColor = Ink;
        NumericUpDown pf = new NumericUpDown(), pt = new NumericUpDown();
        pf.SetBounds(14, 398, 70, 26); pt.SetBounds(120, 398, 70, 26);
        foreach (NumericUpDown nn in new NumericUpDown[] { pf, pt }) { nn.Minimum = 1; nn.Maximum = 99; nn.Value = 1; nn.BackColor = Field; nn.ForeColor = Ink; nn.Enabled = false; }
        Label pto = new Label(); pto.Text = "to"; pto.ForeColor = Mute; pto.AutoSize = true; pto.Location = new Point(92, 402);
        Label pof = new Label(); pof.ForeColor = Mute; pof.AutoSize = true; pof.Location = new Point(198, 402);
        Label status = new Label(); status.SetBounds(14, 506, 252, 60); status.ForeColor = Color.FromArgb(60, 208, 210);
        Button bp = new Button(); bp.Text = "Print"; bp.SetBounds(166, 452, 100, 34); bp.FlatStyle = FlatStyle.Flat; bp.BackColor = Gold; bp.ForeColor = Color.FromArgb(26, 21, 0); bp.Font = new Font("Segoe UI", 10f, FontStyle.Bold); bp.FlatAppearance.BorderColor = Gold;
        Button bc = new Button(); bc.Text = "Cancel"; bc.SetBounds(14, 452, 100, 34); bc.FlatStyle = FlatStyle.Flat; bc.BackColor = Color.FromArgb(26, 32, 48); bc.ForeColor = Ink; bc.FlatAppearance.BorderColor = Line;
        side.Controls.AddRange(new Control[] { SideLbl("Printer", 10), prn, SideLbl("Paper", 66), pap, SideLbl("Direction", 122), dir, SideLbl("Size on the page", 178), fit, SideLbl("Color", 234), col, SideLbl("Copies", 290), cop, SideLbl("Pages", 346), pgs, pf, pto, pt, pof, bc, bp, status });
        f.Controls.Add(ppc); f.Controls.Add(side);
        dir.Items.AddRange(new object[] { "Landscape (wide)", "Portrait (tall)" }); dir.SelectedIndex = pic.Width >= pic.Height ? 0 : 1;
        fit.Items.AddRange(new object[] { "Fit to page", "Fill page (may crop)", "Actual size (may use several pages)" }); fit.SelectedIndex = fitMode;
        col.Items.AddRange(new object[] { "Color", "Black and white" }); col.SelectedIndex = bw ? 1 : 0;
        pgs.Items.AddRange(new object[] { "All pages", "Only these pages" }); pgs.SelectedIndex = 0;
        bool loading = true, busy = false;
        foreach (string p in PrinterSettings.InstalledPrinters) prn.Items.Add(p);
        if (prn.Items.Count == 0) { status.ForeColor = Color.FromArgb(255, 132, 98); status.Text = "No printer is set up on this computer. Add one in Windows settings (Printers and scanners)."; bp.Enabled = false; }
        else
        {
            string want = st.ContainsKey("printer") ? st["printer"] : doc.PrinterSettings.PrinterName;
            int pi = prn.Items.IndexOf(want); if (pi < 0) pi = prn.Items.IndexOf(doc.PrinterSettings.PrinterName); prn.SelectedIndex = pi < 0 ? 0 : pi;
        }
        MethodInvoker fillPapers = delegate
        {
            pap.Items.Clear(); if (prn.SelectedItem == null) return;
            doc.PrinterSettings.PrinterName = (string)prn.SelectedItem; int pick = -1, k = 0;
            foreach (PaperSize ps in doc.PrinterSettings.PaperSizes)
            {
                pap.Items.Add(ps.PaperName);
                if (st.ContainsKey("paper") && ps.PaperName == st["paper"]) pick = k;
                else if (pick < 0 && (ps.PaperName == "Letter" || ps.PaperName == "A4") && !st.ContainsKey("paper")) pick = k;
                k++;
            }
            if (pap.Items.Count > 0) pap.SelectedIndex = pick < 0 ? 0 : pick;
        };
        MethodInvoker apply = delegate
        {
            if (loading || busy || prn.SelectedItem == null) return;
            busy = true;
            try
            {
                doc.PrinterSettings.PrinterName = (string)prn.SelectedItem;
                int i = 0; foreach (PaperSize ps in doc.PrinterSettings.PaperSizes) { if (i == pap.SelectedIndex) { doc.DefaultPageSettings.PaperSize = ps; break; } i++; }
                doc.DefaultPageSettings.Landscape = dir.SelectedIndex == 0; doc.DefaultPageSettings.Margins = new Margins(50, 50, 50, 50);
                fitMode = fit.SelectedIndex; bw = col.SelectedIndex == 1;
                try { doc.DefaultPageSettings.Color = !bw; } catch { }
                Size gs = grid(marginBox()); int total = gs.Width * gs.Height;
                pgs.Enabled = total > 1; if (total <= 1) pgs.SelectedIndex = 0;
                bool some = pgs.SelectedIndex == 1; pf.Enabled = some; pt.Enabled = some;
                pf.Maximum = total; pt.Maximum = total; if (pf.Value > total) pf.Value = total; if (pt.Value > total) pt.Value = total; if (pt.Value < pf.Value) pt.Value = pf.Value;
                pgFrom = some ? (int)pf.Value : 0; pgTo = some ? (int)pt.Value : 0;
                pof.Text = total > 1 ? "of " + total : "(1 page)";
                ppc.InvalidatePreview();
            }
            catch { }
            busy = false;
        };
        prn.SelectedIndexChanged += delegate { loading = true; fillPapers(); loading = false; apply(); };
        pap.SelectedIndexChanged += delegate { apply(); }; dir.SelectedIndexChanged += delegate { apply(); }; fit.SelectedIndexChanged += delegate { apply(); };
        col.SelectedIndexChanged += delegate { apply(); }; pgs.SelectedIndexChanged += delegate { apply(); }; pf.ValueChanged += delegate { apply(); }; pt.ValueChanged += delegate { apply(); };
        loading = true; fillPapers(); loading = false; apply();
        bc.Click += delegate { f.Close(); };
        bp.Click += delegate
        {
            try
            {
                apply(); doc.PrinterSettings.Copies = (short)cop.Value; doc.Print();
                st["printer"] = (string)prn.SelectedItem; st["paper"] = pap.SelectedItem == null ? "" : (string)pap.SelectedItem; st["fit"] = fitMode == 1 ? "fill" : (fitMode == 2 ? "actual" : "fit"); st["color"] = bw ? "bw" : "color"; SaveSettings(st);
                status.ForeColor = Color.FromArgb(60, 208, 210); status.Text = "Sent to " + prn.SelectedItem + ". You can close this window."; bp.Enabled = false; bc.Text = "Close";
            }
            catch (Exception ex) { status.ForeColor = Color.FromArgb(255, 132, 98); status.Text = "Could not print: " + ex.Message; }
        };
        f.KeyPreview = true; f.KeyDown += delegate(object o, KeyEventArgs e) { if (e.KeyCode == Keys.Escape) f.Close(); };
        return f;
    }

    // a picture of the preview (with a sample picture of the screen), to check the layout without printing anything
    public static void SelfTest(string outPrefix)
    {
        try
        {
            using (Bitmap pic = Grab(Screen.PrimaryScreen.Bounds))
            using (Form f = BuildPreview(pic, new Dictionary<string, string>()))
            {
                f.StartPosition = FormStartPosition.Manual; f.Location = new Point(20, 20); f.Show(); f.Activate();
                for (int n = 0; n < 20; n++) { Application.DoEvents(); Thread.Sleep(100); }   // the preview draws its page a moment after the window appears
                using (Bitmap bmp = Grab(f.Bounds)) bmp.Save(outPrefix + "_preview.png", System.Drawing.Imaging.ImageFormat.Png);
                f.Close();
            }
            File.WriteAllText(outPrefix + "_result.txt", "OK");
        }
        catch (Exception ex) { File.WriteAllText(outPrefix + "_result.txt", "FAILED: " + ex.Message); }
    }
}

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
using System.IO;
using System.Runtime.InteropServices;
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
    EventWaitHandle showEvent;

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
            cfg = c; hover = -1; tip.Hide(this); Current();
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
        using (Font f = new Font("Segoe UI Emoji", px, FontStyle.Regular, GraphicsUnit.Pixel)) using (SolidBrush b = new SolidBrush(c)) using (StringFormat sf = new StringFormat())
        {
            sf.Alignment = StringAlignment.Center; sf.LineAlignment = StringAlignment.Center;
            g.DrawString(icon, f, b, new RectangleF(area.X, area.Y, area.Width, area.Height), sf);
        }
    }
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
                    else if (s.t == "open_program") { if (!String.IsNullOrEmpty(s.path)) Process.Start(s.path); }
                    else if (s.t == "play_music") { if (!String.IsNullOrEmpty(s.path)) Process.Start(s.path); else if (!String.IsNullOrEmpty(s.url)) Process.Start(s.url); }
                    else if (s.t == "speak") { using (System.Speech.Synthesis.SpeechSynthesizer sp = new System.Speech.Synthesis.SpeechSynthesizer()) sp.Speak(s.text ?? ""); }
                    else if (s.t == "wait") { Thread.Sleep(Math.Max(0, Math.Min(5000, s.ms))); }
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





// Amit Tracker Launcher / Window Indicator
// Launches tracking (bridge server + watchers + LibreHardwareMonitor via
// Run_AmitTracker.ps1), then shows a real, visible window - not just a
// hidden system tray icon - so anyone installing this can actually find it
// and stop it. A tray-only version was tried first, but tray icons default
// to Windows' hidden-icons overflow area that most people never discover -
// closing the browser tab alone isn't reliable either (crash, force close,
// etc.), so a real taskbar-visible window is the dependable, discoverable
// path (redesigned 2026-07-13 per Ryan's direct request).

using System;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using System.Drawing;

class AmitTrackerWindow : Form
{
    private string exeDir;
    private Label statusLabel;
    private Button stopBtn;
    private Button minimizeBtn;
    private Button dashboardBtn;
    private bool stopping = false;
    private const string dashboardUrl = "https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html";
    private const string bridgeBase = "http://localhost:8710";
    private bool sawTrackingRunning = false;

    // --tray-only launch mode (added 2026-09-05, Amit Mobile "Connect Your
    // Phone" install gap): when true, this window never becomes visible -
    // instead a real system tray NotifyIcon is shown so a person who only
    // installed for their phone still has something discoverable to find
    // and shut down. Everything else (Stop Tracker logic, the external
    // stop poller, FormClosing guard) is shared code, unchanged, so
    // behavior stays identical in both modes except for what's visible.
    private bool trayOnly;
    private NotifyIcon trayIcon;

    public AmitTrackerWindow() : this(false) { }

    public AmitTrackerWindow(bool trayOnly)
    {
        this.trayOnly = trayOnly;
        exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

        Text = "Amit - Tracker";
        Width = 440;
        Height = 190;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = true;
        StartPosition = FormStartPosition.CenterScreen;
        ShowInTaskbar = true;
        try { Icon = new Icon(Path.Combine(exeDir, "amit_icon.ico")); } catch { }

        statusLabel = new Label
        {
            Text = "Amit - Tracker is running - watching this computer's\nresources, diagnostics, and activity in the background.",
            AutoSize = false,
            Left = 20,
            Top = 20,
            Width = 390,
            Height = 50
        };

        minimizeBtn = new Button { Text = "Minimize", Left = 20, Top = 95, Width = 110, Height = 34 };
        minimizeBtn.Click += (s, e) => { WindowState = FormWindowState.Minimized; };

        dashboardBtn = new Button { Text = "Open Dashboard", Left = 150, Top = 95, Width = 140, Height = 34 };
        dashboardBtn.Click += (s, e) => { try { Process.Start(dashboardUrl); } catch { } };

        stopBtn = new Button { Text = "Stop Tracker", Left = 300, Top = 95, Width = 110, Height = 34 };
        stopBtn.Click += (s, e) => StopTracker();

        Controls.Add(statusLabel);
        Controls.Add(minimizeBtn);
        Controls.Add(dashboardBtn);
        Controls.Add(stopBtn);

        // Closing this window the normal way (X button, Alt+F4) must stop
        // tracking too - otherwise everything keeps running invisibly with
        // no window and no tray icon left to find it by, exactly the
        // problem this whole redesign exists to fix.
        FormClosing += OnFormClosing;

        if (trayOnly)
        {
            ShowInTaskbar = false;
            WindowState = FormWindowState.Minimized;
            SetupTrayIcon();
            // Force the window handle to actually exist even though the
            // form itself is never shown - without this, StopTracker()'s
            // this.Invoke(...) call has no handle to marshal onto (Invoke
            // requires IsHandleCreated), silently falls through to the
            // catch's plain Application.Exit(), and the process was
            // observed live to sit alive indefinitely afterward instead of
            // actually closing. Reading .Handle forces CreateHandle().
            var forceHandle = this.Handle;
        }

        StartTracking();
        StartExternalStopPoller();
    }

    // Standard WinForms technique for a form that must never actually
    // become visible on screen, regardless of Application.Run/Show calls -
    // more reliable than just setting Visible=false in the constructor,
    // since Application.Run(form) shows its main form on its own.
    protected override void SetVisibleCore(bool value)
    {
        base.SetVisibleCore(trayOnly ? false : value);
    }

    private void SetupTrayIcon()
    {
        var menu = new ContextMenuStrip();
        menu.Items.Add("Open Dashboard", null, (s, e) => { try { Process.Start(dashboardUrl); } catch { } });
        menu.Items.Add("Stop Tracker", null, (s, e) => StopTracker());

        trayIcon = new NotifyIcon
        {
            Text = "Amit Tracker - running in the background",
            Visible = true,
            ContextMenuStrip = menu
        };
        try { trayIcon.Icon = new Icon(Path.Combine(exeDir, "amit_icon.ico")); }
        catch { trayIcon.Icon = SystemIcons.Application; }
        trayIcon.DoubleClick += (s, e) => { try { Process.Start(dashboardUrl); } catch { } };
    }

    // Ryan's direct request 2026-07-16: pressing Install Updates on the
    // dashboard (or Close there) stops tracking on the bridge server, but
    // this window had no way of knowing that happened - it just sat open
    // looking like tracking was still active. Rather than only reacting to
    // its own Stop Tracker button, this window now watches the bridge's
    // own tracking status and closes itself the moment it sees tracking
    // was stopped from anywhere else (the dashboard, in this case).
    private void StartExternalStopPoller()
    {
        var pollThread = new Thread(() =>
        {
            while (!stopping)
            {
                Thread.Sleep(3000);
                bool running = false;
                bool gotAnswer = false;
                try
                {
                    var client = new WebClient();
                    client.Headers[HttpRequestHeader.ContentType] = "text/plain";
                    var task = client.DownloadStringTaskAsync(bridgeBase + "/api/tracker-status");
                    if (task.Wait(TimeSpan.FromSeconds(2)))
                    {
                        running = task.Result.IndexOf("\"running\":true", StringComparison.OrdinalIgnoreCase) >= 0;
                        gotAnswer = true;
                    }
                }
                catch { /* bridge unreachable this cycle - try again next tick */ }

                if (!gotAnswer) continue;

                if (running) { sawTrackingRunning = true; continue; }

                // Only close on a running->stopped transition we actually
                // witnessed, not on the very first poll - avoids closing
                // immediately if the bridge briefly reports false during
                // its own startup before tracking has even begun.
                if (sawTrackingRunning && !stopping)
                {
                    try { this.Invoke(new Action(StopTracker)); } catch { }
                    return;
                }
            }
        });
        pollThread.IsBackground = true;
        pollThread.Start();
    }

    private void StartTracking()
    {
        // Tray-only mode is itself LAUNCHED BY Run_AmitTracker.ps1 (see that
        // script's -NoOpenDashboard branch) - re-invoking that same script
        // here would just spawn AmitTracker.exe again in a loop. So this
        // mode starts the bridge/tracking directly instead, headlessly,
        // with no window and no dashboard tab opened.
        if (trayOnly) { StartTrackingHeadless(); return; }

        string launcherScript = Path.Combine(exeDir, "Run_AmitTracker.ps1");
        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + launcherScript + "\"",
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Hidden
        };
        Process.Start(psi);
    }

    // Mirrors Run_AmitTracker.ps1's own logic (ensure the bridge is up,
    // then call /api/start-tracking) but never opens a dashboard tab and
    // never shows a window - used only by the tray-only launch path so an
    // Amit Mobile "Connect Your Phone" install doesn't yank the person
    // into Computer Health's dashboard just because tracking also started.
    private void StartTrackingHeadless()
    {
        string bridgeScript = Path.Combine(exeDir, "amit_bridge_server.ps1");
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + bridgeScript + "\"",
                UseShellExecute = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            Process.Start(psi);
        }
        catch { /* bridge may already be running from a prior launch */ }

        var t = new Thread(() =>
        {
            for (int i = 0; i < 20; i++)
            {
                try
                {
                    var probe = new WebClient();
                    probe.DownloadString(bridgeBase + "/api/device");
                    break;
                }
                catch { Thread.Sleep(500); }
            }
            try
            {
                var client = new WebClient();
                client.Headers[HttpRequestHeader.ContentType] = "text/plain";
                var task = client.UploadStringTaskAsync(bridgeBase + "/api/start-tracking", "POST", "");
                task.Wait(TimeSpan.FromSeconds(30));
            }
            catch { /* bridge unreachable after polling - nothing more to do here */ }
        });
        t.IsBackground = true;
        t.Start();
    }

    private void OnFormClosing(object sender, FormClosingEventArgs e)
    {
        if (!stopping)
        {
            e.Cancel = true;
            StopTracker();
        }
    }

    private int stopTriggered = 0;

    private void StopTracker()
    {
        // Atomic guard, not just the plain `stopping` bool check below -
        // the external stop poller thread and the button's own click
        // handler (or FormClosing) can both pass a "!stopping" check
        // within the same few-millisecond window before either has
        // actually set it, since setting `stopping = true` used to be the
        // FIRST line inside this method, too late to block a concurrent
        // second call already past its own outer check. Real bug caught
        // live 2026-07-16 (Ryan): two separate cleanup threads both ran,
        // each opening its own ?justStopped=1 dashboard tab and racing
        // each other to log the session, which is why duplicate tabs
        // reappeared and the real summary kept losing to a generic one.
        if (Interlocked.Exchange(ref stopTriggered, 1) != 0) return;
        stopping = true;

        // The window itself must disappear right away - the actual cleanup
        // (stop-tracking call, LHM's elevated shutdown fallback, the WMI
        // query below) can each take a few seconds, and if any one of them
        // hangs, the whole window used to sit frozen waiting for it (caught
        // live 2026-07-13 - took a full 30 seconds to disappear). Hiding
        // immediately and doing the real work on a background thread means
        // "closing" always feels instant regardless of how long the
        // underlying cleanup actually takes.
        Hide();

        var cleanupThread = new Thread(() =>
        {
            try
            {
                var client = new WebClient();
                client.Headers[HttpRequestHeader.ContentType] = "text/plain";
                var task = client.UploadStringTaskAsync(bridgeBase + "/api/stop-tracking", "POST", "");
                task.Wait(TimeSpan.FromSeconds(5)); // bounded - move on regardless of the outcome
            }
            catch { /* bridge may already be down, or timed out - nothing more to do here */ }

            // Open the dashboard with a flag so it knows to show a session
            // summary instead of the normal live view, and log the
            // completion - deliberately BEFORE killing the bridge below.
            // The dashboard's cursory overview (added 2026-07-14) needs to
            // fetch real resource/diagnostics/sensor data to analyze the
            // session, and that only works while the bridge is still alive.
            // Ryan's direct request 2026-07-16: this catch used to silently
            // swallow any failure with zero trace - if Process.Start ever
            // fails to actually open the summary tab (blocked browser
            // association, security policy, anything), there was no way to
            // ever know versus it opening fine but something else going
            // wrong downstream. Now writes hard evidence either way.
            try {
                Process.Start(dashboardUrl + "?justStopped=1");
                File.AppendAllText(Path.Combine(Path.GetTempPath(), "amit_tracker_debug.log"), DateTime.Now + " - Process.Start(justStopped) SUCCEEDED\r\n");
            } catch (Exception ex) {
                File.AppendAllText(Path.Combine(Path.GetTempPath(), "amit_tracker_debug.log"), DateTime.Now + " - Process.Start(justStopped) FAILED: " + ex.Message + "\r\n");
            }

            // Grace period for the dashboard tab to actually load and finish
            // its fetches before the bridge disappears out from under it -
            // without this, the bridge could die before a slow-loading tab
            // ever gets a chance to read anything.
            Thread.Sleep(TimeSpan.FromSeconds(8));

            // REVERSED 2026-09-07, Ryan's direct instruction: this used to
            // also kill the bridge server itself (a 2026-07-13 request, back
            // when the bridge only served Computer Health, so tearing down
            // everything on Stop Tracker was harmless). The bridge now also
            // serves AmitBooks scanning, Amit Mobile, and AmitCoder's token
            // connection (the Single Local Connection Standard - one shared
            // process, many routes) - stopping Computer Health's own
            // tracking must no longer take those other connections down
            // with it. StopBridgeServer() is left defined below (unused) in
            // case a genuinely full teardown is ever needed again for some
            // other reason - it is just no longer called from here.

            try { if (trayIcon != null) trayIcon.Visible = false; } catch { }

            try { this.Invoke(new Action(Application.Exit)); } catch { Application.Exit(); }
        });
        cleanupThread.IsBackground = true;
        cleanupThread.Start();
    }

    private void StopBridgeServer()
    {
        try
        {
            using (var searcher = new ManagementObjectSearcher(
                "SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name='powershell.exe'"))
            {
                foreach (ManagementObject mo in searcher.Get())
                {
                    string cmdLine = mo["CommandLine"] as string;
                    if (cmdLine != null && cmdLine.IndexOf("amit_bridge_server.ps1", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        int pid = Convert.ToInt32(mo["ProcessId"]);
                        try { Process.GetProcessById(pid).Kill(); } catch { }
                    }
                }
            }
        }
        catch { /* WMI unavailable for some reason - not fatal, just leaves the bridge running */ }
    }
}

class AmitTracker
{
    // Guards against two windows ending up alive at once - caught live
    // 2026-07-13 (two AmitTracker.exe processes running simultaneously,
    // each having independently called StartTracking). Most likely cause:
    // the amit-tracker:// protocol firing more than once (e.g. two dashboard
    // tabs, or a slow click registering twice) with nothing stopping a
    // second launch from running the whole startup chain again - same class
    // of bug already fixed in AmitInstaller.exe.
    [STAThread]
    static void Main(string[] args)
    {
        // --tray-only (added 2026-09-05): used by Run_AmitTracker.ps1's
        // -NoOpenDashboard branch (the Amit Mobile "Connect Your Phone"
        // install path) so tracking still shows up somewhere discoverable
        // - a system tray icon - without popping the full Computer Health
        // window or opening the dashboard for someone who only installed
        // for their phone.
        bool trayOnly = false;
        foreach (var a in args)
        {
            if (string.Equals(a, "--tray-only", StringComparison.OrdinalIgnoreCase)) trayOnly = true;
        }

        // Global unhandled-exception logging (added 2026-09-05, diagnosing a
        // real bug: --tray-only installs were found live with AmitTracker.exe
        // gone from the process list ~17 minutes after launch, while the
        // bridge/watchers it started kept running fine - meaning the process
        // died some way OTHER than its own guarded StopTracker() path.
        // WinForms apps with no handler here crash completely silently (no
        // window to show an error, nothing written anywhere) - this is pure
        // visibility, not a fix for any specific cause, since none has been
        // confirmed yet. Wired before Application.Run so it covers the
        // entire lifetime of the app, both launch modes.
        AppDomain.CurrentDomain.UnhandledException += (s, e) =>
        {
            try
            {
                var ex = e.ExceptionObject as Exception;
                LogCrash("AppDomain.UnhandledException (IsTerminating=" + e.IsTerminating + ")", ex);
            }
            catch { /* logging itself must never throw during a crash */ }
        };
        Application.ThreadException += (s, e) =>
        {
            try { LogCrash("Application.ThreadException", e.Exception); }
            catch { }
        };
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);

        bool createdNew;
        using (var singleInstance = new Mutex(true, "Global\\AmitTrackerRunning", out createdNew))
        {
            if (!createdNew)
            {
                if (!trayOnly)
                {
                    MessageBox.Show(
                        "Amit Tracker is already running - check your taskbar.",
                        "Amit Tracker",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information);
                }
                // Silent no-op when tray-only and already running - a
                // second Amit Mobile connect attempt shouldn't pop a
                // dialog box for someone who never sees a window at all.
                return;
            }
            Application.EnableVisualStyles();
            Application.Run(new AmitTrackerWindow(trayOnly));
        }
    }

    private static void LogCrash(string source, Exception ex)
    {
        string path = Path.Combine(Path.GetTempPath(), "amit_tracker_crash.log");
        string msg = DateTime.Now + " - " + source + "\r\n" +
            (ex != null ? ex.ToString() : "(no exception object)") + "\r\n\r\n";
        File.AppendAllText(path, msg);
    }
}

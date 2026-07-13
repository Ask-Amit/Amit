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

    public AmitTrackerWindow()
    {
        exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

        Text = "Amit Computer Tracker";
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
            Text = "Amit's computer tracker is running - watching this computer's\nresources, diagnostics, and activity in the background.",
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

        StartTracking();
    }

    private void StartTracking()
    {
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

    private void OnFormClosing(object sender, FormClosingEventArgs e)
    {
        if (!stopping)
        {
            e.Cancel = true;
            StopTracker();
        }
    }

    private void StopTracker()
    {
        stopping = true;
        statusLabel.Text = "Stopping tracker and closing everything down...";
        stopBtn.Enabled = false;
        minimizeBtn.Enabled = false;
        dashboardBtn.Enabled = false;
        Application.DoEvents();

        try
        {
            using (var client = new WebClient())
            {
                client.Headers[HttpRequestHeader.ContentType] = "text/plain";
                client.UploadString(bridgeBase + "/api/stop-tracking", "POST", "");
            }
        }
        catch { /* bridge may already be down - nothing more to stop */ }

        // Open the dashboard with a flag so it knows to show a session
        // summary instead of the normal live view, and log the completion.
        try { Process.Start(dashboardUrl + "?justStopped=1"); } catch { }

        Close();
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
    static void Main()
    {
        bool createdNew;
        using (var singleInstance = new Mutex(true, "Global\\AmitTrackerRunning", out createdNew))
        {
            if (!createdNew)
            {
                MessageBox.Show(
                    "Amit Tracker is already running - check your taskbar.",
                    "Amit Tracker",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                return;
            }
            Application.EnableVisualStyles();
            Application.Run(new AmitTrackerWindow());
        }
    }
}

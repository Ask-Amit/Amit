// Amit Tracker Launcher / Tray Indicator
// Launches tracking (bridge server + watchers + LibreHardwareMonitor via
// Run_AmitTracker.ps1), then stays running as a small system tray icon so
// there's always a visible "tracker is running" indicator and a real way
// to stop it - closing the browser tab alone isn't reliable (crash, force
// close, etc.), so this is the dependable path.

using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using System.Drawing;

class AmitTrackerContext : ApplicationContext
{
    private NotifyIcon trayIcon;
    private string exeDir;
    private const string dashboardUrl = "https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html";
    private const string bridgeBase = "http://localhost:8710";

    public AmitTrackerContext()
    {
        exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

        var menu = new ContextMenuStrip();
        menu.Items.Add("Amit Tracker - Running", null, (s, e) => { }).Enabled = false;
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Open Dashboard", null, OnOpenDashboard);
        menu.Items.Add("Stop Tracker", null, OnStopTracker);

        Icon trayIconImage;
        try { trayIconImage = new Icon(Path.Combine(exeDir, "amit_icon.ico")); }
        catch { trayIconImage = SystemIcons.Application; }

        trayIcon = new NotifyIcon
        {
            Icon = trayIconImage,
            Text = "Amit Tracker - Running",
            Visible = true,
            ContextMenuStrip = menu
        };
        trayIcon.BalloonTipTitle = "Amit Tracker";
        trayIcon.BalloonTipText = "Now running - tracking this computer's resources, diagnostics, and activity. Right-click this icon any time to stop.";
        trayIcon.ShowBalloonTip(4000);

        StartTracking();
    }

    private void StartTracking()
    {
        string launcherScript = Path.Combine(exeDir, "Run_AmitTracker.ps1");
        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + launcherScript + "\"",
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Hidden
        };
        Process.Start(psi);
    }

    private void OnOpenDashboard(object sender, EventArgs e)
    {
        Process.Start(dashboardUrl);
    }

    private void OnStopTracker(object sender, EventArgs e)
    {
        trayIcon.Text = "Amit Tracker - Stopping...";
        trayIcon.BalloonTipTitle = "Amit Tracker";
        trayIcon.BalloonTipText = "Stopping tracking and closing everything down...";
        trayIcon.ShowBalloonTip(2000);

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

        trayIcon.Visible = false;
        trayIcon.Dispose();
        Application.Exit();
    }
}

class AmitTracker
{
    // Guards against two tray icons ending up alive at once - caught live
    // 2026-07-13 (two AmitTracker.exe processes running simultaneously, each
    // with its own tray icon, each having independently called StartTracking).
    // Most likely cause: the amit-tracker:// protocol firing more than once
    // (e.g. two dashboard tabs, or a slow click registering twice) with
    // nothing stopping a second launch from running the whole startup chain
    // again, same class of bug already fixed in AmitInstaller.exe.
    [STAThread]
    static void Main()
    {
        bool createdNew;
        using (var singleInstance = new Mutex(true, "Global\\AmitTrackerRunning", out createdNew))
        {
            if (!createdNew)
            {
                MessageBox.Show(
                    "Amit Tracker is already running - check your system tray (including the hidden icons ^ arrow near the clock).",
                    "Amit Tracker",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                return;
            }
            Application.EnableVisualStyles();
            Application.Run(new AmitTrackerContext());
        }
    }
}

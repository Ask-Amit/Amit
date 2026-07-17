// Amit Installer - a real double-clickable installer. No right-click, no
// "Run with PowerShell" - just double-click and it runs.
//
// REWORK (2026-07-13): the previous version downloaded Install_AmitTracker.ps1
// and all of its sibling files live from GitHub at install time. That put
// every single install at the mercy of whatever networking quirk the user's
// machine happened to have that day - antivirus interception, corporate
// proxies, .NET certificate-revocation-check hangs, whatever. Different for
// every browser/AV/network combination, impossible to chase down one at a
// time for every user forever.
//
// Fix: every file the installer needs is now embedded directly inside this
// .exe at compile time and extracted straight to disk. Nothing needs to be
// fetched over the network for the install itself to succeed - ever, on any
// machine. The only network call left is a short, best-effort, non-blocking
// check for a newer version, which can fail silently without affecting the
// install at all.
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

class AmitInstaller
{
    // Bump this alongside VERSION at repo root whenever this exe is rebuilt.
    // Kept in lockstep with the Computer Health dashboard's own version
    // number (Ryan's direct request 2026-07-16) - the installer literally
    // embeds the dashboard as a resource, so one shared number means you
    // can look at either version and immediately know if the other is
    // stale, instead of cross-referencing two independent counters.
    const string CURRENT_VERSION = "3.51";

    // Every file Install_AmitTracker.ps1 expects to find sitting next to it.
    // Logical resource names (via plain /resource:path, no explicit name)
    // are just the bare file name, so this list doubles as both the
    // manifest resource names and the files written to disk.
    static readonly string[] EmbeddedFiles = new[]
    {
        "Install_AmitTracker.ps1",
        "amit_bridge_server.ps1",
        "activity_watcher2.ps1",
        "resource_watcher.ps1",
        "diagnostics_watcher.ps1",
        "app_behavior_watcher.ps1",
        "install_snapshot_watcher.ps1",
        "Run_AmitTracker.ps1",
        "AmitTracker.exe",
        "amit_icon.ico",
        "ComputerHealth_Dashboard.html"
    };

    [STAThread]
    static void Main()
    {
        // Guards against the install-and-launch chain running twice at once -
        // e.g. a slow double-click registering as two separate launches, or
        // someone impatiently re-running the exe while the ~10-20 second
        // install is still working and its console window looks like nothing
        // is happening. A second concurrent launch exits immediately instead
        // of running the whole chain again and opening a duplicate dashboard
        // tab (the exact bug reported 2026-07-13 - three tabs from one click).
        bool createdNew;
        using (var singleInstance = new Mutex(true, "Global\\AmitInstallerRunning", out createdNew))
        {
            if (!createdNew)
            {
                MessageBox.Show(
                    "Amit is already installing - this window can be closed. Give it 10-20 seconds to finish; " +
                    "the dashboard will open on its own when it's done.",
                    "Amit Installer",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                return;
            }
            RunInstall();
        }
    }

    static void RunInstall()
    {
        try
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            // First thing on launch, as requested: check for a newer
            // version. Best-effort only - never blocks or fails the install
            // that follows, since everything needed for that is already
            // bundled in this exe regardless of how this check goes.
            CheckForUpdateNonBlocking();

            string tempDir = Path.Combine(Path.GetTempPath(), "AmitInstallerFiles");
            Directory.CreateDirectory(tempDir);
            ExtractEmbeddedFiles(tempDir);

            string scriptPath = Path.Combine(tempDir, "Install_AmitTracker.ps1");
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\"",
                UseShellExecute = true
                // Deliberately NOT hidden - the walkthrough already tells
                // people "a black window will briefly appear, that's the
                // setup working" - showing it is the expected, explained
                // behavior, not something to hide.
            };
            var proc = Process.Start(psi);
            proc.WaitForExit();

            // Don't stop at "installed" - finish the job. Install_AmitTracker.ps1
            // always places Run_AmitTracker.ps1 at this exact location, so
            // start tracking and open the dashboard immediately, rather than
            // making someone go back to the browser and click Retry themselves.
            string installedWatchersDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AmitComputerHealth", "Watchers");
            string runScript = Path.Combine(installedWatchersDir, "Run_AmitTracker.ps1");

            if (File.Exists(runScript))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + runScript + "\"",
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                });
            }
            else
            {
                MessageBox.Show(
                    "Install complete, but the tracker couldn't be started automatically - " +
                    "look for the \"Amit\" icon on your desktop and double-click it to open your Amit Hub.",
                    "Amit Installer",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "Something went wrong during install:\n\n" + ex.Message,
                "Amit Installer",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    static void ExtractEmbeddedFiles(string destDir)
    {
        var asm = Assembly.GetExecutingAssembly();
        foreach (var name in EmbeddedFiles)
        {
            using (var stream = asm.GetManifestResourceStream(name))
            {
                if (stream == null)
                {
                    // Should never happen - every name in EmbeddedFiles is
                    // compiled into this exe as a resource. If the build step
                    // ever drifts out of sync with this list, fail loudly
                    // here rather than silently shipping a broken install.
                    throw new FileNotFoundException(
                        "Missing embedded resource: " + name + " - this installer build is out of date.");
                }
                string destPath = Path.Combine(destDir, name);
                using (var fileStream = new FileStream(destPath, FileMode.Create, FileAccess.Write))
                {
                    stream.CopyTo(fileStream);
                }
            }
        }
    }

    static void CheckForUpdateNonBlocking()
    {
        try
        {
            using (var client = new WebClient())
            {
                client.Headers.Add("User-Agent", "AmitInstaller");
                var task = client.DownloadStringTaskAsync(
                    "https://raw.githubusercontent.com/Ask-Amit/Amit/main/VERSION");
                if (!task.Wait(3000)) return; // timed out - move on, install still works fully offline
                string remote = task.Result.Trim();
                Version rv, cv;
                if (!string.IsNullOrEmpty(remote) &&
                    Version.TryParse(remote, out rv) &&
                    Version.TryParse(CURRENT_VERSION, out cv) &&
                    rv > cv)
                {
                    MessageBox.Show(
                        "A newer version of Amit (" + remote + ") is available - this installer (v" + CURRENT_VERSION +
                        ") will still install and work fine, but you may want to grab the latest copy from the dashboard afterward.",
                        "Amit Installer - Update Available",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information);
                }
            }
        }
        catch
        {
            // Any failure here - network down, DNS, TLS, a slow revocation
            // check, whatever - is exactly the class of environment-specific
            // flakiness this whole rework exists to be immune to. The actual
            // install never depends on this succeeding, so just move on.
        }
    }
}

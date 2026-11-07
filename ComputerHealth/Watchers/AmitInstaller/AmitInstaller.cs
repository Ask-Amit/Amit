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
    const string CURRENT_VERSION = "4.86";   // 4.85: helper v1.68 (the Amit menu with Voice, Mouse and Keyboard tabs, Esc, Voice turns off with the menu, the left button can never be held by the menu) and the Amit Preview page with its Helper routes (/api/preview/*), delivered by the updater and carried here. 4.84: helper v1.63 - the Voice menu: while Voice is listening, the wheel opens a menu of every command Voice understands. 4.83: helper v1.62 - Voice acts when the middle button is let go (a click starts Voice, a hold is reserved for the mouse set picker). 4.82: helper v1.60 - a phone photo note is not lost, Amit answers it. 4.81: 4.79: helper v1.56 - the Dictate window (amit_dictate.html) and a blinking microphone when dictating into a text box; the updater never replaces a newer helper with an older published one. 4.75: helper files + the Amit bar - Update and reload (amit_reload.ps1) and the bar program built on the computer from AmitBar.cs, new bar steps (Open a file, Open a program, Audio setting), new helper routes (/api/programs, /api/files/*, /api/audio/*, /api/bar/sync). 4.74: helper v1.51 - a preview goes beside WHICHEVER window the person was in (the Hub, VS Code, anything), and that window is put back afterwards. 4.73: helper v1.50 - PREVIEW SPLIT: any window titled "... Preview" splits the screen (VS Code left, preview right, focus back to VS Code) wherever the preview was opened from. 4.72: helper v1.49 - the voice command "preview" opens the Amit Preview window (paste HTML, see it drawn). 4.71: helper v1.48 - the Whisper/Read taskbar icons are sharp: the icon files carry the exact Windows taskbar sizes (24/30/36 px and more), and the helper sets them on the Edge windows itself and keeps them there while in use. 4.70: helper v1.43 + bridge v1.13 - each part of Amit has its own icon (Whisper = microphone, Read = speaker, Show Amit = camera; Ask Amit keeps the aleph); the Read windows are named "Amit Read". 4.69: helper v1.42 + bridge v1.12 - READ, the fourth choice in the Amit Live ring (a see-through speaker that reads aloud what the person points at, in their own saved voice; voice window with live changes on a double click; new page amit_talk.html). 4.68: helper v1.32 + bridge v1.11 - a Show Amit button in the Show Amit editor sends the shot to Amit in the person's Ask Amit chat for today. 4.67: helper v1.31 - one Amit Live window only (choosing Ask Amit again focuses the open one); the window closes itself after 60 seconds without focus. 4.66: helper v1.30 + bridge v1.10 - the Amit icon in the ring opens the Amit Live window (in front, quarter x half screen, no-internet page, health snapshot). 4.65: helper v1.24.1 - Amit Live ring chooses on release; Save View/Save also fill the clipboard. 4.64: helper v1.24 - a single press of the middle mouse button starts Voice. 4.63: carries the automatic updater (amit_update.ps1), Voice and the My Words sync (helper v1.23)

    // Every file Install_AmitTracker.ps1 expects to find sitting next to it.
    // Logical resource names (via plain /resource:path, no explicit name)
    // are just the bare file name, so this list doubles as both the
    // manifest resource names and the files written to disk.
    static readonly string[] EmbeddedFiles = new[]
    {
        "Install_AmitTracker.ps1",
        "amit_bridge_server.ps1",
        "amit_mobile_watcher.ps1",
        "activity_watcher2.ps1",
        "resource_watcher.ps1",
        "diagnostics_watcher.ps1",
        "app_behavior_watcher.ps1",
        "install_snapshot_watcher.ps1",
        "Run_AmitTracker.ps1",
        "AmitTracker.exe",
        "amit_icon.ico",
        "amit_icon_whisper.ico",
        "amit_icon_read.ico",
        "amit_icon_showamit.ico",
        "amit_whisper.cs",
        "amit_whisper.html",
        "amit_dictate.html",
        "amit_talk.html",
        "AmitPreview.html",
        "amit_update.ps1",
        "amit_reload.ps1",
        "AmitBar.cs",
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

            string tempDir = Path.Combine(Path.GetTempPath(), "AmitInstallerFiles");
            Directory.CreateDirectory(tempDir);
            ExtractEmbeddedFiles(tempDir);

            string scriptPath = Path.Combine(tempDir, "Install_AmitTracker.ps1");
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -InstallerVersion " + CURRENT_VERSION,
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
            // start tracking immediately, rather than making someone go back
            // to the browser and click Retry themselves. Pass -NoOpenDashboard
            // (added 2026-09-05, Ryan's direct correction) - a first-time
            // person installing from the Hub via Amit Mobile's Connect Amit
            // flow should stay on the Hub, not get yanked into Computer
            // Health's dashboard just because tracking also started.
            string installedWatchersDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AmitComputerHealth", "Watchers");
            string runScript = Path.Combine(installedWatchersDir, "Run_AmitTracker.ps1");

            if (File.Exists(runScript))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + runScript + "\" -NoOpenDashboard",
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                });
                // Nothing visibly opens now (no dashboard pop-up) - without
                // this, a person has no way to tell the install actually
                // finished. FIXED 2026-09-05, Ryan's direct correction: the
                // original wording ("go back to your Hub tab") read as "you
                // are done" when the actual next step is putting Amit on
                // your phone - this computer being connected is only half
                // the job. Now points at the real next step explicitly.
                MessageBox.Show(
                    "This computer is now connected - it will show \"Amit Mobile: Listening\" in the Hub shortly.\n\n" +
                    "Next step: get Amit on your phone. Go back to your Hub tab and scroll down to \"Get Amit On Your Phone\" to scan the QR code (or open Amit Mobile directly from your phone's browser).",
                    "Amit Installer - Computer Connected",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
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

    // REMOVED 2026-09-05, Ryan's direct correction: this used to compare
    // CURRENT_VERSION against the repo-wide root VERSION file, back when
    // the whole system used one shared number everywhere. That policy was
    // retired (see root CLAUDE.md's VERSIONING STANDARD - PER-FILE
    // INDEPENDENT VERSIONING) in favor of every file tracking its own
    // separate number. This check never got removed and kept comparing
    // two now-unrelated numbers, producing a confusing "update available"
    // popup (e.g. "6.17" vs "4.40") that meant nothing. Deleted rather
    // than repointed - there is no longer a single meaningful "latest
    // version" number for this installer to check itself against.
}

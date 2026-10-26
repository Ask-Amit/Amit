// Remove-Amit.exe - one double-click removes Amit and all of its data from this computer.
// The real work is Amit_Fix.ps1 (embedded below, readable on the Amit Fix page). This only asks first, then runs it.
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

class RemoveAmit
{
    [STAThread]
    static void Main(string[] args)
    {
        bool fresh = args.Length > 0 && args[0] == "--fresh";
        string ask = fresh
            ? "Start fresh?\n\nThis removes Amit's helper and its saved data from this computer, then opens the newest installer so you can put it back clean. Amit himself lives online and is not affected.\n\nYour documents and your online Amit account are not touched."
            : "Remove Amit from this computer?\n\nThis closes Amit's small programs, turns off start-with-Windows, removes its shortcuts and deletes its files and saved data, then checks that it is really gone.\n\nAmit himself lives online and is not affected, and your documents and account are not touched. You can come back any time.";
        if (MessageBox.Show(ask, "Amit Fix", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        try
        {
            string dir = Path.Combine(Path.GetTempPath(), "AmitFixRun");
            Directory.CreateDirectory(dir);
            string ps1 = Path.Combine(dir, "Amit_Fix.ps1");
            using (var s = Assembly.GetExecutingAssembly().GetManifestResourceStream("Amit_Fix.ps1"))
            using (var f = new FileStream(ps1, FileMode.Create, FileAccess.Write)) s.CopyTo(f);
            Process.Start(new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + ps1 + "\" -Actions " + (fresh ? "remove,reinstall" : "remove") + " -Yes -Pause",
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            MessageBox.Show("Something went wrong:\n\n" + ex.Message + "\n\nYou can also use the .cmd version on the Amit Fix page.", "Amit Fix", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}

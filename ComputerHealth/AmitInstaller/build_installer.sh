#!/bin/bash
# Rebuilds install-Amit.exe from the live source scripts in the Watchers
# folder (one level up) and embeds them directly into the exe as resources.
#
# *** STOP (Ryan, 2026-11-07): if the change is to the AMIT HELPER (the bar, the Aurora, the voice menu, the mouse, the Amit Preview, the bridge, the
# *** updater), DO NOT run this and DO NOT push an installer. Ryan split the installer into two packages so Computer Health's is not updated for
# *** every Helper change, and the Helper reaches every computer by itself through the automatic updater. Read AmitHelper/HELPER_RELEASE_RULES.md
# *** and run AmitHelper/verify_helper_release.ps1. Only a Computer Health change (a tracker/watcher script) is a reason to run this.
#
# ALWAYS run this after changing any watcher/bridge/tracker script instead of
# hand-copying files into this folder - it always pulls fresh from Watchers/
# first, so the compiled installer can never silently drift out of sync with
# the real source files. Run this, then push the resulting install-Amit.exe.
set -e
cd "$(dirname "$0")"

SRC="../"
CSC="/c/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe"

FILES=(
  Install_AmitTracker.ps1
  amit_bridge_server.ps1
  amit_mobile_watcher.ps1
  activity_watcher2.ps1
  resource_watcher.ps1
  diagnostics_watcher.ps1
  app_behavior_watcher.ps1
  install_snapshot_watcher.ps1
  Run_AmitTracker.ps1
  AmitTracker.exe
  amit_icon.ico
  amit_icon_whisper.ico
  amit_icon_read.ico
  amit_icon_showamit.ico
  amit_whisper.cs
  amit_whisper.html
  amit_dictate.html
  amit_talk.html
  AmitPreview.html
  amit_update.ps1
  amit_reload.ps1
  AmitBar.cs
  ComputerHealth_Dashboard.html
)

echo "Pulling fresh copies from Watchers/..."
for f in "${FILES[@]}"; do
  cp "$SRC/$f" "./$f"
done

echo "Compiling install-Amit.exe with embedded resources..."
RESOURCE_ARGS=()
for f in "${FILES[@]}"; do
  RESOURCE_ARGS+=("//resource:$f,$f")
done

"$CSC" //nologo //target:winexe //out:install-Amit.exe //win32icon:AmitInstaller.ico //r:System.Windows.Forms.dll \
  "${RESOURCE_ARGS[@]}" \
  AmitInstaller.cs AssemblyInfo.cs

echo "Writing BUILD_MANIFEST.json (records exactly what's embedded, so a future"
echo "session can tell at a glance whether install-Amit.exe matches current source)..."
{
  echo "{"
  echo "  \"builtAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"files\": {"
  count=${#FILES[@]}
  i=0
  for f in "${FILES[@]}"; do
    i=$((i+1))
    h=$(md5sum "$f" | cut -d' ' -f1)
    comma=","
    if [ "$i" -eq "$count" ]; then comma=""; fi
    echo "    \"$f\": \"$h\"$comma"
  done
  echo "  }"
  echo "}"
} > BUILD_MANIFEST.json

echo ""
echo "Done. install-Amit.exe rebuilt with the current contents of every file above."
echo ""
echo "Reminder (Ryan's direct request 2026-07-16): CURRENT_VERSION in AmitInstaller.cs"
echo "and AssemblyVersion in AssemblyInfo.cs must match the version label in"
echo "ComputerHealth_Dashboard.html's header (currently pulled in as one of the"
echo "embedded files above) - one shared number for the whole distributable, not"
echo "two independent counters to cross-reference by hand. Bump both together"
echo "any time the dashboard's own version changes, then re-run this script."
echo "Run ./verify_installer.sh any time to check whether the built exe has drifted"
echo "out of sync with the live Watchers/ source files."

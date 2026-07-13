#!/bin/bash
# Checks whether AmitInstaller.exe's embedded files still match the live
# source scripts in Watchers/ (one level up) - so a session picking this up
# cold can immediately tell "is the compiled installer current, or does it
# need a rebuild" instead of guessing from file dates.
#
# Reads BUILD_MANIFEST.json (written by build_installer.sh at last build) and
# recomputes current hashes for comparison. Any mismatch or new/removed file
# means: run ./build_installer.sh again before shipping.
cd "$(dirname "$0")"

if [ ! -f BUILD_MANIFEST.json ]; then
  echo "No BUILD_MANIFEST.json found - AmitInstaller.exe has never been built with this script."
  echo "Run ./build_installer.sh first."
  exit 1
fi

drift=0
while IFS= read -r line; do
  f=$(echo "$line" | sed -n 's/.*"\(.*\)": "\([a-f0-9]*\)".*/\1/p')
  recorded=$(echo "$line" | sed -n 's/.*"\(.*\)": "\([a-f0-9]*\)".*/\2/p')
  [ -z "$f" ] && continue
  if [ ! -f "../$f" ]; then
    echo "MISSING SOURCE: $f (recorded in manifest but no longer exists in Watchers/)"
    drift=1
    continue
  fi
  current=$(md5sum "../$f" | cut -d' ' -f1)
  if [ "$current" != "$recorded" ]; then
    echo "OUT OF SYNC: $f changed since last build (was $recorded, now $current)"
    drift=1
  fi
done < BUILD_MANIFEST.json

if [ "$drift" -eq 0 ]; then
  echo "AmitInstaller.exe is up to date - every embedded file matches its Watchers/ source."
else
  echo ""
  echo "Drift detected above. Run ./build_installer.sh to rebuild before shipping this exe."
  exit 1
fi

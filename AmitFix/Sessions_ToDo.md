# AmitFix - Sessions_ToDo
Open items by theme, each with its source date in [brackets]. The first set came from the old Sessions.md (now in Backups\AmitFix\Sessions_backup_2026-11-13.md); items added by later clean-ups carry their own date. Items that get a Hub pursuit carry its id on the line in a hub tag; none do yet (backlog pursuits are not initialized).

## Release and testing
- Real test on a second (sacrificial) computer, then push. [2026-10-26 Open block] (also: untested: stopping real running programs, registry changes, Remove-Amit.exe dialog, real removal, first download of Amit_Check.cmd)

## Decisions awaiting the owner
- Confirm the name AmitFix and the "director's chair" film-set wording. [2026-10-26]

## Features not built
- Let Amit's helper open this page itself (tray menu "Troubleshoot" with ?from=helper&v=version). [2026-10-26]
- Register Amit in the Windows Apps list (Uninstall key pointing at Remove-Amit.exe): proposed. [2026-10-26]
- Every future thing needing a computer connection gets its own tab here (owner's direction, not built). [2026-10-26 later]

## Trust and packaging
- Code-signing certificate (SmartScreen warning on .exe and .cmd). [2026-10-26]
- Move developer-only pieces out of the public package: the mobile watcher embedded in install-Amit.exe, the bridge launch code, /api/coder-token, the Ask Amit answering launch. [2026-10-27]
- Helper still includes a credentials-writing route and the Ask Amit and Amit Mobile watchers that should leave the public package. [2026-10-26 evening]
- Stale older copies under ComputerHealth/Watchers/ still hold old user-name paths (also in git history). [2026-10-26 evening] (also: decide whether to delete or refresh them)

## Resolved (kept so the judgment can be checked)
- Helper wording "Amit's helper" and "Remove Amit" label: v1.01/v1.02. [2026-10-26 later]
- Install Amit tab added v1.03; wrong claim about Node.js/Claude Code corrected v1.04. [2026-10-26 later]
- Hard-coded Windows user name in helper paths: fixed (helper v1.07, installer 4.62). [2026-10-26 evening]
- Verify It page (v1.05) and Check It page (v1.06) built; v1.06 pushed as live. [2026-10-26]
- Readable developer script shown on Verify It (v1.08). [2026-10-27] Pushed 2026-10-27 as commit 4bb5e63; found on 2026-11-14 clean-up (the repo's AmitFix.html is v1.08). Not re-checked on the live site.
- Root CLAUDE.md path-table row for AmitFix: added 2026-11-14 (also the root Sessions_Start project list). [resolved 2026-11-14]
- v1.08 pushed (commit 4bb5e63, 2026-10-27). The old to-do "v1.08 (local) is NOT pushed" was wrong. [resolved 2026-11-14]

## FROM CLAUDE.md (captured 2026-11-14)
### Phone and web apps page (half-built)
- Build page 7 "Phone & Apps" (tabs My apps, Install on a phone with Add-to-Home-Screen steps and a QR per app, Icons & permissions); add to fxPages(); raise the pg<=6 limit in build.js. (unsure if finished) (also [2026-10-26 LATEST]: half-built in fix_js.txt, not live; read AmitFixCLAUDE.md "RESUME HERE" first; take the smallest next step)
- Add per-app Check to the Check It page and a phone/web-app section to Verify.txt (make_verify.js) and the Verify It page.
- Test (node build.js, node check.js, screenshots, headless Edge), bump to v1.07, copy to repo, push, verify live, update Living Testimony entry and the amitfix context in Amit_Ask_Live.js.
- AmitScan removal must warn about unsent scans in IndexedDB "amitscan" and ideally offer to send or export them first. Not built.
### Decisions waiting on Ryan
- MASTER TEMPLATE + SUB TEMPLATE direction (in Templates\CLAUDE.md, not built).

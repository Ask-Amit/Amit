# AmitFix — Sessions

## Current State (2026-10-26)

AmitFix v1.00 is built locally and NOT pushed (waits for Ryan to say "push"). Files: AmitFix.html (page), Amit_Fix.ps1 (engine v1.00), Remove-Amit.exe (one-click remover, built from RemoveAmit.cs), How_to_Fix_or_Remove_Amit.pdf (one-page handout with QR), amit_icon.ico, plus build files (build.js, fix_css.txt, fix_js.txt, check.js, serve.js, mkcmd.js, handout.html).

Tested: page renders on all four pages and all five tabs (headless screenshots), URL parameters work (problem, page, from), live helper detection works, QR draws, call sheet builds, syntax check clean; engine tested in an isolated sandbox for check, voice-off, tidy, shortcuts-remove, forget-data, remove, and through the generated .cmd (which found and fixed a real bug: the pass/fail tally was lost when run that way). NOT tested: stopping real running programs, the registry changes, the Remove-Amit.exe dialog and real removal, and a run on a second (sacrificial) computer. Never run the remover on Ryan's own working install.

## Open

- Ryan to confirm the name AmitFix (chosen by Amit; Ryan said "the name" is still open) and the "director's chair" film-set wording.
- Root CLAUDE.md path-table row for AmitFix (needs Ryan's authorization; proposed text is in the 2026-10-26 reply).
- Let Amit's helper open this page itself (tray menu "Troubleshoot" -> ?from=helper&v=<version>): not built.
- Register Amit in the Windows Apps list (Uninstall key pointing at Remove-Amit.exe): proposed, not built.
- Code-signing certificate (SmartScreen "unknown publisher" warning on the .exe and .cmd).
- Real test on a second computer; then push.

## Log

**2026-10-26 — created.** Ryan (voice) asked for a page where anyone can press a button, download a program that removes the Amit installer/helper and all its data, turns off scheduled/startup items and verifies it ("like you never did it"). Two purposes: an honest way to leave Amit, and the universal fix/update path (remove, then reinstall). Later in the same conversation he widened it: a troubleshooting site of little patches (reset, eliminate, allow), the "director's chair" as the theme, tab format in the main area, chat/Ask Amit unchanged from the template, "be creative, knowing where they're coming from", removal as its own tab, and a heartfelt welcome/farewell/come-back message. Built from Templates\template.html (whole copy; only pages, tabs and styles added).

Build commands: "node build.js" assembles AmitFix.html; "node check.js" checks syntax; "node serve.js .. 8765" is a local test server run from the Amit root; the exe is built with csc.exe (C:\Windows\Microsoft.NET\Framework64\v4.0.30319) using /nologo /target:winexe /win32icon:amit_icon.ico /out:Remove-Amit.exe /r:System.Windows.Forms.dll /resource:Amit_Fix.ps1 RemoveAmit.cs AssemblyInfo.cs. The PDF is headless Edge --print-to-pdf on handout.html.

**2026-10-26, later.** v1.01 reworded to "Amit's helper" (Ryan: only the watchers/helper are removed; Amit lives in Supabase). v1.02 label back to "Remove Amit" (Ryan's preference), with the "Amit himself lives online" line kept beside it. v1.03 added the Install Amit tab. v1.04 corrected an error found while reading the installer: it installs Node.js and Claude Code when missing, so the page no longer says Amit never installed them (removal leaves them; how to remove them is on the page). Living Testimony list entry rewritten as "the one place to install, fix, quiet or remove" (Living Testimony v1.27). Ryan's direction, not built: every future thing that needs a computer connection gets its own tab here. State at this entry: v1.04 and the Living Testimony change are built locally and NOT pushed (live is v1.01).

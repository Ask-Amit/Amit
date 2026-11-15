# AmitRoll - Sessions Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read the Daily Sessions folder or the original Claude session only when asked. the backup files in Backups\AmitRoll\Sessions_backup_2026-11-13.md are for research only. Never edit Sessions.md or any CLAUDE.md from this record without Ryan's say-so.

## DIRECTORY
- `Sessions_Start.md` - this file: current state and files in play.
- `Sessions_ToDo.md` - every open item found in the old Sessions.md (now in Backups\AmitRoll\Sessions_backup_2026-11-13.md), grouped by theme, with the date of the entry it came from.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- `Backups\AmitRoll\Sessions_backup_2026-11-13.md` - byte-for-byte copy of the old Sessions.md.
- `Sessions_Design.md` - this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
AmitRoll is a dice-and-card arithmetic game rebuilt from Ryan's roughly 15-year-old "Ready, Set, Roll" (made for his daughter): roll five dice, cover five number cards by making each card's number from dice, with a risk of busting if you press on. The in-game start call is "Ready, Set, Roll!" (a web search found other products with that name; the project name stays AmitRoll; the search was not legal clearance). Table prefix for any database tables is `Rol_`; none exist yet.

Pushed and live: **AmitRoll v1.02** (commit 72a19b2, 2026-10-16) at https://ask-amit.github.io/Amit/AmitRoll/AmitRoll.html. v1.02 is the first version with the banking rule (covering all five cards banks the set; a bust keeps banked points). Pushed files: AmitRoll.html, amitroll.css, amitroll_engine.js, amitroll_ui.js, amit_icon.ico. The Hub has an "Amit Games" tile (Hub v8.23, pushed) that opens `Games/AmitGames.html`.

Local only, NOT pushed: everything built after v1.02, up to local **v1.25** (2026-10-17). The log's own label for the next push is v1.03. Built since the push: the four stages (addition, subtraction, multiplication, division) with sign keys that stick, Clear key, order of operations, dice to 10 in later stages; the stage's sign needed once per set of five cards; "all signs" bonus (a gold BONUS wild next set); a time bonus whose size depends on the level; round clocks per stage and level (one clock per round, calibrated so levels score about the same); game played to a target score (100/250/500) instead of five rounds; experience by finishing place; a Practice page with a level picker, hourglass timer and level tiles; one level track in which signs unlock with the level (levels 1-2 add, 3-4 subtract, 5-6 multiply, 7-8 all four); from level 4 the player types their own score and a wrong total costs the difference; picked dice line up as a group; Learn as multi-row tabs with a lesson for each stage; every round and every fresh set starts with at least one coverable card. The engine has 68 passing tests.

Newest decisions (2026-10-17): the clock is per round, not per throw; the all-signs bonus stays as built, including its easy subtraction version (so lower-stage players at a mixed table can earn it); wild cards now appear in about 3 percent of sets; a table of mixed levels is meant to play the lowest stage present (decided, not built).

Not built (designed): real players, friends and groups (reusing AmitChat), open matchmaking, block and report, class tables for teachers, the Hearts-style shared table for up to eight players with the player's own seat at the bottom, stealing missed covers, and the later stages (fractions, parentheses, exponents and roots, decimals and percent, algebra). Progress is saved in the browser only. No pursuit logging was recorded in this file.

## FILES IN PLAY
All under `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitRoll\` unless a full path is given.
| File | What it is | Version |
|---|---|---|
| `AmitRoll.html` | the page | pushed v1.02; local builds up to v1.25 |
| `amitroll_engine.js` | all rules and the Best Play solver | none shown; 68 tests |
| `amitroll_engine.test.js` | the engine tests (not pushed) | none |
| `amitroll_ui.js` | the screens | none shown (cache number v=0.13 at last push) |
| `amitroll.css` | styles | none |
| `CLAUDE.md`, Sessions files | rules and the log | none |
| `Templates\TemplateViews.html` | source of the Multi-Row Tab View copied into Learn (local edit) | v1.04 |
| `Games\AmitGames.html` | the Amit Games page the Hub tile opens | none in this file |

## OPEN TO-DOS
24 open items, listed in Sessions_ToDo.md. Biggest groups: pushing the local build, the Rol_ tables and real-player features, tuning (clocks, bonuses, experience thresholds), the "lowest stage at the table" rule, and the later stages.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\AmitRoll\Sessions_backup_2026-11-13.md), newest log entry dated 2026-10-17.

## ORIGINAL SESSIONS
The original session for each entry was not recorded before 2026-11-13. From the next clean-up on, each entry will name its session (name, ID and path under `C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\`). Those files expire on Claude's own schedule, which is acceptable: the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: CLAUDE.md's purpose statement says AmitRoll is a dice-and-number arithmetic game for kids and adults, free, under the shared login. The real scope has grown: four stages (addition, subtraction, multiplication, division), per-round clocks by level, first-to-a-target games with experience by finishing place, a Practice table with up to 7 Amit opponents, Learn tabs, and designed-but-unbuilt real players, groups, class tables and steal rules (all recorded in Sessions_Start.md above).

Status lines in CLAUDE.md:
- "Current Status: Freshly created 2026-10-15 (J New). AmitRoll.html is the shared template copied and renamed, v1.00, no game code. No tables built." (looks out of date: the game is built, pushed as v1.02 and local v1.25; only "no tables built" is still true.)
- "Tables this project uses: none yet. Expected: player profiles under a parent/owner login, game results, per-player level and rating history, saved Best Play records." Table prefix Rol_. (still true as of the log.)
- Connection: shares the Hub login; Ask Amit wired through Amit_Ask_Live.js (page key amitroll); no desktop or hardware access, so the shared bridge is not involved.
- Design status recorded in CLAUDE.md as "built in the prototype": wild cards, Accept pop-up, dragging, hints only in levels 1-3, self-scoring from level 4, covered-card stack, changeable covers, banking when all five cards are covered (CONFIRMED by Ryan 2026-10-16), tops 9/10/12/14/15/16/16/16, clocks per round (corrected 2026-10-17; the older per-roll clock chart in CLAUDE.md looks out of date: superseded by the per-round clock).

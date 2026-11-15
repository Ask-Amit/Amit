# Hub - Sessions Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read the Daily Sessions folder or the original Claude session only when asked. the backup files in Backups\Hub\Sessions_backup_2026-11-13.md are for research only. Note: the Hub's own task backlog lives in the root CLAUDE.md, not in Sessions.md, so this record does not list it.

## DIRECTORY
- `Sessions_Start.md` - this file: current state and files in play.
- `Sessions_ToDo.md` - open items found in the old Sessions.md (now in Backups\Hub\Sessions_backup_2026-11-13.md), with the date of their entry.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- `Sessions_Design.md`: this project's design reference (how it is built); read only when working on that part of the build.
- `Backups\Hub\Sessions_backup_2026-11-13.md` - byte-for-byte copy of the old Sessions.md.

## CURRENT STATE

Added 2026-11-14 from the old Sessions.md (now in Backups\Hub\Sessions_backup_2026-11-13.md): Hub v8.78 ("We noticed a Windows crash" pop-up) is BUILT and tested with a harness, NOT pushed; it releases with the Helper release (needs Helper 1.92 route `/api/crash-notice`). Next Hub number at the rename release: v8.79.
The Hub (`Hub\amit-hub.html`) is the daily home screen of the Amit system: morning companion, Hebrew calendar, pursuits, Word for Today, About Me, Communications (Email and Chats tabs), the sidebar of Amit tools, and the right rail with the chat icon and the helper light. It keeps one signed-in login and one owner contact row per login (shared `amit_owner_contact.js`).

Live and pushed: **Hub v8.76** (2026-11-08). The 2026-11-08 series (v8.70 to v8.76) added the Amit Mouse tab in Communications (next to Amit Helper; `Hub\AmitMouse.html` loaded in a frame, saving per login and per computer into the `Per_` tables), the Helper button step "Open a menu" (stored as `open_program` with `menu:<id>`), and the locked "Amit menu" button in the Settings group. Backups `amit-hub-pre-v8.70` to `pre-v8.76` are in the folder. Detail and decisions are in `AmitHelper\Sessions.md`. Living Testimony v1.46 describes Amit Mouse and the Amit Helper.

Not pushed (as of the last note on them): v8.68 Yamaha tile (2026-11-02), a sidebar tile under AmitCapacity that opens `ShoshoneHondaYamaha/capture.html`, shown only when the signed-in user is Ryan; whether it went out with the later pushes is not stated. Also never marked pushed: v8.44 (chat engine v0.25 and `amit_data_tools.js`), v7.25 (name-restore fix, 2026-10-03), v8.24 and v8.25 (chat v0.11, v0.12). Later pushes may have included them (not stated).

Recent history in one line each: Connect Amit flow works start to finish (v8.40 to v8.42); Computer Health helper connection and helper light (v8.38); AmitChat live in the Hub (v8.13 to v8.25, engine `amit_chat.js`); Amit Games tile (v8.23); About Me with voice settings, spoken greeting and breathing speaking icon (v6.40 to v6.53); Amit Mobile heartbeat and readiness banner (v6.22 to v6.23).

The old "Current State" block in the old Sessions.md is stale (it says v1.01 on GitHub). It also notes launch issues before promoting to outside users: sync modal too dark, magic link email unbranded, Andy banner stale-load bug, first-authenticated-load has no confirmation.

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| `Hub\amit-hub.html` | the Hub | v8.76 pushed |
| `Hub\AmitMouse.html` | Amit Mouse page loaded in a frame in Communications | none shown |
| `Hub\amit-hub-pre-v8.70.html` to `-pre-v8.76.html` | backups made before each change | none |
| `amit_chat.js` (Amit root) | the one chat engine | v0.12 at last note here |
| `amit_ch_sync.js` (Amit root) | helper connection and queue save | v1.02 |
| `amit_owner_contact.js`, `amit_speaking_indicator.js`, `amit_readiness_check.js`, `amit_data_tools.js` (Amit root) | shared files the Hub loads | `amit_data_tools.js` v1.00; others none shown |
| Sessions files, root `CLAUDE.md` | log and rules | none |

## OPEN TO-DOS
Open to-dos: ~73 items, see Sessions_ToDo.md.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\Hub\Sessions_backup_2026-11-13.md), newest log entry dated 2026-11-08.

## ORIGINAL SESSIONS
The original session for each entry was not recorded before 2026-11-13. From the next clean-up on, each entry will name its session (name, ID and path under `C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\`). Those files expire on Claude's own schedule, which is acceptable: the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: CLAUDE.md describes the Hub as the daily home screen (task list, calendar, mail, tool launch). The real Hub is far larger: Morning Altar, Pursuits, Word for Today, About Me with voice and greeting, Communications (Email, Chats, Amit Helper, Amit Mouse tabs), AmitChat engine, Connect Amit flow, helper light, sidebar of Amit tools (Hub v8.76 live per Sessions_Start.md above). Its own accuracy note says so.

Status lines in CLAUDE.md:
- "Current Version: v1.01 on GitHub. Sessions 10+11 changes are local only - PUSH STILL PENDING." (looks out of date: the Hub is at v8.76, pushed many times since.)
- "ACCURACY NOTE": architecture, witness design and theology sections are authoritative; build history reflects Session 4 only; the Hub was developed through Sessions 5-12 and beyond; current state is in the root CLAUDE.md. Its "IMMEDIATE NEXT TASK" and "Next priorities" were removed as outdated.
- "What Is Built (as of 2026-06-02)" (looks out of date: a June 2 snapshot of Session 4): sidebar tiles (Home, Calendar, To-Do, Word for Today, Mail, Who Is God, Bible Companion, Computer Value, BOSStimator); Home with greeting, clock, stat cards and daily verse; To-Do panel with tabs, search, sort, grouped view, quick-add, full task modal and P1-P10 colors; Calendar month grid with chips, swipe, overdue banner and day detail; Mail panel with multi-account providers; tool launch panels (Computer Value and BOSStimator "Coming Soon"). The full text is copied in the old log (now in the Daily Sessions folder).
- "Session State - Where We Left Off (2026-06-02, session 4)" (looks out of date): three-calendar system completed (Biblical/Torah, Rabbinic, Priestly/Enoch 364-day), 13 new FEAST_DETAIL entries, living daily teaching in the day panel (Omer count, Shabbat, Enoch Shabbat), dual-date double-click view, renames (To-Do -> My Aims, Bible Companion -> Amit, Amit Health -> Health), Amit Introduction screen, Completed filter. Full text in the old log (now in the Daily Sessions folder).
- AUDIT FINDINGS (2026-06-08, Session 17), mostly looks out of date: file must be rewritten; line 18 stale; "Bible Companion" naming inconsistent; "Ask Amit URL is dead" (the Ask Amit mechanism has since been rebuilt through Amit_Ask_Live.js, so that finding looks out of date); session state is a June 2 snapshot.
- Premium Brainstorm Room (scoped 2026-07-20): spec only, NOT BUILT in the Hub. Database side built 2026-07-20: amit_brainstorm_topics, amit_brainstorm_rounds, amit_brainstorm_responses (migration 2026-07-20_001), amit_user_tiers and premium gating (migration 2026-07-20_002); Ryan's account seeded premium. (The Council work later grew from this idea; see TheCouncil.)
- Profile architecture (permanent, stays in CLAUDE.md): user_growth_log is the dated history, user_memory the current synthesis, users.compass_* the fast reading, with _syncCompass() writing a growth-log row when the tier changes.
- Paths in CLAUDE.md: Hub file, Who Is God, Companion (Companion\Amit_Companion.html; looks out of date, the Companion folder was retired), Computer Value "not yet built" (looks out of date).

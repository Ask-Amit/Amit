# AmitChat - Sessions Start (read this file first)

## HOW TO READ
Read this file first; it is all you need to begin. Read Sessions_ToDo.md only when asked about to-dos or what is open. Read Sessions_Log.md (or the original Claude session) only when asked about a specific recent entry. the backup files in Backups\AmitChat\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md: this file (state, files in play, pointers).
- Sessions_ToDo.md: every open item found in the old Sessions.md (now in Backups\AmitChat\Sessions_backup_2026-11-13.md), with source dates, plus a Resolved list.
- Sessions_Log.md: the recent entries (2026-10-22 to 2026-10-31) copied word for word, newest first.
- Backups\AmitChat\Sessions_backup_2026-11-13.md: byte-for-byte copy of the old Sessions.md (670 lines).
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
AmitChat is the private login-based chat inside Amit: friends and groups, safeguarding for young people, photos, voice messages, read-aloud, live transcript, and Amit as a chat member. Amit answers on Ryan's computer through a locked-down Claude run (`amit_ask_watcher.js`, web search and fetch only), with rules held in the database (`--publish-rules`). Ask Amit works on every Amit page through the shared `Amit_Ask_Live.js`, with a data gate that lets Amit answer from a person's own app data only under their own login, and only when everyone in the chat is authorised.

The newest work (2026-10-26 to 2026-10-31) grew around the helper on Ryan's computer and is mostly local, not pushed: Whisper dictation by mouse hold, the Amit Live ring (Dictate, Voice, Show Amit, Ask Amit), the Show Amit screen-capture editor with layers, the Amit Live window (tabs: Ask Amit, My Computer, My Words, Computer Health) with a first-open-of-the-day morning card and one chat per day, voice commands and My Words sync, automatic helper updates, and "Amit Wisdom" (per-person notes on how each person talks).

Live versus local: live on the site per the entries were: engine v0.24 with Hub v8.43 (2026-10-23), later pushes of Hub v8.50 (2026-10-29) and Hub v8.54 plus `AmitLive.html` v1.01 (2026-10-30); the exact current live engine version is not stated (unsure). Local and NOT pushed: chat engine v0.29, Hub v8.56, newer `AmitLive.html`, helper v1.31, bridge v1.11, installer 4.68, Wisdom. Helper v1.30 and bridge v1.10 are installed by hand on Ryan's computer, with automatic update paused there (rename `amit_update.ps1.paused` back after the push).

Blocked: migrations `_032`, `_033` and `_034` wait for Ryan to run them; rules must be published and the helper restarted for Wisdom; everything waits for his "push".

Newest decisions: one Ask Amit chat per day (2026-10-31); first open of the day is a morning card, later opens are small; Show Amit button saves a shot and sends it to today's chat; Wisdom notes shape HOW Amit speaks, never WHAT is true. The 2026-10-25 test-chat punch list (T1-T20, R1-R7) is still the main accuracy to-do.

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| `amit_chat.js` (Amit root) | shared chat engine | v0.29 (local) |
| `Hub\amit-hub.html` | Hub with Communications > Chats, My Morning, My Words | v8.56 local (v8.54 pushed) |
| `AmitMobile\AmitMobile.html` | phone page with the chat | v1.52 (local per 2026-10-23) |
| `amit_data_tools.js` | browser side of the data gate | v1.01 |
| `AmitChat\amit_ask_watcher.js` | answering program | none shown |
| `AmitChat\answerer\AMIT_ANSWERER_RULES.md` | the answering Amit's rules (also in database) | none shown |
| `ComputerHealth\Watchers\amit_whisper.cs` | the helper (whisper, ring, Show Amit) | v1.31 source |
| `ComputerHealth\Watchers\amit_bridge_server.ps1` | shared local bridge | v1.11 |
| `ComputerHealth\AmitLive.html` | Amit Live window page | v1.00/v1.01 pushed, newer local |
| `ComputerHealth\amit_morning.js` | day boundary and greeting | v1.00 |
| `install-Amit.exe` | helper installer | 4.68 built, not pushed |
| `AmitChat\MyMorning_SPEC.md` | My Morning design | none |
| Migrations `_023` to `_034` in `Database\` | chat, data gate, words, My Morning, day chat, Wisdom | _032-_034 not run |

## OPEN ITEMS
Open to-dos: 110 items, see Sessions_ToDo.md.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\AmitChat\Sessions_backup_2026-11-13.md), newest log entry dated 2026-10-31.

## ORIGINAL SESSIONS
Original Claude sessions were not recorded before 2026-11-13. From the next clean-up, each entry names its session (name, ID, and path under `C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\`). Those files expire on Claude's schedule, which is acceptable because the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: CLAUDE.md's purpose statement describes only a private login-based chat (friends, groups, attachments, read receipts, Amit as a member). The real scope grew to include Ask Amit on every Amit page (shared Amit_Ask_Live.js, answering program amit_ask_watcher.js with rules in the database), the data gate, Whisper dictation by mouse hold and the Amit Live ring (shared helper, now the Amit Helper), Show Amit, and a planned 'My Life' God-centered posts feed.

- CLAUDE.md 'Current Status' says: freshly created 2026-10-11, AmitChat.html is the unmodified template v1.00, no chat code and no tables exist (looks out of date: engine v0.29 and 8+ migrations exist per the log).
- CLAUDE.md 'Tables this project uses' says planned, none created, prefix Cha_ and lists Cha_Conversations/Participants/Messages/Attachments (looks out of date: tables built and run 2026-10-14 as cha_* in migration_2026-10-14_001, hardened by _002; later _004 added cha_config, cha_amit_id, cha_summon_amit).
- Built 2026-10-14 (from CLAUDE.md): shared engine amit_chat.js v0.01, Hub v8.13 chat icon, badge, docked popup and Chats tab; migration _001 run and verified, 59 of 59 security checks passed after _002 (details in Sessions_Log.md copy below).
- Built 2026-10-15 (from CLAUDE.md): Amit icon in the composer (engine v0.04, cha_summon_amit, Amit's own locked account), photos and files (10 MB bucket, 1600 px camera shots, signed links), amit_check.js rules. Whisper mode built 2026-10-26 in the shared helper (amit_whisper.cs, bridge v1.05, installer 4.58).
- Where it shows up: Hub Mail page became Communications (built in Hub v8.11): Email tab, Chats tab; AmitChat stays its own standalone page.
- J chat / 'check chat' routine (amit_check.js) was the original way Amit answered (looks out of date: Sessions_ToDo says J chat retired 2026-10-17; the answering program replaced it).
- CLAUDE.md still has the 'Stage 0 skeleton NOT yet approved' decision (decision 15) (looks out of date: Stage 0 built and run).
- 'My Life' feed (Ryan, 2026-10-15): NOT built, recorded as future (Mly_ table prefix, own folder via J New when work starts).
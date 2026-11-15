# AmitChat - Sessions Start (read this file first)

## HOW TO READ
Read this file first; it is all you need to begin. Read Sessions_ToDo.md only when asked about to-dos or what is open. Read the Daily Sessions folder (or the original Claude session) only when asked about a specific recent entry. the backup files in Backups\AmitChat\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md: this file (state, files in play, pointers).
- Sessions_ToDo.md: every open item found in the old Sessions.md (now in Backups\AmitChat\Sessions_backup_2026-11-13.md), with source dates, plus a Resolved list.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\AmitChat\Sessions_backup_2026-11-13.md: byte-for-byte copy of the old Sessions.md (670 lines).
- Sessions_Design.md: this project's database tables (first section, corrected 2026-11-15: 24 `cha_` tables) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
AmitChat is the private login-based chat inside Amit: friends and groups, safeguarding for young people, photos, voice messages, read-aloud, live transcript, and Amit as a chat member. Amit answers on Ryan's computer through a locked-down Claude run (`amit_ask_watcher.js`, web search and fetch only), with rules held in the database (`--publish-rules`). Ask Amit works on every Amit page through the shared `Amit_Ask_Live.js`, with a data gate that lets Amit answer from a person's own app data only under their own login, and only when everyone in the chat is authorised.

The work of 2026-10-26 to 2026-10-31 grew around the helper on Ryan's computer: Whisper dictation by mouse hold, the Amit Live ring (built 2026-10-29 as whisper v1.05, flat look v1.06; Dictate, then Show Amit, Voice, Ask Amit; it is now the Aurora ring in the Amit Helper), the Show Amit screen-capture editor with layers, the Amit Live window (tabs: Ask Amit, My Computer, My Words, Computer Health) with a first-open-of-the-day morning card and one chat per day, voice commands and My Words sync, automatic helper updates, and "Amit Wisdom" (per-person notes on how each person talks). That is Helper work: its release state is kept in `AmitHelper\Sessions_Start.md`, not here.

Live versus local, CHECKED 2026-11-15 against the repo (`C:\Users\user1\GitHub\Amit`, equal to origin/main, nothing unpushed): PUBLISHED and identical to the master copy: `amit_chat.js` v0.30, `Hub\amit-hub.html` v8.79, `amit_data_tools.js`, `ComputerHealth\amit_morning.js`. LOCAL, newer than the published copy, not pushed: `ComputerHealth\AmitLive.html` (master v1.03), `AmitMobile\AmitMobile.html`, `AmitChat\amit_ask_watcher.js` (master dated 2026-10-30), and the helper master files (`amit_whisper.cs`, `amit_bridge_server.ps1`, `amit_whisper.html`, the dashboard). The helper itself: the installed copy and the published manifest both say v1.92 (manifest of 2026-11-14), but the master files hold later words-only edits that are not released (see `AmitHelper\Sessions_Start.md`). The older lines "chat engine v0.29, Hub v8.56, helper v1.30 to v1.31, bridge v1.11, installer 4.68, automatic update paused" described 2026-10-31 and are superseded; whether the update pause (`amit_update.ps1.paused`) still applies was not re-checked.

Blocked: migration `_034` (`wis_notes`, Amit Wisdom) has NOT been run (the table does not exist; checked 2026-11-15). Migration `_032` (`mor_settings`) has been run. Migration `_033` (a function, no table) could not be verified. Whether the answering rules were published (`node amit_ask_watcher.js --publish-rules`) and the helper restarted for Wisdom was not re-checked. Pushes wait for Ryan's "push".

Newest decisions: one Ask Amit chat per day (2026-10-31); first open of the day is a morning card, later opens are small; Show Amit button saves a shot and sends it to today's chat; Wisdom notes shape HOW Amit speaks, never WHAT is true. The 2026-10-25 test-chat punch list (T1-T20, R1-R7) is still the main accuracy to-do. Ring decisions of 2026-10-29 (Ryan): holding the trigger opens the ring and it stays open after release; a click on a choice runs it; Esc closes it; the right-button press that stops dictation stays; Enter sends while it keeps listening; the ring stays semi-transparent and flat with the highlighted choice solid gold, Amit in the middle; choices coming from each user's Hub login is the eventual goal but is not wired yet, and a second ring was not asked for.

## FILES IN PLAY
| File | What it is | Version and state (checked 2026-11-15) |
|---|---|---|
| `amit_chat.js` (Amit root) | shared chat engine | v0.30, published (equal to the repo) |
| `Hub\amit-hub.html` | Hub with Communications > Chats, My Morning, My Words | v8.79, published (equal to the repo) |
| `AmitMobile\AmitMobile.html` | phone page with the chat | local, newer than published (version not read) |
| `amit_data_tools.js` | browser side of the data gate | published, equal to the repo (v1.01 per the old notes) |
| `AmitChat\amit_ask_watcher.js` | answering program | local, newer than published |
| `AmitChat\answerer\AMIT_ANSWERER_RULES.md` | the answering Amit's rules (also in database) | none shown |
| `ComputerHealth\Watchers\amit_whisper.cs` | the helper (whisper, ring, Show Amit) | Version 1.92 in the master; installed 1.92; the master is newer than both the installed and the published copy |
| `ComputerHealth\Watchers\amit_bridge_server.ps1` | shared local bridge | master newer than installed and published (header v1.10; the old notes said v1.11, not reconciled) |
| `ComputerHealth\AmitLive.html` | Amit Live window page | master v1.03, newer than published |
| `ComputerHealth\amit_morning.js` | day boundary and greeting | published, equal to the repo (v1.00 per old notes) |
| `install-Amit.exe` | helper installer | master source says 5.07; the repo's AmitInstaller.cs says 4.85 (not reconciled; the Helper's own file is the authority: `AmitHelper\Sessions_Start.md`) |
| `AmitChat\MyMorning_SPEC.md` | My Morning design | none |
| Migrations `_023` to `_034` in `Database\` | chat, data gate, words, My Morning, day chat, Wisdom | `_032` run; `_034` not run; `_033` unverified; the others not re-checked (the log records them as run) |

## OPEN ITEMS
Open to-dos: 110 numbered items, counted again 2026-11-15 (see Sessions_ToDo.md). Nothing new was added by the 2026-11-15 clean-up. Hub pursuits under program 'AmitChat': none (checked 2026-11-15). Backlog pursuits: not initialized. The 16 `[hub:...]` tags in this and the Computer Health to-do file pointed at the old "Where we left off" pursuits that were deleted from the Hub on 2026-11-14; the six in this folder were replaced by a plain note.

## LAST CLEAN-UP
Last clean-up: 2026-11-15T12:38Z, session 839fe307-73dc-4804-b57c-fc4163286085.

## ORIGINAL SESSIONS
The session of 2026-10-29 to 2026-11-15 is `839fe307-73dc-4804-b57c-fc4163286085` (`C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\839fe307-73dc-4804-b57c-fc4163286085.jsonl`); its full text is at the top of the old log (now in the Daily Sessions folder). Entries before that were not tied to a session id before 2026-11-13. Those files expire on Claude's schedule, which is acceptable because the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: CLAUDE.md's purpose statement describes only a private login-based chat (friends, groups, attachments, read receipts, Amit as a member). The real scope grew to include Ask Amit on every Amit page (shared Amit_Ask_Live.js, answering program amit_ask_watcher.js with rules in the database), the data gate, Whisper dictation by mouse hold and the Amit Live ring (shared helper, now the Amit Helper), Show Amit, and a planned 'My Life' God-centered posts feed. (CLAUDE.md's CURRENT SCOPE was updated to say this on 2026-11-14.)

- CLAUDE.md 'Current Status' said: freshly created 2026-10-11, AmitChat.html is the unmodified template v1.00, no chat code and no tables exist (that text was out of date and is no longer in CLAUDE.md; the real state is above).
- CLAUDE.md 'Tables this project uses' said planned, none created, prefix Cha_ (out of date: tables built and run 2026-10-14 as cha_* in migration_2026-10-14_001, hardened by _002; later _004 added cha_config, cha_amit_id, cha_summon_amit). FIXED 2026-11-15: `Sessions_Design.md` now lists the real tables.
- Built 2026-10-14 (from CLAUDE.md): shared engine amit_chat.js v0.01, Hub v8.13 chat icon, badge, docked popup and Chats tab; migration _001 run and verified, 59 of 59 security checks passed after _002 (details in the old log (now in the Daily Sessions folder) copy below).
- Built 2026-10-15 (from CLAUDE.md): Amit icon in the composer (engine v0.04, cha_summon_amit, Amit's own locked account), photos and files (10 MB bucket, 1600 px camera shots, signed links), amit_check.js rules. Whisper mode built 2026-10-26 in the shared helper (amit_whisper.cs, bridge v1.05, installer 4.58).
- Where it shows up: Hub Mail page became Communications (built in Hub v8.11): Email tab, Chats tab; AmitChat stays its own standalone page.
- J chat / 'check chat' routine (amit_check.js) was the original way Amit answered (retired 2026-10-17 per Sessions_ToDo; the answering program replaced it).
- CLAUDE.md still had the 'Stage 0 skeleton NOT yet approved' decision (decision 15) (out of date: Stage 0 built and run; the staged checklist is in Sessions_ToDo.md, marked unsure if finished).
- 'My Life' feed (Ryan, 2026-10-15): NOT built, recorded as future (Mly_ table prefix, own folder via J New when work starts).

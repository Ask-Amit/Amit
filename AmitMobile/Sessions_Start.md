# AmitMobile - Sessions_Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read Sessions_Log.md (word-for-word recent log) or the original Claude session only when asked. the backup files in Backups\AmitMobile\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md - this file.
- Sessions_ToDo.md - open items found in the old Sessions.md (now in Backups\AmitMobile\Sessions_backup_2026-11-13.md), with source dates.
- Sessions_Log.md - the log copied word for word (whole file; includes the top "new direction" blocks and the Current State block).
- Backups\AmitMobile\Sessions_backup_2026-11-13.md - byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
Amit Mobile is the phone-first voice, camera and chat gateway to Amit (created 2026-09-05), now also being extended so a phone becomes a PERIPHERAL of the computer (idea 2026-11-11, tested 2026-11-12).
- AmitMobile.html: last stated v1.54 (2026-11-05). Dashboard of tiles: Daily Walk, Amit, Zoom/Read This and Search (placeholders), My Computer, Chat (page 8, shared chat engine), Send to computer (page 9). Real backend: Supabase relay (amit_mobile_captures) polled by a desktop watcher that calls headless claude; Hub-open heartbeat gate; thread UI with day grouping, multi-photo, speak button; voice per user from the Hub's About Me.
- Send to computer (helper 1.57/1.58, 2026-11-05): phone photo goes to the computer via the Mobile ring slice; "Ask Amit" about the photo opens a numbered Mobile chat. Works only on a computer with the local-only key file and a mobile_owner.txt; per-computer pairing from the Hub (stage 2) NOT built.
- Peripheral direction (design only, nothing in Helper or Amit Mobile changed): Stage 0 and 0b tests on a real iPhone 11 succeeded for direct touch, touchpad, taps, scroll, pinch zoom, full-screen home-screen web app, photo, video and dictation. Live camera/mic, vibration, staying awake do not work from a plain page. DECISION 2026-11-12: build option one (in-app "at home?" check hopping to the Helper's home page, relay stays default); a domain is coming so an https home route can follow. Every build plan must include the path to that secure stage.
- Not tested: the Ask Amit step from a real phone photo, auto-dictation in the chat box, the phone page on a real phone (as of 2026-11-05).
- Migrations from Sept (captures reply, heartbeat, owner contact) were noted "not yet run" at their entries; later status not recorded here.
- Push status: v1.38/1.39 chat page was not pushed at its entry; later pushes not recorded here.

## FILES IN PLAY (under AmitMobile\ unless stated)
| File | What it is | Version |
|---|---|---|
| AmitMobile.html | the app | v1.54 |
| manifest.json | home-screen install | none |
| PHONE_AS_PERIPHERAL_DESIGN.md | full design record (resume at section 16) | none |
| Stage0_PhoneTest\ | throwaway test code; never install or push | none |
| Amit_Live_Setup_Guide.md | end-user setup guide | none |
| ..\AmitHelper\PHONE_PERIPHERAL_SEE_AMITMOBILE.md, KEYBOARD_SECURE_MESSAGING_DESIGN.md | Helper-side notes | none |
| ..\ComputerHealth\Watchers\amit_mobile_watcher.ps1, amit_bridge_server.ps1 | desktop listener and bridge | none |
| ..\amit_chat.js | shared chat engine | v0.30 at last mention |
| ..\amit_readiness_check.js, amit_owner_contact.js | shared helpers | none |
| CLAUDE.md | project rules | not read for this record |

## OPEN TO-DOS
Open to-dos: 29 items, see Sessions_ToDo.md.

last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\AmitMobile\Sessions_backup_2026-11-13.md), newest log entry dated 2026-11-12 (top blocks; newest dated Log entry 2026-11-05).

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up on, each entry names its session (name, ID and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's own schedule, which is acceptable because the log is the permanent record.

## FROM CLAUDE.md (captured 2026-11-14)
SCOPE NOW: wider than "voice in/out and camera". Amit Mobile is the phone front door and a unifying router: a Dashboard of tiles (Daily Walk, Amit, Zoom/Read This, Search, My Computer, Pursuits, AmitBooks handoff), capture logging and history, a live reply path through Supabase (phone writes amit_mobile_captures, desktop watcher answers via headless claude -p), Connect Amit setup, readiness check (amit_readiness_check.js, /api/claude-status), one-time QR login, home-screen install walkthrough, and a Hub-open heartbeat gate.
- CLAUDE.md "Current Status" says "Not yet built" (2026-09-05) but also a 2026-09-06 entry about the chat-thread rebuild: looks out of date (the app exists; see Sessions_Start above and the PHONE_AS_PERIPHERAL_DESIGN.md plan).
- Shell rebuilt 2026-09-05 to a phone-native layout (thin top bar, no sidebar/right rail, Dashboard tiles are the menu); version v1.03 to v1.04 then. Do not revert to the template sidebar layout.
- Live backend: phone and desktop never talk directly; both use Supabase. Watcher (amit_mobile_watcher.ps1, under ComputerHealth\Watchers, auto-launched by the shared bridge) polls every 5 s; phone polls the row every 2.5 s up to 90 s. Photos are NOT analysed on this path (no image input via claude -p).
- Fixed 2026-09-08: replies never landed because Invoke-RestMethod was rejected with a 401 (now curl.exe) and a UTF-8 BOM corrupted the write-back; mangled em dashes also fixed.
- Heartbeat gate: Hub upserts amit_hub_heartbeat every 25 s; watcher answers only if last_beat is under 60 s old. Migration 2026-09-05_003 was "not yet run" at writing (unsure if finished).
- Voice input: Safari/iOS never supported SpeechRecognition for tap-to-talk; corrected 2026-09-05.
- Photo intent routing (job site file, diagnostic, receipts via AmitBooks pipeline, general research, help me read this); job-site file structure to be built inside Amit Mobile itself. AmitBooks is not retired; only the standalone Yamaha app is.
- Related file in folder: Amit_Live_Setup_Guide.md (end-user setup for the bridge; keep current).


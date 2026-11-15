# AmitMobile - Sessions_ToDo
Items found in the old Sessions.md (now in Backups\AmitMobile\Sessions_backup_2026-11-13.md) only. Source entry date in [brackets].

## Phone as peripheral (design stage)
- Build option one: automatic "at home?" check that hops to the Helper's home page; internet route stays default. Every plan must include the path to the secure (https) stage. [2026-11-12 DECISION]
- Secure home address (domain coming) for live camera and microphone and to remove the hop. [2026-11-12]
- Write the Helper-change plan so a direct-route photo goes into Pictures\Show Amit and pops up in Show Amit. [2026-11-12]
- Open questions: the name, the .jpg versus the "look" rule, Android. [2026-11-12]
- Resume at PHONE_AS_PERIPHERAL_DESIGN.md section 16: layout maker wording (device-agnostic), decisions waiting, what to do first. [2026-11-12 evening]
- Screen-view feature must come from the trusted Helper: opt-in, visible sign, paired and encrypted. [2026-11-12 evening]
- Where the idea went since Stage 0: ask the brainstorming owner (see AmitLive topic 3 round 2). [2026-11-11]
- Untested items listed in design doc section 14. [2026-11-12 evening]

## Send to computer / Mobile
- Stage 2: per-computer pairing from the Hub (needs a database change the owner runs). [2026-11-05]
- Not yet tested: Ask Amit step from a real phone photo, real answer about the picture, auto-dictation in the chat box, phone page on a real phone. [2026-11-05]

## First build items (from the 2026-09 Current State)
- Real Amit backend through a server-side proxy holding the key (Future App Store Path); the relay is the interim. [2026-09-05] (also: no Anthropic key in phone-side JS, real per-user auth, installable PWA, log every capture by user_id; App Store account, billing and caps are a separate future project [CLAUDE.md])
- Run migrations: amit_mobile_captures (001), reply columns (002), amit_hub_heartbeat (003), owner contact (2026-09-06 002). (unsure if finished) [2026-09-05, 2026-09-06] (also: amit_mobile_captures capture table needs topic, summary, transcript, photo_urls, changeable destination; Hub-open heartbeat migration 2026-09-05_003 run status unknown [CLAUDE.md 2026-09-05])
- Create the amitmobile-captures Storage bucket. (unsure if finished; the later photo logs show it in use) [2026-09-05]
- Auto-summarization of captures (topic/summary null). [2026-09-05] (also: auto-summary of each conversation, browsable from the Hub by date and re-routable after the fact, for example "put that into receipts" [CLAUDE.md capture history])
- Distinct Daily Walk devotional content and personality. [2026-09-05]
- Zoom/Read This and Search tiles are placeholders. [2026-09-05]
- Photo content is not analysed in the relay path. [2026-09-05]
- Re-sync the installed runtime copy at %LOCALAPPDATA%\AmitComputerHealth\Watchers\ (Install_AmitTracker.ps1 -Force plus bridge restart). [2026-09-05 several entries]
- End-to-end test of the Hub-chosen voice on the phone. [2026-09-06]

## Chat page
- Chat unread badge on the dashboard tile not wired; About Me voice for read-aloud not wired. [2026-10-17]
- Re-test iPhone voice input in Safari (the Sept failure was probably the home-screen-app case). [2026-10-17 v1.40]

## Resolved (kept so the judgment can be checked)
- Real backend wired (relay, watcher, honest timeout). [2026-09-05]
- iOS mic button replaced by text box plus keyboard dictation. [2026-09-05]
- My Computer tile, Hub heartbeat gate, Connect Amit button, QR and email link, readiness check. [2026-09-05]
- Chat-thread rebuild with multi-photo and speak button. [2026-09-06]
- Chat page added v1.39; v1.40 loads engine v0.13. [2026-10-17]
- Send to computer, Mobile ring slice, Ask Amit about photo built; ring slice and note box tested by Ryan. [2026-11-05]
- Stage 0 and 0b iPhone tests: touch pad works; option one chosen. [2026-11-12]
- Direct same-Wi-Fi attempt of 2026-09-05 was cancelled so as not to overwrite the working relay (not a failure). [2026-11-12]

## FROM CLAUDE.md (captured 2026-11-14)
### Open questions listed as still open (2026-09-05; some probably decided since)
- Voice interaction model on the Ask Amit tile: tap-to-talk (recommended for v1) versus continuous listening. (unsure if finished)
- Login handoff to AmitBooks (shared session token vs redirect-with-reauth). (unsure if finished)
- Fallback when intent cannot be told: ask versus default to research (moot after the tile design).
### Capture history
### Future features (explicitly not v1)
- Shared/family accounts with permission sets (do not hard-code one-row-per-user).
- Photo/storage retention toggle; visible cross-session memory thread in the app; live screen-share mode; quick-capture home-screen widget; offline queuing of voice notes and photos.
- Photos zoomable in capture/review.
### Future App Store path (build in from day one, do not build billing now)
### Heartbeat and setup
- A cloud function could replace the desktop watcher for the paid tier. (heartbeat migration status is under the Run migrations item)
- No outside person has yet been taken through the installer; code-signing certificate still a blocker.


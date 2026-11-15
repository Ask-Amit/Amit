# Devotions - Sessions_Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read the Daily Sessions folder (one text file per session) or the original Claude session only when asked. the backup files in Backups\Devotions\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md - this file.
- Sessions_ToDo.md - open items found in the old Sessions.md (now in Backups\Devotions\Sessions_backup_2026-11-13.md), with source dates.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\Devotions\Sessions_backup_2026-11-13.md - byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
Devotions ("Study, Listen, Worship"; started 2026-09-11 as AmitSongs) pairs scripture study with original worship songs, and has absorbed the whole of who_is_god.html as a tabbed page.
- LIVE (pushed 2026-10-10, commit 74b5f2d): Devotions.html v1.29 and AmitMusic.html v1.00 (songs "Blow the Shofar" and "When I See the Blood"). All seven feast tabs have full story-format studies with a Play button handing the text to SpeakToMe.html. Page 3 Difficult Passages with the Colossians 2 study (rewritten from the Word; 2:16-17 corrected in v1.29).
- LOCAL, NOT pushed (as of 2026-10-16 entries): v1.36 to v1.44 work. All 19 who_is_god tabs moved into Devotions; Who Is God as one page (page 4) on the Multi-Row Tab View; "Add my fellowship" saved to account (v1.43) and then replaced by "Request a fellowship" researched flow (v1.44). who_is_god.html stays untouched as the fallback.
- Blocked on the owner running migrations: Database\migration_2026-10-16_013_who_custom_fellowships.sql and ..._014_who_researched_churches.sql (Claude Code cannot run DDL).
- Newest decision (2026-10-16): fellowships are researched from published teaching by Ryan/Amit, not self-scored; published with Database\who_publish_researched.js.
- Open owner decision: whether the Passover study should name the Exodus 12:48 circumcision requirement.
- Note: the Current State block says v1.29; later log entries advance to v1.44 locally.

## FILES IN PLAY (under Devotions\ unless stated)
| File | What it is | Version |
|---|---|---|
| Devotions.html | main page | v1.29 live; v1.44 local |
| AmitMusic.html, WhenISeeTheBlood.html (and Blow the Shofar stub) | song player and share stubs | v1.00 |
| WhoIsGod.js, WhoIsGod.css, whoisgod\*.html, wig-app\blk*.js | who_is_god moved in (generated; blk3.js hand-edited) | none |
| drafts\ | research drafts and verification ledgers | none |
| Database\migration_2026-10-16_013_..., _014_... | fellowship tables | NOT run |
| Database\who_publish_researched.js | local publishing script | none |
| ..\who_is_god\who_is_god.html | original, accepts #tab=id (v1.23) | v1.23 |
| CLAUDE.md | song production workflow | not read for this record |

## OPEN TO-DOS
Open to-dos: ~25 items, see Sessions_ToDo.md.

last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\Devotions\Sessions_backup_2026-11-13.md), newest log entry dated 2026-10-16.

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up on, each entry names its session (name, ID and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's own schedule, which is acceptable because the log is the permanent record.

## FROM CLAUDE.md (captured 2026-11-14)
SCOPE NOW: grew from "listen to original worship songs" to a "Feasts of the Lord" topic with seven feast tabs in calendar order (each a one-paragraph summary plus "Devotion to follow"), Trumpets with the full paired study as static text and a speaker icon (FEASTS_WITH_SPEAKER set) opening SpeakToMe.html. The Hub tile is now called Devotions (was Songs). Renamed from AmitSongs 2026-09-11.
- CLAUDE.md "Current Status" is from Session 1 (2026-09-11) plus a 2026-10-02 note (looks out of date: nothing newer recorded; check Sessions_Start above).
- Fixed 2026-09-11 (commit 078fd23): the "same content on every tab" bug was an inline style on the Trumpets content div overriding the hide rule; flex layout moved to an .is-reader class. Also fixed: unclosed template literal in Amit_Ask_Live.js (commit 340620e) and Amit_Speak_Engine.js restoreSavedSession() restarting audio (commit efc2d8a).
- Reader mechanism (AmitSpeak.mount) was built then removed on Ryan's order (commit 6f9791f); do not re-add unless he asks. TRUMPETS_FULL_TEXT and buildTrumpetsFullHtml() remain, used for the static study box.
- Auth listener (db.auth.onAuthStateChange) re-enabled 2026-10-02; badge "-notauth" suffix removed; needs a real browser sign-in/out pass.
- Built from Templates\template.html. Open Graph tags needed on shared pages; og:image must be an absolute URL. Audio via plain <audio>; no login needed to listen.
- Tables used: hub_entries (program='Devotions'), template_pages if Add Page is used.
- Also in the folder: Orthodox_Judaism_scorecard_DRAFT.md (not part of this pass).


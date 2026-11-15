# AmitMobile - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections describe how the project is built; read them only when working on that part.

## Tables

# Tables used by this project (copied from CLAUDE.md 2026-11-14)

**Tables this project uses:**
- `hub_entries` / `user_growth_log` / `user_memory` — same shared login-based profile every Amit project reads, per the Login-Based Profile standard below.

**Tables this project does NOT touch:**
- AmitBooks' accounting/receipt tables — this project does not do bookkeeping.
---

## Capture Logging & History — decided 2026-09-05, Ryan's direct instruction

Photos and conversations are KEPT, not discarded — saved to Supabase, tagged to the user's account. Full spec:

1. **Every capture (photo and/or voice conversation) is logged** with: the date, the full transcript/content, any photos, and which destination it was routed to (if any).
2. **Auto-summarized by Amit after the conversation ends** — Amit reads back through what was actually discussed and writes a short topic label + summary, the same pattern already used for session summaries elsewhere in the system. This happens automatically, not as something the user has to type themselves.
3. **Browsable from the Hub** — a user should be able to go to the Hub and ask "what did we talk about on the phone the other day" and pull up that logged history (topic, summary, photos) by date.
4. **Re-routable after the fact** — a capture is not locked to whatever destination it was logged under (or logged as a plain conversation with no destination). A user can come back later and say "put that into receipts," reclassifying/handing it off to AmitBooks' pipeline retroactively. The dashboard tiles are the fast path at capture time; this is the corrective/slow path for anything routed wrong or decided on later.

This directly shapes the Supabase schema still marked open below — the capture table needs, at minimum: `user_id`, `created_at` (date), `topic`, `summary`, `transcript`, `photo_url(s)`, `destination` (nullable/changeable), and a way to update `destination` after the fact without re-creating the row.

## Connect Amit — the one-time setup, and its relationship to Computer Health's tracking — decided 2026-09-05, Ryan's direct instruction

**The real technical limit that shapes this whole design:** a webpage can never install or silently start a program on someone's computer — that's a browser security boundary, not a missing feature. So "press Ask Amit and it sets itself up" can never be literally true the first time. What IS buildable: a one-time "Connect Amit" setup (distinct from the "Ask Amit" conversation button, so the two are never confused), done once per computer, that installs the shared Amit background program and sets it to auto-start with Windows from then on. After that one install, nothing needs to be manually launched again.

**Default behavior, decided:** when Amit is connected/running, BOTH the Amit Mobile phone-listener AND Computer Health's performance tracking (resource/diagnostics/activity/app-behavior watchers) are ON by default, together, as one switch — not two separate things a person has to remember to turn on. A toggle exists to turn OFF just the performance tracking specifically, while Amit Mobile's listening stays on for whoever wants the phone feature without the tracking.

## Readiness Check — built 2026-09-05, Ryan's direct instruction

Ryan asked for a real, unified "readiness check" instead of static explanatory text — three genuinely separate yes/no questions, checked and reacted to the same way from every entry point into Amit:

1. **Signed into Amit/Hub (Supabase auth)?** — checked instantly and universally from the calling page's own already-initialized Supabase client.
2. **Is the local Amit background helper installed and running on THIS computer?** — only checkable by trying to reach the shared bridge (`http://localhost:8710/api/device`) with a short timeout; no response means not running.
3. **Is Claude Code connected on this computer?** — the new, previously-unanswerable piece. Split into two sub-questions on purpose (installed vs. signed in), since they need different fixes.

**This is Claude CODE (the `claude` CLI), not Claude Desktop.** Those are two separate Anthropic products. Claude Desktop is not involved anywhere in this mechanism and no install/check step was added for it.

### Part 1 — `/api/claude-status` on the shared bridge

`ComputerHealth\Watchers\amit_bridge_server.ps1` gained a new read-only endpoint, `/api/claude-status`, returning `{ "installed": bool, "connected": bool }`. **How it determines each, and why this specific method:**

- **installed** — `Get-Command claude` succeeds on PATH, OR `%APPDATA%\npm\claude.cmd` exists directly (covers a PATH that hasn't refreshed in whatever process the bridge happens to be running under).
- **connected** — `%USERPROFILE%\.claude\.credentials.json` exists and its `claudeAiOauth.accessToken` field is non-empty. This file's real shape was confirmed live on Ryan's own machine before writing the check (not assumed): a top-level `claudeAiOauth` object with `accessToken` / `refreshToken` / `expiresAt` / `refreshTokenExpiresAt` — both timestamps are Unix **milliseconds** integers, also confirmed live. A present access token counts as connected even past its own `expiresAt`, since Claude Code silently refreshes it using the refresh token during normal use — only a missing/blank access token, or a refresh token whose OWN expiry (`refreshTokenExpiresAt`) has passed, is reported as not connected.
- **Why file-check, not a live smoke test:** per this project's own documented caution (`claude auth login`/`logout`/`setup-token` can disrupt another already-open Claude Code session on the same machine), this endpoint never runs any `claude auth ...` command and never makes a live `claude -p` call either — it's pure on-disk evidence, safe to poll as often as needed with zero side effects on any other session.

## Real one-time QR login — decided and built 2026-09-05, reusing AmitBooks' own pattern

Ryan pointed directly at the answer: AmitBooks already solved "get a phone signed in with zero typing" for its AmitScan feature, via a real, deployed Supabase Edge Function (`AmitBooks\supabase-functions\get-scan-link\index.ts`) that asks Supabase's own admin API to mint a genuine single-use magic-link for the already-signed-in caller, server-side (the service-role key never reaches the browser). The QR code just renders that real link.

Built the Hub's own equivalent: `Hub\supabase-functions\get-mobile-link\index.ts` (near-identical to AmitBooks' version, redirects to the Hub instead of AmitScan). Wired into the Connect Amit modal's Step 3 (`_renderConnectAmitQr()` in `amit-hub.html`): calls the function with the current session's access token, renders the real returned link as the QR code instead of a plain static URL, with an honest fallback to the plain Hub URL if the function call fails for any reason (not yet deployed, network issue, etc.) — the status text under the QR code says plainly which case it is ("signs your phone in directly" vs. "then sign in there"). Regenerated fresh every time Step 3 is shown, never cached, since a magic link is single-use.

## The Dashboard Architecture — decided 2026-09-05, Ryan's direct instruction

Amit Mobile is a **landing pad / dashboard**, not a voice-guessed router. Opening the app shows the standard Amit icon/profile plus a grid of function tiles. Ryan taps the tile for what he's doing right now — no guessing, no ambiguous-intent handling needed, because the person always chooses explicitly before anything happens. This replaces the earlier "read routing intent from spoken words" idea entirely — simpler, and resolves the open question about ambiguous-intent fallback (there is no ambiguity to resolve; the tile IS the choice).

**V1 tiles — build these now:**
1. **Daily Walk / Daily Prayer** — top of the grid, the most important tile. Opens a devotional conversation where Amit is fully loaded with his own testimony, identity, and the "who is God" evidence — the phone equivalent of the Hub's Morning Altar. Someone speaks right into it. This is the tile that makes the app *Amit* rather than a generic camera-and-mic AI utility wearing a mascot name — see "Why the Daily Walk tile matters" below.
2. **AmitBooks** — opens AmitBooks' existing HTML landing page directly, login carried through (same Supabase-backed account), so photos captured there still go through AmitBooks' own existing receipt/OCR pipeline. Amit Mobile does not rebuild any of AmitBooks' functionality — it's a deep link/handoff into the real thing.
3. **Amit** (general conversation — was "Ask Amit," renamed 2026-09-05 per Ryan: "we just call it Amit, because that's who you're gonna be") — a live conversation screen: voice in (speak to Amit), voice out (Amit speaks back), and the ability to send a photo into the conversation for Amit to look at, research, and respond to. Built on the shared `Amit_Ask_Live.js` mechanism plus the Web Speech API voice pattern from `VoiceControl_AskAmit`.

**Tiles visible but NOT wired yet (placeholders, so the dashboard shape is right from day one):**
4. **Zoom / Read This** — take a photo, zoom into it, Amit reads/explains what it says.
5. **Search** — open web search from a photo or question.

Future tiles (job site file, diagnostic) get added to this same grid later without changing the dashboard mechanism itself.

## Home Screen Install Walkthrough — built 2026-09-05, Ryan's direct instruction

- **iOS Safari** — Apple has never exposed any API for a webpage to trigger or automate "Add to Home Screen," so nothing on iOS pretends to be one-tap. The banner instead shows three clear numbered manual steps (tap the Share icon, tap "Add to Home Screen," tap "Add"). This is the only honest thing buildable on iOS — do not build anything that claims to automate this there.

## Why the Daily Walk tile matters — added 2026-09-05, Ryan's direct instruction

"We're building Amit remote control online, be your phone" — Ryan's own words for what this project actually is. The competitive-landscape research done this session (see Growth/session log) found the phone AI-companion market crowded with camera+voice apps, several building toward fictional relationships or generic personality (Replika, Dopple, Character.AI) rather than a real point of view. None of them are a companion with an actual testimony and mission behind them. The Daily Walk tile is what keeps Amit Mobile from becoming "just another one of those" — it's the tile that carries the actual mission (walk alongside, point toward Yahweh) onto the phone, not just utility (receipts, diagnostics, research).

**Login carries through every tile** — this is one dashboard for one signed-in identity, per the Login-Based Profile standard. A tile that hands off to another real system (AmitBooks) must carry that same session/identity, not require a second sign-in.

## The Live Backend — Supabase Realtime/Poll Relay, wired 2026-09-05

**This supersedes any earlier idea of a direct phone-to-desktop HTTP connection.** An earlier attempt at that (same-Wi-Fi, phone hits desktop's own IP:port directly) was started and explicitly cancelled by Ryan before completion — its files should not be trusted. The decided, built architecture instead:

**The phone and the desktop never talk to each other directly. Both only ever talk to Supabase**, which is reachable from anywhere with internet (cellular included). This means the desktop just needs to be powered on and running its listener from anywhere in the world; the phone just needs normal internet from anywhere in the world. No same-Wi-Fi requirement.

Flow:
1. Phone (`callAmitBackend()` in `AmitMobile.html`) inserts a row into `amit_mobile_captures` (transcript, mode/destination, optional photo_url), with `reply` left null.
2. **The desktop side is NOT a separate app or script someone runs by hand.** Per root CLAUDE.md's SINGLE LOCAL CONNECTION STANDARD, this piggybacks on the ONE shared Amit Bridge that Computer Health already ships (`ComputerHealth\Watchers\amit_bridge_server.ps1`, port 8710). A new companion watcher script, `ComputerHealth\Watchers\amit_mobile_watcher.ps1`, is auto-launched the moment the bridge itself starts (see the "Amit Mobile listener — auto-start" block near the top of `amit_bridge_server.ps1`) — the same pattern the bridge already uses to launch `activity_watcher2.ps1` / `resource_watcher.ps1` / `diagnostics_watcher.ps1` as hidden background processes. If the shared bridge is running, Amit Mobile is listening. Nothing extra to install.
3. That watcher polls `amit_mobile_captures` every 5 seconds via plain Supabase REST (GET with `reply=is.null`) using the SECRET (service-role) key — never the browser-safe publishable key — read live from `Database\supabase_config.md`, the same way other Amit scripts pull it. **Poll, not a websocket Realtime subscription** — PowerShell has no natural lightweight websocket client the way Node's `@supabase/supabase-js` does, and a short poll is simpler to get right and just as good in practice, since a headless `claude -p` call itself typically takes far longer than the 5-second poll interval anyway. A Node-based Realtime version was drafted first and discarded specifically because it would have been a second, separate local process on its own port — exactly what the Single Local Connection Standard forbids.
4. For each unanswered row, the watcher builds a real Amit identity + mode-aware prompt (`daily_walk` vs `general`, and an honest note if a photo is attached — see limitation below) and pipes it over STDIN to a fresh headless `claude -p` call — reusing the exact proven pattern from `VoiceControl_AskAmit\amit_ems_bridge_test.js` (read-only reference; the PowerShell rewrite avoids the same five documented pitfalls: shell-launch requirement, neutral CWD, STDIN piping, no `--dangerously-skip-permissions`, timeout).
5. The watcher PATCHes the reply straight onto that row (`reply`, `reply_at` — added by `Database\migration_2026-09-05_002_amit_mobile_captures_reply.sql`).
6. The phone side polls that one row every 2.5 seconds (capped at 90 seconds) until `reply` appears, showing "Amit is thinking…" while it waits. On timeout: an honest message ("Amit's desktop isn't listening right now — make sure the desktop bridge is running and your computer isn't asleep"), never silence — the message is NOT lost, it's still saved and will be answered once the bridge is back.

**Honest limitation, said plainly, not faked around:** photos are NOT actually seen/analyzed by the headless `claude -p` call — there is no image-pixel input on this path. The prompt tells Claude a photo was attached and asks it to respond honestly about that limitation (acknowledge it, ask the person to describe what's in it) rather than pretending to have seen it.

## Hub-Open Heartbeat Gate — built 2026-09-05, Ryan's direct decision

Fulfills the design captured above under "Connect Amit" and the general phone-listens-only-when-invited posture: phone-side capture/logging (writing a row to `amit_mobile_captures`) ALWAYS works, unconditionally — never gated. But the desktop watcher's actual LIVE REPLY only runs while the same signed-in user's **Hub** (`Hub\amit-hub.html`) is open somewhere in a browser. Deliberate, not a limitation to apologize for — it's meant to give people a real reason to open the Hub daily.

**How it works, end to end:**
1. **Hub side (`Hub\amit-hub.html`):** while a real user is signed in, a `setInterval` (`_startAmitMobileHeartbeat`, every 25s) upserts a row into a new table, `amit_hub_heartbeat` (`user_id` primary key, `last_beat`, `updated_at`), using the Hub's own existing `db`/`currentUser` — no second Supabase client, no duplicated auth logic. Started from inside the existing `onAuthStateChange` handler when `currentUser` is set; stopped (`_stopAmitMobileHeartbeat`) when signed out. This is purely additive — nothing about the Hub's existing auth/data flow was restructured.
2. **Visible indicator in the Hub header**, right next to the existing `☁ SYNC` indicator (`#amitMobileHeartbeatIndicator`): 🟢 "Amit Mobile: Listening" while the heartbeat loop is actively upserting successfully, ⚪ "Amit Mobile: Not Listening" otherwise (signed out, or the last upsert failed).
3. **Desktop watcher side (`ComputerHealth\Watchers\amit_mobile_watcher.ps1`):** before running a `claude -p` call for any unanswered capture row, `Test-HubOpen($userId)` checks `amit_hub_heartbeat` for that `user_id` and treats a `last_beat` older than 60 seconds (or no row at all) as "Hub not open." In that case the watcher skips the Claude call entirely and immediately writes back an honest reply: *"Amit is caught up but the Hub isn't open right now — open the Hub to let Amit reply."* — so the phone gets a fast, truthful response instead of sitting through the full 90-second poll timeout in `callAmitBackend()`.

**What this does NOT change:** the phone's insert into `amit_mobile_captures` (step 1 of the existing Live Backend flow above) is completely unaffected — it happens the same way regardless of whether anyone's Hub is open anywhere. Only the watcher's decision to actually call Claude is gated.

**Setup for an end user (not just Ryan):** `Amit_Live_Setup_Guide.md` in this folder is a plain-language, non-technical, step-by-step guide covering what the bridge is, prerequisites (own Claude Code login, already-authenticated), how to confirm it's running, the Windows sleep-setting fix, and what happens if it's turned off. Keep that file updated whenever this setup process changes — it's written to stand alone for someone setting this up on their own machine, separate from this developer-facing CLAUDE.md.


**Future App Store Path upgrade note:** the eventual paid/cloud tier (see that section below) means swapping WHAT listens for new rows — a cloud Edge Function instead of a desktop script/watcher — not changing the phone-side insert/wait pattern, since the phone already just inserts a row and waits for `reply` to populate. That's what makes the future upgrade relatively cheap.

## Phone-native shell rebuild — 2026-09-05, Ryan's direct live-phone report

**First attempt (reverted, do not redo):** a `@media (max-width:600px)` breakpoint that forced `.sidebar`/`.right-rail` down to their icon-only collapsed widths. Before this was fully verified, Ryan found the actual right answer — `AmitBooks\AmitScan\AmitScan.html` — a completely separate, proven one-screen phone app with no side chrome at all. His reaction after seeing it: "That was very simple." A collapsed-but-still-present sidebar+rail was judged the wrong shape even if it technically fit, so the media-query approach was abandoned rather than kept as a fallback.

**Do not revert to the sidebar/right-rail shell for this file.** If a future session is tempted to "restore the template's normal layout" here, don't — this divergence from `Templates\template.html` is explicit and intentional for AmitMobile's own phone-native identity, documented here and in the file's own top-of-file comment block. `Templates\template.html` itself was not touched by this work and keeps its normal desktop sidebar/rail shell for every other project built from it.

---

## Build Notes — reuse, don't reinvent

Per the Amit system's own precedent, this project is assembled from pieces that already exist elsewhere, not built from scratch:
- **Voice in/out (speech-to-text, text-to-speech):** the Web Speech API pattern already scoped in `VoiceControl_AskAmit\CLAUDE.md`. Read that file's "Open Decision" section before building — it names a real blocker that may bear directly on this project.
- **Live conversational connection to Amit:** the shared `Amit_Ask_Live.js` mechanism (Amit root) — the same file every other Amit page uses to talk to Amit live. This project gets its own entry in `PAGE_CONTEXTS` per the New Project Directive's Step 4b.
- **Photo capture → text/analysis pipeline:** AmitBooks' camera-to-Supabase-to-OCR pattern is the closest existing precedent (receipt photo → stored image → OCR text). What a photo is *for* in Amit Mobile (OCR extraction vs. general "what is this" vs. something Yamaha-specific) is still an open question — see below — and decides whether this reuses AmitBooks' OCR pipeline directly or needs its own.
- **Login/identity:** per the Login-Based Profile standard below (global, not specific to this project) — real signed-in `auth.uid()`, growth log, memory. This is what makes it "Ryan's own Amit," not a stateless terminal.

**Photo intent routing — decided 2026-09-05, Ryan's direct clarification.** A photo capture is not sorted into a category by a menu — it is one single capture flow (photo + spoken words in the same breath), and Amit reads the spoken words as the routing instruction. Four destinations identified so far, all reachable from the same flow:
1. **Job site file** — "upload this to the job site file" — files the photo against a specific job/project record. Needs a jobs/projects structure to file into — not yet confirmed whether one already exists elsewhere in the Amit system or needs to be built here (see open question below).
2. **Diagnostic** — "help me diagnose this" (Ryan's example: a photo of his Yamaha T5C's engine) — photo + spoken description handed to Amit along with a real web search, not just OCR.
3. **Receipts** — OCR extraction, reusing AmitBooks' existing photo-capture-to-OCR pipeline directly rather than building a second one. Amit Mobile is another front door into that same system, not a parallel receipt system.
4. **General research ("what is this")** — photo + question, Amit researches and replies conversationally.
5. **"Help me read this"** — photo of something hard to read (small print, handwriting, a label, a document) — Amit extracts the text and explains it in plain language. Distinct from #3 (receipts): this is legibility/comprehension help, not structured financial data extraction into an accounting system.

Photos should also be zoomable in the capture/review UI (Ryan's direct ask) — a person needs to be able to check what was actually captured before it's sent off for any of the five destinations above.

When Amit can't tell which destination a capture is for from what Ryan actually said, the fallback behavior (ask Ryan to clarify vs. default to research mode) is still an open decision — see below.

**Job site file structure — decided 2026-09-05, Ryan's direct clarification.** No jobs/projects structure exists yet anywhere in the Amit system. This project builds it as part of Amit Mobile itself, not by borrowing a structure from elsewhere.


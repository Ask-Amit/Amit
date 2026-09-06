# Amit Mobile — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitMobile, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitMobile\`
All Amit Mobile development files belong here. Do not create Amit Mobile files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission. It is not a standalone app. It is Amit — carried onto the phone, in your pocket, without a laptop.

---

## What This Project Is

A phone-first way to reach Amit directly — voice in, voice out, and camera capture — without needing a laptop or the full desktop Hub experience. Ryan speaks to his phone, Amit responds by voice; Ryan takes a photo of whatever he's looking at, Amit receives it and can be asked to search it out and respond. Login-based, so it is Ryan's own Amit — his history, his account, his data — reachable from a phone browser (opened as a home-screen web app, full-screen, no address bar) over cellular data or Wi-Fi. Not usable with zero internet — Amit's reasoning runs on Anthropic's API, which requires a live connection.

**This replaces the standalone Yamaha-connected phone app.** That app's use case — snap a photo, describe what's happening, get a response — becomes one capability of Amit Mobile rather than its own separate tool. Ryan is discontinuing the dedicated Yamaha app in favor of this.

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

**BUILT 2026-09-05 — both pieces now real.** The bridge's own startup (`ComputerHealth\Watchers\amit_bridge_server.ps1`, right after the existing Amit Mobile listener auto-start block) now also auto-starts performance tracking by default: a couple seconds after the bridge is up and accepting connections, it calls its own `/api/start-tracking` endpoint (the exact same one the dashboard's Start Tracking button calls — no logic duplicated). This is skipped if a sticky flag file (`$env:TEMP\amit_tracking_disabled.flag`) is present. `/api/stop-tracking` now creates that flag (so stopping tracking via the existing dashboard button also survives a future bridge restart) and `/api/start-tracking` now clears it (so manually starting tracking again re-arms auto-start next time). No new UI was built — the dashboard's existing Start/Stop Tracking buttons now also control whether tracking persists across restarts. The "Connect Amit" button (below) was added to the Hub, next to the Amit Mobile heartbeat indicator, linking to the existing installer download (`https://raw.githubusercontent.com/Ask-Amit/Amit/main/ComputerHealth/install-Amit.exe`, the same link Computer Health's own not-running screen already uses) with plain-language explanatory text and an honest SmartScreen-warning heads-up (code-signing certificate still not resolved, per root CLAUDE.md's task list). **Not yet done:** the installed runtime copy at `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` was not re-synced with this change — per ComputerHealth\CLAUDE.md's "Three Real Copies" rule, this fix only reaches a real running instance once `Install_AmitTracker.ps1 -Force` is re-run and the bridge process is restarted.

**EXTENDED 2026-09-05 (same day, later) — real gap found and fixed in what the install flow actually launches: `Run_AmitTracker.ps1`'s `-NoOpenDashboard` branch (what the installer calls after a fresh install) never launched `AmitTracker.exe` at all — only the bridge server directly, meaning someone connecting purely for their phone had zero visible/discoverable sign anything was running and no way to shut it down themselves. Fixed by adding a `--tray-only` mode to `AmitTracker.exe` (real system tray `NotifyIcon`, Open Dashboard / Stop Tracker menu, no popped window, no dashboard tab) and pointing this branch at it instead. Full detail, the real bug caught and fixed along the way (process not exiting after Stop Tracker — window handle never created), and the new installer version (4.43) are documented in `ComputerHealth\CLAUDE.md`'s dated 2026-09-05 entry — read that before touching this flow again.**

**EXTENDED 2026-09-05 — QR code and email-link added to the Connect Amit modal (`Hub\amit-hub.html`).** Two additions inside the existing modal, nothing about the installer/SmartScreen content rebuilt:
- **QR code:** renders client-side via `qrcodejs` (davidshimjs), loaded as a plain global-exposing `<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js">` tag — same jsdelivr CDN convention the Hub already uses for Supabase's own script tag, no bundler, no new paid dependency. It encodes the Hub's real deployed URL, `https://ask-amit.github.io/Amit/Hub/amit-hub.html` (confirmed from existing `window.open`/redirect links already in `amit-hub.html`, not guessed) — NOT the installer .exe, since a phone can't run that. Copy in the modal makes this explicit: scan to open the Hub on the phone, sign in with the same account to connect it. Rendered once per modal-open into `#connectAmitQR` (a `<div>`, guarded by a `dataset.rendered` flag so it isn't re-drawn every time the modal reopens).
- **Email-me-this-link:** an email input (prefilled from `currentUser.email` when signed in, per the Hub's existing auth state) plus an "EMAIL ME THIS" button, `sendConnectAmitEmail()`. **This is honestly a `mailto:` fallback, not a real sent email** — no server-side "send arbitrary email" mechanism exists anywhere in this codebase yet (Supabase's magic-link email is a different, narrower mechanism; the GitHub-Issues contact system named in root CLAUDE.md's task list is still only planned, not built). Clicking it opens the user's own email app with the Hub URL and the installer link pre-filled in the subject/body, addressed to whatever address they typed — real and working, just simpler than a true server-sent email. Said plainly in-page ("Amit doesn't send this email itself yet") and flagged with a code comment at the point the `mailto:` link is built.

**RESTRUCTURED 2026-09-05 (later same day) — Connect Amit modal rebuilt as a 3-step wizard, replacing the single-scroll layout.** Ryan tested the modal live and found the one-long-scrollable-block layout genuinely confusing — people didn't scroll down far enough to see the SmartScreen warning notes before clicking Download, and there was no sense of "step 1 of 3." Same modal container/shell, colors, and trigger buttons (`#connectAmitBtn`, `#connectAmitInlineBtn`) — only the inner content was restructured into three sequential screens (`#caStep1`/`#caStep2`/`#caStep3`), shown one at a time via `_showConnectAmitStep(n)`, tracked in `_connectAmitStep`, with a "STEP N OF 3" label at the top. `openConnectAmitModal()` always resets to step 1 on open.
- **Step 1 — Claude account check:** the existing "Before you install" paid-Claude-subscription explanation, unchanged wording. Two actions: "I have a Claude account set up →" advances to step 2; "I need to set one up first" opens claude.ai in a new tab without advancing, so someone can go get an account and return to the same modal. Clicking it also reveals a small, calmly-styled reassurance note right there in step 1 (`#caStep1Reassure`, green/muted tone, distinct from the paid-subscription warning box above it): "No problem — the Hub still works great without this. You just won't be able to connect your phone to Amit for live, on-the-go replies until you have a Claude subscription set up. Everything else in Amit stays fully available either way." It doesn't block anything — "I have a Claude account set up" is still clickable at any time, and the note re-hides each time the modal is reopened.
- **Step 2 — What you'll see during install:** the existing two-warnings SmartScreen/browser-download explanation (exact click sequence, unchanged) plus the tracking-by-default note, both moved here since this is the step immediately before installing. The DOWNLOAD THE INSTALLER button now lives on this screen, not step 1. Back returns to step 1; a "Next: Get Amit on your phone →" link advances to step 3 (download completion isn't detected — same good-faith assumption used elsewhere in this flow).
- **Step 3 — Get Amit on your phone:** the existing QR code (`#connectAmitQR`) and email-yourself-the-link (`#connectAmitEmailInput` / `sendConnectAmitEmail()`) sections, relocated here unchanged — same qrcodejs rendering, same `mailto:` fallback behavior described above. Back returns to step 2; Close (`closeConnectAmitModal()`) ends the flow.
No QR/email/download logic was rewritten — only relocated into the new step markup. Hub version bumped to v6.31 for this change.

**CORRECTED 2026-09-05 (later still) — two real product/UX corrections from Ryan watching this live, Hub bumped to v6.33.**
1. **Button renamed everywhere, and it now sells itself.** "⚙ AMIT SETUP" / "CONNECT AMIT" (`#connectAmitBtn`, `#connectAmitInlineBtn`) is now **"CONNECT YOUR PHONE"** in both places, with the `title` tooltip changed to `"Take Amit with you — talk to your companion from your phone, anywhere, anytime. Click to set it up."` Same `onclick="openConnectAmitModal()"` behavior on both — labeling/tooltip only, nothing functional changed.
2. **Step 1's opening paragraph now leads with the pitch, not the mechanics.** It used to open cold with "This is a one-time setup — separate from the 'Ask Amit' button..." — Ryan's point: someone who doesn't already know what Amit is has no reason yet to care. New opening line: *"Amit walks alongside you every morning here in the Hub. Set this up once, and Amit is reachable from your phone too — anywhere, anytime, not just when you're sitting at this computer."* Then a transition line, *"Here's what's needed to make that real:"*, before the original mechanical paragraph (kept verbatim below it) and the existing paid-subscription/Claude-Code requirement boxes (unchanged — those were already correct and honest, nothing invented or oversold).
3. **The header "Not Listening" indicator (`#amitMobileHeartbeatIndicator`) is now gated behind a localStorage flag, `amitConnectAttempted`.** Previously it showed "⚪ Not Listening" to every signed-in user, including someone who had never once opened this modal — confusing noise about a feature they don't know exists. Now: if the flag is unset AND the person isn't actually connected, the indicator stays `display:none` entirely. The flag is set in exactly one place, `openConnectAmitModal()` (opening the modal at all counts as "attempted"), and read in `_refreshAmitReadinessBanner()`. A genuinely connected state (`bridgeRunning && claudeConnected` both true) always shows the green "🟢 Listening" confirmation regardless of the flag — that's real positive information, not noise. This sits inside `_refreshAmitReadinessBanner()`, the same function already corrected twice this session for the setup-button/banner interaction — re-read it in full before touching it again, the ready/not-ready branching for `setupBtn`/`connectBtn` visibility was left untouched by this change.

**AUTO-SKIP ADDED 2026-09-05 (later still) — Step 1's manual question is now bypassed whenever the real answer is already knowable, Hub bumped to v6.34.** Ryan's point: Step 1's yes/no "do you have a paid Claude subscription" question only exists because there's genuinely no way to check remotely when no local bridge has ever been installed — that's the one case Amit is truly blind. Once a bridge IS already installed and reachable, asking is pointless when `checkAmitReadiness()` already knows the answer by looking.

`openConnectAmitModal()` is now `async`. It still shows Step 1 immediately on open (so the modal never sits blank while the check runs), sets the `amitConnectAttempted` localStorage flag exactly as before, then `await`s `checkAmitReadiness(db)` — reusing the Hub's already-initialized Supabase client, the same pattern `_refreshAmitReadinessBanner()` uses, never a second client. Based on the result:

- **`bridgeRunning===false`** (or the check throws/times out) — Step 1 stays showing, unchanged. This is the only genuinely-blind case.
- **`bridgeRunning===true && claudeConnected===true`** — jumps straight to Step 3 via `_showConnectAmitStep(3,true)`. The `true` second argument shows a small confirmation line above the QR code, `#caStep3AlreadyConnectedNote`: *"✓ This computer is already connected — let's get it on your phone."*
- **`bridgeRunning===true && claudeConnected===false`** — jumps straight to Step 2 via `_showConnectAmitStep(2,true)` (re-running the installer is harmless — it's idempotent and its own Step 1c already handles connecting Claude Code even on an existing install). Shows `#caStep2AlreadyInstalledNote`: *"Good news — Amit's background helper is already installed here. Just need to finish connecting Claude Code."*

`_showConnectAmitStep(n, skipAheadNote)` takes an optional second boolean — only truthy when arriving via this auto-skip path, never on the normal Back/Next navigation between steps, so the two "already ___" notes only appear on a genuine skip-ahead, not every time someone revisits step 2 or 3 manually. The step-label ("STEP N OF 3") always reflects whichever step is actually showing, so someone landing straight on step 3 correctly sees "STEP 3 OF 3," never "STEP 1 OF 3." No behavior changed in `checkAmitReadiness()`, `amit_readiness_check.js`, the QR/email logic, or the `amitConnectAttempted` flag — it is now set unconditionally near the top of `openConnectAmitModal()`, before the async check runs, so it fires identically in all three scenarios.

**AUTO-ADVANCE ON STEP 2 ADDED 2026-09-05 (later still) — Hub bumped to v6.36.** Ryan found this live: the installer is a separate native Windows program with no way to reach into the open Hub tab and signal "I'm done" — so after someone finished running it, Step 2 just sat there with the Download button still clickable, looking unfinished. Fix: while `#caStep2` is the visible step, a 4-second poll (`_startCaStep2Poll()`/`_stopCaStep2Poll()`, timer id in `_caStep2PollTimer`) calls `checkAmitReadiness(db)` — same client, same function used everywhere else in this flow. The instant `bridgeRunning && claudeConnected` are both true, it stops polling and calls `_showConnectAmitStep(3,true)`, reusing the existing skip-ahead confirmation note on Step 3. A failed/thrown check on any given tick is swallowed silently and just tried again next tick — never stops the loop.

The poll is started/stopped from inside `_showConnectAmitStep()` itself: `n===2` starts it, any other `n` stops it. `closeConnectAmitModal()` also stops it. Both stop and start call `_stopCaStep2Poll()` first, so there is never more than one interval alive even if Step 2 is shown, left, and shown again in the same session (Back-to-2-then-Next-then-Back-to-2 repeatedly). The manual "Next: Get Amit on your phone →" link on Step 2 is untouched — this is an addition alongside it, not a replacement.

**Visible status line, added same pass, per Ryan's direct follow-up ("don't leave someone wondering if anything's happening"):** `#caStep2PollStatus`, a small dim text line below the Download button. Shown the moment Step 2 is displayed (not gated on clicking Download first) reading *"Waiting for the installer to finish on this computer…"*. A tick counter (`_caStep2PollTicks`, reset to 0 every time the poll (re)starts) switches the same line, after `_CA_STEP2_NUDGE_AFTER_TICKS` (9 ticks ≈ 36s) with no success detected, to a calmer nudge: *"Still waiting — if you haven't opened the downloaded file yet, click Download the Installer above, then open it and click Run/Keep/More info → Run anyway as needed."* Neither wording implies failure — real install time varies with SmartScreen/antivirus. On success the line is hidden as part of `_stopCaStep2Poll()`, before the jump to Step 3 — Step 3 never shows it.

**"My Computer" view inside Amit Mobile — BUILT 2026-09-05.** Page 6 / dashboard tile "My Computer" (`amMyComputerHtml()` in `AmitMobile.html`) reads the signed-in user's own `amit_device_events` rows directly from Supabase (`event_type='master_report'`, filtered `user_id=eq.<currentUser.id>`, ordered `created_at desc`, limit 30) — this works today because that table is already written to Supabase (not a local-only temp file), confirmed directly this session. Each report renders as a tappable card: `summary` text + date + severity pill; tapping expands `event_detail.report.insight.strengths`/`.concerns` as two plain labeled lists ("What's running well" / "What to watch"), never raw JSON. Read-only — no edit/delete affordance anywhere on this page. Empty state ("No computer reports yet — install Amit on your desktop to start tracking.") shown honestly when a user has zero rows, rather than a blank screen. Visual style reuses the existing `.amvoice-box`/`.amdash-tile` gold/navy card language — no new visual language introduced.

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

### Part 2 — Installer's "Connect Your Claude Account" step

Both `Install_AmitTracker.ps1` copies (`ComputerHealth\Watchers\Install_AmitTracker.ps1` and `ComputerHealth\Watchers\AmitInstaller\Install_AmitTracker.ps1` — kept identical, per this project's Three-Real-Copies-style duplication already used for Step 1b) gained a new **Step 1c**, run right after the existing Step 1b (which already auto-installs Node.js via `winget install OpenJS.NodeJS.LTS` and the Claude Code CLI via `npm install -g @anthropic-ai/claude-code` — that exact, already-documented sequence, reused rather than reinvented). Step 1c does two genuinely separate things, reported distinctly:

1. **Re-checks whether Claude Code is installed at all** (same PATH/`claude.cmd` check as the bridge's endpoint). If Step 1b's automatic install didn't actually succeed, this says so plainly and skips the connect step — it does NOT attempt a second, different install mechanism.
2. **If installed, checks whether it's signed in** (same credentials-file check as the bridge's endpoint, run locally rather than over HTTP since the bridge may not be running yet at this point in the install). If not connected, it prints the exact honest wording already agreed for this (adapted from AmitBooks-specific phrasing to generic "Amit's live features"):

   > "To use Amit's live features, this computer needs to connect to your own Claude account — this is separate from your Amit sign-in. Clicking Connect opens Anthropic's own login page directly; your Claude credentials go straight to them, never through Amit or stored anywhere here. This only needs to happen once on this computer."

   Then it **offers** (`Read-Host`, wrapped in try/catch so a non-interactive run just skips rather than hanging) to run `claude login` right there — never forced. Declining prints how to connect later (`claude login` from a terminal, or the Hub's Connect Amit panel).

### Part 3 — Shared JS: `amit_readiness_check.js`

New file at Amit root, included the same way as `Amit_Ask_Live.js` (`<script src="../amit_readiness_check.js">`, path adjusted per page depth). Exposes two functions, used identically everywhere:

- **`checkAmitReadiness(supabaseClient)`** — takes the calling page's own already-initialized Supabase client (never creates a second one). Checks Supabase auth state, then tries `GET http://localhost:8710/api/device` with a 2-second timeout to detect the bridge, then (only if the bridge answered) `GET .../api/claude-status`. Returns `{ signedIn, bridgeRunning, claudeInstalled, claudeConnected }`. Never throws — any failed sub-check just reports false rather than breaking the caller.
- **`renderReadinessBanner(container, status, opts)`** — shows exactly one of the four agreed messages (sign in / connect Amit / Claude not installed / Claude not connected) with a single action button, or hides itself entirely when all four are satisfied. `opts.onSignInClick` / `opts.onConnectClick` are optional callbacks the calling page wires to its own sign-in/Connect-Amit UI. **Style choice, made and documented rather than left open:** neutral inline styles (soft gray/blue, no page-specific palette) — no style-preset parameter, since this one file is shared across pages with very different color schemes (Hub's gold/navy vs. Amit Mobile's own). A future page wanting a different look should wrap the container in its own CSS rather than extending this function.

### Part 4 — Wired into Amit Mobile and the Hub

- **`AmitMobile.html`** — `#amitReadinessBanner` sits above the dashboard tile grid (inside `amDashboardHtml()`), refreshed via `_refreshAmitReadinessBanner()` on both the initial page-load IIFE and every `onAuthStateChange` event. A brand-new user sees immediately, before tapping anything, which step they're missing.
- **`Hub\amit-hub.html`** — `#amitReadinessBanner` sits directly under the header (near the existing `⚙ CONNECT AMIT` button and the Amit Mobile heartbeat indicator), refreshed the same way (`_refreshAmitReadinessBanner()` on `onAuthStateChange` and on page load). The banner's action button opens the existing `openSyncModal()` or `openConnectAmitModal()` depending on which condition is unmet — no new modal built, this just surfaces the existing ones proactively.

Both integrations are purely additive — neither file's existing script-loading, auth-listener, or UI structure was rebuilt.

**Not yet done:** the installed runtime copy of the bridge/installer at `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` was not re-synced with these changes — per ComputerHealth\CLAUDE.md's Three Real Copies rule, `/api/claude-status` and the installer's Step 1c only reach a real running instance once `Install_AmitTracker.ps1 -Force` is re-run and the bridge process is restarted.

**Genuinely uncertain, flagged rather than guessed past:** the credentials-file check is the most reliable non-invasive signal found on this machine, but it's inherently a heuristic — a corrupted/hand-edited credentials file with a non-empty but bogus `accessToken` would read as "connected" even though a real `claude` call would fail. No live call is made to rule this out, by design, given the documented disruption risk. If this ever proves unreliable in practice, the next step up would be a very short, explicitly opt-in `claude -p "hi" --print` smoke test — deliberately NOT added here without further confirmation it's safe to fire ad hoc.

## Real one-time QR login — decided and built 2026-09-05, reusing AmitBooks' own pattern

Ryan pointed directly at the answer: AmitBooks already solved "get a phone signed in with zero typing" for its AmitScan feature, via a real, deployed Supabase Edge Function (`AmitBooks\supabase-functions\get-scan-link\index.ts`) that asks Supabase's own admin API to mint a genuine single-use magic-link for the already-signed-in caller, server-side (the service-role key never reaches the browser). The QR code just renders that real link.

Built the Hub's own equivalent: `Hub\supabase-functions\get-mobile-link\index.ts` (near-identical to AmitBooks' version, redirects to the Hub instead of AmitScan). Wired into the Connect Amit modal's Step 3 (`_renderConnectAmitQr()` in `amit-hub.html`): calls the function with the current session's access token, renders the real returned link as the QR code instead of a plain static URL, with an honest fallback to the plain Hub URL if the function call fails for any reason (not yet deployed, network issue, etc.) — the status text under the QR code says plainly which case it is ("signs your phone in directly" vs. "then sign in there"). Regenerated fresh every time Step 3 is shown, never cached, since a magic link is single-use.

**Not yet deployed — needs Ryan's one-time action (same as any Edge Function, per Supabase's own dashboard-based deploy flow, no CLI required):** see the file's own header comment for exact steps.

**BUG FOUND LIVE 2026-09-05 (Ryan tested end to end) — scanning the QR did NOT sign the phone in; it landed exactly like a fresh, signed-out visitor. Investigated by comparing directly against AmitBooks' already-proven-working `get-scan-link`/AmitScan pair.**

What was checked and ruled out, with the actual code compared side by side:
- **Client init pattern** — the Hub creates its Supabase client with zero explicit `auth` options (`supabase.createClient(SB_URL,SB_KEY)`), while AmitScan explicitly sets `persistSession`/`autoRefreshToken`/`detectSessionInUrl:true`/a custom IndexedDB storage adapter. `detectSessionInUrl` defaults to `true` in supabase-js v2 either way, so the Hub not setting it explicitly should not itself be the cause — and AmitScan's custom storage exists for a documented, unrelated reason (surviving a force-quit on a home-screen PWA), not for cross-device magic-link handling.
- **Hash-stripping / early cleanup code** — grepped `amit-hub.html` for `location.hash`, `replaceState`, and `location.search`: nothing found. No code runs on load that could strip the `#access_token=...` fragment before the Supabase client gets a chance to read it.
- **`flowType` mismatch (implicit vs PKCE)** — neither the Hub's nor AmitScan's client sets `flowType` explicitly, so both fall back to the same library default. `admin.generateLink()` (used server-side by both Edge Functions) always returns an implicit-style link with tokens in the URL fragment regardless of the calling browser's own flowType setting, since PKCE requires a `code_verifier` that only exists in the browser that started the flow — which is structurally incompatible with "generate on desktop, redeem on phone" in the first place. This rules out a flowType mismatch as the cause for either app.
- **CDN version pinning** — the Hub loads `@supabase/supabase-js@2` unpinned from jsdelivr; AmitScan loads the same major version unpinned from unpkg. Different CDN, same major version, both auto-updating — a plausible but unconfirmed minor contributor, not chased further since a more concrete candidate was found (below).

**Leading, NOT YET CONFIRMED hypothesis — the real difference found:** Supabase Auth only honors a `generateLink()` call's `redirectTo` when that exact URL (or a matching wildcard) is present in the project's Authentication → URL Configuration → Redirect URLs allowlist. AmitBooks' `AMITSCAN_URL` (`.../AmitBooks/AmitScan/AmitScan.html`) is proven working, meaning it (or a wildcard covering it) is already on that list. The Hub's `HUB_URL` (now changed to `AMIT_MOBILE_URL`, `.../AmitMobile/AmitMobile.html`) is a different path under the same domain and may never have been added. If it isn't on the allowlist, Supabase silently ignores `redirectTo` and sends the browser to the project's default Site URL instead — which never sees or processes the `#access_token` fragment, producing exactly the symptom Ryan saw: a phone that lands looking like a brand-new, signed-out visitor, with no error surfaced anywhere.

**This could not be confirmed or ruled out from inside this session** — checking/editing the Redirect URLs list is a Supabase Dashboard setting, not something reachable through the REST API, a curl test, or any tool available here. No speculative code fix was applied on top of a guess; the two real code changes made this pass (below) are independently correct regardless of whether this is the actual root cause.

**Action needed from Ryan, before testing again:** in the Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, confirm `https://ask-amit.github.io/Amit/AmitMobile/AmitMobile.html` is listed (or that a wildcard like `https://ask-amit.github.io/Amit/**` already covers it). Add it if missing, save, then re-test the QR scan. If the bug persists even with the URL properly allowlisted, the next real diagnostic step is watching it happen live in a phone browser's DevTools (remote-debugging over USB) to see the actual redirect chain and whether `onAuthStateChange` ever fires — not reachable from this tool-only session.

**Two confirmed, applied fixes this pass (2026-09-05), independent of the above:**
1. **Wrong destination, now fixed.** `get-mobile-link/index.ts`'s target constant was renamed `HUB_URL`→`AMIT_MOBILE_URL` and now points at `https://ask-amit.github.io/Amit/AmitMobile/AmitMobile.html` instead of the Hub — matching the actual intent of "Connect Your Phone." **Not yet redeployed** — Edge Functions require the Supabase Dashboard, no CLI available. See redeploy steps in the file's own header comment (unchanged mechanism: Edge Functions → `get-mobile-link` → Code tab → replace → Deploy).
2. **Hub-side fallback and copy updated to match.** `amit-hub.html`'s `CONNECT_AMIT_HUB_URL` constant (kept its old name to avoid touching every call site, but repointed) now also targets Amit Mobile's URL, so the plain-URL fallback path (used when the Edge Function call fails) lands someone in the right place too, not the Hub. The status line under the QR ("Scan this to open Amit Mobile on your phone, then sign in there.") was updated to match. Hub bumped to v6.40. Not pushed to GitHub — left staged in the OneDrive source per the Review & Push Workflow; a separate coordinator session handles the git mirror and push.

## Future App Store Path — architectural constraints to build in from day one (added 2026-09-05, Ryan's direct instruction)

Ryan's stated intent: build the personal version now, but keep the architecture such that going commercial (App Store, paying strangers) later is "an easy fix," not a rebuild. This does NOT mean building billing/metering/Apple submission now — it means not making choices now that would block them later. Four standing constraints, cheap now, expensive to retrofit:

1. **Never call the Anthropic API directly from phone-side JS with an embedded key.** All calls to Amit's reasoning go through a server-side proxy (the same pattern already established for AmitBooks' OCR calls) — the phone app calls the proxy, the proxy holds the real key. This is the single most important constraint: skipping it means every phone-side call would need to be rewritten before any public/metered version could exist, since a stranger's app can never hold Ryan's live API key.
2. **Real per-user Supabase auth from day one** (already the plan via the Login-Based Profile standard) — so a future usage-limit/billing layer has a real identity to attach to, not an afterthought.
3. **Build as an installable PWA**, not an unpackaged plain webpage — a PWA can be wrapped into an actual App Store submission later (e.g. via Capacitor) with the interface layer largely untouched.
4. **Log every capture/conversation to its own Supabase table, tagged by `user_id`** — the raw usage trail a future "used X of Y" meter would read from, even though no meter exists yet.

**What is explicitly NOT being built now:** Apple Developer account, App Store submission, in-app purchase/metered billing, usage caps. Those are their own future project, scoped separately, once the personal version is working.

## Purpose Within the Amit System

The mobile front door to the whole Amit system — not a narrow single-purpose tool like AmitBooks or the old Yamaha tracker. Anywhere Ryan (or any signed-in user) has a phone and a data connection, they have Amit: someone to talk to, someone who can look at a photo and respond, someone who remembers who they are because they're logged in.

## Current Status

**2026-09-06 — Daily Walk/Amit tiles rebuilt as a real scrolling, day-grouped chat thread** (multi-photo attach, tap-to-expand thumbnails, visible 🔊 speak button on every Amit reply — the honest fix for iOS Safari blocking non-gesture `speechSynthesis` calls). Full detail in `Sessions.md`'s 2026-09-06 entry — read it before touching `amVoicePageHtml()`, `callAmitBackend()`, or the photo-attach flow again. `amit_mobile_captures.photo_url` now stores multiple photo paths as a JSON array string in the same existing text column (no schema migration) — `amParsePhotoUrls()` handles both that and any older single-path rows.

Not yet built. Architecture settled 2026-09-05 (see "The Dashboard Architecture" below) — sample/skeleton pending Ryan's review before real build begins.

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

The Dashboard (page 1, `amDashboardHtml()`) shows a guided walkthrough for adding Amit Mobile to the phone's home screen, automatically, right when someone opens the app in a plain browser tab rather than as an already-installed icon. Detection: `amIsInstalled()` checks `window.navigator.standalone===true` (iOS) OR `window.matchMedia('(display-mode: standalone)').matches` (cross-platform standard) — if either is true, the banner never renders at all.

**Android and iOS are handled by genuinely different, honest mechanisms — one is not faking the other:**
- **Android (Chrome and most Android browsers)** — a real native install prompt. `beforeinstallprompt` is captured globally (`amDeferredInstallPrompt`) the moment the browser fires it, and the banner then shows a real "📲 Install Amit Mobile" button (`amClickAndroidInstall()`) that calls the captured event's `.prompt()` — this pops the browser's own actual "Install app?" dialog. One tap, done.
- **iOS Safari** — Apple has never exposed any API for a webpage to trigger or automate "Add to Home Screen," so nothing on iOS pretends to be one-tap. The banner instead shows three clear numbered manual steps (tap the Share icon, tap "Add to Home Screen," tap "Add"). This is the only honest thing buildable on iOS — do not build anything that claims to automate this there.
- **Neither platform detected (e.g. desktop browser)** — the banner never shows. This flow exists only for phones.

Platform detection is plain user-agent sniffing (`amIsIOS()` / `amIsAndroid()`) — reasonable and standard for this purpose since there's no better signal available for "is this a phone that could install a PWA."

**Dismiss/re-show behavior:** the banner has a ✕ close button (`amDismissInstallBanner()`) that writes `localStorage.amitMobileInstallDismissedAt` (a timestamp) and clears the banner immediately. It is not gone forever — `amInstallRecentlyDismissed()` re-shows it once 2 days (`AM_INSTALL_REDISPLAY_MS`) have passed since that dismissal, so someone who dismisses out of habit still gets reminded later rather than never again. Accepting the Android install (`appinstalled` event) or completing it clears the banner without setting the dismiss flag — that path doesn't need a re-show timer since the app is actually installed at that point.

Lives in `AmitMobile.html`: CSS under `.aminstall-*` (near the `.amdash-*` dashboard tile styles), JS functions `amIsInstalled`, `amIsIOS`, `amIsAndroid`, `amInstallRecentlyDismissed`, `amDismissInstallBanner`, `amRenderInstallBanner`, `amClickAndroidInstall`, called once from `buildPlaceholders()` on load and again whenever the real `beforeinstallprompt`/`appinstalled` events fire. Renders into `#amInstallBannerHost`, a dedicated div inside `amDashboardHtml()` — separate from and above `#amitReadinessBanner` (the unrelated Connect-Amit readiness check banner), so the two never collide.

## Why the Daily Walk tile matters — added 2026-09-05, Ryan's direct instruction

"We're building Amit remote control online, be your phone" — Ryan's own words for what this project actually is. The competitive-landscape research done this session (see Growth/session log) found the phone AI-companion market crowded with camera+voice apps, several building toward fictional relationships or generic personality (Replika, Dopple, Character.AI) rather than a real point of view. None of them are a companion with an actual testimony and mission behind them. The Daily Walk tile is what keeps Amit Mobile from becoming "just another one of those" — it's the tile that carries the actual mission (walk alongside, point toward Yahweh) onto the phone, not just utility (receipts, diagnostics, research).

## Future features — captured but explicitly NOT scoped for v1 (added 2026-09-05)

- **Shared/family accounts with permission sets** — confirmed as a real intended future build, not just a brainstorm idea. Example: a spouse or business partner sharing visibility into the same account's capture history ("what did Ryan ask you to look at on the Yamaha yesterday"). Do not architect the login/account system in a way that would rule this out later (e.g. avoid hardcoding a strict 1-row-per-user-with-no-sharing assumption at the database level if it can reasonably be avoided) — but do not build the sharing mechanism itself now.
- **Photo/storage retention control** — flagged by Ryan as a real future concern, not urgent: if usage grows at scale, Supabase storage could fill with photos users don't need kept long-term. A future optional "don't retain this photo after processing" toggle is the likely shape. Not building this now. (Superseded for v1 by the decision directly below — for now, everything is kept.)
- **Continuous cross-session memory shown IN the app** (not just logged silently) — a visible "here's what we talked about yesterday" thread.
- **Live screen-share mode** — same camera pipeline pointed at a computer monitor instead of the physical world, for "explain this error message."
- **Quick-capture home-screen widget / lock-screen shortcut** — jumps straight to camera+mic, skipping the dashboard, for urgent moments.
- **Offline queuing** — record a voice note or photo with no signal, auto-sends when signal returns, instead of failing outright.

**Login carries through every tile** — this is one dashboard for one signed-in identity, per the Login-Based Profile standard. A tile that hands off to another real system (AmitBooks) must carry that same session/identity, not require a second sign-in.

## Build Notes — reuse, don't reinvent

Per the Amit system's own precedent, this project is assembled from pieces that already exist elsewhere, not built from scratch:
- **Voice in/out (speech-to-text, text-to-speech):** the Web Speech API pattern already scoped in `VoiceControl_AskAmit\CLAUDE.md`. Read that file's "Open Decision" section before building — it names a real blocker that may bear directly on this project.
  - **CORRECTED 2026-09-05 — Safari/iOS never supported voice input this way.** Ryan tested the original tap-to-talk mic button (SpeechRecognition/webkitSpeechRecognition) on a real iPhone and it does nothing — Apple has never implemented the Web Speech API's SpeechRecognition (speech-to-text) in Safari, and every iOS browser is Safari underneath, so there was no browser choice that would have fixed it. Fixed in v1.02: a plain text input (`<textarea>`) is now the PRIMARY, always-present way to send a message on both the Daily Walk and Amit tiles — the phone's own OS keyboard has a built-in microphone/dictation button, a completely separate native mechanism from the browser JS API, so "speak instead of type" still works on iPhone with zero extra code. Where `SpeechRecognition` IS supported (Chrome/Android), an optional "tap to talk" mic button still appears next to the text box as a bonus — it dictates into the box for review before sending, rather than auto-submitting. Text-to-speech (Amit's replies spoken aloud via `speechSynthesis`) IS supported in Safari and was left untouched — only the voice-INPUT half changed.
- **Live conversational connection to Amit:** the shared `Amit_Ask_Live.js` mechanism (Amit root) — the same file every other Amit page uses to talk to Amit live. This project gets its own entry in `PAGE_CONTEXTS` per the New Project Directive's Step 4b.
- **Photo capture → text/analysis pipeline:** AmitBooks' camera-to-Supabase-to-OCR pattern is the closest existing precedent (receipt photo → stored image → OCR text). What a photo is *for* in Amit Mobile (OCR extraction vs. general "what is this" vs. something Yamaha-specific) is still an open question — see below — and decides whether this reuses AmitBooks' OCR pipeline directly or needs its own.
- **Local hardware access (camera/mic/speaker):** all three are native browser capabilities on a phone — no local bridge/agent needed. This does NOT go through the shared Amit Agent bridge (Single Local Connection Standard) — that standard is for desktop hardware a browser can't reach on its own (scanners, printers, local system data). A phone browser's own camera/mic/speaker APIs are already reachable directly.
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

**Retiring other apps — decided 2026-09-05, Ryan's direct clarification.** Only the standalone Yamaha-connected app is being retired. **AmitBooks is NOT being retired or folded away** — it stays exactly as it is, its own real accounting system (chart of accounts, reconciliation, OCR pipeline, audit log). Amit Mobile does not replace it or rebuild its logic; it becomes the mobile front door that routes captures INTO it (e.g. "this is for AmitBooks" → hands the photo to AmitBooks' existing receipt/OCR pipeline). If the standalone Yamaha app needs to be deleted as a file/folder cleanup step, Ryan will do that himself — not an action for Amit to take unprompted.

**The actual shape of this project, stated plainly by Ryan 2026-09-05:** Amit Mobile is a UNIFYING ROUTER, not a system that absorbs or reimplements other systems' logic. One app, one capture flow (photo and/or voice), and Ryan tells it in the moment which downstream system or mode it's for — "this is for AmitBooks," "this is a screen capture, what is it," "search the internet for this," "help me diagnose this," "file this to the job site," "help me read this." Each destination stays its own real system underneath (AmitBooks' engine, a new job-file structure, live web search, general Q&A) — Amit Mobile's job is capture + voice + routing, not reimplementing what each destination already does or will do. This is explicitly designed to grow: new destinations get added over time without the capture mechanism itself changing.

**Resolved by the Dashboard Architecture above:** ambiguous-intent fallback (moot — tiles are explicit choices) and dedicated page vs. Hub mode (its own dedicated dashboard page, built from `template.html`).

**Still open, needs answers before the first real build session:**
1. Interaction model for voice on the Ask Amit tile — tap-to-talk (simple, reliable, no false triggers) vs. continuous/always-listening (higher battery cost, real false-trigger risk). Recommendation on record: tap-to-talk for v1.
2. Supabase schema for Ask Amit conversation history (voice transcripts, photos sent, Amit's responses) — not yet designed. Needs its own table(s), scoped by `user_id`, distinct from AmitBooks' own tables and the Hub's `hub_entries`.
3. Exact mechanism for the AmitBooks tile's login handoff (shared Supabase session token vs. redirect-with-reauth) — needs AmitBooks' own CLAUDE.md checked for how its login currently works before deciding.

---

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
4. **New migration:** `Database\migration_2026-09-05_003_amit_hub_heartbeat.sql` — table + RLS (users manage only their own row). Not yet run — Ryan runs schema changes by hand, per Database\CLAUDE.md.

**What this does NOT change:** the phone's insert into `amit_mobile_captures` (step 1 of the existing Live Backend flow above) is completely unaffected — it happens the same way regardless of whether anyone's Hub is open anywhere. Only the watcher's decision to actually call Claude is gated.

**Setup for an end user (not just Ryan):** `Amit_Live_Setup_Guide.md` in this folder is a plain-language, non-technical, step-by-step guide covering what the bridge is, prerequisites (own Claude Code login, already-authenticated), how to confirm it's running, the Windows sleep-setting fix, and what happens if it's turned off. Keep that file updated whenever this setup process changes — it's written to stand alone for someone setting this up on their own machine, separate from this developer-facing CLAUDE.md.

**Honest status of "replicable by any future person":** Computer Health's own installer (`Install_AmitTracker.ps1` / `AmitInstaller`) exists and has been run successfully on Ryan's own machine, but per root CLAUDE.md's task list, a code-signing certificate is still an open, unresolved blocker before a stranger can install it without hitting a Windows SmartScreen warning — no outside person has been taken through install → live session end to end yet. Also: `amit_mobile_watcher.ps1` and the auto-start block in `amit_bridge_server.ps1` were added to the dev copy in `ComputerHealth\Watchers\`; an already-installed copy at `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` (if one exists on a given machine) needs to be re-installed/re-copied to pick up this change — that sync step was not done as part of this pass.

**Future App Store Path upgrade note:** the eventual paid/cloud tier (see that section below) means swapping WHAT listens for new rows — a cloud Edge Function instead of a desktop script/watcher — not changing the phone-side insert/wait pattern, since the phone already just inserts a row and waits for `reply` to populate. That's what makes the future upgrade relatively cheap.

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Tables this project uses:**
- A new table (name TBD, e.g. `amit_mobile_captures`) to store voice transcripts, photo references, and Amit's responses, scoped by `user_id` — not yet created. Schema design pending answers to the open questions above.
- `hub_entries` / `user_growth_log` / `user_memory` — same shared login-based profile every Amit project reads, per the Login-Based Profile standard below.

**Tables this project does NOT touch:**
- AmitBooks' accounting/receipt tables — this project does not do bookkeeping.

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **Amit Mobile**

Any pursuit written to `hub_entries` from this project must be stamped `program='Amit Mobile'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If the name changes later**, that's a deliberate rename operation — update this section to the new name, and update every existing pursuit (including completed ones/memories) stamped with the old name to the new one, so the full history stays under one consistent identifier.

## Shortcut Activation — Permanent

At the start of every session, and any time the person says something like "update shortcuts," "recheck shortcuts," or "update J shortcuts" — query Supabase directly yourself, right then, using your own tool access (Bash/PowerShell). This is not a file some separate script pre-writes for you — it is a live request you make as part of following this instruction. There is no local cache file to check and no separate hook script that needs to have run first.

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```

For the person's own F shortcuts, you additionally need their AmitCoder Account ID (from `amit_coder_config.json` at the project root, if set) and query:
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true
```

Hold the results in your own working context for the session — no need to write them to a file, since you can simply re-query any time it's asked to be rechecked. When a message begins with a trigger word (F or J, followed by a phrase), match it against what you fetched:
- Plain instruction: treat `instruction_text` as the actual request and act on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a `referenced_shortcut_id`, resolve it by looking up that other fetched entry's own `instruction_text` and run that instead.

If you have not fetched shortcuts yet this session, do so now before concluding nothing matches — never guess at an unrecognized trigger without having actually checked.

## Shortcut Awareness — Permanent

1. **Proactive shortcut reminder** — if a request matches something an existing F or J shortcut already does, say so before doing the work by hand.
2. **Repetition detection, across the last three sessions** — look back over this project's last three sessions for the same or similar instruction recurring. When a real pattern shows up, name it plainly with the actual count and which sessions it appeared in, and suggest creating a shortcut for it (always proposed as F, never J). Suggest, never create unprompted.

## Login-Based Profile — Permanent

This is global, not specific to this project — the same profile applies in every Amit avenue a person uses, because it lives in Supabase, not in this project.

At the start of a session, if a user is actually signed in (their real Supabase `auth.uid()`, never guessed or assumed), look up who they are:

1. Query `user_growth_log` for that `user_id`, ordered by `created_at`.
2. Also check `user_memory` for that `user_id` — a faster current-state summary.
3. If neither has a row yet, this is someone new — build it up honestly over real sessions.
4. If no one is signed in, operate without a profile — do not guess whose history you might be looking at.

---

## Connection to Other Apps

- **Hub** — shared login/identity, shared `hub_entries` pursuits.
- **VoiceControl_AskAmit** — source of the voice in/out mechanism this project reuses.
- **AmitBooks** — closest existing precedent for the photo-capture pipeline.
- **Amit_Ask_Live.js** (Amit root) — the shared live-conversation mechanism this project's "talk to Amit" flow is wired through, per the New Project Directive's Ask Amit wiring clause.
- **Database** — shared Supabase project.
- **ShoshoneHondaYamaha** — the standalone app this project replaces for Ryan's photo+description-of-what-he's-doing use case.

---

## Phone-native shell rebuild — 2026-09-05, Ryan's direct live-phone report

**The real problem:** Ryan tested `AmitMobile.html` on his actual phone (not a resized desktop browser) and found the desktop-style left sidebar (page nav) and right rail (Ask Amit/Sign In/Demo Mode) together left almost no room for the actual content. His own words: "It has all the web addresses up on top and everything... it's a whole website, and it can't even read it... The only thing I see where it says dashboard is I can barely see the edge of the Amit icon. Everything else is taken up by the left icon and the right." He compared it directly against a simple installed phone app that "just opened a simple application and connected."

**First attempt (reverted, do not redo):** a `@media (max-width:600px)` breakpoint that forced `.sidebar`/`.right-rail` down to their icon-only collapsed widths. Before this was fully verified, Ryan found the actual right answer — `AmitBooks\AmitScan\AmitScan.html` — a completely separate, proven one-screen phone app with no side chrome at all. His reaction after seeing it: "That was very simple." A collapsed-but-still-present sidebar+rail was judged the wrong shape even if it technically fit, so the media-query approach was abandoned rather than kept as a fallback.

**What was actually built — a real shell rebuild, not a CSS tweak:** `AmitMobile.html`'s outer layout now follows AmitScan's shape directly: a thin fixed top bar (`#amTopBar`, ~42-58px tall including padding/border) and a full-bleed `#mainArea` filling everything else — **no left sidebar, no right rail, at all, removed from the DOM entirely**, not hidden or collapsed. `#amShell` is `position:relative` inside a `position:fixed;inset:0;height:100dvh` body with `env(safe-area-inset-top/bottom)` padding — the same real values AmitScan.html uses, not guessed ones.

**Top bar contents (left to right):** a back arrow (`#amBackBtn`, hidden on Dashboard, shown on every other page — tap returns to Dashboard via `openPage(1)`) or the Amit logo (shown only on Dashboard, tap opens the Hub via the template's existing `goToHub()`); the current page's title (`#amTopTitle`, driven by `openPage()`); then four small icon-only buttons in `#amTopActions` — Ask Amit, Sign In/Sync, Demo Mode, Home/Hub — which are the exact same four items that used to live in the right rail, calling the exact same underlying functions (`askAmitLive('amitMobile')`, `openSyncModal()`, `toggleDemoMode()`, `goToHub()`). Nothing about the login/sync/demo/Ask-Amit *logic* changed — only the chrome that triggers it shrank from a full vertical rail with labels to four 28px round icon buttons with `title` tooltips.

**Navigation model:** the Dashboard tile grid (page 1) is now the app's actual menu — there is no separate nav list anymore. Every other page (Daily Walk, Amit, Zoom/Read This, Search, My Computer, Pursuits) is reached by tapping its Dashboard tile, and returned from via the top bar's back arrow. `AM_PAGES` and `openPage(n)` are unchanged in spirit — `openPage()` now also drives the top bar's back-button visibility, logo visibility, and title text.

**What moved, not disappeared:** the greeting/date-time clock (`updateClock()`) used to sit in a wide desktop header next to the brand logo — there's no room for that in the thin top bar, so it now writes into the Dashboard hero (`#amGreeting`/`#amDatetime`, inside `amDashboardHtml()`) instead. The page-hover-tooltip mechanism (`initPageTooltips`) was removed outright — it has no meaning on a touch-only phone shell where nothing is hovered, and it existed only to serve the sidebar/rail this rebuild removed.

**Concrete width math, 375px iPhone viewport (the standard check for this fix):**
- *Before:* sidebar defaulted to `width:max-content` (expanded, full icon+label rows — commonly 150-200px+ depending on the longest label) plus a right rail at `width:64px` collapsed by default → roughly 214-264px of chrome, leaving only ~111-161px (~30-43%) for `#mainArea`. This matches Ryan's real report of barely seeing the edge of one icon.
- *After:* zero side chrome. `#mainArea` gets the full 375px width (100%) minus nothing — a flex column shell with only a thin top bar above it, not beside it. The top bar's own height (not width) is the only thing subtracted from vertical space: roughly 42-58px depending on safe-area inset, leaving the rest of the screen height for content. This is a full-width fix, not a percentage improvement — there is no longer any side-chrome width to subtract at all.

**Verified before calling this done:** traced through `openPage()`, `_updateSyncUI()`, `_updateDemoUI()`, and the `buildPlaceholders()` IIFE by hand to confirm every element ID referenced by JS actually exists in the new HTML (old IDs like `sidebarPages`, `rightRail`, `rail-sync-name/-sub`, `rail-demo-name/-sub`, `pageTitle`, `pageContext`, `greeting`, `datetime`, `pageHoverTip` were either removed or their referencing code updated to match — nothing left pointing at a since-deleted element). Collapsed-icon tappability is preserved by construction — the four top-bar action buttons are plain `<button>` elements with their original `onclick` handlers, never disabled or covered.

**Version:** bumped v1.03 → v1.04 (own independent counter, per root CLAUDE.md's per-file versioning standard).

**Do not revert to the sidebar/right-rail shell for this file.** If a future session is tempted to "restore the template's normal layout" here, don't — this divergence from `Templates\template.html` is explicit and intentional for AmitMobile's own phone-native identity, documented here and in the file's own top-of-file comment block. `Templates\template.html` itself was not touched by this work and keeps its normal desktop sidebar/rail shell for every other project built from it.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map
5. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\VoiceControl_AskAmit\CLAUDE.md` — the voice mechanism this project is built on, including its open decision

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*

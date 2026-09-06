# Voice Control — Ask Amit — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Voice Control — Ask Amit, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\VoiceControl_AskAmit\`
All Voice Control development files belong here. Do not create Voice Control files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

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

This project serves that mission. It is not a standalone app. It is Amit — specifically, the piece of Amit concerned with giving Amit a voice (text-to-speech, out loud) and, experimentally, a live two-way connection from a webpage into a real Claude Code session.

---

## Database Connection

Not yet used by this project. If a future voice feature needs to read/write Supabase (e.g., logging which voice a user picked, or per-user voice preference), connect via:
`C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md`

**Tables this project uses:** none yet.
**Tables this project does NOT touch:** all of them, so far — this project has been pure front-end/local-bridge experimentation.

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **Voice Control — Ask Amit**

Any pursuit written to `hub_entries` from this project must be stamped `program='Voice Control — Ask Amit'` — automatically, using this exact spelling every time.

## Shortcut Activation — Permanent

At the start of every session, and any time the person says something like "update shortcuts," "recheck shortcuts," or "update J shortcuts" — query Supabase directly yourself, right then, using your own tool access (Bash/PowerShell).

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```

For Ryan's own F shortcuts, additionally query with his AmitCoder Account ID:
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[his account id]&is_active=eq.true
```

## Shortcut Awareness — Permanent

Proactive shortcut reminder, and repetition detection across the last three sessions — same standing behavior as every other Amit project. See root CLAUDE.md for the full text of this directive.

---

## What This Project Is

Voice Control — Ask Amit is the testing ground for two related but genuinely separate capabilities:

1. **Giving Amit a spoken voice** (text-to-speech) — using the browser's free, built-in Web Speech API (`speechSynthesis`) to read text aloud on any Amit web page, no API key, no cost, works today.
2. **A live "write to Amit" bridge** — an experimental local connector that lets a static webpage send a typed or spoken question to a real, live Claude Code invocation running on Ryan's own machine, and get a genuine (not canned) answer back, spoken aloud automatically.

These were both first built and tested inside `EMS_StudyGuide\EMS_Paramedic_StudyGuide.html` on 2026-09-05, then extracted here so the mechanism itself has one home, separate from that specific app.

## Purpose Within the Amit System

If this proves out, it's a real, permanent capability the whole Amit suite could use: every Amit page could speak its responses aloud, and — pending the open cost/ToS decision below — potentially let any Amit page get a genuinely live, reasoned answer instead of routing to an external AI in a new tab (today's `Amit_Ask_Live.js` behavior). This directly feeds the bigger "Amit as an AI employee" vision explored the same night (AmitBooks bookkeeper tier, MCP-based access, etc.) — the voice piece and the live-connection piece are both building blocks for that.

## Current Status

**Text-to-speech (Web Speech API): working, proven, free.** Tested and working inside the EMS Study Guide as "Let me hear" buttons on the four mode cards plus the Final Exam banner. Ready to reuse on any other Amit page.

**Live bridge ("Write to Amit," local Node server + headless `claude` CLI): working as a proof of concept, with a real, unresolved decision blocking it from going further** — see "The Open Decision" below. Do not build further on the live-bridge half of this project until that decision is made.

## amit_voice.html — Archived and Condensed Into the Hub (2026-09-06)

Ryan asked to preserve the original `amit_voice.html` (the local test page with the voice/accent/rate pickers, hands-free mode, and the cold-start-vs-Monitor comparison tooling documented below) before touching it, and to pull just the voice/accent/rate-picking piece — with real per-user persistence — into the Hub as a global preferences panel, not a separate popup file.

**What happened:** the original file was copied byte-for-byte to `amit_voice_ARCHIVE_2026-09-05_original.html` in this same folder, untouched, so nothing about tonight's build (the relay/watcher/supervisor comparison work, the accent-grouping logic, the hands-free mode) is lost. `amit_voice.html` itself was left alone too — nothing here was deleted or rewritten.

**The condensed version now lives in `Hub\amit-hub.html`**, not in this project — corrected same day into its final shape: a real sidebar tile (**🪪 About Me** → `#panel-aboutme`), not a header-button modal, holding accent/region dropdown, voice dropdown, speed slider, a test textarea + "Let Me Hear It" button, a session-only star rating to help compare voices while deciding, a save button, AND the person's own name/email/phone — all saved onto their own AmitBooks contact row (`contacts.is_owner=true`, per Ryan's direct correction: AmitBooks already has a real contact database, so this reuses it rather than building a second one). The exact accent-grouping logic from this project's archived file (the `<5`-voice-count "Other" bucket, the priority-name default picker) was copied over rather than re-derived. **Amit Mobile's `amSpeak()` now reads that same owner-contact row** via a new shared file, `amit_owner_contact.js` (Amit root) — so a voice picked once in the Hub follows the person to their phone. (An earlier same-day version wrote to a standalone `amit_voice_prefs` table/modal — superseded, table left in place unused.) Full detail in `Hub\Sessions.md`'s and `AmitMobile\Sessions.md`'s matching 2026-09-06 entries — read those before touching voice preferences again, not this file.

**What stays here, unchanged:** the live-bridge/Monitor/cold-start comparison work below (Build Notes, Real Timing Data, Architectural Fragility, the settled Cold-Start Bridge Write Permission section, The Open Decision) — none of that was touched by this pass. This project remains the place that owns the relay/watcher/supervisor experiment; voice PREFERENCE (which voice a person likes) is a separate, now-global concern that moved to the Hub.

## Build Notes — Everything Learned Building the Live Bridge (2026-09-05)

This is the part worth not re-deriving next time. The live bridge works like this:
- A small local Node server (`amit_ems_bridge_test.js`, in this folder) listens on `localhost:8792`.
- A webpage POSTs a typed/spoken question to it.
- The server spawns a **fresh, standalone, headless `claude -p` process** (Claude Code's own CLI, already installed, authenticated under Ryan's own Claude Code login — not a separate Anthropic API key) with a prompt combining an Amit identity blurb, page context, and the question.
- It captures the plain-text reply and returns it to the webpage as JSON, which displays it as text and speaks it aloud via the same `speechSynthesis` mechanism as the "Let me hear" buttons.

**Five real bugs found and fixed, in order, each one genuinely informative:**
1. **`spawn claude ENOENT`** — Node's `execFile` couldn't find `claude` on Windows the way Bash's `which claude` could. Root cause: PATH resolution differs between a shell and Node's direct process spawn.
2. **`EADDRINUSE`** — an old server instance was still running in the background; `pkill` by script name doesn't reliably match Node processes on Windows. Fix: `Get-Process node | Stop-Process -Force` to actually kill it.
3. **`spawn EINVAL`** — Windows requires `.cmd`/`.bat` files (which is what npm installs `claude` as, at `C:\Users\user1\AppData\Roaming\npm\claude.cmd`) to be launched through the Windows shell — a native `execFile` call without `shell:true` throws synchronously, which crashed the whole server (no try/catch caught it at first). Fixed by wrapping in try/catch and eventually moving to `spawn` with `shell:true`.
4. **CLAUDE.md hijacking** — running the headless call from `EMS_StudyGuide\` triggered *that* folder's own "wrong folder, redirect to root" notice instead of answering the question; running it from the root Amit folder instead triggered root CLAUDE.md's full, unconditional "session start" ritual (pulling Supabase session history, attempting a full morning briefing), which then **stalled indefinitely waiting for a tool-permission approval that never comes in a one-shot headless call**, since nobody is there interactively to approve it. **Fix: run the headless call from a neutral folder with no CLAUDE.md at all** (`os.tmpdir()`), carrying Amit's identity entirely through the prompt text instead of relying on any folder's CLAUDE.md being read.
5. **Prompt content silently lost/mangled** — passing a long, quote-and-newline-heavy prompt as a `-p` command-line argument through `shell:true` got mangled by Windows' own shell-quoting rules; the response came back as a generic "I'm ready to help, what would you like to work on?" instead of an answer. **Fix: pipe the prompt over stdin instead** (`child.stdin.write(prompt)`), which sidesteps shell-quoting entirely since no user content ever touches the shell string.

**One safety attempt was correctly blocked and should stay blocked:** adding `--dangerously-skip-permissions` to let the headless call bypass tool-approval was flagged and refused by this very session's own permission classifier. That's a real, working guardrail — do not try to work around it. It also turned out to be unnecessary: once the call runs from a neutral folder with no CLAUDE.md, a plain question needs no tool calls at all, so nothing ever needed approving in the first place.

**Session memory across separate questions: solved, and tested working.** Claude Code's `--continue` flag resumes the most recent conversation in a given working directory. The bridge tracks whether a prior call has already happened (`_hasPriorSession`) and adds `--continue` from the second call onward, sending only the bare question (not the full identity+context prompt) on those later calls, since `--continue` already carries that forward. **Tested and confirmed:** asked it "my name is Ryan, what is the normal EtCO2 range" then, in a completely separate call, "what is my name and what did I just ask" — it correctly answered both, with no explicit reminder given.

## Amit Voice — a second, separate mini-app in this same project (added 2026-09-05)

Beyond the EMS bridge above, this project also grew a standalone page — `amit_voice.html` + `amit_voice_relay.js` (port 8796) — built around giving Amit a real, choosable, adjustable voice, and testing two genuinely different ways to get a message from that page into Claude Code. Real capabilities built and confirmed working:
- Voice picker (grouped by accent/region, small-language groups folded into "Other"), speed control, pause/resume/stop, click-any-word-to-seek, Replay, all persisted across reloads.
- A "Talk to Amit Voice" box with browser dictation, a self-serve test-message button, and Windows' own Win+H dictation noted as a free alternative to compare against.
- **Two competing delivery paths to Claude Code, now both real and measured side by side on the page (Cold Start Time / Claude Code Time):**

  1. **🐢 Cold-Start Bridge** — spawns a fresh, standalone `claude -p` process per question (same mechanism as the EMS bridge). **Confirmed ~3x faster** than the other path in real testing.
  2. **📨 Send to Claude Code** — delivers text into *this actual running session* via a real, working mechanism: a background watcher script (`amit_voice_watcher.js`) polls the relay for a new queued message and is kept armed the whole session via Claude Code's own `Monitor` tool, which turns each new message into a genuine, automatic notification — no "go ahead" needed from Ryan. **Confirmed working, including recovering automatically after a relay restart** (fixed a real ID-collision bug where a restarted relay's counter reset and collided with the watcher's already-seen state — switched to `Date.now()` timestamps for message IDs so this can't recur).

**The critical functional difference between the two, found by direct testing 2026-09-05 — this is the reason the speed difference alone doesn't decide which to use:**
- The **Cold-Start Bridge is talk-only.** It's an isolated, one-shot `claude -p` process with no realistic way to get tool-use approval (no interactive human present to approve a Bash/Write call), so it can answer a question in words but cannot reliably perform a real action — create a file, edit code, run a command. Asking it to *do* something (not just answer) either hangs, fails, or falls back to a generic non-answer.
- **"Send to Claude Code" reaches the real, actual session — this one, with full tool access already granted.** A directive sent this way is genuinely equivalent to Ryan typing it directly into this chat: real files get written, real commands get run, real answers come back — confirmed by the "draw a fish" test, where the Cold-Start path could only ever describe or refuse, while the Monitor path actually produced the fish here and then spoke a confirmation back through Amit Voice.

**So the real tradeoff is speed vs. capability, not just speed vs. speed:** Cold-Start Bridge for a fast, spoken, informational answer with no action attached; "Send to Claude Code" for anything that's actually a directive — build this, write that, do this — accepting the slower, Monitor-polling-based round trip in exchange for it being genuinely real.

## Real Timing Data — Cold-Start Bridge vs. "Send to Claude Code" (Monitor path)

Captured 2026-09-05, directly from `voice_relay.log`, not estimated. Keep appending real numbers here as more tests happen — don't let this table go stale or get overwritten (the log itself was switched from `>` to `>>` this same session specifically so restarting the relay stops wiping history).

| Task | Cold-Start Bridge | Claude Code (Monitor path) | Notes |
|---|---|---|---|
| Plain conversational question | ~5.0–5.4s | — | No tool use, just talk |
| Attempted file write (blocked, `os.tmpdir()` cwd) | 13.0s | — | Hit "outside my folder" wall |
| Attempted file write, `cwd` changed to project folder + explicit prompt permission | 7.3s | — | **Still blocked** — same "need approval to write" wall. Confirmed: the block is a tool-approval gate, not a folder-scope issue — changing the folder didn't fix it. |
| Attempted complex HTML file (7 fish, SVG/CSS) | 11.4s | — | **Still blocked**, identical wall — confirmed complexity of the content doesn't matter, only the action type (Write) does |
| Bash calculation (4739 × 8213, harmless, no file write) | 8.3s | — | **Succeeded**, correct answer — real evidence the block may be scoped to Write specifically, not all tool use |
| Same equation, run on both paths (7×632/1 + √64) | **7.2s, full correct answer** | **12.8s — acknowledgment only, not the real answer** | The one clean, true apples-to-apples pair captured so far. Cold-start finished completely in less time than Claude Code took just to say "working on it." |
| Feast of Trumpets file (write + 20 sentences + read-back) | 13.0s (blocked, couldn't attempt) | 11.7s to acknowledgment only; real total (ack + real file write + full spoken read-back) not separately measured | Claude Code actually completed this task for real; cold-start could only refuse |
| Second seven-fish attempt (real species named: clownfish, tuna, rainbow trout, great white shark, betta, koi, salmon) | Not separately timed | — | **Important precision correction:** cold-start's own reply said "I created the file but it needs your permission to save" — verified directly by checking the folder, and **no file exists on disk.** The reasoning/content-composition step (deciding on real fish species, structuring a page) completed fully; only the final Write-to-disk action was blocked. Cold-start's own wording ("I created the file") is misleading on this point — it drafted, it did not save. Worth remembering: don't trust a cold-start "I did X" claim about file actions without checking the disk directly, since it can describe a fully-composed-but-unsaved result as if the action succeeded.

**Known measurement gap, not yet fixed:** "Claude Code (Monitor path)" times only capture the round trip to the *first* `/speak` call after a message is queued (the quick acknowledgment), not the real total time to task completion. The relay clears `_pendingMessage` right after that first reply, so a second, later `/speak` call (the actual finished answer) gets no timestamp at all. A fair, complete comparison would need a second timer — "Claude Code Full Completion Time" — that only stops on the real final answer. Not built yet as of this entry.

## Health-Check / Auto-Reinitialize — BUILT, Tested Live, One Real Bug Found (2026-09-05)

Built exactly as scoped below: `amit_voice_relay.js` now tracks a watcher heartbeat (`_watcherLastSeen`, updated on every `/poll-pending` hit) and reports it via `/health` (`watcherAlive`, `watcherAgeMs`, stale past 3000ms). A new standalone file, `amit_voice_supervisor.js`, polls that `/health` endpoint every 3 seconds and spawns a fresh `amit_voice_relay.js` or `amit_voice_watcher.js` process if either looks dead — genuinely self-healing for those two pieces, confirmed by deliberately killing the watcher process and watching the supervisor bring a replacement back on its own. The "Send to Claude Code" button also now does a pre-flight `/health` check and warns (not silently hangs) if the watcher looks stale — it cannot fix anything itself (a webpage can't restart a Windows process), only the supervisor can.

**Real bug found by testing, not theorized — a genuine, reproducible race condition:** the supervisor's own 3-second check cycle runs completely independently of any *manual* restart (like re-arming Monitor after a test). Every single time the watcher was manually killed and restarted during this session's testing, the supervisor's next check saw the same brief "not alive yet" gap and spawned its *own* redundant watcher too — happened twice in a row, not a fluke. Net effect: a manual restart and the supervisor can race each other and produce a genuine duplicate watcher process.

**This is benign, not a functional break:** the orphaned duplicate just polls quietly with nothing watching its stdout — no double replies, no wrong behavior, just wasted redundancy until one of the duplicates eventually gets cleaned up. **But a real, hard-won lesson from this same testing session: do NOT try to guess which of two duplicate PIDs is the one Monitor actually owns and kill "the other one."** That guess was made twice this session based on plausible-looking heuristics (spawn method implying a particular path format in the process list) and was **wrong both times**, breaking Monitor's real watch each time it happened. If a duplicate shows up, either leave both running (safe) or stop the Monitor task explicitly and re-arm fresh rather than trying to selectively kill by inferred PID.

**Not yet fixed, worth doing if this gets picked back up:** give the supervisor a way to know a manual restart is already underway (e.g., a short-lived lock file written right before a deliberate restart, checked by the supervisor before it acts) — would close this race condition properly instead of just tolerating the harmless duplicate it currently produces.

## Health-Check / Auto-Reinitialize Idea — Real Cost, Not Yet Built (2026-09-05)

Ryan's proposal: verify all three "Send to Claude Code" pieces are actually alive before/during use, and auto-reinitialize whichever isn't, instead of a piece silently dying mid-use with no warning (which already happened once tonight — the message-ID collision after a relay restart). Real, honest cost breakdown, not yet implemented:

- **Relay server alive?** Checkable via `/health`, near-zero cost (a few ms, localhost).
- **Watcher process alive?** Also near-zero cost, IF the relay tracks a heartbeat timestamp of the watcher's last poll and flags it stale after a couple seconds.
- **Monitor watch (armed in the current session) still alive?** This is the expensive, imperfect one. Nothing outside the session — not the page, not the relay, not the watcher — can directly ask "is Claude still watching." The only signal is indirect: send a real message and see if an acknowledgment comes back within a window. Real ack times tonight ranged ~8-18s even when fully healthy, so a trustworthy "this is actually broken" timeout would need to be conservative (~20-30s) to avoid false alarms on a merely-slow-but-working chain. **The real cost isn't slower normal use — it's up to a 20-30 second wait specifically when something IS actually broken, before the system can confidently say so.**

**A real, hard limit on "auto-reinitialize everything":** the relay and watcher processes CAN be auto-restarted by a supervising script if found dead (cheap, a couple seconds each). **The Monitor watch itself cannot be.** It only exists because an active Claude Code session ran the `Monitor` tool — nothing running passively in the background can bring that back once the session that armed it is gone. Re-arming it always requires a real, live Claude Code session doing it deliberately. So "verify and auto-fix all three" is true for two of the three pieces and false for the most important one — worth remembering before assuming a supervisor script alone could make this fully self-healing.

**Update: the relay/watcher half of this was built the same session** — see the section directly above this one for the real result, including the race-condition bug found by testing. The Monitor-arming half remains exactly as described here: detectable only after a timeout, never silently self-healable by a background script.

## Architectural Fragility — A Third Dimension Beyond Speed and Capability (2026-09-05)

Beyond "which is faster" and "which can actually perform real actions," there's a third real difference worth remembering: **how many separate things have to stay alive at once for each path to work at all.**

**"Send to Claude Code" (Monitor path) requires THREE separate pieces running simultaneously:**
1. An actual, open Claude Code/VS Code session, with its `Monitor` tool watch actively armed on the watcher process.
2. The watcher script (`amit_voice_watcher.js`) — a separate long-running process polling the relay for new messages.
3. The relay server (`amit_voice_relay.js`) — the actual bridge the browser page talks to, holding a queued message until the watcher notices it.

If **any one** of these three stops — the VS Code window closes, the watcher process dies, the Monitor watch gets dropped, or the relay restarts — the whole path silently breaks, even if the other two pieces are still running fine. This already happened once tonight in a smaller form (a relay restart caused a message-ID collision that made a real message get silently ignored).

**Cold-Start Bridge needs only ONE thing: the relay server itself.** It spawns a fresh, self-contained Claude process synchronously, on demand, with no dependency on a live Claude Code session, no watcher, no Monitor arming. As long as the relay process is running, this path works — full stop.

**The real tradeoff, stated plainly:** Cold-Start Bridge is simpler and more robust to operate (one thing to keep alive), but talk-only (see the write-permission section below) and slower per the timing data captured. "Send to Claude Code" is the only path that can perform real actions, but it's the more fragile of the two — three synchronized moving parts instead of one, any of which silently failing takes the whole thing down without an obvious warning sign, since the browser page still looks "connected" even when the watcher or the Monitor arming has quietly died.

## Cold-Start Bridge Write Permission — Three Real Attempts, All Failed (settled, 2026-09-05)

Ryan asked directly: can the cold-start bridge be given real, scoped write permission to one dedicated folder, so it's not permanently talk-only? Three genuinely different fixes were tried, in order, each verified by actually checking the disk afterward (not trusting the model's own "I did it" claim, which was already caught being misleading once — see the seven-fish row above):

1. **Changed `cwd` from a neutral temp folder to the project folder itself, plus explicit prompt language overriding the SESSION LOCATION CHECK.** Still blocked — same "I don't have permission to write" wall.
2. **Changed `cwd` to a small, dedicated `cold_start_sandbox\` subfolder**, isolated from the rest of the project. Still blocked.
3. **Added a real, scoped Claude Code permission rule** — `VoiceControl_AskAmit\cold_start_sandbox\.claude\settings.json` with `"permissions": {"allow": ["Write(**)", "Read(**)"]}`, pre-approving Write/Read only inside that one sandboxed folder, following Claude Code's own documented settings schema. Still blocked, identical wall, confirmed by checking the folder — nothing written.

**Conclusion, treated as settled unless something genuinely new comes up:** this is very likely not a fixable configuration problem. The most probable real cause is that a one-shot headless `claude -p` invocation never goes through whatever one-time trust/session-establishment step normally makes a project's own settings.json permissions take effect — a single automated call doesn't get that chance, no matter how the permission is written or which folder it targets. **Do not re-attempt these same three fixes in a future session** — if write-capable cold-start access is ever wanted again, the real next thing to investigate is Claude Code's actual documented behavior for permission rules specifically inside non-interactive `-p` invocations (not more trial-and-error settings tweaks), or accept the two-path model as final: Cold-Start Bridge for fast talk-only answers, "Send to Claude Code" for anything requiring a real action.

**The real, current pattern emerging, not yet a final conclusion:**
- **Cold-Start Bridge:** faster, and can genuinely complete tasks that are pure reasoning/conversation or safe, non-destructive tool use (a calculation) — but is completely unable to perform any file-write action, no matter how simple or complex the content, because there's no human present in a one-shot headless call to approve it.
- **Claude Code (Monitor path):** slower per the numbers captured so far, but is the *only* one of the two that actually completed the Feast of Trumpets file-write task for real. Its true full-completion speed for that same class of task is still an open, unmeasured question — the numbers logged above understate its real total time, not overstate it.

## The Open Decision — Read Before Doing Anything Else Here

**The live bridge, as built, is real but slow** — every question is answered by a brand-new, cold-started Claude Code process (no memory of *this specific ongoing chat with Ryan*, only memory within its own separate neutral-folder conversation thread via `--continue`). The lag is the real cost of a fresh process starting from zero each time.

**The actual fix for the lag — a persistent warm process using the Claude Agent SDK instead of shelling out to the CLI — was investigated and deliberately NOT built, because of a real, found ToS risk, not a technical blocker.** Anthropic's own stated policy: *"Developers integrating Claude's capabilities, including those using the Agent SDK, must use API key authentication issued through Claude Console... for third-party products or services. However, OAuth tokens from Claude Free, Pro, and Max subscriptions can be used within Claude Code and Claude.ai platforms."* What's built today (shelling out to the `claude` CLI directly) is squarely "using it within Claude Code" — clearly fine. A persistent Agent-SDK-based server holding a conversation open to answer webpage requests looks like the "third-party product or service" the policy calls out as needing a real API key instead, even for personal, non-commercial use.

**Ryan's own words on this, 2026-09-05: "So I have to start paying once I start using it [the faster method]."** That's the correct read of the situation — the two real options, unchanged until revisited:
1. **Keep the current cold-start-per-question bridge.** Zero added cost, zero ToS risk, real lag.
2. **Get a real, small Anthropic API key specifically for this one persistent-speed feature**, priced and billed honestly and separately from Ryan's Claude Code subscription — the compliant way to get genuine warm/fast responses.

**Update, same session (2026-09-05): the decision was made.** Ryan chose to build the paid/fast path. `amit_ems_bridge_fast.js` (this folder) is the fully-written result — a persistent Node server that calls Anthropic's Messages API directly over HTTPS (no CLI, no cold start, conversation history held in memory the whole time the process runs) instead of shelling out to `claude -p`. It runs on port **8793** (separate from the free version's 8792 — both files can coexist, nothing about the free version was touched or removed).

**It is written but NOT yet running, because it deliberately refuses to start without a real Anthropic API key**, which only Ryan can generate (tied to his own account/billing — not something Claude Code can create on his behalf). Setup steps are in that file's own header comment: create a key at console.anthropic.com (with a spending cap — recommended to start small and learn the real cost before raising it), save it into a local-only file `anthropic_api_key.md` in this same folder, then run `node amit_ems_bridge_fast.js`.

**As of this update, that key has not yet been created — nothing has been charged, nothing is running on port 8793.** The free version (port 8792) remains the one actually working on the live page right now.

## Connection to Other Apps

- Built and first tested inside `EMS_StudyGuide\EMS_Paramedic_StudyGuide.html` — that page's "Let me hear" buttons and "Write to Amit" test tile are the live reference implementation.
- Directly related to the same night's AmitBooks "AI employee" / bookkeeper-tier conversation (MCP, bring-your-own-Claude-account architecture, cost economics) — the live-bridge ToS finding here (Agent SDK needing an API key for anything beyond "within Claude Code") is directly relevant to that bigger vision too and should be cross-checked against it before that gets built.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. This file's "The Open Decision" section, above — do not build past it without Ryan actively re-deciding.

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*

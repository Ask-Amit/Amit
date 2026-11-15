# Voice Control - Ask Amit - To-Do and Open Items

Built 2026-11-13 from the old Sessions.md (now in Backups\VoiceControl_AskAmit\Sessions_backup_2026-11-13.md). Only items found in the source; none invented. Dates in [brackets] are the source entry dates where one exists.

## Fast bridge
- Next session: check whether Ryan has created the API key; if yes, store it in anthropic_api_key.md (never commit), start amit_ems_bridge_fast.js and point the page fetch to port 8793; if no, the free version keeps working. [2026-09-05] (also: as of 2026-09-05 no key created, nothing charged, nothing running on port 8793; setup: key at console.anthropic.com with a spending cap, saved in anthropic_api_key.md)

## Resolved (kept so the judgment can be checked)
- The open decision (pay for the API key or not): Ryan chose the paid path in the same-session Update (the Current State block was not rewritten, so the source conflicts; treated as decided). [2026-09-05]


## FROM CLAUDE.md (captured 2026-11-14)

### Health-Check / Auto-Reinitialize Idea — Real Cost, Not Yet Built (2026-09-05) (unsure if finished: written earlier, not re-checked)

Ryan's proposal: verify all three "Send to Claude Code" pieces are actually alive before/during use, and auto-reinitialize whichever isn't, instead of a piece silently dying mid-use with no warning (which already happened once tonight — the message-ID collision after a relay restart). Real, honest cost breakdown, not yet implemented:

- **Relay server alive?** Checkable via `/health`, near-zero cost (a few ms, localhost).
- **Watcher process alive?** Also near-zero cost, IF the relay tracks a heartbeat timestamp of the watcher's last poll and flags it stale after a couple seconds.
- **Monitor watch (armed in the current session) still alive?** This is the expensive, imperfect one. Nothing outside the session — not the page, not the relay, not the watcher — can directly ask "is Claude still watching." The only signal is indirect: send a real message and see if an acknowledgment comes back within a window. Real ack times tonight ranged ~8-18s even when fully healthy, so a trustworthy "this is actually broken" timeout would need to be conservative (~20-30s) to avoid false alarms on a merely-slow-but-working chain. **The real cost isn't slower normal use — it's up to a 20-30 second wait specifically when something IS actually broken, before the system can confidently say so.**

**A real, hard limit on "auto-reinitialize everything":** the relay and watcher processes CAN be auto-restarted by a supervising script if found dead (cheap, a couple seconds each). **The Monitor watch itself cannot be.** It only exists because an active Claude Code session ran the `Monitor` tool — nothing running passively in the background can bring that back once the session that armed it is gone. Re-arming it always requires a real, live Claude Code session doing it deliberately. So "verify and auto-fix all three" is true for two of the three pieces and false for the most important one — worth remembering before assuming a supervisor script alone could make this fully self-healing.

**Update: the relay/watcher half of this was built the same session** — see the section directly above this one for the real result, including the race-condition bug found by testing. The Monitor-arming half remains exactly as described here: detectable only after a timeout, never silently self-healable by a background script.



### Open items mentioned inside status/history sections (unsure if finished)
- **One safety attempt was correctly blocked and should stay blocked:** adding `--dangerously-skip-permissions` to let the headless call bypass tool-approval was flagged and refused by this very session's own permission classifier. That's a real, working guardrail — do not try to work around it. It al ...
- Captured 2026-09-05, directly from `voice_relay.log`, not estimated. Keep appending real numbers here as more tests happen — don't let this table go stale or get overwritten (the log itself was switched from `>` to `>>` this same session specifically so restarting the relay stops wiping history).
- | Attempted file write (blocked, `os.tmpdir()` cwd) | 13.0s | — | Hit "outside my folder" wall |
- | Attempted file write, `cwd` changed to project folder + explicit prompt permission | 7.3s | — | **Still blocked** — same "need approval to write" wall. Confirmed: the block is a tool-approval gate, not a folder-scope issue — changing the folder didn't fix it. |
- | Attempted complex HTML file (7 fish, SVG/CSS) | 11.4s | — | **Still blocked**, identical wall — confirmed complexity of the content doesn't matter, only the action type (Write) does |
- | Feast of Trumpets file (write + 20 sentences + read-back) | 13.0s (blocked, couldn't attempt) | 11.7s to acknowledgment only; real total (ack + real file write + full spoken read-back) not separately measured | Claude Code actually completed this task for real; cold-start could only refuse |
- | Second seven-fish attempt (real species named: clownfish, tuna, rainbow trout, great white shark, betta, koi, salmon) | Not separately timed | — | **Important precision correction:** cold-start's own reply said "I created the file but it needs your permission to save" — verified directly by checki ...
- **Known measurement gap, not yet fixed:** "Claude Code (Monitor path)" times only capture the round trip to the *first* `/speak` call after a message is queued (the quick acknowledgment), not the real total time to task completion. The relay clears `_pendingMessage` right after that first reply, so  ...
- Built exactly as scoped below: `amit_voice_relay.js` now tracks a watcher heartbeat (`_watcherLastSeen`, updated on every `/poll-pending` hit) and reports it via `/health` (`watcherAlive`, `watcherAgeMs`, stale past 3000ms). A new standalone file, `amit_voice_supervisor.js`, polls that `/health` end ...


## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)
- Write a shortcut that stands up the whole Voice Control system (relay + watcher + supervisor + Monitor arm) in one step [PP5] - Write one shortcut that starts relay, watcher, supervisor and Monitor arm together. [hub:b127248c-d9f7-4e46-af46-010782b2bdca]
- Decide whether to build the real chat/history layer for Amit Voice, with per-user Supabase logging [PP5] - Decide whether to build a real chat/history layer for Amit Voice with per-user Supabase logging. [hub:12f8ed76-7b8a-4fe2-aa22-0848aeaddfde]
- Revisit whether the Cold-Start Bridge's fast-but-talk-only path is worth keeping alongside Monitor-based delivery [PP5] - Revisit whether the Cold-Start Bridge's fast-but-talk-only path is worth keeping beside Monitor-based delivery. [hub:58810c57-b61b-4729-a3c8-0e545bf83d38]

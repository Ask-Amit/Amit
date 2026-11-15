# AmitRoll - Sessions ToDo

Every open, pending, not-yet-built or "next" item found in the old Sessions.md (now in Backups\AmitRoll\Sessions_backup_2026-11-13.md) and nowhere else. The [date] is the log entry it came from. Nothing here is invented; where the log does not make clear whether something was finished it says "(unsure if finished)".

## Release
1. Push the local build (everything after v1.02, local v1.03 to v1.25); the tests, notes and the local TemplateViews.html v1.04 edit were never pushed. Waits for Ryan's "push". [2026-10-16, 2026-10-17]

## Players, accounts and tables
2. Create the `Rol_` database tables; progress and experience are in the browser only. [2026-10-15]
3. Real players: friends, groups, open matchmaking at my level / any level / a friend or group, block and report on the game screen, asynchronous play first with live head-to-head designed in. [2026-10-15 later]
4. The shared table: Hearts-style live view for up to eight players, own seat at the bottom, refresh on each press rather than a live connection. A local table dashboard exists; real players need the tables. [2026-10-16 vision, table dashboard]
5. Steal rules (taking points a player missed while you still have time): deferred, "we'll go over the steal". Also watching other players' hands. [2026-10-16 sign keys, 2026-10-15 build 2] (also: needs the solver to prove the miss; needs thought for children)
6. Class tables with leaders and a replay mode for teachers (future stage). [2026-10-15 later] (also: school privacy rules need review before building)
7. The time bonus cannot yet be aimed at a real player. [2026-10-17 time bonus]
8. The "lowest stage at the table" rule (everyone plays the lowest stage present) is decided but not built; today Amit seats play the stage the host picks. [2026-10-17 night later, v1.17]
9. Decide how AmitRoll sits inside Amit Games (move into `Games\` or be linked from a front-door page). [2026-10-15 later] (also: Amit Games is its own HTML page with tabs for AmitRoll formats, dog racing and later games; exact structure not settled)

## Rules still to confirm or decide
10. Wild cards: points, and jokers per deck. [2026-10-15 correction, build 2]
11. Level-relative score display for mixed-level games. [Current State]
12. The scale of experience below first place (built as a straight line; Ryan's "divide by half" would give 7, 3.5, 1.75...). [2026-10-16 first to a target]
13. Whether solo practice should earn a little experience. [2026-10-16 first to a target]
14. Level thresholds 0, 4, 10, 18, 30, 45, 65, 90 are a first guess and need tuning. [2026-10-16]
15. Shorter default target for solo or very slow games (a run to 500 takes 20+ rounds at level 1; about 30 rounds at the later clocks, so the target or clocks need tuning). [2026-10-16, 2026-10-17 v1.16]
16. Matching-dice multiplier is addition-only in later stages; leftover-dice penalty is the sum of unused faces (bigger with ten-sided dice) and may need rescaling. [2026-10-16 stages]
17. Stage clock stretch and Amit's pace per stage are first guesses; the card tops (STAGE_TOPS) could go higher now that the sign is needed once per set, and the odds tables were not re-measured. [2026-10-16 v1.06]
18. Time bonus level shares (the scale) are first guesses; the simulations used the old 4 percent wild rate and a flat 50 percent in places, so the bonus and clock tables should be re-run. [2026-10-17 v1.20, v1.21]
19. How a player rolls just the remaining dice (kept as the bottom-row "Roll N remaining") (unsure if finished). [2026-10-16 Accept final form]
20. Rules Ryan was asked to confirm after the first prototype: a mixed cover such as 5+1+1 on a 7 counts the pair of 1s as a doublet; a bust after a fresh five-dice re-roll still loses the whole turn; a roll that runs out of time with something covered banks, otherwise busts. (Items 4 and 5 of that list, game length and XP formula, were later replaced.) (unsure if finished) [2026-10-15 build]
21. Every round now re-rolls until one card is coverable; easy to switch back if Ryan wants opening busts possible. [2026-10-17 v1.25]
22. The clock-seconds idea (all-signs bonus) is parked; whether the Amit icon (`../amit_icon.png`) reads well at every size. [2026-10-17 v1.10]

## Later stages
23. Learn > Advanced lists future stages, text only: fractions or parentheses first, then exponents and square roots, decimals and percent, algebra (probably its own mode). [2026-10-16 night]

## Naming
24. "Ready, Set, Roll!" is only the spoken start call; the USPTO application found (Serial No. 97138968) status was not verified. [2026-10-16 research]

## Resolved (kept so the judgment can be checked)
- Design agreed 2026-10-15; first playable prototype built.
- Automatic fresh roll tried and reverted; Accept settled as a pop-up next to the cards only when all dice are used. [2026-10-16]
- Cap card numbers at 16 and clock timeout counts only covered cards; chart revised to 9-10-11-...-16. [2026-10-16]
- Level 1 back to nine; first-to-a-target game; experience by finishing place (built). [2026-10-16]
- Stages subtraction, multiplication, division built (v1.03); walk-through and Learn for every stage (v1.04). [2026-10-16]
- Banking rule pushed as v1.02. [2026-10-16]
- Complete & bank blocked while a die rests on an uncovered card (v1.09). [2026-10-17]
- Per-round clock, recalibrated clocks, time bonus and level-based time bonus built. [2026-10-17]
- Practice level picker, hourglass timer, one level track with signs unlocking by level, score penalty (v1.22, v1.24). [2026-10-17]


## FROM CLAUDE.md (captured 2026-11-14)

Open questions listed in CLAUDE.md (some answered later in the same file or in the log; "still open" per its own note: items 1, 2, 4, 5, 6, 7, 8):
Rules and tuning
- Timer pacing: how fast it tightens and what makes a level go up (win streaks, total games, a rating). Gradual recommended. (partly answered by the log's level thresholds and clocks; unsure if finished)
- Multiplier edge cases: five dice on one card, two pairs (4,4,2,2 on a 12), interaction with the leftover-dice penalty; Ryan may want multipliers only when every die matches (6+6+1 on a 13 currently doubles).
- Number range per level (largely answered: tops capped at 16) (unsure if finished).
- Best Play final name (working name; Ryan said it may be called something else, such as "best results").
Players and tables
- Multiplayer shape: same table at once with a lobby code, or separate games with a shared history; turn structure, how a round ends and who wins. (the later design chose asynchronous first with live later; unsure if finished)
- Group size 2-6, default 4: not yet explicitly confirmed by Ryan.
- Amit opponents: building 5-6 Amits before open matchmaking is Ryan's call to look into.
Accounts and legal
- Accounts for children: COPPA (amended rule, compliance date April 22, 2026) applies to under-13 players; recommended design is the parent owns the login and a child is a profile; needs a real review before any child data is collected.
Build
- Sample First: show a skeleton and get Ryan's approval before building a new stage. Build the scoring logic as a plain testable piece (done: engine with tests). Rol_ tables in Supabase need grants in the same migration.
- Subtraction negatives: allowed only at higher levels; not built at the time of that note (unsure if finished: later stages were built, v1.03 onward).


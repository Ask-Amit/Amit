# AmitRoll — Sessions

## Current State

Playable prototype, **PUSHED 2026-10-16 as AmitRoll v1.02** (commit 72a19b2; v1.01 was e9b7678) and live at https://ask-amit.github.io/Amit/AmitRoll/AmitRoll.html . Pushed files: AmitRoll.html, amitroll.css, amitroll_engine.js, amitroll_ui.js, amit_icon.ico (not the tests or the notes). `AmitRoll.html` badge v1.01; script cache numbers v=0.12. Files: `AmitRoll.html`, `amitroll_engine.js` (all rules, 39 passing tests in `amitroll_engine.test.js`), `amitroll_ui.js` (screens), `amitroll.css`. Built: drag-and-drop covers, wild cards, Accept pop-up next to the cards when every die is used, changeable covers, stack of covered cards, self-scoring from level 4, Best Play review, Amit opponents (levels 1–6), Learn walkthrough, challenge links, per-roll clock with the table in the entry "Card numbers and clocks — the chart and the logic" (tops 8-9-10-12-14-15-16-16, timeout banks only covered cards). Progress saved in the browser only; no `Rol_` tables yet; friends/groups/open matchmaking/block-report, class tables for teachers, watching others' hands and stealing missed points are designed but not built. Open: jokers per deck / wild points, rounds per game, level-relative score display for mixed-level games, how Amit Games hosts it (`Games\` folder).

## Log

### 2026-10-15 — Project created
Ryan has a dice-and-card arithmetic game he made about 15 years ago for his daughter, called "Ready, Set, Roll." Everyone who played it said it should reach more kids. Adults play it too. Name settled through J New: "Ready, Set, Roll" was spared (common phrase, says nothing about the math, does not match Amit naming); Ryan chose AmitRoll and "Ready, Set, Roll!" stays as the in-game start call. A web search found no existing AmitRoll app. The dice-cover idea exists in teacher handouts (Dice Dilemmas, Roll and Cover) but none has the stop-or-press-on risk, the matching-dice multiplier, or the fresh-cards sweep. Full rules, the Best Play replay, the beginner help buttons, and the open questions are in CLAUDE.md.

### 2026-10-15 (later) — Design agreed, nothing built
Ryan approved the plan: reuse AmitChat friends and invites (including groups of friends); open games at my level, any level, a friend or a group; block and report on the game screen; no minors-only matching; asynchronous first with live head-to-head designed in now; Learn page skippable at any time; timer per roll, restarting when all dice are used or all cards covered; a win over Amit counts at a very reduced amount; teachers get classes made of tables with leaders and a replay mode (future stage). Full list in CLAUDE.md "Decisions Made 2026-10-15, later in the same session". Next: screen sketch for Ryan's approval (Sample First), then Stage 1 (tested scoring engine, then solo Addition). Open: how AmitRoll sits inside Amit Games (move into `Games\` or be linked from a front-door page).

### 2026-10-15 (build) — First playable prototype, v1.01, NOT pushed
Ryan asked for something playable and "inspire me." Built, locally only: `amitroll_engine.js` (the rules; 20 passing tests in `amitroll_engine.test.js`, including a brute-force check of the best-play solver on 300 random hands), `amitroll.css`, `amitroll_ui.js`, and `AmitRoll.html` v1.01 now loading them. Pages on the left: Play, Learn, Friends & Games, Progress. Play has the felt table with rolling dice, flipping cards, per-roll clock, a risk readout, the 💡 help button, a Best Play review after each round, and games against Amit levels 1–6. Challenge links work with no account (same five cards each round). Progress and XP are saved in this browser only; no database tables yet; friends, groups, open matchmaking and block/report are shown as "next stage." Checked in headless Chrome (a turn played through the real screens, screenshots reviewed); not yet played by a person.
Rules Ryan should confirm (all one-line changes): (1) a mixed cover such as 5+1+1 on a 7 counts the pair of 1s as a doublet and doubles the card (that is how "4+4+2+2 = doublet" was read); (2) after a fresh five-dice re-roll, a bust still loses the whole turn (`sweepBanks` switch in the engine); (3) a roll that runs out of time with something already covered stops and banks, otherwise it busts; (4) game length is 5 rounds; (5) XP per game = score/4 + 5, a quarter of that against Amit.

### 2026-10-15 (correction + wild cards)
Ryan corrected a wrong assumption: everyone is dealt their OWN five cards, not a shared deal. Prototype and notes fixed: challenge links now carry only the level, and Amit plays on its own cards. Ryan also added **wild cards (jokers)**: a wild can rescue a roll that could not cover anything so the player can roll again. Details (what a wild is, how it is dealt, what it scores) recorded as open in CLAUDE.md; not built.

### 2026-10-15 (build 2) — wild cards, Accept, must-keep-covering, dragging; still not pushed
Engine: wild cards dealt among the five cards (any dice, disappears when used), must-keep-covering rule, assist flag per level; 29 passing tests. Screens (amitroll_ui.js v0.02): drag dice onto cards (mouse and touch), dice rest on a card until the total matches, wild staging with Accept, "Accept & roll" and "Complete & bank" buttons, hints only at levels 1–3 and in Practice. Checked in headless Chrome with simulated drags (numeric cover x2 and x3 scored correctly, wild staging and Accept re-rolled all five); screenshots reviewed. Planned and written down: watching other players' hands, stealing missed covers at the same level. Open: wild points, jokers per deck, rounds per game, timeout rule.

### 2026-10-15 (build 3) — self-scoring, changeable covers, stack of covered cards; still not pushed
Engine: uncover(), scorecard (every cover of the turn, survives new deals), multWord (DOUBLED/TRIPLED...), selfScore flag (levels 4+); 34 passing tests. Screens: covered cards stay face-up with number, dice and a DOUBLED/TRIPLED ribbon; tap a die on a provisional cover to take it back off; a stack of little covered cards collects along the bottom for adding up; from level 4 the score numbers hide and the player types their own turn total (Amit checks, two tries, then shows the breakdown); Progress shows adding accuracy. Verified in headless Chrome: drag cover, pull a die off, re-cover, DOUBLED ribbon, complete, add-up prompt, wrong/wrong/breakdown. Cache numbers v=0.04.

### 2026-10-16 — Research: is there already a game called "Ready, Set, Roll"?
Web search (not a legal clearance). Yes, the name is in use: a dice game "Ready Set Roll" by Chuckle & Roar (2–20 players, ages 8+, 40 dice, eBay listing); Hasbro's "Sorry! Diced Game" is listed on eBay with the title "Ready, Set, Roll!"; a USPTO application for READY SET ROLL (Serial No. 97138968, filed Nov 2021, original applicant Buffalo Games, covering board games, dice games, and card-based trivia games) — current status not verified; "Ready, Set, ROLL!" is also a tagline in the arcade app Rolly Hills. No app or math game with that exact name was found. Conclusion: keep AmitRoll as the name; use "Ready, Set, Roll!" only as the spoken start call inside the game.

### 2026-10-16 — automatic fresh roll
Ryan's screenshot showed all five dice used on three cards with nothing happening. Fixed: using the last die (or covering every card) now auto-rolls all five dice again after a 1.5 s pause, covered cards stay covered/locked with their dice, the clock restarts. Verified in headless Chrome (wild with every die -> 5 fresh dice, card still covered and locked, stack still holds it). Cache numbers v=0.05. Not pushed.

### 2026-10-16 (later) — Accept pops up, auto-roll off
Ryan tried the automatic fresh roll and decided the manual Accept was right; asked for the Accept button to pop up when the dice are all used. Built: pulsing gold "Accept & re-roll all 5" button appears in the dice row (or "get 5 new cards & roll all 5" when every card is covered); AUTO_ROLL switch false. Verified in headless Chrome with screenshot. Ryan: "what you gave me works out real good." Cache v=0.06, not pushed.

### 2026-10-16 (revert) — back to the Accept-in-the-row version
Ryan: "go back to the previous version. It worked better." Removed the pop-up Accept button, its styles and the (switched-off) automatic-roll code; banner and Learn wording restored. Verified in headless Chrome: wild with every die -> no pop-up, dice wait; Accept in the row rolls five fresh dice. Cache v=0.07. Not pushed.

### 2026-10-16 (Accept, final form) — pop-up next to the cards, only when all dice are used
From Ryan's screenshot: the bottom-row "Accept & roll 3 remaining" was wrong (with every card covered it actually deals five new cards and rolls all five). Now: special gold Accept pops up in the cards row only when every die is used or every card is covered ("re-roll all 5" / "get 5 new cards"); bottom row has Complete & bank, Help, and a plain "Roll N remaining" for partial rolls. Verified in headless Chrome + screenshot. Cache v=0.08, not pushed. Open question to Ryan: how a player rolls just the remaining dice (kept as the bottom-row "Roll N remaining").

### 2026-10-16 (cap at 16, clock rule)
Applied: card numbers cap at 16 (levels 5 and 8 changed: L5 13->14, L8 18->16); when the clock runs out only covered cards count (new `timeoutStop`), replacing the Amit-finishes-the-covers rule. 38 passing tests. Verified in headless Chrome at level 8: one cover made, clock expired, only that one covered card counted. Cache v=0.09, not pushed. Clock table to equalize the squeeze proposed (see CLAUDE.md), waiting for Ryan.

### 2026-10-16 — Card numbers and clocks: the chart and the logic

> **Revised later the same day:** the "Top card number" column in section 1 and the 9-10-12-13-14-15-16-16 sequence in this entry were replaced by 8-9-10-12-14-15-16-16 (tops that can be made from matching dice). See the entry "Top card numbers now follow 'can be made from matching dice'" below. Everything else here still stands.

**Purpose of this entry:** so that when we come back and review, we can say *this is why and how we came up with these card numbers and clock times*, and change them on purpose, not by guessing. Applied in `amitroll_engine.js` → `LEVELS`. Cache v=0.10. Not pushed.

#### 1. What is in the game now

| Level | Top card number | Lowest card | Clock per roll | Helps per game | Hints (running total, matching glow, risk line) | Who keeps score |
|---|---|---|---|---|---|---|
| 1 | 9 | 1 | none | 5 | yes | Amit |
| 2 | 10 | 1 | 120 s | 5 | yes | Amit |
| 3 | 12 | 1 | 90 s | 4 | yes | Amit |
| 4 | 13 (the king) | 1 | 70 s | 3 | no | the player |
| 5 | 14 | 1 | 55 s | 2 | no | the player |
| 6 | 15 | 2 | 45 s | 1 | no | the player |
| 7 | 16 | 2 | 36 s | 1 | no | the player |
| 8 | 16 | 2 | 30 s | 0 | no | the player |

Rules that go with it: the clock is **per roll** and restarts when all five dice are used or all five cards are covered. **When the clock runs out only the cards already covered count** (minus the dice still unused, as for any bank); nothing is finished for the player; if nothing was covered the turn scores 0. Everyone is dealt their own cards; about 4% of cards are wild.

#### 2. How we got here (Ryan's direction, in order)

1. The original paper game used a deck, Ace = 1 up to King = 13, so the numbers stopped at 13. AmitRoll uses plain numbers, so the range can grow. Ryan: small numbers in the early levels, climbing with the level; "maybe we increase it to 16."
2. Ryan asked for the chance of busting as the top number rises, "all the way down to 31," and asked for **calculated probability, not simulation** (his point: with five dice the most you can make is 30, so a card of 31 can never be covered).
3. Ryan asked where the **expert** level should top out so it is still fun but the expert must **bank more often**, to even things out against a novice who only sees numbers up to 9.
4. Ryan decided: **cap at 16**, and use the **clock** together with the card numbers to level the field: an expert with 30 seconds against a novice's 90 will cover less of what is possible, so will bank more often; they will score more by covering more, but run out of time more; and if time runs out, only covered cards count.
5. Ryan approved the proposed clock table below "for right now … we can make adjustments if we need to."

#### 3. The exact odds (calculated, not simulated)

Method: list all 6^5 = 7,776 equally likely ways five dice can land; for each, list every total that any group of the dice can make (e.g. dice 2,2,5,6,1 can make 1, 2, 3, 4, 5, 6, … up to 16). A card is coverable if its number is one of those totals. Cards are independent, each uniform from 1 to the top number (a wild is always coverable). Then:
- chance one card can be covered = average over the dice outcomes of (number of reachable totals ≤ top) ÷ top;
- chance a roll covers nothing = average over the dice outcomes of [(1 − wild chance) × (top − reachable totals ≤ top) ÷ top] ^ (number of cards).

**3a. First roll of a turn (five dice, five cards):**

| Top | One card coverable | First roll covers nothing (4% wilds) | Same, no wilds | Every card = top |
|---|---|---|---|---|
| 9 | 84.0% | 0.58% | 0.71% | 9.3% |
| 10 | 84.9% | 0.44% | 0.54% | 7.4% |
| 11 | 85.2% | 0.45% | 0.56% | 11.8% |
| 12 | 85.6% | 0.33% | 0.41% | 10.1% |
| 13 | 85.1% | 0.39% | 0.48% | 20.8% |
| 14 | 84.3% | 0.39% | 0.47% | 26.6% |
| 15 | 82.9% | 0.40% | 0.49% | 35.9% |
| 16 | 81.2% | 0.40% | 0.49% | 44.2% |
| 17 | 79.1% | 0.47% | 0.57% | 55.3% |
| 18 | 76.6% | 0.48% | 0.59% | 64.8% |
| 19 | 73.9% | 0.60% | 0.74% | 74.7% |
| 20 | 71.1% | 0.71% | 0.87% | 81.6% |
| 21 | 68.4% | 0.87% | 1.07% | 87.3% |
| 22 | 65.6% | 1.06% | 1.30% | 91.6% |
| 23 | 63.0% | 1.29% | 1.58% | 94.9% |
| 24 | 60.5% | 1.55% | 1.90% | 97.0% |
| 25 | 58.2% | 1.86% | 2.29% | 98.4% |
| 26 | 56.0% | 2.21% | 2.71% | 99.1% |
| 27 | 53.9% | 2.59% | 3.18% | 99.5% |
| 28 | 52.0% | 3.00% | 3.68% | 99.8% |
| 29 | 50.2% | 3.45% | 4.23% | 99.9% |
| 30 | 48.5% | 3.91% | 4.80% | 100.0% |
| 31 | 47.0% | 4.40% | 5.40% | 100.0% |

Reading it: one card's chance of being coverable peaks around 12–13 (about 85%) and then falls steadily. The first roll almost never covers nothing (under 1% up to a top of 21), because with five cards at least one is usually small. "Every card = top" is Ryan's thought experiment: at 31 it is 100% (five 6s only make 30), at 30 about 100%, and it passes 50% at 17.

**3b. A re-roll in the middle of a turn (this is the real pressure):** chance the re-roll covers none of the remaining cards, no wilds, by dice left.

3 cards still to cover:

| Top | 5 dice | 4 dice | 3 dice | 2 dice | 1 die | Average card |
|---|---|---|---|---|---|---|
| 9 | 2.5% | 5.6% | 13.7% | 35.8% | 70.2% | 5.0 |
| 12 | 1.8% | 5.0% | 16.8% | 44.8% | 77.0% | 6.5 |
| 13 | 1.9% | 5.7% | 19.2% | 48.0% | 78.7% | 7.0 |
| 16 | 2.2% | 8.2% | 26.6% | 55.9% | 82.4% | 8.5 |
| 18 | 2.8% | 10.9% | 31.5% | 59.9% | 84.2% | 9.5 |
| 20 | 4.0% | 14.2% | 36.1% | 63.3% | 85.7% | 10.5 |
| 24 | 7.7% | 21.1% | 43.7% | 68.7% | 88.0% | 12.5 |

2 cards still to cover:

| Top | 5 dice | 4 dice | 3 dice | 2 dice | 1 die |
|---|---|---|---|---|---|
| 9 | 5.6% | 11.2% | 24.3% | 49.9% | 79.0% |
| 12 | 4.4% | 11.2% | 29.5% | 58.4% | 84.0% |
| 13 | 4.6% | 12.4% | 32.5% | 61.2% | 85.2% |
| 16 | 5.7% | 17.2% | 40.9% | 67.8% | 87.9% |
| 18 | 7.4% | 21.5% | 45.9% | 71.0% | 89.2% |
| 20 | 10.0% | 26.2% | 50.4% | 73.7% | 90.3% |
| 24 | 16.8% | 34.8% | 57.4% | 77.8% | 91.8% |

#### 4. Why the cap is 16

- At 16, rolling with 3 dice left and 3 cards to cover busts **26.6%**, against **13.7%** at 9: nearly double. That is the "expert must bank sooner" effect Ryan wanted.
- A fresh five-dice roll at 16 still busts only about 2%, so the **start** of a turn feels as good as a novice's. The squeeze is in the middle of a turn.
- Above about 20 it stops being fun: with 2 cards left, a fresh five-dice roll at 20 already busts 10%, at 24 almost 17%.
- 16 was also Ryan's own number. The earlier table ended at 18 at level 8; it now ends at 16 (levels 5 and 8 changed).

*Context from a simulation (not exact — a perfect-play bot, 3,000 turns each, whole turns, 4% wilds):* turns that ended in a bust and average points per turn were 10% / 19.7 at 1–9, 8% / 23.7 at 1–10, 6% / 32.1 at 1–13, 6% / 36.2 at 1–16, 5% / 38.8 at 2–16, 7% / 37.1 at 1–18. Takeaway: bigger numbers do not make a perfect player bust more; they raise the points per cover. Strategy outcomes cannot be calculated in closed form, which is why this one was simulated and the table in section 3 was calculated.

#### 5. Why the clocks are what they are

**What the card numbers alone cannot do:** a bigger card is worth more points (average card 5 at a top of 9, 8.5 at 16 — about 1.7× per cover), so an expert on bigger cards will usually still out-score a novice if raw totals are compared. Ryan accepted this: *"Yes, they're going to score more, by covering more, but they're going to bank more often as well."* The levelling comes from the clock and from matching players by level.

**The rule used for the clock:** **clock ≈ 4 × the seconds a player at that level needs to find and place one cover.** A typical roll offers about 2–3 covers, so 4× leaves some slack: a normal-speed player gets through a roll with a little room; the clock runs out when the position is hard or the player hesitates. Using the same multiple at every level gives every level roughly the same squeeze, so nobody is rushed more than anybody else *relative to their own speed*.

**The assumed seconds per cover (these are GUESSES, not measurements):**

| Level | Top | Assumed seconds to find and place one cover | × 4 = clock | Rounded to |
|---|---|---|---|---|
| 2 | 10 | 25 | 100 | **120** (more room for beginners) |
| 3 | 12 | 20 | 80 | **90** |
| 4 | 13 | 16 | 64 | **70** |
| 5 | 14 | 13 | 52 | **55** |
| 6 | 15 | 11 | 44 | **45** |
| 7 | 16 | 9 | 36 | **36** |
| 8 | 16 | 8 | 32 | **30** (Ryan's expert example: 30 s against a novice's 90) |

Why the clock shrinks more slowly than skill grows: bigger cards take longer to add up (finding 14 from five dice is harder than finding 7), so the seconds-per-cover falls from 25 to 8 (about a third) while the top number nearly doubles. Level 1 has no clock, on purpose.

#### 6. The assumptions to check when we review

1. The seconds-per-cover numbers above were not measured. Everything in section 5 stands on them.
2. "A typical roll offers 2–3 covers" was an estimate.
3. The ×4 slack was a judgment, not derived.
4. The exact odds in section 3 assume cards are uniform from 1 to the top number and independent, no repeated-card rules, and (3a, column 3) 4% wild cards; the wild chance is also a guess awaiting Ryan's number for jokers per deck.
5. Each player is dealt their own cards, so luck differs between players; five rounds per game is also a placeholder.

#### 7. How to tune it (the plan, already built)

The game now records, for every roll in a real game (not Practice with Amit): the level, the seconds to the **first** cover, the **full** roll time (dice settle → Accept / Complete / clock runs out), and whether the clock ran out. It is saved in this browser (`amitroll_profile_v1` → `rolls`: `[level, firstCoverMs, fullRollMs, ranOut]`) and summarized on the **Progress page** under "The level table": rolls recorded, typical (median) roll, the time that **1 roll in 4 takes longer than** (75th percentile), and the percentage of rolls that ran out of time.

**The tuning rule:** set each level's clock at about the **75th-percentile full-roll time** observed for players at that level — one roll in four runs over, the same at every level, by construction. Then the "4× assumed seconds" guess is replaced by real data. Review steps: (1) play or collect at least ~20 rolls per level; (2) read the Progress table; (3) compare "1 in 4 take longer than" with the clock now; (4) where they differ a lot, move the clock toward the observed number; (5) re-check that the share of rolls that run out of time is about the same at every level. When the Rol_ database tables exist this record moves from the browser to the player's login so data from many players can be combined.

#### 8. Open items that touch this

- Does a timeout still subtract the unused dice? (Built: yes, as for any bank.)
- How many jokers per deck / how often a wild appears (built: about 4% per card).
- Whether mixed-level games need a level-relative score display, since a higher level scores more per cover (not decided; Ryan earlier said "the score is the score").
- Rounds per game (built: 5).

### 2026-10-16 (revision, same day) — Top card numbers now follow "can be made from matching dice"

**This revision replaces the card-number column of the chart in the entry above** ("Card numbers and clocks — the chart and the logic"). The clocks, the timeout rule and the tuning plan in that entry are unchanged. Cache v=0.11, 39 passing tests, not pushed.

**Ryan's direction:** level 1 should start at a top card of **8**, and each level's top card should be a number that **can be achieved within one roll as a double, triple or quadruple** — "a 13 would never be able to be achieved … a 12 could, a 14 could, a 15 could, and a 16 could" — so the sequence of top numbers is built from how matching dice can add up.

**How the rule was read (and checked against Ryan's own list):** a number qualifies if one roll can make it using **only matching dice**: a double, a triple or a quadruple of one number (2, 3 or 4 dice), or **two doubles** (e.g. 3+3+4+4), at most 4 dice. Worked out for every number, that rule gives exactly Ryan's list — 13 never; 12, 14, 15, 16 yes:

| Number | Made from matching dice only? | Examples |
|---|---|---|
| 8 | yes | 4+4, 2+2+2+2, 1+1+3+3 |
| 9 | yes | 3+3+3 |
| 10 | yes | 5+5, 1+1+4+4, 2+2+3+3 |
| 11 | never | |
| 12 | yes | 6+6, 4+4+4, 3+3+3+3, 1+1+5+5 |
| 13 | never | |
| 14 | yes (only as two doubles) | 3+3+4+4, 2+2+5+5, 1+1+6+6 |
| 15 | yes | 5+5+5 |
| 16 | yes | 4+4+4+4, 2+2+6+6, 3+3+5+5 |
| 18 | yes | 6+6+6, 3+3+6+6, 4+4+5+5 |
| 5, 7, 17, 19, 21, 23 | never | |

(Also yes: 2, 3, 4, 6, 20, 22, 24. Never as a top: any number that is an odd prime-like value such as 5, 7, 11, 13, 17.) Because 5, 7, 11 and 13 are skipped, the tops go 8 → 9 → 10 → 12 → 14 → 15 → 16.

**The new chart (applied in `LEVELS`):**

| Level | Top card | A top card made from matching dice, e.g. | Chance one five-dice roll offers it that way (exact) | Clock per roll |
|---|---|---|---|---|
| 1 | 8 | 4+4 | 21.8% | none |
| 2 | 9 | 3+3+3 | 3.5% | 120 s |
| 3 | 10 | 5+5 | 23.2% | 90 s |
| 4 | 12 | 6+6 | 26.9% | 70 s |
| 5 | 14 | 3+3+4+4 | 5.4% | 55 s |
| 6 | 15 | 5+5+5 | 3.5% | 45 s |
| 7 | 16 | 4+4+4+4 | 3.9% | 36 s |
| 8 | 16 | 4+4+4+4 | 3.9% | 30 s |

(For comparison: 13 = 0.0%, 18 = 7.0%.) The "chance a roll offers it" column is calculated by listing all 7,776 five-dice outcomes and checking whether any group of matching dice (as defined above) adds to that number. It shows doubling the top card is a real but modest chance each roll, not a freebie.

**The deck still holds every number from the lowest card to the top**, so at a top of 14 a 13 can still be dealt — it simply cannot be made from matching dice only.

**Exact odds for the new level-1 top of 8** (same method as the entry above): one card coverable 83.2%; first roll covers nothing 0.61% (4% wilds); a re-roll with 3 cards left busts 2.7% with 5 dice, 5.7% with 4, 12.9% with 3, 32.7% with 2, 67.0% with 1.

**Things to review / confirm with Ryan:**
1. **How scoring treats a "double with extras".** The engine's multiplier is the largest group of identical dice in a cover, so **6+6+1 on a 13 IS doubled (26 points)** even though 13 cannot be made from matching dice only. The new top-number rule is about which numbers are *natural* doubles/triples; the scoring rule is unchanged. If Ryan wants multipliers only when **every** die in the cover matches (so 13 can never be doubled), that is a one-line change in `multiplier()` — not decided.
2. The "at most 4 dice, no double-plus-triple" limit is a reading of Ryan's list. Allowing a double plus a triple (5 dice) would let 13 = 5+5+1+1+1; Ryan's list excludes 13, so that format was left out.
3. The assumed seconds-per-cover table for the clocks (previous entry) was written for the old tops; the differences are small (levels 2–4 are 1–2 lower, level 1 is 1 lower) and the clocks were left as they were.
4. Level 1 now tops out at 8, which also means the "Practice at level 1" start is slightly easier than before (exact odds above).

### 2026-10-16 — Practice page, Learn as multi-row tabs, and the stages beyond addition (Ryan's vision + Amit's suggestions)

**Built now (cache v=0.12, 39 passing tests, not pushed):**
- The left page called **Play** is now **Practice** ("that's what that is"). The words "practice" and "tutorial" were sorted out so they don't collide: the level picker says "Try level N", the Amit-shows-every-play turn is the "tutorial"/"walk through a turn with Amit".
- **Learn** is now a **Multi-Row Tab View** (copied verbatim from `Templates\TemplateViews.html` v1.04 into `AmitRoll.html`, sample tabs left out), with tabs **Addition | Subtraction | Multiplication | Division | Advanced**. Addition holds the existing step-by-step walkthrough. The other four are labelled "COMING — not built yet" and describe the plan. Ryan: "We're probably going to be changing all of them to a multi-tab format anyways" — so tab strips elsewhere in AmitRoll should use this layout.

**Ryan's vision for the stages (his words, summarised):**
- **Subtraction:** dice go up to **10**; **every cover must contain a subtraction** (e.g. 10 − 1 + 1); plus and minus may be mixed; it needs a **new table format** to build a cover.
- **Multiplication:** same premise (dice up to 10, every cover must contain a multiplication); the **card values go up tremendously**, which makes it harder.
- **Division:** every cover must contain a division; the card values probably **come back down** again.
- **Advanced:** not described yet.
- The novice → expert levels would apply inside each stage. "That way they can see how it would work" in the learning process.

**Exact odds calculated to help size the card numbers** (all exact enumerations, 5 dice with faces 1–10, cards uniform from 1 to the top; "one card coverable" = chance a random card can be made by some cover that obeys the stage's required operation):

| Stage (assumed rule) | Top card | One card coverable |
|---|---|---|
| Subtraction (signed sum of 2+ dice, each die + or −, at least one −) | 5 / 8 / 10 / 12 | 96.6% / 96.8% / 96.4% / 95.7% |
| | 15 / 18 / 20 | 93.4% / 89.2% / 85.3% |
| | 25 / 30 / 35 | 73.9% / 62.9% / 54.1% |
| Multiplication (terms are products of dice, + / − allowed, at least one real ×) | 10 / 20 / 30 / 40 | 86.9% / 87.6% / 87.3% / 86.5% |
| | 50 / 60 / 70 / 80 | 85.0% / 83.0% / 80.6% / 77.9% |
| | 100 / 120 / 150 | 71.5% / 64.4% / 55.3% |

Largest top that still leaves at least 85% / 80% / 70% / 60% coverable: **subtraction 20 / 22 / 26 / 31; multiplication 49 / 72 / 103 / 133.** For comparison the addition design sits at about 83% (novice, top 8) and 81% (expert, top 16).
**Division:** a five-dice roll with faces 1–10 contains at least one exact division of one die by another **99.5%** of the time, so "every cover must include a division" is satisfiable almost every roll; card tops depend on the exact rule (not yet calculated).

**What the numbers mean:** in subtraction a top of 8–12 would be far too easy (96%); the ladder should start around 12–15 and reach about 22 (80%) to 26 (70%). In multiplication the card numbers really do have to climb "tremendously", to roughly 40 at the start and 70–100 at the top, to keep the same feel. This confirms Ryan's instinct that card values rise for multiplication and fall back for division.

**Amit's suggestions (for Ryan's decision — none built):**
1. Keep Ryan's central rule: **every cover must use the stage's operation.** It makes each stage practice exactly that operation.
2. **Each stage gets its own 8-level ladder** (card range, clock, hints, helps), starting at level 1 in that stage; unlock the next stage by reaching a set level in the previous one (e.g. level 4 or 5), while the Learn tab stays readable.
3. **Dice faces:** d6 for addition, **d10 (1–10, no zero)** for later stages; d10 faces must show numerals, not pips.
4. **Subtraction builder:** give each card two zones, a **+ pile** and a **− pile** (take away); result = pile one minus pile two, at least one die in the − pile. Avoids negative intermediate numbers and is easy for children.
5. **Order of operations:** Subtraction uses only + and − (no precedence issue). Multiplication introduces ×; show the evaluated expression after a cover and use true order of operations (× before + / −). Division requires **whole-number results**. **Advanced** = all four mixed, with parentheses.
6. **Scoring rules that need a new decision per stage:** (a) the **matching-dice multiplier** was designed for addition (5−5 = 0 breaks it); (b) the **leftover-dice penalty** subtracts face values, which with d10 averages 5.5 per die (up to 50) against cards of ~20 in subtraction, so it must be rescaled (e.g. a fixed amount per unused die).
7. **Build order:** Subtraction first (same signed-sum structure, simplest), then Multiplication, then Division; leave Advanced until the first three have been played.
8. **The engine becomes stage-aware:** dice faces, allowed operations, required operation, card range, penalty rule are parameters of a stage; the Best Play solver, the risk line and the Amit opponents each need the stage's enumeration (the calculations above already use it). Database: `Rol_` tables need a `stage` column and per-stage level.

### 2026-10-16 (push + subtraction rule) — v1.01 live
Ryan: "let me see what it looks like. Go ahead and push it." Pushed **AmitRoll v1.01** (commit e9b7678): AmitRoll.html, amitroll.css, amitroll_engine.js, amitroll_ui.js (script cache v=0.12). All five files return 200 on GitHub Pages; the live page renders with Practice / Learn / Friends & Games / Progress and the Ready, Set, Roll! start screen. Progress is still saved in each browser only. Not pushed: the tests, these notes, and the local TemplateViews.html v1.04 edit.
**Ryan's subtraction rule (recorded, not built):** negative numbers are fine in subtraction, but only at **higher levels** — at lower levels there are no negatives along the way (the two-pile "add pile minus take-away pile" builder suggested above); at higher levels a player can go negative and then add other dice to land on the card.

### 2026-10-16 (banking) — covering all five cards banks the set
Ryan: once you cover all five cards that value is always banked; only the next set can be lost; the next set can go negative from leftover dice but you never lose the banked points. Built (local, not pushed; cache v=0.13): cover-all-five now banks (`cardSweepBanks`, default true; bust scores `st.safe` instead of 0; undo of the last cover undoes the bank); using up all five dice still does not bank; bust sheet says "You keep the N points you banked by covering all five cards"; Learn text updated; 4 new tests (43 passing). **Confirmed by Ryan ("You got that right"):** the leftover-dice penalty still applies when you stop in the next set, so that stop can end below the banked amount; only a bust is protected.

### 2026-10-16 (push v1.02) — banking rule live
Ryan: "push it, and then give me the link." Pushed **AmitRoll v1.02** (commit 72a19b2): covering all five cards banks the set; bust keeps banked points; Learn and bust-sheet wording. Files pushed: AmitRoll.html, amitroll_engine.js, amitroll_ui.js (amitroll.css unchanged since v1.01). Verified live: page badge v1.02, engine contains the banking rule, all five files 200. Cache v=0.13. Link: https://ask-amit.github.io/Amit/AmitRoll/AmitRoll.html

### 2026-10-16 (vision) — The shared table: a Hearts-style live view for games with other players
Ryan (with a picture of an online Hearts table): when playing against other people, Amit, or the computer, he wants an **interactive dashboard: the player's own seat is always at the bottom, whoever that player is, and everyone else sits around them** (as in four-player Hearts), in the Ready, Set, Roll theme: each seat shows that player's **five cards, with their dice in front of them** when they roll, so everyone can **see how the others are playing their numbers**. If a player misses a cover, others can **steal the points**: when a player says they're done, or their timer runs out, and you still have time left on your own timer, you can say "if you had put these two dice on that card you'd have covered it", do it, and **steal those points** from them. Everyone sees it **simultaneously on their own computer** (five computers = five live views). **Practice rounds stay as they are.**
Not built yet; options and questions are in the entry that follows once Ryan has answered. Earlier notes already planned: watching other players' hands once you are done, and stealing missed covers between same-level players.

### 2026-10-16 (sign keys) — + − × ÷ on the table, and the sticky-sign way of building a cover
**Ryan's direction:** the four signs belong **on the screen next to the cards**, not as stage titles at the top of the page. In addition (arithmetic) only **+** is lit; the other signs are shown but cannot be used. In subtraction **+ and −** are lit; multiplication **+, − and ×**; division all four. A player builds a cover by pressing dice and signs — e.g. a die, the + sign, the next die; or a die, a × sign, another die; with × a player can also use minus "to get another card". Order of operations is **"My Dear Aunt Sally": multiplication and division first, then addition and subtraction.** **Sticky signs:** press **+** then dice 2, 3 and 5 and that means 2 + 3 + 5; press **−** and every die after it is a minus until the player presses + (or × or ÷) again — "the current identification can be used over multiple dice quickly." The steal rules are being deferred: "we'll go over the steal."
**Built now (cache v=0.14, local, not pushed; the next push would be v1.03):** the four stage titles are gone from the top of the Practice page (the level bar stays); the four sign keys (+ − × ÷) sit in a 2×2 block on the table to the left of the cards, with **+ lit and − × ÷ dimmed** ("not used until a later stage"); the start panel shows the same keys with the line "This stage uses: Addition". They are display only for now; addition play is unchanged. `STAGE_OPS` in amitroll_ui.js lists which signs each stage lights.
**Design proposed for the sign-based cover builder (not built, awaiting Ryan):** the lit sign you pressed is the current sign (each cover starts on +); tapping or dragging a die adds it under the current sign, so the cover reads like 2 + 3 + 5 − 4; × and ÷ bind first (true order of operations), shown as a worked line after a cover (2 + 3 × 4 → 2 + 12 = 14); division must come out a whole number and never by zero; the built expression is checked against the card when dropped on it, and a cover must contain at least one of the stage's required operation; a negative first term (pressing − before the first die) only at higher levels, per Ryan.

### 2026-10-16 (table dashboard + Clear key + Amit's level rule) — built locally, cache v=0.18, not pushed (next push would be v1.03)
**Ryan's directions:** (1) add a **Clear** key by the four signs so a player can start over after pressing a lot; (2) build the **dashboard for up to eight players at once**, each tracked by login and level, with the player's own seat at the bottom; (3) **no real-time connection** — refresh the screen when someone presses a sign, a card or a die, to use less memory ("that's the right way to do it, right?"); (4) **anyone can add Amit; Amit always plays at the LOWEST level of the people at the table and is restricted by time too** — "come up with some sort of algorithm."
**Built:**
- **Clear key** under the signs (CLEAR): takes back every die that is picked or resting on a card but not yet a finished cover. It does not undo a finished (but not yet accepted) cover; tapping its dice does that.
- **The table** (Practice page, "Players" picker = Just me, or Me + 1 to 7 Amits = up to 8 players): my table is the existing one at the bottom with a "YOU · LEVEL n" caption; the Amit seats sit around it (layouts for 1 to 7 others: left / top / right), each showing its five cards (covered ones green with the dice used and ×N badge), its dice, a countdown of its own clock, its round result and its total. Amit seats play their turns visibly, a move at a time. When I finish a round the round sheet shows the whole table's scores and the Next button waits for the Amits to finish (they speed up once I am done). Game over ranks everyone; XP against Amit seats is a quarter of the usual. Practice/solo play is unchanged. Tested in a real browser: 4 players and 8 players, all five rounds, no errors.
- **Amit's level algorithm** (engine: `amitLevelFor`, `botPlan`, `botApply`, `amitCost`, `amitTurn`; LEVELS gained `amitSecs` and `amitSkill`): Amit's level = the **lowest level among the human players** (today, the level the player is playing at; with several players pass every human's level). His **skill** (how often he spots the best cover; how well he judges roll vs bank) rises with that level: 0.30, 0.42, 0.54, 0.66, 0.77, 0.86, 0.93, 0.98 for levels 1–8 (each Amit seat gets a small random variation of about ±0.04 and a pace of 0.9–1.1). His **time**: each move costs seconds out of the roll's clock = the level's "seconds to find and place one cover" (30, 25, 20, 16, 13, 11, 9, 8; the same assumed figures the clocks were built from) × a factor for the move (a cover 0.7 + 0.25 per die, a roll 0.4, a wild or stop 0.5) × random 0.75–1.25. If a move would take him past the clock he **banks only what is covered**, exactly as a person. A new roll resets his clock. On screen his clock runs 6× faster than real time so a game does not drag. There is no Amit-level picker any more; the start panel says Amit plays at the lowest level at the table.
- **What Amit scores by level** (400 turns each, from the test): level 1: 13.8 per turn, 0% clock ran out, 18% bust; L2: 18.5, 0%, 14%; L3: 19.6, 1%, 13%; L4: 23.7, 2%, 9%; L5: 31.5, 1%, 8%; L6: 33.9, 1%, 6%; L7: 34.8, 2%, 5%; L8: 37.4, 6%, 4%. His clock almost never binds, which is what the "clock = 4× the assumed time per cover" design predicts; real players' times will show whether the assumed seconds are right.
**Answer given to Ryan on refreshing instead of real time:** refresh-on-action is a sound first version — simpler, cheaper, easier to test — but a viewer who is not pressing anything would see a frozen table, so the plan is: each client writes only its own seat's state when it acts, and every client re-reads all seats on its own action AND every ~3 seconds while a game is open (one small read). Clocks are stored once as an end-time and counted down locally by every screen, so nothing updates every second. A live connection costs very little memory; the reasons for not using one are simplicity and server limits, and it can be added later if a 3-second delay makes stealing feel slow. Not built: real players, login-tracked seats, invites — they need the Rol_ database tables (a game row, one row per seat, grants and access rules; a migration for Ryan to run), the friends/invites from AmitChat, and the steal rules Ryan deferred ("we'll go over the steal").

### 2026-10-16 (first to a target, experience by finishing place, level 1 back to nine) — built locally, cache v=0.19, not pushed (next push would be v1.03)
**Ryan's directions:**
1. **A game is not five rounds.** It ends when someone reaches a target score first — "we've been playing at 500," so it may take 20 rounds or 5.
2. **Experience by finishing place, scaled by how many players:** first place earns one point for every opponent beaten — against one person, 1; against seven, 7 — and lower places scale down ("if there are three players, then we can divide that total by half and use some sort of scaling system"). Nothing for coming second of two. Logged against the player's account; reaching the next level's experience moves them up.
3. **Level one goes to nine.** ("I notice in the practice rounds that it only goes up to number six. I thought we decided that it goes always up to number nine is where it starts from… Bring pull out that chart. And adjust the numbers accordingly.")
**What was found about the "six":** level 1's top card had been set to **8** (Ryan asked for eight earlier the same day), and with five random cards from 1–8 all five come out 6 or lower **24%** of the time (13% with 1–9), so the deal he saw was most likely luck. The dice only go to six in addition by design (ten-sided dice come in the later stages).
**Built:**
- **First to the target.** A "Play to" picker (100 / 250 / 500 points, default 500) on the Practice start screen. The round counter no longer says "of 5"; the table shows the target; after every round (once all players have finished it) the game checks whether anyone has reached the target; the most points wins. Solo games also play to the target (a solo run to 500 at level 1 takes about 20+ rounds; pick 100 for a short one). For challenge links the comparison is now **how many rounds it took to reach the target**.
- **Experience** (engine `placeXp(place, nPlayers, factor)`): experience = (players − place) × factor. 2 players: 1 and 0; 3 players: 2, 1, 0; 8 players: 7, 6, 5, 4, 3, 2, 1, 0. **Beating Amit counts at a quarter** (factor 0.25, Ryan's earlier "very reduced amount"), so a win at a four-player Amit table is worth 0.75. **Solo play earns nothing** (no opponents), and **trying a different level earns nothing**. Ties share the better place. Shown on the game-over screen ("2nd of 2 — +0 experience") and in Recent games (place of N).
- **Level thresholds** (experience needed, first guess): 0, 4, 10, 18, 30, 45, 65, 90 for levels 1–8 — chosen so level 2 takes about five wins at a four-player Amit table; they will need tuning. Experience now shows to two decimals ("4 experience to level 2").
- **Old experience is not carried over:** the earlier points came from a different formula (score ÷ 4 + 5 per game), so profiles saved before this change start again at 0 experience (`xpUnit: 2` marker).
**The chart now** (replaces the card-number column of the two earlier chart entries):

| Level | Top card | Lowest card | Clock per roll | Experience needed | Helps per game | Hints | Who keeps score |
|---|---|---|---|---|---|---|---|
| 1 | 9 | 1 | none | 0 | 5 | yes | Amit |
| 2 | 10 | 1 | 120 s | 4 | 5 | yes | Amit |
| 3 | 12 | 1 | 90 s | 10 | 4 | yes | Amit |
| 4 | 14 | 1 | 70 s | 18 | 3 | no | the player |
| 5 | 15 | 1 | 55 s | 30 | 2 | no | the player |
| 6 | 16 | 2 | 45 s | 45 | 1 | no | the player |
| 7 | 16 | 2 | 36 s | 65 | 1 | no | the player |
| 8 | 16 | 2 | 30 s | 90 | 0 | no | the player |

Level 1 is back to **9** and the rest shifted up one step so each top is still a number that can be made from matching dice (9 = 3+3+3, 10 = 5+5, 12 = 6+6, 14 = 3+3+4+4, 15 = 5+5+5, 16 = 4+4+4+4). Because the cap is 16, levels 6, 7 and 8 now share a top of 16 and differ by clock, hints, helps and the lowest card (2). The clock table and Amit's pace were not changed.
**Open / to confirm with Ryan:** (a) the scale below first place — built as a straight line (each place one less than the one above), so second of eight earns 6; Ryan's "divide by half" would give 7, 3.5, 1.75…; (b) whether solo practice should earn a little experience; (c) the thresholds; (d) whether a game that nobody can finish quickly at level 1 needs a shorter default target for solo.

## 2026-10-16 — Stages: subtraction, multiplication, division (built locally as v1.03, not pushed)
**Ryan's directions:** addition card tops climb 9,10,11…16 whether or not matching dice can make them; subtraction, multiplication and division stages; Practice lets the player pick the stage and each stage turns on its own signs plus every earlier stage's (subtraction → + −, multiplication → + − ×, division → all four); sign keys beside the cards that **stick** (press a sign, then dice, until another is pressed), a Clear key, × ÷ before + − ("My Dear Aunt Sally"); dice go to 10; every cover must contain the stage's own sign; negatives only at higher levels; the solver should be simple: try expressions with the same evaluator and see if the result matches.
**Built:**
- Engine: `STAGES`, `STAGE_TOPS`, `STAGE_PACE`, `rulesFor/levelsFor`, `evalItems`, brute-force `stageSets/stageExpr` (same evaluator as the game, per Ryan), stage-aware `tryCover`, `bestPlan`, `rollOutlook`, bot plans and Amit's cost. 57 node tests pass.
- Card tops: addition 9–16; subtraction 12,14,…,26; multiplication 30,40,…,100; division 24,28,32,36,40,44,50,60. Chosen from exact odds with five d10 dice so each level's top card can be covered about 70–95% of first rolls (subtraction 12→95.7%, 26→71.6%; multiplication 30→87.3%, 100→71.5%; division 24→94.6%, 60→70.2%).
- Stage pace (`STAGE_PACE`, first guess): clocks and Amit's speed stretch 1 / 1.3 / 1.6 / 1.8 for addition / subtraction / multiplication / division.
- Negatives: levels 1–4 the running total may not dip below zero and a cover starts with +; from level 5 both are allowed.
- UI: stage buttons on the Practice start panel; clickable sign keys with sticky sign and Clear; numeral dice (1–10) in later stages; a sign badge on picked dice and small signs between dice on a card; expression line (and its value when hints are on); experience and levels kept per stage (`P.xps`); Learn tabs for Subtraction, Multiplication, Division; Progress shows a per-stage table; challenge links carry `&stage=`; Amit seats play the chosen stage. The tutorial stays addition.
- Tested in headless Chrome: for every stage at levels 3 and 6 the solver found a cover and it was made through real sign-key and die clicks, no script errors; one screenshot reviewed.
**Open / to confirm with Ryan:** matching-dice multiplier is addition-only in later stages; leftover-dice penalty is the sum of unused faces (bigger with d10); stage clock stretch and Amit pace; the scale below first place; steal rules; real players and Rol_ tables.

/* AmitRoll scoring engine — v0.01
 *
 * Pure rules, no screen, no network. The browser page and the node tests
 * (amitroll_engine.test.js) both load this one file, so what the tests prove
 * is what the game does.
 *
 * THE RULES AS RYAN DESCRIBED THEM (2026-10-15):
 *  - A turn starts with 5 number cards (targets) and 5 dice, all rolled.
 *  - Dice whose values add up to a card's value COVER that card. A cover
 *    scores card value x multiplier. Multiplier = the largest group of
 *    identical dice used in that cover (4+4 on an 8 = x2 = 16; 4+4+4 on a 12
 *    = x3 = 36; 3+5 on an 8 = x1 = 8; 4+4+2+2 on a 12 = largest group is two
 *    4s = x2 = 24 — Ryan's "doublet", 2026-10-15, to be tuned).
 *  - Covering at least one card in a roll lets you re-roll the dice you did
 *    not use, or stop and bank.
 *  - If a roll cannot cover any card, that is a BUST: the turn's points are
 *    lost (turn score 0).
 *  - Using up all the dice -> re-roll all five (points kept).
 *  - Covering all the cards -> five new cards and all five dice re-rolled.
 *  - Stopping: turn score = points covered - the total of the dice left
 *    unused.
 *
 * COVERS ARE CHANGEABLE UNTIL YOU ACCEPT (Ryan, 2026-10-15): a cover made in
 * the current roll can be taken back (uncover) - the dice become active again
 * and the player can build a better cover, e.g. two 2s (doubled) instead of a
 * 1 and a 3. Once the player rolls again (Accept) or stops, covers are locked.
 * st.scorecard lists every cover of the turn, in order, and survives the five
 * cards being replaced, so a player can add up the whole turn.
 *
 * WHEN THE CLOCK RUNS OUT (Ryan, 2026-10-16): only the cards already covered count. Nothing is covered for the
 * player; their covered cards are banked (minus the dice still unused, as for any bank). If nothing was covered at
 * all this turn, the turn scores 0. See timeoutStop().
 *
 * MUST KEEP COVERING (Ryan, 2026-10-15): while any number card can still be
 * covered by the dice you have left, you must keep covering. You cannot roll
 * again or stop until no number card can be covered. A wild is optional:
 * using it is always your choice.
 *
 * WILD CARDS (Ryan, 2026-10-15): a wild is dealt as one of the five cards
 * (value 'W'). ANY dice, one or all of them, can go on it; it is covered at
 * once and disappears, and it counts as a card toward clearing the table. A
 * wild is never a bust: while one is uncovered and a die is available, a roll
 * can always cover something. It scores rules.wildPoints (default 0 - NOT yet
 * confirmed by Ryan; with 0 it is an escape that also dumps leftover dice).
 *
 * COVERING ALL FIVE CARDS BANKS THEM (Ryan, 2026-10-16): once every card is covered, those points are safe for good -
 * a later bust can only take what was earned after the new cards were dealt (the bust scores the banked amount, not 0).
 * What is still at risk is only the current set. The leftover-dice penalty is unchanged and can still make a stop negative.
 * If the last cover is taken back (uncover) before the player rolls, the bank is undone with it.
 * Using up all five DICE does not bank (rules.sweepBanks, default false): a bust after a fresh five-dice re-roll
 * still loses the points of the current set, like "hot dice" in Farkle.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AmitRollEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_RULES = { diceCount: 5, cardCount: 5, sweepBanks: false, cardSweepBanks: true, wildPoints: 0, wildChance: 0.04 };

  // CLOCKS (2026-10-16): each clock is about 4x the ASSUMED seconds a player at that level needs to find and place one cover
  // (L2 25s, L3 20s, L4 16s, L5 13s, L6 11s, L7 9s, L8 8s - guesses, not measured). Full reasoning and the tuning rule are in
  // Sessions.md, entry "Card numbers and clocks - the chart and the logic". The game records real roll times so these can be tuned.
  // TOP CARD NUMBERS (Ryan, 2026-10-16, revised same day): 8, 9, 10, 12, 14, 15, 16, 16 - capped at 16. Each top number is one that can be made in a
  // single roll from MATCHING dice only (a double, triple or quadruple, or two doubles): 8=4+4, 9=3+3+3, 10=5+5, 12=6+6, 14=3+3+4+4,
  // 15=5+5+5, 16=4+4+4+4. Numbers that can never be made that way (5, 7, 11, 13, 17...) are skipped as tops. The deck still
  // contains every number from the lowest card to the top, so a 13 can appear at a top of 14 - it just cannot be doubled.
  // Starting level table. EVERYTHING here is a first guess to be tuned by
  // real play (Ryan: "we'll have to fine-tune that"). clock = seconds per
  // roll, 0 = unlimited. xp = total XP needed to be this level. assist =
  // the screen shows running totals and matching-card glows (Ryan: suggestions
  // for the early rounds, dragging with no hints as players get better).
  // selfScore = Amit stops keeping score; the player adds up their own turn
  // (Ryan: "as it progresses, the people need to keep track of their own score").
  const LEVELS = [
    { lvl: 1, xp: 0,   clock: 0,   cardMin: 1, cardMax: 8,  helps: 5, assist: true, selfScore: false },
    { lvl: 2, xp: 50,  clock: 120, cardMin: 1, cardMax: 9, helps: 5, assist: true, selfScore: false },
    { lvl: 3, xp: 120, clock: 90,  cardMin: 1, cardMax: 10, helps: 4, assist: true, selfScore: false },
    { lvl: 4, xp: 210, clock: 70,  cardMin: 1, cardMax: 12, helps: 3, assist: false, selfScore: true },
    { lvl: 5, xp: 320, clock: 55,  cardMin: 1, cardMax: 14, helps: 2, assist: false, selfScore: true },
    { lvl: 6, xp: 450, clock: 45,  cardMin: 2, cardMax: 15, helps: 1, assist: false, selfScore: true },
    { lvl: 7, xp: 600, clock: 36,  cardMin: 2, cardMax: 16, helps: 1, assist: false, selfScore: true },
    { lvl: 8, xp: 780, clock: 30,  cardMin: 2, cardMax: 16, helps: 0, assist: false, selfScore: true }
  ];

  function levelFor(xp) {
    let cur = LEVELS[0];
    for (const L of LEVELS) if (xp >= L.xp) cur = L;
    return cur;
  }

  // ── random ──────────────────────────────────────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rollDie(rng) { return 1 + Math.floor(rng() * 6); }
  function rollDice(rng, n) { const a = []; for (let i = 0; i < n; i++) a.push(rollDie(rng)); return a; }
  // wildChance > 0: each card may instead be a wild ('W').
  function dealCards(rng, n, cardMin, cardMax, wildChance) {
    const a = [];
    for (let i = 0; i < n; i++) {
      if (wildChance > 0 && rng() < wildChance) { a.push('W'); continue; }
      a.push(cardMin + Math.floor(rng() * (cardMax - cardMin + 1)));
    }
    return a;
  }

  // ── covers ──────────────────────────────────────────────
  function multiplier(values) {
    const c = {};
    let best = 0;
    for (const v of values) { c[v] = (c[v] || 0) + 1; if (c[v] > best) best = c[v]; }
    return best;
  }
  function sum(values) { let s = 0; for (const v of values) s += v; return s; }
  function popcount(x) { let n = 0; while (x) { n += x & 1; x >>>= 1; } return n; }
  function maskToIdx(mask, n) { const a = []; for (let i = 0; i < n; i++) if (mask & (1 << i)) a.push(i); return a; }

  // cards / dice: arrays of numbers, null = not available (already covered / used).
  // Returns the highest-scoring set of covers for THIS position. Ties go to the
  // plan that uses more dice, then covers more cards. (One position deep: it
  // does not look ahead at later rolls — see rollOutlook for that.)
  function bestPlan(cards, dice) {
    const n = dice.length, m = cards.length;
    let avail = 0;
    for (let i = 0; i < n; i++) if (dice[i] != null) avail |= (1 << i);
    const info = new Array(1 << n);
    for (let mask = 1; mask < (1 << n); mask++) {
      if ((mask & avail) !== mask) continue;
      const vals = maskToIdx(mask, n).map(i => dice[i]);
      info[mask] = { sum: sum(vals), mult: multiplier(vals) };
    }
    const memo = new Map();
    function rec(av, cu) {
      if (av === 0) return { key: 0, covers: [] };
      const mk = av * 1024 + cu;
      if (memo.has(mk)) return memo.get(mk);
      let low = 0; while (!(av & (1 << low))) low++;
      const bit = 1 << low;
      let best = rec(av & ~bit, cu);
      const rest = av & ~bit;
      for (let sub = rest; ; sub = (sub - 1) & rest) {
        const S = sub | bit;
        const inf = info[S];
        let tried = {};
        for (let c = 0; c < m; c++) {
          if (cards[c] == null || (cu & (1 << c)) || cards[c] !== inf.sum || tried[cards[c]]) continue;
          tried[cards[c]] = true;
          const r = rec(av & ~S, cu | (1 << c));
          const pts = inf.sum * inf.mult;
          const key = r.key + pts * 10000 + popcount(S) * 100 + 1;
          if (key > best.key) {
            best = { key, covers: [{ dice: maskToIdx(S, n), card: c, sum: inf.sum, mult: inf.mult, pts }].concat(r.covers) };
          }
        }
        if (sub === 0) break;
      }
      memo.set(mk, best);
      return best;
    }
    const r = rec(avail, 0);
    let used = 0; r.covers.forEach(c => used += c.dice.length);
    let leftover = 0;
    for (let i = 0; i < n; i++) if (dice[i] != null) leftover += dice[i];
    r.covers.forEach(c => c.dice.forEach(i => leftover -= dice[i]));
    return { covers: r.covers, points: Math.floor(r.key / 10000), used, leftover };
  }

  // Every single cover that is possible right now (for "can anything cover?"
  // and for the bot's weaker play).
  function validCovers(cards, dice) {
    const n = dice.length, out = [];
    let avail = 0;
    for (let i = 0; i < n; i++) if (dice[i] != null) avail |= (1 << i);
    for (let mask = 1; mask < (1 << n); mask++) {
      if ((mask & avail) !== mask) continue;
      const vals = maskToIdx(mask, n).map(i => dice[i]);
      const s = sum(vals);
      const seen = {};
      for (let c = 0; c < cards.length; c++) {
        if (cards[c] != null && cards[c] === s && !seen[s]) {
          seen[s] = true;
          const mult = multiplier(vals);
          out.push({ dice: maskToIdx(mask, n), card: c, sum: s, mult, pts: s * mult });
        }
      }
    }
    // a wild takes any dice: offer each single die, and all dice together
    const avIdx = [];
    for (let i = 0; i < n; i++) if (dice[i] != null) avIdx.push(i);
    for (let c = 0; c < cards.length; c++) {
      if (cards[c] !== 'W' || !avIdx.length) continue;
      avIdx.forEach(i => out.push({ dice: [i], card: c, sum: dice[i], mult: 1, pts: 0, wild: true }));
      if (avIdx.length > 1) out.push({ dice: avIdx.slice(), card: c, sum: sum(avIdx.map(i => dice[i])), mult: 1, pts: 0, wild: true });
      break;
    }
    return out;
  }

  // ── a turn ──────────────────────────────────────────────
  function cardVals(st) { return st.cards.map(c => c.covered ? null : c.v); }
  function diceVals(st) { return st.dice.map(d => d.used ? null : d.v); }
  function leftoverSum(st) { let s = 0; st.dice.forEach(d => { if (!d.used) s += d.v; }); return s; }

  function newTurn(cards, dice, rules) {
    rules = Object.assign({}, DEFAULT_RULES, rules || {});
    const st = {
      rules,
      cards: cards.map(v => ({ v, covered: false })),
      dice: dice.map(v => ({ v, used: false })),
      points: 0, safe: 0, rollNo: 1, coversThisRoll: 0,
      status: 'rolled', score: null, sweeps: [], rolls: [], scorecard: []
    };
    beginRoll(st);
    return st;
  }

  function beginRoll(st) {
    const cv = cardVals(st), dv = diceVals(st);
    st.rolls.push({
      dice: st.dice.filter(d => !d.used).map(d => d.v),
      full: dv.slice(),   // all dice slots (null = already used); best.covers[].dice index into this
      cards: cv.filter(v => v != null),
      wild: cv.indexOf('W') >= 0,
      best: bestPlan(cv, dv),
      taken: []
    });
    if (validCovers(cv, dv).length === 0) bust(st);
  }

  function bust(st) {
    st.status = 'bust';
    st.score = st.safe;      // 0 unless a full set of five cards was covered and banked earlier this turn
    return st;
  }

  // diceIdx: indexes into st.dice; cardIdx: index into st.cards
  function tryCover(st, diceIdx, cardIdx) {
    if (st.status !== 'rolled') return { ok: false, reason: 'turn is over' };
    if (!diceIdx.length) return { ok: false, reason: 'no dice chosen' };
    const card = st.cards[cardIdx];
    if (!card || card.covered) return { ok: false, reason: 'card not available' };
    const seen = {};
    for (const i of diceIdx) {
      const d = st.dice[i];
      if (!d || d.used || seen[i]) return { ok: false, reason: 'die not available' };
      seen[i] = true;
    }
    const vals = diceIdx.map(i => st.dice[i].v);
    const s = sum(vals);
    const isWild = card.v === 'W';
    if (!isWild && s !== card.v) return { ok: false, reason: 'sum', have: s, need: card.v };
    const mult = isWild ? 1 : multiplier(vals);
    const pts = isWild ? st.rules.wildPoints : card.v * mult;
    diceIdx.forEach(i => { st.dice[i].used = true; });
    card.covered = true;
    const prevSafe = st.safe;
    st.points += pts;
    st.coversThisRoll++;
    const roll = st.rolls[st.rolls.length - 1];
    const taken = { dice: vals, card: card.v, mult, pts, wild: isWild };
    roll.taken.push(taken);
    const cover = { cardIdx, card: card.v, values: vals.slice(), idx: diceIdx.slice(), mult, pts, wild: isWild, roll: st.rollNo, locked: false, sweep: null, prevSafe, taken };
    card.cover = cover;
    st.scorecard.push(cover);
    const allDice = st.dice.every(d => d.used);
    const allCards = st.cards.every(c => c.covered);
    const sweep = allCards ? 'cards' : (allDice ? 'dice' : null);
    cover.banked = false;
    if (sweep) {
      cover.sweep = sweep; st.sweeps.push(sweep);
      if ((sweep === 'cards' && st.rules.cardSweepBanks) || (sweep === 'dice' && st.rules.sweepBanks)) { st.safe = st.points; cover.banked = true; }
    }
    return { ok: true, pts, mult, sweep, wild: isWild };
  }

  // true while a NUMBER card can still be covered with the unused dice
  function mustCover(st) {
    if (st.status !== 'rolled') return false;
    return validCovers(cardVals(st), diceVals(st)).some(c => !c.wild);
  }
  // Take back a cover made in the CURRENT roll. The dice become usable again.
  function uncover(st, cardIdx) {
    if (st.status !== 'rolled') return null;
    const card = st.cards[cardIdx];
    if (!card || !card.covered || !card.cover || card.cover.locked || card.cover.roll !== st.rollNo) return null;
    const c = card.cover;
    // any sweep recorded this roll is no longer true once a cover is undone
    st.scorecard.forEach(x => {
      if (x.roll === st.rollNo && x.sweep) { st.sweeps.pop(); x.sweep = null; if (x.banked) { st.safe = x.prevSafe; x.banked = false; } }
    });
    c.idx.forEach(i => { st.dice[i].used = false; });
    card.covered = false; card.cover = null;
    st.points -= c.pts; st.coversThisRoll--;
    const roll = st.rolls[st.rolls.length - 1];
    const k = roll.taken.indexOf(c.taken); if (k >= 0) roll.taken.splice(k, 1);
    const si = st.scorecard.indexOf(c); if (si >= 0) st.scorecard.splice(si, 1);
    return { idx: c.idx.slice(), values: c.values.slice(), pts: c.pts };
  }
  // The roll clock ran out. Bank exactly what is covered, even if more covers were still possible.
  function timeoutStop(st) {
    if (st.status !== 'rolled') return null;
    if (!st.scorecard.length) return bust(st);
    lockCovers(st);
    st.status = 'stopped';
    st.timedOut = true;
    st.score = st.points - leftoverSum(st);
    return st;
  }
  function lockCovers(st) { st.scorecard.forEach(c => { c.locked = true; }); }
  const WORDS = ['', '', 'DOUBLED', 'TRIPLED', 'QUADRUPLED', 'QUINTUPLED'];
  function multWord(m) { return WORDS[m] || ('×' + m); }

  function canStop(st) { return st.status === 'rolled' && st.coversThisRoll > 0 && !mustCover(st); }
  function canRoll(st) { return canStop(st); }

  function stop(st) {
    if (!canStop(st)) return null;
    lockCovers(st);
    st.status = 'stopped';
    st.score = st.points - leftoverSum(st);
    return st;
  }

  // dealFn() -> 5 new card values (used when every card is covered).
  function roll(st, rng, dealFn) {
    if (!canRoll(st)) return null;
    lockCovers(st);
    const allCards = st.cards.every(c => c.covered);
    const allDice = st.dice.every(d => d.used);
    if (allCards) {
      st.cards = dealFn().map(v => ({ v, covered: false }));
    }
    if (allCards || allDice) {
      st.dice = rollDice(rng, st.rules.diceCount).map(v => ({ v, used: false }));
    } else {
      st.dice.forEach(d => { if (!d.used) d.v = rollDie(rng); });
    }
    st.rollNo++;
    st.coversThisRoll = 0;
    beginRoll(st);
    return st;
  }

  // ── one-roll look-ahead (the risk readout, the "should I stop?" hint, the bot) ──
  function multisets(k, fn) {
    const counts = new Array(7).fill(0);
    const fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
    const total = Math.pow(6, k);
    (function rec(face, left) {
      if (face === 6) {
        counts[6] = left;
        let w = fact[k];
        const vals = [];
        for (let f = 1; f <= 6; f++) { w /= fact[counts[f]]; for (let j = 0; j < counts[f]; j++) vals.push(f); }
        fn(vals, w / total);
        return;
      }
      for (let c = 0; c <= left; c++) { counts[face] = c; rec(face + 1, left - c); }
    })(1, k);
  }

  function rollOutlook(st) {
    if (st.status !== 'rolled') return null;
    const stopValue = st.points - leftoverSum(st);
    const bustValue = st.safe;
    if (st.cards.every(c => c.covered)) {
      return { fresh: true, stopValue, pBust: null, evRoll: null, advice: 'roll' };
    }
    const cards = cardVals(st);
    let k = st.dice.filter(d => !d.used).length;
    if (k === 0) k = st.rules.diceCount;
    const hasWild = cards.indexOf('W') >= 0;
    let pBust = 0, ev = 0;
    multisets(k, (vals, w) => {
      const plan = bestPlan(cards, vals);
      if (!plan.covers.length) {
        if (hasWild) ev += w * (st.points + st.rules.wildPoints);   // wild rescues; all dice on it leaves no penalty
        else { pBust += w; ev += w * bustValue; }
      } else ev += w * (st.points + plan.points - plan.leftover);
    });
    return { fresh: false, stopValue, pBust, evRoll: ev, advice: ev > stopValue ? 'roll' : 'stop' };
  }

  // ── Amit as an opponent ─────────────────────────────────
  // skill 0..1. Low skill sometimes takes any legal cover instead of the best
  // one, and decides to stop or roll with noise.
  function botTurn(opts) {
    const rng = opts.rng, skill = opts.skill;
    const st = newTurn(opts.cards, rollDice(rng, 5), opts.rules);
    let guard = 0;
    while (st.status === 'rolled' && guard++ < 60) {
      if (rng() < skill) {
        const plan = bestPlan(cardVals(st), diceVals(st));
        plan.covers.forEach(c => tryCover(st, c.dice, c.card));
      } else {
        let any = validCovers(cardVals(st), diceVals(st)).filter(x => !x.wild);
        while (any.length) {
          const c = any[Math.floor(rng() * any.length)];
          tryCover(st, c.dice, c.card);
          any = validCovers(cardVals(st), diceVals(st)).filter(x => !x.wild);
        }
      }
      if (st.coversThisRoll === 0) {
        const wc = validCovers(cardVals(st), diceVals(st)).filter(c => c.wild).pop();   // last = all dice on the wild
        if (wc) tryCover(st, wc.dice, wc.card);
      }
      const o = rollOutlook(st);
      const noise = (rng() - 0.5) * (1 - skill) * 12;
      if (o.fresh || o.evRoll - o.stopValue > noise) roll(st, rng, opts.dealFn);
      else stop(st);
    }
    if (st.status === 'rolled') stop(st);
    return { score: st.score, status: st.status, rolls: st.rolls.length };
  }

  return {
    DEFAULT_RULES, LEVELS, levelFor,
    mulberry32, rollDie, rollDice, dealCards,
    multiplier, bestPlan, validCovers,
    newTurn, tryCover, uncover, multWord, timeoutStop, canStop, canRoll, mustCover, stop, roll, bust,
    leftoverSum, cardVals, diceVals, rollOutlook, botTurn
  };
});

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

  const DEFAULT_RULES = { diceCount: 5, cardCount: 5, sweepBanks: false, cardSweepBanks: true, wildPoints: 0, wildChance: 0.04,
    stage: 'addition', faces: 6, ops: ['+'], required: null, turnSign: null, noNegatives: false, allowNegStart: false };

  // AMIT AS A PLAYER (Ryan, 2026-10-16): Amit always plays at the LOWEST level of the people at the table and is held to the
  // same clock. amitSecs = the seconds Amit needs to find and place one cover at that level (the same assumed figures the clocks
  // were built from; level 1 has no clock so it only sets Amit's pace); amitSkill = how often he spots the best cover and how
  // well he judges when to roll or bank. Every move costs time out of the roll's clock; if it runs out he banks only what is covered.
  // CLOCKS (2026-10-16): each clock is about 4x the ASSUMED seconds a player at that level needs to find and place one cover
  // (L2 25s, L3 20s, L4 16s, L5 13s, L6 11s, L7 9s, L8 8s - guesses, not measured). Full reasoning and the tuning rule are in
  // Sessions.md, entry "Card numbers and clocks - the chart and the logic". The game records real roll times so these can be tuned.
  // TOP CARD NUMBERS, ADDITION (Ryan, 2026-10-16): level 1 tops out at 9 and every level adds one: 9, 10, 11, 12, 13, 14, 15, 16 - capped at 16.
  // Ryan dropped the earlier "only numbers that can be made from matching dice" idea: the tops just climb, which adds a level of
  // complexity. The other stages have their own tops (STAGE_TOPS below).
  // EXPERIENCE (xp) is earned by finishing a table game in a good place (see placeXp); the level thresholds are a first guess meant to need
  // about 4 wins at a four-player Amit table for level 2.
  // Level table. EVERYTHING here is a first guess to be tuned by real play (Ryan: "we'll have to fine-tune that"). clock = seconds per
  // roll, 0 = unlimited. xp = total experience needed to be this level. assist = the screen shows running totals and matching-card glows
  // (hints for the early rounds, dragging with no hints as players get better). selfScore = Amit stops keeping score; the player adds up
  // their own turn. These numbers are the ADDITION stage's; levelsFor(stage) gives the other stages' versions.
  const LEVELS = [
    { lvl: 1, xp: 0,   clock: 0,   cardMin: 1, cardMax: 9,  helps: 5, assist: true, selfScore: false, amitSecs: 30, amitSkill: 0.3 },
    { lvl: 2, xp: 4,  clock: 120, cardMin: 1, cardMax: 10, helps: 5, assist: true, selfScore: false, amitSecs: 25, amitSkill: 0.42 },
    { lvl: 3, xp: 10, clock: 90,  cardMin: 1, cardMax: 11, helps: 4, assist: true, selfScore: false, amitSecs: 20, amitSkill: 0.54 },
    { lvl: 4, xp: 18, clock: 70,  cardMin: 1, cardMax: 12, helps: 3, assist: false, selfScore: true, amitSecs: 16, amitSkill: 0.66 },
    { lvl: 5, xp: 30, clock: 55,  cardMin: 1, cardMax: 13, helps: 2, assist: false, selfScore: true, amitSecs: 13, amitSkill: 0.77 },
    { lvl: 6, xp: 45, clock: 45,  cardMin: 2, cardMax: 14, helps: 1, assist: false, selfScore: true, amitSecs: 11, amitSkill: 0.86 },
    { lvl: 7, xp: 65, clock: 36,  cardMin: 2, cardMax: 15, helps: 1, assist: false, selfScore: true, amitSecs: 9, amitSkill: 0.93 },
    { lvl: 8, xp: 90, clock: 30,  cardMin: 2, cardMax: 16, helps: 0, assist: false, selfScore: true, amitSecs: 8, amitSkill: 0.98 }
  ];

  // EXPERIENCE FOR A FINISH (Ryan, 2026-10-16): first place earns one point for every opponent beaten (2 players: 1, 8 players: 7);
  // lower places scale down evenly to 0 for last (3 players: 2, 1, 0). Beating Amit counts at a reduced rate (factor, now 0.25).
  function placeXp(place, nPlayers, factor) {
    if (nPlayers < 2) return 0;
    return Math.max(0, nPlayers - place) * (factor == null ? 1 : factor);
  }
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
  function rollDie(rng, faces) { return 1 + Math.floor(rng() * (faces || 6)); }
  function rollDice(rng, n, faces) { const a = []; for (let i = 0; i < n; i++) a.push(rollDie(rng, faces)); return a; }
  // wildChance > 0: each card may instead be a wild ('W').
  function dealCards(rng, n, cardMin, cardMax, wildChance) {
    const a = [];
    for (let i = 0; i < n; i++) {
      if (wildChance > 0 && rng() < wildChance) { a.push('W'); continue; }
      a.push(cardMin + Math.floor(rng() * (cardMax - cardMin + 1)));
    }
    return a;
  }

  // ═══ STAGES (Ryan, 2026-10-16) ═══════════════════════════════════════
  // Addition keeps the original game (dice 1-6, covers add up, matching dice multiply). The other stages use dice 1-10 and covers are
  // EXPRESSIONS built from dice and signs. Choosing a stage turns on its signs AND every sign before it: subtraction = + and -,
  // multiplication = + - and x, division = all four. Every cover must contain at least one use of the stage's own sign (a subtraction cover must
  // contain a minus, a multiplication cover a times, a division cover a divide). Order of operations: x and / first, then + and - ("My Dear Aunt
  // Sally"). Division must come out as a whole number. At the lower levels the running total may not go below zero (put the plus
  // dice first); from level NEG_FROM_LEVEL up it may, and a cover may even start with a minus. The matching-dice multiplier is addition's only.
  const STAGES = {
    addition:       { name: 'Addition',       faces: 6,  ops: ['+'],                required: null },
    subtraction:    { name: 'Subtraction',    faces: 10, ops: ['+', '−'],           required: '−' },
    multiplication: { name: 'Multiplication', faces: 10, ops: ['+', '−', '×'],      required: '×' },
    division:       { name: 'Division',       faces: 10, ops: ['+', '−', '×', '÷'], required: '÷' }
  };
  const STAGE_ORDER = ['addition', 'subtraction', 'multiplication', 'division'];
  const NEG_FROM_LEVEL = 5;
  // STAGE_TOPS and STAGE_PACE: see the entry "stages beyond addition" in Sessions.md for how they were chosen.
  const STAGE_TOPS = {
    addition:       [9, 10, 11, 12, 13, 14, 15, 16],
    subtraction:    [12, 14, 16, 18, 20, 22, 24, 26],
    multiplication: [30, 40, 50, 60, 70, 80, 90, 100],
    division:       [24, 28, 32, 36, 40, 44, 50, 60]
  };
  // later stages take longer per cover, so their clocks and Amit's pace are stretched by these factors
  const STAGE_PACE = { addition: 1, subtraction: 1.3, multiplication: 1.6, division: 1.8 };
  function levelsFor(stage) {
    const tops = STAGE_TOPS[stage] || STAGE_TOPS.addition, pace = STAGE_PACE[stage] || 1;
    return LEVELS.map((L, i) => Object.assign({}, L, {
      cardMax: tops[i],
      clock: L.clock ? Math.round(L.clock * pace / 5) * 5 : 0,
      amitSecs: Math.round(L.amitSecs * pace * 10) / 10
    }));
  }
  function rulesFor(stage, lvl) {
    const S = STAGES[stage] || STAGES.addition;
    return { stage: STAGES[stage] ? stage : 'addition', faces: S.faces, ops: S.ops.slice(), required: null, turnSign: S.required, noNegatives: lvl < NEG_FROM_LEVEL, allowNegStart: lvl >= NEG_FROM_LEVEL };
  }

  // Work out an expression. items = [{v: die value, op}] in the order the player built it; the first op is '+' (or '-' where allowNegStart).
  // Terms start at a '+' or '-' and carry on through any x or / that follow.
  function evalItems(items, rules) {
    rules = rules || DEFAULT_RULES;
    const allowed = rules.ops || ['+'];
    if (!items.length) return { ok: false, reason: 'empty' };
    let total = 0, term = 0, sign = 1, minus = false, mul = false, div = false;
    for (let i = 0; i < items.length; i++) {
      const op = items[i].op || '+', v = items[i].v;
      if (allowed.indexOf(op) < 0) return { ok: false, reason: 'sign' };
      if (i === 0) {
        if (op !== '+' && !(op === '−' && rules.allowNegStart)) return { ok: false, reason: 'start' };
        sign = op === '−' ? -1 : 1; term = v; if (op === '−') minus = true;
      } else if (op === '+' || op === '−') {
        total += sign * term;
        if (rules.noNegatives && total < 0) return { ok: false, reason: 'negative' };
        sign = op === '−' ? -1 : 1; term = v; if (op === '−') minus = true;
      } else if (op === '×') { term *= v; mul = true; }
      else if (op === '÷') { if (term % v !== 0) return { ok: false, reason: 'divide' }; term = term / v; div = true; }
    }
    total += sign * term;
    if (rules.noNegatives && total < 0) return { ok: false, reason: 'negative' };
    const req = rules.required;
    if ((req === '−' && !minus) || (req === '×' && !mul) || (req === '÷' && !div)) return { ok: false, reason: 'required', value: total };
    return { ok: true, value: total, minus, mul, div };
  }
  function exprString(items) { return items.map((it, i) => (i ? ' ' + it.op + ' ' : (it.op === '−' ? '−' : '')) + it.v).join(''); }

  // The solver is deliberately simple (Ryan, 2026-10-16): try every expression - every group of dice, in every order, with every choice of
  // signs - using the SAME evaluator that checks a player's cover, keep the results, and a card can be covered if its number is among them.
  const permCache = {}, seqCache = {};
  function permsOf(k) {
    if (permCache[k]) return permCache[k];
    const out = [];
    (function permute(arr, used) {
      if (arr.length === k) { out.push(arr.slice()); return; }
      for (let i = 0; i < k; i++) if (!used[i]) { used[i] = true; arr.push(i); permute(arr, used); arr.pop(); used[i] = false; }
    })([], []);
    return (permCache[k] = out);
  }
  function seqsOf(k, ops) {
    const key = k + ops.join('');
    if (seqCache[key]) return seqCache[key];
    const out = [];
    (function build(cur) { if (cur.length === k - 1) { out.push(['+'].concat(cur)); return; } for (const o of ops) build(cur.concat([o])); })([]);
    return (seqCache[key] = out);
  }
  function stageSets(dice, rules) {
    const n = dice.length, ops = rules.ops, out = new Array(1 << n);
    let avail = 0;
    for (let i = 0; i < n; i++) if (dice[i] != null) avail |= (1 << i);
    for (let mask = 0; mask < (1 << n); mask++) {
      const set = new Set();
      out[mask] = set;
      if ((mask & avail) !== mask || !(mask & (mask - 1))) continue;          // needs at least two dice (an operation)
      const idx = maskToIdx(mask, n), k = idx.length, seqs = seqsOf(k, ops);
      for (const p of permsOf(k)) {
        for (const sq of seqs) {
          const items = p.map((pi, pos) => ({ v: dice[idx[pi]], op: sq[pos] }));
          const r = evalItems(items, rules);
          if (r.ok && r.value >= 1) set.add(r.value);
        }
      }
    }
    return out;
  }
  // A real expression for a group of dice that makes a target (for Amit's moves and for hints): returns { dice: [indexes in order], ops: [...] }.
  const SIGN_FLAG = { '−': 'minus', '×': 'mul', '÷': 'div' };
  function isBonus(items, rules) {
    if (!rules || !rules.stage || rules.stage === 'addition') return false;
    const used = {}; items.slice(1).forEach(x => { used[x.op] = true; });
    return rules.ops.every(o => used[o]);
  }
  // like stageExpr, but finds an expression that earns the bonus
  function stageBonusExpr(diceVals, idxList, target, rules) {
    const k = idxList.length;
    if (k < rules.ops.length + 1) return null;           // each sign needs its own later die
    const seqs = seqsOf(k, rules.ops);
    for (const p of permsOf(k)) {
      for (const sq of seqs) {
        const items = p.map((pi, pos) => ({ v: diceVals[idxList[pi]], op: sq[pos] }));
        if (!isBonus(items, rules)) continue;
        const r = evalItems(items, rules);
        if (r.ok && r.value === target) return { dice: p.map(pi => idxList[pi]), ops: sq, expr: exprString(items) };
      }
    }
    return null;
  }
  function stageExpr(diceVals, idxList, target, rules, needSign) {
    const k = idxList.length, seqs = seqsOf(k, rules.ops);
    for (const p of permsOf(k)) {
      for (const sq of seqs) {
        const items = p.map((pi, pos) => ({ v: diceVals[idxList[pi]], op: sq[pos] }));
        const r = evalItems(items, rules);
        if (r.ok && r.value === target && (!needSign || r[SIGN_FLAG[needSign]])) return { dice: p.map(pi => idxList[pi]), ops: sq, expr: exprString(items) };
      }
    }
    return null;
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
  function bestPlan(cards, dice, rules) {
    if (rules && rules.stage && rules.stage !== 'addition') return bestPlanStage(cards, dice, rules);
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

  function wildCovers(cards, dice, out) {
    const n = dice.length, avIdx = [];
    for (let i = 0; i < n; i++) if (dice[i] != null) avIdx.push(i);
    for (let c = 0; c < cards.length; c++) {
      if (cards[c] !== 'W' || !avIdx.length) continue;
      avIdx.forEach(i => out.push({ dice: [i], card: c, sum: dice[i], mult: 1, pts: 0, wild: true }));
      if (avIdx.length > 1) out.push({ dice: avIdx.slice(), card: c, sum: sum(avIdx.map(i => dice[i])), mult: 1, pts: 0, wild: true });
      break;
    }
    return out;
  }
  function validCoversStage(cards, dice, rules) {
    const n = dice.length, out = [], sets = stageSets(dice, rules);
    for (let mask = 1; mask < (1 << n); mask++) {
      const S = sets[mask]; if (!S || !S.size) continue;
      const seen = {};
      for (let c = 0; c < cards.length; c++) {
        const v = cards[c];
        if (v != null && v !== 'W' && !seen[v] && S.has(v)) { seen[v] = true; out.push({ dice: maskToIdx(mask, n), card: c, sum: v, mult: 1, pts: v, stage: true }); }
      }
    }
    return wildCovers(cards, dice, out);
  }
  function bestPlanStage(cards, dice, rules) {
    const n = dice.length, m = cards.length, sets = stageSets(dice, rules);
    let avail = 0;
    for (let i = 0; i < n; i++) if (dice[i] != null) avail |= (1 << i);
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
        const S = sub | bit, vs = sets[S];
        if (vs && vs.size) {
          const tried = {};
          for (let c = 0; c < m; c++) {
            const v = cards[c];
            if (v == null || v === 'W' || (cu & (1 << c)) || tried[v] || !vs.has(v)) continue;
            tried[v] = true;
            const r = rec(av & ~S, cu | (1 << c));
            const key = r.key + v * 10000 + popcount(S) * 100 + 1;
            if (key > best.key) best = { key, covers: [{ dice: maskToIdx(S, n), card: c, sum: v, mult: 1, pts: v, stage: true }].concat(r.covers) };
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
  function validCovers(cards, dice, rules) {
    if (rules && rules.stage && rules.stage !== 'addition') return validCoversStage(cards, dice, rules);
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
    if (rules.stage && STAGES[rules.stage]) { const S = STAGES[rules.stage]; if (!rules.ops || rules.ops === DEFAULT_RULES.ops) rules.ops = S.ops.slice(); if (rules.stage !== 'addition') { rules.required = null; rules.turnSign = S.required; rules.faces = S.faces; } }
    const st = {
      rules,
      cards: cards.map(v => ({ v, covered: false })),
      dice: dice.map(v => ({ v, used: false })),
      points: 0, safe: 0, rollNo: 1, coversThisRoll: 0,
      setNo: 1, signUsed: false, setStartPoints: 0, setBonus: false, bonusNext: false,      // the stage's sign is needed once in each set of five cards
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
      best: bestPlan(cv, dv, st.rules),
      taken: []
    });
    if (validCovers(cv, dv, st.rules).length === 0) bust(st);
  }

  function bust(st) {
    st.status = 'bust';
    st.score = st.safe;      // 0 unless a full set of five cards was covered and banked earlier this turn
    return st;
  }

  // diceIdx: indexes into st.dice; cardIdx: index into st.cards
  function tryCover(st, diceIdx, cardIdx, ops) {
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
    const isWild = card.v === 'W';
    const staged = st.rules.stage && st.rules.stage !== 'addition';
    let s = sum(vals), itemsUsed = null, usedSign = false, bonus = false;
    if (staged && !isWild) {
      // expression covers: dice in the order the player built them, each with its sign
      itemsUsed = vals.map((v, k) => ({ v, op: (ops && ops[k]) || '+' }));
      const r = evalItems(itemsUsed, st.rules);
      if (!r.ok) return { ok: false, reason: r.reason === 'required' ? 'required' : r.reason, have: r.value, need: card.v };
      s = r.value;
      if (st.rules.turnSign) usedSign = !!r[SIGN_FLAG[st.rules.turnSign]];
      bonus = isBonus(itemsUsed, st.rules);
    }
    if (!isWild && s !== card.v) return { ok: false, reason: 'sum', have: s, need: card.v };
    const mult = isWild || staged ? 1 : multiplier(vals);
    const pts = isWild ? st.rules.wildPoints : card.v * mult;
    diceIdx.forEach(i => { st.dice[i].used = true; });
    card.covered = true;
    const prevSafe = st.safe;
    st.points += pts;
    st.coversThisRoll++;
    const roll = st.rolls[st.rolls.length - 1];
    const expr = itemsUsed ? exprString(itemsUsed) : vals.join(' + ');
    const taken = { dice: vals, card: card.v, mult, pts, wild: isWild, expr, ops: itemsUsed ? itemsUsed.map(x => x.op) : null };
    roll.taken.push(taken);
    const cover = { cardIdx, card: card.v, values: vals.slice(), idx: diceIdx.slice(), expr, ops: taken.ops, mult, pts, wild: isWild, roll: st.rollNo, locked: false, sweep: null, prevSafe, taken, usedSign, setNo: st.setNo, bonus };
    if (usedSign) st.signUsed = true;
    if (bonus) st.setBonus = true;
    card.cover = cover;
    st.scorecard.push(cover);
    const allDice = st.dice.every(d => d.used);
    const allCards = st.cards.every(c => c.covered);
    const sweep = allCards ? 'cards' : (allDice ? 'dice' : null);
    cover.banked = false;
    let forfeit = false;
    if (sweep) {
      cover.sweep = sweep; st.sweeps.push(sweep);
      if (st.rules.turnSign && !st.signUsed) {
        // five cards cleared without the stage's sign: those five cards score nothing, and nothing is banked
        if (sweep === 'cards') {
          forfeit = true; cover.prePoints = st.points; cover.forfeitStart = st.setStartPoints;
          st.points = st.setStartPoints;
          st.scorecard.forEach(x => { if (x.setNo === st.setNo) x.forfeited = true; });
        }
      } else if ((sweep === 'cards' && st.rules.cardSweepBanks) || (sweep === 'dice' && st.rules.sweepBanks)) { st.safe = st.points; cover.banked = true; }
    }
    return { ok: true, pts, mult, sweep, wild: isWild, forfeit, bonus };
  }

  // true while a NUMBER card can still be covered with the unused dice
  function mustCover(st) {
    if (st.status !== 'rolled') return false;
    return validCovers(cardVals(st), diceVals(st), st.rules).some(c => !c.wild);
  }
  // Take back a cover made in the CURRENT roll. The dice become usable again.
  function uncover(st, cardIdx) {
    if (st.status !== 'rolled') return null;
    const card = st.cards[cardIdx];
    if (!card || !card.covered || !card.cover || card.cover.locked || card.cover.roll !== st.rollNo) return null;
    const c = card.cover;
    // any sweep recorded this roll is no longer true once a cover is undone
    st.scorecard.forEach(x => {
      if (x.roll === st.rollNo && x.sweep) {
        st.sweeps.pop(); x.sweep = null; if (x.banked) { st.safe = x.prevSafe; x.banked = false; }
        if (x.prePoints != null) { st.points = x.prePoints; delete x.prePoints; st.scorecard.forEach(y => { if (y.setNo === x.setNo) y.forfeited = false; }); }
      }
    });
    c.idx.forEach(i => { st.dice[i].used = false; });
    card.covered = false; card.cover = null;
    st.points -= c.pts; st.coversThisRoll--;
    const roll = st.rolls[st.rolls.length - 1];
    const k = roll.taken.indexOf(c.taken); if (k >= 0) roll.taken.splice(k, 1);
    const si = st.scorecard.indexOf(c); if (si >= 0) st.scorecard.splice(si, 1);
    st.signUsed = st.scorecard.some(x => x.setNo === st.setNo && x.usedSign);
    st.setBonus = st.scorecard.some(x => x.setNo === st.setNo && x.bonus);
    return { idx: c.idx.slice(), values: c.values.slice(), pts: c.pts };
  }
  // The roll clock ran out. Bank exactly what is covered, even if more covers were still possible.
  function timeoutStop(st) {
    if (st.status !== 'rolled') return null;
    if (!st.scorecard.length) return bust(st);
    lockCovers(st);
    st.status = 'stopped';
    st.timedOut = true;
    if (needSign(st)) { st.score = st.setStartPoints; st.noSign = true; }
    else { st.score = st.points - leftoverSum(st); st.bonusNext = !!st.setBonus; }
    return st;
  }
  function lockCovers(st) { st.scorecard.forEach(c => { c.locked = true; }); }
  const WORDS = ['', '', 'DOUBLED', 'TRIPLED', 'QUADRUPLED', 'QUINTUPLED'];
  function multWord(m) { return WORDS[m] || ('×' + m); }

  // the stage's sign is still owed in this set of five cards
  function needSign(st) { return !!st.rules.turnSign && !st.signUsed; }
  function canRoll(st) { return st.status === 'rolled' && st.coversThisRoll > 0 && !mustCover(st); }
  function canStop(st) { return canRoll(st) && !needSign(st); }

  function stop(st) {
    if (!canStop(st)) return null;
    lockCovers(st);
    st.status = 'stopped';
    st.score = st.points - leftoverSum(st);
    st.bonusNext = !!st.setBonus;
    return st;
  }

  // dealFn(wild) -> 5 new card values (used when every card is covered).
  function roll(st, rng, dealFn) {
    if (!canRoll(st)) return null;
    lockCovers(st);
    const allCards = st.cards.every(c => c.covered);
    const allDice = st.dice.every(d => d.used);
    if (allCards) {
      st.cards = dealFn(!!st.setBonus).map(v => ({ v, covered: false }));
      st.setNo++; st.signUsed = false; st.setStartPoints = st.points; st.setBonus = false;
    }
    if (allCards || allDice) {
      st.dice = rollDice(rng, st.rules.diceCount, st.rules.faces).map(v => ({ v, used: false }));
    } else {
      st.dice.forEach(d => { if (!d.used) d.v = rollDie(rng, st.rules.faces); });
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
    if (st.rules.stage && st.rules.stage !== 'addition') {
      // the other stages have too many outcomes to list, so this is an estimate from sampled rolls (kept for the same position)
      const key = cards.join(',') + '|' + k + '|' + st.points + '|' + st.safe + '|' + leftoverSum(st);
      if (st._outlook && st._outlook.key === key) return st._outlook.val;
      let seed = 7; for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) | 0;
      const rng = mulberry32(seed), N = 24;
      let b = 0, e2 = 0;
      for (let s = 0; s < N; s++) {
        const plan = bestPlan(cards, rollDice(rng, k, st.rules.faces), st.rules);
        if (!plan.covers.length) { if (hasWild) e2 += st.points + st.rules.wildPoints; else { b++; e2 += bustValue; } }
        else e2 += st.points + plan.points - plan.leftover;
      }
      const evS = e2 / N;
      const val = { fresh: false, stopValue, pBust: b / N, evRoll: evS, advice: evS > stopValue ? 'roll' : 'stop', estimated: true };
      st._outlook = { key, val };
      return val;
    }
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

  // What Amit would do next (without doing it): cover a number card, use the wild when stuck, roll the dice left, or stop.
  function botPlan(st, opts) {
    if (st.status !== 'rolled') return { type: 'none' };
    const rng = opts.rng, skill = opts.skill;
    let any = validCovers(cardVals(st), diceVals(st), st.rules).filter(c => !c.wild);
    const owes = needSign(st);
    let forBonus = false;
    if (st.rules.stage && st.rules.stage !== 'addition' && any.length && rng() < skill * skill) {
      const b = any.filter(c => stageBonusExpr(diceVals(st), c.dice, c.sum, st.rules));
      if (b.length) { any = b; forBonus = true; }
    }
    if (owes && !forBonus) { const w = any.filter(c => stageExpr(diceVals(st), c.dice, c.sum, st.rules, st.rules.turnSign)); if (w.length) any = w; }
    if (any.length) {
      let pick = rng() < skill ? bestPlan(cardVals(st), diceVals(st), st.rules).covers[0] : any[Math.floor(rng() * any.length)];
      if ((owes || forBonus) && !any.some(c => c.card === pick.card && c.dice.join() === pick.dice.join())) pick = any.reduce((a, c) => (c.sum > a.sum ? c : a), any[0]);
      if (st.rules.stage && st.rules.stage !== 'addition') {
        const ex = (forBonus && stageBonusExpr(diceVals(st), pick.dice, pick.sum, st.rules)) || stageExpr(diceVals(st), pick.dice, pick.sum, st.rules, owes ? st.rules.turnSign : null);
        if (ex) return { type: 'cover', dice: ex.dice, ops: ex.ops, card: pick.card };
      }
      return { type: 'cover', dice: pick.dice, card: pick.card };
    }
    if (st.coversThisRoll === 0) {
      const wc = validCovers(cardVals(st), diceVals(st), st.rules).filter(c => c.wild).pop();   // last = every die on the wild
      return wc ? { type: 'wild', dice: wc.dice, card: wc.card } : { type: 'none' };
    }
    if (needSign(st)) return { type: 'roll' };        // the sign is still owed: keep rolling, cannot bank yet
    const o = rollOutlook(st);
    const noise = (rng() - 0.5) * (1 - skill) * 12;
    return (o.fresh || o.evRoll - o.stopValue > noise) ? { type: 'roll' } : { type: 'stop' };
  }
  function botApply(st, a, opts) {
    if (a.type === 'cover' || a.type === 'wild') tryCover(st, a.dice, a.card, a.ops);
    else if (a.type === 'roll') roll(st, opts.rng, opts.dealFn);
    else if (a.type === 'stop') stop(st);
    return a;
  }
  function botNext(st, opts) { const a = botPlan(st, opts); return botApply(st, a, opts); }

  // Seconds a move costs Amit out of the roll's clock: his level's pace x how big the move is x a little human variation.
  function amitCost(level, a, rng, pace, stage) {
    const L = levelsFor(stage || 'addition')[Math.max(0, Math.min(LEVELS.length - 1, level - 1))];
    const k = a.type === 'cover' ? 0.7 + 0.25 * a.dice.length : a.type === 'roll' ? 0.4 : 0.5;
    return L.amitSecs * k * (0.75 + rng() * 0.5) * (pace || 1);
  }
  // A whole turn for Amit at a level, held to that level's clock (virtual seconds). Used by the tests and for tuning; the table plays the same
  // decisions step by step on screen.
  function amitTurn(level, rng, cards, dealFn, rules) {
    const stage = (rules && rules.stage) || 'addition';
    const L = levelsFor(stage)[Math.max(0, Math.min(LEVELS.length - 1, level - 1))];
    const opts = { rng, skill: L.amitSkill, dealFn };
    const st = newTurn(cards, rollDice(rng, 5, (rules && rules.faces) || 6), rules);
    const budget = L.clock || Infinity;
    let elapsed = 0, timedOut = false, guard = 0;
    while (st.status === 'rolled' && guard++ < 300) {
      const a = botPlan(st, opts);
      if (a.type === 'none') { bust(st); break; }
      const cost = amitCost(level, a, rng, 1, stage);
      if (elapsed + cost > budget) { timeoutStop(st); timedOut = true; break; }
      botApply(st, a, opts);
      elapsed += cost;
      if (a.type === 'roll') elapsed = 0;     // a new roll gets a fresh clock
    }
    return { score: st.score, status: st.status, timedOut, rolls: st.rolls.length };
  }

  return {
    DEFAULT_RULES, STAGES, STAGE_ORDER, STAGE_TOPS, STAGE_PACE, NEG_FROM_LEVEL, levelsFor, rulesFor, evalItems, exprString, stageSets, stageExpr, isBonus, stageBonusExpr, placeXp, botNext, botPlan, botApply, amitCost, amitTurn, LEVELS, levelFor,
    mulberry32, rollDie, rollDice, dealCards,
    multiplier, bestPlan, validCovers,
    newTurn, tryCover, uncover, multWord, timeoutStop, canStop, canRoll, needSign, mustCover, stop, roll, bust,
    leftoverSum, cardVals, diceVals, rollOutlook, botTurn
  };
});

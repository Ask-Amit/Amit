// Run: node amitroll_engine.test.js
const E = require('./amitroll_engine.js');
const assert = require('assert');
let n = 0;
function t(name, fn) { fn(); n++; console.log('ok  ' + name); }

// fixed-dice turn helper: no roll randomness needed until a re-roll
// seq([faces]) -> an rng whose successive dice come out as those faces
const seq = arr => { let i = 0; return () => (arr[i++ % arr.length] - 1) / 6 + 0.01; };

t('multiplier: largest group of identical dice', () => {
  assert.strictEqual(E.multiplier([3, 5]), 1);
  assert.strictEqual(E.multiplier([4, 4]), 2);
  assert.strictEqual(E.multiplier([4, 4, 4]), 3);
  assert.strictEqual(E.multiplier([4, 4, 2, 2]), 2);
  assert.strictEqual(E.multiplier([1, 1, 1, 1, 1]), 5);
  assert.strictEqual(E.multiplier([6]), 1);
});

t("Ryan's examples: 4+4 on 8 = 16; 3+5 on 8 = 8; 4+4+4 on 12 = 36; 4+4+2+2 on 12 = 24", () => {
  let s = E.newTurn([8, 9, 10, 11, 13], [4, 4, 3, 5, 6]);
  let r = E.tryCover(s, [0, 1], 0); assert.ok(r.ok); assert.strictEqual(r.pts, 16); assert.strictEqual(r.mult, 2);
  s = E.newTurn([8, 9, 10, 11, 13], [4, 4, 3, 5, 6]);
  r = E.tryCover(s, [2, 3], 0); assert.ok(r.ok); assert.strictEqual(r.pts, 8);
  s = E.newTurn([12, 9, 10, 11, 13], [4, 4, 4, 1, 6]);
  r = E.tryCover(s, [0, 1, 2], 0); assert.ok(r.ok); assert.strictEqual(r.pts, 36);
  s = E.newTurn([12, 9, 10, 11, 13], [4, 4, 2, 2, 6]);
  r = E.tryCover(s, [0, 1, 2, 3], 0); assert.ok(r.ok); assert.strictEqual(r.pts, 24);
});

t('cover must add up exactly; bad covers change nothing', () => {
  const s = E.newTurn([7, 9, 10, 11, 13], [3, 4, 6, 6, 6]);
  const r = E.tryCover(s, [0], 0);
  assert.strictEqual(r.ok, false); assert.strictEqual(r.have, 3); assert.strictEqual(r.need, 7);
  assert.strictEqual(s.points, 0); assert.ok(!s.dice[0].used);
  assert.strictEqual(E.tryCover(s, [0, 0], 0).ok, false); // same die twice
  assert.strictEqual(E.tryCover(s, [], 0).ok, false);
});

t('a die or card cannot be used twice', () => {
  const s = E.newTurn([7, 7, 10, 11, 13], [3, 4, 3, 4, 6]);
  assert.ok(E.tryCover(s, [0, 1], 0).ok);
  assert.strictEqual(E.tryCover(s, [0, 3], 1).ok, false); // die 0 used
  assert.strictEqual(E.tryCover(s, [2, 3], 0).ok, false); // card 0 covered
  assert.ok(E.tryCover(s, [2, 3], 1).ok);                 // other 7 is fine
});

t('bust: no possible cover -> turn score 0', () => {
  const s = E.newTurn([20, 21, 22, 23, 24], [1, 1, 1, 1, 1]);
  assert.strictEqual(s.status, 'bust'); assert.strictEqual(s.score, 0);
});

t('cannot stop or roll before covering something', () => {
  const s = E.newTurn([7, 9, 10, 11, 13], [3, 4, 6, 6, 6]);
  assert.strictEqual(E.canStop(s), false);
  assert.strictEqual(E.stop(s), null);
  assert.strictEqual(E.roll(s, seq([1])), null);
});

t('stop: points minus the dice left over', () => {
  const s = E.newTurn([7, 30, 31, 32, 33], [3, 4, 6, 5, 2]);
  E.tryCover(s, [0, 1], 0);              // 7 points, leaves 6+5+2 = 13
  E.stop(s);
  assert.strictEqual(s.status, 'stopped');
  assert.strictEqual(s.score, 7 - 13);
});

t('using all five dice -> re-roll all five, points kept', () => {
  const s = E.newTurn([5, 4, 20, 21, 22], [2, 3, 1, 3, 1]);
  assert.strictEqual(E.tryCover(s, [0, 1], 0).ok, true);        // 2+3 on 5
  const r = E.tryCover(s, [2, 3, 4], 1);                         // 1+3+1 = 5, not 4
  assert.strictEqual(r.ok, false);
  const r2 = E.tryCover(s, [3, 4], 1);                           // 3+1 = 4
  assert.ok(r2.ok); // die 2 (value 1) left over
  assert.strictEqual(r2.sweep, null);
  // use the last die somewhere impossible -> still not a sweep; build a sweep case:
  const s2 = E.newTurn([5, 4, 1, 21, 22], [2, 3, 3, 1, 1]);
  E.tryCover(s2, [0, 1], 0); E.tryCover(s2, [2, 3], 1);
  const last = E.tryCover(s2, [4], 2);
  assert.strictEqual(last.sweep, 'dice');
  E.roll(s2, seq([6, 6, 6, 6, 6]), () => { throw new Error('should not deal'); });
  assert.strictEqual(s2.dice.length, 5);
  assert.ok(s2.dice.every(d => !d.used && d.v === 6));
  assert.strictEqual(s2.points, 5 + 4 + 1);                      // kept
  assert.strictEqual(s2.cards[0].covered, true);                 // same cards stay
});

t('covering all five cards -> five new cards and all five dice re-rolled', () => {
  const s = E.newTurn([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
  for (let i = 0; i < 5; i++) E.tryCover(s, [i], i);
  assert.strictEqual(s.points, 15);
  E.roll(s, seq([6]), () => [10, 11, 12, 13, 9]);
  assert.deepStrictEqual(s.cards.map(c => c.v), [10, 11, 12, 13, 9]);
  assert.ok(s.cards.every(c => !c.covered));
  assert.strictEqual(s.dice.length, 5);
  assert.ok(s.dice.every(d => !d.used));
});

t('re-roll only re-rolls the unused dice', () => {
  const s = E.newTurn([5, 20, 21, 22, 23], [2, 3, 6, 6, 6]);
  E.tryCover(s, [0, 1], 0);
  E.roll(s, seq([1]), () => []);
  assert.ok(s.dice[0].used && s.dice[1].used);
  assert.deepStrictEqual(s.dice.map(d => d.v).slice(2), [1, 1, 1]);
  assert.strictEqual(s.rollNo, 2);
  assert.strictEqual(s.coversThisRoll, 0);
});

t('a re-roll that cannot cover anything busts the whole turn (default rules)', () => {
  const s = E.newTurn([5, 20, 21, 22, 23], [2, 3, 6, 6, 6]);
  E.tryCover(s, [0, 1], 0);   // 5 points banked so far
  E.roll(s, seq([1]), () => []);
  assert.strictEqual(s.status, 'bust'); assert.strictEqual(s.score, 0);
});

t('sweepBanks switch: points up to the last sweep survive a bust', () => {
  const rules = { sweepBanks: true };
  const s = E.newTurn([2, 3, 20, 21, 22], [2, 3, 6, 6, 6], rules);
  E.tryCover(s, [0], 0); E.tryCover(s, [1], 1);  // 5 points
  E.tryCover(s, [2], 2) // 6 on 20? no
  assert.strictEqual(s.safe, 0);                 // no sweep yet
  const s2 = E.newTurn([2, 3, 20, 21, 22], [2, 3, 6, 6, 6], rules);
  E.tryCover(s2, [0], 0); E.tryCover(s2, [1], 1);
  assert.strictEqual(E.bust(s2).score, 0);
  // build a real sweep then bust
  const s3 = E.newTurn([2, 3, 4, 5, 6], [2, 3, 4, 5, 6], rules);
  for (let i = 0; i < 5; i++) E.tryCover(s3, [i], i);
  assert.strictEqual(s3.safe, 20);
  E.roll(s3, seq([1]), () => [30, 30, 30, 30, 30]);
  assert.strictEqual(s3.status, 'bust'); assert.strictEqual(s3.score, 20);
});

t('bestPlan prefers 4+4 on 8 (16) over 3+5 on 8 (8)', () => {
  const p = E.bestPlan([8, 30, 31, 32, 33], [4, 4, 3, 5, 6]);
  assert.strictEqual(p.points, 16);
  assert.deepStrictEqual(p.covers[0].dice.sort(), [0, 1]);
});

t('bestPlan finds the combination covering two cards at once', () => {
  const p = E.bestPlan([7, 11, 30, 31, 32], [3, 4, 5, 6, 1]);
  // 3+4 on 7 and 5+6 on 11 = 18 points using four dice
  assert.strictEqual(p.points, 18);
  assert.strictEqual(p.covers.length, 2);
});

t('bestPlan equals brute force on 300 random positions', () => {
  const rng = E.mulberry32(42);
  function brute(cards, dice) {
    const n = dice.length, m = cards.length;
    let best = 0;
    // every die -> a card index or -1
    const assign = new Array(n).fill(-1);
    (function rec(i) {
      if (i === n) {
        // each card gets one cover group; a card used by exactly its group
        let pts = 0;
        for (let c = 0; c < m; c++) {
          const vals = []; for (let d = 0; d < n; d++) if (assign[d] === c && dice[d] != null) vals.push(dice[d]);
          if (!vals.length) continue;
          if (cards[c] == null || sum(vals) !== cards[c]) return;
          pts += cards[c] * E.multiplier(vals);
        }
        if (pts > best) best = pts;
        return;
      }
      if (dice[i] == null) { assign[i] = -1; rec(i + 1); return; }
      for (let c = -1; c < m; c++) { assign[i] = c; rec(i + 1); }
    })(0);
    return best;
  }
  function sum(a) { return a.reduce((x, y) => x + y, 0); }
  for (let k = 0; k < 300; k++) {
    const cards = E.dealCards(rng, 5, 1, 13);
    const dice = E.rollDice(rng, 4);
    assert.strictEqual(E.bestPlan(cards, dice).points, brute(cards, dice), JSON.stringify({ cards, dice }));
  }
});

t('rollOutlook: probabilities are sane', () => {
  const s = E.newTurn([5, 6, 7, 8, 9], [2, 3, 6, 6, 6]);
  E.tryCover(s, [0, 1], 0);
  const o = E.rollOutlook(s);
  assert.ok(o.pBust >= 0 && o.pBust <= 1);
  assert.strictEqual(o.stopValue, 5 - 18);
  // one die left to roll against cards 6,7,8,9 -> only a 6 covers, so 5/6 bust
  const s2 = E.newTurn([5, 6, 20, 21, 22], [2, 3, 6, 1, 1]);
  E.tryCover(s2, [0, 1], 0); E.tryCover(s2, [3, 4], 1); // 2+3=5, then 1+1 = 2 not 6; fails
  const s3 = E.newTurn([5, 6, 20, 21, 22], [2, 3, 6, 6, 6]);
  E.tryCover(s3, [0, 1], 0); E.tryCover(s3, [2], 1);     // 6 on 6, two 6s left
  const o3 = E.rollOutlook(s3);
  // two dice vs cards 20,21,22: max sum 12 -> always bust
  assert.ok(Math.abs(o3.pBust - 1) < 1e-9);
});

t('rollOutlook: exact probability for a one-die roll', () => {
  const s = E.newTurn([5, 6, 20, 21, 22], [2, 3, 6, 6, 6]);
  E.tryCover(s, [0, 1], 0);
  // three 6-dice left rolled again: cards 6,20,21,22 -> compute independently
  const o = E.rollOutlook(s);
  let bust = 0, tot = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) {
    tot++;
    const p = E.bestPlan([null, 6, 20, 21, 22], [a, b, c]);
    if (!p.covers.length) bust++;
  }
  assert.ok(Math.abs(o.pBust - bust / tot) < 1e-9);
});

t('bot plays full turns without error across many seeds and skills', () => {
  for (let skill of [0.1, 0.5, 1]) {
    for (let seed = 1; seed < 60; seed++) {
      const rng = E.mulberry32(seed);
      const r = E.botTurn({ rng, skill, cards: E.dealCards(rng, 5, 1, 13), dealFn: () => E.dealCards(rng, 5, 1, 13) });
      assert.ok(Number.isFinite(r.score));
    }
  }
});

t('a better bot scores higher on average', () => {
  function avg(skill) {
    let tot = 0; const N = 150;
    for (let seed = 1; seed <= N; seed++) {
      const rng = E.mulberry32(seed * 7);
      tot += E.botTurn({ rng, skill, cards: E.dealCards(rng, 5, 1, 13), dealFn: () => E.dealCards(rng, 5, 1, 13) }).score;
    }
    return tot / N;
  }
  const lo = avg(0.2), hi = avg(1);
  console.log('    bot average per turn: skill 0.2 ->', lo.toFixed(1), ' skill 1.0 ->', hi.toFixed(1));
  assert.ok(hi > lo);
});

t('must keep covering: cannot roll or stop while a number card can still be covered', () => {
  const s = E.newTurn([7, 11, 30, 31, 32], [3, 4, 5, 6, 1]);
  E.tryCover(s, [0, 1], 0);                 // 3+4 on 7; 5+6 could still cover the 11
  assert.strictEqual(E.mustCover(s), true);
  assert.strictEqual(E.canStop(s), false);
  assert.strictEqual(E.canRoll(s), false);
  assert.strictEqual(E.stop(s), null);
  E.tryCover(s, [2, 3], 1);                 // 5+6 on 11
  assert.strictEqual(E.mustCover(s), false);
  assert.strictEqual(E.canStop(s), true);
});

t('wild cards: dealt as one of the five cards', () => {
  const rng = E.mulberry32(5);
  let wilds = 0, total = 0;
  for (let i = 0; i < 4000; i++) E.dealCards(rng, 5, 1, 13, 0.04).forEach(c => { total++; if (c === 'W') wilds++; });
  assert.ok(Math.abs(wilds / total - 0.04) < 0.01);
  assert.ok(E.dealCards(E.mulberry32(1), 5, 1, 13).every(c => typeof c === 'number')); // default: no wilds
});

t('wild: any dice cover it, it scores wildPoints, and it disappears', () => {
  const s = E.newTurn([30, 31, 'W', 32, 33], [6, 6, 5, 2, 1]);
  assert.strictEqual(s.status, 'rolled');             // not a bust: the wild can take dice
  const r = E.tryCover(s, [0], 2);                    // ONE die on the wild
  assert.ok(r.ok && r.wild); assert.strictEqual(r.pts, 0);
  assert.strictEqual(s.cards[2].covered, true);
  assert.strictEqual(E.tryCover(s, [1], 2).ok, false); // gone
  assert.ok(E.canStop(s) && E.canRoll(s));
});

t('wild: all dice on the wild -> re-roll all five, no penalty left over', () => {
  const s = E.newTurn([30, 31, 'W', 32, 33], [6, 6, 5, 2, 1]);
  const r = E.tryCover(s, [0, 1, 2, 3, 4], 2);
  assert.ok(r.ok); assert.strictEqual(r.sweep, 'dice');
  assert.strictEqual(E.leftoverSum(s), 0);
  E.roll(s, seq([3, 3, 3, 3, 3]), () => { throw new Error('no new cards expected'); });
  assert.ok(s.dice.every(d => !d.used && d.v === 3));
});

t('wild is optional: a wild never forces you to use it when numbers are covered', () => {
  const s = E.newTurn([7, 'W', 30, 31, 32], [3, 4, 6, 6, 6]);
  E.tryCover(s, [0, 1], 0);
  assert.strictEqual(E.mustCover(s), false);
  assert.ok(E.canStop(s));                           // may stop without touching the wild
});

t('wild counts as a card toward clearing the table', () => {
  const s = E.newTurn([1, 2, 'W', 4, 5], [1, 2, 4, 5, 6]);
  E.tryCover(s, [0], 0); E.tryCover(s, [1], 1); E.tryCover(s, [2], 3); E.tryCover(s, [3], 4);
  const last = E.tryCover(s, [4], 2);                // last die on the wild
  assert.ok(last.ok); assert.strictEqual(last.sweep, 'cards');
  E.roll(s, seq([2]), () => [9, 9, 9, 9, 9]);
  assert.deepStrictEqual(s.cards.map(c => c.v), [9, 9, 9, 9, 9]);
});

t('wild keeps a would-be bust alive; bestPlan ignores the wild; outlook sees no bust risk', () => {
  const none = E.newTurn([30, 31, 32, 33, 34], [1, 1, 1, 1, 1]);
  assert.strictEqual(none.status, 'bust');
  const withWild = E.newTurn([30, 31, 'W', 33, 34], [1, 1, 1, 1, 1]);
  assert.strictEqual(withWild.status, 'rolled');
  assert.strictEqual(E.bestPlan(E.cardVals(withWild), E.diceVals(withWild)).covers.length, 0);
  assert.ok(E.validCovers(E.cardVals(withWild), E.diceVals(withWild)).some(c => c.wild));
  E.tryCover(withWild, [0], 2);
  const o = E.rollOutlook(withWild);
  assert.ok(o.pBust > 0.99);                         // wild now spent: 4 ones vs 30+ cards busts
  const s2 = E.newTurn([5, 31, 'W', 33, 34], [2, 3, 6, 6, 6]);
  E.tryCover(s2, [0, 1], 0);
  assert.strictEqual(E.rollOutlook(s2).pBust, 0);    // wild still held: rolling cannot bust
});

t('bot handles hands with wilds', () => {
  for (let seed = 1; seed < 120; seed++) {
    const rng = E.mulberry32(seed);
    const r = E.botTurn({ rng, skill: seed % 2 ? 1 : 0.3, cards: E.dealCards(rng, 5, 1, 13, 0.3), dealFn: () => E.dealCards(rng, 5, 1, 13, 0.3) });
    assert.ok(Number.isFinite(r.score));
  }
});

t('levels: early levels assist, later ones do not', () => {
  assert.ok(E.LEVELS[0].assist && E.LEVELS[2].assist);
  assert.ok(!E.LEVELS[3].assist && !E.LEVELS[7].assist);
});

t("Ryan's example: pull the 1 and 3 off a 4, then two 2s on it scores doubled", () => {
  const s = E.newTurn([4, 30, 31, 32, 33], [1, 3, 2, 2, 6]);
  let r = E.tryCover(s, [0, 1], 0);                  // 1+3 on 4 = 4 points
  assert.strictEqual(r.pts, 4); assert.strictEqual(s.points, 4);
  const u = E.uncover(s, 0);                         // pull them off
  assert.deepStrictEqual(u.values, [1, 3]);
  assert.strictEqual(s.points, 0); assert.strictEqual(s.coversThisRoll, 0);
  assert.ok(!s.cards[0].covered && !s.dice[0].used && !s.dice[1].used);
  assert.strictEqual(s.scorecard.length, 0);
  assert.strictEqual(s.rolls[0].taken.length, 0);
  r = E.tryCover(s, [2, 3], 0);                      // two 2s on 4 = doubled = 8
  assert.strictEqual(r.pts, 8); assert.strictEqual(r.mult, 2);
  assert.strictEqual(s.points, 8);
  assert.strictEqual(E.multWord(2), 'DOUBLED'); assert.strictEqual(E.multWord(3), 'TRIPLED');
});

t('covers lock once you roll again or stop; locked covers cannot be undone', () => {
  const s = E.newTurn([5, 30, 31, 32, 33], [2, 3, 6, 6, 6]);
  E.tryCover(s, [0, 1], 0);
  assert.ok(s.cards[0].cover && !s.cards[0].cover.locked);
  E.roll(s, seq([1]), () => []);                     // Accept
  assert.ok(s.status === 'bust' || s.cards[0].cover.locked);
  assert.strictEqual(E.uncover(s, 0), null);
  const s2 = E.newTurn([5, 30, 31, 32, 33], [2, 3, 6, 6, 6]);
  E.tryCover(s2, [0, 1], 0); E.stop(s2);
  assert.strictEqual(E.uncover(s2, 0), null);        // turn is over
});

t('scorecard keeps every cover of the turn, even after the five cards are replaced', () => {
  const s = E.newTurn([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
  for (let i = 0; i < 5; i++) E.tryCover(s, [i], i);
  assert.strictEqual(s.scorecard.length, 5);
  E.roll(s, seq([6]), () => [6, 30, 31, 32, 33]);    // new cards; a 6 is on the table
  assert.strictEqual(s.scorecard.length, 5);         // old covers still listed
  assert.ok(s.scorecard.every(c => c.locked));
  E.tryCover(s, [0], 0);                             // 6 on 6
  assert.strictEqual(s.scorecard.length, 6);
  assert.strictEqual(s.scorecard.reduce((a, c) => a + c.pts, 0), 15 + 6);
  assert.strictEqual(s.points, 21);
});

t('uncover undoes a sweep so you cannot roll five new cards by mistake', () => {
  const s = E.newTurn([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
  for (let i = 0; i < 5; i++) E.tryCover(s, [i], i);
  assert.ok(s.cards.every(c => c.covered));
  E.uncover(s, 4);
  assert.ok(!s.cards.every(c => c.covered));
  assert.strictEqual(s.sweeps.length, 0);
  assert.strictEqual(s.points, 10);
});

t('levels: scoring is the players own from level 4 up', () => {
  assert.ok(!E.LEVELS[0].selfScore && !E.LEVELS[2].selfScore);
  assert.ok(E.LEVELS[3].selfScore && E.LEVELS[7].selfScore);
});

t('clock runs out: only covered cards count, nothing is finished for the player', () => {
  const s = E.newTurn([7, 11, 30, 31, 32], [3, 4, 5, 6, 1]);
  E.tryCover(s, [0, 1], 0);                 // 3+4 on 7; 5+6 could still cover the 11 but time ran out
  assert.strictEqual(E.mustCover(s), true);
  E.timeoutStop(s);
  assert.strictEqual(s.status, 'stopped'); assert.strictEqual(s.timedOut, true);
  assert.strictEqual(s.score, 7 - (5 + 6 + 1));   // 7 banked, minus the three unused dice
  assert.ok(!s.cards[1].covered);                  // the 11 was NOT covered for them
});

t('clock runs out with nothing covered: the turn scores 0', () => {
  const s = E.newTurn([7, 9, 10, 11, 13], [3, 4, 6, 5, 2]);
  E.timeoutStop(s);
  assert.strictEqual(s.status, 'bust'); assert.strictEqual(s.score, 0);
});

t('clock runs out after earlier rolls: all covered cards (locked and current) count', () => {
  const s = E.newTurn([5, 30, 31, 32, 33], [2, 3, 6, 6, 6]);
  E.tryCover(s, [0, 1], 0); E.roll(s, seq([1]), () => []);   // 5 locked; 3 dice re-rolled to 1s
  // 1+1+1 cannot cover 30+, so that roll busts; use a fresh turn where the re-roll can still cover
  const s2 = E.newTurn([5, 2, 30, 31, 32], [2, 3, 6, 6, 6]);
  E.tryCover(s2, [0, 1], 0);
  E.roll(s2, seq([2, 6, 6]), () => []);                       // dice: used, used, 2, 6, 6 -> a 2 is available for the 2 card
  assert.strictEqual(s2.status, 'rolled');
  E.timeoutStop(s2);
  assert.strictEqual(s2.score, 5 - (2 + 6 + 6));              // only the 5 counts; the 2 card was not covered in time
});

t('card numbers cap at 16', () => {
  assert.strictEqual(Math.max(...E.LEVELS.map(l => l.cardMax)), 16);
  assert.deepStrictEqual(E.LEVELS.map(l => l.cardMax), [9, 10, 11, 12, 13, 14, 15, 16]);
});

t('covering all five cards banks them: a later bust only loses the new set (Ryan, 2026-10-16)', () => {
  const s = E.newTurn([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
  for (let i = 0; i < 5; i++) E.tryCover(s, [i], i);                  // all five covered: 15 points banked
  assert.strictEqual(s.safe, 15);
  E.roll(s, seq([2, 3, 6, 6, 6]), () => [5, 30, 31, 32, 33]);        // new cards; dice 2,3,6,6,6
  E.tryCover(s, [0, 1], 0);                                          // 2+3 on 5: five new points, NOT banked
  assert.strictEqual(s.points, 20); assert.strictEqual(s.safe, 15);
  E.roll(s, seq([1]), () => []);                                     // remaining 6,6,6 re-roll to 1,1,1: nothing can be covered
  assert.strictEqual(s.status, 'bust');
  assert.strictEqual(s.score, 15);                                   // the banked 15 survives; the new 5 is lost
});

t('after a cleared set, stopping still subtracts the dice left, so the total can fall below the banked points', () => {
  const s = E.newTurn([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
  for (let i = 0; i < 5; i++) E.tryCover(s, [i], i);
  E.roll(s, seq([2, 3, 6, 6, 6]), () => [5, 30, 31, 32, 33]);
  E.tryCover(s, [0, 1], 0);
  E.stop(s);
  assert.strictEqual(s.score, 15 + 5 - 18);                         // 15 banked + 5 covered - three 6s unused
});

t('using up all five DICE does not bank by default (only clearing the cards does)', () => {
  const s = E.newTurn([5, 4, 1, 21, 22], [2, 3, 3, 1, 1]);
  E.tryCover(s, [0, 1], 0); E.tryCover(s, [2, 3], 1);
  const last = E.tryCover(s, [4], 2);
  assert.strictEqual(last.sweep, 'dice');
  assert.strictEqual(s.safe, 0);
  E.roll(s, seq([1, 1, 1, 1, 1]), () => []);                         // five fresh 1s cannot reach 21 or 22
  assert.strictEqual(s.status, 'bust'); assert.strictEqual(s.score, 0);
});

t('taking back the last cover of a cleared set also takes back its bank', () => {
  const s = E.newTurn([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
  for (let i = 0; i < 5; i++) E.tryCover(s, [i], i);
  assert.strictEqual(s.safe, 15);
  E.uncover(s, 4);
  assert.strictEqual(s.safe, 0);
  assert.strictEqual(E.bust(s).score, 0);
});

t('botNext plays whole turns one step at a time and always finishes', () => {
  for (const skill of [0.2, 0.6, 1]) {
    for (let seed = 1; seed < 80; seed++) {
      const rng = E.mulberry32(seed * 3);
      const st = E.newTurn(E.dealCards(rng, 5, 1, 13, 0.1), E.rollDice(rng, 5));
      let steps = 0;
      while (st.status === 'rolled' && steps++ < 300) {
        const a = E.botNext(st, { rng, skill, dealFn: () => E.dealCards(rng, 5, 1, 13, 0.1) });
        if (a.type === 'none') { E.bust(st); break; }
      }
      assert.notStrictEqual(st.status, 'rolled', 'bot did not finish, skill ' + skill + ' seed ' + seed);
      assert.ok(Number.isFinite(st.score));
    }
  }
});

t('Amit held to the clock: always finishes, every level scores about the same, and the clock does run out sometimes', () => {
  const res = {};
  for (let lvl = 1; lvl <= 8; lvl++) {
    const L = E.LEVELS[lvl - 1];
    let tot = 0, to = 0, bust = 0; const N = 400;
    for (let i = 1; i <= N; i++) {
      const rng = E.mulberry32(i * 17 + lvl);
      const r = E.amitTurn(lvl, rng, E.dealCards(rng, 5, L.cardMin, L.cardMax, 0.04), () => E.dealCards(rng, 5, L.cardMin, L.cardMax, 0.04));
      assert.ok(Number.isFinite(r.score));
      tot += r.score; if (r.timedOut) to++; if (r.status === 'bust') bust++;
    }
    res[lvl] = { avg: tot / N, to: 100 * to / N, bust: 100 * bust / N };
  }
  console.log('    Amit per turn by level (avg score / % clock ran out / % bust):');
  for (let lvl = 1; lvl <= 8; lvl++) console.log('      L' + lvl + ': ' + res[lvl].avg.toFixed(1) + ' / ' + res[lvl].to.toFixed(0) + '% / ' + res[lvl].bust.toFixed(0) + '%');
  assert.strictEqual(res[1].to, 0);                 // level 1 has no clock
  for (let lvl = 2; lvl <= 8; lvl++) assert.ok(Math.abs(res[lvl].avg - res[1].avg) < 0.3 * res[1].avg, 'level ' + lvl + ' should score about what level 1 scores');     // the clocks are solved so every level scores about the same
  assert.ok(res[5].to > 0 || res[8].to > 0);
});

t('experience for a finish: one point per opponent beaten for first place, scaled down to 0 for last (Ryan, 2026-10-16)', () => {
  assert.strictEqual(E.placeXp(1, 2), 1);        // beat one person
  assert.strictEqual(E.placeXp(2, 2), 0);        // second of two: nothing
  assert.strictEqual(E.placeXp(1, 8), 7);        // beat seven people
  assert.strictEqual(E.placeXp(8, 8), 0);
  assert.deepStrictEqual([1, 2, 3].map(p => E.placeXp(p, 3)), [2, 1, 0]);   // second of three is half of first
  assert.strictEqual(E.placeXp(1, 4, 0.25), 0.75);                           // Amit opponents count at a quarter
  assert.strictEqual(E.placeXp(1, 1), 0);        // solo play earns nothing
});

// ───────────── the stages (Ryan, 2026-10-16) ─────────────
const R = (stage, lvl) => E.rulesFor(stage, lvl);
const items = (...pairs) => pairs.map(p => ({ v: p[0], op: p[1] }));

t('stage rules: each stage turns on its own sign and every sign before it, and requires its own', () => {
  assert.deepStrictEqual(E.STAGES.addition.ops, ['+']);
  assert.deepStrictEqual(E.STAGES.subtraction.ops, ['+', '−']);
  assert.deepStrictEqual(E.STAGES.multiplication.ops, ['+', '−', '×']);
  assert.deepStrictEqual(E.STAGES.division.ops, ['+', '−', '×', '÷']);
  assert.deepStrictEqual(E.STAGE_ORDER.map(s => E.STAGES[s].required), [null, '−', '×', '÷']);
  assert.deepStrictEqual(E.STAGE_ORDER.map(s => E.STAGES[s].faces), [6, 10, 10, 10]);
});

t("Ryan's example: 10 - 1 + 1 covers a 10 in subtraction, and a cover with no minus is refused", () => {
  const r = Object.assign({}, R('subtraction', 1), { required: '−' });      // the old per-cover rule, still supported by the evaluator
  const ok = E.evalItems(items([10, '+'], [1, '−'], [1, '+']), r);
  assert.ok(ok.ok); assert.strictEqual(ok.value, 10);
  const noMinus = E.evalItems(items([4, '+'], [6, '+']), r);
  assert.strictEqual(noMinus.ok, false); assert.strictEqual(noMinus.reason, 'required');
  assert.strictEqual(E.evalItems(items([4, '+'], [6, '×']), r).reason, 'sign');     // x is not on in subtraction
});

t('order of operations: x and / before + and -  (2 + 3 x 4 = 14, 20 - 12 / 4 = 17)', () => {
  assert.strictEqual(E.evalItems(items([2, '+'], [3, '+'], [4, '×']), R('multiplication', 1)).value, 14);
  assert.strictEqual(E.evalItems(items([20, '+'], [12, '−'], [4, '÷']), R('division', 1)).value, 17);
  assert.strictEqual(E.evalItems(items([2, '+'], [3, '×'], [4, '×']), R('multiplication', 1)).value, 24);     // 2 x 3 x 4: the first die starts the chain
  assert.strictEqual(E.evalItems(items([2, '+'], [3, '+'], [4, '×'], [5, '×']), R('multiplication', 1)).value, 62);   // 2 + (3 x 4 x 5)
});

t('division must come out whole; a cover needs a division in the division stage', () => {
  const r = Object.assign({}, R('division', 1), { required: '÷' });
  assert.strictEqual(E.evalItems(items([12, '+'], [4, '÷']), r).value, 3);
  assert.strictEqual(E.evalItems(items([7, '+'], [2, '÷']), r).reason, 'divide');
  assert.strictEqual(E.evalItems(items([3, '+'], [4, '×']), r).reason, 'required');     // a times is not a divide
  assert.strictEqual(E.evalItems(items([12, '+'], [3, '÷'], [2, '×']), r).value, 8);   // chain left to right: (12/3)x2
});

t('negatives: not at the lower levels, allowed from level 5 (even a leading minus)', () => {
  const low = R('subtraction', 4), high = R('subtraction', 5);
  const dips = items([3, '+'], [8, '−'], [9, '+']);            // 3 - 8 + 9: the running total goes to -5 on the way
  assert.strictEqual(E.evalItems(dips, low).reason, 'negative');
  assert.strictEqual(E.evalItems(dips, high).value, 4);
  const lead = items([3, '−'], [10, '+']);                      // -3 + 10
  assert.strictEqual(E.evalItems(lead, low).reason, 'start');
  assert.strictEqual(E.evalItems(lead, high).value, 7);
  assert.strictEqual(E.evalItems(items([9, '+'], [8, '−'], [3, '+']), low).value, 4);      // plus first: fine at any level
});

t('tryCover in a stage: builds the expression in the order given, scores the card value, refuses a wrong sign', () => {
  const s = E.newTurn([10, 30, 31, 32, 33], [10, 1, 1, 6, 2], R('subtraction', 1));
  assert.strictEqual(s.status, 'rolled');
  assert.strictEqual(E.tryCover(s, [0, 1, 2], 0).ok, false);                       // no signs given = all plus = 12, and no minus
  const r = E.tryCover(s, [0, 1, 2], 0, ['+', '−', '+']);                          // 10 - 1 + 1
  assert.ok(r.ok); assert.strictEqual(r.pts, 10); assert.strictEqual(r.mult, 1);
  assert.strictEqual(s.cards[0].cover.expr, '10 − 1 + 1');
  assert.strictEqual(s.points, 10);
  assert.strictEqual(E.leftoverSum(s), 8);                                          // 6 and 2 unused
});

t('the matching-dice multiplier belongs to addition only', () => {
  const add = E.newTurn([8, 30, 31, 32, 33], [4, 4, 3, 5, 6]);
  assert.strictEqual(E.tryCover(add, [0, 1], 0).pts, 16);                           // addition: doubled
  const sub = E.newTurn([8, 30, 31, 32, 33], [4, 4, 3, 5, 6], R('subtraction', 1));
  const r = E.tryCover(sub, [3, 2, 0], 0, ['+', '+', '−']);                          // 5 + 3 ... wait, this is 5+3-4 = 4, not 8
  assert.strictEqual(r.ok, false);
  const r2 = E.tryCover(sub, [4, 0, 2], 0, ['+', '+', '−']);                         // 6 + 4 - 3 = 7, not 8
  assert.strictEqual(r2.ok, false);
  const r3 = E.tryCover(sub, [4, 3, 2], 0, ['+', '+', '−']);                         // 6 + 5 - 3 = 8
  assert.ok(r3.ok); assert.strictEqual(r3.pts, 8);
});

t('solver is sound: every cover it offers re-checks with an independent JavaScript calculation', () => {
  const sym = { '+': '+', '−': '-', '×': '*', '÷': '/' };
  for (const stage of ['subtraction', 'multiplication', 'division']) {
    const rules = R(stage, 5);
    const rng = E.mulberry32(11);
    for (let g = 0; g < 25; g++) {
      const dice = E.rollDice(rng, 4, 10);
      const sets = E.stageSets(dice, rules);
      for (let mask = 0; mask < sets.length; mask++) {
        for (const v of sets[mask]) {
          const idx = []; for (let i = 0; i < 4; i++) if (mask & (1 << i)) idx.push(i);
          const ex = E.stageExpr(dice, idx, v, rules);
          assert.ok(ex, stage + ' no expression for ' + v);
          const text = ex.dice.map((di, k) => (k ? sym[ex.ops[k]] : '') + dice[di]).join('');
          assert.strictEqual(Function('return ' + text)(), v, stage + ': ' + text);
        }
      }
    }
  }
});

t('solver is complete for multiplication on three dice, any cover allowed (compared with a separate brute force using JavaScript precedence)', () => {
  const rules = R('multiplication', 5), rng = E.mulberry32(21);
  for (let g = 0; g < 30; g++) {
    const dice = E.rollDice(rng, 3, 10);
    const got = new Set(); E.stageSets(dice, rules).forEach(s => s.forEach(v => got.add(v)));
    const want = new Set();
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const opsList = ['+', '-', '*'];
    for (const mask of [3, 5, 6, 7]) {
      const idx = []; for (let i = 0; i < 3; i++) if (mask & (1 << i)) idx.push(i);
      const k = idx.length;
      const ordersOf = k === 2 ? [[0, 1], [1, 0]] : perms;
      for (const o of ordersOf) {
        const combos = k === 2 ? opsList.map(x => [x]) : opsList.flatMap(a => opsList.map(b => [a, b]));
        for (const c of combos) {
          const text = o.map((p, i) => (i ? c[i - 1] : '') + dice[idx[p]]).join('');
          const val = Function('return ' + text)();
          if (val >= 1) want.add(val);
        }
      }
    }
    assert.deepStrictEqual([...got].sort((x, y) => x - y), [...want].sort((x, y) => x - y), JSON.stringify(dice));
  }
});

t('bestPlan and validCovers work in a stage, and a wild still saves a roll', () => {
  const rules = R('subtraction', 1);
  const cards = [10, 12, 30, 31, 32], dice = [10, 1, 1, 6, 2];
  const vc = E.validCovers(cards, dice, rules);
  assert.ok(vc.some(c => !c.wild && c.sum === 10));
  const plan = E.bestPlan(cards, dice, rules);
  assert.ok(plan.covers.length >= 1);
  assert.strictEqual(plan.points, plan.covers.reduce((a, c) => a + c.pts, 0));
  const stuck = E.newTurn([40, 41, 'W', 43, 44], [1, 1, 1, 1, 1], rules);
  assert.strictEqual(stuck.status, 'rolled');                                       // nothing can make 40+, but the wild keeps the turn alive
  const dead = E.newTurn([40, 41, 42, 43, 44], [1, 1, 1, 1, 1], rules);
  assert.strictEqual(dead.status, 'bust');
});

t('stages: dice have ten faces, the outlook is estimated, and Amit finishes turns in every stage', () => {
  const rng = E.mulberry32(3); let max = 0;
  for (let i = 0; i < 400; i++) max = Math.max(max, E.rollDie(rng, 10));
  assert.strictEqual(max, 10);
  for (const stage of ['subtraction', 'multiplication', 'division']) {
    const lv = E.levelsFor(stage)[2];
    const rules = R(stage, 3);
    for (let seed = 1; seed < 15; seed++) {
      const rg = E.mulberry32(seed * 5);
      const r = E.amitTurn(3, rg, E.dealCards(rg, 5, lv.cardMin, lv.cardMax, 0.04), () => E.dealCards(rg, 5, lv.cardMin, lv.cardMax, 0.04), rules);
      assert.ok(Number.isFinite(r.score), stage);
    }
    const s = E.newTurn(E.dealCards(E.mulberry32(9), 5, 1, lv.cardMax, 0), E.rollDice(E.mulberry32(8), 5, 10), rules);
    if (s.status === 'rolled') {
      const first = E.botPlan(s, { rng: E.mulberry32(1), skill: 1, dealFn: () => [1, 2, 3, 4, 5] });
      if (first.type === 'cover') { const ok = E.botApply(s, first, { rng: E.mulberry32(1) }); assert.ok(s.points > 0, stage + ' bot cover did not score'); }
      const o = E.rollOutlook(s);
      if (o && !o.fresh) { assert.ok(o.estimated); assert.ok(o.pBust >= 0 && o.pBust <= 1); }
    }
  }
});

t('levelsFor: addition tops climb 9 to 16; later stages have their own tops and stretched clocks', () => {
  assert.deepStrictEqual(E.levelsFor('addition').map(l => l.cardMax), [9, 10, 11, 12, 13, 14, 15, 16]);
  assert.deepStrictEqual(E.levelsFor('subtraction').map(l => l.cardMax), [12, 14, 16, 18, 20, 22, 24, 26]);
  assert.deepStrictEqual(E.levelsFor('multiplication').map(l => l.cardMax), [30, 40, 50, 60, 70, 80, 90, 100]);
  assert.deepStrictEqual(E.levelsFor('division').map(l => l.cardMax), [24, 28, 32, 36, 40, 44, 50, 60]);
  assert.strictEqual(E.levelsFor('addition')[1].clock, 190);
  assert.ok(E.levelsFor('multiplication')[1].clock > E.levelsFor('multiplication')[7].clock);     // clocks shrink as the level rises
  assert.strictEqual(E.levelsFor('subtraction')[0].clock, 0);
});

t('levelFor maps xp to levels', () => {
  assert.strictEqual(E.levelFor(0).lvl, 1);
  assert.strictEqual(E.levelFor(3.9).lvl, 1);
  assert.strictEqual(E.levelFor(4).lvl, 2);
  assert.strictEqual(E.levelFor(89).lvl, 7);
  assert.strictEqual(E.levelFor(90).lvl, 8);
  assert.strictEqual(E.levelFor(99999).lvl, 8);
});

console.log('\n' + n + ' tests passed');

t('the stage sign is needed once per five cards, not in every cover', () => {
  const r = R('subtraction', 6);
  assert.strictEqual(r.required, null); assert.strictEqual(r.turnSign, '−');
  const st = E.newTurn([8, 5, 20, 30, 40], [3, 5, 2, 7, 10], r);
  assert.ok(E.tryCover(st, [0, 1], 0, ['+', '+']).ok);            // 3 + 5 = 8: a plain addition cover is allowed
  assert.strictEqual(E.needSign(st), true);
  assert.ok(E.tryCover(st, [3, 2], 1, ['+', '−']).ok);            // 7 - 2 = 5 uses the minus: one is enough for the set
  assert.strictEqual(E.needSign(st), false);
  assert.strictEqual(E.mustCover(st), false);                     // only the 10 is left
  assert.strictEqual(E.canStop(st), true);
});

t('banking waits for the stage sign; a timeout without it scores nothing', () => {
  const r = R('multiplication', 6);
  const mk = () => E.newTurn([8, 40, 41, 42, 43], [3, 5, 1, 1, 1], r);
  const st = mk();
  assert.ok(E.tryCover(st, [0, 1], 0, ['+', '+']).ok);            // 3 + 5 = 8, no times
  assert.strictEqual(E.canRoll(st), true);                         // may roll on...
  assert.strictEqual(E.canStop(st), false);                        // ...but cannot bank yet
  assert.strictEqual(E.stop(st), null);
  const t2 = mk(); E.tryCover(t2, [0, 1], 0, ['+', '+']);
  E.timeoutStop(t2);
  assert.strictEqual(t2.score, 0); assert.strictEqual(t2.noSign, true);
  const t3 = E.newTurn([15, 40, 41, 42, 43], [3, 5, 1, 1, 1], r);
  assert.ok(E.tryCover(t3, [0, 1], 0, ['+', '×']).ok);            // 3 x 5 = 15 uses the times
  assert.strictEqual(E.canStop(t3), true);
  assert.strictEqual(E.stop(t3).score, 15 - 3);                    // three 1s left over
});

t('clearing all five cards without the sign scores nothing for that set; a new set owes the sign again', () => {
  const r = R('subtraction', 6);
  const st = E.newTurn([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], r);
  for (let i = 0; i < 4; i++) assert.ok(E.tryCover(st, [i], i, ['+']).ok);
  const last = E.tryCover(st, [4], 4, ['+']);
  assert.strictEqual(last.sweep, 'cards'); assert.strictEqual(last.forfeit, true);
  assert.strictEqual(st.points, 0); assert.strictEqual(st.safe, 0);
  assert.ok(st.scorecard.every(c => c.forfeited));
  // taking the last cover back restores the points
  E.uncover(st, 4);
  assert.strictEqual(st.points, 1 + 2 + 3 + 4);
  assert.ok(st.scorecard.every(c => !c.forfeited));
  E.tryCover(st, [4], 4, ['+']);
  E.roll(st, E.mulberry32(5), () => [9, 9, 9, 9, 9]);
  assert.strictEqual(st.setNo, 2); assert.strictEqual(E.needSign(st), true);
});

t('Amit goes after the stage sign and never banks without it', () => {
  ['subtraction', 'multiplication', 'division'].forEach(stage => {
    let banked = 0, withoutSign = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const rng = E.mulberry32(seed), rules = E.rulesFor(stage, 6);
      const dealFn = () => E.dealCards(rng, 5, 1, E.levelsFor(stage)[5].cardMax, 0);
      const st = E.newTurn(dealFn(), E.rollDice(rng, 5, rules.faces), rules);
      const opts = { rng, skill: 0.9, dealFn };
      let g = 0;
      while (st.status === 'rolled' && g++ < 200) { const a = E.botPlan(st, opts); if (a.type === 'none') { E.bust(st); break; } E.botApply(st, a, opts); }
      if (st.status === 'stopped') { banked++; if (!st.signUsed) withoutSign++; }
    }
    assert.ok(banked > 3, stage + ' bot banked ' + banked);
    assert.strictEqual(withoutSign, 0, stage + ' banked without the sign');
  });
});

t('all-signs bonus: every sign of the stage on a later die; the first die plus does not count; none in addition', () => {
  const sub = R('subtraction', 6), mul = R('multiplication', 6), div = R('division', 6), add = R('addition', 6);
  assert.strictEqual(E.isBonus(items([8, '+'], [5, '+'], [2, '−']), sub), true);       // 8 + 5 - 2: a plus and a minus after the first die
  assert.strictEqual(E.isBonus(items([9, '+'], [2, '−']), sub), false);                // 9 - 2: the plus is only the invisible first one
  assert.strictEqual(E.isBonus(items([8, '+'], [5, '+'], [2, '−']), mul), false);      // multiplication also needs a times
  assert.strictEqual(E.isBonus(items([2, '+'], [7, '+'], [3, '−'], [8, '×']), mul), true);
  assert.strictEqual(E.isBonus(items([2, '+'], [7, '+'], [3, '−'], [8, '×'], [4, '÷']), div), true);
  assert.strictEqual(E.isBonus(items([2, '+'], [7, '+'], [3, '−'], [8, '×']), div), false);   // division needs all four
  assert.strictEqual(E.isBonus(items([2, '+'], [3, '+'], [4, '+']), add), false);      // addition never has one
  // the solver finds one when it exists
  const ex = E.stageBonusExpr([2, 7, 3, 8, 4], [0, 1, 2, 3, 4], 3, div);
  assert.ok(ex); assert.strictEqual(E.isBonus(ex.ops.map((o, i) => ({ v: 1, op: o })), div), true);
  assert.strictEqual(E.stageBonusExpr([2, 7], [0, 1], 9, sub), null);                   // two dice cannot hold three roles
});

t('a bonus cover earns a wild: carried to the next turn on banking, and handed to the next set when all five are cleared', () => {
  const r = R('subtraction', 6);
  const st = E.newTurn([11, 40, 41, 42, 43], [8, 5, 2, 9, 9], r);
  const res = E.tryCover(st, [0, 1, 2], 0, ['+', '+', '−']);                            // 8 + 5 - 2 = 11
  assert.ok(res.ok); assert.strictEqual(res.bonus, true); assert.strictEqual(st.setBonus, true);
  assert.strictEqual(E.stop(st).bonusNext, true);
  // no bonus, no carry
  const plain = E.newTurn([3, 40, 41, 42, 43], [8, 5, 2, 9, 9], r);
  E.tryCover(plain, [1, 2], 0, ['+', '−']);                                              // 5 - 2 = 3, not a bonus
  assert.strictEqual(plain.setBonus, false); assert.strictEqual(E.stop(plain).bonusNext, false);
  // taking the cover back removes the bonus
  const back = E.newTurn([11, 40, 41, 42, 43], [8, 5, 2, 9, 9], r);
  E.tryCover(back, [0, 1, 2], 0, ['+', '+', '−']); E.uncover(back, 0);
  assert.strictEqual(back.setBonus, false);
  // clearing all five cards deals the next set with a request for a wild
  const clr = E.newTurn([11, 40, 41, 42, 43], [8, 5, 2, 9, 9], r);
  E.tryCover(clr, [0, 1, 2], 0, ['+', '+', '−']);
  clr.cards.forEach(c => { c.covered = true; }); clr.dice.forEach(d => { d.used = true; });
  let asked = null;
  E.roll(clr, E.mulberry32(3), w => { asked = w; return [1, 2, 3, 4, 5]; });
  assert.strictEqual(asked, true); assert.strictEqual(clr.setBonus, false);
});

t('a wild card cannot earn the bonus', () => {
  const r = R('subtraction', 6);
  const st = E.newTurn(['W', 40, 41, 42, 43], [8, 5, 2, 9, 9], r);
  const res = E.tryCover(st, [0, 1, 2], 0, ['+', '+', '−']);
  assert.ok(res.ok); assert.ok(!res.bonus); assert.strictEqual(st.setBonus, false);
});

t('the earned wild is marked as the bonus wild when the dealer says which card it is', () => {
  const r = R('subtraction', 6);
  const st = E.newTurn([8, 5, 2, 9, 9], [1, 2, 3, 4, 5], r);
  assert.ok(st.cards.every(c => !c.bonus));
  const dealt = [3, 'W', 4, 5, 6]; dealt.bonusIdx = 1;
  const t2 = E.newTurn(dealt, [1, 2, 3, 4, 5], r);
  assert.deepStrictEqual(t2.cards.map(c => !!c.bonus), [false, true, false, false, false]);
  // the same through a mid-turn re-deal
  const t3 = E.newTurn([11, 40, 41, 42, 43], [8, 5, 2, 9, 9], r);
  E.tryCover(t3, [0, 1, 2], 0, ['+', '+', '−']);
  t3.cards.forEach(c => { c.covered = true; }); t3.dice.forEach(d => { d.used = true; });
  E.roll(t3, E.mulberry32(3), w => { const a = [1, 2, 3, 4, 5]; if (w) { a[2] = 'W'; a.bonusIdx = 2; } return a; });
  assert.strictEqual(t3.cards[2].v, 'W'); assert.strictEqual(t3.cards[2].bonus, true); assert.strictEqual(t3.cards[0].bonus, false);
});

t('all five dice on one card is flagged (a time bonus), wild included, and taking it back un-flags it', () => {
  const r = R('subtraction', 6);
  const st = E.newTurn([11, 40, 41, 42, 43], [8, 5, 2, 1, 1], r);
  assert.strictEqual(st.fiveDiceCovers, 0);
  const res = E.tryCover(st, [0, 1, 2, 3, 4], 0, ['+', '+', '−', '+', '−']);              // 8 + 5 - 2 + 1 - 1 = 11, all five dice
  assert.ok(res.ok); assert.strictEqual(res.timeBonus, true); assert.strictEqual(st.fiveDiceCovers, 1);
  E.uncover(st, 0); assert.strictEqual(st.fiveDiceCovers, 0);
  const w = E.newTurn(['W', 40, 41, 42, 43], [8, 5, 2, 1, 1], r);
  assert.strictEqual(E.tryCover(w, [0, 1, 2, 3, 4], 0).timeBonus, true);                   // a wild with every die counts
  const four = E.newTurn([14, 40, 41, 42, 43], [8, 5, 2, 1, 1], r);
  assert.ok(!E.tryCover(four, [0, 1, 2, 3], 0, ['+', '+', '−', '+']).timeBonus);           // four dice do not
});

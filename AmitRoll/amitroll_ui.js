/* AmitRoll screens — v0.02
 * Everything the player sees. All game rules live in amitroll_engine.js;
 * this file only draws, animates, and keeps the player's progress.
 *
 * HONEST STATE (2026-10-15): progress is saved in THIS BROWSER only
 * (localStorage). The Rol_ database tables, friends, invites, live play,
 * watching other players' hands, and stealing missed points are the next
 * stages; the pages for them say so plainly.
 */
(function () {
  'use strict';
  const E = AmitRollEngine;
  // A game goes on until someone reaches the target score (Ryan, 2026-10-16: "we've been playing at 500"), so it can take five rounds or twenty.
  const TARGETS = [100, 250, 500];
  const DEFAULT_TARGET = 500;
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
  const fmtXp = x => Math.round(x * 100) / 100;
  const AMIT_XP_FACTOR = 0.25;      // Ryan: a game against Amit counts "at a very reduced amount"
  const WILD_CHANCE = E.DEFAULT_RULES.wildChance;
  const PROFILE_KEY = 'amitroll_profile_v1';
  const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  const isWild = v => v === 'W';

  const $ = id => document.getElementById(id);
  const qs = s => document.querySelector(s);

  // ── profile (this browser only, for now) ───────────────
  function loadProfile() {
    try {
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      if (p && typeof p.xp === 'number') {
        if (p.xpUnit !== 2 && p.xpUnit !== 3) p.xp = 0;      // experience changed to finishing places on 2026-10-16: older points do not carry over
        if (!p.xps) p.xps = { addition: p.xp || 0, subtraction: 0, multiplication: 0, division: 0 };   // experience is kept per stage
        p.xpUnit = 3;
        if (!p.stage || !E.STAGES[p.stage]) p.stage = 'addition';
        return p;
      }
    } catch (e) {}
    return { xp: 0, xps: { addition: 0, subtraction: 0, multiplication: 0, division: 0 }, xpUnit: 3, stage: 'addition', games: [], timing: [], muted: false };
  }
  function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(P)); } catch (e) {} }
  let P = loadProfile();
  // The stage being played or chosen (Ryan, 2026-10-16): Addition, Subtraction, Multiplication, Division. Choosing a stage turns on its signs
  // and every sign before it. Experience and level are kept per stage.
  let curStage = P.stage;
  const stageOf = () => (G ? G.stageName : curStage);
  const stageXp = s => (P.xps && P.xps[s || stageOf()]) || 0;
  const levelsOf = s => E.levelsFor(s || stageOf());
  const myLevel = () => levelsOf()[E.levelFor(stageXp()).lvl - 1];
  const levelObj = n => levelsOf()[Math.max(0, Math.min(E.LEVELS.length - 1, n - 1))];
  const curFaces = () => E.STAGES[stageOf()].faces;
  const isOpStage = () => stageOf() !== 'addition';

  let G = null;            // the game in progress
  let CH = null;           // a challenge arrived by link
  let sel = new Set();     // dice currently selected (tap), in the order they were picked
  let selOp = {};          // the sign each picked die carries (later stages)
  let curOp = '+';         // the sign key last pressed: it sticks to every die picked after it
  let clockIv = null;
  let learnStep = 0;

  // ── sound (tiny, optional) ─────────────────────────────
  let ac = null;
  function tone(freq, t0, dur, type, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, ac.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + 0.02);
  }
  function snd(kind) {
    if (P.muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (kind === 'roll') for (let i = 0; i < 7; i++) tone(180 + Math.random() * 220, i * 0.08, 0.05, 'square', 0.05);
      else if (kind === 'cover') { tone(660, 0, 0.14, 'sine', 0.14); tone(990, 0.1, 0.22, 'sine', 0.12); }
      else if (kind === 'bust') { tone(140, 0, 0.35, 'sawtooth', 0.12); tone(100, 0.2, 0.4, 'sawtooth', 0.1); }
      else if (kind === 'sweep') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, 'triangle', 0.13));
      else if (kind === 'bad') tone(220, 0, 0.18, 'square', 0.07);
    } catch (e) {}
  }

  // ── small builders ─────────────────────────────────────
  function pipsHtml(v, faces) {
    if ((faces || curFaces()) > 6) return '<b class="num">' + v + '</b>';     // ten-sided dice show numerals
    const on = PIPS[v] || [];
    let h = '';
    for (let c = 1; c <= 9; c++) h += '<i class="' + (on.indexOf(c) >= 0 ? 'on' : '') + '"></i>';
    return h;
  }
  function dieStatic(v, faces) { return '<div class="ar-die" data-v="' + v + '">' + pipsHtml(v, faces) + '</div>'; }
  const die6 = v => dieStatic(v, 6), die10 = v => dieStatic(v, 10);
  function cardStatic(v) {
    if (isWild(v)) return '<div class="ar-card wild"><div class="face"><span class="wj">🃏</span><span class="wt">WILD</span></div></div>';
    return '<div class="ar-card"><div class="face"><small>' + v + '</small>' + v + '<small class="br">' + v + '</small></div></div>';
  }
  function setPips(el, v) { el.setAttribute('data-v', v); el.innerHTML = pipsHtml(v); }
  const plus = vals => vals.join(' + ');
  const assistOn = () => !!(G && (G.practice || G.level.assist));
  // from level 4 up Amit stops keeping score; the player adds up their own turn (Ryan, 2026-10-15)
  const selfOn = () => !!(G && !G.practice && G.level.selfScore);

  // ── page shell (called by the template's renderAllPages) ─
  const PAGES = [
    { id: 1, icon: '🎲', name: 'Practice', sub: 'Ready, Set, Roll!' },
    { id: 2, icon: '🎓', name: 'Learn', sub: 'With Amit' },
    { id: 3, icon: '👥', name: 'Friends & Games', sub: 'Invite · Challenge' },
    { id: 4, icon: '📈', name: 'Progress', sub: 'Level · History' }
  ];
  function navHtml() {
    return PAGES.map((p, i) =>
      '<div class="page-nav' + (i === 0 ? ' active' : '') + '" id="page-' + p.id + '" onclick="openPage(' + p.id + ')" data-tip="' + p.name + '">' +
      '<div class="page-icon">' + p.icon + '</div><div class="page-info"><div class="page-name">' + p.name + '</div><div class="page-sub">' + p.sub + '</div></div></div>'
    ).join('');
  }
  function detailHtml() {
    return PAGES.map((p, i) =>
      '<div class="detail' + (i === 0 ? ' active' : '') + '" id="detail-' + p.id + '"><div class="detail-head"><span class="detail-heading">' + p.name + '</span></div>' +
      '<div class="ar-wrap" id="ar-' + p.id + '"></div></div>'
    ).join('');
  }
  function afterRender() {
    readChallenge();
    renderPlay(); renderLearn(); renderFriends(); renderProgress();
    updateContext();
  }
  function updateContext() {
    const c = $('pageContext'), s = $('pageContextSub');
    const L = G ? G.level : myLevel();
    if (c) c.textContent = E.STAGES[stageOf()].name + ' · Level ' + L.lvl;
    if (s) s.textContent = G ? (G.practice ? 'TUTORIAL' : 'ROUND ' + G.round + ' · FIRST TO ' + G.target) : 'AMITROLL';
  }

  // ── challenge links (everyone is dealt their OWN cards, so a link carries only the level) ──
  function readChallenge() {
    try {
      const u = new URLSearchParams(location.search);
      const l = parseInt(u.get('challenge'), 10), st = u.get('stage');
      if (l) CH = { lvl: Math.max(1, Math.min(E.LEVELS.length, l)), stage: E.STAGES[st] ? st : 'addition' };
    } catch (e) {}
  }
  function challengeUrl(lvl, stage) { return location.origin + location.pathname + '?challenge=' + lvl + (stage && stage !== 'addition' ? '&stage=' + stage : ''); }
  function copyText(txt, msgId) {
    const done = ok => { const m = $(msgId); if (m) m.textContent = ok ? 'Link copied. Send it to your friend.' : 'Copy this link: ' + txt; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => done(true), () => done(false));
    else done(false);
  }

  // ── PLAY page ──────────────────────────────────────────
  // The four sign keys (Ryan, 2026-10-16). Only the stage's signs are lit. In the later stages a lit sign is a button: press it, then tap or
  // drag dice, and the sign sticks to every die after it until another sign is pressed. Addition's only sign is +, so its key is just shown.
  const STAGE_BLURB = {
    addition: 'Dice 1–6. Covers add up, and matching dice multiply the card.',
    subtraction: 'Dice 1–10. Use a − at least once in each set of five cards, or that set scores nothing.',
    multiplication: 'Dice 1–10. Use a × at least once in each set of five cards, or that set scores nothing. + and − work too.',
    division: 'Dice 1–10. Use a ÷ at least once in each set of five cards (it must come out even), or that set scores nothing. All four signs work.'
  };
  // "÷ needed" until the stage's sign has been used in this set of five cards
  function needChip() {
    if (!G || !G.turn || !G.rules.turnSign) return '';
    const sg = G.rules.turnSign, owed = E.needSign(G.turn);
    return '<div class="ar-need ' + (owed ? 'owed' : 'done') + '" title="' + (owed ? 'Use this sign at least once in these five cards before you can bank' : 'Done: you can bank this set') + '">' + sg + (owed ? ' needed' : ' ✓') + '</div>';
  }
  function opKeysHtml(cls) {
    const on = E.STAGES[stageOf()].ops;
    const live = cls !== 'small' && G && isOpStage();
    return '<div class="ar-ops ' + (cls || '') + '">' + ['+', '−', '×', '÷'].map(o => {
      const lit = on.indexOf(o) >= 0;
      return '<div class="ar-op ' + (lit ? 'on' : 'off') + (live && lit && o === curOp ? ' cur' : '') + '"' +
        (live && lit ? ' onclick="AR.setOp(\'' + o + '\')"' : '') +
        ' title="' + (lit ? (live ? 'Press this, then pick dice: the sign sticks until you press another' : 'Used in this stage') : 'Not used in this stage') + '">' + o + '</div>';
    }).join('') +
      (cls === 'small' ? '' : '<div class="ar-op clear" onclick="AR.clearBuild()" title="Clear: take back the dice you have picked or put on a card, and start over">CLEAR</div>' + needChip()) + '</div>';
  }
  function stageStrip(L) {
    const xp = stageXp();
    const need = E.LEVELS.find(x => x.xp > xp);
    const pct = need ? Math.round(100 * (xp - L.xp) / (need.xp - L.xp)) : 100;
    return '<div class="ar-row" style="margin-bottom:16px"><b style="font-family:var(--amit-font-heading,serif);color:var(--gold2)">' + E.STAGES[stageOf()].name.toUpperCase() + ' · LEVEL ' + L.lvl + '</b>' +
      '<div class="ar-xp"><i style="width:' + pct + '%"></i></div>' +
      '<span class="ar-sub">' + (need ? fmtXp(need.xp - xp) + ' experience to level ' + need.lvl : 'Top level') + '</span></div>';
  }

  function renderPlay() {
    const root = $('ar-1'); if (!root) return;
    if (G) { renderGame(); return; }
    const L = myLevel();
    let h = stageStrip(L);
    if (CH) {
      h += '<div class="ar-panel" style="border-color:var(--gold)"><div class="ar-h">A friend challenged you</div>' +
        '<div class="ar-sub">Play a ' + E.STAGES[CH.stage].name.toLowerCase() + ' game at level ' + CH.lvl + ', then compare how many rounds it took you to reach the target. Everyone is dealt their own cards.</div>' +
        '<div class="ar-row" style="margin-top:12px"><button class="ar-btn big" onclick="AR.startChallenge()">Ready, Set, Roll!</button></div></div>';
    }
    h += '<div class="ar-panel"><div class="ar-h">Start a game</div>' +
      '<div class="ar-h" style="margin:0 0 8px">Stage</div>' +
      '<div class="ar-row" style="margin-bottom:10px">' + E.STAGE_ORDER.map(s => '<button class="ar-btn ar-stagebtn' + (s === curStage ? ' on' : '') + '" title="' + E.STAGES[s].name + '" aria-label="' + E.STAGES[s].name + '" onclick="AR.setStage(\'' + s + '\')">' + ({ addition: '+', subtraction: '−', multiplication: '×', division: '÷' })[s] + '</button>').join('') + '</div>' +
      '<div class="ar-row" style="margin-bottom:10px"><span class="ar-sub">Signs you can use:</span>' + opKeysHtml('small') + '<span class="ar-sub">' + STAGE_BLURB[curStage] + ' Each stage also lets you use every sign before it.</span></div>' +
      '<div class="ar-sub" style="margin-bottom:12px">The first to reach the target score wins — it can take five rounds or twenty. Cover cards, roll again or stop, and keep your score. The clock is per roll: ' +
      (L.clock ? L.clock + ' seconds at your level.' : 'no clock at your level yet.') + '</div>' +
      '<div class="ar-row" style="margin-bottom:14px">' +
      '<label class="ar-sub">Players&nbsp;<select class="ar-select" id="ar-opp"><option value="0">Just me (solo)</option>' +
      [1, 2, 3, 4, 5, 6, 7].map(n => '<option value="' + n + '">Me + ' + n + ' Amit' + (n > 1 ? 's' : '') + ' (' + (n + 1) + ' players)</option>').join('') + '</select></label>' +

      '<label class="ar-sub">Play to&nbsp;<select class="ar-select" id="ar-target">' + TARGETS.map(n => '<option value="' + n + '"' + (n === DEFAULT_TARGET ? ' selected' : '') + '>' + n + ' points</option>').join('') + '</select></label>' +
      '<label class="ar-sub">Level&nbsp;<select class="ar-select" id="ar-lvl"><option value="0">My level (' + L.lvl + ')</option>' +
      levelsOf().map(x => '<option value="' + x.lvl + '">Try level ' + x.lvl + (x.clock ? ' · ' + x.clock + 's' : ' · no clock') + (x.assist ? ' · with hints' : ' · no hints') + '</option>').join('') + '</select></label></div>' +
      '<div class="ar-row"><button class="ar-btn big" onclick="AR.start()">Ready, Set, Roll!</button>' +
      '<button class="ar-btn ghost" onclick="AR.practice(\'' + curStage + '\')">🎓 Walk through a ' + E.STAGES[curStage].name.toLowerCase() + ' turn with Amit</button>' +
      '<button class="ar-btn ghost" onclick="openPage(2)">How do I play?</button></div>' +
      '<div class="ar-sub" style="margin-top:12px;font-size:12px">Amit plays at the lowest level at the table (yours) and is held to the same clock. A win against Amit counts toward your level at a quarter of the usual amount. Trying a different level does not change your level.</div></div>';
    root.innerHTML = h;
  }

  function start() {
    const bots = parseInt($('ar-opp').value, 10) || 0;
    const pick = parseInt($('ar-lvl').value, 10) || 0;
    const target = parseInt($('ar-target').value, 10) || DEFAULT_TARGET;
    startGame({ bots, target, stage: curStage, level: pick ? levelObj(pick) : myLevel(), practiceLevel: !!pick, seed: 1 + Math.floor(Math.random() * 900000) });
  }
  function startChallenge() {
    startGame({ opp: 0, stage: CH.stage, level: E.levelsFor(CH.stage)[CH.lvl - 1], practiceLevel: true, seed: 1 + Math.floor(Math.random() * 900000), challenge: true });
  }
  function startPractice(stage) {       // the guided walk-through turn, for any stage (level 1 of that stage)
    stage = (typeof stage === 'string' && E.STAGES[stage]) ? stage : 'addition';
    startGame({ opp: 0, stage, level: E.levelsFor(stage)[0], practiceLevel: true, seed: 1 + Math.floor(Math.random() * 900000), practice: true });
    openPage(1);
  }
  function setStage(s) {
    if (!E.STAGES[s]) return;
    curStage = s; P.stage = s; saveProfile();
    renderPlay(); renderProgress(); updateContext();
  }
  function practiceStage(s) { setStage(s); openPage(1); }
  function startGame(o) {
    const stage = o.stage || curStage;
    G = {
      stageName: stage, rules: E.rulesFor(stage, o.level.lvl), stageOp: {},
      level: o.level, target: o.target || DEFAULT_TARGET, opp: 0, table: o.bots ? { seats: makeSeats(o.bots, amitLevelFor([o.level.lvl]), stage) } : null, meDone: false, waitingNext: false, seed: o.seed, practice: !!o.practice, practiceLevel: !!o.practiceLevel, challenge: !!o.challenge,
      round: 1, total: 0, results: [], helps: o.practice ? 99 : o.level.helps, turn: null, anim: { dice: [], cards: false },
      busy: true, dealN: 0, flip: null, hint: null, say: '', clockLeft: 0, diceRng: E.mulberry32((Math.random() * 4e9) >>> 0),
      coverPts: {}, coverText: {}, stage: {}
    };
    selOp = {}; curOp = '+';
    beginRound();
  }

  function dealFn() {
    G.dealN++;
    return E.dealCards(E.mulberry32(G.seed * 1000 + G.round * 10 + G.dealN + 500), 5, G.level.cardMin, G.level.cardMax, WILD_CHANCE);
  }
  // ── THE TABLE: up to eight players, my own seat always at the bottom (Ryan, 2026-10-16) ──
  // This version plays against Amit seats on this computer. There is no live connection: when real players join, each
  // seat is refreshed whenever anyone acts (and every few seconds while a game is open), not through a live socket.
  const SEAT_LAYOUT = { 1: { L: [], T: [0], R: [] }, 2: { L: [0], T: [], R: [1] }, 3: { L: [0], T: [1], R: [2] },
    4: { L: [0], T: [1, 2], R: [3] }, 5: { L: [0], T: [1, 2, 3], R: [4] }, 6: { L: [0, 1], T: [2, 3], R: [4, 5] }, 7: { L: [0, 1], T: [2, 3, 4], R: [5, 6] } };
  // Amit's level: the LOWEST level among the human players at the table, so he can never out-class anyone (Ryan, 2026-10-16).
  // Today the only human is the player; with several players pass every human's level.
  function amitLevelFor(humanLevels) { return Math.max(1, Math.min.apply(null, humanLevels)); }
  const SPEED = 6;               // Amit's clock runs this many times faster than real time, so a game does not drag
  let tableTimer = null;
  function makeSeats(n, lv, stage) {
    const seats = [];
    for (let i = 0; i < n; i++) {
      const L0 = E.levelsFor(stage)[lv - 1];
      seats.push({ id: 's' + i, idx: i, name: n === 1 ? 'Amit' : 'Amit ' + (i + 1), level: lv, L: L0,
        skill: Math.max(0.2, Math.min(1, L0.amitSkill + (Math.random() - 0.5) * 0.08)), pace: 0.9 + Math.random() * 0.2, elapsed: 0, budget: L0.clock || Infinity,
        total: 0, roundScore: null, status: 'idle', turn: null, nextAt: 0, dealN: 0, rng: E.mulberry32(((Math.random() * 4e9) >>> 0) + i) });
    }
    return seats;
  }
  function beginSeatsRound() {
    const now = Date.now();
    G.table.seats.forEach(s => {
      const cards = E.dealCards(E.mulberry32(G.seed * 100 + s.idx * 7 + G.round * 13), 5, s.L.cardMin, s.L.cardMax, WILD_CHANCE);
      s.dealN = 0;
      s.dealFn = () => E.dealCards(E.mulberry32(G.seed * 500 + s.idx * 11 + G.round * 17 + (++s.dealN)), 5, s.L.cardMin, s.L.cardMax, WILD_CHANCE);
      s.turn = E.newTurn(cards, E.rollDice(s.rng, 5, E.STAGES[G.stageName].faces), E.rulesFor(G.stageName, s.level));
      s.roundScore = null; s.elapsed = 0; s.budget = s.L.clock || Infinity;
      s.status = 'playing';
      s.nextAt = now + 1500 + s.idx * 250;
      if (s.turn.status !== 'rolled') finishSeat(s);
    });
    stopTable();
    tableTimer = setInterval(tableTick, 300);
  }
  function stopTable() { if (tableTimer) { clearInterval(tableTimer); tableTimer = null; } }
  function finishSeat(s) {
    if (s.status === 'done') return;
    s.roundScore = s.turn.score;
    s.total += s.turn.score;
    s.status = 'done';
  }
  // the game is over when anyone has reached the target (checked after every round, once everyone has finished it)
  function gameOver() {
    if (G.practice) return true;
    const totals = [G.total].concat(G.table ? G.table.seats.map(s => s.total) : []);
    return Math.max.apply(null, totals) >= G.target;
  }
  function tableAllDone() { return !G.table || G.table.seats.every(s => s.status === 'done'); }
  function tableTick() {
    if (!G || !G.table || G.finished) { stopTable(); return; }
    const now = Date.now();
    G.table.seats.forEach(s => {
      if (s.status !== 'playing' || now < s.nextAt) return;
      const opts = { rng: s.rng, skill: s.skill, dealFn: s.dealFn };
      const a = E.botPlan(s.turn, opts);
      let cost = 0;
      if (a.type === 'none') { if (s.turn.status === 'rolled') E.bust(s.turn); }
      else {
        cost = E.amitCost(s.level, a, s.rng, s.pace, G.stageName);
        if (s.elapsed + cost > s.budget) { E.timeoutStop(s.turn); }          // his clock ran out: only what is covered counts
        else { E.botApply(s.turn, a, opts); s.elapsed += cost; if (a.type === 'roll') s.elapsed = 0; }
      }
      if (s.turn.status !== 'rolled') finishSeat(s);
      // the move takes its share of the clock, shown sped up; quicker once I am done and just waiting
      s.nextAt = now + (G.meDone ? 150 + Math.random() * 150 : Math.max(350, Math.min(2600, cost * 1000 / SPEED)));
      renderSeat(s);
    });
    const sc = $('ar-sheet-scores');
    if (sc) {
      sc.innerHTML = sheetScoresHtml();
      const nb = document.querySelector('#ar-sheet .ar-btn.big');
      if (nb && !G.waitingNext && tableAllDone()) nb.textContent = gameOver() ? 'See results' : 'Next round';
    }
    if (G.waitingNext && tableAllDone()) { G.waitingNext = false; next(); }
  }
  function seatInner(s) {
    const t = s.turn;
    let body = '';
    if (t) {
      body += '<div class="ar-sc">' + t.cards.map(c => {
        const cv = c.cover, w = c.v === 'W';
        return '<div class="ar-smc' + (c.covered ? ' cov' : '') + (w ? ' w' : '') + '"><b>' + (w ? '🃏' : c.v) + '</b>' +
          (c.covered && cv && cv.mult > 1 ? '<i>×' + cv.mult + '</i>' : '') + (c.covered && cv ? '<small>' + (cv.expr ? cv.expr.replace(/ /g, '') : cv.values.join('+')) + '</small>' : '') + '</div>';
      }).join('') + '</div>';
      body += '<div class="ar-sd">' + t.dice.map(d => '<span class="ar-smd' + (d.used ? ' used' : '') + '">' + d.v + '</span>').join('') + '</div>';
    }
    const st = s.status === 'done' ? (t.status === 'bust' ? 'BUST' + (t.score > 0 ? ' (keeps ' + t.score + ')' : '') : (t.timedOut ? 'TIME UP ' : '') + (t.score > 0 ? '+' : '') + t.score)
      : s.status === 'playing' ? (isFinite(s.budget) ? '⏱ ' + Math.max(0, Math.ceil(s.budget - s.elapsed)) + 's' : 'playing…') : 'waiting';
    return '<div class="ar-seat-h"><b>' + s.name + '</b> <span class="ar-tag">L' + s.level + '</span></div>' + body +
      '<div class="ar-seat-f"><span>' + st + '</span><span>Total ' + s.total + '</span></div>';
  }
  function renderSeat(s) { const el = $('ar-seat-' + s.id); if (el) el.innerHTML = seatInner(s); }
  function boardHtml(mine) {
    const seats = G.table.seats, lay = SEAT_LAYOUT[seats.length] || SEAT_LAYOUT[7];
    const seat = i => '<div class="ar-seat" id="ar-seat-' + seats[i].id + '">' + seatInner(seats[i]) + '</div>';
    const who = (typeof getUserName === 'function' && getUserName()) || (currentUser && currentUser.email ? currentUser.email.split('@')[0] : '');
    return '<div class="ar-board"><div class="ar-board-top">' + lay.T.map(seat).join('') + '</div><div class="ar-board-row">' +
      '<div class="ar-board-side">' + lay.L.map(seat).join('') + '</div>' +
      '<div class="ar-board-me"><div class="ar-youtag">YOU' + (who ? ' · ' + who : '') + ' · LEVEL ' + G.level.lvl + '</div>' + mine + '</div>' +
      '<div class="ar-board-side">' + lay.R.map(seat).join('') + '</div></div></div>';
  }
  function sheetScoresHtml() {
    const mine = G.turn;
    const rows = ['<tr class="me"><td>You · L' + G.level.lvl + '</td><td>' + (mine.status === 'bust' ? 'BUST' : (mine.score > 0 ? '+' : '') + mine.score) + '</td><td>' + G.total + '</td></tr>']
      .concat(G.table.seats.map(s => '<tr><td>' + s.name + ' · L' + s.level + '</td><td>' + (s.status === 'done' ? (s.turn.status === 'bust' ? 'BUST' : (s.roundScore > 0 ? '+' : '') + s.roundScore) : 'playing…') + '</td><td>' + s.total + '</td></tr>'));
    return '<table class="ar-table-list"><tr><th>Player</th><th>This round</th><th>Total</th></tr>' + rows.join('') + '</table>';
  }

  function beginRound() {
    const cards = E.dealCards(E.mulberry32(G.seed * 1000 + G.round), 5, G.level.cardMin, G.level.cardMax, WILD_CHANCE);
    G.dealN = 0; G.coverPts = {}; G.coverText = {}; G.stage = {}; G.stageOp = {}; G.hint = null; G.say = ''; G.bustMsg = ''; G.stopOutlook = null;
    selOp = {}; curOp = '+';
    G.turn = E.newTurn(cards, E.rollDice(G.diceRng, 5, E.STAGES[G.stageName].faces), G.rules);
    if (G.table) { G.meDone = false; G.waitingNext = false; beginSeatsRound(); }
    sel.clear();
    G.anim = { dice: [0, 1, 2, 3, 4], cards: true };
    G.busy = true;
    updateContext();
    renderGame();
    runDiceAnimation(afterRollSettled);
  }

  function runDiceAnimation(done) {
    snd('roll');
    const idxs = G.anim.dice.slice();
    const end = performance.now() + 650;
    const iv = setInterval(() => {
      idxs.forEach(i => { const d = qs('#ar-1 .ar-die[data-i="' + i + '"]'); if (d) setPips(d, 1 + Math.floor(Math.random() * curFaces())); });
      if (performance.now() > end) {
        clearInterval(iv);
        idxs.forEach(i => { const d = qs('#ar-1 .ar-die[data-i="' + i + '"]'); if (d && G && G.turn.dice[i]) setPips(d, G.turn.dice[i].v); });
        setTimeout(() => { if (G) { G.anim = { dice: [], cards: false }; done(); } }, 250);
      }
    }, 70);
  }
  function afterRollSettled() {
    G.busy = false;
    if (G.turn.status === 'bust') { snd('bust'); doBust('No dice could cover a card — that is a bust.'); return; }
    G.rollStart = performance.now();
    startClock();
    if (G.practice) narrate();
    renderGame();
  }

  // ── staging (dice sitting on a card, not yet a finished cover) ──
  function stagedDice() { const s = new Set(); Object.keys(G.stage).forEach(c => G.stage[c].forEach(k => s.add(k))); return s; }
  function stagedWildIdx() {
    const t = G.turn;
    for (const c of Object.keys(G.stage)) if (G.stage[c].length && isWild(t.cards[c].v) && !t.cards[c].covered) return +c;
    return -1;
  }
  function unstage(k) {
    delete G.stageOp[k];
    Object.keys(G.stage).forEach(c => { G.stage[c] = G.stage[c].filter(x => x !== k); if (!G.stage[c].length) delete G.stage[c]; else fixFirstOp(G.stage[c]); });
    G.say = ''; renderGame();
  }
  // the first die of any cover is a plus (or a minus where a leading minus is allowed)
  function fixFirstOp(list) {
    if (!list.length) return;
    const k = list[0], op = G.stageOp[k] || '+';
    if (op === '+' || (op === '−' && G.rules.allowNegStart)) return;
    G.stageOp[k] = '+';
  }

  // ── the game screen ────────────────────────────────────
  function renderGame() {
    const root = $('ar-1'); if (!root || !G) return;
    const t = G.turn, L = G.level;
    const assist = assistOn();
    const stg = stagedDice();
    const selVals = [...sel].map(i => t.dice[i].v);
    const S = selVals.reduce((a, b) => a + b, 0);
    // in the later stages the picked dice make an expression; its value lights the matching card (when hints are on)
    const selItemsArr = isOpStage() ? selItems() : null;
    const selEval = selItemsArr && selItemsArr.length ? E.evalItems(selItemsArr, G.rules) : null;
    const selValue = selEval && (selEval.ok || selEval.reason === 'required') ? selEval.value : null;
    const left = E.leftoverSum(t);
    const live = t.status === 'rolled' && !G.busy;
    const stagedWild = stagedWildIdx() >= 0;
    const must = live && E.mustCover(t);
    const wildIdx = t.cards.findIndex(c => isWild(c.v) && !c.covered);
    const canAct = live && E.canRoll(t);
    const unused = t.dice.filter(d => !d.used).length;

    const cardsH = t.cards.map((c, i) => {
      const cls = [];
      const cv = c.cover;
      if (c.covered) cls.push('covered');
      if (c.covered && cv && cv.locked) cls.push('locked');
      if (isWild(c.v)) cls.push('wild');
      if (assist && !c.covered && sel.size && !isWild(c.v) && (isOpStage() ? selValue === c.v : S === c.v)) cls.push('match');
      if (G.hint && G.hint.card === i && !c.covered) cls.push('hint');
      if (G.anim.cards) cls.push('dealing');
      const style = G.anim.cards ? ' style="animation-delay:' + (i * 0.07) + 's"' : '';
      const sd = (G.stage[i] || []);
      let stack = '', ribbon = '', pts = '';
      if (c.covered && cv) {
        // the dice stay on the card; until you Accept they can be tapped to take back off (Ryan, 2026-10-15)
        const pull = !cv.locked && live;
        stack = '<div class="ar-stack">' + cv.values.map((v, n) => (cv.ops && (n > 0 || cv.ops[n] === '−') ? '<span class="ar-opsm">' + (n > 0 ? cv.ops[n] : '−') + '</span>' : '') + '<div class="ar-die mini' + (pull ? ' pullable' : '') + '" data-v="' + v + '"' +
          (pull ? ' onclick="event.stopPropagation();AR.pullDie(' + i + ',' + n + ')" title="Tap to take these dice back off"' : '') + '>' + pipsHtml(v) + '</div>').join('') + '</div>';
        if (cv.wild) ribbon = '<div class="ar-ribbon">WILD USED</div>';
        else if (cv.mult > 1) ribbon = '<div class="ar-ribbon">' + E.multWord(cv.mult) + '</div>';
        if (assist && !cv.wild) pts = '<div class="ar-cardpts">+' + cv.pts + '</div>';
      } else if (sd.length) {
        const opStage = isOpStage() && !isWild(c.v);
        stack = '<div class="ar-stack">' + sd.map((k, n) => (opStage && (n > 0 || G.stageOp[k] === '−') ? '<span class="ar-opsm">' + (G.stageOp[k] || '+') + '</span>' : '') + '<div class="ar-die mini" data-v="' + t.dice[k].v + '" onclick="event.stopPropagation();AR.unstage(' + k + ')" title="Tap to take it back">' + pipsHtml(t.dice[k].v) + '</div>').join('') + '</div>' +
          (assist && !isWild(c.v) ? '<div class="ar-stackcap">' + stagedCaption(sd, c.v) + '</div>' : '');
      }
      const face = isWild(c.v)
        ? '<div class="face"><span class="wj">🃏</span><span class="wt">WILD</span></div>'
        : '<div class="face"><small>' + c.v + '</small>' + c.v + '<small class="br">' + c.v + '</small></div>';
      const acceptBtn = (isWild(c.v) && !c.covered && sd.length && live) ? '<button class="ar-btn ar-wildok" onclick="AR.commitWildBtn()">✔ Accept</button>' : '';
      return '<div class="ar-cardwrap"><div class="ar-card ' + cls.join(' ') + '" data-i="' + i + '"' + style + ' onclick="AR.clickCard(' + i + ')">' + face + ribbon + pts + stack + '</div>' + acceptBtn + '</div>';
    }).join('');

    const diceH = t.dice.map((d, k) => {
      if (stg.has(k)) return '<div class="ar-die gone" data-i="' + k + '"></div>';
      const cls = [];
      if (d.used) cls.push('used');
      if (sel.has(k)) cls.push('sel');
      if (G.hint && G.hint.dice.indexOf(k) >= 0 && !d.used) cls.push('hint');
      let style = '';
      if (G.anim.dice.indexOf(k) >= 0) { cls.push('rolling'); style = ' style="--d:' + (k * 0.06) + 's"'; }
      const idxSel = sel.has(k) ? [...sel].indexOf(k) : -1;
      const badge = (isOpStage() && idxSel >= 0 && (idxSel > 0 || selOp[k] === '−')) ? '<span class="opb">' + selOp[k] + '</span>' : '';
      return '<div class="ar-die ' + cls.join(' ') + '" data-v="' + d.v + '" data-i="' + k + '"' + style + '>' + pipsHtml(d.v) + badge + '</div>';
    }).join('');

    let build;
    if (!sel.size) build = live ? '<span style="opacity:.6;font-size:16px">' + (isOpStage() ? 'Press a sign, then tap or drag dice onto a card' : 'Drag dice onto a card — or tap dice, then tap the card') + '</span>' : '&nbsp;';
    else if (isOpStage()) {
      build = E.exprString(selItemsArr) + (assist && selValue !== null ? ' = <em>' + selValue + '</em>' : '');
    } else if (assist) {
      const m = E.multiplier(selVals);
      build = plus(selVals) + ' = <em>' + S + '</em>' + (m > 1 ? ' &nbsp;<span style="color:#7fe3ff">×' + m + '</span>' : '');
    } else build = '<span style="opacity:.7;font-size:16px">' + sel.size + ' dice chosen — drag them onto a card</span>';

    // suggestions: only in the early levels (Ryan: hints for early rounds, dragging with no hints later)
    let risk = '';
    if (assist && canAct) {
      const o = E.rollOutlook(t);
      if (o.fresh) risk = 'Every card is covered — roll for five new cards!';
      else {
        const k = unused || 5;
        risk = 'Roll ' + k + ' dice: <b>' + Math.round(o.pBust * 100) + '%</b> chance of a bust &nbsp;·&nbsp; stopping now banks <b>' + o.stopValue + '</b>';
      }
    }
    let rule = '';
    if (live && must && t.coversThisRoll > 0 && assist) rule = 'A card can still be covered with your dice — keep covering.';
    else if (live && t.coversThisRoll === 0 && wildIdx >= 0 && !must) rule = 'No number card can be covered. Put dice on the 🃏 wild to stay in the turn.';

    const clockTxt = L.clock ? Math.max(0, Math.ceil(G.clockLeft / 1000)) : '∞';
    const circ = 2 * Math.PI * 26;
    const frac = L.clock ? Math.max(0, Math.min(1, G.clockLeft / (L.clock * 1000))) : 1;
    // The special Accept button (Ryan, 2026-10-16) pops up NEXT TO THE CARDS, and only when every die is used
    // (or every card is covered). It is not a menu item in the bottom row.
    const allCardsDone = t.cards.every(c => c.covered);
    const freshNow = live && E.canRoll(t) && (allCardsDone || t.dice.every(d => d.used));
    const popBtn = freshNow
      ? '<button class="ar-btn big ar-pop" onclick="AR.accept()">✔ Accept &amp; ' + (allCardsDone ? 'get 5 new cards' : 're-roll all 5') + '</button>'
      : '';
    const rollLabel = '🎲 Roll ' + unused + ' remaining';

    const myHtml =
      '<div class="ar-table' + (t.status === 'bust' ? ' ar-bust' : '') + '" id="ar-tablearea">' +
      '<div class="ar-hud">' +
      '<div class="ar-chip"><b>' + (G.practice ? '—' : G.round) + '</b><span>Round</span></div>' +
      (G.practice ? '' : '<div class="ar-chip"><b>' + G.target + '</b><span>Play to</span></div>') +
      (selfOn()
        ? '<div class="ar-chip"><b>✍</b><span>You keep score</span></div>'
        : '<div class="ar-chip"><b>' + G.total + '</b><span>Game score</span></div>' +
          '<div class="ar-chip"><b>' + t.points + '</b><span>This turn</span></div>' +
          '<div class="ar-chip ' + (left ? 'neg' : '') + '"><b>−' + left + '</b><span>Dice left</span></div>') +
      '<div style="flex:1"></div>' +
      '<div class="ar-clock' + (L.clock && G.clockLeft < 10000 ? ' low' : '') + '" id="ar-clock"><svg width="64" height="64"><circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="6"/>' +
      '<circle class="ar-ring" id="ar-ring" cx="32" cy="32" r="26" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - frac)) + '"/>' +
      '<text x="32" y="38" text-anchor="middle" fill="#fff" font-size="17" font-weight="700" id="ar-clocktxt">' + clockTxt + '</text></svg></div>' +
      '</div>' +
      '<div class="ar-cards">' + opKeysHtml() + cardsH + popBtn + '</div>' +
      '<div class="ar-dice">' + diceH + '</div>' +
      trayHtml(t, assist) +
      '<div class="ar-build">' + build + '</div>' +
      '<div class="ar-actions">' +
      (freshNow ? '' : '<button class="ar-btn" ' + ((canAct || (live && stagedWild)) ? '' : 'disabled') + ' onclick="AR.accept()" title="Roll the dice you have left">' + rollLabel + '</button>') +
      '<button class="ar-btn" ' + ((live && (E.canStop(t) || stagedWild)) ? '' : 'disabled') + ' onclick="AR.stop()">🏁 Complete &amp; bank</button>' +
      (live && wildIdx >= 0 ? '<button class="ar-btn" onclick="AR.wildAll()" title="Stage every die on the wild, then Accept to roll all five again">🃏 All dice on the wild</button>' : '') +
      '<button class="ar-btn ghost" ' + (live && (G.helps > 0) ? '' : 'disabled') + ' onclick="AR.help()">💡 Help from Amit' + (G.practice ? '' : ' (' + G.helps + ')') + '</button>' +
      '<button class="ar-btn ghost" onclick="AR.toggleMute()" title="Sound">' + (P.muted ? '🔇' : '🔊') + '</button>' +
      '</div>' +
      (rule ? '<div class="ar-risk">' + rule + '</div>' : '') +
      (risk ? '<div class="ar-risk">' + risk + '</div>' : '') +
      (G.say ? '<div class="ar-say"><img src="amit_icon.ico" alt="Amit"><div>' + G.say + '</div></div>' : '') +
      '</div>' +
      '<div class="ar-row" style="margin-top:12px"><button class="ar-btn ghost danger" onclick="AR.quit()">Leave this game</button>' +
      '<span class="ar-sub">' + (G.table ? 'Table of ' + (G.table.seats.length + 1) + ' players — each Amit plays its own cards at its own level.' : G.practice ? 'Tutorial — Amit helps on every roll. Nothing is scored.' : G.challenge ? 'Friend challenge — your own cards.' : 'Solo game.') +
      (assist ? ' Hints on.' : ' No hints at this level.') + '</span></div>';
    root.innerHTML = G.table ? boardHtml(myHtml) : myHtml;

    updateContext();
  }

  // every card covered this turn, kept even after five new cards are dealt, so the player can add them up
  // one small face-up card per cover: the number, the word DOUBLED/TRIPLED if it was multiplied, and the dice used
  function miniCard(c, showPts) {
    if (c.wild) return '<div class="ar-mc wild' + (c.locked ? '' : ' prov') + '"><span class="n">🃏</span><span class="rb">WILD</span><span class="dc">' + c.values.join(' + ') + '</span></div>';
    return '<div class="ar-mc' + (c.locked ? '' : ' prov') + '"><span class="n">' + c.card + '</span>' +
      (c.mult > 1 ? '<span class="rb">' + E.multWord(c.mult) + '</span>' : '') +
      '<span class="dc">' + (c.expr || c.values.join(' + ')) + '</span>' + (showPts ? '<span class="pt">= ' + c.pts + '</span>' : '') + '</div>';
  }
  function trayHtml(t, assist) {
    if (!t.scorecard.length) return selfOn() ? '<div class="ar-traytitle">YOUR COVERED CARDS COLLECT HERE — ADD THEM UP YOURSELF</div>' : '';
    return '<div class="ar-traytitle">YOUR COVERED CARDS' + (selfOn() ? ' — ADD THEM UP' : '') + '</div><div class="ar-tray">' +
      t.scorecard.map(c => miniCard(c, assist)).join('') + '</div>';
  }
  function floatAt(cardIdx, text) {
    const c = qs('#ar-1 .ar-card[data-i="' + cardIdx + '"]'), tb = $('ar-tablearea');
    if (!c || !tb) return;
    const a = c.getBoundingClientRect(), b = tb.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'ar-float'; f.textContent = text;
    f.style.left = (a.left - b.left + a.width / 2 - 24) + 'px';
    f.style.top = (a.top - b.top) + 'px';
    tb.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }
  function banner(text) {
    const tb = $('ar-tablearea'); if (!tb) return;
    const b = document.createElement('div'); b.className = 'ar-banner'; b.textContent = text;
    tb.appendChild(b); setTimeout(() => b.remove(), 1900);
  }
  function confetti(host, n) {
    if (!host) return;
    const cols = ['#f3d681', '#7fe3ff', '#ff9d8a', '#8bf0a6', '#ffffff'];
    for (let i = 0; i < (n || 36); i++) {
      const s = document.createElement('i'); s.className = 'ar-conf';
      s.style.left = (30 + Math.random() * 40) + '%';
      s.style.background = cols[i % cols.length];
      s.style.setProperty('--dx', ((Math.random() - 0.5) * 520) + 'px');
      s.style.setProperty('--dy', (80 + Math.random() * 260) + 'px');
      s.style.setProperty('--r', (Math.random() * 900) + 'deg');
      host.appendChild(s); setTimeout(() => s.remove(), 1700);
    }
  }

  // ── clock ──────────────────────────────────────────────
  function startClock() {
    stopClock();
    const L = G.level;
    G.clockLeft = L.clock ? L.clock * 1000 : 0;
    if (!L.clock) return;
    clockIv = setInterval(() => {
      if (!G || G.busy || G.turn.status !== 'rolled' || document.querySelector('.ar-over')) return;
      G.clockLeft -= 200;
      const ring = $('ar-ring'), txt = $('ar-clocktxt'), ck = $('ar-clock');
      const circ = 2 * Math.PI * 26;
      if (ring) ring.setAttribute('stroke-dashoffset', circ * (1 - Math.max(0, G.clockLeft) / (L.clock * 1000)));
      if (txt) txt.textContent = Math.max(0, Math.ceil(G.clockLeft / 1000));
      if (ck) ck.classList.toggle('low', G.clockLeft < 10000);
      if (G.clockLeft <= 0) { stopClock(); onTimeout(); }
    }, 200);
  }
  function stopClock() { if (clockIv) { clearInterval(clockIv); clockIv = null; } }
  function onTimeout() {
    recordRoll(true);
    const t = G.turn;
    sel.clear(); G.stage = {}; resetBuildState();
    if (t.scorecard.length) {
      // Ryan, 2026-10-16: when the clock runs out only the cards already covered count — nothing is finished for the player
      banner('Time! Only your covered cards count');
      G.stopOutlook = null;
      E.timeoutStop(t);
      finishTurn();
    } else { E.bust(t); snd('bust'); doBust('Time ran out before a card was covered.'); }
  }
  // Time to the FIRST cover of a roll (kept from the first version of the timing record).
  function recordFirst() {
    if (!G || G.practice || G.rollStart == null) return;
    G.firstMs = Math.round(performance.now() - G.rollStart);
    P.timing.push([G.level.lvl, G.firstMs]);
    if (P.timing.length > 300) P.timing.shift();
    saveProfile();
  }
  // The FULL time a roll took, from the dice settling to Accept / Complete / the clock running out. This is the number the
  // clocks are tuned from: [level, first-cover ms or null, full-roll ms, 1 if the clock ran out].
  function recordRoll(timedOut) {
    if (!G || G.practice || G.rollStart == null) return;
    P.rolls = P.rolls || [];
    P.rolls.push([G.level.lvl, G.firstMs == null ? null : G.firstMs, Math.round(performance.now() - G.rollStart), timedOut ? 1 : 0, G.stageName]);
    if (P.rolls.length > 600) P.rolls.shift();
    G.rollStart = null; G.firstMs = null;
    saveProfile();
  }

  // ── covering: tap flow and drag flow both end here ─────
  function liveNow() { return G && !G.busy && G.turn.status === 'rolled' && !document.querySelector('.ar-over'); }

  // why a cover was refused, in plain words
  function coverError(r) {
    const S = E.STAGES[G.stageName], nm = S.name.toLowerCase();
    if (r.reason === 'required') return 'A ' + nm + ' cover has to use a <b>' + S.required + '</b> sign.' + (assistOn() && r.have != null ? ' (That one makes ' + r.have + '.)' : '');
    if (r.reason === 'negative') return 'At this level the total cannot dip below zero on the way — put the plus dice first.';
    if (r.reason === 'divide') return 'That division does not come out even.';
    if (r.reason === 'start') return 'A cover has to start with a plus' + (G.rules.allowNegStart ? ' or a minus' : '') + '.';
    if (r.reason === 'sign') return 'That sign is not used in this stage.';
    if (r.reason === 'sum') return assistOn() ? 'That makes <b>' + r.have + '</b>, not <b>' + r.need + '</b>.' : 'That does not make the card.';
    return 'That does not work.';
  }
  function selItems() { return [...sel].map(k => ({ v: G.turn.dice[k].v, op: selOp[k] || '+' })); }
  function normalizeSel() {
    const arr = [...sel]; if (!arr.length) return;
    const k = arr[0], op = selOp[k] || '+';
    if (!(op === '+' || (op === '−' && G.rules.allowNegStart))) selOp[k] = '+';
  }
  // the little line on a card while dice are resting on it (hints on)
  function stagedCaption(sd, target) {
    const t = G.turn;
    if (!isOpStage()) { const vals = sd.map(k => t.dice[k].v); return plus(vals) + ' = ' + vals.reduce((a, b) => a + b, 0) + ' / ' + target; }
    const items = sd.map(k => ({ v: t.dice[k].v, op: G.stageOp[k] || '+' }));
    const r = E.evalItems(items, G.rules);
    return E.exprString(items) + (r.ok || r.reason === 'required' ? ' = ' + r.value : '') + ' / ' + target;
  }
  function setOp(op) {
    if (!liveNow() || !isOpStage() || E.STAGES[G.stageName].ops.indexOf(op) < 0) return;
    curOp = op; renderGame();
  }
  function resetBuildState() { selOp = {}; curOp = '+'; if (G) G.stageOp = {}; }

  function doCover(diceIdx, cardIdx, ops) {
    const t = G.turn;
    const r = E.tryCover(t, diceIdx, cardIdx, ops);
    if (!r.ok) { snd('bad'); G.say = coverError(r); renderGame(); return false; }
    if (t.coversThisRoll === 1) recordFirst();
    G.hint = null; G.say = '';
    diceIdx.forEach(k => { delete G.stageOp[k]; });
    Object.keys(G.stage).forEach(c => { G.stage[c] = G.stage[c].filter(x => diceIdx.indexOf(x) < 0); if (!G.stage[c].length) delete G.stage[c]; });
    delete G.stage[cardIdx];
    sel.clear(); selOp = {}; curOp = '+';
    snd('cover');
    renderGame();
    floatAt(cardIdx, r.wild ? 'WILD' : '+' + r.pts + (r.mult > 1 ? '  ×' + r.mult : ''));
    if (r.forfeit) {
      snd('bad');
      banner('No ' + G.rules.turnSign + ' used — these five cards score 0');
    } else if (r.sweep) {
      snd('sweep');
      banner(r.sweep === 'cards' ? 'Cleared the table! New cards' : 'Every die used! Roll all five');
      confetti($('ar-tablearea'), 44);
    }
    if (G.practice) narrate();
    return true;
  }

  // put dice on a card: finishes the cover when it makes the card, otherwise leaves them on the card
  function placeOnCard(group, cardIdx) {
    if (!liveNow()) return;
    const t = G.turn, c = t.cards[cardIdx];
    if (!c || c.covered || !group.length) return;
    const staged = (G.stage[cardIdx] || []).slice();
    const fresh = group.filter(k => staged.indexOf(k) < 0);
    const all = staged.concat(fresh);
    if (isWild(c.v)) {              // any dice; they sit on the wild until you press Accept
      G.stage[cardIdx] = all; sel.clear(); G.say = ''; G.hint = null; renderGame(); return;
    }
    if (isOpStage()) {
      // each die carries the sign it was given; dice already resting on the card keep theirs
      fresh.forEach(k => { G.stageOp[k] = selOp[k] || curOp; });
      fixFirstOp(all);
      const items = all.map(k => ({ v: t.dice[k].v, op: G.stageOp[k] || '+' }));
      const r = E.evalItems(items, G.rules);
      if (!r.ok && ['negative', 'divide', 'start', 'sign'].indexOf(r.reason) >= 0) {      // that die cannot go there: it goes back
        fresh.forEach(k => { delete G.stageOp[k]; });
        sel.clear(); selOp = {}; snd('bad'); G.say = coverError(r);
        renderGame();
        const el = qs('#ar-1 .ar-card[data-i="' + cardIdx + '"]'); if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 450); }
        return;
      }
      if (r.ok && r.value === c.v) { doCover(all, cardIdx, all.map(k => G.stageOp[k] || '+')); return; }
      G.stage[cardIdx] = all; sel.clear(); selOp = {}; G.hint = null;
      G.say = (r.reason === 'required' && r.value === c.v) ? 'That makes <b>' + c.v + '</b>, but a ' + E.STAGES[G.stageName].name.toLowerCase() + ' cover has to use a <b>' + E.STAGES[G.stageName].required + '</b> sign.' : '';
      renderGame(); return;
    }
    const total = all.reduce((a, k) => a + t.dice[k].v, 0);
    if (total === c.v) { doCover(all, cardIdx); return; }
    if (total < c.v) { G.stage[cardIdx] = all; sel.clear(); G.hint = null; G.say = ''; renderGame(); return; }
    // too many: the new dice go back
    sel.clear(); snd('bad');
    G.say = assistOn() ? 'Those dice add up to <b>' + total + '</b> — more than the <b>' + c.v + '</b>.' : 'That is more than the ' + c.v + '. The dice go back.';
    renderGame();
    const el = qs('#ar-1 .ar-card[data-i="' + cardIdx + '"]'); if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 450); }
  }

  // Clear (Ryan, 2026-10-16): start the cover over. Takes back every die that is picked or resting on a card but not yet a finished cover.
  function clearBuild() {
    if (!liveNow()) return;
    sel.clear(); G.stage = {}; resetBuildState(); G.hint = null; G.say = '';
    renderGame();
  }
  function clickDie(i) {
    if (!liveNow() || G.turn.dice[i].used) return;
    if (sel.has(i)) { sel.delete(i); delete selOp[i]; normalizeSel(); }
    else {
      if (isOpStage()) {          // the first die of a cover is a plus (a minus only where a leading minus is allowed); the rest take the sign last pressed
        let op = curOp;
        if (sel.size === 0 && !(op === '−' && G.rules.allowNegStart)) op = '+';
        selOp[i] = op;
      }
      sel.add(i);
    }
    G.hint = null;
    renderGame();
  }
  function clickCard(i) {
    if (!liveNow()) return;
    const t = G.turn, c = t.cards[i];
    if (c.covered) return;
    if (!sel.size) {
      if (isWild(c.v) && (G.stage[i] || []).length) { commitWild(); return; }
      G.say = isWild(c.v) ? 'Choose the dice to put on the wild — tap them first, or drag them onto it.' : 'Choose dice first — drag them onto the card, or tap them and then tap the card.';
      snd('bad'); renderGame(); return;
    }
    placeOnCard([...sel], i);
  }

  // take dice back off a covered card (until Accept); the rest stay resting on the card
  function pullDie(cardIdx, n) {
    if (!liveNow()) return;
    const t = G.turn, c = t.cards[cardIdx];
    if (!c || !c.covered || !c.cover || c.cover.locked) return;
    const idx = c.cover.idx.slice(), pulled = idx[n];
    const ops = c.cover.ops ? c.cover.ops.slice() : null;
    if (!E.uncover(t, cardIdx)) return;
    const rest = idx.filter(k => k !== pulled);
    if (rest.length) { G.stage[cardIdx] = rest; rest.forEach(k => { G.stageOp[k] = (ops && ops[idx.indexOf(k)]) || '+'; }); fixFirstOp(rest); }
    G.hint = null; sel.clear();
    G.say = assistOn() ? 'Those dice are free again. Put different dice on the card — or put the same ones back.' : '';
    renderGame();
  }

  // wild: stage dice on it, then Accept
  function commitWild() {
    const i = stagedWildIdx(); if (i < 0) return false;
    const dice = G.stage[i].slice();
    delete G.stage[i];
    return doCover(dice, i);
  }
  function commitWildBtn() { if (liveNow()) commitWild(); }
  function wildAll() {
    if (!liveNow()) return;
    const t = G.turn;
    const i = t.cards.findIndex(c => isWild(c.v) && !c.covered);
    if (i < 0) return;
    G.stage = {}; sel.clear();
    G.stage[i] = t.dice.map((d, k) => d.used ? -1 : k).filter(k => k >= 0);
    G.say = 'Every die is on the wild. Press <b>Accept</b> to roll all five again — or take dice back if you change your mind.';
    renderGame();
  }

  // ── accept / roll / stop ───────────────────────────────
  function accept() {
    if (!liveNow()) return;
    commitWild();
    if (!liveNow()) return;          // the wild sweep may have started an animation
    const t = G.turn;
    if (E.mustCover(t)) { G.say = 'You can still cover a card with the dice you have — keep covering before you roll.'; snd('bad'); renderGame(); return; }
    if (!E.canRoll(t)) { G.say = 'Cover at least one card first.'; snd('bad'); renderGame(); return; }
    roll();
  }
  function roll() {
    if (!G || G.busy || !E.canRoll(G.turn)) return;
    recordRoll(false);
    const t = G.turn;
    const allCards = t.cards.every(c => c.covered), allDice = t.dice.every(d => d.used);
    const idxs = (allCards || allDice) ? [0, 1, 2, 3, 4] : t.dice.map((d, k) => d.used ? -1 : k).filter(k => k >= 0);
    stopClock(); G.say = ''; G.hint = null; G.stage = {}; sel.clear(); resetBuildState();
    E.roll(t, G.diceRng, dealFn);
    G.anim = { dice: idxs, cards: allCards };
    G.busy = true;
    renderGame();
    runDiceAnimation(afterRollSettled);
  }
  function stop() {
    if (!liveNow()) return;
    commitWild();
    if (!liveNow()) return;
    const t = G.turn;
    if (E.mustCover(t)) { G.say = 'You can still cover a card with the dice you have — keep covering before you complete.'; snd('bad'); renderGame(); return; }
    if (E.canRoll(t) && E.needSign(t)) { G.say = 'Use a <b>' + t.rules.turnSign + '</b> at least once in these five cards before you bank — or roll on to find one.'; snd('bad'); renderGame(); return; }
    if (!E.canStop(t)) { G.say = 'Cover at least one card first.'; snd('bad'); renderGame(); return; }
    G.stage = {}; resetBuildState();
    G.stopOutlook = E.rollOutlook(t);
    stopClock(); recordRoll(false);
    E.stop(t);
    finishTurn();
  }

  // ── Amit's help ────────────────────────────────────────
  function help() {
    if (!liveNow() || (G.helps <= 0 && !G.practice)) return;
    const t = G.turn;
    const sc = signCover(t);
    if (sc) {
      if (!G.practice) G.helps--;
      G.hint = { dice: sc.dice, card: sc.card };
      G.say = 'You still need a <b>' + t.rules.turnSign + '</b> in these five cards. Try <b>' + sc.expr + '</b> on the <b>' + t.cards[sc.card].v + '</b>.';
      renderGame(); return;
    }
    const plan = E.bestPlan(E.cardVals(t), E.diceVals(t), t.rules);
    if (!G.practice) G.helps--;
    const wildLeft = t.cards.some(c => isWild(c.v) && !c.covered);
    if (plan.covers.length) {
      const c = plan.covers[0];
      G.hint = { dice: c.dice, card: c.card };
      G.say = describeCover(t, c, true) + (plan.covers.length > 1 ? ' After that, ' + plan.covers.slice(1).map(x => describeCover(t, x, false)).join(' and then ') : '');
    } else if (t.coversThisRoll === 0 && wildLeft) {
      G.hint = null;
      G.say = 'No number card can be covered with these dice. Use the 🃏 wild: put <b>one die</b> on it to keep rolling the rest, or <b>every die</b> on it to roll all five again. Then press Accept.';
    } else {
      G.hint = null;
      G.say = nextAdvice(t);
    }
    renderGame();
  }
  function describeCover(t, c, lead) {
    const vals = c.dice.map(i => t.dice[i].v);
    const card = t.cards[c.card].v;
    let expr = plus(vals);
    if (t.rules.stage && t.rules.stage !== 'addition') { const ex = E.stageExpr(E.diceVals(t), c.dice, c.sum, t.rules); if (ex) expr = ex.expr; }
    return (lead ? 'Use <b>' + expr + '</b> to cover the <b>' + card + '</b>' : 'use <b>' + expr + '</b> on the <b>' + card + '</b>') +
      (c.mult > 1 ? ' — ' + c.mult + ' matching dice multiply it to <b>' + c.pts + '</b> points!' : ' for <b>' + c.pts + '</b> points.');
  }
  function nextAdvice(t) {
    const o = E.rollOutlook(t);
    if (!o) return '';
    if (o.fresh) return 'Every card is covered. Accept to roll for five new cards!';
    const k = t.dice.filter(d => !d.used).length || 5;
    return 'Nothing more to cover here. Rolling ' + k + ' dice has a <b>' + Math.round(o.pBust * 100) + '%</b> chance of a bust. Stopping banks <b>' + o.stopValue + '</b>. ' +
      (o.advice === 'roll' ? 'I would <b>roll again</b>.' : 'I would <b>stop and bank it</b>.');
  }
  // a cover that uses the stage's sign, when one exists and the sign is still owed in this set
  function signCover(t) {
    if (!E.needSign(t)) return null;
    const dv = E.diceVals(t);
    const list = E.validCovers(E.cardVals(t), dv, t.rules).filter(c => !c.wild);
    let best = null;
    list.forEach(c => { const ex = E.stageExpr(dv, c.dice, c.sum, t.rules, t.rules.turnSign); if (ex && (!best || ex.dice.length < best.dice.length || (ex.dice.length === best.dice.length && c.sum > best.sum))) best = { dice: ex.dice, card: c.card, sum: c.sum, expr: ex.expr }; });
    return best;
  }
  function narrate() {
    const t = G.turn;
    if (t.status !== 'rolled') return;
    const sc = signCover(t);
    if (sc) {
      G.say = 'You still need a <b>' + t.rules.turnSign + '</b> in these five cards. Try <b>' + sc.expr + '</b> on the <b>' + t.cards[sc.card].v + '</b>.';
      G.hint = { dice: sc.dice, card: sc.card };
      renderGame(); return;
    }
    const plan = E.bestPlan(E.cardVals(t), E.diceVals(t), t.rules);
    const wildLeft = t.cards.some(c => isWild(c.v) && !c.covered);
    if (plan.covers.length) {
      G.say = 'Here is a good play: ' + describeCover(t, plan.covers[0], true);
      G.hint = { dice: plan.covers[0].dice, card: plan.covers[0].card };
    } else if (t.coversThisRoll === 0 && wildLeft) {
      G.say = 'Nothing adds up to a card this roll — but you have the 🃏 wild! Put dice on it and press Accept to keep going.'; G.hint = null;
    } else { G.say = nextAdvice(t); G.hint = null; }
    renderGame();
  }
  function toggleMute() { P.muted = !P.muted; saveProfile(); renderGame(); }
  function quit() {
    if (!confirm('Leave this game? Your progress in this game will not be saved.')) return;
    stopClock(); stopTable(); G = null; sel.clear(); renderPlay(); updateContext();
  }

  // ── ending a turn ──────────────────────────────────────
  function doBust(msg) {
    stopClock();
    renderGame();
    banner('BUST');
    G.bustMsg = msg;
    setTimeout(() => { if (G) finishTurn(); }, 1300);
  }
  function finishTurn() {
    stopClock();
    const t = G.turn;
    if (!G.practice) G.total += t.score;
    G.results.push({ score: t.score, status: t.status });
    if (G.table) G.meDone = true;
    renderGame();
    showRoundSheet();
  }

  function reviewHtml(t) {
    let h = '';
    t.rolls.forEach((r, i) => {
      const takenPts = r.taken.reduce((a, c) => a + c.pts, 0);
      const takenTxt = r.taken.length ? r.taken.map(c => c.wild
        ? 'put ' + plus(c.dice) + ' on the wild'
        : 'covered ' + c.card + ' with ' + (c.expr || plus(c.dice)) + (c.mult > 1 ? ' (×' + c.mult + ')' : '') + ' <b>+' + c.pts + '</b>').join(', ') : '';
      const bexpr = c => { if (G.rules.stage !== 'addition') { const ex = E.stageExpr(r.full, c.dice, c.sum, G.rules); if (ex) return ex.expr; } return plus(c.dice.map(k => r.full[k])); };
      const bestTxt = r.best.covers.map(c => bexpr(c) + ' on ' + c.sum + (c.mult > 1 ? ' (×' + c.mult + ')' : '') + ' <b>+' + c.pts + '</b>').join(', ');
      h += '<div class="ar-rv"><b>Roll ' + (i + 1) + '</b> — dice ' + r.dice.join(' ') + ' · cards ' + r.cards.map(c => isWild(c) ? '🃏' : c).join(' ') + '<br>';
      if (!r.best.covers.length) {
        if (r.wild && r.taken.length) h += 'No number could be covered — you used the wild to stay in the turn. <span class="good">✔</span>';
        else if (r.wild) h += 'No number could be covered. The wild could have saved this roll.';
        else h += 'Nothing could cover a card — that roll was a bust.';
      }
      else if (!r.taken.length) h += 'You did not cover anything. Best was: ' + bestTxt + '.';
      else if (takenPts >= r.best.points) h += '<span class="good">✔ Best play.</span> You ' + takenTxt + '.';
      else h += 'You ' + takenTxt + '.<br><span class="better">Amit sees ' + (r.best.points - takenPts) + ' more points: ' + bestTxt + '.</span>';
      h += '</div>';
    });
    return h;
  }

  function showRoundSheet() {
    if (selfOn() && G.turn.status === 'stopped') { showAddSheet(); return; }
    showResultSheet();
  }
  function breakdownHtml(t) {
    const parts = t.scorecard.filter(c => !c.wild && !c.forfeited).map(c => c.card + (c.mult > 1 ? ' × ' + c.mult : '') + ' = ' + c.pts);
    const left = t.dice.filter(d => !d.used).map(d => d.v);
    return (parts.length ? parts.join(' &nbsp;+&nbsp; ') : '0') + ' &nbsp;−&nbsp; ' + (left.length ? left.join(' − ') + ' (dice left = ' + E.leftoverSum(t) + ')' : '0 (no dice left)') + ' &nbsp;=&nbsp; <b>' + t.score + '</b>';
  }
  function showAddSheet() {
    const t = G.turn; G.addTries = 0;
    const cards = t.scorecard.map(c => miniCard(Object.assign({}, c, { locked: true }), false)).join('');
    const left = t.dice.filter(d => !d.used).map(d => dieStatic(d.v)).join('') || '<span class="ar-sub">none — every die was used</span>';
    const over = document.createElement('div'); over.className = 'ar-over'; over.id = 'ar-sheet';
    over.innerHTML = '<div class="ar-sheet"><div class="ar-h" style="text-align:center">ROUND ' + G.round + ' — ADD UP YOUR TURN</div>' +
      '<div class="ar-sub" style="text-align:center">Add up every covered card — a doubled card counts twice, a tripled card three times — then take away the dice you did not use.</div>' +
      '<div class="ar-traytitle" style="margin-top:14px">COVERED CARDS</div><div class="ar-tray">' + (cards || '<span class="ar-sub">none</span>') + '</div>' +
      '<div class="ar-traytitle" style="margin-top:12px">DICE YOU DID NOT USE</div><div class="ar-demo" style="margin:6px 0">' + left + '</div>' +
      '<div class="ar-row" style="justify-content:center;margin-top:12px"><input id="ar-add" type="number" class="ar-select" style="width:150px;font-size:22px;text-align:center" placeholder="your score" onkeydown="if(event.key===\'Enter\')AR.checkAdd()"><button class="ar-btn big" onclick="AR.checkAdd()">Check</button></div>' +
      '<div id="ar-addmsg" class="ar-sub" style="text-align:center;margin-top:12px;min-height:24px"></div></div>';
    document.body.appendChild(over);
    const inp = $('ar-add'); if (inp) inp.focus();
  }
  function checkAdd() {
    const t = G.turn, inp = $('ar-add'), msg = $('ar-addmsg');
    if (!inp || inp.value === '') return;
    const n = parseInt(inp.value, 10);
    G.addTries = (G.addTries || 0) + 1;
    const note = k => { P.adds = P.adds || { first: 0, second: 0, shown: 0 }; P.adds[k]++; saveProfile(); };
    if (n === t.score) {
      note(G.addTries === 1 ? 'first' : 'second'); snd('cover');
      msg.innerHTML = '<b style="color:#8bf0a6">✔ Right! ' + t.score + '.</b>';
      setTimeout(() => { closeSheet(); showResultSheet(); }, 900);
    } else if (G.addTries < 2) {
      snd('bad'); msg.textContent = 'Not quite — add it again, slowly. Remember to count doubled cards twice.'; inp.select();
    } else {
      note('shown'); snd('bad');
      msg.innerHTML = 'Here is how it adds up:<br>' + breakdownHtml(t) + '<br><button class="ar-btn" style="margin-top:12px" onclick="AR.afterAdd()">Continue</button>';
    }
  }
  function afterAdd() { closeSheet(); showResultSheet(); }

  function showResultSheet() {
    const t = G.turn;
    const bust = t.status === 'bust';
    let stopNote = '';
    if (t.status === 'stopped' && G.stopOutlook && !G.stopOutlook.fresh) {
      const o = G.stopOutlook;
      stopNote = '<div class="ar-sub" style="margin-top:8px">You stopped with ' + t.dice.filter(d => !d.used).length + ' dice left. Rolling them had a ' + Math.round(o.pBust * 100) + '% chance of a bust; Amit\'s one-roll look-ahead said <b>' + (o.advice === 'roll' ? 'roll' : 'stop') + '</b>.</div>';
    }
    const last = G.practice || (tableAllDone() && gameOver());
    const over = document.createElement('div'); over.className = 'ar-over'; over.id = 'ar-sheet';
    over.innerHTML = '<div class="ar-sheet"><div class="ar-h" style="text-align:center">' + (G.practice ? 'TUTORIAL TURN' : 'ROUND ' + G.round + ' · FIRST TO ' + G.target) + '</div>' +
      '<div class="ar-big' + (t.score < 0 || bust ? ' neg' : '') + '">' + (bust ? 'BUST' : (t.score > 0 ? '+' : '') + t.score) + '</div>' +
      '<div class="ar-sub" style="text-align:center">' + (bust ? (G.bustMsg || '') + (t.score > 0 ? ' You keep the ' + t.score + ' points you banked by covering all five cards.' : ' This turn scores 0.') : (t.noSign ? 'The clock ran out before you used a ' + t.rules.turnSign + ' in these five cards, so they score nothing.' : 'Covered ' + t.points + ' points, minus ' + E.leftoverSum(t) + ' for the dice left.')) + '</div>' + stopNote +
      '<div class="ar-h" style="margin-top:18px">BEST PLAY <span class="ar-tag">working name</span></div>' +
      '<div class="ar-sub" style="margin-bottom:4px">What each roll could have done, next to what you did.</div>' +
      '<div class="ar-review">' + reviewHtml(t) + '</div>' +
      (G.table ? '<div class="ar-h" style="margin-top:14px">THE TABLE</div><div id="ar-sheet-scores">' + sheetScoresHtml() + '</div>' : '') +
      '<div class="ar-row" style="justify-content:center;margin-top:14px"><button class="ar-btn big" onclick="AR.next()">' + (G.practice ? 'Done' : last ? 'See results' : 'Next round') + '</button></div></div>';
    document.body.appendChild(over);
  }
  function closeSheet() { const s = $('ar-sheet'); if (s) s.remove(); }

  function next() {
    if (G.table && !G.practice && !tableAllDone()) {
      G.waitingNext = true;
      const b = document.querySelector('#ar-sheet .ar-btn.big'); if (b) { b.disabled = true; b.textContent = 'Waiting for the others…'; }
      return;
    }
    closeSheet();
    if (G.practice) { G = null; renderPlay(); updateContext(); return; }
    if (gameOver()) { endGame(); return; }
    G.round++;
    beginRound();
  }

  // ── end of game ────────────────────────────────────────
  function endGame() {
    const before = myLevel().lvl;
    stopTable();
    let oppScore = null, ranking = null;
    if (G.table) {
      ranking = [{ name: 'You · L' + G.level.lvl, total: G.total, me: true }].concat(G.table.seats.map(s => ({ name: s.name + ' · L' + s.level, total: s.total, bot: true })))
        .sort((x, y) => y.total - x.total);
      oppScore = Math.max(...G.table.seats.map(s => s.total));
    }
    let gain = 0, place = 1, nPlayers = 1;
    if (ranking) { nPlayers = ranking.length; place = ranking.findIndex(r => r.me) + 1; }
    if (!G.practiceLevel && ranking) {
      gain = E.placeXp(place, nPlayers, AMIT_XP_FACTOR);      // first place = one point per opponent beaten; Amit opponents count at a quarter
      P.xps[G.stageName] = fmtXp(stageXp(G.stageName) + gain);
    }
    P.games.unshift({ t: Date.now(), stage: G.stageName, score: G.total, lvl: G.level.lvl, opp: G.table ? G.table.seats.length : 0, place: ranking ? place : 0, rounds: G.round, target: G.target, oppScore, practiceLevel: G.practiceLevel, challenge: G.challenge });
    if (P.games.length > 60) P.games.length = 60;
    saveProfile();
    const after = myLevel().lvl;
    const won = ranking ? (G.total > oppScore ? 'You won the table!' : G.total === oppScore ? 'You tied for the lead.' : 'You finished ' + (ranking.findIndex(r => r.me) + 1) + ' of ' + ranking.length + '.') : '';
    const over = document.createElement('div'); over.className = 'ar-over'; over.id = 'ar-sheet';
    over.innerHTML = '<div class="ar-sheet" style="position:relative;overflow:hidden"><div class="ar-h" style="text-align:center">GAME OVER</div>' +
      '<div class="ar-big' + (G.total < 0 ? ' neg' : '') + '">' + G.total + '</div><div class="ar-sub" style="text-align:center">your total after ' + G.round + ' rounds (first to ' + G.target + ')</div>' +
      (ranking ? '<table class="ar-table-list" style="margin-top:14px"><tr><th>Player</th><th>Total</th></tr>' + ranking.map(r => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + r.name + (r.bot ? ' <span class="ar-tag">AMIT</span>' : '') + '</td><td>' + r.total + '</td></tr>').join('') + '</table><div class="ar-h" style="text-align:center;margin-top:12px">' + won + '</div>' : '') +
      '<div class="ar-sub" style="text-align:center;margin-top:12px">' +
      (G.practiceLevel ? 'Trying level ' + G.level.lvl + ' — your own level did not change.' : ranking ? ordinal(place) + ' of ' + nPlayers + ' — +' + fmtXp(gain) + ' experience' + (gain ? ' (a quarter of the usual, because the other players were Amit)' : '') : 'Playing alone earns no experience — you earn it by beating other players.') + '</div>' +
      (after > before ? '<div class="ar-big" style="font-size:26px;margin-top:12px">⭐ LEVEL ' + after + '! ⭐</div><div class="ar-sub" style="text-align:center">Your clock is now ' + (levelObj(after).clock ? levelObj(after).clock + ' seconds per roll.' : 'unlimited.') + (levelObj(after).assist ? '' : ' Hints are off from here — dragging only.') + '</div>' : '') +
      '<div class="ar-row" style="justify-content:center;margin-top:18px"><button class="ar-btn big" onclick="AR.again()">Play again</button>' +
      '<button class="ar-btn" onclick="AR.copyChallenge()">🔗 Challenge a friend at this level</button></div>' +
      '<div class="ar-sub" id="ar-copymsg" style="text-align:center;margin-top:8px"></div></div>';
    document.body.appendChild(over);
    if (after > before) { snd('sweep'); confetti(over.firstChild, 60); }
    G.finished = true;
  }
  function again() { closeSheet(); stopTable(); G = null; sel.clear(); renderPlay(); renderProgress(); updateContext(); }
  function copyChallenge() { copyText(challengeUrl(G.level.lvl, G.stageName), 'ar-copymsg'); }

  // ── dragging dice onto cards (mouse and touch) ─────────
  function installDrag() {
    let drag = null;
    function cardAt(x, y) {
      const els = document.elementsFromPoint(x, y);
      for (const el of els) {
        const c = el.closest && el.closest('#ar-1 .ar-card[data-i]');
        if (c && !c.classList.contains('covered')) return +c.dataset.i;
      }
      return null;
    }
    function clearOver() { document.querySelectorAll('#ar-1 .ar-card.drop').forEach(c => c.classList.remove('drop')); }
    function endGhosts() {
      if (!drag) return;
      drag.ghosts.forEach(g => g.remove());
      document.querySelectorAll('#ar-1 .ar-die.dragging').forEach(d => d.classList.remove('dragging'));
      clearOver();
    }
    document.addEventListener('pointerdown', e => {
      if (!liveNow()) return;
      const d = e.target.closest && e.target.closest('#ar-1 .ar-die[data-i]');
      if (!d || d.classList.contains('used') || d.classList.contains('gone') || d.classList.contains('mini') || d.classList.contains('rolling')) return;
      drag = { i: +d.dataset.i, x: e.clientX, y: e.clientY, moved: false, ghosts: [], group: null };
    });
    document.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) {
        drag.moved = true;
        drag.group = sel.has(drag.i) ? [...sel] : [drag.i];
        drag.group.forEach((k, n) => {
          const src = qs('#ar-1 .ar-die[data-i="' + k + '"]'); if (!src) return;
          const g = src.cloneNode(true);
          g.className = 'ar-die ar-ghost'; g.removeAttribute('onclick'); g.style.cssText = '';
          g.dataset.off = String(n * 26);
          document.body.appendChild(g); drag.ghosts.push(g);
          src.classList.add('dragging');
        });
      }
      if (drag.moved) {
        drag.ghosts.forEach(g => { g.style.left = (e.clientX - 35 + Number(g.dataset.off)) + 'px'; g.style.top = (e.clientY - 35 - Number(g.dataset.off) * 0.3) + 'px'; });
        clearOver();
        const c = cardAt(e.clientX, e.clientY);
        if (c !== null) { const el = qs('#ar-1 .ar-card[data-i="' + c + '"]'); if (el) el.classList.add('drop'); }
        e.preventDefault();
      }
    });
    function finish(e, cancelled) {
      if (!drag) return;
      const dg = drag;
      endGhosts();
      drag = null;
      if (cancelled) return;
      if (!dg.moved) { clickDie(dg.i); return; }
      const c = cardAt(e.clientX, e.clientY);
      if (c !== null) placeOnCard(dg.group, c);
    }
    document.addEventListener('pointerup', e => finish(e, false));
    document.addEventListener('pointercancel', e => finish(e, true));
  }
  installDrag();

  // ── LEARN page ─────────────────────────────────────────
  const STEPS = [
    { t: 'Cards are targets. Dice are your tools.', x: 'Five number cards sit on the table. You have five dice. Your job is to cover the cards by using dice that <b>add up</b> to the number on the card.',
      d: () => cardStatic(7) + '<span class="op">⟵</span>' + die6(3) + '<span class="op">+</span>' + die6(4) },
    { t: 'Ready, Set, Roll!', x: 'Someone calls <b>“Ready, Set, Roll!”</b> and everyone rolls their five dice at the same time. Everyone is dealt their <b>own</b> five cards, so every game is different. In AmitRoll the dice roll for you.',
      d: () => [2, 5, 3, 6, 1].map(v => die6(v)).join('') },
    { t: 'Covering a card', x: '<b>Drag</b> dice up onto a card. Put a 3 and a 4 on a 7 and the two dice sit on the card and cover it. You can also tap the dice and then tap the card. In the early levels the table adds up your dice for you and lights the card that matches; later, you do the adding yourself.',
      d: () => die6(3) + '<span class="op">+</span>' + die6(4) + '<span class="op">→</span>' + cardStatic(7) },
    { t: 'Matching dice multiply!', x: 'Use dice that show the <b>same number</b> and the card is worth more. Two 4s on an 8 score <b>16</b>. Three 4s on a 12 score <b>36</b>. A 3 and a 5 on an 8 only score 8. Hunting for matches is how you get good.',
      d: () => die6(4) + die6(4) + '<span class="op">on</span>' + cardStatic(8) + '<span class="op">= 16</span>' },
    { t: 'Keep covering, then Accept', x: 'If any card can still be covered with the dice you have, you <b>must keep covering</b> — you cannot roll or stop yet. When nothing more can be covered, press <b>🎲 Roll</b> to roll the dice you have left, or <b>Complete &amp; bank</b>.',
      d: () => '<button class="ar-btn" disabled>🎲 Roll 3 remaining</button><button class="ar-btn" disabled>🏁 Complete &amp; bank</button>' },
    { t: 'Roll again — or stop', x: 'If a roll cannot cover <b>any</b> card, that is a <b>bust</b> and the turn’s points are lost — <b>except</b> the points you already banked by covering all five cards. When you stop, your points are added up and the <b>value of the dice you did not use is taken away</b>.',
      d: () => '<span class="op" style="font-size:20px">points − dice left = your score</span>' },
    { t: 'The wild card', x: 'Sometimes one of your five cards is a <b>🃏 wild</b>. <b>Any</b> dice can go on it — one die to keep rolling the rest, or every die to roll all five again. Drag the dice on, then press <b>Accept</b>. The wild disappears when it is used. You can use it whenever you like, and it saves a roll that could not cover anything.',
      d: () => cardStatic('W') + '<span class="op">←</span>' + die6(6) + die6(1) },
    { t: 'Change your mind', x: 'Dice on a covered card stay there so you can see them. Until you press Accept you can <b>tap them to take them back off</b> and try again. A 1 and a 3 on a 4 score 4 — but pull them off and put two 2s on instead, and the card is <b>doubled</b>. Look for the better way.',
      d: () => die6(1) + die6(3) + '<span class="op">→</span>' + die6(2) + die6(2) + '<span class="op">on</span>' + cardStatic(4) + '<span class="op">DOUBLED</span>' },
    { t: 'Keeping score', x: 'In the early levels Amit keeps your score. From <b>level 4</b> you keep your own: covered cards collect at the bottom, labelled <b>DOUBLED</b> or <b>TRIPLED</b>, even after five new cards come. When you finish a turn, <b>add them up yourself</b>, take away the dice you did not use, and tell Amit your total. Amit checks it.',
      d: () => '<span class="ar-tc">8 · DOUBLED</span><span class="ar-tc">5</span><span class="ar-tc">12 · TRIPLED</span><span class="op" style="font-size:18px">16 + 5 + 36 − dice left</span>' },
    { t: 'Fresh starts', x: 'Use up <b>all five dice</b> and a gold <b>✔ Accept &amp; re-roll all 5</b> button pops up next to your cards. Press it and all five dice roll again, keeping your points. Cover <b>all five cards</b> and it says <b>✔ Accept &amp; get 5 new cards</b> — press it for five new cards and a fresh roll. Covering all five cards also <b>banks</b> those points: they are yours for good, and a later bust can only take what you earn after the new cards. Chaining these is how big scores happen.',
      d: () => [1, 2, 3, 4, 5].map(cardStatic).join('') },
    { t: 'Amit is here to help', x: 'The <b>💡 Help from Amit</b> button shows the best cover for the dice you have, lights up the dice to use, and tells you the chance of a bust before you roll. Beginners get several helps a game. Come back to this page any time, and skip it any time.',
      d: () => '<button class="ar-btn" disabled>💡 Help from Amit</button>' }
  ];
  // Learn is a Multi-Row Tab View (the layout copied into AmitRoll.html from the template). Only Addition is playable today.
  let learnTabId = 'add';
  function comingHtml(title, lines) {
    return '<div class="ar-h" style="font-size:20px;color:#fff">' + title + ' <span class="ar-tag">NOT BUILT YET</span></div>' +
      lines.map(l => '<div class="ar-sub" style="font-size:16px;margin:10px 0">' + l + '</div>').join('');
  }
  // How to play each later stage (Ryan, 2026-10-16)
  function stageLearnHtml(stage) {
    const S = E.STAGES[stage], name = S.name;
    const demo = {
      subtraction: die10(10) + '<span class="op">−</span>' + die10(1) + '<span class="op">+</span>' + die10(1) + '<span class="op">→</span>' + cardStatic(10),
      multiplication: die10(2) + '<span class="op">+</span>' + die10(3) + '<span class="op">×</span>' + die10(4) + '<span class="op">→</span>' + cardStatic(14),
      division: die10(9) + '<span class="op">−</span>' + die10(8) + '<span class="op">÷</span>' + die10(4) + '<span class="op">→</span>' + cardStatic(7)
    }[stage];
    const rule = {
      subtraction: 'The dice go up to <b>10</b>. Use <b>a minus at least once</b> in each set of five cards — for example <b>10 − 1 + 1</b> on a 10. The other covers can be plain adding.',
      multiplication: 'The dice go up to <b>10</b>. Use <b>a times at least once</b> in each set of five cards — for example <b>2 + 3 × 4</b> on a 14. Plus and minus work too, and the card numbers go much higher.',
      division: 'The dice go up to <b>10</b>. Use <b>a divide at least once</b> in each set of five cards, and it must come out even — for example <b>9 − 8 ÷ 4</b> on a 7. All four signs work.'
    }[stage];
    const order = (stage === 'subtraction') ? '' :
      '<div class="ar-sub" style="font-size:16px;margin:10px 0"><b>Order of operations</b> (“My Dear Aunt Sally”): × and ÷ happen first, then + and −. So 2 + 3 × 4 is 2 + 12 = 14, not 20.' + (stage === 'division' ? ' A division has to come out whole: 12 ÷ 4 = 3 is fine, 7 ÷ 2 is not.' : '') + '</div>';
    return '<div class="ar-h" style="font-size:20px;color:#fff">' + name + '</div>' +
      '<div class="ar-sub" style="font-size:16px;margin:10px 0">' + rule + '</div>' +
      '<div class="ar-demo">' + demo + '</div>' + order +
      '<div class="ar-sub" style="font-size:16px;margin:10px 0"><b>How to build a cover:</b> press a sign key beside the cards — it <b>sticks</b>: every die you pick after it uses that sign until you press another. Press + then dice 2, 3, 5 and that is 2 + 3 + 5; press − and everything after is taken away until you press + again. Then tap the card, or drag the dice onto it. <b>CLEAR</b> starts the cover over.</div>' +
      '<div class="ar-sub" style="font-size:16px;margin:10px 0"><b>Going below zero:</b> in levels 1–4 the total may not dip below zero on the way, so put the plus dice first. From level 5 you may go below zero and add back, and a cover may even start with a minus.</div>' +
      '<div class="ar-sub" style="margin:10px 0">The highest card number in this stage climbs from ' + E.STAGE_TOPS[stage][0] + ' at level 1 to ' + E.STAGE_TOPS[stage][7] + ' at level 8. You earn experience and levels in each stage separately.</div>' +
      '<div class="ar-row" style="margin-top:14px"><button class="ar-btn big" onclick="AR.practiceStage(\'' + stage + '\')">Practice ' + name.toLowerCase() + '</button></div>';
  }
  const SL = (t, x, d) => ({ t, x, d });
  const OPS_DEMO = (cur) => '<div class="ar-ops small"><div class="ar-op on' + (cur === '+' ? ' cur' : '') + '">+</div><div class="ar-op on' + (cur === '−' ? ' cur' : '') + '">−</div><div class="ar-op off">×</div><div class="ar-op off">÷</div></div>';
  const CLEAR_DEMO = () => '<div class="ar-ops small"><div class="ar-op clear">CLEAR</div></div>';
  const STAGE_STEPS = {
    subtraction: [
      SL('Dice now go to 10', 'In subtraction the dice have <b>ten sides</b>, 1 to 10, and the cards go higher than in addition. Everything you learned in addition still works: you can still add.',
        () => [10, 7, 1, 4, 9].map(die10).join('')),
      SL('Use a minus once per five cards', 'In each set of five cards you must use <b>a minus at least once</b>. A 9 and a 2 on a <b>7</b>: 9 − 2 = 7. After that, the other cards can be covered by plain adding. You cannot bank your points until you have used it, and if a set ends without it, <b>that set scores nothing</b>.',
        () => die10(9) + '<span class="op">−</span>' + die10(2) + '<span class="op">→</span>' + cardStatic(7)),
      SL('The sign keys', 'Beside the cards are four keys: <b>+ − × ÷</b>. In subtraction only <b>+</b> and <b>−</b> are lit. <b>Press a sign, then tap or drag the dice.</b> The first die of a cover is always a plus, so you press − before the <i>second</i> die.',
        () => OPS_DEMO('−')),
      SL('A sign sticks', 'The sign stays on until you press another. Press − and pick three dice and <b>all three</b> are taken away: 10 − 3 − 2 = 5. Press + again when you want to add.',
        () => die10(10) + '<span class="op">−</span>' + die10(3) + '<span class="op">−</span>' + die10(2) + '<span class="op">→</span>' + cardStatic(5)),
      SL('Mixing plus and minus', 'Use both in one cover: 8 + 5 − 3 = 10. Dice are used one at a time, left to right, so you can often find a cover more than one way.',
        () => die10(8) + '<span class="op">+</span>' + die10(5) + '<span class="op">−</span>' + die10(3) + '<span class="op">→</span>' + cardStatic(10)),
      SL('Not below zero (at first)', 'In levels 1 to 4 the running total <b>may not dip below zero</b>, so put the plus dice first: 3 − 5 is not allowed, but 6 + 3 − 5 = 4 is. From level 5 you may go below zero and climb back, and a cover may even start with a minus.',
        () => die10(6) + '<span class="op">+</span>' + die10(3) + '<span class="op">−</span>' + die10(5) + '<span class="op">→</span>' + cardStatic(4)),
      SL('Clear and Accept', 'Pressed the wrong sign? <b>CLEAR</b> takes back the dice you have picked and starts the cover over. Everything else works as in addition: keep covering while you can, then roll or bank.',
        CLEAR_DEMO)
    ],
    multiplication: [
      SL('Dice to 10, and big cards', 'The dice go 1 to 10 and the cards climb all the way to the hundreds. Plus, minus and times are all lit.',
        () => [3, 9, 2, 10, 6].map(die10).join('')),
      SL('Use a times once per five cards', 'In each set of five cards you must use <b>a × at least once</b>. 6 × 7 covers a <b>42</b>. After that, other cards can be covered with plus and minus. You cannot bank until you have used it, and a set that ends without it <b>scores nothing</b>.',
        () => die10(6) + '<span class="op">×</span>' + die10(7) + '<span class="op">→</span>' + cardStatic(42)),
      SL('Order of operations', '<b>× happens before + and −</b> (“My Dear Aunt Sally”). So 2 + 3 × 4 is 2 + 12 = <b>14</b>, not 20. The table does it that way for you.',
        () => die10(2) + '<span class="op">+</span>' + die10(3) + '<span class="op">×</span>' + die10(4) + '<span class="op">→</span>' + cardStatic(14)),
      SL('Press a sign, then the dice', 'Press <b>×</b>, then tap the dice. The sign sticks, so press × once and pick 2, 3 and 4 to make 2 × 3 × 4 = 24. Press another sign to change. The first die is always a plus.',
        () => die10(2) + '<span class="op">×</span>' + die10(3) + '<span class="op">×</span>' + die10(4) + '<span class="op">→</span>' + cardStatic(24)),
      SL('Times with plus and minus', 'Mix them to land exactly: 5 × 8 − 3 = 37. The times part is worked out first, then the adding or taking away.',
        () => die10(5) + '<span class="op">×</span>' + die10(8) + '<span class="op">−</span>' + die10(3) + '<span class="op">→</span>' + cardStatic(37)),
      SL('Clear and Accept', '<b>CLEAR</b> starts a cover over. Early levels will not let the total dip below zero on the way. Then keep covering, roll, or bank, as before.',
        CLEAR_DEMO)
    ],
    division: [
      SL('All four signs', 'Division uses <b>+ − × ÷</b>, with dice 1 to 10. The cards come back down from the multiplication numbers.',
        () => [8, 4, 9, 2, 10].map(die10).join('')),
      SL('Use a divide once per five cards', 'In each set of five cards you must use <b>a ÷ at least once</b>, and it must come out <b>even</b>: 12 ÷ 4 = 3 is fine, 7 ÷ 2 is not allowed. 8 ÷ 2 covers a <b>4</b>. The other cards can use any sign. You cannot bank until you have used it, and a set that ends without it <b>scores nothing</b>.',
        () => die10(8) + '<span class="op">÷</span>' + die10(2) + '<span class="op">→</span>' + cardStatic(4)),
      SL('Order of operations', '<b>× and ÷ go first, then + and −.</b> So 9 − 8 ÷ 4 is 9 − 2 = <b>7</b>, not 0.25. Remember “My Dear Aunt Sally”.',
        () => die10(9) + '<span class="op">−</span>' + die10(8) + '<span class="op">÷</span>' + die10(4) + '<span class="op">→</span>' + cardStatic(7)),
      SL('A sign sticks', 'Press ÷ once, then pick several dice: 10 ÷ 5 ÷ 2 = 1. Press another sign to change. The first die of a cover is always a plus.',
        () => die10(10) + '<span class="op">÷</span>' + die10(5) + '<span class="op">÷</span>' + die10(2) + '<span class="op">→</span>' + cardStatic(1)),
      SL('Divide, then add or multiply', 'Combine signs: 6 × 4 ÷ 3 = 8. Try the dice in different orders: the division has to come out even <i>at that step</i>.',
        () => die10(6) + '<span class="op">×</span>' + die10(4) + '<span class="op">÷</span>' + die10(3) + '<span class="op">→</span>' + cardStatic(8)),
      SL('Clear and Accept', '<b>CLEAR</b> starts a cover over. Then keep covering, roll, or bank, as before.',
        CLEAR_DEMO)
    ]
  };
  const LEARN_PANE = { subtraction: 'sub', multiplication: 'mul', division: 'div' };
  const learnStepBy = { subtraction: 0, multiplication: 0, division: 0 };
  function renderStageLessons(stage, pane) {
    pane = pane || qs('#ar-learn-mrt .mrt-content[data-mrt-pane="' + LEARN_PANE[stage] + '"]'); if (!pane) return;
    const steps = STAGE_STEPS[stage], n = learnStepBy[stage], s = steps[n], name = E.STAGES[stage].name;
    pane.innerHTML = '<div class="ar-learn-step"><div class="ar-row" style="justify-content:space-between"><div class="ar-h">' + name.toUpperCase() + ' — STEP ' + (n + 1) + ' OF ' + steps.length + '</div>' +
      '<button class="ar-btn ghost" onclick="AR.practiceStage(\'' + stage + '\')">Skip — go to Practice</button></div>' +
      '<div class="ar-h" style="font-size:22px;color:#fff">' + s.t + '</div><div class="ar-sub" style="font-size:16px">' + s.x + '</div>' +
      '<div class="ar-demo">' + s.d() + '</div>' +
      '<div class="ar-row" style="justify-content:space-between"><button class="ar-btn ghost" ' + (n ? '' : 'disabled') + ' onclick="AR.learn(-1,\'' + stage + '\')">← Back</button>' +
      (n < steps.length - 1 ? '<button class="ar-btn" onclick="AR.learn(1,\'' + stage + '\')">Next →</button>' : '<button class="ar-btn big" onclick="AR.practice(\'' + stage + '\')">Walk through a turn with Amit</button>') + '</div></div>' +
      '<div class="ar-sub" style="margin-top:12px">The walk-through is a ' + name.toLowerCase() + ' turn where Amit shows a good play on every roll. Nothing is scored. Card tops in this stage climb from ' + E.STAGE_TOPS[stage][0] + ' at level 1 to ' + E.STAGE_TOPS[stage][7] + ' at level 8.</div>';
  }
  const LEARN_TABS = [
    { id: 'add', label: 'Addition', mount: pane => renderAdditionLearn(pane) },
    { id: 'sub', label: 'Subtraction', mount: pane => renderStageLessons('subtraction', pane) },
    { id: 'mul', label: 'Multiplication', mount: pane => renderStageLessons('multiplication', pane) },
    { id: 'div', label: 'Division', mount: pane => renderStageLessons('division', pane) },
    { id: 'adv', label: '🔒 Advanced', html: comingHtml('Advanced', ['Still to be decided.']) }
  ];
  function renderLearn() {
    const root = $('ar-2'); if (!root) return;
    root.classList.add('ar-learn');
    root.innerHTML = '<div class="mrt-wrap" id="ar-learn-mrt"></div>';
    if (typeof mrtCreate === 'function') mrtCreate('ar-learn-mrt', LEARN_TABS, { initial: learnTabId, onSelect: id => { learnTabId = id; } });
  }
  function renderAdditionLearn(pane) {
    pane = pane || qs('#ar-learn-mrt .mrt-content[data-mrt-pane="add"]'); if (!pane) return;
    const s = STEPS[learnStep];
    pane.innerHTML = '<div class="ar-learn-step"><div class="ar-row" style="justify-content:space-between"><div class="ar-h">ADDITION — STEP ' + (learnStep + 1) + ' OF ' + STEPS.length + '</div>' +
      '<button class="ar-btn ghost" onclick="openPage(1)">Skip — go to Practice</button></div>' +
      '<div class="ar-h" style="font-size:22px;color:#fff">' + s.t + '</div><div class="ar-sub" style="font-size:16px">' + s.x + '</div>' +
      '<div class="ar-demo">' + s.d() + '</div>' +
      '<div class="ar-row" style="justify-content:space-between"><button class="ar-btn ghost" ' + (learnStep ? '' : 'disabled') + ' onclick="AR.learn(-1)">← Back</button>' +
      (learnStep < STEPS.length - 1 ? '<button class="ar-btn" onclick="AR.learn(1)">Next →</button>' : '<button class="ar-btn big" onclick="AR.practice()">Walk through a turn with Amit</button>') + '</div></div>' +
      '<div class="ar-sub" style="margin-top:12px">The walk-through is a turn where Amit shows a good play on every roll. Nothing is scored.</div>';
  }
  function learn(d, stage) {
    if (stage && STAGE_STEPS[stage]) { learnStepBy[stage] = Math.max(0, Math.min(STAGE_STEPS[stage].length - 1, learnStepBy[stage] + d)); renderStageLessons(stage); return; }
    learnStep = Math.max(0, Math.min(STEPS.length - 1, learnStep + d)); renderAdditionLearn();
  }

  // ── FRIENDS page ───────────────────────────────────────
  function renderFriends() {
    const root = $('ar-3'); if (!root) return;
    root.innerHTML =
      '<div class="ar-panel" style="border-color:var(--gold)"><div class="ar-h">CHALLENGE A FRIEND — WORKS NOW</div>' +
      '<div class="ar-sub">Make a challenge link and send it to anyone. When they open it they play a game at the <b>same level</b>, with their own cards, and you compare how many rounds it took to reach the target. It needs no account.</div>' +
      '<div class="ar-row" style="margin-top:12px"><button class="ar-btn big" onclick="AR.makeChallenge()">🔗 Make a challenge link</button></div>' +
      '<div class="ar-sub" id="ar-chmsg" style="margin-top:10px"></div></div>' +
      '<div class="ar-panel ar-soon"><div class="ar-h">PLAY TOGETHER ONLINE — NEXT STAGE</div>' +
      '<div class="ar-sub" style="margin-bottom:12px">These need the friends list from AmitChat and the AmitRoll database tables. They are designed and not built yet.</div>' +
      '<div class="ar-grid2">' +
      ['🎯 At my level|Players whose level and clock are close to yours.', '🌍 At any level|Anyone. Each player\'s clock follows their own level.', '🧑 A friend|Invite one friend from your AmitChat friends list.', '👥 A group of friends|Two to six players at once. A game can be a whole group.']
        .map(x => { const [a, b] = x.split('|'); return '<div class="ar-panel" style="margin:0"><b>' + a + '</b><div class="ar-sub">' + b + '</div><button class="ar-btn" disabled style="margin-top:10px">Coming next</button></div>'; }).join('') +
      '</div></div>' +
      '<div class="ar-panel ar-soon"><div class="ar-h">WATCHING AND STEALING — PLANNED</div><div class="ar-sub">' +
      'When you play against other people you will be able to <b>watch their hands</b> once you are done, to see how they covered their cards. Later, for players at the same level, a player who misses a cover that was really there could have those points <b>stolen</b> after they press Done.</div></div>' +
      '<div class="ar-panel ar-soon"><div class="ar-h">SAFETY AND CLASSES — PLANNED</div><div class="ar-sub">' +
      'Games with other people have no chat and no free text — players are shown by a display name, level and score. Every opponent gets a <b>Block</b> and <b>Report</b> button on the game screen. Chat happens only between friends, in AmitChat. ' +
      'Teachers will be able to set up a class made of several tables, see the leaders across all of them, and replay a student’s turn on screen to teach from it.</div></div>';
  }
  function makeChallenge() {
    const url = challengeUrl(myLevel().lvl, curStage);
    const m = $('ar-chmsg');
    if (m) m.innerHTML = 'Your link (level ' + myLevel().lvl + '): <br><input class="ar-select" style="width:100%;margin-top:6px" readonly value="' + url + '" onclick="this.select()"><br><button class="ar-btn" style="margin-top:8px" onclick="AR.copyChallengeUrl(\'' + url + '\')">Copy link</button><span id="ar-chmsg2" style="margin-left:10px"></span>';
  }

  // ── PROGRESS page ──────────────────────────────────────
  function renderProgress() {
    const root = $('ar-4'); if (!root) return;
    const L = myLevel();
    const rows = P.games.slice(0, 20).map(g =>
      '<tr><td>' + new Date(g.t).toLocaleDateString() + '</td><td>' + g.score + '</td><td>' + (g.stage && g.stage !== 'addition' ? E.STAGES[g.stage].name + ' · ' : '') + g.lvl + (g.practiceLevel ? ' (trying)' : '') + '</td><td>' +
      (g.opp ? (g.place ? ordinal(g.place) + ' of ' + (g.opp + 1) : 'table of ' + (g.opp + 1)) + ' (best Amit ' + g.oppScore + ')' : g.challenge ? 'friend challenge' : 'solo') + '</td></tr>').join('');
    const lvRows = levelsOf().map(x => '<tr' + (x.lvl === L.lvl ? ' class="me"' : '') + '><td>' + x.lvl + '</td><td>' + x.xp + '</td><td>' + (x.clock ? x.clock + ' s' : 'no clock') + '</td><td>' + x.cardMin + '–' + x.cardMax + '</td><td>' + x.helps + '</td><td>' + (x.assist ? 'yes' : 'no') + '</td></tr>').join('');
    root.innerHTML = stageStrip(L) +
      '<div class="ar-panel"><div class="ar-h">YOUR EXPERIENCE</div><table class="ar-table-list"><tr><th>Stage</th><th>Level</th><th>Experience</th></tr>' + E.STAGE_ORDER.map(s => '<tr' + (s === stageOf() ? ' class="me"' : '') + '><td>' + E.STAGES[s].name + '</td><td>' + E.levelFor(stageXp(s)).lvl + '</td><td>' + fmtXp(stageXp(s)) + '</td></tr>').join('') + '</table><div class="ar-sub" style="margin-top:8px">Saved in this browser for now. When the AmitRoll tables are built, your levels will follow your Amit login to any device.</div></div>' +
      (P.adds && (P.adds.first + P.adds.second + P.adds.shown) ? '<div class="ar-panel"><div class="ar-h">YOUR ADDING</div><div class="ar-sub">From level 4 you add up your own turn. Right the first time: <b>' + P.adds.first + '</b> · right the second time: <b>' + P.adds.second + '</b> · needed Amit to show you: <b>' + P.adds.shown + '</b>.</div></div>' : '') +
      '<div class="ar-panel"><div class="ar-h">RECENT GAMES</div>' +
      (rows ? '<table class="ar-table-list"><tr><th>Date</th><th>Score</th><th>Level</th><th>Against</th></tr>' + rows + '</table>' : '<div class="ar-sub">No games yet. Go play one!</div>') + '</div>' +
      '<div class="ar-panel"><div class="ar-h">THE LEVEL TABLE — ' + E.STAGES[stageOf()].name.toUpperCase() + ' <span class="ar-tag">first guess — to be tuned</span></div>' +
      '<table class="ar-table-list"><tr><th>Level</th><th>Experience needed</th><th>Clock per roll</th><th>Card numbers</th><th>Helps per game</th><th>Hints</th></tr>' + lvRows + '</table>' +
      timingTableHtml() + '</div>' +
      '<div class="ar-row"><button class="ar-btn ghost danger" onclick="AR.resetProgress()">Reset my progress</button></div>';
  }
  function pct(arr, p) { const a = arr.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(p * (a.length - 1))] : 0; }
  function timingTableHtml() {
    const R = P.rolls || [];
    const head = '<div class="ar-sub" style="margin-top:10px">The game records how long every roll takes, so each level\'s clock can be tuned from real play. The goal: set a level\'s clock near the time that <b>1 roll in 4 runs over</b> (the 75th percentile), so every level has the same squeeze.</div>';
    if (!R.length) return head + '<div class="ar-sub" style="margin-top:6px">No full rolls recorded yet. Play games (not the tutorial turn) to fill this in.</div>';
    const rows = levelsOf().map(L => {
      const mine = R.filter(r => r[0] === L.lvl && (r[4] || 'addition') === stageOf());
      if (!mine.length) return '';
      const full = mine.map(r => r[2] / 1000);
      const out = mine.filter(r => r[3]).length;
      return '<tr><td>' + L.lvl + '</td><td>' + (L.clock ? L.clock + ' s' : 'none') + '</td><td>' + mine.length + '</td><td>' + pct(full, 0.5).toFixed(1) + ' s</td><td>' + pct(full, 0.75).toFixed(1) + ' s</td><td>' + Math.round(100 * out / mine.length) + '%</td></tr>';
    }).join('');
    return head + '<table class="ar-table-list" style="margin-top:8px"><tr><th>Level</th><th>Clock now</th><th>Rolls</th><th>Typical roll (median)</th><th>1 in 4 take longer than</th><th>Ran out of time</th></tr>' + rows + '</table>';
  }
  function resetProgress() {
    if (!confirm('Erase your level, XP and game history in this browser?')) return;
    P = { xp: 0, xps: { addition: 0, subtraction: 0, multiplication: 0, division: 0 }, xpUnit: 3, stage: curStage, games: [], timing: [], muted: P.muted }; saveProfile(); renderPlay(); renderProgress(); updateContext();
  }

  window.AR = {
    navHtml, detailHtml, afterRender,
    start, startChallenge, practice: startPractice, clickCard, accept, stop, help, next, quit, again,
    unstage, wildAll, commitWildBtn, clearBuild, pullDie, checkAdd, afterAdd, setOp, setStage, practiceStage,
    toggleMute, learn, makeChallenge, copyChallenge,
    copyChallengeUrl: url => copyText(url, 'ar-chmsg2'),
    resetProgress
  };
})();

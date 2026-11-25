/* test_popup.js (2026-11-24). End-to-end test of AmitScriptPopup.html: a real hidden Edge window is driven (Chrome DevTools protocol) against the REAL /api/script routes
   served by tests\route_test_server.ps1. Temp folders only; no window is shown. Run: node test_popup.js   Needs Node 22+ (global WebSocket and fetch). Exit 0 only when every check passes. */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const here = __dirname, kit = path.dirname(here), PORT = 18732, CDP = 9333;
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'amit_popup_test_'));
const env = Object.assign({}, process.env, { AMIT_SCRIPTS_ROOT: path.join(root, 'scripts'), AMIT_BUTTON_FILES_ROOT: path.join(root, 'docs'), AMIT_TEST_NO_WINDOW: '1' });
const data = path.join(root, 'data'); fs.mkdirSync(data, { recursive: true }); fs.writeFileSync(path.join(data, 'in.csv'), 'a,1\r\nb,2\r\n');
const sha = t => crypto.createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex').toUpperCase();
const SITE = 'https://askamit.org';
let pass = 0, fail = 0;
const ok = (c, l) => { if (c) { pass++; console.log('  PASS  ' + l); } else { fail++; console.log('  FAIL  ' + l); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(method, route, body, origin) {
  const h = {}; if (origin) h.Origin = origin; if (body !== undefined) h['Content-Type'] = 'text/plain';
  const r = await fetch('http://localhost:' + PORT + '/api/script/' + route, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch (e) {} return { status: r.status, json: j };
}
const GOOD = "$who = Get-AmitAnswer -Name 'from_whom' -Default 'everyone'\r\n$pick = Get-AmitAnswer -Name 'which' -Default 'none'\r\nWrite-AmitFile -Path '" + data + "\\out.txt' -Content ('who=' + $who + ' which=' + $pick)\r\n";
const ASK = "$a = Request-AmitAnswer -Question 'Which sheet?' -Choices 'Sales','Costs' -TimeoutSeconds 25\r\nWrite-AmitFile -Path '" + data + "\\ask.txt' -Content ('sheet=' + $a)\r\n";
const SLOW = "Write-AmitFile -Path '" + data + "\\slow.txt' -Content 'x'\r\nStart-Sleep -Seconds 40\r\n";
const questions = [
  { variable: 'which', label: 'Which one?', kind: 'choice', choices: ['A', 'B'], required: true, askMode: 'every_time', status: 'active' },
  { variable: 'from_whom', label: 'From whom', kind: 'text', required: false, askMode: 'remember', status: 'active' },
  { variable: 'only_b', label: 'Only when B', kind: 'text', required: false, askMode: 'every_time', status: 'active', showIfVariable: 'which', showIfValue: 'B' }
];
function cfg(id, hash, state, ver, qs) {
  return { buttons: [{ id, name: 'Popup test', version: ver || 1, approvedHash: hash, state, sendingUnlocked: false,
    permissions: { reads: true, writes: true, sends: false, folders: [data], maxActions: 20, maxSeconds: 30 }, questions: qs || questions,
    settings: { blockedRecipients: [], scriptTimeLimitSec: 30, sendCountdownSeconds: 0 }, card: { wish: 'Writes a small file.', reads: 'a file in your data folder', mayDo: 'create one text file', worstCase: 'The file is replaced; a backup is kept.' } }] };
}
// ---- a tiny CDP driver ----
async function openPage(url) {
  const res = await fetch('http://127.0.0.1:' + CDP + '/json/new?' + encodeURIComponent(url), { method: 'PUT' });
  const t = await res.json(); const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const wait = {};
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } });
  const send = (method, params) => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : undefined; };
  const text = () => ev('document.body.innerText');
  const until = async (re, ms) => { const end = Date.now() + (ms || 15000); let t = ''; while (Date.now() < end) { t = await text(); if (re.test(t)) return t; await sleep(250); } return t; };
  const click = label => ev('(function(){var b=[].slice.call(document.querySelectorAll("button")).filter(function(x){return x.textContent.trim()===' + JSON.stringify(label) + '&&!x.disabled;})[0];if(b){b.click();return true}return false})()');
  const setText = (sel, v) => ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(!e)return false;e.value=' + JSON.stringify(v) + ';e.dispatchEvent(new Event("input"));return true})()');
  return { send, ev, text, until, click, setText, close: async () => { try { await fetch('http://127.0.0.1:' + CDP + '/json/close/' + t.id); } catch (e) {} ws.close(); } };
}
async function newToken(id) { const r = await api('GET', 'open?button=' + id); return r.json.token; }
const popupUrl = (id, tok) => 'file:///' + path.join(kit, 'AmitScriptPopup.html').replace(/\\/g, '/') + '?b=' + id + '&t=' + tok + '&p=' + PORT;

(async () => {
  const srv = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(here, 'route_test_server.ps1'), '-Port', String(PORT)], { env, windowsHide: true });
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + CDP, '--remote-allow-origins=*', '--user-data-dir=' + path.join(root, 'edge'), '--window-size=520,900', 'about:blank'], { windowsHide: true });
  try {
    for (let i = 0; i < 50; i++) { try { const r = await api('GET', 'status'); if (r.status === 200) break; } catch (e) {} await sleep(300); }
    for (let i = 0; i < 50; i++) { try { const r = await fetch('http://127.0.0.1:' + CDP + '/json/version'); if (r.ok) break; } catch (e) {} await sleep(300); }
    const id = 'popup-test-0001';
    let r = await api('POST', 'place', { buttonId: id, version: 1, text: GOOD, hash: sha(GOOD) }, SITE); ok(r.status === 200, 'the good script is placed');
    await api('POST', 'sync', cfg(id, sha(GOOD), 'active'), SITE);

    console.log('1. questions, practice, check screen, real run');
    let tok = await newToken(id), pg = await openPage(popupUrl(id, tok));
    let t = await pg.until(/Which one\?/); ok(/Which one\?/.test(t) && /From whom/.test(t), 'the pop-up shows the button\'s questions');
    ok(!/Only when B/.test(t), 'a question that depends on another answer is hidden');
    ok(/Runs on this computer/.test(t) && /Practice run/.test(t) && /Run\b/.test(t), 'it offers Practice run and Run (the button is active)');
    ok(await pg.click('B'), 'a choice is picked with a big button');
    t = await pg.until(/Only when B/, 3000); ok(/Only when B/.test(t), 'the dependent question appears after the choice');
    await pg.setText('input[type=text]', 'Sue');
    ok(await pg.click('Run'), 'Run is pressed');
    t = await pg.until(/Check before it goes/); ok(/Check before it goes/.test(t) && /Created|Changed/.test(t), 'a practice run fills the check screen with what it WILL do');
    ok(!fs.existsSync(path.join(data, 'out.txt')), 'nothing was written by the practice');
    ok(await pg.click('Go'), 'Go is pressed');
    t = await pg.until(/Done\./); ok(/Done\./.test(t) && /What finished/.test(t), 'the result card says Done with what finished');
    ok(fs.existsSync(path.join(data, 'out.txt')) && /who=Sue which=B/.test(fs.readFileSync(path.join(data, 'out.txt'), 'utf8')), 'the answers reached the script as data');
    await pg.close();

    console.log('2. remembering');
    tok = await newToken(id); pg = await openPage(popupUrl(id, tok));
    t = await pg.until(/From whom/); const v = await pg.ev('document.querySelector("input[type=text]").value');
    ok(v === 'Sue', 'the answer the person asked to be remembered is back as "from last time"');
    await pg.close();

    console.log('3. a button on trial, and one not approved');
    await api('POST', 'sync', cfg(id, sha(GOOD), 'practice_only'), SITE);
    tok = await newToken(id); pg = await openPage(popupUrl(id, tok));
    t = await pg.until(/Trial/); ok(/Trial: practice only/.test(t) && /Practice run/.test(t) && !/^Run$/m.test(t), 'a trial button offers only Practice run');
    await pg.click('A'); ok(await pg.click('Practice run'), 'Practice run is pressed');
    t = await pg.until(/Practice finished/); ok(/Nothing was changed or sent/.test(t) && /on trial/.test(t), 'the practice result says nothing was sent and how to allow it');
    await pg.close();
    await api('POST', 'sync', cfg(id, '', 'active'), SITE);
    tok = await newToken(id); pg = await openPage(popupUrl(id, tok));
    t = await pg.until(/approval/); ok(/needs your approval in the Hub/.test(t), 'a button the person has not approved says so and offers nothing to run');
    await pg.close();

    console.log('4. a question in the middle of a run');
    const id2 = 'popup-test-0002';
    await api('POST', 'place', { buttonId: id2, version: 1, text: ASK, hash: sha(ASK) }, SITE);
    await api('POST', 'sync', cfg(id2, sha(ASK), 'active', 1, []), SITE);
    tok = await newToken(id2); pg = await openPage(popupUrl(id2, tok));
    await pg.until(/Run/); ok(await pg.click('Practice run'), 'practice is pressed');
    t = await pg.until(/Practice finished|stopped|Which sheet/, 20000); await sleep(300);
    // the practice run also asks: answer it, then run for real
    if (/Which sheet\?/.test(t)) { ok(true, 'the script\'s own question appears as a card'); await pg.click('Costs'); t = await pg.until(/Practice finished/, 20000); }
    ok(/Practice finished/.test(t), 'the practice finishes after the answer');
    ok(await pg.click('Run it for real'), 'Run it for real is pressed');
    t = await pg.until(/Check before it goes|Which sheet/, 20000);
    if (/Which sheet\?/.test(t)) { await pg.click('Sales'); t = await pg.until(/Check before it goes/, 20000); }
    await pg.click('Go');
    t = await pg.until(/Which sheet\?|Done\./, 20000);
    if (/Which sheet\?/.test(t)) { await pg.click('Sales'); t = await pg.until(/Done\./, 20000); }
    ok(/Done\./.test(t) && fs.existsSync(path.join(data, 'ask.txt')) && /sheet=Sales/.test(fs.readFileSync(path.join(data, 'ask.txt'), 'utf8')), 'the answer to the mid-run question reached the script');
    await pg.close();

    console.log('5. Stop');
    const id3 = 'popup-test-0003';
    await api('POST', 'place', { buttonId: id3, version: 1, text: SLOW, hash: sha(SLOW) }, SITE);
    await api('POST', 'sync', cfg(id3, sha(SLOW), 'active', 1, []), SITE);
    tok = await newToken(id3); pg = await openPage(popupUrl(id3, tok));
    await pg.until(/Run/);
    const rr = await api('POST', 'run?b=' + id3 + '&t=' + tok, { mode: 'real', answers: {} }, 'null'); ok(rr.status === 200, 'a slow real run is started');
    await pg.close(); tok = await newToken(id3); pg = await openPage(popupUrl(id3, tok));
    t = await pg.until(/Stop/, 10000); ok(/Stop/.test(t) && /Working/.test(t), 'opening the button while it runs shows the running screen with Stop');
    await sleep(2500); ok(await pg.click('Stop'), 'Stop is pressed');
    t = await pg.until(/The button stopped/, 20000); ok(/You pressed Stop/.test(t) && /What finished/.test(t), 'the result says the person pressed Stop and what finished');
    await pg.close();
  } catch (e) { fail++; console.log('  ERROR  ' + e.message); }
  finally {
    try { edge.kill(); } catch (e) {} try { spawnSync('taskkill', ['/PID', String(srv.pid), '/T', '/F']); } catch (e) {}
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F']); } catch (e) {}
    await sleep(600); try { fs.rmSync(root, { recursive: true, force: true }); } catch (e) {}
    console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
  }
})();

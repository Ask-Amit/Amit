/* test_hub_module.js (2026-11-24). Runs tests\hub_stub.html in a hidden Edge window against the REAL Helper routes (a test server). Temp folders only, nothing shown. Run: node test_hub_module.js */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const here = __dirname, PORT = 18733, CDP = 9334;
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'amit_hub_test_'));
const env = Object.assign({}, process.env, { AMIT_SCRIPTS_ROOT: path.join(root, 'scripts'), AMIT_BUTTON_FILES_ROOT: path.join(root, 'docs'), AMIT_TEST_NO_WINDOW: '1', AMIT_TEST_NULL_IS_SITE: '1' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(here, 'route_test_server.ps1'), '-Port', String(PORT)], { env, windowsHide: true });
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + CDP, '--remote-allow-origins=*', '--user-data-dir=' + path.join(root, 'edge'), '--window-size=1100,900', 'about:blank'], { windowsHide: true });
  let pass = 0, fail = 0;
  try {
    /* a script the person's own Claude "left" in the drop folder (the J make button shortcut), for the import check */
    const ib = path.join(root, 'scripts', '_inbox', 'Imported Note'); fs.mkdirSync(ib, { recursive: true });
    fs.writeFileSync(path.join(ib, 'script.ps1'), "$who = Get-AmitAnswer -Name 'from_whom' -Default 'x'\r\nWrite-AmitFile -Path 'C:\\Users\\Public\\a.txt' -Content $who\r\n");
    fs.writeFileSync(path.join(ib, 'definition.json'), JSON.stringify({ wish: 'Writes the answer into a small file.', worst_case: 'The file is replaced; a backup is kept.', test_example: { answers: { from_whom: 'Sue' }, result: 'a.txt says Sue' },
      permissions: { reads: false, writes: true, sends: false, spends: false, internet: false, folders: ['C:\\Users\\Public'], maxActions: 3, maxSeconds: 20 }, declared_variables: [{ name: 'from_whom', label: 'From whom', kinds: ['text'], required: false, default: 'x' }] }));
    fs.writeFileSync(path.join(ib, 'questions.json'), '[]'); fs.writeFileSync(path.join(ib, 'summary.txt'), 'It writes one answer into a small file.');
    for (let i = 0; i < 50; i++) { try { const r = await fetch('http://localhost:' + PORT + '/api/script/status'); if (r.status === 200) break; } catch (e) {} await sleep(300); }
    for (let i = 0; i < 50; i++) { try { const r = await fetch('http://127.0.0.1:' + CDP + '/json/version'); if (r.ok) break; } catch (e) {} await sleep(300); }
    const url = 'file:///' + path.join(here, 'hub_stub.html').replace(/\\/g, '/') + '?p=' + PORT;
    const t = await (await fetch('http://127.0.0.1:' + CDP + '/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
    let id = 0; const wait = {}; ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } });
    const ev = expr => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } })); }).then(d => d.result && d.result.result ? d.result.result.value : undefined);
    const end = Date.now() + 120000; let done = false;
    while (Date.now() < end && !done) { await sleep(500); done = await ev('window.__done === true'); }
    const res = (await ev('JSON.stringify(window.__results || [])')) || '[]';
    JSON.parse(res).forEach(l => { console.log('  ' + l); if (/^PASS/.test(l)) pass++; else fail++; });
    /* what the Helper knows about the first button, as the Hub last saved it (the Hub's page may not call the local open route; this runner does, like the bar) */
    const bid = await ev('window.__btnId'); const chk = (c, l) => { console.log('  ' + (c ? 'PASS  ' : 'FAIL  ') + l); if (c) pass++; else fail++; };
    try {
      const o = await (await fetch('http://localhost:' + PORT + '/api/script/open?button=' + bid)).json();
      const pc = await (await fetch('http://localhost:' + PORT + '/api/script/popup-config?b=' + bid + '&t=' + o.token)).json();
      chk(!!o.token && pc.ok && pc.approved === true && pc.state === 'paused' && pc.questions.length === 1 && pc.questions[0].variable === 'from_whom', 'the Helper knows the button exactly as the Hub saved it: approved, paused, with its one active question');
    } catch (e) { chk(false, 'could not ask the Helper about the button: ' + e.message); }
    chk(!fs.existsSync(path.join(root, 'scripts', '_inbox', 'Imported Note')), 'the drop folder is gone from disk after the import');
    if (!done) { fail++; console.log('  FAIL  the story did not finish in 2 minutes'); }
    ws.close();
  } catch (e) { fail++; console.log('  ERROR  ' + e.message); }
  finally {
    try { spawnSync('taskkill', ['/PID', String(srv.pid), '/T', '/F']); } catch (e) {} try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F']); } catch (e) {}
    await sleep(600); try { fs.rmSync(root, { recursive: true, force: true }); } catch (e) {}
    console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
  }
})();

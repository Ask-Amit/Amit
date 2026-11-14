/* ch_crash_analyzer.js  v1.00 (2026-11-14, Ryan)  -  Computer Health: work out what a hard crash left behind.

   Input: the crash package the helper recorded (amit_crash_check.ps1, saved in amit_device_crash_dumps): the Watch-mode trace (a reading every 30 s),
   the Windows events around the crash, what had just been installed, the earlier unclean shutdowns, and what the computer is made of.
   Output: ChCrash.analyze(dump) -> { headline, kind, facts, findings[], suggestions[], charts, limits[] }.

   HONESTY RULES (Ryan's standard, the first law): it only reports what the data PROVES. A temperature is a finding only if the reading says so; "nothing
   found" is said plainly when that is the truth; a suggestion is a suggestion, in the order worth trying, never a diagnosis. It never guesses a cause it
   cannot see, and it says what it cannot see (limits[]). Old blue-screen dump files that Windows re-reports at every start are not this crash and are set
   aside by the helper (staleDumpReports); they are mentioned once and never counted.

   Plain script, no page code: the same file runs in the browser (window.ChCrash) and in node (module.exports) for tests.
   ChCrash.decode(base64Gzip) -> Promise<dump> unpacks the stored package in the browser (DecompressionStream). */
(function (root) {
  'use strict';
  const MIN = 60000, HOUR = 3600000;
  const SEV = { high: 3, medium: 2, info: 1, ok: 0 };

  // Sensors that are LIMITS, not readings (a drive's "Critical Temperature 84", the CPU's "Distance to TjMax"): never count them as measurements.
  // Found by the first test: the Samsung's critical limit of 84 was reported as "a drive ran hot" and flipped the whole verdict to overheating.
  const isLimit = m => /warning|critical|threshold|limit|distance|tjmax|slowdown|shutdown/i.test(m || '');
  function num(v) { const n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : null; }
  function median(a) { const s = a.filter(x => x != null).slice().sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function fmtT(ms) { try { return new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return String(ms); } }
  function fmtClock(ms) { try { return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }); } catch (e) { return String(ms); } }
  function dur(ms) { const m = Math.round(ms / MIN); if (m < 90) return m + ' min'; const h = ms / HOUR; return (h < 48 ? h.toFixed(1) + ' hours' : (h / 24).toFixed(1) + ' days'); }

  function parseTrace(text) {
    const out = [];
    if (!text) return out;
    for (const ln of String(text).split('\n')) {
      if (!ln || ln.charCodeAt(0) !== 123) continue;
      let o; try { o = JSON.parse(ln); } catch (e) { continue; }
      if (!o.t || !o.s) continue;                       // start / end markers have no readings
      const ms = Date.parse(o.t); if (!isFinite(ms)) continue;
      o.ms = ms; out.push(o);
    }
    return out.sort((a, b) => a.ms - b.ms);
  }
  function parseTop(str) {
    const m = {};
    String(str || '').split(',').forEach(p => { const x = p.trim().match(/^(.+?)=(\d+(?:\.\d+)?)MB$/); if (x) m[x[1]] = parseFloat(x[2]); });
    return m;
  }
  // one series per sensor key: [{ms, v}]
  function keySeries(readings, test) {
    const by = {};
    readings.forEach(r => {
      Object.keys(r.s).forEach(k => {
        const p = k.split('|'); const cat = p[0], title = p[1] || '', metric = p.slice(2).join('|');
        if (!test(cat, title, metric)) return;
        (by[k] = by[k] || { cat, title, metric, pts: [] }).pts.push({ ms: r.ms, v: r.s[k] });
      });
    });
    return by;
  }
  function maxSeries(by) {            // the highest sensor at each moment
    const m = {};
    Object.keys(by).forEach(k => by[k].pts.forEach(p => { if (m[p.ms] == null || p.v > m[p.ms]) m[p.ms] = p.v; }));
    return Object.keys(m).map(Number).sort((a, b) => a - b).map(ms => ({ ms, v: m[ms] }));
  }
  function tail(a, n) { return a.slice(Math.max(0, a.length - n)); }

  function analyze(dump) {
    const F = [], S = [], L = [];
    const add = (sev, title, detail, more) => F.push(Object.assign({ sev, title, detail }, more || {}));
    const lastAlive = Date.parse(dump.lastAliveAt), boot = Date.parse(dump.bootAt);
    const readings = parseTrace(dump.trace);
    const facts = {
      lastAliveMs: lastAlive, bootMs: boot, downMs: boot - lastAlive,
      readings: readings.length, firstMs: readings.length ? readings[0].ms : null, lastMs: readings.length ? readings[readings.length - 1].ms : null,
      bugcheck: dump.bugcheck, sleepInProgress: dump.sleepInProgress, system: dump.system || {}
    };
    const charts = { cpuTemp: [], gpuTemp: [], ramUsed: [], cpuLoad: [], rails: {}, fans: {} };
    let kind = 'unexplained';
    const setKind = k => { if (kind === 'unexplained' || (SEV_RANK[k] || 0) > (SEV_RANK[kind] || 0)) kind = k; };
    const SEV_RANK = { 'blue-screen': 9, 'hardware-error': 8, 'memory-exhausted': 7, 'overheating': 6, 'power-rail': 5, 'fan-stopped': 5, 'disk': 4, 'gpu-driver': 3, 'sleep-wake': 2, 'unexplained': 0 };

    // ---- 1. what kind of stop was it -------------------------------------------------------------------------------------
    const bc = dump.bugcheck != null ? String(dump.bugcheck) : '';
    if (bc && bc !== '0' && bc !== '0x0') {
      add('high', 'Windows reported a blue screen', 'The stop code was ' + (isNaN(+bc) ? bc : '0x' + (+bc).toString(16).toUpperCase()) + '. Windows had time to write a crash report, so a dump file and a specific code exist to look up.'); setKind('blue-screen');
    } else {
      add('info', 'It was a hard stop, not a blue screen',
        'The crash code was 0, which means Windows never got to write a crash report. The computer simply stopped, like a freeze that never recovered or a sudden loss of power. ' +
        'That is why there is no error to read: the evidence has to come from what was recorded just before it stopped.');
    }
    const sp = dump.sleepInProgress != null ? +dump.sleepInProgress : 0;
    if (sp > 0) { add('medium', 'It happened during sleep or wake-up', 'Windows says the computer was changing power state (state ' + sp + ') when it stopped, not running normally.'); setKind('sleep-wake'); }
    else add('info', 'It happened while the computer was awake', 'Windows records it was not sleeping or waking when it stopped.');
    if (dump.powerButtonTimestamp && +dump.powerButtonTimestamp > 0) add('info', 'The power button was held', 'Windows recorded a long press of the power button, which is how a frozen computer is usually forced off.');

    // ---- 2. the recorded readings ------------------------------------------------------------------------------------------
    if (!readings.length) {
      add('medium', 'No readings were recorded before this crash',
        'Watch mode was not recording at the time, so there is nothing to show about heat, memory or power. With Watch mode on, the next crash will leave about 24 hours of readings.');
      L.push('No sensor readings exist for this crash, so only Windows\' own log and the surrounding facts could be used.');
    } else {
      const spanMs = facts.lastMs - facts.firstMs;
      const gapSec = Math.round((lastAlive - facts.lastMs) / 1000);
      if (gapSec > 180) add('medium', 'The recording stopped before the crash', 'The last reading was ' + dur(gapSec * 1000) + ' before Windows\' last-alive moment, so the final stretch is not covered.');
      else add('ok', 'Readings run right up to the end', readings.length + ' readings over ' + dur(spanMs) + '; the last one was ' + Math.max(0, gapSec) + ' seconds before the computer stopped.');

      // temperatures
      const cpuBy = keySeries(readings, (c, t, m) => c === 'Temperatures' && !isLimit(m) && /ryzen|intel|core i|xeon|cpu/i.test(t + ' ' + m) && !/gpu|geforce|radeon|nvidia/i.test(t) && /tctl|tdie|package|cpu|core max|max/i.test(m));
      const gpuBy = keySeries(readings, (c, t, m) => c === 'Temperatures' && !isLimit(m) && /nvidia|geforce|radeon|rtx|gtx/i.test(t));
      const dskBy = keySeries(readings, (c, t, m) => c === 'Temperatures' && !isLimit(m) && /ssd|nvme|kingston|samsung|sandisk|crucial|wd |western/i.test(t));
      charts.cpuTemp = maxSeries(cpuBy); charts.gpuTemp = maxSeries(gpuBy);
      const dskMax = maxSeries(dskBy);
      const peak = a => a.reduce((m, p) => Math.max(m, p.v), -1);
      const riseCheck = (a, label, lim) => {
        if (a.length < 12) return;
        const last = tail(a, 4).reduce((m, p) => Math.max(m, p.v), -1), before = median(a.slice(0, a.length - 4).map(p => p.v));
        if (before != null && last - before >= lim) add('medium', label + ' rose sharply at the end', 'It climbed from about ' + Math.round(before) + ' to ' + Math.round(last) + ' degrees in the last couple of minutes.');
      };
      const cpuPk = peak(charts.cpuTemp), gpuPk = peak(charts.gpuTemp), dskPk = peak(dskMax);
      let hot = false;
      if (cpuPk >= 95) { add('high', 'The processor was dangerously hot', 'It reached ' + Math.round(cpuPk) + ' degrees.'); hot = true; }
      else if (cpuPk >= 85) { add('medium', 'The processor ran hot', 'It reached ' + Math.round(cpuPk) + ' degrees.'); hot = true; }
      if (gpuPk >= 100) { add('high', 'The graphics card was dangerously hot', 'It reached ' + Math.round(gpuPk) + ' degrees.'); hot = true; }
      else if (gpuPk >= 88) { add('medium', 'The graphics card ran hot', 'It reached ' + Math.round(gpuPk) + ' degrees.'); hot = true; }
      if (dskPk >= 80) { add('medium', 'A drive ran hot', 'It reached ' + Math.round(dskPk) + ' degrees.'); hot = true; }
      riseCheck(charts.cpuTemp, 'Processor temperature', 20); riseCheck(charts.gpuTemp, 'Graphics card temperature', 20);
      if (hot) setKind('overheating');
      else if (cpuPk > 0 || gpuPk > 0) add('ok', 'Temperatures stayed normal',
        'Processor peaked at ' + Math.round(cpuPk) + ' degrees' + (gpuPk > 0 ? ', graphics card at ' + Math.round(gpuPk) : '') + (dskPk > 0 ? ', drives at ' + Math.round(dskPk) : '') + '. None of that is hot enough to stop a computer.');

      // memory
      charts.ramUsed = readings.map(r => ({ ms: r.ms, v: r.ram ? r.ram[2] : null })).filter(p => p.v != null);
      if (charts.ramUsed.length) {
        const endUsed = tail(charts.ramUsed, 3).reduce((m, p) => Math.max(m, p.v), 0), startUsed = median(charts.ramUsed.slice(0, 6).map(p => p.v));
        if (endUsed >= 95) { add('high', 'Memory was almost full', 'Memory use was at ' + Math.round(endUsed) + '% at the end.'); setKind('memory-exhausted'); }
        else if (endUsed >= 90) { add('medium', 'Memory was very full', 'Memory use was at ' + Math.round(endUsed) + '% at the end.'); }
        else if (startUsed != null && endUsed - startUsed >= 15 && endUsed >= 80) add('medium', 'Memory use climbed steadily', 'It grew from about ' + Math.round(startUsed) + '% to ' + Math.round(endUsed) + '% across the recording.');
        else add('ok', 'Memory was fine', 'Memory use stayed between ' + Math.round(Math.min.apply(null, charts.ramUsed.map(p => p.v))) + '% and ' + Math.round(Math.max.apply(null, charts.ramUsed.map(p => p.v))) + '%.');
        // which program grew
        const a = parseTop(readings[0].top), b = parseTop(readings[readings.length - 1].top);
        Object.keys(b).forEach(n => { if (a[n] != null && b[n] - a[n] >= 800) add('medium', n + ' kept growing', n + ' went from ' + Math.round(a[n]) + ' MB to ' + Math.round(b[n]) + ' MB over the recording.'); });
      }
      // load
      charts.cpuLoad = readings.map(r => ({ ms: r.ms, v: num(r.cpu) })).filter(p => p.v != null);
      if (charts.cpuLoad.length >= 10) {
        const endLoad = median(tail(charts.cpuLoad, 10).map(p => p.v));
        if (endLoad >= 90) add('medium', 'The processor was flat out', 'Its load was about ' + Math.round(endLoad) + '% over the last few minutes.');
        else add('ok', 'Processor load was ordinary', 'Load was about ' + Math.round(endLoad) + '% at the end.');
      }
      // power rails
      const railBy = keySeries(readings, (c, t, m) => c === 'Voltages' && !/vid|^core #/i.test(m));
      let railBad = false;
      Object.keys(railBy).forEach(k => {
        const R = railBy[k], pts = R.pts; if (pts.length < 20) return;
        const base = median(pts.slice(0, pts.length - 6).map(p => p.v)), lowEnd = Math.min.apply(null, tail(pts, 6).map(p => p.v));
        const name = R.metric.replace(/^\+?/, '+').replace(/^\+(Vcore|AVCC|Voltage.*|CPU.*|3V.*)/, '$1');
        const spec = (/^\+?3\.3V$/i.test(R.metric) && [3.14, 3.47]) || (/^\+?5V$/i.test(R.metric) && [4.75, 5.25]) || (/^\+?12V$/i.test(R.metric) && [11.4, 12.6]) || null;
        if (spec) { const mn = Math.min.apply(null, pts.map(p => p.v)), mx = Math.max.apply(null, pts.map(p => p.v)); if (mn < spec[0] || mx > spec[1]) { railBad = true; add('high', R.metric + ' rail went out of range', 'It read between ' + mn.toFixed(2) + ' and ' + mx.toFixed(2) + ' volts; it should stay within ' + spec[0] + ' to ' + spec[1] + '.'); } }
        if (base > 0.6 && (base - lowEnd) / base > 0.06) { railBad = true; add('medium', R.metric + ' dipped at the end', 'It fell from about ' + base.toFixed(2) + ' to ' + lowEnd.toFixed(2) + ' volts in the last three minutes.'); }
        if (/^\+?3\.3V$|^vcore$|^\+?5V$|^\+?12V$/i.test(R.metric)) charts.rails[R.metric] = pts;
      });
      if (railBad) setKind('power-rail');
      else if (Object.keys(railBy).length) add('ok', 'Power rails looked steady', 'The ' + Object.keys(railBy).length + ' voltage readings the motherboard reports did not sag or drift before the stop.');
      // fans
      const fanBy = keySeries(readings, (c) => c === 'Fans');
      let fanStop = false;
      Object.keys(fanBy).forEach(k => {
        const pts = fanBy[k].pts, before = median(pts.slice(0, Math.max(1, pts.length - 4)).map(p => p.v)), end = tail(pts, 3).every(p => p.v === 0);
        charts.fans[fanBy[k].title.replace(/^.*- /, '') + ' ' + fanBy[k].metric] = pts;
        if (before > 300 && end) { fanStop = true; add('high', fanBy[k].metric + ' stopped spinning', 'It was running at about ' + Math.round(before) + ' RPM and read 0 at the end.'); }
      });
      if (fanStop) setKind('fan-stopped');
    }

    // ---- 3. what Windows itself logged ---------------------------------------------------------------------------------------
    const ev = dump.windowsEvents || [];
    const evms = e => Date.parse(e.t);
    const near = e => { const m = evms(e); return m >= lastAlive - 30 * MIN && m <= boot + 15 * MIN; };
    const nameOf = e => e.src + ' (event ' + e.id + ')';
    const whea = ev.filter(e => /WHEA/i.test(e.src));
    if (whea.length) { add('high', 'Windows logged a hardware error', whea.length + ' report' + (whea.length > 1 ? 's' : '') + ' from the machine-check system, for example: ' + whea[0].msg.slice(0, 160), { evidence: whea.slice(0, 3).map(nameOf) }); setKind('hardware-error'); }
    const disk = ev.filter(e => /^(disk|stornvme|storahci|iaStor|nvme|volmgr|Ntfs)/i.test(e.src) && [7, 11, 15, 51, 52, 55, 117, 129, 153, 157, 158, 159, 161].includes(+e.id));
    if (disk.length) { add('high', 'Windows logged drive trouble', disk.length + ' drive error' + (disk.length > 1 ? 's' : '') + ', for example: ' + disk[0].msg.slice(0, 160), { evidence: disk.slice(0, 3).map(nameOf) }); setKind('disk'); }
    const gpu = ev.filter(e => /^(Display|nvlddmkm|amdkmdag)/i.test(e.src) && (+e.id === 4101 || /stopped responding/i.test(e.msg)));
    if (gpu.length) { add('medium', 'The graphics driver stopped responding', 'Windows logged ' + gpu.length + ' graphics driver reset' + (gpu.length > 1 ? 's' : '') + '.', { evidence: gpu.slice(0, 3).map(nameOf) }); setKind('gpu-driver'); }
    const exh = ev.filter(e => /Resource-Exhaustion/i.test(e.src));
    if (exh.length) { add('high', 'Windows warned it was out of memory', exh[0].msg.slice(0, 200)); setKind('memory-exhausted'); }
    const apps = ev.filter(e => e.log === 'Application' && [1000, 1002].includes(+e.id) && evms(e) <= lastAlive + 60000 && evms(e) >= lastAlive - 30 * MIN);
    if (apps.length) add('medium', 'A program crashed or hung just before', apps.slice(0, 3).map(e => e.msg.slice(0, 120)).join(' / '));
    const preErrs = ev.filter(e => evms(e) <= lastAlive + 60000 && evms(e) >= lastAlive - 30 * MIN && /error|critical|warning/i.test(e.lvl || '') && !/DistributedCOM/.test(e.src));
    if (!whea.length && !disk.length && !gpu.length && !exh.length && !apps.length) {
      if (preErrs.length) add('info', 'Windows logged ' + preErrs.length + ' warning' + (preErrs.length > 1 ? 's' : '') + ' in the half hour before', preErrs.slice(0, 2).map(e => nameOf(e) + ': ' + e.msg.slice(0, 90)).join(' / '));
      else add('ok', 'Windows logged nothing wrong beforehand', 'There were no errors or warnings in the 30 minutes before it stopped, and no hardware, drive, graphics or memory errors around the restart.');
    }
    if (dump.staleDumpReports && dump.staleDumpReports.count) add('info', 'Old blue-screen reports are being re-sent at every start', dump.staleDumpReports.count + ' old dump files (from ' + (dump.staleDumpReports.dates || []).join(', ') + ') are re-reported by Windows each time it starts. They are not this crash and were set aside.');

    // ---- 4. what changed just before ---------------------------------------------------------------------------------------------
    const changes = (dump.recentChanges || []).filter(c => evms(c) >= lastAlive - 72 * HOUR && evms(c) <= lastAlive && !/Security Intelligence Update/i.test(c.msg || ''));
    const big = changes.filter(c => c.kind === 'driver' || c.kind === 'install' || /cumulative|security update|\(KB\d+\)|feature update|driver/i.test(c.msg || ''));
    if (big.length) add('info', big.length + ' change' + (big.length > 1 ? 's' : '') + ' in the 3 days before',
      big.slice(0, 4).map(c => fmtT(evms(c)) + ' ' + String(c.msg).replace(/^Installation Successful: Windows successfully installed the following update:\s*/i, '').slice(0, 90)).join(' / ') + '. A change before a crash is a lead, not proof.');

    // ---- 5. is there a pattern ------------------------------------------------------------------------------------------------------
    const prior = (dump.priorCrashes || []).map(p => ({ ms: Date.parse(p.t), sleep: p.sleepInProgress != null && +p.sleepInProgress > 0 })).filter(p => isFinite(p.ms) && p.ms <= lastAlive + 10 * MIN).sort((a, b) => a.ms - b.ms);
    facts.priorCount = prior.length;
    if (prior.length >= 3) {
      const slept = prior.filter(p => p.sleep), awake = prior.filter(p => !p.sleep);
      const hrs = slept.map(p => new Date(p.ms).getHours());
      const early = hrs.filter(h => h >= 3 && h <= 8).length;
      let t = prior.length + ' unclean shutdowns in the last 45 days: ' + slept.length + ' during sleep or wake-up' + (early >= 3 ? ' (' + early + ' of them between 3 and 8 AM)' : '') + ' and ' + awake.length + ' while awake.';
      if (slept.length >= 3 && sp === 0) t += ' This one was awake, unlike most of the earlier ones.';
      add(prior.length >= 6 ? 'medium' : 'info', 'This is part of a pattern', t);
      const last7 = prior.filter(p => lastAlive - p.ms < 7 * 24 * HOUR).length;
      if (last7 >= 2) add('info', last7 + ' hard shutdowns in the last 7 days', 'Crashes that cluster in time usually share a cause that started recently.');
    }

    // ---- 6. what it runs on ----------------------------------------------------------------------------------------------------------
    const sys = dump.system || {};
    const ramSeen = {};
    (sys.ram || []).forEach(r => {
      const m = String(r).match(/F\d-(\d{4})C\d+.*@\s*(\d{3,4})MHz/i);
      if (m && +m[2] < +m[1] * 0.7) { const k = String(r); ramSeen[k] = (ramSeen[k] || 0) + 1; }
    });
    Object.keys(ramSeen).forEach(r => {
      const m = r.match(/F\d-(\d{4})C\d+.*@\s*(\d{3,4})MHz/i);
      add('info', 'Memory runs below its rated speed', (ramSeen[r] > 1 ? ramSeen[r] + ' modules (' : '') + r.replace(/\s+@.*/, '').replace(/^Unknown\s+/, '') + (ramSeen[r] > 1 ? ')' : '') + ' ' + (ramSeen[r] > 1 ? 'are' : 'is') + ' rated for ' + m[1] + ' but run' + (ramSeen[r] > 1 ? '' : 's') + ' at ' + m[2] + ' MHz (the rated profile is off). That is the safe default and rarely a cause of freezes.');
    });
    if (sys.fastStartup === 1 || sys.fastStartup === '1') add('info', 'Fast Startup is on', 'With Fast Startup, "shut down" does not fully restart Windows, so a problem can survive across days. Turning it off is a cheap test.');

    // ---- verdict and suggestions -----------------------------------------------------------------------------------------------
    const flagged = F.filter(f => f.sev === 'high' || f.sev === 'medium').filter(f => !/pattern|No readings|stopped before|hard shutdowns in the last/i.test(f.title));
    const HEAD = {
      'blue-screen': 'Windows reported a blue screen.', 'hardware-error': 'Windows logged a hardware error around the crash.', 'memory-exhausted': 'The computer ran out of memory.',
      'overheating': 'Something was running too hot before it stopped.', 'power-rail': 'A power reading went out of range before it stopped.', 'fan-stopped': 'A fan stopped spinning before the computer stopped.',
      'disk': 'Windows logged drive trouble around the crash.', 'gpu-driver': 'The graphics driver stopped responding.', 'sleep-wake': 'It stopped while going to sleep or waking up.'
    };
    let headline;
    if (kind !== 'unexplained') headline = HEAD[kind];
    else if (readings.length >= 20 && !flagged.length) headline = 'It stopped without warning, and nothing recorded explains it.';
    else if (!readings.length) headline = 'It stopped, but nothing was being recorded, so the cause cannot be narrowed down yet.';
    else headline = 'It stopped without a clear cause in what was recorded.';

    const sg = (n, t) => { if (!S.includes(t)) S.push(t); };
    if (!readings.length) sg(0, 'Keep Watch mode on. It records a reading every 30 seconds, so the next crash will show what the computer was doing.');
    if (kind === 'overheating') { sg(0, 'Check the fans and heatsinks for dust and make sure the case airflow is not blocked.'); sg(0, 'If it only gets hot under load, reapplying thermal paste is the usual fix.'); }
    if (kind === 'memory-exhausted') sg(0, 'Close or restart the program that was growing; if it keeps happening, check that program for an update.');
    if (kind === 'disk') sg(0, 'Back up important files now, then check the drive\'s health in its maker\'s tool and test the cable or port.');
    if (kind === 'gpu-driver') sg(0, 'Do a clean install of the newest graphics driver and check the card\'s power cables are seated.');
    if (kind === 'hardware-error') sg(0, 'A machine-check error points at the processor, memory or motherboard: run a memory test and check for BIOS updates.');
    if (kind === 'power-rail' || kind === 'unexplained' || kind === 'fan-stopped') {
      sg(0, 'Run a memory test (Windows Memory Diagnostic, or MemTest86 one stick at a time). A hard stop with no logged error is a classic sign of unstable memory.');
      sg(0, 'Check the power: a power supply that is failing or too small, or a loose power cable, ends in exactly this kind of sudden dead stop. The motherboard cannot see the 12-volt rail, so the readings cannot rule this out.');
    }
    const sleepy = sp > 0 || prior.filter(p => p.sleep).length >= 3;
    if (sleepy) sg(0, 'Because it keeps happening around sleep, turn off Fast Startup and look at what wakes the computer (run "powercfg /waketimers" and "powercfg /lastwake" in a command window).');
    if ((sys.fastStartup === 1 || sys.fastStartup === '1') && !sleepy) sg(0, 'Turn off Fast Startup (Control Panel, Power Options, Choose what the power buttons do) so every shut down is a real restart.');
    if (big.length) sg(0, 'If the crashes began right after the change listed above, try removing it (Settings, Windows Update, Update history, Uninstall updates) and see if they stop.');
    sg(0, 'Update the BIOS, chipset and graphics drivers if they are old.');
    if (readings.length) sg(0, 'Keep Watch mode on until the problem is solved. Every crash adds another set of readings to compare against this one.');

    L.push('The readings are every 30 seconds, so they show what the computer was doing up to about the last half minute, not the exact instant it failed.');
    L.push('A true hardware fault can leave every reading normal. "Nothing found" rules out heat, memory use and the readings above; it does not prove the computer is healthy.');
    if (!(sys.ram && sys.ram.length)) L.push('The memory modules could not be read.');

    F.sort((a, b) => SEV[b.sev] - SEV[a.sev]);
    return { headline, kind, facts, findings: F, suggestions: S, charts, limits: L, helpers: { fmtT, fmtClock, dur } };
  }

  async function decode(b64) {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ds = new DecompressionStream('gzip');
    const text = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).text();
    return JSON.parse(text);
  }

  const api = { version: '1.00', analyze, decode, parseTrace };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ChCrash = api;
})(typeof window !== 'undefined' ? window : globalThis);

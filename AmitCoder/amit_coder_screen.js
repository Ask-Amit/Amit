/* amit_coder_screen.js v0.08 (2026-11-27): attachments in a message: screen capture through Show Amit, add files, paste or drag them in.
   Was v0.07: the microphone reconnects by itself; a running job is picked up after a refresh; an old page says so.
   Was v0.06: messages can be sent while Amit works; a status box that never looks locked up; new projects are found.
   Was v0.05: spoken words appear in the box as they are said; a job can no longer stay locked after a restart.
   Was v0.04: the cursor goes into the message box before the microphone starts.
   Was v0.03: a microphone and a speaker that stay on until turned off.
   Was v0.02: permission levels and plain-language approval cards.
   Was v0.01 - the working screen of Amit Coder (the Coding page).
   Carried over from the round-trip test (RoundTripTest\page.html). The one difference: it talks to the person's computer only
   through AmitCoderLink (amit_coder_link.js), which goes through the shared Amit Helper.
   AmitCoderScreen.mount(element) puts the screen on a page. The same screen is moved if the page is rebuilt, so nothing is lost. */
(function () {
  'use strict';
  if (window.AmitCoderScreen) return;

  var CSS = `
#cd{flex:1;min-height:0;display:flex;flex-direction:column;position:relative;font-size:15px;line-height:1.5;color:var(--amit-text,#f0e8d0)}
#cd button,#cd select,#cd textarea,#cd input{font:inherit;color:inherit}
#cd button,#cd select{background:#0f2338;border:1px solid rgba(201,168,76,.55);border-radius:6px;padding:4px 11px;cursor:pointer}
#cd button:disabled{opacity:.4;cursor:default}
#cd .gold{background:#c9a84c;color:#09141f;font-weight:700}
#cd .cd-top{background:#0f2338;padding:7px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid rgba(201,168,76,.4)}
#cd-info{font-size:12.5px;opacity:.75;width:100%}
#cd-meter{width:100%;display:flex;gap:18px;flex-wrap:wrap;align-items:center;font-size:13.5px}
#cd .m{display:flex;gap:8px;align-items:center}
#cd .m u{display:inline-block;width:130px;height:9px;border-radius:5px;background:#09141f;overflow:hidden;text-decoration:none}
#cd .m u i{display:block;height:100%;width:0;background:#50d78c}
#cd .m small,#cd-age{opacity:.6;font-size:12px}
#cd-sess,#cd-where{width:100%;font-size:13.5px}
#cd-where{display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:#9be8bf}
#cd-where.ask-name{color:#ffd36b}
#cd .combo{position:relative}
#cd-drop{position:absolute;left:0;top:100%;z-index:8;min-width:240px;max-height:300px;overflow:auto;background:#0f2338;border:1px solid #c9a84c;border-radius:6px;color:#f0e8d0}
#cd-drop div{padding:4px 10px;cursor:pointer}
#cd-drop div.on,#cd-drop div:hover{background:#2a4a6e}
#cd-project,#cd-find,#cd-topic{background:#050b12;border:1px solid rgba(201,168,76,.55);border-radius:6px;padding:3px 8px}
#cd-topic{width:220px}
#cd-tip{display:none;width:100%;gap:12px;align-items:center;flex-wrap:wrap;background:#33280f;border:1px solid #e8be46;border-radius:8px;padding:6px 10px;font-size:13.5px}
#cd-log{flex:1;min-height:120px;overflow:auto;padding:12px;background:#09141f}
#cd-past{position:absolute;inset:0;background:rgba(4,10,18,.97);z-index:9;display:flex;flex-direction:column;padding:14px}
#cd [hidden]{display:none!important}
#cd-past-bar{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center}
#cd-list{flex:1;overflow:auto;margin-top:10px}
#cd-list button{display:block;width:100%;text-align:left;margin-bottom:6px;padding:8px 12px}
#cd-list small{display:block;opacity:.65;font-size:12px}
#cd .row{display:flex;gap:9px;margin-bottom:7px}
#cd .what{flex:1;min-width:0}
#cd .you{background:#14304c;border-radius:8px;padding:7px 11px;white-space:pre-wrap}
#cd .say{white-space:pre-wrap;word-break:break-word}
#cd .think{white-space:pre-wrap;opacity:.65;font-style:italic;border-left:3px solid #6b6f86;padding-left:9px}
#cd .quiet{font-size:12.5px;opacity:.65}
#cd .err{color:#ff9d8a;font:12.5px Consolas,monospace;white-space:pre-wrap}
#cd details{background:#0d1d2f;border:1px solid #1f3a56;border-radius:8px;padding:5px 10px}
#cd summary{cursor:pointer;word-break:break-all}
#cd pre{white-space:pre-wrap;word-break:break-word;font:12.5px/1.45 Consolas,monospace;background:#050b12;padding:7px;border-radius:5px;margin-top:6px;max-height:320px;overflow:auto}
#cd .permit{border:2px solid #e8c56a;border-radius:10px;padding:10px;background:#201d12}
#cd .permit button{margin:8px 8px 0 0}
#cd-levels{width:100%;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:13.5px}
#cd-levels button.on{background:#c9a84c;color:#09141f;font-weight:700;opacity:1}
#cd-understand{width:100%;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:13.5px}
#cd-understand button.on{background:#c9a84c;color:#09141f;font-weight:700;opacity:1}
#cd-level-text{width:100%;font-size:12.5px;opacity:.8}
#cd .permit h3{margin:0 0 6px;font-size:17px}
#cd .permit p{margin:3px 0}
#cd .permit .k{color:#e8c56a;font-weight:600}
#cd .permit .warn{margin-top:8px;background:#2c1a12;border:1px solid #ffb08a;color:#ffb08a;border-radius:8px;padding:7px 10px}
#cd .permit .heads{margin-top:8px;border:1px solid #7fb6e8;background:#12222f;color:#cfe6fa;border-radius:8px;padding:7px 10px}
#cd .permit .more{background:none;border:0;text-decoration:underline;opacity:.75}
#cd .permit .once{font-size:12px;opacity:.65;margin-top:7px}
#cd .done{font-size:12.5px;opacity:.7;white-space:pre-wrap}
#cd .work-btn{display:inline-flex;align-items:center;gap:9px;font:13.5px Consolas,monospace;color:#e8c56a}
#cd .work-btn i{width:16px;height:16px;border:2px solid #e8c56a;border-radius:50%;position:relative}
#cd .work-btn i::after{content:"";position:absolute;left:5px;top:1px;width:2px;height:5px;background:#e8c56a;transform-origin:50% 100%;animation:cdhand 1s linear infinite}
#cd .work-btn.finished i{display:none}
@keyframes cdhand{to{transform:rotate(360deg)}}
#cd .behind{margin:0 0 9px;border-left:3px solid #2b4a6b;padding-left:10px}
#cd .extras{border-top:1px solid rgba(201,168,76,.4);padding:7px 12px 0;display:flex;gap:8px;flex-wrap:wrap}
#cd .extras button.used{background:#3a3320;border-color:#e8c56a}
#cd-pics{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:9px 12px 0;font-size:13.5px}
#cd-pics .pic{position:relative}
#cd-pics img{height:70px;max-width:160px;object-fit:cover;border:1px solid #c9a84c;border-radius:6px;display:block}
#cd-pics .doc,#cd .you .doc{display:block;border:1px solid #c9a84c;border-radius:6px;padding:7px 14px;font-size:13px;word-break:break-all}
#cd-pics .pic button{position:absolute;top:-8px;right:-8px;width:22px;height:22px;padding:0;border-radius:50%;line-height:1}
#cd .you img{display:block;max-height:140px;max-width:100%;margin-top:6px;border-radius:6px}
#cd .you .doc{margin-top:6px}
#cd .compose{padding:7px 70px 9px 12px;display:flex;gap:9px;align-items:flex-end}
#cd-status{margin:6px 12px 0;border:2px solid;border-radius:10px;padding:8px 11px}
#cd-status.work{border-color:#50d78c;background:#0f2a1f}
#cd-status.you,#cd-status.slow{border-color:#e8be46;background:#33280f}
#cd-status.stop{border-color:#ff8b73;background:#2c1a12}
#cd-status .head{display:flex;gap:10px;align-items:center;font-weight:700}
#cd-status .head span:last-child{margin-left:auto;font:13px Consolas,monospace;opacity:.85}
#cd-status i{width:11px;height:11px;flex:none;border-radius:50%;background:#e8be46}
#cd-status.work i{background:#50d78c;animation:cdpulse 1s infinite}
#cd-status.stop i{background:#ff8b73;border-radius:2px}
@keyframes cdpulse{50%{opacity:.25}}
#cd-status-more{font-size:13px;opacity:.85}
#cd-status-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
#cd-status-acts:empty{display:none}
#cd-newer{padding:7px 12px;background:#33280f;border-bottom:1px solid #e8be46;display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:13.5px}
#cd-voice{padding:5px 12px 0;font-size:13.5px;color:#50d78c;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#cd-voice b{font-weight:600}
#cd .compose button.round{width:46px;height:46px;flex:none;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center}
#cd .compose button.round.on{background:#50d78c;border-color:#50d78c;color:#06210f;opacity:1}
#cd-box.listening{border:2px solid #50d78c;box-shadow:0 0 0 3px rgba(80,215,140,.2)}
#cd-box{flex:1;background:#050b12;border:1px solid rgba(201,168,76,.55);border-radius:8px;padding:8px;height:70px;resize:vertical}
`;

  var HTML = `
<div class="cd-top">
  <label>Model <select id="cd-model"><option value="">my default</option><option value="opus">opus</option><option value="claude-sonnet-5-5">Sonnet 5.5</option><option value="sonnet">sonnet</option><option value="haiku">haiku</option></select></label>
  <label>Effort <select id="cd-effort"><option value="">my default</option><option>low</option><option>medium</option><option>high</option></select></label>
  <label>Setup <select id="cd-hooks"><option value="light">light (buttons)</option><option value="full">my full setup</option></select></label>
  <button id="cd-new">New session</button><button id="cd-past-open" title="Open or continue an earlier session">📂 Sessions</button><button id="cd-resume">Resume last</button>
  <div id="cd-levels"><b>How often should Amit ask you?</b><button data-lv="0" disabled>Ask me everything</button><button data-lv="1" disabled>Ask me some things</button><button data-lv="2" disabled>Ask me very little</button><div id="cd-level-text">Your choice appears when your computer is connected.</div></div>
  <div id="cd-understand"><b>How should Amit explain things to you?</b><button data-un="0" disabled>Plain words</button><button data-un="1" disabled>Some experience</button><button data-un="2" disabled>Technical / coder</button></div>
  <div id="cd-meter"><span class="m" id="cd-m-five_hour"><b>5-hour</b><u><i></i></u><span>waiting for the first message</span><small></small></span><span class="m" id="cd-m-seven_day"><b>Week</b><u><i></i></u><span>waiting</span><small></small></span><span id="cd-age"></span></div>
  <div id="cd-where"><b>Project</b><span class="combo"><input id="cd-project" placeholder="type to find a project" autocomplete="off"><div id="cd-drop" hidden></div></span><b>Topic</b><input id="cd-topic" placeholder="optional, like Amit Pad, then Enter" title="The part of the project you are working on. It is added to the session name."><span id="cd-where-text"></span></div>
  <div id="cd-sess"></div>
  <div id="cd-tip"><span></span><button id="cd-tip-new" class="gold" title="Saves and wraps up (this uses Claude), then opens a new session">Save and start new session</button></div>
  <div id="cd-info">Looking for your computer…</div>
</div>
<div id="cd-newer" hidden><b>A newer version of this page is ready.</b> <button id="cd-newer-go" class="gold">Load it now</button> <span>A job that is running keeps going.</span></div>
<div id="cd-log"></div>
<div id="cd-past" hidden><div><b style="color:#e8c56a">Earlier sessions</b> <button id="cd-past-close">Close</button></div><div id="cd-past-bar"><input id="cd-find" placeholder="find by name or words"><label>Sort <select id="cd-sort"><option value="new">newest first</option><option value="name">by project name</option></select></label></div><div id="cd-list"></div></div>
<div class="extras">
  <button data-b="save" data-label="Save and wrap up" title="The program saves the text; Claude then updates your project notes. This can change files.">💾 Save and wrap up</button>
  <button data-b="scripture" data-label="Study Scripture" title="Loads the Scripture research standard. Type your question first, or press it and then ask.">📖 Study Scripture</button>
  <button data-b="amit" data-label="Talk with Amit" title="Brings Amit forward as companion">🤝 Talk with Amit</button>
  <button data-b="apps" data-label="What apps are there?" title="Looks up the list of applications">🗂 What apps are there?</button>
  <button data-b="release" data-label="Helper release rules (loads the rules only)" title="Developer. It only loads the rules.">🛠 Helper release rules (developer)</button>
</div>
<div id="cd-status" role="status" hidden><div class="head"><i></i><span id="cd-status-title"></span><span id="cd-status-time"></span></div><div id="cd-status-more"></div><div id="cd-status-acts"></div></div>
<div id="cd-voice" hidden><b id="cd-voice-text"></b><button id="cd-hush" hidden>Stop reading</button></div>
<div id="cd-pics" hidden></div>
<div class="compose">
  <button id="cd-cap" class="round" title="Screen capture: opens Show Amit. Press Capture, mark it up, then Send to Amit. The picture lands here." aria-label="Screen capture">📷</button>
  <button id="cd-add" class="round" title="Attach a file from your computer: a picture, PDF, or text or code file (you can also paste or drag it in)" aria-label="Attach a file">＋</button><input id="cd-file" type="file" multiple hidden>
  <textarea id="cd-box" placeholder="Type here and press Enter (Shift+Enter for a new line)"></textarea>
  <button id="cd-mic" class="round" title="Microphone: stays on until you turn it off. Enter or right-click sends." aria-label="Microphone" aria-pressed="false" disabled><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg></button>
  <button id="cd-spk" class="round" title="Speaker: reads Amit\u2019s closing message and approval requests aloud" aria-label="Read answers aloud" aria-pressed="false" disabled><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 6a9 9 0 0 1 0 12"/></svg></button>
  <button id="cd-send" class="gold">Send</button><button id="cd-stop" disabled>■ Stop</button>
</div>`;

  var root = null;

  function build() {
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    root = document.createElement('div'); root.id = 'cd'; root.innerHTML = HTML;
    var q = function (id) { return root.querySelector('#cd-' + id); };
    var link = function () { return window.AmitCoderLink; };
    var extras = function () { return Array.prototype.slice.call(root.querySelectorAll('.extras button')); };
    var extra = 0, watch = null, run = null, blocks = {}, tools = {}, ready = false, wantNew = false, openedAt = Date.now();
    var secs = function (ms) { return (ms / 1000).toFixed(ms < 1000 ? 3 : 1); };
    var opts = function () { return { model: q('model').value, effort: q('effort').value, hooks: q('hooks').value }; };
    var store = function (k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; };

    function controls() {
      var busy = !!(run && !run.over);
      q('send').disabled = !ready; q('stop').disabled = !busy;
      extras().forEach(function (b) { b.disabled = !ready || busy; });
      ['new', 'resume', 'past-open'].forEach(function (id) { q(id).disabled = !ready; });
    }
    function row(cls, text, t, onForm) {
      var l = q('log'), into = (!onForm && run && run.panel) ? run.panel : l, stick = l.scrollHeight - l.scrollTop - l.clientHeight < 60;
      var r = document.createElement('div'), w = document.createElement('div');
      r.className = 'row'; w.className = 'what ' + (cls || ''); if (text != null) w.textContent = text;
      r.appendChild(w); into.appendChild(r); if (stick) l.scrollTop = l.scrollHeight; return w;
    }
    // The form shows what was typed and the result. Everything in between sits behind one button with a running timer.
    function detailsButton() {
      var w = row('', null, 0, true), b = document.createElement('button'), i = document.createElement('i'), s = document.createElement('span'), p = document.createElement('div');
      b.className = 'work-btn'; s.textContent = 'Show details'; b.append(i, s); p.className = 'behind'; p.hidden = true; b.title = 'Show or hide what happened behind the scenes'; b.onclick = function () { p.hidden = !p.hidden; };
      w.appendChild(b); q('log').appendChild(p); run.btn = b; run.label = s; run.panel = p; q('log').scrollTop = q('log').scrollHeight;
    }
    function follow() { var l = q('log'); if (l.scrollHeight - l.scrollTop - l.clientHeight < 140) l.scrollTop = l.scrollHeight; }
    function fold(title, body, t, open) { var w = row('', null, t), d = document.createElement('details'), s = document.createElement('summary'), p = document.createElement('pre'); s.textContent = title; p.textContent = body; d.open = !!open; d.append(s, p); w.appendChild(d); return { s: s, p: p, d: d }; }

    /* attachments waiting to go with the next message. Nothing is sent until the person presses send. */
    var pics = [], MAX_FILES = 4, MAX_PIC = 900000, MAX_ALL = 3500000, HELPER = 'http://localhost:8710', TAG = 'amit-coder', capTimer = null, capTaken = {};
    function picNote(t) { row('err', t, 0, true); q('log').scrollTop = q('log').scrollHeight; }
    function thumb(p) {
      var el = document.createElement(p.url ? 'img' : 'span');
      if (p.url) { el.src = p.url; el.alt = p.name; el.title = p.name; } else { el.className = 'doc'; el.textContent = '\ud83d\udcc4 ' + p.name; }
      return el;
    }
    function picPaint() {
      var box = q('pics'); box.textContent = ''; box.hidden = !pics.length;
      pics.forEach(function (p) {
        var d = document.createElement('div'), x = document.createElement('button'); d.className = 'pic';
        x.textContent = '\u00d7'; x.title = 'Remove ' + p.name; x.onclick = function () { pics.splice(pics.indexOf(p), 1); picPaint(); };
        d.append(thumb(p), x); box.appendChild(d);
      });
    }
    function attach(item) {
      var total = pics.reduce(function (n, p) { return n + p.data.length; }, item.data.length);
      if (pics.length >= MAX_FILES) { picNote('A message can hold ' + MAX_FILES + ' attachments. Remove one first.'); return false; }
      if (total > MAX_ALL) { picNote(item.name + ' makes this message too large. Send it in a message of its own, or ask Amit to open it from your computer.'); return false; }
      pics.push(item); picPaint(); return true;
    }
    async function addPicture(blob, name) {
      try {
        var bmp = await createImageBitmap(blob), scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), url = '';
        for (var n = 0; n < 6; n++, scale *= 0.8) {
          var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
          var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
          url = c.toDataURL('image/png'); if (url.length > MAX_PIC) url = c.toDataURL('image/jpeg', 0.85);
          if (url.length <= MAX_PIC) break;
        }
        if (url.length > MAX_PIC) { picNote('That picture is too large to send.'); return false; }
        return attach({ name: name || 'picture', url: url, media_type: url.slice(5, url.indexOf(';')), data: url.slice(url.indexOf(',') + 1) });
      } catch (e) { picNote('That file could not be read as a picture.'); return false; }
    }
    async function addFile(f) {
      var name = f.name || 'file';
      if (/^image\//.test(f.type)) return addPicture(f, name);
      if (f.type === 'application/pdf' || /\.pdf$/i.test(name)) {
        if (f.size > 2500000) { picNote(name + ' is too large to attach. Ask Amit to open it from your computer instead.'); return false; }
        var url = await new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = function () { res(''); }; r.readAsDataURL(f); });
        return url ? attach({ name: name, media_type: 'application/pdf', data: url.slice(url.indexOf(',') + 1) }) : false;
      }
      if (f.size > 300000) { picNote(name + ' is too large to attach. Ask Amit to open it from your computer instead.'); return false; }
      var text = await f.text();
      if (text.indexOf('\u0000') >= 0 || text.indexOf('\ufffd') >= 0) { picNote(name + ' is a kind of file that cannot be attached yet. Pictures, PDFs and text or code files work.'); return false; }
      return attach({ name: name, media_type: 'text/plain', data: text });
    }
    function picFiles(list) { Array.prototype.slice.call(list || []).reduce(function (p, f) { return p.then(function () { return addFile(f); }); }, Promise.resolve()); }
    async function helperJson(path) { try { var r = await fetch(HELPER + path, { cache: 'no-store' }); return await r.json(); } catch (e) { return null; } }
    async function capture() {
      var from = Date.now() - 2000, until = Date.now() + 10 * 60000;
      var j = await helperJson('/api/menu/open?id=show-amit&origin=' + TAG);
      if (!j || !j.ok) { picNote('Show Amit did not open.' + (j && j.error ? ' ' + j.error : ' The Amit Helper did not answer.')); return; }
      clearInterval(capTimer); var looking = false;
      capTimer = setInterval(async function () {          // only a picture sent back to the Coder, made after this press, is taken
        if (Date.now() > until) { clearInterval(capTimer); return; }
        if (looking) return; looking = true;
        try {
          var s = await helperJson('/api/showamit/pending');
          if (s && s.id && s.origin === TAG && Number(s.id) >= from && !capTaken[s.id]) {
            var r = await fetch(HELPER + '/api/showamit/pending.png?id=' + encodeURIComponent(s.id), { cache: 'no-store' });
            if (r.ok) {
              capTaken[s.id] = true;
              if (await addPicture(await r.blob(), s.name || 'screen capture')) {
                var asked = /^Question: ([^|]*)/.exec(s.text || ''), b = q('box');
                if (asked) b.value = (b.value && !/\s$/.test(b.value) ? b.value + ' ' : b.value) + asked[1].trim();
                b.focus();
              }
            }
          }
        } catch (e) {} finally { looking = false; }
      }, 1000);
    }
    function picRow(text, sent) { var w = row('you', text, 0, true); sent.forEach(function (p) { w.appendChild(thumb(p)); }); return w; }
    function withPics(o, sent) { return sent.length ? Object.assign({ files: sent.map(function (p) { return { name: p.name, media_type: p.media_type, data: p.data }; }) }, o) : o; }
    function picsRefused(sent) { picNote('This Amit Helper is older and cannot take attachments yet. Your words were sent without them.'); pics = sent.concat(pics); picPaint(); }

    function send(button) {
      var typed = q('box').value.trim(), sent = button ? [] : pics.slice();
      if (!ready || (!typed && !button && !sent.length)) return;
      if (run && !run.over) {                       // Amit is working: this message joins the job
        if (button || (!typed && !sent.length)) return;
        q('box').value = ''; live = ''; extra++; if (sent.length) { pics = []; picPaint(); }
        picRow(typed + '  (sent while Amit was working)', sent); q('log').scrollTop = q('log').scrollHeight;
        link().send(typed, withPics(opts(), sent)).then(function (ok) { if (ok === 'no-attachments') { picsRefused(sent); } else if (!ok) { extra--; row('err', 'That message could not be delivered.' + (link().lastError() ? ' ' + link().lastError() : ''), 0, true); if (!q('box').value) q('box').value = typed; pics = sent.concat(pics); picPaint(); } });
        return;
      }
      extra = 0;
      var label = button ? '[Button: ' + button.dataset.label + ']' : '', text = [label, typed].filter(Boolean).join('  ');
      hush();
      live = '';
      run = { p0: performance.now(), open: 0, text: text }; blocks = {};
      q('box').value = ''; if (sent.length) { pics = []; picPaint(); } picRow(text, sent); detailsButton(); controls(); watchStart();
      link().send(typed, withPics(Object.assign({ button: button ? button.dataset.b : '' }, opts()), sent)).then(function (ok) {
        if (ok === 'no-attachments') { picsRefused(sent); return; }
        if (ok) { if (button) button.classList.add('used'); return; }
        row('err', 'The message could not be delivered.' + (link().lastError() ? ' ' + link().lastError() : ''), 0, true);
        if (!q('box').value) q('box').value = typed;
        pics = sent.concat(pics); picPaint();
        end();
      });
    }
    function end() {
      if (!run || run.over) return;
      run.done = performance.now() - run.p0; run.over = true;
      if (run.btn) { run.btn.classList.add('finished'); run.label.textContent = 'Details · ' + secs(run.done) + 's'; }
      if (watch && watch.state !== 'stop') watchHide();
      controls();
    }
    var short = function (s, n) { s = String(s).replace(/\s+/g, ' '); return s.length > n ? s.slice(0, n) + '…' : s; };
    var argOf = function (i) { return (i && (i.file_path || i.command || i.pattern || i.query || i.url || i.description || i.prompt)) || ''; };
    function resultText(c) { if (typeof c === 'string') return c; if (Array.isArray(c)) return c.map(function (x) { return x.type === 'text' ? x.text : '[' + x.type + ']'; }).join('\n'); return JSON.stringify(c, null, 2); }
    /* ── the status box: working, waiting for the person, quiet, or stopped. It never looks busy when nothing is happening ── */
    var QUIET_MS = 60000;
    function watchStart() { clearInterval(watch && watch.timer); watch = { state: 'work', count: 0, step: 'Starting…', worked: 0, last: Date.now(), tick: Date.now(), quietFrom: Date.now(), timer: setInterval(watchTick, 500) }; watchPaint(); }
    function watchHide() { if (watch) clearInterval(watch.timer); watch = null; q('status').hidden = true; }
    function watchStep(text) { if (!watch || watch.state === 'stop') return; if (text) watch.step = text; watch.last = watch.quietFrom = Date.now(); watchPaint(); }
    function watchTick() {
      if (!watch || watch.state === 'stop') return;
      var now = Date.now(); if (!(run && run.open)) watch.worked += now - watch.tick; else watch.quietFrom = now;
      watch.tick = now; watchPaint();
    }
    function watchAction(label, gold, fn) { var b = document.createElement('button'); b.textContent = label; if (gold) b.className = 'gold'; b.onclick = fn; q('status-acts').appendChild(b); }
    function watchPaint() {
      if (!watch) return;
      var idle = Date.now() - watch.last, kind = watch.state === 'stop' ? 'stop' : run && run.open ? 'you' : Date.now() - watch.quietFrom >= QUIET_MS ? 'slow' : 'work';
      var s = Math.floor(watch.worked / 1000), box = q('status');
      q('status-time').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      var title = kind === 'work' ? watch.step : kind === 'you' ? 'Waiting for you' : kind === 'slow' ? 'Nothing new for ' + Math.max(1, Math.floor(idle / 60000)) + ' minute(s)' : watch.title;
      var more = kind === 'work' ? 'Connected. ' + (watch.count ? watch.count + ' step(s) so far. ' : '') + 'Last activity ' + (idle < 2000 ? 'just now.' : Math.round(idle / 1000) + ' seconds ago.') : kind === 'you' ? 'Amit has paused until you answer the question above. The work clock is paused.' : kind === 'slow' ? 'Your computer is still connected and the job has not ended. Some steps take a while. You can wait or stop.' : watch.more;
      if (q('status-title').textContent !== title) q('status-title').textContent = title;
      q('status-more').textContent = more; box.hidden = false;
      if (box.dataset.kind === kind && !watch.redraw) return;
      box.dataset.kind = kind; watch.redraw = false; box.className = kind; q('status-acts').textContent = '';
      if (kind === 'you') watchAction('Show me the question', true, function () { var p = root.querySelector('#cd-log .permit button:not([disabled])'); if (p) p.closest('.permit').scrollIntoView({ block: 'center' }); });
      if (kind === 'slow') { watchAction('Keep waiting', false, function () { watch.quietFrom = Date.now(); watchPaint(); }); watchAction('Stop this job', true, function () { q('stop').click(); }); }
      if (kind === 'stop') {
        if (watch.session) watchAction('Check what was done and continue', true, function () { carryOn(watch && watch.session); });
        watchAction('Close this', false, watchHide);
      }
    }
    function watchStopped(title, more, session) { if (!watch) watchStart(); clearInterval(watch.timer); watch.state = 'stop'; watch.title = title; watch.more = more; watch.session = session || null; watch.redraw = true; watchPaint(); }
    function carryOn(id) {
      if (!id) return;
      if (!ready) { q('status-more').textContent = 'Still reconnecting to your computer. Press it again in a few seconds.'; return; }
      watchHide();
      link().open(id, opts()).then(function (ok) {
        if (!ok) { row('err', 'That conversation could not be reopened. ' + link().lastError(), 0, true); return; }
        setTimeout(function () { q('box').value = 'The job was cut off. First check what was already done, so nothing is done twice. Then continue where you left off.'; send(); }, 1800);
      });
    }
    function stepWords(c) {
      var i = c.input || {}, file = String(i.file_path || i.notebook_path || '').split(/[\\/]/).pop();
      if (c.name === 'Read') return 'Reading ' + (file || 'a file');
      if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name)) return 'Changing ' + (file || 'a file');
      if (/^(Bash|PowerShell)$/.test(c.name)) return String(i.description || 'Running a step').split('|')[0].trim() || 'Running a step';
      if (/^(Grep|Glob)$/.test(c.name)) return 'Searching ' + (String(i.path || '').split(/[\\/]/).pop() || 'your files') + (i.pattern ? ' for “' + short(i.pattern, 36) + '”' : '');
      if (/^Web/.test(c.name)) return 'Looking on the internet';
      return 'Working on a step';
    }

    /* ── microphone and speaker. Both stay as set until the person turns them off. The listening and the voice are the Helper's ── */
    var micOn = false, micSeq = -1, micLoop = 0, micNote = '', interim = '', spkOn = false, speaking = false, spkTimer = null, spkSeen = 0, cutting = false;
    var tellers = { 'not-allowed': 'The microphone is not allowed on this computer.', 'no-mic': 'No microphone was found.', network: 'The speech service could not be reached.' };
    function voiceLine() {
      var text = '';
      if (micOn) text = speaking ? 'Microphone on. Waiting while Amit reads…' : 'Microphone on. Enter or right-click sends.';
      else if (speaking) text = 'Reading aloud…';
      if (micNote) text = (text ? text + '  ·  ' : '') + micNote;
      q('voice-text').textContent = text; q('hush').hidden = !speaking; q('voice').hidden = !text;
      [['mic', micOn], ['spk', spkOn]].forEach(function (p) { q(p[0]).classList.toggle('on', p[1]); q(p[0]).setAttribute('aria-pressed', String(p[1])); q(p[0]).disabled = !ready && !p[1]; });
      q('box').classList.toggle('listening', micOn);
    }
    // words go to the message box wherever the person last clicked
    function putWords(w) {
      var b = q('box'), space = b.value && !/\s$/.test(b.value) ? ' ' : '';
      if (document.activeElement === b) b.setRangeText(space + w, b.selectionStart, b.selectionEnd, 'end'); else b.value += space + w;
      b.scrollTop = b.scrollHeight;
    }
    // the phrase still being spoken is in the box already, and is corrected in place until it is final
    var live = '';
    function putLive(text, done) {
      var b = q('box'), v = b.value, at = live ? v.lastIndexOf(live) : -1;
      if (at < 0) { if (!text) { live = ''; return; } putWords(text); live = done ? '' : text; return; }
      var caret = b.selectionStart, atEnd = caret >= at + live.length, shift = text.length - live.length;
      b.value = v.slice(0, at) + text + v.slice(at + live.length);
      if (document.activeElement === b && atEnd) b.selectionStart = b.selectionEnd = Math.max(0, Math.min(b.value.length, caret + shift));
      b.scrollTop = b.scrollHeight; live = done ? '' : text;
    }
    function micDown(why) { live = ''; micOn = false; micLoop++; interim = ''; micNote = why || ''; voiceLine(); }
    var again = null;
    function reconnect(after) {
      if (!micOn || again) return;
      live = ''; micNote = 'Reconnecting the microphone… words said right now may be missed.'; voiceLine();
      again = setTimeout(function () {
        again = null; if (!micOn) return;
        link().mic('on').then(function (ok) { if (!micOn) { if (ok) link().mic('off'); return; } if (ok) { micNote = ''; voiceLine(); } else reconnect(5000); });
      }, after);
    }
    function listenLoop(mine) {
      link().micWords(micSeq).then(function (j) {
        if (mine !== micLoop) return;
        if (!j) { link().mic('off'); micDown('The microphone stopped: the connection to your computer did not answer.'); return; }
        micSeq = j.seq;
        (j.events || []).forEach(function (ev) {
          if (ev.k === 'final' && ev.t) putLive(ev.t, true);
          else if (ev.k === 'interim' && ev.t) putLive(ev.t, false);
          else if (ev.k === 'error' && /not-allowed|no-mic|unsupported/.test(ev.t)) { link().mic('off'); micDown(tellers[ev.t] || 'Amit cannot listen on this computer.'); }
          else if (ev.k === 'error' || ev.k === 'coderoff') reconnect(1500);
          if (ev.k === 'final' || ev.k === 'interim') { if (micNote.indexOf('Reconnecting') === 0) micNote = ''; }
        });
        if (mine !== micLoop) return;
        voiceLine(); listenLoop(mine);
      });
    }
    function micStart() {
      q('box').focus();   // the cursor goes into the message box first, before anything is switched on
      hush(); micNote = 'Turning the microphone on…'; voiceLine(); q('mic').disabled = true;
      link().micWords(-1).then(function (j) {
        micSeq = j ? j.seq : -1;
        return j ? link().mic('on') : false;
      }).then(function (ok) {
        q('mic').disabled = false;
        if (!ok) { micDown(link().lastError() || 'The microphone needs Amit Helper 2.38 or newer.'); return; }
        micOn = true; live = ''; micNote = ''; q('box').focus(); voiceLine(); listenLoop(++micLoop);
      });
    }
    function micStop() {
      micOn = false; interim = ''; voiceLine();
      var mine = micLoop;   // the last words still arrive just after switching off
      link().mic('off').then(function () { setTimeout(function () { if (mine === micLoop) micLoop++; }, 1500); });
    }
    // Enter or right-click while the microphone is on: collect the last words, send, and keep listening
    function voiceSend() {
      if (cutting) return;
      cutting = true;
      link().mic('cut').then(function () {
        setTimeout(function () {
          cutting = false; interim = '';
          micNote = q('box').value.trim() ? '' : 'Nothing was heard, so nothing was sent.';
          send(); voiceLine(); if (micOn) q('box').focus();
        }, 700);
      });
    }
    // what is read aloud: the words, without the marks, code blocks or long file paths
    function forEars(text) {
      var BS = String.fromCharCode(92), tick = String.fromCharCode(96);
      return String(text || '')
        .replace(new RegExp(tick + tick + tick + '[^]*?' + tick + tick + tick, 'g'), ' There is code on the screen. ')
        .replace(/^\s*\|?[\s:\-|]+\|[\s:\-|]*$/gm, '')
        .replace(/^\s*\|(.*)\|\s*$/gm, function (m, row) { return row.split('|').map(function (c) { return c.trim(); }).filter(Boolean).join(', ') + '.'; })
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(new RegExp('[A-Za-z]:' + BS + BS + '[^' + tick + '"\\n]*' + BS + BS + '([^' + BS + BS + tick + '"\\s]+)', 'g'), '$1')
        .replace(new RegExp('[*#>' + tick + ']', 'g'), '')
        .replace(/\n{2,}/g, '\n').trim();
    }
    function watchSpeaking() {
      clearTimeout(spkTimer);
      spkTimer = setTimeout(function () {
        link().sayState().then(function (j) {
          if (!speaking) return;
          if (j && j.speaking) { spkSeen = Date.now(); watchSpeaking(); return; }
          if (Date.now() - spkSeen < 1500) { watchSpeaking(); return; }
          speaking = false; voiceLine();
        });
      }, 800);
    }
    function readAloud(text) {
      if (!spkOn) return;
      var words = forEars(text); if (!words) return;
      speaking = true; spkSeen = Date.now(); voiceLine();
      link().say(words).then(function (ok) { if (!ok) { speaking = false; micNote = 'That could not be read aloud.'; voiceLine(); } else watchSpeaking(); });
    }
    function hush() { if (!speaking) return; speaking = false; clearTimeout(spkTimer); link().sayStop(); voiceLine(); }
    q('mic').onclick = function () { if (micOn) micStop(); else micStart(); };
    q('spk').onclick = function () { spkOn = !spkOn; if (!spkOn) hush(); voiceLine(); };
    q('hush').onclick = hush;
    var showing = function () { return root.offsetParent !== null; };
    document.addEventListener('keydown', function (e) {
      if (!micOn || !showing() || e.key !== 'Enter' || e.shiftKey) return;
      var el = e.target; if (el !== q('box') && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;   // other boxes keep their own Enter
      e.preventDefault(); e.stopPropagation(); voiceSend();
    }, true);
    root.addEventListener('contextmenu', function (e) { if (micOn) { e.preventDefault(); voiceSend(); } });
    window.addEventListener('pagehide', function () { if (micOn || speaking) link().leaving(micOn, speaking); });

    /* ── approval cards. The Helper's engine writes the card and decides what needs one; this only shows it ── */
    function make(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function askCard(c, yesText, onceText, onAnswer) {
      var d = make('div', 'permit'); d.appendChild(make('h3', '', c.title));
      [['Why: ', c.why], ['What it does: ', c.what]].forEach(function (p) { if (!p[1]) return; var line = make('p'); line.appendChild(make('span', 'k', p[0])); line.appendChild(document.createTextNode(p[1])); d.appendChild(line); });
      (c.warnings || []).forEach(function (w) { d.appendChild(make('div', 'warn', '⚠ ' + w)); });
      if (c.heads) d.appendChild(make('div', 'heads', 'ℹ ' + c.heads));
      var bar = make('div'), yes = make('button', 'gold', yesText), no = make('button', '', 'No'); bar.append(yes, no);
      if (c.details) {
        var more = make('button', 'more', 'Show details'), pre = make('pre', '', c.details); pre.hidden = true;
        more.onclick = function () { pre.hidden = !pre.hidden; more.textContent = pre.hidden ? 'Show details' : 'Hide details'; };
        bar.appendChild(more); d.append(bar, pre);
      } else d.appendChild(bar);
      d.appendChild(make('div', 'once', onceText));
      var answer = function (ok) {
        yes.disabled = no.disabled = true;
        onAnswer(ok).then(function (result) { yes.remove(); no.remove(); bar.appendChild(make('b', '', result.text)); if (result.then) result.then(); });
      };
      yes.onclick = function () { answer(true); }; no.onclick = function () { answer(false); };
      return d;
    }
    function permission(o, t) {
      var req = o.request, w = row('', null, t, true);
      // An older Helper sends no card: then the technical request is shown as it is.
      var card = o.card || { title: 'Claude Code asks permission to use ' + req.tool_name, what: 'This Helper can’t explain this request in everyday words.', warnings: [], details: JSON.stringify(req.input, null, 2) };
      if (run) run.open++;
      watchPaint();
      readAloud('I need your approval. ' + card.title + ' ' + (card.what || '') + ' ' + (card.why ? 'Why: ' + card.why + '. ' : '') + (card.warnings || []).join(' ') + ' Please click yes or no.');
      w.appendChild(askCard(card, 'Yes, do it', 'Your yes covers only this one action. If Amit needs to do something else, it is checked again.', function (ok) {
        hush();
        return link().permission(o.request_id, ok).then(function (sent) {
          if (run && run.open) run.open--;
          if (watch) { watch.last = watch.quietFrom = watch.tick = Date.now(); watchPaint(); }
          return { text: !sent ? 'This request is no longer waiting.' : ok ? 'You said yes.' : 'You said no.', then: function () { if (sent && run && run.panel) run.panel.appendChild(w.parentNode); } };
        });
      }));
      follow();
    }

    /* ── how often to be asked. The level is kept and enforced on the person's computer ── */
    var NAMES = ['Ask me everything', 'Ask me some things', 'Ask me very little'], IDS = ['every', 'some', 'little'], level = -1, loosening = null;
    var ALWAYS_ASKS = ' Always asks: deleting, publishing, installing, spending money, sending information, closing or starting programs, anything Amit can’t explain, and loosening this setting. The check can miss things.';
    var ABOUT = ['Without asking: reading and searching your files. Asks first: every command and file change.',
      'Without asking: reading, searching and changing files inside this project. Asks first: commands, and anything outside this project.',
      'Without asking: everyday work, including commands and files outside this project.'];
    var levelButtons = function () { return Array.prototype.slice.call(root.querySelectorAll('#cd-levels button')); };
    function drawLevel() {
      levelButtons().forEach(function (b, i) { b.classList.toggle('on', i === level); b.disabled = !ready || level < 0 || !!loosening; b.textContent = (i === level ? '✓ ' : '') + NAMES[i]; });
      if (level >= 0) q('level-text').textContent = ABOUT[level] + ALWAYS_ASKS;
    }
    function setLevel(i, yes) { return link().level(IDS[i], yes); }
    function chooseLevel(i) {
      if (i === level || loosening) return;
      if (i < level) { setLevel(i, false).then(function (ok) { row('quiet', ok ? 'Now set to “' + NAMES[i] + '”.' : 'The setting could not be changed.', 0, true); }); return; }
      var w = row('', null, 0, true);
      loosening = w;
      w.appendChild(askCard({ title: 'Let Amit ask you less often?', why: 'you chose “' + NAMES[i] + '”.', what: 'Amit will do more without checking with you first. You can switch back at any time.', warnings: ['Amit’s check for risky actions can miss some. For example, a script can delete files without saying so.'] },
        'Yes, change it', 'Only you can make this change. Asking more often happens right away.', function (ok) {
          var done = function (text) { loosening = null; drawLevel(); return { text: text }; };
          if (!ok) return Promise.resolve(done('Left at “' + NAMES[level] + '”.'));
          return setLevel(i, true).then(function (sent) { return done(sent ? 'Changed to “' + NAMES[i] + '”.' : 'The setting could not be changed.'); });
        }));
      drawLevel(); follow();
    }
    levelButtons().forEach(function (b, i) { b.onclick = function () { chooseLevel(i); }; });
    function askLevel() {
      link().level().then(function (ok) { if (!ok) q('level-text').textContent = 'Permission levels need Amit Helper 2.37 or newer.'; });
      link().understand();
    }

    /* ── how much detail to explain things with ── */
    var UNAMES = ['Plain words', 'Some experience', 'Technical / coder'], UIDS = ['plain', 'some', 'technical'], understand = -1;
    var understandButtons = function () { return Array.prototype.slice.call(root.querySelectorAll('#cd-understand button')); };
    function drawUnderstand() {
      understandButtons().forEach(function (b, i) { b.classList.toggle('on', i === understand); b.disabled = !ready || understand < 0; b.textContent = (i === understand ? '✓ ' : '') + UNAMES[i]; });
    }
    function chooseUnderstand(i) { if (i === understand || !ready) return; link().understand(UIDS[i]).then(function () {}); }
    understandButtons().forEach(function (b, i) { b.onclick = function () { chooseUnderstand(i); }; });

    /* ── plan use, as Claude Code reports it with its replies; shown as received ── */
    var kept = store('amit_coder_meter') || {}, meter = kept.meter || {}, meterAt = kept.at || 0;
    function drawMeter() {
      ['five_hour', 'seven_day'].forEach(function (key) {
        var w = meter[key]; if (!w) return;
        var el = q('m-' + key), pct = Math.round(w.utilization * 100), reset = w.resetsAt * 1000, past = reset < Date.now(), bar = el.querySelector('i');
        bar.style.width = past ? '0' : Math.min(100, pct) + '%'; bar.style.background = pct >= 90 ? '#ff6b5a' : pct >= 70 ? '#e8be46' : '#50d78c';
        el.querySelector('span').textContent = past ? 'has reset, waiting for a new reading' : pct + '% used';
        var d = new Date(reset), mins = Math.max(0, Math.round((reset - Date.now()) / 60000)), clock = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        el.querySelector('small').textContent = past ? '' : mins < 1440 ? 'resets ' + clock + ' (in ' + Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm)' : 'resets ' + d.toLocaleDateString([], { weekday: 'short' }) + ' ' + clock;
      });
      if (meterAt) { var a = Math.floor((Date.now() - meterAt) / 60000); q('age').textContent = a < 1 ? 'read just now' : 'read ' + a + ' min ago'; }
    }
    setInterval(drawMeter, 15000);

    /* ── session cost and forecast. Tokens are counted as Claude Code reports them; the share of the 5-hour limit is learned, so it is rough ── */
    var S, jobN, lastPct = null, lastPctAt = 0;
    var learned = store('amit_coder_learned') || { pct: 0, units: 0 }, fresh0 = store('amit_coder_freshsize') || 0;
    function newJob() { jobN = { requests: 0, from: null, to: null }; }
    function newTally(id) { S = { id: id, tokens: 0, units: 0, base: { tokens: 0, units: 0 }, jobs: 0, requests: 0, ctx: 0, win: 0, reply: 0, lastAt: 0, pct: 0, first: true }; newJob(); }
    newTally(null);
    var fmt = function (n) { return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(Math.round(n)); };
    var share = function (units) { return learned.pct >= 0.03 && learned.units > 0 ? units * learned.pct / learned.units * 100 : null; };
    var pctText = function (p) { return p < 1 ? 'under 1%' : 'about ' + Math.round(p) + '%'; };
    function track(o, t) {
      if (o.type === 'system' && o.subtype === 'init' && o.session_id !== S.id) { if (S.id === null) S.id = o.session_id; else newTally(o.session_id); }
      if (o.type === 'rate_limit_event') {
        var w = o.rate_limit_info && o.rate_limit_info.unifiedWindows && o.rate_limit_info.unifiedWindows.five_hour;
        if (w) { var now = { u: w.utilization, r: w.resetsAt }; if (!jobN.from) jobN.from = lastPct && t - lastPctAt < 120000 ? lastPct : now; jobN.to = now; lastPct = now; lastPctAt = t; }
      }
      if (o.type === 'stream_event' && !o.parent_tool_use_id && o.event.type === 'message_start') {
        var u = o.event.message.usage || {}, size = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
        S.ctx = size; jobN.requests++;
        if (S.first && size) { S.first = false; if (S.jobs === 0) { fresh0 = size; store('amit_coder_freshsize', size); } }
      }
      if (o.type === 'result') {
        var tok = 0, units = 0, out = 0;
        Object.values(o.modelUsage || {}).forEach(function (m) {
          tok += m.inputTokens + m.outputTokens + m.cacheReadInputTokens + m.cacheCreationInputTokens; out += m.outputTokens;
          units += m.inputTokens + 0.1 * m.cacheReadInputTokens + 2 * m.cacheCreationInputTokens + 5 * m.outputTokens; if (m.contextWindow) S.win = m.contextWindow;
        });
        if (units < S.last) S.base = { tokens: S.tokens, units: S.units };
        var jobUnits = S.base.units + units - S.units;
        S.tokens = S.base.tokens + tok; S.units = S.base.units + units; S.last = units; S.jobs++; S.requests += jobN.requests; S.reply = out / Math.max(1, S.requests); S.lastAt = t;
        if (jobN.from && jobN.to && jobN.from.r === jobN.to.r && jobUnits > 0) {
          var d = Math.max(0, jobN.to.u - jobN.from.u); S.pct += d; learned.pct += d; learned.units += jobUnits;
          if (Date.now() - t < 60000) store('amit_coder_learned', learned);
        }
        newJob(); drawSession();
      }
    }
    function drawSession() {
      var line = q('sess'), tip = q('tip');
      if (!S.jobs) { line.textContent = 'This session: nothing used yet'; tip.style.display = 'none'; return; }
      var perJob = Math.max(1, S.requests / S.jobs), cold = Date.now() - S.lastAt > 60 * 60000;
      var warm = perJob * (0.1 * S.ctx + 5 * S.reply), next = cold ? warm + 1.9 * S.ctx : warm, used = share(S.units), np = share(next);
      line.textContent = 'This session: ' + fmt(S.tokens) + ' tokens' + (used === null ? '' : ', ' + pctText(used) + ' of the 5-hour limit') +
        '  ·  Next message: ' + (np === null ? fmt(S.ctx) + ' of history goes with it (a % appears once the meter has moved enough to learn from)' : pctText(np) + ' of the 5-hour limit (rough)') +
        (S.win ? '  ·  Session ' + Math.round(S.ctx / S.win * 100) + '% full' : '');
      var advice = '';
      if (fresh0 && S.ctx > fresh0 * 1.2) {
        var startCost = 2 * fresh0, saved = 0.1 * (S.ctx - fresh0), after = Math.ceil(startCost / saved);
        if (cold && 2 * S.ctx > startCost) advice = 'This session has been quiet over an hour, so continuing means saving its whole history again. Starting fresh is likely cheaper.';
        else if (after <= 10) advice = 'This session is getting heavy. A fresh one should pay for itself after about ' + after + ' requests (about ' + Math.max(1, Math.round(after / perJob)) + ' messages like yours).';
      }
      if (S.win && S.ctx / S.win >= 0.7) advice = 'This session is nearly full and will soon be condensed. Save it and start a new one.';
      tip.style.display = advice ? 'flex' : 'none'; tip.querySelector('span').textContent = advice;
    }
    setInterval(drawSession, 30000);

    /* ── what Claude Code reports ── */
    function claude(o, t) {
      if (o.type === 'system' && o.subtype === 'init' && extra > 0 && (!run || run.over)) {   // a message sent late is answered as its own job
        extra = 0; run = { p0: performance.now(), open: 0, text: '' }; blocks = {}; detailsButton(); controls(); watchStart();
      }
      if (o.type === 'stream_event' && o.event && o.event.type === 'content_block_start') watchStep(o.event.content_block.type === 'text' ? 'Writing the answer' : o.event.content_block.type === 'thinking' ? 'Thinking' : '');
      else if (o.type === 'stream_event' || o.type === 'user' || o.type === 'system') watchStep('');
      if (o.type === 'rate_limit_event') {
        var w = o.rate_limit_info && o.rate_limit_info.unifiedWindows;
        if (w && t >= meterAt) { for (var k in w) if (w[k] && typeof w[k].utilization === 'number') meter[k] = w[k]; meterAt = t; store('amit_coder_meter', { meter: meter, at: t }); drawMeter(); }
        return;
      }
      if (o.type === 'system') {
        if (o.subtype === 'init') {
          q('info').textContent = 'Model: ' + o.model + ' · permission mode: ' + o.permissionMode + ' · API key in use: ' + (o.apiKeySource === 'none' ? 'no (your sign-in)' : o.apiKeySource);
          fold('Session ready: ' + o.model, JSON.stringify(o, null, 2), t);
        } else if (o.subtype === 'hook_response' && o.outcome && o.outcome !== 'success') fold('A hook had a problem: ' + (o.hook_name || o.hook_event) + ' (' + o.outcome + ')', o.output || o.stderr || o.stdout || '(no output)', t);
        return;
      }
      if (o.type === 'stream_event') {
        var e = o.event, key = (o.parent_tool_use_id || '') + ':' + e.index;
        if (e.type === 'content_block_start') {
          var c = e.content_block;
          if (c.type === 'text') blocks[key] = { el: row('say', '', t), kind: 'text' };
          else if (c.type === 'thinking' || c.type === 'redacted_thinking') blocks[key] = { el: row('think', 'Thinking… ', t), kind: 'think' };
          else if (c.type === 'tool_use') { var f = fold('🔧 ' + c.name + ' (preparing)', '', t); tools[c.id] = { f: f, name: c.name }; blocks[key] = { kind: 'tool', f: f, json: '' }; }
        } else if (e.type === 'content_block_delta') {
          var b = blocks[key], dl = e.delta; if (!b) return;
          if (dl.type === 'text_delta') b.el.textContent += dl.text;
          else if (dl.type === 'thinking_delta') b.el.textContent += dl.thinking;
          else if (dl.type === 'input_json_delta') { b.json += dl.partial_json; b.f.p.textContent = b.json; }
          follow();
        }
        return;
      }
      if (o.type === 'assistant') {
        (o.message.content || []).forEach(function (c) {
          if (c.type !== 'tool_use') return;
          if (watch) watch.count++;
          watchStep(stepWords(c));
          var x = tools[c.id] || (tools[c.id] = { f: fold('', '', t), name: c.name });
          x.f.s.textContent = '🔧 ' + c.name + '  ' + short(argOf(c.input), 120); x.f.p.textContent = 'SENT TO THE TOOL:\n' + JSON.stringify(c.input, null, 2); x.start = t;
        });
        return;
      }
      if (o.type === 'user') {
        var content = o.message && o.message.content;
        if (Array.isArray(content)) content.forEach(function (r) {
          if (r.type !== 'tool_result') return;
          watchStep(r.is_error ? 'A step did not work. Amit is deciding what to do next.' : '');
          var x = tools[r.tool_use_id], body = resultText(r.content), took = x && x.start ? ' in ' + secs(t - x.start) + 's' : '';
          fold((r.is_error ? '✖ Problem from ' : '✔ Result from ') + (x ? x.name : 'tool') + took + ': ' + short(body, 90), body, t);
        });
        return;
      }
      if (o.type === 'control_request' && o.request.subtype === 'can_use_tool') { permission(o, t); return; }
      if (o.type === 'result') {
        end(); var u = o.usage || {};
        row('done', (o.is_error ? 'Ended with a problem (' + o.subtype + ')' : 'Finished') + ' · your stopwatch ' + (run ? secs(run.done) : '–') + 's · Claude Code\'s own count ' + secs(o.duration_ms || 0) + 's · ' + o.num_turns + ' turn(s)\nTokens: new input ' + (u.input_tokens || 0) + ', written to cache ' + (u.cache_creation_input_tokens || 0) + ', read from cache ' + (u.cache_read_input_tokens || 0) + ', output ' + (u.output_tokens || 0), t);
        if (o.is_error) row('err', o.result || 'The job ended early (' + o.subtype + ').', t, true); else row('say', o.result || '(no reply text)', t, true);
        q('log').scrollTop = q('log').scrollHeight;
        var had = all.slice();
        loadProjects(function () { var made = all.filter(function (p) { return had.indexOf(p) < 0; }); if (had.length && made.length === 1 && !chosen) pick(made[0]); });
        readAloud(o.is_error ? 'The job ended with a problem. ' + (o.result || '') : o.result); voiceLine();
        if (wantNew) { wantNew = false; if (!o.is_error) setTimeout(function () { fresh(false); }, 2500); }
      }
    }

    function showWhere(d) {
      q('where-text').textContent = d && d.title ? 'Working on: ' + d.title + '  ·  Saving to: ' + d.folder : (d && d.ask ? 'Which project is this? Choose it so it saves in the right place.' : 'Not named yet');
      q('where').classList.toggle('ask-name', !!(d && d.ask));
      projectShown(d && d.title);
    }
    var lastN = 0, past = { running: false, asks: {} }, pastTimer = null;
    function rememberPast(e) {
      var o = e.data || {};
      if (e.kind === 'local' && o.ended) past = { running: false, asks: {} };
      if (e.kind !== 'claude') return;
      if (o.type === 'system' && o.subtype === 'init') { past.running = true; if (S.id === null) S.id = o.session_id; }
      if (o.type === 'result') past = { running: false, asks: {} };
      if (o.type === 'control_request' && o.request && o.request.subtype === 'can_use_tool') past.asks[o.request_id] = o;
      if (o.type === 'user' && o.message && Array.isArray(o.message.content)) o.message.content.forEach(function (r) { if (r.type === 'tool_result') Object.keys(past.asks).forEach(function (id) { if (past.asks[id].request.tool_use_id === r.tool_use_id) delete past.asks[id]; }); });
    }
    function pickUp(words) { run = { p0: performance.now(), open: 0, text: '' }; blocks = {}; detailsButton(); controls(); watchStart(); watchStep(words); }
    function recover() {
      pastTimer = null;
      if (!past.running || (run && !run.over)) return;
      row('quiet', 'Amit is still working on your earlier message. Earlier lines are not shown here, but nothing was lost.', 0, true);
      pickUp('Still working on your earlier message');
      Object.keys(past.asks).forEach(function (id) { permission(past.asks[id], Date.now()); });
    }
    function onEvent(e) {
      if (e.n) { if (e.n <= lastN) return; lastN = e.n; }
      if (e.kind === 'session') { showWhere(e.data); return; }
      if (e.kind === 'level') { level = IDS.indexOf(e.data.level); drawLevel(); return; }
      if (e.kind === 'understand') { understand = UIDS.indexOf(e.data.level); drawUnderstand(); return; }
      if (e.t && e.t < openedAt - 3000) { rememberPast(e); if (!pastTimer) pastTimer = setTimeout(recover, 1500); return; }                    // what happened before this page was opened is not replayed
      if (e.kind === 'history') {
        watchHide(); extra = 0; run = null; q('log').textContent = ''; extras().forEach(function (b) { b.classList.remove('used'); }); controls();
        row('quiet', 'Opened an earlier session. Type to continue it.' + (e.data.older ? ' (' + e.data.older + ' earlier message(s) are not shown, but they are still part of the session.)' : ''), 0, true);
        (e.data.turns || []).forEach(function (t) { row('you', t.you, 0, true); if (t.reply) row('say', t.reply, 0, true); });
        q('log').scrollTop = q('log').scrollHeight; return;
      }
      if (e.kind === 'claude') {
        if ((!run || run.over) && e.data.type === 'stream_event' && watch && watch.state === 'stop') { watchHide(); pickUp('The connection is back and the job is still running'); }
        track(e.data, e.t); claude(e.data, e.t); return;
      }
      if (e.kind === 'stderr') { row('err', e.data.msg, e.t); return; }
      row('quiet', e.data.msg, e.t); if (e.data.ended) { if (run && !run.over) { row('err', e.data.msg, e.t, true); watchStopped('This job stopped', e.data.msg, S.id); } end(); }
    }

    function fresh(resume) {
      wantNew = false; end(); watchHide(); extra = 0; run = null; q('log').textContent = ''; extras().forEach(function (b) { b.classList.remove('used'); });
      if (!resume) { newTally(null); drawSession(); showWhere(null); }
      link().newSession(Object.assign({ resume: !!resume }, opts())).then(function (ok) { if (!ok) row('err', 'That could not be started. ' + link().lastError(), 0, true); controls(); });
    }

    /* ── earlier sessions ── */
    var every = [];
    function showList() {
      var l = q('list'), find = q('find').value.toLowerCase(), byName = q('sort').value === 'name'; l.textContent = '';
      every.filter(function (s) { return (s.title + ' ' + s.first).toLowerCase().includes(find); })
        .sort(function (x, y) { return byName ? ((x.title || '￿').localeCompare(y.title || '￿') || y.at - x.at) : y.at - x.at; })
        .forEach(function (s) {
          var b = document.createElement('button'), t = document.createElement('b'), m = document.createElement('small'), busy = Date.now() - s.at < 10 * 60000, sure = false;
          t.textContent = s.title || s.first || '(no title)';
          m.textContent = new Date(s.at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' · ' + s.where + ' · ' + s.messages + ' message(s)' + (busy ? ' · used in the last 10 minutes' : '') + (s.title ? ' · began: ' + s.first : '');
          b.append(t, m);
          b.onclick = function () {
            if (run && !run.over) { m.textContent = 'Wait for the current job to finish first.'; return; }
            if (busy && !sure) { sure = true; m.textContent = 'This one may still be open somewhere. Using it in two places at once can tangle it. Press again to open it anyway.'; return; }
            q('past').hidden = true; newTally(null); drawSession(); link().open(s.id, opts()).then(function (ok) { if (!ok) row('err', 'That session could not be opened. ' + link().lastError(), 0, true); });
          };
          l.appendChild(b);
        });
      if (!l.children.length) l.textContent = 'No session matches.';
    }
    q('past-open').onclick = function () {
      q('past').hidden = false; q('list').textContent = 'Loading…';
      link().sessions().then(function (all) { if (!Array.isArray(all)) { q('list').textContent = 'The list could not be read.'; return; } every = all; showList(); });
    };
    q('past-close').onclick = function () { q('past').hidden = true; };
    q('find').oninput = showList; q('sort').onchange = showList;

    /* ── project menu: type to narrow it; only existing projects can be chosen ── */
    var inp = q('project'), drop = q('drop'), all = [], at = 0, chosen = '';
    var plain = function (s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); };
    function loadProjects(then) { if (!ready) return; link().projects().then(function (p) { if (Array.isArray(p)) all = p.slice().sort(function (a, b) { return a.localeCompare(b); }); if (then) then(); }); }
    var matches = function () { return all.filter(function (p) { return plain(p).includes(plain(inp.value === chosen ? '' : inp.value)); }); };
    function draw() {
      var m = matches(); at = Math.max(0, Math.min(at, m.length - 1)); drop.textContent = '';
      m.forEach(function (p, i) { var d = document.createElement('div'); d.textContent = p; if (i === at) d.className = 'on'; d.onmousedown = function (e) { e.preventDefault(); pick(p); }; drop.appendChild(d); });
      if (!m.length) { var d = document.createElement('div'); d.textContent = 'No project matches. (New project is not built yet.)'; drop.appendChild(d); }
      drop.hidden = false; var on = drop.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }
    function pick(p) {
      drop.hidden = true;
      link().name(p, q('topic').value).then(function (ok) { if (ok) { chosen = p; inp.value = p; inp.blur(); } else { inp.value = chosen; q('where-text').textContent = 'That could not be saved as the name.'; } });
    }
    function projectShown(title) {
      var parts = String(title || '').split(' - '); chosen = title ? parts[0] : '';
      if (document.activeElement !== inp) inp.value = chosen;
      if (document.activeElement !== q('topic')) q('topic').value = parts.slice(1).join(' - ');
    }
    inp.onfocus = function () { inp.select(); at = 0; if (all.length) draw(); loadProjects(draw); };
    inp.oninput = function () { at = 0; draw(); };
    inp.onblur = function () { drop.hidden = true; inp.value = chosen; };
    inp.onkeydown = function (e) {
      if (e.key === 'ArrowDown') { at++; draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { at--; draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { var m = matches(); if (m[at]) pick(m[at]); e.preventDefault(); } else if (e.key === 'Escape') inp.blur();
    };
    q('topic').onkeydown = function (e) { if (e.key === 'Enter' && chosen) { pick(chosen); e.target.blur(); } };

    /* ── buttons ── */
    q('send').onclick = function () { send(); };
    q('cap').onclick = capture;
    q('add').onclick = function () { q('file').click(); };
    q('file').onchange = function () { picFiles(Array.prototype.slice.call(this.files)); this.value = ''; };
    q('box').addEventListener('paste', function (e) { var f = Array.prototype.slice.call((e.clipboardData && e.clipboardData.items) || []).filter(function (i) { return i.kind === 'file'; }).map(function (i) { return i.getAsFile(); }).filter(Boolean); if (f.length) { e.preventDefault(); picFiles(f); } });
    root.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) e.preventDefault(); });
    root.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); picFiles(e.dataTransfer.files); } });
    extras().forEach(function (b) { b.onclick = function () { send(b); }; });
    q('box').onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    q('stop').onclick = function () {
      var mine = run; row('quiet', '■ Stop pressed', 0, true); link().stop();
      setTimeout(function () { if (mine && run === mine && !mine.over) { watchStopped('Stopped', 'Nothing answered the Stop, so this page has let that job go. You can type again.', S.id); end(); } }, 5000);
    };
    q('new').onclick = function () { fresh(false); }; q('resume').onclick = function () { fresh(true); };
    q('tip-new').onclick = function () { if (run && !run.over) return; wantNew = true; send(root.querySelector('.extras button[data-b="save"]')); };
    q('model').onchange = q('effort').onchange = q('hooks').onchange = function () { row('quiet', 'The new setting applies after New session or Resume last.', 0, true); };

    /* ── the connection ── */
    function connection(x) {
      var was = ready; ready = x.code === 'local-ready';
      if (ready) { if (!was) { q('info').textContent = 'Connected to ' + x.computer + '. Claude Code reports its details after your first message.'; loadProjects(); setTimeout(askLevel, 200); } }
      else {
        if (was && run && !run.over) { row('err', 'This job stopped: the connection to your computer was interrupted. Some steps may already be done.', 0, true); watchStopped('This job stopped: the connection was interrupted', 'The clock has stopped. Some steps may already be done, so check before anything is done again.', S.id); end(); }
        q('info').textContent = x.code === 'checking' ? 'Checking the connection…' : x.code === 'signed-out' ? 'Sign in to connect to your computer.' : 'Not connected. ' + (x.missing || []).join(' ');
      }
      if (!ready) { if (micOn) micDown('The microphone is off because the connection was lost.'); speaking = false; }
      controls(); drawLevel(); drawUnderstand(); voiceLine();
    }
    function checkNewer() {
      if (!/^http/.test(location.protocol) || !q('newer').hidden) return;
      fetch(location.pathname + '?check=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        var m = t.match(/amit_coder_screen\.js\?v=([0-9.]+)/);
        if (m && parseFloat(m[1]) > parseFloat(window.AmitCoderScreen.version)) q('newer').hidden = false;
      }).catch(function () {});
    }
    q('newer-go').onclick = function () { location.replace(location.pathname + '?v=' + Date.now() + location.hash); };
    setInterval(checkNewer, 60000); setTimeout(checkNewer, 3000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') checkNewer(); });
    link().onState(connection); link().onEvent(onEvent);
    showWhere(null); drawSession(); drawMeter(); connection(link().state()); link().refresh();
  }

  window.AmitCoderScreen = {
    version: '0.09',
    mount: function (host) {
      if (!host || !window.AmitCoderLink) return;
      if (!root) build();
      if (root.parentNode !== host) host.appendChild(root);
    }
  };
})();

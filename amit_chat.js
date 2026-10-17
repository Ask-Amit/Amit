/* ════════════════════════════════════════════════════════════════
   amit_chat.js — the ONE AmitChat engine, shared by every Amit page.
   v0.15 — 2026-10-17. Read-aloud moved INTO the chat: every message has a play button; while it reads, that message shows start-over / pause / next and an adjust icon that opens a voice dialog (voice, speed, pitch, volume, pause) heard as you change it and saved to the person's profile when closed (AmitChat.voiceSaver). The speaker button at the top of the chat is gone. v0.14 — 2026-10-17. A Refresh button inside the chat; when Amit's helper posts a reply it sends a "refresh" nudge on the chat's live channel, so an open chat shows the reply at once instead of waiting for the next check. v0.13 — 2026-10-17. The live transcript blinks GREEN (the Hub's own "on" green) instead of red; clearer iPhone messages (it can work in Safari but not inside a home-screen app). v0.12 — 2026-10-17. LIVE TRANSCRIPT: a button that keeps the browser's speech feature running and posts what you say as text lines (cut at a pause of about 2 s, or at the next natural phrase once a piece passes 30 s; never drops words; no audio is kept). The chat can also be mounted inline for a phone page (AmitChat.mountInline: AmitMobile). v0.11 — 2026-10-17. Full-screen view: the chat list collapses to one icon so the open chat fills the screen (remembered). Small box: a Maximize button opens the same chat in Communications > Chats (AmitChat.onMaximize, AmitChat.openInPanel). Hover labels sit ABOVE the button, with more padding (the browser's own label sat under the pointer and hid the words). v0.10 — 2026-10-16. The chat box opens at the top right beside the chat icon and closes back into it (the icon is the toggle); an Add Amit button in the chat header. v0.09 — 2026-10-16. J chat: Amit answers in a chat through any member's own VS Code / AmitCoder session (no API); replies are labelled with whose session they came through; the chat you open last is the one J chat reads. v0.08 — 2026-10-15. Help me fix this card with a step checklist, items (question, decision, prayer request with confidential and answered, note), long messages collapse, Open Loops in For me, a guardian's invitation is claimed when the child signs in. v0.07 — 2026-10-15. Read-aloud button in the chat (follows the words, pause/back/next/stop, uses the voice saved in About Me), birth date lives in About Me, parents: chat switch and read-only view of their children's chats. v0.06 — 2026-10-15. Birth date gate and guardians (safeguarding), friends-list visibility, acquaintances, delete a chat (24 h), hide/mute a chat, pin, private notes, send silently, local time, a For me page. v0.05 — 2026-10-15. Reply to a message, drafts kept, search, export as text. Edit and unsend your own messages, typing indicator, clickable links, video-call link, voice messages with transcript. v0.04 — 2026-10-15. Photos and files; Amit can be invited into a chat. v0.03: smart refresh (no always-running timers). v0.02: LIVE mode (real Supabase data). Sample mode stays
   for ?chatpreview=1 and for anyone not signed in.

   Include with  <script src="../amit_chat.js"></script>  (path per depth).
   Same root-level pattern as Amit_Ask_Live.js and amit_pin_encryption.js.

   One engine, two places (AmitChat\CLAUDE.md decision 16):
     AmitChat.togglePopup()      the docked chat box (quick view, Facebook-style)
     AmitChat.mountPanel(el)     the roomy two-pane view (Communications > Chats tab)

   Wiring (the page does this once it has a Supabase client and a signed-in user):
     AmitChat.connect(db, userId)    switches both views to real data
     AmitChat.disconnect()           back to sample, stops all timers

   Real data comes from the tables and actions in Database\migration_2026-10-14_00*.sql.
   Everything the views show comes through a "source" object, so the views never
   touch the database directly. Colors come only from the shared Appearance tokens.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.AmitChat) return;

  var VERSION = 'v0.15';
  var PAGE = 50, NAV_THROTTLE_MS = 30000;
  var SCRIPT_BASE = (function () { var sc = document.currentScript; return sc && sc.src ? sc.src.replace(/[^\/?#]*([?#].*)?$/, '') : ''; })();

  /* ── small helpers ── */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function uniq(a) { var o = {}; return a.filter(function (x) { return x && !o[x] && (o[x] = 1); }); }
  function fmtTime(iso) {
    var d = new Date(iso), n = new Date();
    if (isNaN(d)) return '';
    var same = d.toDateString() === n.toDateString();
    if (same) { var h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm'); }
    var days = (n - d) / 86400000;
    if (days < 7) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getDate();
  }
  function fail(r) { if (r && r.error) throw new Error(r.error.message || 'Something went wrong'); return r; }
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); }
  function fmtSize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
  /* phone photos are huge; shrink to at most 1600 px on the long side, JPEG. Small ones are left alone. */
  function shrinkImage(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight, big = Math.max(w, h);
        if (big <= 1600 && file.size <= 700 * 1024) { resolve({ blob: file, type: file.type, name: file.name }); return; }
        var k = Math.min(1, 1600 / big), cv = document.createElement('canvas');
        cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) {
          if (!b) { resolve({ blob: file, type: file.type, name: file.name }); return; }
          resolve({ blob: b, type: 'image/jpeg', name: (file.name || 'photo').replace(/\.[A-Za-z0-9]+$/, '') + '.jpg' });
        }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve({ blob: file, type: file.type, name: file.name }); };
      img.src = url;
    });
  }

  /* ════════ SAMPLE SOURCE (made-up people and words; nothing here is real) ════════ */
  var SAMPLE = [
    { id: 's1', title: 'Sample study', members: 'You, Sam, Amit', unread: 2, last: 'Let’s look at Hebrews 10:1 next.', time: '9:06 pm',
      pinned: 'Open questions (2): What does “shadow” refer to? · Which days does the verse list?',
      messages: [
        { id: 'a', from: 'them', name: 'Sam', time: '9:02', text: 'Is the shadow the offerings, or the days themselves?' },
        { id: 'b', from: 'amit', name: 'Amit', time: '9:04', text: 'Here is what the text says, and the research is behind the eye.', eye: true },
        { id: 'c', from: 'me', name: 'You', time: '9:06', text: 'Let’s look at Hebrews 10:1 next.' }
      ], seen: 'Seen by Sam', typing: 'Sam is typing…' },
    { id: 's2', title: 'Sample printer help', members: 'You, Jordan', unread: 0, last: 'Step 2 didn’t work.', time: 'Yesterday',
      card: { title: 'Help me fix this', rows: ['Trying to: print a PDF', 'Device: Windows · Chrome', 'What happened: nothing prints'],
              steps: [['done', 'Restart the printer'], ['failed', 'Update the driver'], ['open', 'Print a test page']], cause: 'Likely — old driver' },
      messages: [
        { id: 'd', from: 'them', name: 'Jordan', time: 'Yesterday', text: 'It still will not print after the restart.' },
        { id: 'e', from: 'me', name: 'You', time: 'Yesterday', text: 'Okay, try updating the driver and tell me what happens.' }
      ], seen: '', typing: '' },
    { id: 's3', title: 'Sample prayer group', members: 'You, Sam, Jordan, Alex', unread: 0, last: 'Praying for you today.', time: 'Mon',
      messages: [{ id: 'f', from: 'them', name: 'Alex', time: 'Mon', text: 'Praying for you today.' }], seen: '', typing: '' }
  ];
  var sampleSource = {
    live: false, label: 'Sample', me: null,
    listConversations: function () { return Promise.resolve(SAMPLE); },
    getConversation: function (id) { return Promise.resolve(SAMPLE.filter(function (c) { return c.id === id; })[0] || null); },
    unreadChats: function () { return Promise.resolve(SAMPLE.filter(function (c) { return c.unread > 0; }).length); }
  };

  /* ════════ LIVE SOURCE (real Supabase data) ════════ */
  /* plain text with web links made clickable (http/https only; everything else stays text) */
  function linkify(parent, text, plain) {
    if (plain || !/https?:\/\//i.test(text || '')) { parent.appendChild(document.createTextNode(text || '')); return; }
    String(text).split(/(https?:\/\/[^\s<>"']+)/gi).forEach(function (part, i) {
      if (i % 2 === 1) {
        var trail = (part.match(/[.,;:!?)\]]+$/) || [''])[0], url = part.slice(0, part.length - trail.length);
        var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = url; parent.appendChild(a);
        if (trail) parent.appendChild(document.createTextNode(trail));
      } else if (part) parent.appendChild(document.createTextNode(part));
    });
  }

  /* what a helper needs to know about the person's browser (sent with a help request) */
  function envInfo() {
    var ua = navigator.userAgent || '', b = 'Unknown browser', m;
    if ((m = /Edg\/([\d.]+)/.exec(ua))) b = 'Edge ' + m[1]; else if ((m = /Chrome\/([\d.]+)/.exec(ua))) b = 'Chrome ' + m[1];
    else if ((m = /Firefox\/([\d.]+)/.exec(ua))) b = 'Firefox ' + m[1]; else if ((m = /Version\/([\d.]+).*Safari/.exec(ua))) b = 'Safari ' + m[1];
    var os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    return { browser: b, system: os, screen: (screen.width || 0) + 'x' + (screen.height || 0), window: innerWidth + 'x' + innerHeight, language: navigator.language || '', timezone: tz, online: navigator.onLine ? 'yes' : 'no' };
  }

  function makeLiveSource(db, me) {
    var names = {}; names[me] = 'You';
    function nameOf(id) { return names[id] || 'Someone'; }
    function loadNames(ids) {
      var need = uniq(ids).filter(function (id) { return !names[id]; });
      if (!need.length) return Promise.resolve();
      return db.rpc('cha_people', { p_ids: need }).then(function (r) {
        if (r && r.data) r.data.forEach(function (p) { names[p.user_id] = p.display_name; });
      }, function () {});
    }
    function snippet(m) {
      if (!m) return '';
      if (m.deleted_at) return 'Message removed';
      if (m.message_type === 'system') return nameOf(m.sender_id) + ' ' + (m.body || '');
      if (m.message_type === 'photo') return '[photo]';
      if (m.message_type === 'file') return '[file]';
      if (m.message_type === 'voice') return '[voice message]';
      return m.body || '';
    }
    var src = {
      live: true, label: 'Live', me: me, nameOf: nameOf, amit: null,
      /* Amit's own account id (null until the Amit migration has been run) */
      amitReady: db.rpc('cha_amit_id').then(function (r) { if (r && r.data) src.amit = r.data; }, function () {}),

      listConversations: function () {
        if (Date.now() - (src._purgeAt || 0) > 60000) { src._purgeAt = Date.now(); db.rpc('cha_purge_due').then(function () {}, function () {}); }
        return db.from('cha_participants')
          .select('conversation_id,last_read_message_id,hidden_at,notify_level,cha_conversations(id,title,kind,created_by,created_at,delete_requested_at)')
          .eq('user_id', me).eq('status', 'accepted').then(function (p) {
            fail(p);
            var rows = p.data || [];
            if (!rows.length) return [];
            var ids = rows.map(function (r) { return r.conversation_id; });
            return Promise.all([
              db.from('cha_participants').select('conversation_id,user_id,status').in('conversation_id', ids).in('status', ['accepted', 'invited']),
              db.from('cha_messages').select('id,conversation_id,sender_id,body,message_type,created_at,deleted_at,silent')
                .in('conversation_id', ids).order('created_at', { ascending: false }).limit(300)
            ]).then(function (res) {
              fail(res[0]); fail(res[1]);
              var parts = res[0].data || [], msgs = res[1].data || [];
              return loadNames(parts.map(function (x) { return x.user_id; }).concat(msgs.map(function (x) { return x.sender_id; }))).then(function () {
                var out = rows.map(function (r) {
                  var c = r.cha_conversations || {};
                  var mine = msgs.filter(function (m) { return m.conversation_id === r.conversation_id; });
                  var last = mine[0];
                  var readAt = null;
                  if (r.last_read_message_id) { var lm = mine.filter(function (m) { return m.id === r.last_read_message_id; })[0]; readAt = lm ? lm.created_at : null; }
                  var unread = mine.filter(function (m) {
                    return m.sender_id !== me && !m.deleted_at && !m.silent && (!r.hidden_at || m.created_at > r.hidden_at) &&
                      (r.last_read_message_id ? (readAt && m.created_at > readAt) : true);
                  }).length;
                  var others = parts.filter(function (x) { return x.conversation_id === r.conversation_id && x.user_id !== me; }).map(function (x) { return nameOf(x.user_id); });
                  return {
                    id: r.conversation_id,
                    title: c.title || others.join(', ') || 'Chat',
                    members: ['You'].concat(others).join(', '),
                    unread: r.notify_level === 'muted' ? 0 : unread, muted: r.notify_level === 'muted', deleting: !!c.delete_requested_at,
                    hidden: !!r.hidden_at && (!last || last.created_at <= r.hidden_at),
                    last: snippet(last), time: last ? fmtTime(last.created_at) : fmtTime(c.created_at),
                    sort: last ? last.created_at : (c.created_at || '')
                  };
                }).filter(function (x) { return !x.hidden; });
                out.sort(function (a, b) { return a.sort < b.sort ? 1 : -1; });
                return out;
              });
            });
          });
      },

      getConversation: function (id, before) {
        var q = db.from('cha_messages').select('id,sender_id,body,message_type,payload,status,reply_to,created_at,edited_at,deleted_at')
          .eq('conversation_id', id).order('created_at', { ascending: false }).limit(PAGE);
        if (before) q = q.lt('created_at', before);
        return src.amitReady.then(function () { return Promise.all([
          q,
          db.from('cha_participants').select('user_id,status,last_read_message_id,show_receipts').eq('conversation_id', id),
          db.from('cha_conversations').select('id,title,kind,created_by,pinned_message_id,delete_requested_at').eq('id', id).maybeSingle(),
          before ? Promise.resolve({ data: [] }) : db.from('cha_notes').select('id,body,created_at').eq('conversation_id', id).order('created_at', { ascending: true }).limit(200),
          db.rpc('cha_member_times', { p_conv: id }),
          before ? Promise.resolve({ data: [] }) : db.from('cha_items').select('id,message_id,kind,text,state,created_by,confidential,answered_at,created_at').eq('conversation_id', id).order('created_at', { ascending: true }).limit(300)
        ]); }).then(function (res) {
          fail(res[0]); fail(res[1]); fail(res[2]);
          var rows = (res[0].data || []).slice().reverse();
          var parts = res[1].data || [], conv = res[2].data || {};
          var itemRows = (res[5] && !res[5].error && res[5].data) || [];
          return loadNames(parts.map(function (x) { return x.user_id; }).concat(rows.map(function (x) { return x.sender_id; })).concat(itemRows.map(function (x) { return x.created_by; }))).then(function () {
            var others = parts.filter(function (x) { return x.user_id !== me && x.status === 'accepted'; });
            var amitIn = !!(src.amit && parts.some(function (x) { return x.user_id === src.amit && x.status === 'accepted'; }));
            var msgs = rows.map(function (m) {
              var isSys = m.message_type === 'system', isAmit = !!src.amit && m.sender_id === src.amit;
              var text = m.deleted_at ? 'Message removed'
                : isSys ? nameOf(m.sender_id) + ' ' + (m.body || '')
                : (m.body || (m.message_type !== 'text' ? '[' + m.message_type + ']' : ''));
              return { id: m.id, from: isSys ? 'system' : (m.sender_id === me ? 'me' : (isAmit ? 'amit' : 'them')), name: nameOf(m.sender_id), time: fmtTime(m.created_at), iso: m.created_at,
                       text: text, removed: !!m.deleted_at, edited: !!m.edited_at, sender: m.sender_id, replyTo: m.reply_to || null,
                       type: m.message_type, payload: m.payload || {},
                       waitingAmit: amitIn && !isAmit && !isSys && m.status === 'new' && !m.deleted_at && /(^|\s)@amit\b/i.test(m.body || '') };
            });
            var notes = (res[3] && !res[3].error && res[3].data) || [];
            var hasMoreNow = (res[0].data || []).length === PAGE;
            notes.forEach(function (n) {
              if (hasMoreNow && rows.length && n.created_at < rows[0].created_at) return;
              msgs.push({ id: n.id, from: 'note', name: 'You', time: fmtTime(n.created_at), iso: n.created_at, text: n.body, type: 'privnote', removed: false, sender: me, payload: {} });
            });
            msgs.sort(function (a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0; });
            var times = ((res[4] && !res[4].error && res[4].data) || []).map(function (t) { return { name: nameOf(t.user_id), tz: t.timezone }; });
            var pinRow = conv.pinned_message_id ? rows.filter(function (m) { return m.id === conv.pinned_message_id; })[0] : null;
            var myParticipant = parts.filter(function (x) { return x.user_id === me; })[0] || {};
            // read receipts: who has read up to my latest message
            var seen = '';
            var myLast = null;
            for (var i = rows.length - 1; i >= 0; i--) { if (rows[i].sender_id === me && !rows[i].deleted_at) { myLast = rows[i]; break; } }
            if (myLast) {
              var readers = others.filter(function (o) {
                if (o.show_receipts === false || !o.last_read_message_id) return false;
                var lr = rows.filter(function (m) { return m.id === o.last_read_message_id; })[0];
                return lr && lr.created_at >= myLast.created_at;
              }).map(function (o) { return nameOf(o.user_id); });
              if (readers.length) seen = 'Seen by ' + readers.join(', ');
            }
            var lastRow = rows.length ? rows[rows.length - 1] : null;
            var pinP = !conv.pinned_message_id ? Promise.resolve(null) : (pinRow ? Promise.resolve(pinRow) :
              db.from('cha_messages').select('id,sender_id,body,deleted_at').eq('id', conv.pinned_message_id).maybeSingle().then(function (r) { return r && r.data; }, function () { return null; }));
            return pinP.then(function (pm) {
            return {
              items: itemRows.map(function (i) { return { id: i.id, messageId: i.message_id, kind: i.kind, text: i.text, state: i.state, by: nameOf(i.created_by), mine: i.created_by === me, confidential: !!i.confidential, answeredAt: i.answered_at }; }),
              pin: pm && !pm.deleted_at ? { id: pm.id, name: nameOf(pm.sender_id), text: pm.body || '' } : null,
              deleteAt: conv.delete_requested_at || null, creator: conv.created_by === me, times: times.length <= 3 ? times : [],
              id: id, title: conv.title || others.map(function (o) { return nameOf(o.user_id); }).join(', ') || 'Chat',
              members: ['You'].concat(others.map(function (o) { return nameOf(o.user_id); })).join(', '),
              messages: msgs, seen: seen, typing: '', hasMore: (res[0].data || []).length === PAGE,
              oldest: rows.length ? rows[0].created_at : null, lastId: lastRow ? lastRow.id : null,
              myLastRead: myParticipant.last_read_message_id || null,
              amitIn: amitIn, amitId: src.amit
            };
            });
          });
        });
      },

      /* remembers which chat this person opened last: that is the chat "J chat" reads for them */
      touchChat: function (id) { return db.from('cha_participants').update({ last_opened_at: new Date().toISOString() }).eq('conversation_id', id).eq('user_id', me).then(function () {}, function () {}); },
      markRead: function (id, lastId) {
        if (!lastId) return Promise.resolve();
        return db.from('cha_participants').update({ last_read_message_id: lastId }).eq('conversation_id', id).eq('user_id', me).then(function (r) { return r; });
      },
      send: function (id, text, replyTo, silent) {
        var t = (text || '').trim();
        if (!t) return Promise.reject(new Error('Type a message first.'));
        var row = { conversation_id: id, sender_id: me, body: t }; if (replyTo) row.reply_to = replyTo; if (silent) row.silent = true;
        return db.from('cha_messages').insert(row).select('id').then(fail);
      },
      summonAmit: function (id) { return db.rpc('cha_summon_amit', { p_conv: id }).then(function (r) { fail(r); return r.data; }); },
      /* one line of a live transcript: an ordinary text message, silent (no unread badge), marked so it shows as a transcript */
      sendTranscript: function (id, text, marker) {
        var t = (text || '').trim(); if (!t) return Promise.resolve();
        return db.from('cha_messages').insert({ conversation_id: id, sender_id: me, message_type: 'text', body: marker ? '\uD83D\uDDE3 ' + t : t, silent: true, payload: { transcribed: true, marker: marker || null } }).select('id').then(fail);
      },
      /* private files: signed links last 10 minutes (short on purpose, so a removed member's old links die quickly); cached so a chat redraw does not ask again */
      _urls: {},
      signedUrl: function (path, downloadName) {
        var k = path + '|' + (downloadName || ''), c = src._urls[k];
        if (c && c.exp > Date.now()) return Promise.resolve(c.url);
        return db.storage.from('amitchat-files').createSignedUrl(path, 600, downloadName ? { download: downloadName } : undefined)
          .then(function (r) { fail(r); src._urls[k] = { url: r.data.signedUrl, exp: Date.now() + 540000 }; return r.data.signedUrl; });
      },
      /* photo or file: upload, post as a message, link it in cha_attachments. Photos are shrunk first. 10 MB limit. */
      sendAttachment: function (id, file) {
        var MAX = 10 * 1024 * 1024;
        if (!file) return Promise.reject(new Error('No file chosen.'));
        var isImg = /^image\/(jpeg|png|webp)$/.test(file.type);
        return (isImg ? shrinkImage(file) : Promise.resolve({ blob: file, type: file.type || 'application/octet-stream', name: file.name })).then(function (p) {
          if (p.blob.size > MAX) throw new Error('That file is over 10 MB.');
          var safe = (p.name || 'file').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);
          var path = id + '/' + uid() + '-' + safe;
          return db.storage.from('amitchat-files').upload(path, p.blob, { contentType: p.type, upsert: false }).then(function (up) {
            fail(up);
            var kind = isImg ? 'photo' : 'file';
            return db.from('cha_messages').insert({ conversation_id: id, sender_id: me, message_type: kind, body: p.name || 'file',
              payload: { name: p.name || 'file', mime: p.type, size: p.blob.size, path: path } }).select('id').then(function (m) {
              if (m.error) { db.storage.from('amitchat-files').remove([path]); throw new Error(m.error.message); }
              return db.from('cha_attachments').insert({ conversation_id: id, message_id: m.data[0].id, uploader: me, file_path: path, kind: kind, mime: p.type, size_bytes: p.blob.size });
            });
          });
        });
      },
      /* search one chat's messages (plain text match; % and _ are treated as ordinary characters) */
      searchMessages: function (id, q) {
        var t = (q || '').trim(); if (t.length < 2) return Promise.reject(new Error('Type at least 2 letters to search.'));
        var pat = '%' + t.replace(/[\\%_]/g, function (c) { return '\\' + c; }) + '%';
        return db.from('cha_messages').select('id,sender_id,body,message_type,created_at').eq('conversation_id', id).is('deleted_at', null).neq('message_type', 'system').ilike('body', pat)
          .order('created_at', { ascending: false }).limit(30).then(function (r) {
            fail(r); var rows = r.data || [];
            return loadNames(rows.map(function (x) { return x.sender_id; })).then(function () {
              return rows.map(function (x) { return { id: x.id, name: nameOf(x.sender_id), time: fmtTime(x.created_at), text: x.body || '' }; });
            });
          });
      },
      /* the whole chat as plain text, oldest first */
      exportChat: function (id) {
        var all = [], from = 0, STEP = 1000;
        function page() {
          return db.from('cha_messages').select('sender_id,body,message_type,payload,created_at,deleted_at,edited_at').eq('conversation_id', id).order('created_at', { ascending: true }).range(from, from + STEP - 1).then(function (r) {
            fail(r); var rows = r.data || []; all = all.concat(rows); from += STEP;
            if (rows.length === STEP && from < 20000) return page();
          });
        }
        return Promise.all([page(), db.from('cha_conversations').select('title').eq('id', id).maybeSingle()]).then(function (res) {
          return loadNames(all.map(function (x) { return x.sender_id; })).then(function () {
            var title = (res[1].data && res[1].data.title) || 'Chat';
            var lines = all.map(function (m) {
              var who = nameOf(m.sender_id), d = new Date(m.created_at).toLocaleString(), body;
              if (m.deleted_at) body = '(removed)';
              else if (m.message_type === 'system') return '[' + d + '] (' + who + ' ' + (m.body || '') + ')';
              else if (m.message_type === 'photo' || m.message_type === 'file') body = '[' + m.message_type + ': ' + ((m.payload && m.payload.name) || m.body || '') + ']';
              else if (m.message_type === 'voice') body = '[voice message] ' + ((m.payload && m.payload.transcript) || '');
              else body = m.body || '';
              return '[' + d + '] ' + who + ': ' + body + (m.edited_at && !m.deleted_at ? ' (edited)' : '');
            });
            return { title: title, text: 'AmitChat export: ' + title + '\nExported ' + new Date().toLocaleString() + ' by ' + nameOf(me) + '\n\n' + lines.join('\n') + '\n' };
          });
        });
      },
      /* my own settings for one chat (read receipts, typing) and the chat name (only its creator can rename) */
      getSettings: function (id) {
        return Promise.all([
          db.from('cha_participants').select('show_receipts,show_typing,notify_level').eq('conversation_id', id).eq('user_id', me).maybeSingle(),
          db.from('cha_conversations').select('title,created_by').eq('id', id).maybeSingle(),
          db.from('cha_profiles').select('share_time').eq('user_id', me).maybeSingle()
        ]).then(function (r) {
          fail(r[0]); fail(r[1]);
          var p = r[0].data || {}, c = r[1].data || {}, pr = (r[2] && r[2].data) || {};
          return { receipts: p.show_receipts !== false, typing: p.show_typing !== false, muted: p.notify_level === 'muted', shareTime: pr.share_time !== false, title: c.title || '', canRename: c.created_by === me };
        });
      },
      setSetting: function (id, field, val) {
        if (field === 'time') return db.rpc('cha_set_timezone', { p_tz: null, p_share: !!val }).then(fail);
        var u = {};
        if (field === 'muted') u.notify_level = val ? 'muted' : 'all'; else u[field === 'receipts' ? 'show_receipts' : 'show_typing'] = !!val;
        return db.from('cha_participants').update(u).eq('conversation_id', id).eq('user_id', me).then(fail);
      },
      hideChat: function (id, hide) { return db.from('cha_participants').update({ hidden_at: hide ? new Date().toISOString() : null }).eq('conversation_id', id).eq('user_id', me).then(fail); },
      pin: function (id, msgId) { return db.rpc('cha_pin', { p_conv: id, p_msg: msgId || null }).then(fail); },
      requestDelete: function (id) { return db.rpc('cha_request_delete', { p_conv: id }).then(fail); },
      cancelDelete: function (id) { return db.rpc('cha_cancel_delete', { p_conv: id }).then(fail); },
      addNote: function (id, text) {
        var t = (text || '').trim(); if (!t) return Promise.reject(new Error('Type a note first.'));
        return db.from('cha_notes').insert({ conversation_id: id, user_id: me, body: t }).select('id').then(fail);
      },
      deleteNote: function (noteId) { return db.from('cha_notes').delete().eq('id', noteId).then(fail); },
      setTimezone: function (tz) { return db.rpc('cha_set_timezone', { p_tz: tz, p_share: null }).then(fail); },
      /* parents and children (migration _008) */
      myChildren: function () { return db.rpc('cha_my_children').then(function (r) { fail(r); return r.data || []; }); },
      childrenChats: function () {
        return db.rpc('cha_children_chats').then(function (r) {
          fail(r); var rows = r.data || [];
          return rows.map(function (x) { return { id: x.conversation_id, title: x.title, child: x.child_name, last: x.last_at ? fmtTime(x.last_at) : '', sort: x.last_at || '' }; })
            .sort(function (a, b) { return a.sort < b.sort ? 1 : -1; });
        });
      },
      chatWatched: function (id) { return db.rpc('cha_chat_watched', { p_conv: id }).then(function (r) { return !r.error && r.data === true; }, function () { return false; }); },
      /* a guardian's invitation (migration _010): claimed quietly when the invited child signs in */
      claimInvite: function () { return db.rpc('cha_claim_child_invite').then(function (r) { return r && r.data; }, function () { return null; }); },
      /* items: steps, decisions, questions, prayer requests, notes (migration _011) */
      addItem: function (id, kind, text, opts) {
        opts = opts || {}; var t = (text || '').trim();
        if (!t) return Promise.reject(new Error('Type something first.'));
        var row = { conversation_id: id, kind: kind, text: t.slice(0, 2000), created_by: me };
        if (opts.messageId) row.message_id = opts.messageId; if (opts.confidential) row.confidential = true;
        return db.from('cha_items').insert(row).select('id').then(fail);
      },
      setItemState: function (itemId, state) {
        var u = { state: state }; u.answered_at = state === 'done' ? new Date().toISOString() : null;
        return db.from('cha_items').update(u).eq('id', itemId).then(fail);
      },
      deleteItem: function (itemId) { return db.from('cha_items').delete().eq('id', itemId).then(fail); },
      sendFixCard: function (id, f) {
        var summary = ((f.doing || f.happened || '') + '').replace(/\s+/g, ' ').trim().slice(0, 90);
        return db.from('cha_messages').insert({ conversation_id: id, sender_id: me, message_type: 'card', body: 'Help request: ' + summary,
          payload: { kind: 'fix', doing: (f.doing || '').slice(0, 3000), happened: (f.happened || '').slice(0, 3000), tried: (f.tried || '').slice(0, 3000), env: f.env || {} } }).select('id').then(fail);
      },
      /* Open Loops: follow-ups Amit suggested, private to me (migration _011) */
      loops: function () {
        return db.from('cha_loops').select('id,conversation_id,kind,text,status,snooze_until,created_at').in('status', ['open', 'accepted', 'snoozed']).order('created_at', { ascending: false }).limit(50).then(function (r) {
          if (r.error) return []; var now = Date.now();
          return (r.data || []).filter(function (l) { return l.status !== 'snoozed' || (l.snooze_until && new Date(l.snooze_until).getTime() <= now); })
            .map(function (l) { return { id: l.id, conv: l.conversation_id, kind: l.kind, text: l.text, status: l.status === 'snoozed' ? 'open' : l.status }; });
        }, function () { return []; });
      },
      decideLoop: function (id, action, days) {
        var u = { decided_at: new Date().toISOString() };
        if (action === 'accept') u.status = 'accepted'; else if (action === 'done') u.status = 'done'; else if (action === 'dismiss') u.status = 'dismissed';
        else if (action === 'snooze') { u.status = 'snoozed'; u.snooze_until = new Date(Date.now() + (days || 1) * 864e5).toISOString(); }
        return db.from('cha_loops').update(u).eq('id', id).then(fail);
      },
      /* safeguarding and friends */
      profile: function () { return db.rpc('cha_my_profile').then(function (r) { fail(r); return r.data || {}; }); },
      setBirthDate: function (d) { return db.rpc('cha_set_birth_date', { p_date: d }).then(function (r) { fail(r); return r.data; }); },
      setVisibility: function (v) { return db.rpc('cha_set_friends_visibility', { p_v: v }).then(fail); },
      friendsOf: function (userId) {
        return db.rpc('cha_friends_of', { p_user: userId }).then(function (r) { fail(r); return (r.data || []).map(function (x) { return { userId: x.user_id, name: x.display_name }; }); });
      },
      requestGuardian: function (code) { return db.rpc('cha_request_guardian', { p_code: code }).then(fail); },
      myGuardians: function () { return db.rpc('cha_my_guardians').then(function (r) { fail(r); return r.data || []; }); },
      guardianQueue: function () { return db.rpc('cha_guardian_queue').then(function (r) { fail(r); return r.data || []; }); },
      guardianDecide: function (kind, ref, ok) { return db.rpc('cha_guardian_decide', { p_kind: kind, p_ref: ref, p_ok: !!ok }).then(function (r) { fail(r); return r.data; }); },
      acquaintances: function () { return db.rpc('cha_acquaintances').then(function (r) { fail(r); return (r.data || []).map(function (x) { return { userId: x.user_id, name: x.display_name }; }); }); },
      repliesToMe: function () {
        return db.rpc('cha_replies_to_me').then(function (r) {
          fail(r); var rows = r.data || [];
          return loadNames(rows.map(function (x) { return x.sender_id; })).then(function () {
            return rows.map(function (x) { return { id: x.message_id, conv: x.conversation_id, name: nameOf(x.sender_id), text: x.body || '', time: fmtTime(x.created_at) }; });
          });
        });
      },
      renameChat: function (id, title) {
        var t = (title || '').trim().slice(0, 80);
        return db.from('cha_conversations').update({ title: t || null }).eq('id', id).eq('created_by', me).select('id').then(function (r) { fail(r); if (!r.data || !r.data.length) throw new Error('Only the person who started the chat can rename it.'); });
      },
      /* edit / unsend: only your own messages (the database enforces it too) */
      editMessage: function (id, text) {
        var t = (text || '').trim();
        if (!t) return Promise.reject(new Error('A message cannot be empty.'));
        return db.from('cha_messages').update({ body: t, edited_at: new Date().toISOString() }).eq('id', id).eq('sender_id', me).is('deleted_at', null).select('id').then(function (r) {
          fail(r); if (!r.data || !r.data.length) throw new Error('You can only edit your own messages.');
        });
      },
      unsendMessage: function (id, filePath) {
        return db.from('cha_messages').update({ body: '(removed)', payload: {}, deleted_at: new Date().toISOString() }).eq('id', id).eq('sender_id', me).select('id').then(function (r) {
          fail(r); if (!r.data || !r.data.length) throw new Error('You can only unsend your own messages.');
          if (filePath) { db.from('cha_attachments').delete().eq('message_id', id).then(function () {}, function () {}); db.storage.from('amitchat-files').remove([filePath]).then(function () {}, function () {}); }
        });
      },
      /* voice message: the recording plus an automatic transcript (best effort; may be empty) */
      sendVoice: function (id, blob, seconds, transcript) {
        if (!blob || !blob.size) return Promise.reject(new Error('Nothing was recorded.'));
        if (blob.size > 10 * 1024 * 1024) return Promise.reject(new Error('That recording is over 10 MB.'));
        var mime = (blob.type || 'audio/webm').split(';')[0];
        var ext = /mp4|m4a|aac/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm';
        var path = id + '/' + uid() + '-voice.' + ext, tr = (transcript || '').trim().slice(0, 4000);
        return db.storage.from('amitchat-files').upload(path, blob, { contentType: mime, upsert: false }).then(function (up) {
          fail(up);
          return db.from('cha_messages').insert({ conversation_id: id, sender_id: me, message_type: 'voice', body: tr || 'Voice message',
            payload: { name: 'voice.' + ext, mime: mime, size: blob.size, path: path, seconds: Math.round(seconds || 0), transcript: tr } }).select('id').then(function (m) {
            if (m.error) { db.storage.from('amitchat-files').remove([path]); throw new Error(m.error.message); }
            return db.from('cha_attachments').insert({ conversation_id: id, message_id: m.data[0].id, uploader: me, file_path: path, kind: 'voice', mime: mime, size_bytes: blob.size });
          });
        });
      },
      /* typing indicator: a live broadcast channel, nothing is written to the database */
      typingJoin: function (convId, onChange, onRefresh) {
        if (!db.channel) return null;
        var seen = {}, timer = null, lastSent = 0, ch;
        function active() {
          var now = Date.now(), who = [];
          Object.keys(seen).forEach(function (u) { if (now - seen[u] < 4500) who.push(nameOf(u)); else delete seen[u]; });
          return who;
        }
        function tick() {
          var who = active(); onChange(who.length ? (who.length === 1 ? who[0] + ' is typing\u2026' : who.join(', ') + ' are typing\u2026') : '');
          if (who.length) timer = setTimeout(tick, 1500); else timer = null;
        }
        try {
          ch = db.channel('acx-typing-' + convId, { config: { broadcast: { self: false } } });
          ch.on('broadcast', { event: 'typing' }, function (m) {
            var u = m && m.payload && m.payload.u;
            if (!u || u === me || !/^[0-9a-f-]{36}$/i.test(u)) return;
            seen[u] = Date.now(); loadNames([u]).then(function () { if (!timer) tick(); else onChange(null, true); });
          });
          /* a "refresh" nudge (Amit's helper sends one after it posts): reload this chat now */
          ch.on('broadcast', { event: 'refresh' }, function () { if (onRefresh) { try { onRefresh(); } catch (e) {} } });
          ch.subscribe();
        } catch (e) { return null; }
        return {
          ping: function () { var n = Date.now(); if (n - lastSent < 2500) return; lastSent = n; try { ch.send({ type: 'broadcast', event: 'typing', payload: { u: me } }); } catch (e) {} },
          leave: function () { if (timer) clearTimeout(timer); try { db.removeChannel(ch); } catch (e) {} }
        };
      },
      unreadChats: function () {
        return db.rpc('cha_unread_chats').then(function (r) { fail(r); return typeof r.data === 'number' ? r.data : 0; });
      },

      myCode: function () { return db.rpc('cha_my_code').then(function (r) { fail(r); return r.data; }); },
      requestFriend: function (code) { return db.rpc('cha_send_friend_request', { p_code: code }).then(fail); },
      userByCode: function (code) { return db.rpc('cha_user_by_code', { p_code: code }).then(function (r) { fail(r); return r.data; }); },
      friends: function () {
        return db.from('cha_friends').select('id,requester,addressee,status,created_at').then(function (r) {
          fail(r);
          var rows = r.data || [];
          var others = rows.map(function (x) { return x.requester === me ? x.addressee : x.requester; });
          return loadNames(others).then(function () {
            var out = { friends: [], incoming: [], outgoing: [], awaiting: [] };
            rows.forEach(function (x) {
              var other = x.requester === me ? x.addressee : x.requester;
              var item = { rowId: x.id, userId: other, name: nameOf(other) };
              if (x.status === 'accepted') out.friends.push(item);
              else if (x.status === 'awaiting_guardian') out.awaiting.push(item);
              else if (x.status === 'pending' && x.addressee === me) out.incoming.push(item);
              else if (x.status === 'pending' && x.requester === me) out.outgoing.push(item);
            });
            return out;
          });
        });
      },
      respondFriend: function (rowId, accept) {
        return db.rpc('cha_respond_friend', { p_row: rowId, p_accept: !!accept }).then(function (r) { fail(r); return r.data; });
      },
      removeFriend: function (rowId) { return db.from('cha_friends').delete().eq('id', rowId).then(fail); },

      createConversation: function (title, kind, memberIds) {
        return db.rpc('cha_create_conversation', { p_title: title || '', p_kind: kind || 'personal', p_purpose: 'chat', p_members: memberIds || [] })
          .then(function (r) { fail(r); return r.data; });
      },
      invites: function () {
        return db.rpc('cha_my_invites').then(function (r) {
          fail(r);
          var rows = r.data || [];
          return loadNames(rows.map(function (x) { return x.invited_by; })).then(function () {
            return rows.map(function (x) { return { id: x.conversation_id, title: x.title || 'a chat', by: nameOf(x.invited_by) }; });
          });
        });
      },
      respondInvite: function (id, accept) { return db.rpc('cha_respond_invite', { p_conv: id, p_accept: accept }).then(fail); },
      leave: function (id) { return db.rpc('cha_leave', { p_conv: id }).then(fail); },
      addMember: function (id, userId) { return db.rpc('cha_add_member', { p_conv: id, p_user: userId }).then(function (r) { fail(r); return r.data; }); },
      removeMember: function (id, userId) { return db.rpc('cha_remove_member', { p_conv: id, p_user: userId }).then(fail); }
    };
    return src;
  }

  /* ════════ STYLES (injected once) ════════ */
  var CSS = [
    '.acx-pop{position:fixed;right:76px;bottom:0;width:350px;height:480px;max-height:calc(100vh - 80px);z-index:9000;display:none;flex-direction:column;background:var(--amit-surface,#0f2338);border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.35);border-bottom:none;border-radius:var(--amit-radius,12px) var(--amit-radius,12px) 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.45);color:rgba(var(--amit-text-rgb,240,232,208),.92);font-size:14px;line-height:1.5}',
    '.acx-pop.open{display:flex}.acx-pop.min{height:44px}.acx-pop.min .acx-body{display:none}',
    '.acx-pop.anchored{top:var(--acx-top,60px);right:var(--acx-right,76px);bottom:auto;height:var(--acx-h,480px);max-height:none;border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.35);border-radius:var(--amit-radius,12px);box-shadow:0 10px 30px rgba(0,0,0,.5)}',
    '.acx-anchor-on{background:rgba(var(--amit-accent-rgb,201,168,76),.22)!important;border-radius:10px}',
    '.acx-head{cursor:default!important}',
    '.acx-thead .acx-spk,.acx-thead .acx-ref,.acx-thead .acx-srch,.acx-thead .acx-gear{margin-left:0!important}.acx-spacer{flex:1}',
    '.acx-ahd{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}.acx-ahd img{width:16px;height:16px;object-fit:contain}',
    '.acx-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(var(--amit-accent-rgb,201,168,76),.12);border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);cursor:pointer;flex-shrink:0}',
    '.acx-title{flex:1;font-family:var(--amit-font-heading,"Cinzel",serif);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--amit-accent-bright,#e8c56a);font-weight:700}',
    '.acx-ver{font-size:10px;color:var(--amit-dim,rgba(240,232,208,.42));letter-spacing:.05em}',
    '.acx-x{background:none;border:none;color:var(--amit-muted,rgba(240,232,208,.78));font-size:16px;cursor:pointer;padding:0 4px}',
    '.acx-body{flex:1;min-height:0;display:flex;flex-direction:column}',
    '.acx-root{flex:1;min-height:0;min-width:0;display:flex;width:100%}',
    '.acx-left{width:270px;flex-shrink:0;border-right:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);display:flex;flex-direction:column;min-height:0}',
    '.acx-right,.acx-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}',
    '.acx-lbody{flex:1;min-height:0;display:flex;flex-direction:column}',
    '.acx-ltog{display:flex;justify-content:flex-end;padding:6px 8px 0;flex-shrink:0}',
    '.acx-ltog button{background:none;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.35);color:var(--amit-accent-bright,#e8c56a);border-radius:7px;font-size:13px;line-height:1;padding:5px 8px;cursor:pointer;font-family:inherit}',
    '.acx-ltog button:hover{background:rgba(var(--amit-accent-rgb,201,168,76),.12)}',
    '.acx-left.collapsed{width:52px}.acx-left.collapsed .acx-lbody{display:none}.acx-left.collapsed .acx-ltog{justify-content:center;padding:10px 0}',
    '.acx-tip{position:fixed;display:none;z-index:9600;max-width:260px;padding:10px 14px;border-radius:9px;background:var(--amit-surface,#0f2338);border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.55);color:rgba(var(--amit-text-rgb,240,232,208),.96);font-size:13px;font-weight:400;line-height:1.5;text-align:left;box-shadow:0 6px 20px rgba(0,0,0,.55);pointer-events:none}',
    '.acx-livebar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 10px;background:rgba(var(--amit-on-rgb,46,160,67),.16);border-top:1px solid rgba(var(--amit-on-rgb,46,160,67),.6);font-size:12px;flex-shrink:0}',
    '.acx-ib.live{color:#6fe38f;opacity:1;text-shadow:0 0 6px rgba(var(--amit-on-rgb,46,160,67),.9);animation:acxpulse 1s infinite}',
    '.acx-livebar .acx-dot{width:9px;height:9px;border-radius:50%;background:rgb(var(--amit-on-rgb,46,160,67));box-shadow:0 0 7px rgba(var(--amit-on-rgb,46,160,67),.95);animation:acxpulse 1s infinite;flex-shrink:0}',
    '.acx-livebar .acx-lt{flex:1;min-width:120px}.acx-livebar .acx-li{flex-basis:100%;color:var(--amit-dim,rgba(240,232,208,.6));font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.acx-play{background:none;border:none;color:inherit;cursor:pointer;font-size:12px;padding:0 4px;opacity:.85;line-height:1}.acx-play:hover{opacity:1}',
    '.acx-b.reading .acx-play{display:none}',
    '.acx-mp{display:flex;align-items:center;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25)}.acx-mp .acx-ib{font-size:16px}',
    '.acx-vdlg{max-height:58%;overflow-y:auto}.acx-vdlg select{max-width:100%}',
    '.acx-max{background:none;border:none;color:var(--amit-muted,rgba(240,232,208,.78));font-size:15px;cursor:pointer;padding:0 6px;line-height:1}',
    '.acx-max:hover{color:var(--amit-accent-bright,#e8c56a)}',
    '.acx-tool{display:flex;gap:6px;padding:8px;flex-wrap:wrap;flex-shrink:0}',
    '.acx-btn{padding:5px 11px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.45);background:transparent;color:var(--amit-accent-bright,#e8c56a);border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit}',
    '.acx-btn:hover{background:rgba(var(--amit-accent-rgb,201,168,76),.12)}',
    '.acx-btn.go{background:var(--amit-accent,#c9a84c);color:#1a1510;border-color:var(--amit-accent,#c9a84c);font-weight:600}',
    '.acx-btn:disabled{opacity:.5;cursor:default}',
    '.acx-list{flex:1;min-height:0;overflow-y:auto;padding:0 8px 8px}',
    '.acx-row{display:flex;gap:8px;align-items:center;padding:9px 10px;border-radius:8px;cursor:pointer;border:1px solid transparent}',
    '.acx-row:hover{background:rgba(var(--amit-accent-rgb,201,168,76),.08)}',
    '.acx-row.on{background:rgba(var(--amit-accent-rgb,201,168,76),.14);border-color:rgba(var(--amit-accent-rgb,201,168,76),.3)}',
    '.acx-rt{flex:1;min-width:0}.acx-rn{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.acx-rl{font-size:12px;color:var(--amit-muted,rgba(240,232,208,.78));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.acx-rm{font-size:11px;color:var(--amit-dim,rgba(240,232,208,.42));text-align:right}',
    '.acx-pill{display:inline-block;min-width:18px;padding:0 6px;border-radius:999px;background:#d63b2f;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px}',
    '.acx-badge{position:absolute;top:-6px;right:-8px;min-width:18px;padding:0 5px;border-radius:999px;background:#d63b2f;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center;box-shadow:0 0 0 2px var(--amit-bg,#09141f)}',
    '.acx-thread{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}',
    '.acx-thead{padding:8px 12px;border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2);display:flex;gap:8px;align-items:center;flex-shrink:0}',
    '.acx-back{background:none;border:none;color:var(--amit-accent-bright,#e8c56a);cursor:pointer;font-size:14px;padding:0}',
    '.acx-tt{font-weight:600}.acx-ts{font-size:12px;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-msgs,.acx-list,.acx-page{scrollbar-width:thin;scrollbar-color:rgba(var(--amit-accent-rgb,201,168,76),.35) transparent}',
    '.acx-msgs::-webkit-scrollbar,.acx-list::-webkit-scrollbar,.acx-page::-webkit-scrollbar{width:5px}',
    '.acx-msgs::-webkit-scrollbar-thumb,.acx-list::-webkit-scrollbar-thumb,.acx-page::-webkit-scrollbar-thumb{background:rgba(var(--amit-accent-rgb,201,168,76),.3);border-radius:3px}',
    '.acx-msgs{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}',
    '.acx-pin{border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.4);background:rgba(var(--amit-accent-rgb,201,168,76),.1);border-radius:8px;padding:6px 10px;font-size:12px}',
    '.acx-b{max-width:82%;padding:7px 11px;border-radius:12px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2);white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}',
    '.acx-b small{display:block;font-size:11px;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-b.them{align-self:flex-start;background:rgba(var(--amit-overlay-rgb,255,255,255),.05)}',
    '.acx-b.me{align-self:flex-end;background:rgba(var(--amit-accent-rgb,201,168,76),.18)}',
    '.acx-b.amit{align-self:flex-start;background:rgba(var(--amit-accent-rgb,201,168,76),.08);border-color:rgba(var(--amit-accent-rgb,201,168,76),.5)}',
    '.acx-b.removed{opacity:.55;font-style:italic}',
    '.acx-quote{font-size:11px;opacity:.8;border-left:3px solid rgba(var(--amit-accent-rgb,201,168,76),.6);padding:1px 6px;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.acx-replybar{display:flex;align-items:center;gap:8px;padding:5px 10px;font-size:12px;border-top:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2);background:rgba(var(--amit-overlay-rgb,255,255,255),.04)}.acx-replybar span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.acx-hit{display:block;width:100%;text-align:left;background:none;border:none;border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.12);color:inherit;font:inherit;padding:5px 2px;cursor:pointer}.acx-hit:hover{background:rgba(var(--amit-overlay-rgb,255,255,255),.05)}.acx-hit small{display:block;opacity:.6;font-size:11px}',
    '.acx-pin{display:flex;gap:6px;align-items:center}.acx-pin .acx-ib{margin-left:auto}',
    '::highlight(acx-read){background-color:rgba(201,168,76,.85);color:#1a1510}::highlight(acx-sent){background-color:rgba(201,168,76,.28)}',
    '.acx-b.reading{outline:1px solid rgba(var(--amit-accent-rgb,201,168,76),.75)}',
    '.acx-thead .acx-spk{margin-left:auto}.acx-thead .acx-spk+.acx-srch{margin-left:0}.acx-spk.on{opacity:1;text-shadow:0 0 6px rgba(var(--amit-accent-rgb,201,168,76),.9)}',
    '.acx-rbar{display:flex;align-items:center;gap:6px;padding:5px 10px;font-size:12px;border-top:1px solid rgba(var(--amit-accent-rgb,201,168,76),.3);background:rgba(var(--amit-accent-rgb,201,168,76),.1)}.acx-rbar span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.acx-fix{border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.45);border-radius:8px;padding:8px 10px;margin-top:4px;background:rgba(var(--amit-overlay-rgb,255,255,255),.04);font-size:13px;white-space:normal}',
    '.acx-fixrow{margin-top:4px;white-space:pre-wrap}.acx-fixlab{opacity:.65}.acx-fixhead{margin-top:8px;font-size:12px;font-weight:600}',
    '.acx-step{display:flex;gap:6px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:4px 0;border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.12)}',
    '.acx-step.acx-st-done .acx-stt{text-decoration:line-through;opacity:.7}.acx-step.acx-st-failed .acx-stt{color:#e07a67}.acx-step.acx-st-na .acx-stt{opacity:.55;font-style:italic}',
    '.acx-sb{display:inline-flex;gap:2px}.acx-sb button{background:none;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.3);border-radius:5px;color:inherit;cursor:pointer;font-size:12px;padding:0 5px;line-height:18px}.acx-sb button.on{background:rgba(var(--amit-accent-rgb,201,168,76),.35)}',
    '.acx-items{border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.3);border-radius:8px;padding:6px 10px;font-size:12px}.acx-items>button{background:none;border:none;color:inherit;font:inherit;font-weight:600;cursor:pointer;padding:0}',
    '.acx-item{display:flex;gap:6px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:3px 0}.acx-item.acx-st-done .acx-itt{text-decoration:line-through;opacity:.7}',
    '.acx-clip{display:block;max-height:9em;overflow:hidden}.acx-moretxt{background:none;border:none;color:inherit;text-decoration:underline;cursor:pointer;font-size:11px;padding:0;margin-top:2px;display:block}',
    '.acx-watch{font-size:11px;font-style:italic;color:var(--amit-muted,rgba(240,232,208,.78))}',
    '.acx-b.note{align-self:flex-end;background:transparent;border-style:dashed}',
    '.acx-del{border:1px solid #d63b2f;background:rgba(214,59,47,.1);border-radius:8px;padding:6px 10px;font-size:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.acx-comp{flex-wrap:wrap}.acx-comp:not(.more) .acx-xtra{display:none}.acx-ib.on{opacity:1;color:var(--amit-accent-bright,#e8c56a);text-shadow:0 0 6px rgba(var(--amit-accent-rgb,201,168,76),.8)}',
    '.acx-gear{margin-left:auto}.acx-srch{margin-left:auto}.acx-srch+.acx-gear{margin-left:0}.acx-set{padding:10px 12px;border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2);display:flex;flex-direction:column;gap:8px;font-size:13px}.acx-set label{display:flex;gap:8px;align-items:center;cursor:pointer}.acx-set .acx-ts{font-size:11px}',
    '.acx-act{display:inline-flex;gap:8px;margin-left:8px;font-size:11px;opacity:0;transition:opacity .15s}',
    '.acx-b:hover .acx-act,.acx-b:focus-within .acx-act{opacity:.9}',
    '.acx-act button{background:none;border:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;padding:0}',
    '@media (hover:none){.acx-act{opacity:.8}}',
    '.acx-b a{color:inherit;text-decoration:underline;word-break:break-all}',
    '.acx-b audio{display:block;margin-top:4px;max-width:100%;height:34px}',
    '.acx-tr{margin-top:4px;font-size:12px;opacity:.85;white-space:pre-wrap}',
    '.acx-editbox{width:100%;box-sizing:border-box;min-height:56px;font:inherit;color:inherit;background:rgba(var(--amit-overlay-rgb,255,255,255),.08);border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.4);border-radius:8px;padding:6px}',
    '.acx-ib.rec{color:#e5534b;opacity:1;animation:acxpulse 1s infinite}@keyframes acxpulse{50%{opacity:.35}}',
    '.acx-ib{background:none;border:none;cursor:pointer;font-size:17px;padding:2px 4px;opacity:.8;color:inherit;line-height:1;flex-shrink:0}.acx-ib:hover{opacity:1}.acx-ib:disabled{opacity:.35;cursor:default}',
    '.acx-ib img{width:20px;height:20px;display:block;object-fit:contain}',
    '.acx-img{display:block;max-width:100%;max-height:220px;border-radius:8px;margin-top:4px;cursor:zoom-in;background:rgba(var(--amit-overlay-rgb,255,255,255),.06);min-width:60px;min-height:40px}',
    '.acx-file{display:inline-block;margin-top:4px;padding:5px 10px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.4);border-radius:8px;background:rgba(var(--amit-overlay-rgb,255,255,255),.05);color:inherit;font:inherit;cursor:pointer;max-width:100%;text-align:left;overflow-wrap:anywhere}',
    '.acx-sys{align-self:center;font-size:12px;font-style:italic;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-wait{font-size:11px;font-style:italic;margin-top:3px;color:var(--amit-muted,rgba(240,232,208,.78))}',
    '.acx-drop{outline:2px dashed var(--amit-accent,#c9a84c);outline-offset:-4px}',
    '.acx-meta{align-self:flex-end;font-size:11px;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-typing{font-size:12px;font-style:italic;color:var(--amit-muted,rgba(240,232,208,.78))}',
    '.acx-card{border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.4);border-radius:8px;padding:8px 10px;font-size:13px;background:rgba(var(--amit-overlay-rgb,255,255,255),.04)}',
    '.acx-card b{color:var(--amit-accent-bright,#e8c56a)}.acx-st-done{color:#6fbf86}.acx-st-failed{color:#e07a67}',
    '.acx-comp{display:flex;gap:6px;align-items:flex-end;padding:8px 10px;border-top:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2);flex-shrink:0}',
    '.acx-comp textarea,.acx-field{flex:1;padding:7px 10px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.3);border-radius:8px;background:rgba(var(--amit-overlay-rgb,255,255,255),.05);color:inherit;font:inherit;resize:none;min-width:0}',
    '.acx-comp textarea{max-height:110px}',
    '.acx-stub{flex:1;padding:7px 10px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);border-radius:8px;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-ic{opacity:.55;font-size:15px}',
    '.acx-sample{font-size:11px;text-align:center;padding:3px 8px;color:var(--amit-accent-bright,#e8c56a);background:rgba(var(--amit-accent-rgb,201,168,76),.1);border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2);flex-shrink:0}',
    '.acx-empty{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:var(--amit-muted,rgba(240,232,208,.78))}',
    '.acx-err{margin:8px;padding:8px 10px;border:1px solid #d63b2f;border-radius:8px;color:#f0a79f;font-size:12px}',
    '.acx-page{flex:1;min-height:0;overflow-y:auto;padding:12px}',
    '.acx-sec{margin-bottom:14px}.acx-sec h4{margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--amit-accent-bright,#e8c56a);font-family:var(--amit-font-heading,"Cinzel",serif)}',
    '.acx-line{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.12)}',
    '.acx-inv{margin:0 8px 8px;padding:8px 10px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.4);background:rgba(var(--amit-accent-rgb,201,168,76),.08);border-radius:8px;font-size:12px}',
    '.acx-code{font-family:monospace;font-size:18px;letter-spacing:.15em;color:var(--amit-accent-bright,#e8c56a)}',
    '.acx-panel{height:100%;min-height:0;display:flex;flex-direction:column;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);border-radius:var(--amit-radius,12px);overflow:hidden}',
    '.acx-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9500;background:var(--amit-surface,#0f2338);border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.5);color:rgba(var(--amit-text-rgb,240,232,208),.95);padding:9px 16px;border-radius:9px;font-size:13px;box-shadow:0 4px 18px rgba(0,0,0,.5)}',
    '@media (max-width:700px){.acx-pop,.acx-pop.anchored{top:0;right:0;left:0;bottom:0;width:auto;height:100%;max-height:none;border-radius:0}.acx-pop.min{height:44px;top:auto}.acx-left{width:100%}.acx-b{max-width:92%}}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('acx-css')) return;
    var s = document.createElement('style'); s.id = 'acx-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  function toast(msg) {
    var t = el('div', 'acx-toast', msg); document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
  }

  /* ════════ THE VIEW (one component, used by the popup and the panel) ════════ */
  /* ════════ LIVE TRANSCRIPT ════════
     Keeps the browser's own speech feature running and posts what the person says as text lines in the chat.
     No audio is stored anywhere: the browser hands over words, not sound. A line is posted after a pause (gapMs), or, once a
     piece has run longer than softCapMs, at the next natural phrase boundary, so a long speaker is never cut mid-sentence and no word is dropped.
     Only one transcript runs at a time on a computer. It listens to THIS person's microphone only. */
  var liveTx = null;
  var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function stopLiveTx(why, ownerOnly) { if (liveTx && (!ownerOnly || liveTx.owner === ownerOnly)) liveTx.stop(why); }
  function liveTxSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  function startLiveTx(o) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (liveTx) liveTx.stop('replaced');
    var cfg = AmitChat.liveTxConfig, buf = '', bufStart = 0, lastAct = 0, interim = '', running = true, finished = false, rec = null, timer = null, restartT = null, fails = 0, q = [], sending = false;
    function notify(extra) { var st = { on: running && !finished, interim: interim }; if (extra) for (var k in extra) st[k] = extra[k]; try { o.onChange(st); } catch (e) {} }
    function pump() {
      if (sending || !q.length) return; sending = true;
      var item = q[0], p;
      try { p = Promise.resolve(o.post(item.text, item.marker)); } catch (e) { p = Promise.reject(e); }
      p.then(function () { q.shift(); sending = false; pump(); }, function (e) {
        sending = false; item.tries = (item.tries || 0) + 1;
        if (item.tries >= 3) { q.shift(); notify({ lost: item.text, error: (e && e.message) || 'Could not send a line.' }); }
        setTimeout(pump, 1500);
      });
    }
    function flush() {
      var t = buf.trim(); buf = ''; bufStart = 0; if (!t) return;
      while (t.length > 3500) { var cut = t.lastIndexOf(' ', 3500); if (cut < 500) cut = 3500; q.push({ text: t.slice(0, cut) }); t = t.slice(cut).trim(); }
      q.push({ text: t }); pump();
    }
    function finish(why) {
      if (finished) return; finished = true; running = false;
      clearTimeout(restartT); clearInterval(timer);
      flush(); q.push({ text: 'stopped the live transcript', marker: 'stop' }); pump();
      if (liveTx === api) liveTx = null;
      try { rec && (rec.onresult = rec.onend = rec.onerror = null); } catch (e) {}
      notify({ why: why || 'stopped' });
    }
    function begin() {
      if (!running) return;
      try { rec = new SR(); } catch (e) { finish('unsupported'); return; }
      rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || 'en-US';
      rec.onresult = function (e) {
        fails = 0; var fin = '', itm = '';
        for (var i = e.resultIndex; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) fin += r[0].transcript + ' '; else itm += r[0].transcript; }
        lastAct = Date.now(); interim = itm;
        if (fin.trim()) { if (!buf) bufStart = Date.now(); buf += fin; if (Date.now() - bufStart >= cfg.softCapMs) flush(); }
        notify();
      };
      rec.onerror = function (e) {
        var c = e && e.error;
        if (c === 'not-allowed' || c === 'service-not-allowed') finish('denied');
        else if (c === 'audio-capture') finish('nomic');
        else if (c === 'network') { fails++; if (fails >= 5) finish('network'); }
      };
      rec.onend = function () { if (running && !finished) restartT = setTimeout(begin, 300); };
      try { rec.start(); } catch (e) { fails++; if (fails >= 5) finish('error'); else restartT = setTimeout(begin, 800); }
    }
    var api = {
      owner: o.owner, convId: o.convId, tid: o.tid,
      stop: function (why) {
        if (!running || finished) return; running = false;
        try { rec.onend = function () { finish(why); }; rec.stop(); } catch (e) { finish(why); }
        setTimeout(function () { finish(why); }, 1500);
      }
    };
    liveTx = api;
    q.push({ text: 'started a live transcript', marker: 'start' }); pump();
    lastAct = Date.now();
    timer = setInterval(function () {
      var idle = Date.now() - lastAct;
      if (buf && ((!interim && idle >= cfg.gapMs) || idle >= cfg.gapMs + 4000)) flush();
    }, 300);
    begin(); notify();
    return api;
  }

  var views = [];
  /* diagnostics, readable in the browser console as AmitChat.debug */
  var DBG = { ticks: 0, visibleTicks: 0, badgeTicks: 0, lastUnread: null, lastError: null, rerenders: 0, connects: 0, disconnects: 0, polls: 0, unreadChecks: 0 };
  function createView(container, wide) {
    var src = AmitChat.source, live = !!src.live;
    var root = el('div', 'acx-root'), left = null, right = null, main = null;
    container.innerHTML = ''; container.appendChild(root);
    var pendingOpen = null;
    if (wide) {
      var leftWrap = el('div', 'acx-left'); left = el('div', 'acx-lbody'); right = el('div', 'acx-right');
      var tg = el('div', 'acx-ltog'), tb = el('button', null, '');
      var collapsed = false; try { collapsed = localStorage.getItem('amitchat_listcollapsed') === '1'; } catch (e) {}
      var paintToggle = function () {
        leftWrap.classList.toggle('collapsed', collapsed);
        tb.textContent = collapsed ? '\uD83D\uDCAC' : '\u00AB';
        tb.title = collapsed ? 'Show the chat list' : 'Hide the chat list so the chat fills the screen';
      };
      tb.onclick = function () { collapsed = !collapsed; try { localStorage.setItem('amitchat_listcollapsed', collapsed ? '1' : '0'); } catch (e) {} paintToggle(); };
      paintToggle(); tg.appendChild(tb); leftWrap.appendChild(tg); leftWrap.appendChild(left);
      root.appendChild(leftWrap); root.appendChild(right);
    }
    else { main = el('div', 'acx-main'); root.appendChild(main); }
    var area = wide ? right : main;
    var cur = { view: 'list', arg: null }, thread = null, destroyed = false, listCache = null;
    var prof = null, gate = !!live, gateWhy = null, rechecking = false, recheckFn = null, forMeCache = null, forMeAt = 0;   // while the birth-date check is pending nothing else may draw
    var lastActive = Date.now(), loopT = null, inSight = false, listSig = null;

    function visible() { return !destroyed && root.offsetParent !== null && !document.hidden; }
    function errBox(parent, e) { parent.appendChild(el('div', 'acx-err', (e && e.message) || 'Something went wrong. Try again.')); }

    /* ---- list ---- */
    function drawList(target, list, invites, forMe) {
      target.innerHTML = '';
      var tool = el('div', 'acx-tool');
      if (live) {
        var nb = el('button', 'acx-btn go', '+ New chat'); nb.onclick = function () { show('new'); };
        var fb = el('button', 'acx-btn', 'Friends'); fb.onclick = function () { show('friends'); };
        var mb = el('button', 'acx-btn', 'For me' + (forMe && forMe.count ? ' (' + forMe.count + ')' : '')); mb.onclick = function () { show('forme'); };
        tool.appendChild(nb); tool.appendChild(fb); tool.appendChild(mb);
        if (prof && prof.has_children) { var kb = el('button', 'acx-btn', 'Children\u2019s chats'); kb.onclick = function () { show('kids'); }; tool.appendChild(kb); }
      }
      target.appendChild(tool);
      (invites || []).forEach(function (iv) {
        var box = el('div', 'acx-inv');
        box.appendChild(el('div', null, iv.by + ' invited you to “' + iv.title + '”'));
        var row = el('div'); row.style.cssText = 'display:flex;gap:6px;margin-top:6px';
        var a = el('button', 'acx-btn go', 'Accept'), d = el('button', 'acx-btn', 'Decline');
        a.onclick = function () { src.respondInvite(iv.id, true).then(function () { toast('Joined'); refreshAll(); }, function (e) { toast(e.message); }); };
        d.onclick = function () { src.respondInvite(iv.id, false).then(function () { refreshAll(); }, function (e) { toast(e.message); }); };
        row.appendChild(a); row.appendChild(d); box.appendChild(row); target.appendChild(box);
      });
      var l = el('div', 'acx-list');
      if (!list.length) l.appendChild(el('div', 'acx-empty', live ? 'No conversations yet. Add a friend, then start a chat.' : 'No conversations.'));
      list.forEach(function (c) {
        var r = el('div', 'acx-row' + (wide && cur.arg === c.id && cur.view === 'thread' ? ' on' : ''));
        var t = el('div', 'acx-rt');
        t.appendChild(el('div', 'acx-rn', c.title + (c.muted ? ' \uD83D\uDD15' : '') + (c.deleting ? ' \u00B7 being deleted' : ''))); t.appendChild(el('div', 'acx-rl', c.last));
        r.appendChild(t);
        var rm = el('div', 'acx-rm', c.time);
        if (c.unread) { rm.appendChild(document.createElement('br')); rm.appendChild(el('span', 'acx-pill', c.unread)); }
        r.appendChild(rm);
        r.onclick = function () { show('thread', c.id); };
        l.appendChild(r);
      });
      target.appendChild(l);
    }
    function loadForMe(force) {
      if (!live) return Promise.resolve(null);
      if (!force && forMeCache && Date.now() - forMeAt < 20000) return Promise.resolve(forMeCache);
      return Promise.all([
        src.friends().catch(function () { return null; }), src.guardianQueue().catch(function () { return []; }),
        src.repliesToMe().catch(function () { return []; }), src.invites().catch(function () { return []; }), src.loops ? src.loops() : Promise.resolve([])
      ]).then(function (r) {
        forMeAt = Date.now();
        forMeCache = { requests: r[0] ? r[0].incoming : [], guardian: r[1], replies: r[2], invites: r[3], loops: r[4] || [] };
        forMeCache.count = forMeCache.requests.length + forMeCache.guardian.length + forMeCache.replies.length + forMeCache.invites.length + forMeCache.loops.filter(function (l) { return l.status === 'open'; }).length;
        return forMeCache;
      });
    }
    function loadList() {
      return Promise.all([src.listConversations(), live ? src.invites().catch(function () { return []; }) : Promise.resolve([]), loadForMe(false).catch(function () { return null; })]).then(function (res) {
        listCache = res;
        var sig = res[0].map(function (c) { return c.id + '|' + c.last + '|' + c.unread + '|' + (c.muted ? 'm' : '') + (c.deleting ? 'd' : ''); }).join(';') + '#' + (res[1] || []).length + '#' + (res[2] ? res[2].count : 0);
        if (listSig !== null && sig !== listSig) bump();
        listSig = sig;
        return res;
      });
    }
    function renderListInto(target) {
      return loadList().then(function (res) { if (!destroyed && !gate) drawList(target, res[0], res[1], res[2]); }, function (e) { target.innerHTML = ''; errBox(target, e); });
    }

    /* ---- the gate: birth date (kept in About Me), parent switch for young people ---- */
    function gateReason(p) {
      if (!p || p.legacy) return null;
      if (!p.birth_set) return p.family_child ? 'family' : 'birth';
      if (p.class === 'minor') { if (p.age != null && p.age < 13) return 'young'; if (p.authorized === false) return 'auth'; }
      return null;
    }
    function buildGate(target, why, recheck) {
      target.innerHTML = '';
      var page = el('div', 'acx-page'); target.appendChild(page);
      var sec = el('div', 'acx-sec');
      function para(t) { var p = el('div', 'acx-ts', t); p.style.cssText = 'font-size:13px;margin-bottom:8px'; sec.appendChild(p); }
      var btns = el('div'); btns.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
      var again = el('button', 'acx-btn go', 'Check again'); again.onclick = function () { again.disabled = true; recheck(function () { again.disabled = false; }); };
      if (why === 'birth') {
        sec.appendChild(el('h4', null, 'Before you chat'));
        para('AmitChat needs your birth date so young people are kept safe. It lives in About Me, because that is where Amit keeps who you are. It is saved once and cannot be changed afterwards (to correct a mistake, ask Ryan). We cannot check it ourselves, so please be truthful. Chat is for ages 13 and up.');
        if (AmitChat.onNeedBirthDate) {
          var ob = el('button', 'acx-btn go', 'Open About Me'); ob.onclick = function () { try { AmitChat.onNeedBirthDate(); } catch (e) {} }; btns.appendChild(ob);
          again.textContent = 'I\u2019ve added it \u2014 continue'; btns.appendChild(again);
        } else {
          var inp = el('input', 'acx-field'); inp.type = 'date'; inp.max = new Date().toISOString().slice(0, 10); inp.style.width = '100%'; sec.appendChild(inp);
          var go = el('button', 'acx-btn go', 'Save and continue');
          go.onclick = function () {
            if (!inp.value) { toast('Choose your birth date.'); return; }
            if (!confirm('Your birth date will be saved as ' + inp.value + ' and cannot be changed afterwards. Is that right?')) return;
            go.disabled = true; src.setBirthDate(inp.value).then(function () { recheck(function () {}); }, function (e) { toast(e.message); go.disabled = false; });
          };
          btns.appendChild(go);
        }
      } else if (why === 'family') {
        sec.appendChild(el('h4', null, 'Your birth date'));
        para('Your parent or guardian sets your birth date. Ask them to add it in About Me \u2192 Family on their account, and to switch chat on for you.');
        btns.appendChild(again);
      } else if (why === 'young') {
        sec.appendChild(el('h4', null, 'Chat is for ages 13 and up'));
        para('You will be able to use chat when you are 13. Everything else in Amit is open to you.');
      } else if (why === 'auth') {
        sec.appendChild(el('h4', null, 'Ask your parent or guardian'));
        para('A parent or guardian needs to switch chat on for you first. They can do it in About Me \u2192 Family on their account.');
        btns.appendChild(again);
      }
      sec.appendChild(btns); page.appendChild(sec);
    }

    /* ---- the chats my children are in (read only) ---- */
    function buildKids(target) {
      target.innerHTML = '';
      var head = el('div', 'acx-thead');
      if (!wide) { var b = el('button', 'acx-back', '\u2190'); b.onclick = function () { show('list'); }; head.appendChild(b); }
      head.appendChild(el('div', 'acx-tt', 'Children\u2019s chats')); target.appendChild(head);
      var page = el('div', 'acx-page'); target.appendChild(page);
      page.appendChild(el('div', 'acx-ts', 'You can read these because you are their guardian, until they turn 18. You cannot write in them, and everyone in the chat is told a guardian can read it.'));
      src.childrenChats().then(function (list) {
        if (destroyed) return;
        if (!list.length) { page.appendChild(el('div', 'acx-empty', 'Your children are not in any chat yet.')); return; }
        list.forEach(function (c) {
          var r = el('div', 'acx-row'); var tt = el('div', 'acx-rt');
          tt.appendChild(el('div', 'acx-rn', c.child + ' \u00B7 ' + c.title)); tt.appendChild(el('div', 'acx-rl', c.last ? 'last message ' + c.last : 'no messages yet'));
          r.appendChild(tt); r.onclick = function () { show('kidthread', c.id); }; page.appendChild(r);
        });
      }, function (e) { errBox(page, e); });
    }

    /* ---- For me ---- */
    function buildForMe(target) {
      target.innerHTML = '';
      var head = el('div', 'acx-thead');
      if (!wide) { var b = el('button', 'acx-back', '\u2190'); b.onclick = function () { show('list'); }; head.appendChild(b); }
      head.appendChild(el('div', 'acx-tt', 'For me')); target.appendChild(head);
      var page = el('div', 'acx-page'); target.appendChild(page);
      function draw() {
        loadForMe(true).then(function (d) {
          if (destroyed) return; page.innerHTML = '';
          if (!d.count && !(d.loops && d.loops.length)) { page.appendChild(el('div', 'acx-empty', 'Nothing is waiting for you.')); return; }
          function line(sec, text, btns) {
            var l = el('div', 'acx-line'); l.appendChild(el('div', null, text));
            var w = el('div'); w.style.cssText = 'display:flex;gap:6px'; btns.forEach(function (x) { w.appendChild(x); }); l.appendChild(w); sec.appendChild(l);
          }
          function mk(label, cls, fn) { var x = el('button', 'acx-btn' + (cls ? ' ' + cls : ''), label); x.onclick = function () { x.disabled = true; fn().then(function () { forMeAt = 0; draw(); AmitChat.refreshUnread(); }, function (e) { toast(e.message); x.disabled = false; }); }; return x; }
          if (d.guardian.length) {
            var g = el('div', 'acx-sec'); g.appendChild(el('h4', null, 'Guardian approvals'));
            d.guardian.forEach(function (q) {
              var txt = q.kind === 'link' ? q.minor_name + ' asked you to be their guardian.' : q.minor_name + ' (a young person) and ' + q.other_name + ' want to be friends. As their guardian, you decide.';
              line(g, txt, [mk('Approve', 'go', function () { return src.guardianDecide(q.kind, q.ref, true); }), mk('Decline', '', function () { return src.guardianDecide(q.kind, q.ref, false); })]);
            });
            page.appendChild(g);
          }
          if (d.requests.length) {
            var r1 = el('div', 'acx-sec'); r1.appendChild(el('h4', null, 'Friend requests'));
            d.requests.forEach(function (p) { line(r1, p.name + ' wants to be your friend.', [mk('Accept', 'go', function () { return src.respondFriend(p.rowId, true).then(function (st) { toast(st === 'awaiting_guardian' ? 'Waiting for their guardian to approve' : 'Friend added'); }); }), mk('Decline', '', function () { return src.respondFriend(p.rowId, false); })]); });
            page.appendChild(r1);
          }
          if (d.invites.length) {
            var r2 = el('div', 'acx-sec'); r2.appendChild(el('h4', null, 'Chat invitations'));
            d.invites.forEach(function (iv) { line(r2, iv.by + ' invited you to \u201C' + iv.title + '\u201D', [mk('Accept', 'go', function () { return src.respondInvite(iv.id, true); }), mk('Decline', '', function () { return src.respondInvite(iv.id, false); })]); });
            page.appendChild(r2);
          }
          var openLoops = (d.loops || []).filter(function (l) { return l.status === 'open'; }), keptLoops = (d.loops || []).filter(function (l) { return l.status === 'accepted'; });
          function loopLine(sec, l, btns) {
            var ln = el('div', 'acx-line'); var w0 = el('div'); w0.appendChild(el('div', null, l.text)); w0.appendChild(el('div', 'acx-ts', l.kind === 'question' ? 'An unanswered question' : l.kind === 'promise' ? 'A promise' : l.kind === 'prayer' ? 'A prayer request' : 'A follow-up'));
            ln.appendChild(w0); var w = el('div'); w.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap'; btns.forEach(function (b) { w.appendChild(b); });
            if (l.conv) { var ob = el('button', 'acx-btn', 'Open chat'); ob.onclick = function () { show('thread', l.conv); }; w.appendChild(ob); }
            ln.appendChild(w); sec.appendChild(ln);
          }
          if (openLoops.length) {
            var lp = el('div', 'acx-sec'); lp.appendChild(el('h4', null, 'Follow-ups Amit suggests'));
            lp.appendChild(el('div', 'acx-ts', 'Only you can see these. Nothing is sent to anyone.'));
            openLoops.forEach(function (l) { loopLine(lp, l, [mk('Keep', 'go', function () { return src.decideLoop(l.id, 'accept'); }), mk('Snooze 1 day', '', function () { return src.decideLoop(l.id, 'snooze', 1); }), mk('Snooze 1 week', '', function () { return src.decideLoop(l.id, 'snooze', 7); }), mk('Dismiss', '', function () { return src.decideLoop(l.id, 'dismiss'); })]); });
            page.appendChild(lp);
          }
          if (keptLoops.length) {
            var kp = el('div', 'acx-sec'); kp.appendChild(el('h4', null, 'Kept: still to do'));
            keptLoops.forEach(function (l) { loopLine(kp, l, [mk('Done', 'go', function () { return src.decideLoop(l.id, 'done'); })]); });
            page.appendChild(kp);
          }
          if (d.replies.length) {
            var r3 = el('div', 'acx-sec'); r3.appendChild(el('h4', null, 'Replies to you'));
            d.replies.forEach(function (x) { var open = el('button', 'acx-btn', 'Open'); open.onclick = function () { show('thread', x.conv); }; line(r3, x.name + ': ' + (x.text.length > 100 ? x.text.slice(0, 100) + '\u2026' : x.text) + ' (' + x.time + ')', [open]); });
            page.appendChild(r3);
          }
        }, function (e) { page.innerHTML = ''; errBox(page, e); });
      }
      draw();
    }

    /* ---- thread ---- */
    function buildThread(target, convId, ro) {
      target.innerHTML = '';
      var t = el('div', 'acx-thread'); target.appendChild(t);
      var head = el('div', 'acx-thead');
      if (!wide) { var b = el('button', 'acx-back', '←'); b.onclick = function () { show('list'); }; head.appendChild(b); }
      var hw = el('div'); var tt = el('div', 'acx-tt', ''), ts = el('div', 'acx-ts', '');
      var tl = el('div', 'acx-ts', ''), wl = el('div', 'acx-watch', ''); hw.appendChild(tt); hw.appendChild(ts); hw.appendChild(tl); hw.appendChild(wl); head.appendChild(hw); head.appendChild(el('div', 'acx-spacer'));
      var amitHead = null; t.appendChild(head);
      var gear = null, setPanel = null, spk = null;
      if (live) {
        amitHead = el('button', 'acx-btn acx-ahd'); amitHead.style.display = 'none'; amitHead.title = 'Invite Amit into this chat';
        var ahi = el('img'); ahi.src = AmitChat.iconUrl; ahi.alt = ''; ahi.onerror = function () { ahi.style.display = 'none'; }; amitHead.appendChild(ahi); amitHead.appendChild(document.createTextNode('Add Amit'));
        amitHead.onclick = function () { amitClick(); }; if (!ro) head.appendChild(amitHead);
        var spk = null;
        /* the read-aloud player now lives in each message (v0.15) */
        var refBtn = el('button', 'acx-ib acx-ref', '\u21BB'); refBtn.title = 'Refresh this chat now'; head.appendChild(refBtn);
        refBtn.onclick = function () { bump(); var p = load(false); if (p && p.then) p.then(function () { toast('Refreshed'); }, function () {}); else toast('Refreshed'); };
        var srchBtn = el('button', 'acx-ib acx-srch', '\uD83D\uDD0D'); srchBtn.title = 'Search this chat'; head.appendChild(srchBtn);
        gear = el('button', 'acx-ib acx-gear', '\u2699'); gear.title = 'Chat settings'; head.appendChild(gear); if (ro) gear.style.display = 'none';
        var srchPanel = null;
        srchBtn.onclick = function () {
          if (srchPanel) { srchPanel.remove(); srchPanel = null; return; }
          srchPanel = el('div', 'acx-set');
          var row = el('div'); row.style.cssText = 'display:flex;gap:6px';
          var qi = el('input', 'acx-field'); qi.placeholder = 'Search this chat'; qi.maxLength = 80;
          var qb = el('button', 'acx-btn go', 'Search'); row.appendChild(qi); row.appendChild(qb); srchPanel.appendChild(row);
          var out = el('div'); out.style.cssText = 'max-height:180px;overflow:auto'; srchPanel.appendChild(out);
          function go() {
            qb.disabled = true; out.innerHTML = '';
            src.searchMessages(convId, qi.value).then(function (hits) {
              if (!hits.length) out.appendChild(el('div', 'acx-ts', 'Nothing found.'));
              hits.forEach(function (h) {
                var b = el('button', 'acx-hit'); b.appendChild(el('small', null, h.name + ' \u00B7 ' + h.time)); b.appendChild(document.createTextNode(h.text.length > 140 ? h.text.slice(0, 140) + '\u2026' : h.text));
                b.onclick = function () { var f = state.msgs.filter(function (m) { return m.id === h.id; })[0]; if (!f) { toast('That message is further back. Use \u201CLoad earlier messages\u201D.'); return; } var i = state.msgs.indexOf(f); var nodes = msgsDiv.querySelectorAll('.acx-b'); var cands = state.msgs.filter(function (m) { return m.from !== 'system'; }); var n = nodes[cands.indexOf(f)]; if (n) { n.scrollIntoView({ block: 'center' }); n.style.outline = '2px solid rgba(var(--amit-accent-rgb,201,168,76),.9)'; setTimeout(function () { n.style.outline = ''; }, 1800); } };
                out.appendChild(b);
              });
            }, function (e) { toast(e.message); }).then(function () { qb.disabled = false; });
          }
          qb.onclick = go; qi.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
          t.insertBefore(srchPanel, msgsDiv); qi.focus();
        };
        gear.onclick = function () {
          if (setPanel) { setPanel.remove(); setPanel = null; return; }
          src.getSettings(convId).then(function (st) {
            if (destroyed || setPanel) return;
            setPanel = el('div', 'acx-set');
            setPanel.appendChild(el('b', null, 'Settings for this chat (just for you)'));
            function box(label, note, field, on) {
              var l = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.checked = on; l.appendChild(cb);
              var w = el('div'); w.appendChild(el('div', null, label)); w.appendChild(el('div', 'acx-ts', note)); l.appendChild(w);
              cb.onchange = function () { cb.disabled = true; src.setSetting(convId, field, cb.checked).then(function () { if (field === 'typing') state.myTyping = cb.checked; toast('Saved'); }, function (e) { cb.checked = !cb.checked; toast(e.message); }).then(function () { cb.disabled = false; }); };
              setPanel.appendChild(l);
            }
            box('Let others see when I have read their messages', 'Turn off and nobody sees \u201CSeen by you\u201D in this chat.', 'receipts', st.receipts);
            box('Let others see when I am typing', 'Turn off and your \u201Cis typing\u2026\u201D stays private in this chat.', 'typing', st.typing);
            state.myTyping = st.typing;
            box('Mute this chat', 'No badge or number for new messages here. You still see them when you open it.', 'muted', st.muted);
            box('Share my local time with this chat', 'Others in the chat can see what time it is for you (never your location).', 'time', st.shareTime);
            var hb = el('button', 'acx-btn', 'Hide this chat for me');
            hb.onclick = function () { hb.disabled = true; src.hideChat(convId, true).then(function () { toast('Hidden. It comes back if someone writes in it.'); show('list'); }, function (e) { toast(e.message); hb.disabled = false; }); };
            setPanel.appendChild(hb);
            if (st.canRename) {
              var dl = el('button', 'acx-btn', state.conv && state.conv.deleteAt ? 'Cancel the deletion' : 'Delete this chat\u2026');
              dl.onclick = function () {
                var pending = state.conv && state.conv.deleteAt;
                if (!pending && !confirm('Delete this whole chat for everyone?\n\nEveryone in it will be told. The chat and all its messages will be permanently deleted in 24 hours, unless you cancel before then.')) return;
                dl.disabled = true;
                (pending ? src.cancelDelete(convId) : src.requestDelete(convId)).then(function () { toast(pending ? 'Deletion cancelled' : 'Deletion started: 24 hours to cancel'); bump(); return load(false); }, function (e) { toast(e.message); }).then(function () { dl.disabled = false; if (setPanel) { setPanel.remove(); setPanel = null; } });
              };
              setPanel.appendChild(dl);
            }
            var exb = el('button', 'acx-btn', 'Download this chat as a text file');
            exb.onclick = function () {
              exb.disabled = true;
              src.exportChat(convId).then(function (r) {
                var blob = new Blob([r.text], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
                a.href = URL.createObjectURL(blob); a.download = ('AmitChat - ' + r.title).replace(/[^\w .-]+/g, '_').slice(0, 80) + '.txt';
                document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); toast('Downloaded');
              }, function (e) { toast(e.message); }).then(function () { exb.disabled = false; });
            };
            setPanel.appendChild(exb);
            if (st.canRename) {
              var rl = el('div'); rl.style.cssText = 'display:flex;gap:6px';
              var ri = el('input', 'acx-field'); ri.value = st.title; ri.placeholder = 'Chat name'; ri.maxLength = 80;
              var rb = el('button', 'acx-btn', 'Rename');
              rb.onclick = function () { rb.disabled = true; src.renameChat(convId, ri.value).then(function () { toast('Renamed'); bump(); return load(false); }, function (e) { toast(e.message); }).then(function () { rb.disabled = false; }); };
              rl.appendChild(ri); rl.appendChild(rb); setPanel.appendChild(rl);
            }
            t.insertBefore(setPanel, msgsDiv);
          }, function (e) { toast(e.message); });
        };
      }
      var msgsDiv = el('div', 'acx-msgs'); t.appendChild(msgsDiv);
      var rbar = el('div', 'acx-rbar'); rbar.style.display = 'none'; t.appendChild(rbar);
      var replyBar = el('div', 'acx-replybar'); replyBar.style.display = 'none'; t.appendChild(replyBar);
      var comp = el('div', 'acx-comp'); t.appendChild(comp);
      var tid = uid(), lbar = null;
      var ta = null, sendBtn = null;
      var fileBtn = null, photoBtn = null, amitBtn = null, liveBtn = null, fileIn = null, photoIn = null, voiceBtn = null, videoBtn = null, noteBtn = null, silentBtn = null, moreBtn = null, fixBtn = null, itemBtn = null, typing = null;
      if (live && !ro) {
        fileBtn = el('button', 'acx-ib', '\uD83D\uDCCE'); fileBtn.title = 'Attach a file (up to 10 MB)';
        photoBtn = el('button', 'acx-ib', '\uD83D\uDCF7'); photoBtn.title = 'Send a photo';
        voiceBtn = el('button', 'acx-ib', '\uD83C\uDFA4'); voiceBtn.title = 'Record a voice message (with a transcript)';
        liveBtn = el('button', 'acx-ib', '\uD83D\uDDE3'); liveBtn.title = 'Live transcript: keeps listening and turns what you say into text lines in this chat (no audio is kept). Press again to stop.';
        videoBtn = el('button', 'acx-ib acx-xtra', '\uD83C\uDFA5'); videoBtn.title = 'Share a video-call link';
        noteBtn = el('button', 'acx-ib acx-xtra', '\uD83D\uDCDD'); noteBtn.title = 'Save what you typed as a private note (only you see it)';
        silentBtn = el('button', 'acx-ib acx-xtra', '\uD83D\uDD15'); silentBtn.title = 'Send silently: does not add to their unread badge';
        fixBtn = el('button', 'acx-ib acx-xtra', '\uD83D\uDEE0'); fixBtn.title = 'Help me fix this (a guided help request)';
        itemBtn = el('button', 'acx-ib acx-xtra', '\u2795'); itemBtn.title = 'Add a question, decision, prayer request or note to this chat';
        moreBtn = el('button', 'acx-ib', '\u22EF'); moreBtn.title = 'More options';
        amitBtn = el('button', 'acx-ib'); amitBtn.title = 'Amit'; amitBtn.style.display = 'none';
        var ai = el('img'); ai.src = AmitChat.iconUrl; ai.alt = 'Amit'; ai.onerror = function () { amitBtn.textContent = 'A'; }; amitBtn.appendChild(ai);
        fileIn = el('input'); fileIn.type = 'file'; fileIn.multiple = true; fileIn.style.display = 'none';
        photoIn = el('input'); photoIn.type = 'file'; photoIn.accept = 'image/*'; photoIn.multiple = true; photoIn.style.display = 'none';
        ta = el('textarea'); ta.rows = 1; ta.placeholder = 'Type a message\u2026';
        sendBtn = el('button', 'acx-btn go', 'Send');
        comp.appendChild(fileBtn); comp.appendChild(photoBtn); comp.appendChild(voiceBtn); comp.appendChild(liveBtn); comp.appendChild(amitBtn); comp.appendChild(moreBtn); comp.appendChild(videoBtn); comp.appendChild(fixBtn); comp.appendChild(itemBtn); comp.appendChild(noteBtn); comp.appendChild(silentBtn); comp.appendChild(fileIn); comp.appendChild(photoIn);
        comp.appendChild(ta); comp.appendChild(sendBtn);
      } else if (ro) {
        comp.appendChild(el('div', 'acx-stub', 'Read only \u2014 you are reading this as a guardian'));
      } else {
        comp.appendChild(el('span', 'acx-ic', '＋')); comp.appendChild(el('span', 'acx-ic', '📷')); comp.appendChild(el('span', 'acx-ic', '🎤'));
        comp.appendChild(el('div', 'acx-stub', 'Preview only — not connected'));
      }
      var state = { msgs: [], sig: '', more: false, oldest: null, conv: null, busy: false, editing: null, typing: '', replyTo: null, silent: false, items: [], expanded: {}, itemsOpen: true };

      /* ═══ HELP REQUEST CARD, STEPS AND ITEMS ═══ */
      var fpanel = null;
      function closePanel() { if (fpanel) { fpanel.remove(); fpanel = null; } }
      function panelBase(kind, title) {
        if (fpanel && fpanel.getAttribute('data-k') === kind) { closePanel(); return null; }
        closePanel(); fpanel = el('div', 'acx-set'); fpanel.setAttribute('data-k', kind); fpanel.appendChild(el('b', null, title));
        t.insertBefore(fpanel, comp); return fpanel;
      }
      function openFixForm() {
        var p = panelBase('fix', 'Help me fix this'); if (!p) return;
        function box(ph) { var a = el('textarea', 'acx-editbox'); a.placeholder = ph; a.maxLength = 3000; p.appendChild(a); return a; }
        var a1 = box('What were you doing?'), a2 = box('What happened? (any message you saw)'), a3 = box('What have you already tried?');
        p.appendChild(el('div', 'acx-ts', 'Your browser, screen size and language are sent with it so the helper does not have to ask.'));
        var go = el('button', 'acx-btn go', 'Send help request');
        go.onclick = function () {
          if (!a1.value.trim() && !a2.value.trim()) { toast('Tell us what you were doing or what happened.'); return; }
          go.disabled = true;
          src.sendFixCard(convId, { doing: a1.value, happened: a2.value, tried: a3.value, env: envInfo() }).then(function () { closePanel(); toast('Help request sent'); bump(); return load(false); }, function (e) { toast(e.message); go.disabled = false; });
        };
        p.appendChild(go);
      }
      function openItemForm() {
        var p = panelBase('item', 'Add to this chat'); if (!p) return;
        var kinds = [['question', 'Question'], ['decision', 'Decision'], ['prayer', 'Prayer request'], ['note', 'Study note']];
        var sel = el('select', 'acx-field'); kinds.forEach(function (k) { var o = el('option', null, k[1]); o.value = k[0]; sel.appendChild(o); }); p.appendChild(sel);
        var tx = el('textarea', 'acx-editbox'); tx.maxLength = 2000; tx.placeholder = 'Write it here\u2026'; p.appendChild(tx);
        var cl = el('label'); var cb = el('input'); cb.type = 'checkbox'; cl.appendChild(cb); cl.appendChild(document.createTextNode(' Keep this prayer request confidential (Amit skips it)')); cl.style.display = 'none'; p.appendChild(cl);
        sel.onchange = function () { cl.style.display = sel.value === 'prayer' ? '' : 'none'; };
        var go = el('button', 'acx-btn go', 'Add');
        go.onclick = function () { go.disabled = true; src.addItem(convId, sel.value, tx.value, { confidential: sel.value === 'prayer' && cb.checked }).then(function () { closePanel(); bump(); return load(false); }, function (e) { toast(e.message); go.disabled = false; }); };
        p.appendChild(go);
      }
      var STEP_STATES = [['open', '\u2610', 'Not done yet'], ['done', '\u2611', 'Done'], ['failed', '\u2612', 'Did not work'], ['na', '\u2298', 'Cannot do']];
      function reload() { bump(); return load(false); }
      function renderFixCard(bub, x, pl) {
        var box = el('div', 'acx-fix'); box.appendChild(el('b', null, '\uD83D\uDEE0 Help request'));
        [['What I was doing', pl.doing], ['What happened', pl.happened], ['What I have tried', pl.tried]].forEach(function (r) {
          if (!r[1]) return; var d = el('div', 'acx-fixrow'); d.appendChild(el('span', 'acx-fixlab', r[0] + ': '));
          var body = el('span'); body.textContent = r[1].length > 700 && !state.expanded[x.id + r[0]] ? r[1].slice(0, 700) + '\u2026' : r[1]; d.appendChild(body);
          if (r[1].length > 700) { var tg = el('button', 'acx-moretxt', state.expanded[x.id + r[0]] ? 'Show less' : 'Show all'); tg.onclick = function () { state.expanded[x.id + r[0]] = !state.expanded[x.id + r[0]]; renderMsgs(state.conv, null); }; d.appendChild(tg); }
          box.appendChild(d);
        });
        if (pl.env && Object.keys(pl.env).length) { var det = el('details'); det.appendChild(el('summary', 'acx-ts', 'Technical details')); det.appendChild(el('div', 'acx-ts', Object.keys(pl.env).map(function (k) { return k + ': ' + pl.env[k]; }).join(' \u00B7 '))); box.appendChild(det); }
        var steps = state.items.filter(function (i) { return i.messageId === x.id && i.kind === 'step'; });
        var done = steps.filter(function (i) { return i.state === 'done'; }).length;
        box.appendChild(el('div', 'acx-fixhead', steps.length ? 'Steps: ' + done + ' of ' + steps.length + ' done' : 'No steps yet'));
        steps.forEach(function (st) {
          var row = el('div', 'acx-step acx-st-' + st.state); var tt2 = el('span', 'acx-stt', st.text + '  (' + st.by + ')'); row.appendChild(tt2);
          var sb = el('span', 'acx-sb');
          STEP_STATES.forEach(function (ss) { var b = el('button', st.state === ss[0] ? 'on' : null, ss[1]); b.title = ss[2]; if (ro) b.disabled = true; b.onclick = function () { src.setItemState(st.id, ss[0]).then(reload, function (e) { toast(e.message); }); }; sb.appendChild(b); });
          if (st.mine && !ro) { var db3 = el('button', null, '\u2715'); db3.title = 'Remove my step'; db3.onclick = function () { src.deleteItem(st.id).then(reload, function (e) { toast(e.message); }); }; sb.appendChild(db3); }
          row.appendChild(sb); box.appendChild(row);
        });
        if (live && !ro) {
          var al = el('div'); al.style.cssText = 'display:flex;gap:6px;margin-top:6px'; var ai2 = el('input', 'acx-field'); ai2.placeholder = 'Add a step to try'; ai2.maxLength = 300;
          var ab2 = el('button', 'acx-btn', 'Add step');
          ab2.onclick = function () { if (!ai2.value.trim()) return; ab2.disabled = true; src.addItem(convId, 'step', ai2.value, { messageId: x.id }).then(reload, function (e) { toast(e.message); ab2.disabled = false; }); };
          al.appendChild(ai2); al.appendChild(ab2); box.appendChild(al);
        }
        bub.appendChild(box);
      }
      var ITEM_KINDS = { prayer: ['\uD83D\uDE4F', 'Prayer requests', 'Mark answered'], decision: ['\u2705', 'Decisions', 'Mark decided'], question: ['\u2753', 'Questions', 'Mark answered'], note: ['\uD83D\uDCDD', 'Study notes', null] };
      function renderItemsBar() {
        var list = state.items.filter(function (i) { return i.kind !== 'step' && !i.messageId; });
        if (!list.length) return null;
        var box = el('div', 'acx-items');
        var hd = el('button', null, (state.itemsOpen ? '\u25BE ' : '\u25B8 ') + 'In this chat (' + list.length + ')'); hd.onclick = function () { state.itemsOpen = !state.itemsOpen; renderMsgs(state.conv, null); }; box.appendChild(hd);
        if (!state.itemsOpen) return box;
        ['prayer', 'decision', 'question', 'note'].forEach(function (k) {
          list.filter(function (i) { return i.kind === k; }).forEach(function (it) {
            var meta = ITEM_KINDS[k], row = el('div', 'acx-item acx-st-' + it.state);
            row.appendChild(el('span', 'acx-itt', meta[0] + ' ' + it.text + '  (' + it.by + ')' + (it.confidential ? '  \uD83D\uDD12 confidential' : '') + (it.state === 'done' && it.answeredAt ? '  \u00B7 ' + (k === 'decision' ? 'decided ' : 'answered ') + new Date(it.answeredAt).toLocaleDateString() : '')));
            var sb = el('span', 'acx-sb');
            if (meta[2] && !ro) { var b = el('button', null, it.state === 'done' ? 'Reopen' : meta[2]); b.onclick = function () { src.setItemState(it.id, it.state === 'done' ? 'open' : 'done').then(reload, function (e) { toast(e.message); }); }; sb.appendChild(b); }
            if (it.mine && !ro) { var d = el('button', null, '\u2715'); d.title = 'Remove'; d.onclick = function () { src.deleteItem(it.id).then(reload, function (e) { toast(e.message); }); }; sb.appendChild(d); }
            row.appendChild(sb); box.appendChild(row);
          });
        });
        return box;
      }

      /* ═══ READ ALOUD: speaks right here in the chat (no Speak to Me), follows the words, pause / back / next / stop.
         The voice, speed, pitch, volume and pause come from About Me (AmitChat.voiceProvider); "heard up to" is kept per chat on this device. ═══ */
      var rd = { on: false, paused: false, queue: [], i: 0, token: 0, v: {}, curMsg: null, word: null, sent: null };
      var hlOk = typeof window.CSS !== 'undefined' && window.CSS.highlights && typeof Highlight !== 'undefined';
      DBG.reader = rd; DBG.readerHL = hlOk;
      var vdlg = null;
      var HKEY = 'acx-heard-' + convId;
      function heardGet() { try { return localStorage.getItem(HKEY) || ''; } catch (e) { return ''; } }
      function heardSet(iso) { try { if (iso && iso > heardGet()) localStorage.setItem(HKEY, iso); } catch (e) {} }
      function unheardList() {
        var mk = heardGet();
        var l = state.msgs.filter(function (m) { return (m.from === 'them' || m.from === 'amit') && !m.removed && ['text', 'photo', 'file', 'voice'].indexOf(m.type) >= 0 && (!mk || m.iso > mk); });
        return mk ? l : l.slice(-10);
      }
      function updateSpk() {
        if (!spk) return; var n = unheardList().length;
        spk.textContent = '\uD83D\uDD0A' + (n ? ' ' + n : ''); spk.classList.toggle('on', rd.on);
        spk.title = rd.on ? 'Stop reading' : (n ? 'Read ' + n + ' new message' + (n > 1 ? 's' : '') + ' aloud' : 'Nothing new to read aloud');
      }
      function spokenWord(w) { if (/^https?:\/\//i.test(w)) return 'link'; return w.replace(/\bAmit\b/g, 'uh-MEET'); }
      function sayable(t) { return String(t || '').replace(/\bAmit\b/g, 'uh-MEET'); }
      function planFor(m, withName) {
        var items = [], who = m.name || 'Someone';
        if (m.type === 'text') {
          var words = [], re = /\S+/g, mm;
          while ((mm = re.exec(m.text))) words.push({ s: mm.index, e: mm.index + mm[0].length, t: mm[0] });
          var sents = [], cur = [];
          words.forEach(function (w, k) { cur.push(k); if (/[.!?]["'\u201D)\]]*$/.test(w.t)) { sents.push(cur); cur = []; } });
          if (cur.length) sents.push(cur);
          sents.forEach(function (idxs) {
            var offs = [], spoken = '';
            idxs.forEach(function (k, n) { if (n) spoken += ' '; offs.push(spoken.length); spoken += spokenWord(words[k].t); });
            items.push({ text: spoken, words: words, idxs: idxs, offs: offs, msgId: m.id });
          });
          if (withName) items.unshift({ text: sayable(who) + ' says.', msgId: m.id, plain: true });
        } else if (m.type === 'voice') {
          var tr = m.payload && m.payload.transcript;
          items.push({ text: sayable(who) + ' sent a voice message.' + (tr ? ' It says: ' + sayable(tr) : ''), msgId: m.id, plain: true });
        } else {
          items.push({ text: sayable(who) + ' sent ' + (m.type === 'photo' ? 'a photo' : 'a file' + (m.payload && m.payload.name ? ' called ' + sayable(m.payload.name) : '')) + '.', msgId: m.id, plain: true });
        }
        return items;
      }
      function bubbleOf(id) { return msgsDiv.querySelector('[data-mid="' + id + '"]'); }
      function textRange(root, a, b) {
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), pos = 0, n, r = document.createRange(), got = false;
        while ((n = w.nextNode())) {
          var len = n.nodeValue.length;
          if (!got && a < pos + len) { r.setStart(n, Math.max(0, a - pos)); got = true; }
          if (got && b <= pos + len) { r.setEnd(n, Math.max(0, b - pos)); return r; }
          pos += len;
        }
        return null;
      }
      function paintHL() {
        if (!hlOk) return;
        var bub = rd.curMsg ? bubbleOf(rd.curMsg) : null, body = bub && bub.querySelector('.acx-mbody');
        window.CSS.highlights.delete('acx-read'); window.CSS.highlights.delete('acx-sent');
        if (!body) return;
        if (rd.sent) { var r1 = textRange(body, rd.sent[0], rd.sent[1]); if (r1) window.CSS.highlights.set('acx-sent', new Highlight(r1)); }
        if (rd.word) { var r2 = textRange(body, rd.word[0], rd.word[1]); if (r2) window.CSS.highlights.set('acx-read', new Highlight(r2)); }
      }
      function clearHL() { rd.word = null; rd.sent = null; if (hlOk) { window.CSS.highlights.delete('acx-read'); window.CSS.highlights.delete('acx-sent'); } }
      function markBubble(id) {
        Array.prototype.forEach.call(msgsDiv.querySelectorAll('.acx-b.reading'), function (x) { x.classList.remove('reading'); });
        rd.curMsg = id; var b = bubbleOf(id); if (b) { b.classList.add('reading'); b.scrollIntoView({ block: 'nearest' }); }
      }
      function reapplyReading() { if (rd.curMsg) { var b = bubbleOf(rd.curMsg); if (b) b.classList.add('reading'); paintHL(); } }
      /* the player lives in the bubble that is being read: start over, pause/play, next, and an adjust icon (voice dialog) */
      function barDraw() {
        var cur = rd.on ? rd.queue[rd.i] : null;
        Array.prototype.forEach.call(msgsDiv.querySelectorAll('.acx-mp'), function (x) { if (!cur || x.getAttribute('data-for') !== cur.id) x.remove(); });
        if (!cur) return;
        var b = bubbleOf(cur.id); if (!b) return;
        var mp = b.querySelector('.acx-mp');
        if (!mp) {
          mp = el('div', 'acx-mp'); mp.setAttribute('data-for', cur.id);
          var mk = function (txt, title, fn, cls) { var x = el('button', 'acx-ib' + (cls ? ' ' + cls : ''), txt); x.title = title; x.onclick = fn; return x; };
          mp.appendChild(mk('\u23EE', 'Start this message over (press again to go back one message)', function () { readRestart(); }));
          mp.appendChild(mk('\u23F8', 'Pause', function () { readPause(); }, 'acx-pp'));
          mp.appendChild(mk('\u23ED', 'Next message', function () { readNext(); }));
          mp.appendChild(mk('\uD83C\uDF9A', 'Change the voice, speed and more', function () { openVoiceDialog(); }, 'acx-adj'));
          b.appendChild(mp);
        }
        var pp = mp.querySelector('.acx-pp'); pp.textContent = rd.paused ? '\u25B6' : '\u23F8'; pp.title = rd.paused ? 'Resume' : 'Pause';
      }
      function mkUtter(text) {
        var u = new SpeechSynthesisUtterance(text), v = rd.v || {};
        if (v.voice) u.voice = v.voice; u.rate = v.rate || 1.1; u.pitch = v.pitch || 1; u.volume = v.volume != null ? v.volume : 1;
        return u;
      }
      function runItems(items, k, token, done) {
        if (token !== rd.token) return;
        if (k >= items.length) { done(); return; }
        var it = items[k], u = mkUtter(it.plain ? sayable(it.text) : it.text);
        u.onstart = function () {
          if (token !== rd.token) return;
          markBubble(it.msgId);
          if (it.plain) { clearHL(); return; }
          rd.sent = [it.words[it.idxs[0]].s, it.words[it.idxs[it.idxs.length - 1]].e]; rd.word = [it.words[it.idxs[0]].s, it.words[it.idxs[0]].e]; paintHL();
        };
        u.onboundary = function (e) {
          if (token !== rd.token || it.plain || !it.offs) return;
          if (e.name && e.name !== 'word') return;
          var n = 0; for (var q = 0; q < it.offs.length; q++) { if (it.offs[q] <= e.charIndex) n = q; }
          var w = it.words[it.idxs[n]]; rd.word = [w.s, w.e]; paintHL();
        };
        var next = function () {
          if (token !== rd.token) return;
          (function wait() { if (token !== rd.token) return; if (rd.paused) { setTimeout(wait, 250); return; } runItems(items, k + 1, token, done); })();
        };
        u.onend = function () { if (token !== rd.token) return; setTimeout(next, Math.round(260 * ((rd.v && rd.v.pauseScale) || 1.2))); };
        u.onerror = function () { if (token !== rd.token) return; next(); };
        try { window.speechSynthesis.speak(u); } catch (e) { stopReading(); }
      }
      function playMsg(i) {
        var token = ++rd.token; rd.i = i; rd.msgStart = Date.now(); var m = rd.queue[i];
        if (!m) { finishReading(); return; }
        barDraw(); clearHL();
        var withName = i === 0 || !rd.queue[i - 1] || rd.queue[i - 1].name !== m.name;
        runItems(planFor(m, withName), 0, token, function () { heardSet(m.iso); if (token !== rd.token) return; if (i + 1 >= rd.queue.length) finishReading(); else playMsg(i + 1); });
      }
      function readNext() { if (!rd.on) return; var m = rd.queue[rd.i]; if (m) heardSet(m.iso); window.speechSynthesis.cancel(); rd.paused = false; if (rd.i + 1 >= rd.queue.length) finishReading(); else playMsg(rd.i + 1); }
      function readBack() { if (!rd.on) return; window.speechSynthesis.cancel(); rd.paused = false; playMsg(Math.max(0, rd.i - 1)); }
      function readRestart() { if (!rd.on) return; var ago = Date.now() - (rd.msgStart || 0); window.speechSynthesis.cancel(); rd.paused = false; playMsg(ago < 2500 && rd.i > 0 ? rd.i - 1 : rd.i); }
      function readPause() {
        if (!rd.on) return; rd.paused = !rd.paused;
        try { if (rd.paused) window.speechSynthesis.pause(); else window.speechSynthesis.resume(); } catch (e) {}
        barDraw();
      }
      function endReading() {
        rd.on = false; rd.paused = false; rd.token++; try { window.speechSynthesis.cancel(); } catch (e) {}
        clearHL(); Array.prototype.forEach.call(msgsDiv.querySelectorAll('.acx-b.reading'), function (x) { x.classList.remove('reading'); }); rd.curMsg = null;
        Array.prototype.forEach.call(msgsDiv.querySelectorAll('.acx-mp'), function (x) { x.remove(); }); closeVoiceDialog(true);
        rbar.style.display = 'none'; rbar.innerHTML = '';
        if (AmitChat._stopReader === stopReading) AmitChat._stopReader = null;
        if (AmitChat.onSpeak) { try { AmitChat.onSpeak(false); } catch (e) {} }
        updateSpk();
      }
      function stopReading() { if (rd.on) endReading(); }
      function finishReading() { endReading(); toast('That is all.'); }
      function startReading(list) {
        list = list || unheardList();
        if (!list.length) { toast('Nothing to read aloud.'); return; }
        if (AmitChat._stopReader) AmitChat._stopReader();
        var vp = AmitChat.voiceProvider ? Promise.resolve().then(function () { return AmitChat.voiceProvider(); }) : Promise.resolve({});
        vp.then(function (v) { return v || {}; }, function () { return {}; }).then(function (v) {
          if (destroyed) return;
          rd.v = v; rd.queue = list; rd.i = 0; rd.on = true; rd.paused = false;
          AmitChat._stopReader = stopReading;
          if (AmitChat.onSpeak) { try { AmitChat.onSpeak(true); } catch (e) {} }
          updateSpk(); playMsg(0);
        });
      }
      if (spk) spk.onclick = function () { if (rd.on) stopReading(); else startReading(); };

      /* which messages can be read aloud, and "play from this one onward" */
      function readable(m) { return !m.removed && m.from !== 'system' && m.from !== 'note' && ['text', 'voice', 'photo', 'file'].indexOf(m.type) >= 0 && !(m.payload && m.payload.marker) && (m.type !== 'text' || !!(m.text || '').trim()); }
      function readableFrom(id) {
        var idx = -1; state.msgs.forEach(function (m, k) { if (m.id === id) idx = k; });
        return idx < 0 ? [] : state.msgs.slice(idx).filter(readable);
      }
      /* the voice dialog: voice, speed, pitch, volume and pause, heard as you change them; closing it saves them to the person's profile */
      function voiceNow() { var v = rd.v || {}; return { voice: v.voice || null, rate: v.rate || 1.1, pitch: v.pitch || 1, volume: v.volume != null ? v.volume : 1, pauseScale: v.pauseScale || 1.2 }; }
      function closeVoiceDialog(save) {
        if (!vdlg) return; var d = vdlg; vdlg = null; try { d.remove(); } catch (e) {}
        if (!save || !d._orig) return;
        var now = voiceNow(), o = d._orig;
        var changed = ['rate', 'pitch', 'volume', 'pauseScale'].some(function (k) { return Math.abs(now[k] - o[k]) > 0.001; }) || ((now.voice && now.voice.name) || '') !== ((o.voice && o.voice.name) || '');
        if (!changed) return;
        var fields = { voice_rate: now.rate, voice_pitch: now.pitch, voice_volume: now.volume, voice_pause_scale: now.pauseScale };
        if (now.voice) fields.voice_name = now.voice.name;
        if (!AmitChat.voiceSaver) { toast('Voice changed for this session.'); return; }
        Promise.resolve().then(function () { return AmitChat.voiceSaver(fields); }).then(function (ok) { toast(ok ? 'Saved as your default voice.' : 'Could not save your voice right now.'); }, function () { toast('Could not save your voice right now.'); });
      }
      function openVoiceDialog() {
        if (vdlg) { closeVoiceDialog(true); return; }
        if (!rd.v) rd.v = {};
        var d = el('div', 'acx-set acx-vdlg'); d._orig = voiceNow(); vdlg = d;
        d.appendChild(el('b', null, 'Reading voice'));
        var sel = el('select', 'acx-field');
        function fillVoices() {
          var vs = []; try { vs = window.speechSynthesis.getVoices() || []; } catch (e) {}
          sel.innerHTML = ''; var o0 = el('option', null, 'Default voice'); o0.value = ''; sel.appendChild(o0);
          vs.slice().sort(function (a, b) { var ea = /^en/i.test(a.lang) ? 0 : 1, eb = /^en/i.test(b.lang) ? 0 : 1; return ea - eb || a.name.localeCompare(b.name); }).forEach(function (v) { var o = el('option', null, v.name + ' (' + v.lang + ')'); o.value = v.name; sel.appendChild(o); });
          var cur = rd.v && rd.v.voice; sel.value = cur ? cur.name : '';
        }
        fillVoices(); try { window.speechSynthesis.addEventListener('voiceschanged', fillVoices); } catch (e) {}
        sel.onchange = function () { var vs = []; try { vs = window.speechSynthesis.getVoices() || []; } catch (e) {} rd.v.voice = vs.filter(function (v) { return v.name === sel.value; })[0] || null; };
        d.appendChild(sel);
        function slider(label, key, min, max, step, fmt) {
          var row = el('label'); row.style.flexWrap = 'nowrap';
          var nm = el('span', null, label); nm.style.minWidth = '62px';
          var r = el('input'); r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(step); r.value = String(voiceNow()[key]); r.style.flex = '1'; r.setAttribute('data-k', key);
          var val = el('span', 'acx-ts', fmt(Number(r.value))); val.style.minWidth = '40px'; val.style.textAlign = 'right';
          r.oninput = function () { var n = Number(r.value); rd.v[key] = n; val.textContent = fmt(n); };
          row.appendChild(nm); row.appendChild(r); row.appendChild(val); d.appendChild(row);
        }
        slider('Speed', 'rate', 0.5, 2.5, 0.05, function (n) { return n.toFixed(2) + '\u00D7'; });
        slider('Pitch', 'pitch', 0.5, 2, 0.05, function (n) { return n.toFixed(2); });
        slider('Volume', 'volume', 0, 1, 0.05, function (n) { return Math.round(n * 100) + '%'; });
        slider('Pause', 'pauseScale', 0.5, 3, 0.1, function (n) { return n.toFixed(1) + '\u00D7'; });
        d.appendChild(el('div', 'acx-ts', 'You hear changes on the next sentence. Closing this saves them as your default voice.'));
        var done = el('button', 'acx-btn go', 'Done'); done.onclick = function () { closeVoiceDialog(true); }; d.appendChild(done);
        t.insertBefore(d, comp);
      }

      function timesText(list) {
        if (!list || !list.length) return '';
        return list.map(function (x) {
          try { return 'Their time (' + x.name + '): ' + new Intl.DateTimeFormat([], { timeZone: x.tz, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date()); } catch (e) { return ''; }
        }).filter(Boolean).join(' \u00B7 ');
      }
      function setReply(x) {
        state.replyTo = x ? { id: x.id, name: x.name, text: x.text } : null;
        replyBar.innerHTML = '';
        if (!x) { replyBar.style.display = 'none'; return; }
        replyBar.style.display = '';
        var sp = el('span', null, 'Replying to ' + x.name + ': ' + (x.text || '').slice(0, 80));
        var cx = el('button', 'acx-ib', '\u2715'); cx.title = 'Cancel reply'; cx.onclick = function () { setReply(null); };
        replyBar.appendChild(sp); replyBar.appendChild(cx); if (ta) ta.focus();
      }
      function renderMsgs(c, keepScroll) {
        var near = msgsDiv.scrollHeight - msgsDiv.scrollTop - msgsDiv.clientHeight < 60;
        var prevH = msgsDiv.scrollHeight, prevTop = msgsDiv.scrollTop;
        msgsDiv.innerHTML = '';
        if (state.more) {
          var lb = el('button', 'acx-btn', 'Load earlier messages'); lb.style.alignSelf = 'center';
          lb.onclick = function () { lb.disabled = true; src.getConversation(convId, state.oldest).then(function (older) {
            var have = {}; state.msgs.forEach(function (m) { have[m.id] = 1; });
            state.msgs = older.messages.filter(function (m) { return !have[m.id]; }).concat(state.msgs);
            state.more = older.hasMore; state.oldest = older.oldest; state.sig = ''; renderMsgs(state.conv, 'prepend');
          }, function (e) { toast(e.message); lb.disabled = false; }); };
          msgsDiv.appendChild(lb);
        }
        if (c.pin) {
          var pb = el('div', 'acx-pin'); var pt = el('span', null, '\uD83D\uDCCC ' + c.pin.name + ': ' + (c.pin.text || '').slice(0, 120)); pb.appendChild(pt);
          var ub = el('button', 'acx-ib', '\u2715'); ub.title = 'Unpin'; ub.onclick = function () { src.pin(convId, null).then(function () { bump(); return load(false); }, function (e) { toast(e.message); }); };
          pb.appendChild(ub); msgsDiv.appendChild(pb);
        } else if (c.pinned) msgsDiv.appendChild(el('div', 'acx-pin', 'Pinned \u00B7 ' + c.pinned));
        if (c.deleteAt) {
          var db2 = el('div', 'acx-del'); var when = new Date(new Date(c.deleteAt).getTime() + 86400000);
          db2.appendChild(el('span', null, 'This chat will be deleted for everyone on ' + when.toLocaleString() + '.'));
          if (c.creator) { var cb2 = el('button', 'acx-btn', 'Cancel deletion'); cb2.onclick = function () { src.cancelDelete(convId).then(function () { bump(); return load(false); }, function (e) { toast(e.message); }); }; db2.appendChild(cb2); }
          msgsDiv.appendChild(db2);
        }
        if (c.card) {
          var cd = el('div', 'acx-card'); cd.appendChild(el('b', null, c.card.title));
          c.card.rows.forEach(function (r) { cd.appendChild(el('div', null, r)); });
          c.card.steps.forEach(function (s) { cd.appendChild(el('div', 'acx-st-' + s[0], (s[0] === 'done' ? '☑ ' : s[0] === 'failed' ? '☒ ' : '☐ ') + s[1] + (s[0] === 'failed' ? '  (didn’t work)' : ''))); });
          cd.appendChild(el('div', null, 'Cause: ' + c.card.cause)); msgsDiv.appendChild(cd);
        }
        var itemsBar = renderItemsBar(); if (itemsBar) msgsDiv.appendChild(itemsBar);
        state.msgs.forEach(function (x) {
          if (x.from === 'system') { msgsDiv.appendChild(el('div', 'acx-sys', x.text)); return; }
          if (x.type === 'privnote') {
            var nb2 = el('div', 'acx-b note'); nb2.appendChild(el('small', null, 'Private note \u00B7 only you can see this \u00B7 ' + x.time));
            linkify(nb2, x.text, false);
            var nd = el('span', 'acx-act'); nd.style.opacity = '.8'; var ndb = el('button', null, 'Delete'); ndb.onclick = function () { src.deleteNote(x.id).then(function () { bump(); return load(false); }, function (e) { toast(e.message); }); };
            nd.appendChild(ndb); nb2.firstChild.appendChild(nd); msgsDiv.appendChild(nb2); return;
          }
          var bub = el('div', 'acx-b ' + x.from + (x.removed ? ' removed' : '')); bub.setAttribute('data-mid', x.id);
          bub.appendChild(el('small', null, x.name + ' \u00B7 ' + x.time + (x.edited ? ' \u00B7 edited' : '') + (x.payload && x.payload.transcribed ? ' \u00B7 live transcript' : '') + (x.from === 'amit' && x.payload && x.payload.via_name ? ' \u00B7 answering through ' + x.payload.via_name + '\u2019s session' : '')));
          if (x.replyTo && !x.removed) {
            var qm = state.msgs.filter(function (m) { return m.id === x.replyTo; })[0];
            bub.appendChild(el('div', 'acx-quote', qm ? '\u21A9 ' + qm.name + ': ' + (qm.removed ? 'Message removed' : (qm.text || '').slice(0, 70)) : '\u21A9 an earlier message'));
          }
          var pl = x.payload || {};
          if (!x.removed && x.type === 'photo' && pl.path) {
            var im = el('img', 'acx-img'); im.alt = pl.name || 'photo'; im.title = (pl.name || 'photo') + ' \u2014 click to open';
            src.signedUrl(pl.path).then(function (u) { im.src = u; }, function () { im.alt = '(photo unavailable)'; });
            im.onclick = function () { src.signedUrl(pl.path).then(function (u) { window.open(u, '_blank', 'noopener'); }); };
            bub.appendChild(im);
          } else if (!x.removed && x.type === 'file' && pl.path) {
            var fb = el('button', 'acx-file', '\uD83D\uDCC4 ' + (pl.name || 'file') + ' \u00B7 ' + fmtSize(pl.size || 0));
            fb.title = 'Only open files from people you trust';
            fb.onclick = function () { src.signedUrl(pl.path, pl.name || 'file').then(function (u) { var a = document.createElement('a'); a.href = u; a.download = pl.name || 'file'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }, function (e) { toast(e.message); }); };
            bub.appendChild(fb);
          } else if (!x.removed && x.type === 'voice' && pl.path) {
            var au = el('audio'); au.controls = true; au.preload = 'none';
            src.signedUrl(pl.path).then(function (u) { au.src = u; }, function () {});
            bub.appendChild(au);
            bub.appendChild(el('div', 'acx-tr', pl.transcript ? '\u201C' + pl.transcript + '\u201D (automatic transcript, may have mistakes)' : '(no transcript)'));
          } else if (!x.removed && x.type === 'card' && pl.kind === 'fix') {
            renderFixCard(bub, x, pl);
          } else if (state.editing === x.id && x.type === 'text') {
            var eb = el('textarea', 'acx-editbox'); eb.value = x.text; bub.appendChild(eb);
            var er = el('div', 'acx-act'); er.style.opacity = '1';
            var sv = el('button', null, 'Save'), cn = el('button', null, 'Cancel');
            sv.onclick = function () { sv.disabled = true; src.editMessage(x.id, eb.value).then(function () { state.editing = null; bump(); return load(false); }, function (e) { toast(e.message); sv.disabled = false; }); };
            cn.onclick = function () { state.editing = null; state.sig = ''; load(false); };
            er.appendChild(sv); er.appendChild(cn); bub.appendChild(er);
            setTimeout(function () { eb.focus(); }, 0);
          } else {
            var mbody = el('span', 'acx-mbody'); linkify(mbody, x.text, x.removed); bub.appendChild(mbody);
            if (!x.removed && (x.text || '').length > 700) {
              var openL = !!state.expanded[x.id]; if (!openL) mbody.classList.add('acx-clip');
              var tgl = el('button', 'acx-moretxt', openL ? 'Show less' : 'Show more'); tgl.onclick = function () { state.expanded[x.id] = !openL; renderMsgs(state.conv, null); }; bub.appendChild(tgl);
            }
          }
          if (live && readable(x) && state.editing !== x.id) {
            var pbtn = el('button', 'acx-play', '\u25B6'); pbtn.title = 'Read this message aloud, then keep going';
            pbtn.onclick = function () { startReading(readableFrom(x.id)); };
            bub.firstChild.appendChild(pbtn);
          }
          if (live && !ro && !x.removed && state.editing !== x.id) {
            var ac = el('span', 'acx-act');
            var rp = el('button', null, 'Reply'); rp.onclick = function () { setReply(x); }; ac.appendChild(rp);
            if (x.type === 'text') { var pn = el('button', null, 'Pin'); pn.onclick = function () { src.pin(convId, x.id).then(function () { bump(); return load(false); }, function (e) { toast(e.message); }); }; ac.appendChild(pn); }
            if (x.from === 'me' && x.sender === src.me) {
            if (x.type === 'text') { var ed = el('button', null, 'Edit'); ed.onclick = function () { state.editing = x.id; state.sig = ''; renderMsgs(state.conv, null); }; ac.appendChild(ed); }
            var un = el('button', null, 'Unsend');
            un.onclick = function () {
              if (!confirm('Unsend this message?\n\nEveryone in the chat will see \u201CMessage removed\u201D.')) return;
              src.unsendMessage(x.id, pl.path).then(function () { bump(); return load(false); }, function (e) { toast(e.message); });
            };
            ac.appendChild(un);
            }
            bub.firstChild.appendChild(ac);
          }
          if (x.eye) { var ey = el('span', null, ' \uD83D\uDC41\uFE0F'); ey.title = 'Research'; bub.appendChild(ey); }
          if (x.waitingAmit) bub.appendChild(el('div', 'acx-wait', '\u23F3 Waiting for Amit \u2014 he answers when someone in this chat says J chat in VS Code or AmitCoder'));
          msgsDiv.appendChild(bub);
        });
        if (c.seen) msgsDiv.appendChild(el('div', 'acx-meta', c.seen));
        if (c.typing || state.typing) msgsDiv.appendChild(el('div', 'acx-typing', c.typing || state.typing));
        if (rd.on) { reapplyReading(); barDraw(); }
        if (keepScroll === 'prepend') msgsDiv.scrollTop = msgsDiv.scrollHeight - prevH + prevTop;
        else if (near || keepScroll === 'bottom') msgsDiv.scrollTop = msgsDiv.scrollHeight;
        else msgsDiv.scrollTop = prevTop;
      }
      function load(first) {
        return src.getConversation(convId).then(function (c) {
          if (destroyed) return;
          state.conv = c; state.items = c.items || []; if (amitHead) amitHead.style.display = (c.amitId && !c.amitIn) ? '' : 'none'; tt.textContent = c.title; ts.textContent = 'Members: ' + c.members; tl.textContent = timesText(c.times); updateSpk();
          if (first) { if (ro) wl.textContent = 'Read only: you are reading this as a guardian.'; else if (live) src.chatWatched(convId).then(function (w) { if (!destroyed && w) wl.textContent = '\uD83D\uDC6A A young person\u2019s guardian can read this chat.'; }); }
          if (amitBtn) { amitBtn.style.display = c.amitId ? '' : 'none'; amitBtn.title = c.amitIn ? 'Ask Amit (adds @Amit to your message)' : 'Invite Amit to this chat'; }
          // merge, keeping any older messages already loaded
          var have = {}; c.messages.forEach(function (m) { have[m.id] = 1; });
          var older = state.msgs.filter(function (m) { return !have[m.id] && c.messages.length && m.iso < c.messages[0].iso; });
          state.msgs = older.concat(c.messages);
          if (!older.length) { state.more = c.hasMore; state.oldest = c.oldest; }
          var sig = state.msgs.map(function (m) { return m.id + (m.edited ? 'e' : '') + (m.removed ? 'x' : '') + (m.waitingAmit ? 'w' : ''); }).join(',') + (c.amitIn ? '|A' : '') + '|' + c.seen + '|' + c.typing + '|' + (c.pin ? c.pin.id : '') + '|' + (c.deleteAt || '') + '|' + (c.items || []).map(function (i) { return i.id + i.state; }).join(',');
          if ((sig !== state.sig || first) && !state.editing) { if (!first) bump(); state.sig = sig; renderMsgs(c, first ? 'bottom' : null); }
          if (live && !ro && c.lastId && c.lastId !== c.myLastRead) { src.markRead(convId, c.lastId).then(function () { AmitChat.refreshUnread(); }); }
        }, function (e) { DBG.lastError = (e && e.message) || String(e); if (first) { msgsDiv.innerHTML = ''; errBox(msgsDiv, e); } });
      }
      function send() {
        if (!live || state.busy) return;
        var v = ta.value; if (!v.trim()) return;
        state.busy = true; sendBtn.disabled = true;
        src.send(convId, v, state.replyTo && state.replyTo.id, state.silent).then(function () { ta.value = ''; ta.style.height = ''; setReply(null); draft(''); state.silent = false; if (silentBtn) silentBtn.classList.remove('on'); bump(); return load(false); })
          .then(function () { msgsDiv.scrollTop = msgsDiv.scrollHeight; }, function (e) { toast(e.message); })
          .then(function () { state.busy = false; sendBtn.disabled = false; ta.focus(); });
      }
      var DKEY = 'acx-draft-' + convId;
      function draft(v) { try { if (v) localStorage.setItem(DKEY, v); else localStorage.removeItem(DKEY); } catch (e) {} }
      function setBusy(b) { [fileBtn, photoBtn, videoBtn, sendBtn].forEach(function (x) { if (x) x.disabled = b; }); }
      function sendFiles(files) {
        if (!live || !files || !files.length || state.busy) return;
        var list = Array.prototype.slice.call(files, 0, 5);
        state.busy = true; setBusy(true);
        var p = Promise.resolve();
        list.forEach(function (f) {
          p = p.then(function () { toast('Sending ' + (f.name || 'file') + '\u2026'); return src.sendAttachment(convId, f); })
               .catch(function (e) { toast((f.name || 'File') + ': ' + e.message); });
        });
        p.then(function () { bump(); return load(false); }).then(function () { msgsDiv.scrollTop = msgsDiv.scrollHeight; state.busy = false; setBusy(false); });
      }
      function amitClick() {
        var c = state.conv; if (!c) return;
        if (c.amitIn) { var at = ta.selectionStart || 0; if (!/@amit/i.test(ta.value)) { ta.value = '@Amit ' + ta.value; } ta.focus(); ta.dispatchEvent(new Event('input')); return; }
        if (!confirm('Invite Amit to this chat?\n\nEveryone here will see that Amit joined. Amit reads this chat only to answer when someone writes @Amit, and he replies when his session checks.')) return;
        amitBtn.disabled = true;
        src.summonAmit(convId).then(function () { toast('Amit joined this chat'); bump(); return load(false); }, function (e) { toast(e.message); })
          .then(function () { amitBtn.disabled = false; });
      }
      if (live && !ro) {
        fileBtn.onclick = function () { fileIn.value = ''; fileIn.click(); };
        photoBtn.onclick = function () { photoIn.value = ''; photoIn.click(); };
        fileIn.onchange = function () { sendFiles(fileIn.files); };
        photoIn.onchange = function () { sendFiles(photoIn.files); };
        amitBtn.onclick = amitClick;
        moreBtn.onclick = function () { comp.classList.toggle('more'); moreBtn.classList.toggle('on'); };
        fixBtn.onclick = function () { openFixForm(); };
        itemBtn.onclick = function () { openItemForm(); };
        silentBtn.onclick = function () { state.silent = !state.silent; silentBtn.classList.toggle('on', state.silent); toast(state.silent ? 'Your next message will be sent silently' : 'Silent sending is off'); };
        noteBtn.onclick = function () {
          var v = ta.value; if (!v.trim()) { toast('Type your note first, then press this.'); return; }
          noteBtn.disabled = true;
          src.addNote(convId, v).then(function () { ta.value = ''; ta.style.height = ''; draft(''); toast('Saved as a private note'); bump(); return load(false); }, function (e) { toast(e.message); })
            .then(function () { noteBtn.disabled = false; msgsDiv.scrollTop = msgsDiv.scrollHeight; });
        };
        videoBtn.onclick = function () {
          if (!confirm('Share a video-call link in this chat?\n\nThis makes a private meeting room on Jitsi (a free video service). Anyone in the chat can tap the link to join. Only share it with people already here.')) return;
          var r = ''; try { var a = new Uint8Array(12); crypto.getRandomValues(a); r = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } catch (e) { r = uid().replace(/-/g, ''); }
          var url = 'https://meet.jit.si/AmitChat-' + r;
          state.busy = true; src.send(convId, '\uD83C\uDFA5 Join the video call: ' + url).then(function () { bump(); return load(false); }, function (e) { toast(e.message); }).then(function () { state.busy = false; });
        };
        var rec = null;
        voiceBtn.onclick = function () {
          if (rec) { rec.stop(); return; }
          if (liveTx) { toast('Turn off the live transcript first. Both use the microphone.'); return; }
          if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Voice recording is not available in this browser.'); return; }
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            var chunks = [], started = Date.now(), transcript = '', sr = null, mr;
            try { mr = new MediaRecorder(stream); } catch (e) { stream.getTracks().forEach(function (t) { t.stop(); }); toast('Voice recording is not available in this browser.'); return; }
            var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SR) { try { sr = new SR(); sr.continuous = true; sr.interimResults = false; sr.lang = navigator.language || 'en-US';
              sr.onresult = function (e) { for (var i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) transcript += e.results[i][0].transcript + ' '; };
              sr.onend = function () { if (rec) { try { sr.start(); } catch (e) {} } }; sr.start(); } catch (e) { sr = null; } }
            mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
            var cap = setTimeout(function () { if (rec) rec.stop(); }, 120000);
            mr.onstop = function () {
              clearTimeout(cap); rec = null; voiceBtn.classList.remove('rec'); voiceBtn.textContent = '\uD83C\uDFA4';
              stream.getTracks().forEach(function (t) { t.stop(); }); if (sr) { try { sr.stop(); } catch (e) {} }
              var blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
              if (!blob.size || (Date.now() - started) < 700) { toast('That was too short to send.'); return; }
              state.busy = true; setBusy(true); toast('Sending your voice message\u2026');
              setTimeout(function () {
                src.sendVoice(convId, blob, (Date.now() - started) / 1000, transcript).then(function () { bump(); return load(false); }, function (e) { toast(e.message); })
                  .then(function () { msgsDiv.scrollTop = msgsDiv.scrollHeight; state.busy = false; setBusy(false); });
              }, 600);
            };
            rec = { stop: function () { try { mr.stop(); } catch (e) {} } };
            mr.start(); voiceBtn.classList.add('rec'); voiceBtn.textContent = '\u23F9'; voiceBtn.title = 'Stop and send';
          }, function () { toast('The microphone was not allowed.'); });
        };
        /* live transcript */
        var LIVE_WHY = { denied: 'The microphone was not allowed, so the live transcript stopped.' + (IS_IOS ? ' On an iPhone, open this in the Safari browser (live transcript does not run inside a home-screen app) and make sure Dictation is on in Settings > General > Keyboard.' : ''), nomic: 'No microphone was found, so the live transcript stopped.', network: 'The speech service could not be reached, so the live transcript stopped.', error: 'The live transcript could not keep running and stopped.', unsupported: 'Live transcript is not available in this browser.' };
        function paintLive(st) {
          if (st.lost) toast('A line could not be sent: ' + st.error);
          if (!st.on) {
            if (lbar) { lbar.remove(); lbar = null; }
            liveBtn.classList.remove('live'); liveBtn.title = 'Live transcript: keeps listening and turns what you say into text lines in this chat (no audio is kept). Press again to stop.';
            if (st.why && LIVE_WHY[st.why]) toast(LIVE_WHY[st.why]);
            return;
          }
          liveBtn.classList.add('live'); liveBtn.title = 'Live transcript is on. Press to stop.';
          if (!lbar) {
            lbar = el('div', 'acx-livebar'); lbar.appendChild(el('span', 'acx-dot'));
            lbar.appendChild(el('span', 'acx-lt', 'Live transcript is on. What you say becomes text lines in this chat. No audio is kept.'));
            var sb = el('button', 'acx-btn', 'Stop'); sb.onclick = function () { stopLiveTx('button'); }; lbar.appendChild(sb);
            lbar.appendChild(el('div', 'acx-li', ''));
            t.insertBefore(lbar, comp);
          }
          var li = lbar.querySelector('.acx-li'); if (li) li.textContent = st.interim ? '\u2026' + st.interim.slice(-90) : '';
          bump();
        }
        liveBtn.onclick = function () {
          if (liveTx && liveTx.tid === tid) { stopLiveTx('button'); return; }
          if (rec) { toast('Stop the voice recording first. Both use the microphone.'); return; }
          if (!liveTxSupported()) { toast('Live transcript is not available in this browser. It works in Chrome and Edge on a computer and in Chrome on Android, and may work in Safari on an iPhone (not inside a home-screen app).'); return; }
          startLiveTx({ owner: wide ? 'panel' : 'popup', convId: convId, tid: tid, onChange: paintLive, post: function (text, marker) { return src.sendTranscript(convId, text, marker).then(function () { bump(); return load(false); }); } });
        };
        typing = src.typingJoin ? src.typingJoin(convId, function (txt, keep) {
          if (!keep) state.typing = txt || '';
          var tl = msgsDiv.querySelector('.acx-typing');
          if (state.typing) { var near = msgsDiv.scrollHeight - msgsDiv.scrollTop - msgsDiv.clientHeight < 60; if (!tl) { tl = el('div', 'acx-typing'); msgsDiv.appendChild(tl); } tl.textContent = state.typing; if (near) msgsDiv.scrollTop = msgsDiv.scrollHeight; }
          else if (tl) tl.remove();
        }, function () { bump(); load(false); }) : null;
        t.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); t.classList.add('acx-drop'); } });
        t.addEventListener('dragleave', function () { t.classList.remove('acx-drop'); });
        t.addEventListener('drop', function (e) { t.classList.remove('acx-drop'); if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); sendFiles(e.dataTransfer.files); } });
        ta.addEventListener('paste', function (e) { var fs = e.clipboardData && e.clipboardData.files; if (fs && fs.length) { e.preventDefault(); sendFiles(fs); } });
        sendBtn.onclick = send;
        ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
        ta.addEventListener('input', function () { draft(ta.value); if (typing && state.myTyping !== false && ta.value.trim()) typing.ping(); ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 110) + 'px'; });
      }
      if (live && ta) { try { var dv = localStorage.getItem(DKEY); if (dv) { ta.value = dv; } } catch (e) {} }
      load(true);
      if (live && !ro && src.touchChat) src.touchChat(convId);
      if (live && !ro) src.getSettings(convId).then(function (st) { state.myTyping = st.typing; }, function () {});
      return { refresh: function () { return load(false); }, leave: function () { closeVoiceDialog(true); stopReading(); if (liveTx && liveTx.tid === tid) liveTx.stop('left'); if (typing) { typing.leave(); typing = null; } } };
    }

    /* ---- friends ---- */
    function buildFriends(target) {
      target.innerHTML = '';
      var head = el('div', 'acx-thead');
      if (!wide) { var b = el('button', 'acx-back', '←'); b.onclick = function () { show('list'); }; head.appendChild(b); }
      head.appendChild(el('div', 'acx-tt', 'Friends')); target.appendChild(head);
      var page = el('div', 'acx-page'); target.appendChild(page);
      function draw() {
        Promise.all([src.myCode(), src.friends(), src.profile().catch(function () { return {}; }), src.myGuardians().catch(function () { return []; })]).then(function (res) {
          if (destroyed) return;
          var code = res[0], f = res[1], me2 = res[2] || {}, gds = res[3] || [];
          page.innerHTML = '';
          var s1 = el('div', 'acx-sec'); s1.appendChild(el('h4', null, 'Your friend code'));
          s1.appendChild(el('div', 'acx-code', code));
          var link = location.origin + location.pathname.replace(/[^\/]*$/, '') + 'amit-hub.html?friend=' + code;
          var row = el('div', 'acx-line'); row.appendChild(el('div', 'acx-ts', 'Share this link or code. Whoever opens it can send you a friend request.'));
          var cp = el('button', 'acx-btn', 'Copy link');
          cp.onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { toast('Link copied'); }, function () { toast(link); }); };
          row.appendChild(cp); s1.appendChild(row); page.appendChild(s1);
          var s2 = el('div', 'acx-sec'); s2.appendChild(el('h4', null, 'Add a friend by code'));
          var line = el('div'); line.style.cssText = 'display:flex;gap:6px';
          var inp = el('input', 'acx-field'); inp.placeholder = 'Friend code'; inp.maxLength = 12;
          var go = el('button', 'acx-btn go', 'Send request');
          go.onclick = function () {
            var v = inp.value.trim(); if (!v) return; go.disabled = true;
            src.requestFriend(v).then(function () { toast('If that code is right, a request was sent.'); inp.value = ''; draw(); }, function (e) { toast(e.message); }).then(function () { go.disabled = false; });
          };
          line.appendChild(inp); line.appendChild(go); s2.appendChild(line); page.appendChild(s2);
          if (f.incoming.length) {
            var s3 = el('div', 'acx-sec'); s3.appendChild(el('h4', null, 'Requests for you'));
            f.incoming.forEach(function (p) {
              var l = el('div', 'acx-line'); l.appendChild(el('div', null, p.name));
              var bw = el('div'); bw.style.cssText = 'display:flex;gap:6px';
              var a = el('button', 'acx-btn go', 'Accept'), d = el('button', 'acx-btn', 'Decline');
              a.onclick = function () { src.respondFriend(p.rowId, true).then(function (st) { toast(st === 'awaiting_guardian' ? 'Waiting for their guardian to approve' : 'Friend added'); draw(); AmitChat.refreshUnread(); }, function (e) { toast(e.message); }); };
              d.onclick = function () { src.respondFriend(p.rowId, false).then(draw, function (e) { toast(e.message); }); };
              bw.appendChild(a); bw.appendChild(d); l.appendChild(bw); s3.appendChild(l);
            });
            page.appendChild(s3);
          }
          if (f.outgoing.length) {
            var s4 = el('div', 'acx-sec'); s4.appendChild(el('h4', null, 'Waiting for them'));
            f.outgoing.forEach(function (p) {
              var l = el('div', 'acx-line'); l.appendChild(el('div', null, p.name));
              var c2 = el('button', 'acx-btn', 'Cancel'); c2.onclick = function () { src.removeFriend(p.rowId).then(draw, function (e) { toast(e.message); }); };
              l.appendChild(c2); s4.appendChild(l);
            });
            page.appendChild(s4);
          }
          var s5 = el('div', 'acx-sec'); s5.appendChild(el('h4', null, 'Your friends (' + f.friends.length + ')'));
          if (!f.friends.length) s5.appendChild(el('div', 'acx-ts', 'No friends yet.'));
          f.friends.forEach(function (p) {
            var l = el('div', 'acx-line'); l.appendChild(el('div', null, p.name));
            var bw2 = el('div'); bw2.style.cssText = 'display:flex;gap:6px';
            var fr = el('button', 'acx-btn', 'Their friends'), box = el('div', 'acx-ts'); box.style.display = 'none';
            fr.onclick = function () {
              if (box.style.display !== 'none') { box.style.display = 'none'; return; }
              box.textContent = 'Loading\u2026'; box.style.display = '';
              src.friendsOf(p.userId).then(function (list) { box.textContent = list.length ? p.name + '\u2019s friends: ' + list.map(function (x) { return x.name; }).join(', ') : 'Nothing to show. They may keep their list private.'; }, function (e) { box.textContent = e.message; });
            };
            var rm = el('button', 'acx-btn', 'Remove');
            rm.onclick = function () { if (confirm('Remove ' + p.name + ' from your friends?')) src.removeFriend(p.rowId).then(draw, function (e) { toast(e.message); }); };
            bw2.appendChild(fr); bw2.appendChild(rm); l.appendChild(bw2); s5.appendChild(l); s5.appendChild(box);
          });
          page.appendChild(s5);
          if (f.awaiting && f.awaiting.length) {
            var sw = el('div', 'acx-sec'); sw.appendChild(el('h4', null, 'Waiting for a guardian\u2019s approval'));
            f.awaiting.forEach(function (p) { var l = el('div', 'acx-line'); l.appendChild(el('div', null, p.name)); var c3 = el('button', 'acx-btn', 'Cancel'); c3.onclick = function () { src.removeFriend(p.rowId).then(draw, function (e) { toast(e.message); }); }; l.appendChild(c3); sw.appendChild(l); });
            page.appendChild(sw);
          }
          if (me2.class === 'minor') {
            var sg = el('div', 'acx-sec'); sg.appendChild(el('h4', null, 'Your guardian'));
            sg.appendChild(el('div', 'acx-ts', 'You are under 18. An adult can only be your friend once a guardian is linked, has accepted, and Ryan has confirmed the link; your guardian then approves each adult friendship.'));
            gds.forEach(function (g) { var l = el('div', 'acx-line'); l.appendChild(el('div', null, g.display_name)); l.appendChild(el('div', 'acx-ts', g.status !== 'approved' ? 'waiting for them to accept' : g.confirmed ? 'confirmed' : 'accepted, waiting for Ryan to confirm')); sg.appendChild(l); });
            var gl = el('div'); gl.style.cssText = 'display:flex;gap:6px;margin-top:6px';
            var gi = el('input', 'acx-field'); gi.placeholder = 'Your guardian\u2019s friend code'; gi.maxLength = 12;
            var gb = el('button', 'acx-btn', 'Link guardian');
            gb.onclick = function () { var v = gi.value.trim(); if (!v) return; gb.disabled = true; src.requestGuardian(v).then(function () { toast('If that code is right, your guardian will see the request.'); gi.value = ''; draw(); }, function (e) { toast(e.message); }).then(function () { gb.disabled = false; }); };
            gl.appendChild(gi); gl.appendChild(gb); sg.appendChild(gl); page.appendChild(sg);
          }
          if (me2.birth_set !== false && me2.visibility) {
            var sv = el('div', 'acx-sec'); sv.appendChild(el('h4', null, 'Who can see my friends list'));
            var sel = el('select', 'acx-field');
            [['friends', 'Only my friends'], ['only_me', 'Only me'], ['everyone', 'Everyone signed in']].forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; if (me2.visibility === o[0]) op.selected = true; sel.appendChild(op); });
            sel.onchange = function () { sel.disabled = true; src.setVisibility(sel.value).then(function () { toast('Saved'); }, function (e) { toast(e.message); }).then(function () { sel.disabled = false; }); };
            sv.appendChild(sel); sv.appendChild(el('div', 'acx-ts', 'A young person\u2019s list is never shown to adults outside their approved circle.')); page.appendChild(sv);
          }
        }, function (e) { page.innerHTML = ''; errBox(page, e); });
      }
      draw();
    }

    /* ---- new chat ---- */
    function buildNew(target) {
      target.innerHTML = '';
      var head = el('div', 'acx-thead');
      if (!wide) { var b = el('button', 'acx-back', '←'); b.onclick = function () { show('list'); }; head.appendChild(b); }
      head.appendChild(el('div', 'acx-tt', 'New chat')); target.appendChild(head);
      var page = el('div', 'acx-page'); target.appendChild(page);
      var chosen = {}, byCode = [];
      src.friends().then(function (f) {
        if (destroyed) return;
        var s1 = el('div', 'acx-sec'); s1.appendChild(el('h4', null, 'Name (optional)'));
        var title = el('input', 'acx-field'); title.style.width = '100%'; title.placeholder = 'For example: Kitchen job'; s1.appendChild(title); page.appendChild(s1);
        var s2 = el('div', 'acx-sec'); s2.appendChild(el('h4', null, 'Type'));
        var kind = 'personal';
        [['personal', 'Personal'], ['group', 'Group'], ['work', 'Work']].forEach(function (k) {
          var lab = el('label'); lab.style.marginRight = '12px';
          var r = el('input'); r.type = 'radio'; r.name = 'acxkind' + Math.random(); r.checked = k[0] === 'personal';
          r.onchange = function () { kind = k[0]; };
          lab.appendChild(r); lab.appendChild(document.createTextNode(' ' + k[1])); s2.appendChild(lab);
        });
        // radios need a shared name
        var nm = 'acxkind' + Date.now(); Array.prototype.forEach.call(s2.querySelectorAll('input'), function (i) { i.name = nm; });
        page.appendChild(s2);
        var s3 = el('div', 'acx-sec'); s3.appendChild(el('h4', null, 'Add friends'));
        if (!f.friends.length) s3.appendChild(el('div', 'acx-ts', 'No friends yet. Add a friend first (Friends button), or add someone by code below.'));
        f.friends.forEach(function (p) {
          var lab = el('label'); lab.style.cssText = 'display:block;padding:3px 0';
          var c = el('input'); c.type = 'checkbox'; c.onchange = function () { if (c.checked) chosen[p.userId] = 1; else delete chosen[p.userId]; };
          lab.appendChild(c); lab.appendChild(document.createTextNode(' ' + p.name)); s3.appendChild(lab);
        });
        page.appendChild(s3);
        var s4 = el('div', 'acx-sec'); s4.appendChild(el('h4', null, 'Someone not on your list'));
        var line = el('div'); line.style.cssText = 'display:flex;gap:6px';
        var ci = el('input', 'acx-field'); ci.placeholder = 'Their friend code'; ci.maxLength = 12;
        var ab = el('button', 'acx-btn', 'Add');
        var added = el('div', 'acx-ts');
        ab.onclick = function () {
          var v = ci.value.trim(); if (!v) return;
          src.userByCode(v).then(function (uid) {
            if (uid) { chosen[uid] = 1; byCode.push(v.toUpperCase()); added.textContent = 'Added by code: ' + byCode.join(', ') + ' (they get an invitation to accept)'; ci.value = ''; }
            else toast('That code was not found.');
          }, function (e) { toast(e.message); });
        };
        line.appendChild(ci); line.appendChild(ab); s4.appendChild(line); s4.appendChild(added); page.appendChild(s4);
        src.acquaintances().then(function (list) {
          if (destroyed || !list.length) return;
          var sa = el('div', 'acx-sec'); sa.appendChild(el('h4', null, 'People from earlier chats'));
          list.forEach(function (p) {
            var lab = el('label'); lab.style.cssText = 'display:block;padding:3px 0';
            var c = el('input'); c.type = 'checkbox'; c.onchange = function () { if (c.checked) chosen[p.userId] = 1; else delete chosen[p.userId]; };
            lab.appendChild(c); lab.appendChild(document.createTextNode(' ' + p.name + ' (they get an invitation to accept)')); sa.appendChild(lab);
          });
          page.insertBefore(sa, s4);
        }, function () {});
        var create = el('button', 'acx-btn go', 'Create chat');
        create.onclick = function () {
          create.disabled = true;
          src.createConversation(title.value, kind, Object.keys(chosen)).then(function (id) { toast('Chat created'); show('thread', id); },
            function (e) { toast(e.message); create.disabled = false; });
        };
        page.appendChild(create);
      }, function (e) { errBox(page, e); });
    }

    /* ---- navigation ---- */
    function show(view, arg) {
      if (thread && thread.leave) thread.leave();
      cur = { view: view, arg: arg || null }; thread = null;
      if (wide) {
        if (left) renderListInto(left);
        if (view === 'thread') thread = buildThread(right, arg);
        else if (view === 'friends') buildFriends(right);
        else if (view === 'new') buildNew(right);
        else if (view === 'forme') buildForMe(right);
        else if (view === 'kids') buildKids(right);
        else if (view === 'kidthread') thread = buildThread(right, arg, true);
        else { right.innerHTML = ''; right.appendChild(el('div', 'acx-empty', 'Choose a conversation on the left.')); }
      } else {
        if (view === 'thread') thread = buildThread(main, arg);
        else if (view === 'friends') buildFriends(main);
        else if (view === 'new') buildNew(main);
        else if (view === 'forme') buildForMe(main);
        else if (view === 'kids') buildKids(main);
        else if (view === 'kidthread') thread = buildThread(main, arg, true);
        else renderListInto(main);
      }
    }
    function recheckGate() {
      if (rechecking || destroyed || !gate || !prof || !recheckFn) return;
      rechecking = true; recheckFn(function () { rechecking = false; }, true);
    }
    function refreshAll() {
      if (destroyed) return;
      if (gate) { recheckGate(); return; }
      if (wide) renderListInto(left); else if (cur.view === 'list') renderListInto(main);
      if (thread) thread.refresh();
    }

    if (!live) {
      // sample mode: same layout, read-only
      if (wide) { loadList().then(function (res) { if (!destroyed) { drawList(left, res[0], []); show('thread', res[0][0] && res[0][0].id); } }); }
      else show('list');
    } else {
      var startLive = function () {
        gate = false;
        if (wide) { renderListInto(left); show('list'); } else show('list');
        if (pendingOpen) { var po = pendingOpen; pendingOpen = null; show('thread', po); }
        if (!AmitChat._tzSent && src.setTimezone) { AmitChat._tzSent = true; try { src.setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone).then(function () {}, function () {}); } catch (e) {} }
      };
      var recheck = function (done, quiet) {
        (src.claimInvite ? src.claimInvite() : Promise.resolve()).then(function () { return src.profile(); }).then(function (np) {
          if (destroyed) { if (done) done(); return; } prof = np; var w2 = gateReason(np);
          if (!w2) { gateWhy = null; gate = false; startLive(); }
          else { if (w2 !== gateWhy) { gateWhy = w2; buildGate(area, w2, function (d2) { recheck(d2, false); }); } else if (!quiet) toast('Still waiting. Save it in About Me, then try again.'); }
          if (done) done();
        }, function (e) { if (!quiet) toast(e.message); if (done) done(); });
      };
      recheckFn = recheck;
      (src.claimInvite ? src.claimInvite() : Promise.resolve()).then(function () { return src.profile(); }).then(function (p) {
        if (destroyed) return; prof = p; var why = gateReason(p);
        if (why) { gate = true; gateWhy = why; if (left) left.appendChild(el('div', 'acx-empty', 'Chat is waiting for one more step.')); buildGate(area, why, function (d2) { recheck(d2, false); }); }
        else startLive();
      }, function () { prof = { birth_set: true, legacy: true }; startLive(); });   // the safeguarding step is not installed yet: carry on as before
    }
    /* SMART REFRESH: nothing runs unless this view is on screen AND the page is in front.
       While on screen it checks every 3 s after activity, then every 10 s, then every 30 s once quiet.
       Any new message, send, or opening resets it to fast. Closing or hiding the view stops it completely. */
    function nextDelay() { return AmitChat.interval(Date.now() - lastActive); }
    function loop() {
      loopT = null;
      if (destroyed || !inSight || document.hidden) return;
      DBG.polls++;
      refreshAll();
      loopT = setTimeout(loop, nextDelay());
    }
    function startLoop() { if (!live || loopT || destroyed || !inSight || document.hidden) return; loopT = setTimeout(loop, nextDelay()); }
    function stopLoop() { if (loopT) { clearTimeout(loopT); loopT = null; } }
    function bump() { lastActive = Date.now(); if (loopT) { stopLoop(); startLoop(); } }
    var io = null;
    if (live && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        inSight = entries.some(function (e) { return e.isIntersecting; });
        if (inSight && !document.hidden) { lastActive = Date.now(); refreshAll(); stopLoop(); startLoop(); }
        else stopLoop();
      });
      io.observe(root);
    }

    return {
      destroy: function () { destroyed = true; if (thread && thread.leave) thread.leave(); stopLoop(); if (io) io.disconnect(); },
      refresh: refreshAll,
      current: function () { return { view: cur.view, arg: cur.arg }; },
      open: function (v, a) { if (destroyed) return; if (gate) { if (v === 'thread') pendingOpen = a; return; } show(v, a); },
      recheck: recheckGate,
      resume: function () { if (inSight && !document.hidden) { lastActive = Date.now(); refreshAll(); stopLoop(); startLoop(); } },
      pause: stopLoop
    };
  }

  /* ════════ POPUP + PANEL MOUNTS ════════ */
  var pop = null, popHolder = null, popView = null, panelTargets = [];
  function anchorEl() { try { return document.querySelector(AmitChat.anchor || '#rail-chat'); } catch (e) { return null; } }
  /* open at the top right, beside the page's chat icon (falls back to the old corner when there is no icon, and to full screen on a phone) */
  function placePopup() {
    if (!pop) return;
    var a = anchorEl(), r = a && a.getBoundingClientRect();
    if (!a || !r || !r.width || window.innerWidth <= 700) { pop.classList.remove('anchored'); return; }
    var top = Math.max(8, Math.round(r.top - 8)), right = Math.max(8, Math.round(window.innerWidth - r.left + 10));
    pop.style.setProperty('--acx-top', top + 'px'); pop.style.setProperty('--acx-right', right + 'px');
    pop.style.setProperty('--acx-h', Math.max(260, Math.min(640, window.innerHeight - top - 16)) + 'px');
    pop.classList.add('anchored');
  }
  function markAnchor(on) { var a = anchorEl(); if (a) a.classList.toggle('acx-anchor-on', !!on); }
  function closePopup() { stopLiveTx('closed', 'popup'); if (pop) pop.classList.remove('open'); markAnchor(false); if (AmitChat.stopReading) AmitChat.stopReading(); }
  window.addEventListener('resize', function () { if (pop && pop.classList.contains('open')) placePopup(); });
  /* hover labels for everything in the chat: above the button, roomier than the browser's own (which sits under the pointer and hides the words) */
  var tipEl = null, tipT = null, tipFor = null;
  function hideTip() { if (tipT) { clearTimeout(tipT); tipT = null; } tipFor = null; if (tipEl) tipEl.style.display = 'none'; }
  function tipTarget(n) { for (; n && n !== document.body && n.nodeType === 1; n = n.parentNode) { if ((n.hasAttribute('title') || n.hasAttribute('data-acxt')) && n.closest('.acx-pop,.acx-panel')) return n; } return null; }
  function showTip(t) {
    var txt = t.getAttribute('data-acxt'); if (!txt || !document.body.contains(t)) return;
    if (!tipEl) { tipEl = el('div', 'acx-tip'); document.body.appendChild(tipEl); }
    tipEl.textContent = txt; tipEl.style.display = 'block'; tipEl.style.left = '0px'; tipEl.style.top = '0px';
    var r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var left = Math.min(Math.max(8, Math.round(r.left + r.width / 2 - w / 2)), Math.max(8, window.innerWidth - w - 8));
    var top = Math.round(r.top - h - 12); if (top < 8) top = Math.round(r.bottom + 12);
    tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
  }
  document.addEventListener('mouseover', function (e) {
    var t = tipTarget(e.target); if (t === tipFor) return;
    hideTip(); if (!t) return;
    if (t.hasAttribute('title')) { var v = t.getAttribute('title'); t.removeAttribute('title'); if (v) t.setAttribute('data-acxt', v); }
    if (!t.getAttribute('data-acxt')) return;
    tipFor = t; tipT = setTimeout(function () { tipT = null; showTip(t); }, 250);
  });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) hideTip(); });
  ['mousedown', 'scroll', 'keydown', 'wheel'].forEach(function (n) { document.addEventListener(n, hideTip, true); });
  function popupHead() {
    var head = el('div', 'acx-head');
    head.appendChild(el('div', 'acx-title', 'AmitChat'));
    head.appendChild(el('div', 'acx-ver', AmitChat.source.label + ' · ' + VERSION));
    var mx = el('button', 'acx-max', '\u2922'); mx.title = 'Open full screen (Communications > Chats), on this chat';
    mx.onclick = function (e) {
      e.stopPropagation();
      var c = popView && popView.current ? popView.current() : null, id = c && c.view === 'thread' ? c.arg : null;
      closePopup();
      if (AmitChat.onMaximize) { try { AmitChat.onMaximize(id); } catch (er) {} }
    };
    head.appendChild(mx);
    var x = el('button', 'acx-x', '✕'); x.title = 'Close';
    x.onclick = function (e) { e.stopPropagation(); closePopup(); };
    head.appendChild(x);
    return head;
  }
  function fillPopup() {
    pop.innerHTML = '';
    pop.appendChild(popupHead());
    var body = el('div', 'acx-body');
    if (!AmitChat.source.live) body.appendChild(el('div', 'acx-sample', 'SAMPLE — made-up chats, nothing is saved'));
    popHolder = el('div'); popHolder.style.cssText = 'flex:1;min-height:0;display:flex';
    body.appendChild(popHolder); pop.appendChild(body);
    if (popView) popView.destroy();
    popView = createView(popHolder, false);
  }
  function buildPopup() {
    if (pop) return pop;
    injectCss();
    pop = el('div', 'acx-pop'); pop.id = 'acxPopup';
    document.body.appendChild(pop);
    fillPopup();
    return pop;
  }
  function renderPanel(target, narrow) {
    var wrap = el('div', 'acx-panel');
    if (!AmitChat.source.live) wrap.appendChild(el('div', 'acx-sample', 'SAMPLE — made-up chats, nothing is saved. This is how your conversations will look.'));
    var holder = el('div'); holder.style.cssText = 'flex:1;min-height:0;display:flex';
    wrap.appendChild(holder); target.innerHTML = ''; target.appendChild(wrap);
    return createView(holder, !narrow);
  }
  function rerenderAll() {
    DBG.rerenders++;
    if (pop) fillPopup();
    panelTargets.forEach(function (p) { if (p.view) p.view.destroy(); p.view = renderPanel(p.el, p.narrow); });
  }

  /* ════════ BADGE POLLER + PUBLIC API ════════ */
  var lastUnreadAt = 0;

  var AmitChat = {
    version: VERSION,
    stopReading: function () { if (AmitChat._stopReader) AmitChat._stopReader(); },
    /* the page calls this right after something changed that the chat is waiting for (the Hub: a birth date saved in About Me) */
    recheck: function () { if (popView && popView.recheck) popView.recheck(); panelTargets.forEach(function (p) { if (p.view && p.view.recheck) p.view.recheck(); }); },
    voiceProvider: null,      /* set by the page: returns { voice, rate, pitch, volume, pauseScale } (the Hub reads it from About Me) */
    voiceSaver: null,         /* set by the page: saves { voice_name, voice_rate, voice_pitch, voice_volume, voice_pause_scale } to the person's profile (the Hub: the About Me contact row) */
    onSpeak: null,            /* set by the page: called with true/false when reading starts/stops */
    onMaximize: null,         /* set by the page: opens the full-screen chat (the Hub: Communications > Chats), then calls openInPanel(chatId) */
    openInPanel: function (id) { panelTargets.forEach(function (p) { if (p.view && p.view.open) p.view.open(id ? 'thread' : 'list', id || null); }); },
    onNeedBirthDate: null,    /* set by the page: opens the place where the birth date is entered (the Hub opens About Me) */
    iconUrl: SCRIPT_BASE + 'amit_icon.ico',
    anchor: '#rail-chat',     /* the page's chat icon: the box opens beside it and closes back into it */
    source: sampleSource,
    live: null,
    preview: /[?&]chatpreview=1/.test(location.search),
    useSource: function (s) { AmitChat.source = s; },
    toast: toast,
    debug: DBG,
    togglePopup: function () {
      var p = buildPopup();
      if (p.classList.contains('open')) closePopup();
      else { placePopup(); p.classList.add('open'); p.classList.remove('min'); markAnchor(true); if (popView && AmitChat.live) { popView.resume(); AmitChat.refreshUnread(); } }
    },
    /* a single-column chat for a phone page (AmitMobile): the list, then a chat with a back arrow */
    mountInline: function (target) {
      if (!target) return;
      injectCss();
      var rec = panelTargets.filter(function (p) { return p.el === target; })[0];
      if (!rec) { rec = { el: target, view: null, narrow: true }; panelTargets.push(rec); }
      rec.narrow = true;
      if (rec.view) rec.view.destroy();
      rec.view = renderPanel(target, true);
    },
    liveTxConfig: { gapMs: 2000, softCapMs: 30000 },
    stopLiveTranscript: function () { stopLiveTx('stopped'); },
    mountPanel: function (target) {
      if (!target) return;
      injectCss();
      var rec = panelTargets.filter(function (p) { return p.el === target; })[0];
      if (!rec) { rec = { el: target, view: null }; panelTargets.push(rec); }
      if (rec.view) rec.view.destroy();
      rec.view = renderPanel(target);
    },
    connect: function (db, userId) {
      if (!db || !userId || AmitChat.preview) return;
      if (AmitChat.live && AmitChat.live.me === userId) return;
      DBG.connects++;
      AmitChat.live = { me: userId, db: db };
      AmitChat.useSource(makeLiveSource(db, userId));
      rerenderAll(); AmitChat.refreshUnread(); AmitChat.handleFriendLink();
    },
    disconnect: function () {
      if (!AmitChat.live) return;
      DBG.disconnects++;
      AmitChat.live = null; AmitChat.useSource(sampleSource);
      if (pop) closePopup();
      rerenderAll(); AmitChat.setUnread(0);
    },
    /* a link like  amit-hub.html?friend=ABCD1234  asks the signed-in person to confirm a friend request */
    handleFriendLink: function () {
      var m = /[?&]friend=([A-Za-z0-9]{4,12})/.exec(location.search);
      var code = m ? m[1] : null;
      try { if (code) localStorage.setItem('amit_pending_friend_code', code); else code = localStorage.getItem('amit_pending_friend_code'); } catch (e) {}
      if (!code) return;
      try { if (m && history.replaceState) history.replaceState(null, '', location.pathname + location.search.replace(/([?&])friend=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {}
      if (!AmitChat.live || !AmitChat.source.live) return;   // wait until signed in; the code stays saved
      try { localStorage.removeItem('amit_pending_friend_code'); } catch (e) {}
      if (confirm('Send a friend request to the person who shared this link?')) {
        AmitChat.source.requestFriend(code).then(function () { toast('Friend request sent (if the code is right).'); }, function (e) { toast(e.message); });
      }
    },
    setUnread: function (n) {
      var b = document.getElementById('rail-chat-badge');
      if (b) { b.textContent = n; b.style.display = n > 0 ? '' : 'none'; }
      var tab = document.getElementById('ch-tab-btn-comm-chats');
      if (tab) tab.textContent = n > 0 ? 'Chats (' + n + ')' : 'Chats';
      var top = document.getElementById('commUnreadTop');
      if (top) { top.textContent = n > 0 ? 'Unread chats ' + n : ''; top.style.display = n > 0 ? '' : 'none'; }
    },
    /* how long to wait before the next check, given how long the chat has been quiet */
    interval: function (quietMs) { return quietMs < 120000 ? 3000 : quietMs < 600000 ? 10000 : 30000; },
    /* the page calls this when the person moves to another page inside Amit; checks the count at most every 30 s */
    onNavigate: function () {
      if (!AmitChat.live || document.hidden) return;
      if (Date.now() - lastUnreadAt >= NAV_THROTTLE_MS) AmitChat.refreshUnread();
    },
    refreshUnread: function () {
      if (!AmitChat.source.live && !AmitChat.preview) { AmitChat.setUnread(0); return; }
      lastUnreadAt = Date.now(); DBG.unreadChecks++;
      AmitChat.source.unreadChats().then(function (n) { DBG.lastUnread = n; AmitChat.setUnread(n); }, function (e) { DBG.lastError = 'unread: ' + ((e && e.message) || e); });
    }
  };
  /* when the person comes back to this tab, catch up right away instead of waiting for the next tick */
  document.addEventListener('visibilitychange', function () {
    if (!AmitChat.live) return;
    if (document.hidden) { if (popView) popView.pause(); panelTargets.forEach(function (p) { if (p.view) p.view.pause(); }); return; }
    AmitChat.refreshUnread();                     // back in Amit: update the number
    if (popView) popView.resume();                // and catch up any open chat
    panelTargets.forEach(function (p) { if (p.view) p.view.resume(); });
  });
  window.AmitChat = AmitChat;
})();

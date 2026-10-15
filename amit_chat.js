/* ════════════════════════════════════════════════════════════════
   amit_chat.js — the ONE AmitChat engine, shared by every Amit page.
   v0.02 — 2026-10-14. LIVE mode added (real Supabase data). Sample mode stays
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

  var VERSION = 'v0.02';
  var POLL_MS = 5000, BADGE_MS = 15000, PAGE = 50;

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
      if (m.message_type === 'photo') return '[photo]';
      if (m.message_type === 'file') return '[file]';
      if (m.message_type === 'voice') return '[voice message]';
      return m.body || '';
    }
    var src = {
      live: true, label: 'Live', me: me, nameOf: nameOf,

      listConversations: function () {
        return db.from('cha_participants')
          .select('conversation_id,last_read_message_id,cha_conversations(id,title,kind,created_by,created_at)')
          .eq('user_id', me).eq('status', 'accepted').then(function (p) {
            fail(p);
            var rows = p.data || [];
            if (!rows.length) return [];
            var ids = rows.map(function (r) { return r.conversation_id; });
            return Promise.all([
              db.from('cha_participants').select('conversation_id,user_id,status').in('conversation_id', ids).in('status', ['accepted', 'invited']),
              db.from('cha_messages').select('id,conversation_id,sender_id,body,message_type,created_at,deleted_at')
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
                    return m.sender_id !== me && !m.deleted_at &&
                      (r.last_read_message_id ? (readAt && m.created_at > readAt) : true);
                  }).length;
                  var others = parts.filter(function (x) { return x.conversation_id === r.conversation_id && x.user_id !== me; }).map(function (x) { return nameOf(x.user_id); });
                  return {
                    id: r.conversation_id,
                    title: c.title || others.join(', ') || 'Chat',
                    members: ['You'].concat(others).join(', '),
                    unread: unread, last: snippet(last), time: last ? fmtTime(last.created_at) : fmtTime(c.created_at),
                    sort: last ? last.created_at : (c.created_at || '')
                  };
                });
                out.sort(function (a, b) { return a.sort < b.sort ? 1 : -1; });
                return out;
              });
            });
          });
      },

      getConversation: function (id, before) {
        var q = db.from('cha_messages').select('id,sender_id,body,message_type,reply_to,created_at,edited_at,deleted_at')
          .eq('conversation_id', id).order('created_at', { ascending: false }).limit(PAGE);
        if (before) q = q.lt('created_at', before);
        return Promise.all([
          q,
          db.from('cha_participants').select('user_id,status,last_read_message_id,show_receipts').eq('conversation_id', id),
          db.from('cha_conversations').select('id,title,kind,created_by').eq('id', id).maybeSingle()
        ]).then(function (res) {
          fail(res[0]); fail(res[1]); fail(res[2]);
          var rows = (res[0].data || []).slice().reverse();
          var parts = res[1].data || [], conv = res[2].data || {};
          return loadNames(parts.map(function (x) { return x.user_id; }).concat(rows.map(function (x) { return x.sender_id; }))).then(function () {
            var others = parts.filter(function (x) { return x.user_id !== me && x.status === 'accepted'; });
            var msgs = rows.map(function (m) {
              return { id: m.id, from: m.sender_id === me ? 'me' : 'them', name: nameOf(m.sender_id), time: fmtTime(m.created_at), iso: m.created_at,
                       text: m.deleted_at ? 'Message removed' : (m.body || (m.message_type !== 'text' ? '[' + m.message_type + ']' : '')),
                       removed: !!m.deleted_at, edited: !!m.edited_at, sender: m.sender_id };
            });
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
            return {
              id: id, title: conv.title || others.map(function (o) { return nameOf(o.user_id); }).join(', ') || 'Chat',
              members: ['You'].concat(others.map(function (o) { return nameOf(o.user_id); })).join(', '),
              messages: msgs, seen: seen, typing: '', hasMore: (res[0].data || []).length === PAGE,
              oldest: rows.length ? rows[0].created_at : null, lastId: lastRow ? lastRow.id : null,
              myLastRead: myParticipant.last_read_message_id || null
            };
          });
        });
      },

      markRead: function (id, lastId) {
        if (!lastId) return Promise.resolve();
        return db.from('cha_participants').update({ last_read_message_id: lastId }).eq('conversation_id', id).eq('user_id', me).then(function (r) { return r; });
      },
      send: function (id, text) {
        var t = (text || '').trim();
        if (!t) return Promise.reject(new Error('Type a message first.'));
        return db.from('cha_messages').insert({ conversation_id: id, sender_id: me, body: t }).select('id').then(fail);
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
            var out = { friends: [], incoming: [], outgoing: [] };
            rows.forEach(function (x) {
              var other = x.requester === me ? x.addressee : x.requester;
              var item = { rowId: x.id, userId: other, name: nameOf(other) };
              if (x.status === 'accepted') out.friends.push(item);
              else if (x.status === 'pending' && x.addressee === me) out.incoming.push(item);
              else if (x.status === 'pending' && x.requester === me) out.outgoing.push(item);
            });
            return out;
          });
        });
      },
      respondFriend: function (rowId, accept) {
        if (accept) return db.from('cha_friends').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', rowId).then(fail);
        return db.from('cha_friends').delete().eq('id', rowId).then(fail);
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
    '.acx-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(var(--amit-accent-rgb,201,168,76),.12);border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);cursor:pointer;flex-shrink:0}',
    '.acx-title{flex:1;font-family:var(--amit-font-heading,"Cinzel",serif);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--amit-accent-bright,#e8c56a);font-weight:700}',
    '.acx-ver{font-size:10px;color:var(--amit-dim,rgba(240,232,208,.42));letter-spacing:.05em}',
    '.acx-x{background:none;border:none;color:var(--amit-muted,rgba(240,232,208,.78));font-size:16px;cursor:pointer;padding:0 4px}',
    '.acx-body{flex:1;min-height:0;display:flex;flex-direction:column}',
    '.acx-root{flex:1;min-height:0;min-width:0;display:flex;width:100%}',
    '.acx-left{width:270px;flex-shrink:0;border-right:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);display:flex;flex-direction:column;min-height:0}',
    '.acx-right,.acx-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}',
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
    '@media (max-width:700px){.acx-pop{right:0;left:0;width:auto;height:100%;max-height:none;border-radius:0}.acx-pop.min{height:44px;top:auto}.acx-left{width:100%}.acx-b{max-width:92%}}'
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
  var views = [];
  /* diagnostics, readable in the browser console as AmitChat.debug */
  var DBG = { ticks: 0, visibleTicks: 0, badgeTicks: 0, lastUnread: null, lastError: null, rerenders: 0, connects: 0, disconnects: 0 };
  function createView(container, wide) {
    var src = AmitChat.source, live = !!src.live;
    var root = el('div', 'acx-root'), left = null, right = null, main = null;
    container.innerHTML = ''; container.appendChild(root);
    if (wide) { left = el('div', 'acx-left'); right = el('div', 'acx-right'); root.appendChild(left); root.appendChild(right); }
    else { main = el('div', 'acx-main'); root.appendChild(main); }
    var area = wide ? right : main;
    var cur = { view: 'list', arg: null }, thread = null, destroyed = false, listCache = null, timer = null;

    function visible() { return !destroyed && root.offsetParent !== null && !document.hidden; }
    function errBox(parent, e) { parent.appendChild(el('div', 'acx-err', (e && e.message) || 'Something went wrong. Try again.')); }

    /* ---- list ---- */
    function drawList(target, list, invites) {
      target.innerHTML = '';
      var tool = el('div', 'acx-tool');
      if (live) {
        var nb = el('button', 'acx-btn go', '+ New chat'); nb.onclick = function () { show('new'); };
        var fb = el('button', 'acx-btn', 'Friends'); fb.onclick = function () { show('friends'); };
        tool.appendChild(nb); tool.appendChild(fb);
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
        t.appendChild(el('div', 'acx-rn', c.title)); t.appendChild(el('div', 'acx-rl', c.last));
        r.appendChild(t);
        var rm = el('div', 'acx-rm', c.time);
        if (c.unread) { rm.appendChild(document.createElement('br')); rm.appendChild(el('span', 'acx-pill', c.unread)); }
        r.appendChild(rm);
        r.onclick = function () { show('thread', c.id); };
        l.appendChild(r);
      });
      target.appendChild(l);
    }
    function loadList() {
      return Promise.all([src.listConversations(), live ? src.invites().catch(function () { return []; }) : Promise.resolve([])]).then(function (res) {
        listCache = res; return res;
      });
    }
    function renderListInto(target) {
      return loadList().then(function (res) { if (!destroyed) drawList(target, res[0], res[1]); }, function (e) { target.innerHTML = ''; errBox(target, e); });
    }

    /* ---- thread ---- */
    function buildThread(target, convId) {
      target.innerHTML = '';
      var t = el('div', 'acx-thread'); target.appendChild(t);
      var head = el('div', 'acx-thead');
      if (!wide) { var b = el('button', 'acx-back', '←'); b.onclick = function () { show('list'); }; head.appendChild(b); }
      var hw = el('div'); var tt = el('div', 'acx-tt', ''), ts = el('div', 'acx-ts', '');
      hw.appendChild(tt); hw.appendChild(ts); head.appendChild(hw); t.appendChild(head);
      var msgsDiv = el('div', 'acx-msgs'); t.appendChild(msgsDiv);
      var comp = el('div', 'acx-comp'); t.appendChild(comp);
      var ta = null, sendBtn = null;
      if (live) {
        ta = el('textarea'); ta.rows = 1; ta.placeholder = 'Type a message…';
        sendBtn = el('button', 'acx-btn go', 'Send');
        comp.appendChild(ta); comp.appendChild(sendBtn);
      } else {
        comp.appendChild(el('span', 'acx-ic', '＋')); comp.appendChild(el('span', 'acx-ic', '📷')); comp.appendChild(el('span', 'acx-ic', '🎤'));
        comp.appendChild(el('div', 'acx-stub', 'Preview only — not connected'));
      }
      var state = { msgs: [], sig: '', more: false, oldest: null, conv: null, busy: false };

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
        if (c.pinned) msgsDiv.appendChild(el('div', 'acx-pin', 'Pinned · ' + c.pinned));
        if (c.card) {
          var cd = el('div', 'acx-card'); cd.appendChild(el('b', null, c.card.title));
          c.card.rows.forEach(function (r) { cd.appendChild(el('div', null, r)); });
          c.card.steps.forEach(function (s) { cd.appendChild(el('div', 'acx-st-' + s[0], (s[0] === 'done' ? '☑ ' : s[0] === 'failed' ? '☒ ' : '☐ ') + s[1] + (s[0] === 'failed' ? '  (didn’t work)' : ''))); });
          cd.appendChild(el('div', null, 'Cause: ' + c.card.cause)); msgsDiv.appendChild(cd);
        }
        state.msgs.forEach(function (x) {
          var bub = el('div', 'acx-b ' + x.from + (x.removed ? ' removed' : ''));
          bub.appendChild(el('small', null, x.name + ' · ' + x.time + (x.edited ? ' · edited' : '')));
          bub.appendChild(document.createTextNode(x.text));
          if (x.eye) { var ey = el('span', null, ' 👁️'); ey.title = 'Research'; bub.appendChild(ey); }
          msgsDiv.appendChild(bub);
        });
        if (c.seen) msgsDiv.appendChild(el('div', 'acx-meta', c.seen));
        if (c.typing) msgsDiv.appendChild(el('div', 'acx-typing', c.typing));
        if (keepScroll === 'prepend') msgsDiv.scrollTop = msgsDiv.scrollHeight - prevH + prevTop;
        else if (near || keepScroll === 'bottom') msgsDiv.scrollTop = msgsDiv.scrollHeight;
        else msgsDiv.scrollTop = prevTop;
      }
      function load(first) {
        return src.getConversation(convId).then(function (c) {
          if (destroyed) return;
          state.conv = c; tt.textContent = c.title; ts.textContent = 'Members: ' + c.members;
          // merge, keeping any older messages already loaded
          var have = {}; c.messages.forEach(function (m) { have[m.id] = 1; });
          var older = state.msgs.filter(function (m) { return !have[m.id] && c.messages.length && m.iso < c.messages[0].iso; });
          state.msgs = older.concat(c.messages);
          if (!older.length) { state.more = c.hasMore; state.oldest = c.oldest; }
          var sig = state.msgs.map(function (m) { return m.id + (m.edited ? 'e' : '') + (m.removed ? 'x' : ''); }).join(',') + '|' + c.seen + '|' + c.typing;
          if (sig !== state.sig || first) { state.sig = sig; renderMsgs(c, first ? 'bottom' : null); }
          if (live && c.lastId && c.lastId !== c.myLastRead) { src.markRead(convId, c.lastId).then(function () { AmitChat.refreshUnread(); }); }
        }, function (e) { DBG.lastError = (e && e.message) || String(e); if (first) { msgsDiv.innerHTML = ''; errBox(msgsDiv, e); } });
      }
      function send() {
        if (!live || state.busy) return;
        var v = ta.value; if (!v.trim()) return;
        state.busy = true; sendBtn.disabled = true;
        src.send(convId, v).then(function () { ta.value = ''; ta.style.height = ''; return load(false); })
          .then(function () { msgsDiv.scrollTop = msgsDiv.scrollHeight; }, function (e) { toast(e.message); })
          .then(function () { state.busy = false; sendBtn.disabled = false; ta.focus(); });
      }
      if (live) {
        sendBtn.onclick = send;
        ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
        ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 110) + 'px'; });
      }
      load(true);
      return { refresh: function () { return load(false); } };
    }

    /* ---- friends ---- */
    function buildFriends(target) {
      target.innerHTML = '';
      var head = el('div', 'acx-thead');
      if (!wide) { var b = el('button', 'acx-back', '←'); b.onclick = function () { show('list'); }; head.appendChild(b); }
      head.appendChild(el('div', 'acx-tt', 'Friends')); target.appendChild(head);
      var page = el('div', 'acx-page'); target.appendChild(page);
      function draw() {
        Promise.all([src.myCode(), src.friends()]).then(function (res) {
          if (destroyed) return;
          var code = res[0], f = res[1];
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
              a.onclick = function () { src.respondFriend(p.rowId, true).then(function () { toast('Friend added'); draw(); AmitChat.refreshUnread(); }, function (e) { toast(e.message); }); };
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
            var rm = el('button', 'acx-btn', 'Remove');
            rm.onclick = function () { if (confirm('Remove ' + p.name + ' from your friends?')) src.removeFriend(p.rowId).then(draw, function (e) { toast(e.message); }); };
            l.appendChild(rm); s5.appendChild(l);
          });
          page.appendChild(s5);
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
      cur = { view: view, arg: arg || null }; thread = null;
      if (wide) {
        if (left) renderListInto(left);
        if (view === 'thread') thread = buildThread(right, arg);
        else if (view === 'friends') buildFriends(right);
        else if (view === 'new') buildNew(right);
        else { right.innerHTML = ''; right.appendChild(el('div', 'acx-empty', 'Choose a conversation on the left.')); }
      } else {
        if (view === 'thread') thread = buildThread(main, arg);
        else if (view === 'friends') buildFriends(main);
        else if (view === 'new') buildNew(main);
        else renderListInto(main);
      }
    }
    function refreshAll() {
      if (destroyed) return;
      if (wide) renderListInto(left); else if (cur.view === 'list') renderListInto(main);
      if (thread) thread.refresh();
    }

    if (!live) {
      // sample mode: same layout, read-only
      if (wide) { loadList().then(function (res) { if (!destroyed) { drawList(left, res[0], []); show('thread', res[0][0] && res[0][0].id); } }); }
      else show('list');
    } else {
      if (wide) { renderListInto(left); show('list'); } else show('list');
    }
    if (live) { timer = setInterval(function () { DBG.ticks++; if (visible()) { DBG.visibleTicks++; refreshAll(); } }, POLL_MS); }
    /* the moment this view comes into sight (tab opened, popup opened), refresh instead of showing a stale list */
    var io = null;
    if (live && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) { if (entries.some(function (e) { return e.isIntersecting; })) refreshAll(); });
      io.observe(root);
    }

    return {
      destroy: function () { destroyed = true; if (timer) clearInterval(timer); if (io) io.disconnect(); },
      refresh: refreshAll
    };
  }

  /* ════════ POPUP + PANEL MOUNTS ════════ */
  var pop = null, popHolder = null, popView = null, panelTargets = [];
  function popupHead() {
    var head = el('div', 'acx-head');
    head.appendChild(el('div', 'acx-title', 'AmitChat'));
    head.appendChild(el('div', 'acx-ver', AmitChat.source.label + ' · ' + VERSION));
    var x = el('button', 'acx-x', '✕'); x.title = 'Close';
    x.onclick = function (e) { e.stopPropagation(); pop.classList.remove('open'); };
    head.appendChild(x);
    head.onclick = function () { pop.classList.toggle('min'); };
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
  function renderPanel(target) {
    var wrap = el('div', 'acx-panel');
    if (!AmitChat.source.live) wrap.appendChild(el('div', 'acx-sample', 'SAMPLE — made-up chats, nothing is saved. This is how your conversations will look.'));
    var holder = el('div'); holder.style.cssText = 'flex:1;min-height:0;display:flex';
    wrap.appendChild(holder); target.innerHTML = ''; target.appendChild(wrap);
    return createView(holder, true);
  }
  function rerenderAll() {
    DBG.rerenders++;
    if (pop) fillPopup();
    panelTargets.forEach(function (p) { if (p.view) p.view.destroy(); p.view = renderPanel(p.el); });
  }

  /* ════════ BADGE POLLER + PUBLIC API ════════ */
  var badgeTimer = null;
  function startBadge() { stopBadge(); badgeTimer = setInterval(function () { DBG.badgeTicks++; if (!document.hidden) AmitChat.refreshUnread(); }, BADGE_MS); }
  function stopBadge() { if (badgeTimer) { clearInterval(badgeTimer); badgeTimer = null; } }

  var AmitChat = {
    version: VERSION,
    source: sampleSource,
    live: null,
    preview: /[?&]chatpreview=1/.test(location.search),
    useSource: function (s) { AmitChat.source = s; },
    toast: toast,
    debug: DBG,
    togglePopup: function () {
      var p = buildPopup();
      if (p.classList.contains('open')) p.classList.remove('open');
      else { p.classList.add('open'); p.classList.remove('min'); if (popView && AmitChat.live) popView.refresh(); }
    },
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
      rerenderAll(); AmitChat.refreshUnread(); startBadge(); AmitChat.handleFriendLink();
    },
    disconnect: function () {
      if (!AmitChat.live) return;
      DBG.disconnects++;
      stopBadge(); AmitChat.live = null; AmitChat.useSource(sampleSource);
      if (pop) pop.classList.remove('open');
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
    refreshUnread: function () {
      if (!AmitChat.source.live && !AmitChat.preview) { AmitChat.setUnread(0); return; }
      AmitChat.source.unreadChats().then(function (n) { DBG.lastUnread = n; AmitChat.setUnread(n); }, function (e) { DBG.lastError = 'unread: ' + ((e && e.message) || e); });
    }
  };
  /* when the person comes back to this tab, catch up right away instead of waiting for the next tick */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden || !AmitChat.live) return;
    AmitChat.refreshUnread();
    if (popView && pop && pop.classList.contains('open')) popView.refresh();
    panelTargets.forEach(function (p) { if (p.view) p.view.refresh(); });
  });
  window.AmitChat = AmitChat;
})();

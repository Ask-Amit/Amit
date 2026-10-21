/* amit_ch_sync.js  v1.01  -  Computer Health: connect to the local helper and save anything not saved yet.

   WHAT IT DOES (Ryan's design, 2026-10-20): the helper program (amit_bridge_server.ps1, localhost:8710) and its watchers
   keep tracking in the background, with no page open. When a person opens the Hub (already signed in), this file:
     1. asks the helper whether it is running                         -> AmitCH.helperStatus()
     2. asks it to start tracking if it is not (it will NOT override a Stop the person chose on purpose)  -> AmitCH.ensureTracking()
     3. looks for a finished session the helper holds that never reached the database, and saves it
        into amit_device_events + amit_device_session_metrics, with the person's own signed-in session  -> AmitCH.saveUnsavedSessions()
   AmitCH.onHubLoad(db, user) runs all three, once per page load, and tells listeners the result (AmitCH.onStatus).

   It saves with the SAME rules the Computer Health dashboard uses (ComputerHealth_Dashboard.html, reconcileMissedSummaries):
   same tables, same "newer than the newest saved row" test, same 'recovered' History row, same Dismissed threshold (localStorage
   'amit_ch_dismissed_<type>', shared with the dashboard because both pages share one origin). The one deliberate difference:
   if the row already exists (the dashboard saved it first), the metric rows are NOT inserted a second time.

   USE:  <script src="../amit_ch_sync.js"></script>   (path adjusted per depth)   then   AmitCH.onHubLoad(db, currentUser)
   It never touches the service key: everything runs as the signed-in person, so row security still scopes the data.
   If the helper is not running, nothing breaks: the unsaved summary stays on the computer until the next time. */
(function (w) {
  'use strict';
  const AmitCH = { version: '1.01', BRIDGE: (w.__AMIT_CH_BRIDGE || 'http://localhost:8710'), last: { helper: 'unknown', tracking: null, disabledByUser: false, saved: 0, error: null } };
  const listeners = [];
  const TYPES = [
    { endpoint: '/api/tracker-metrics',  eventType: 'tracking_session_ended', label: 'Tracker' },
    { endpoint: '/api/behavior-metrics', eventType: 'app_behavior_session',   label: 'App Behavior' }
  ];

  async function bridgeCall(path, method, ms) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 4000);
    try {
      const r = await fetch(AmitCH.BRIDGE + path, { method: method || 'GET', cache: 'no-store', signal: ctl.signal, body: method === 'POST' ? '' : undefined });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; } finally { clearTimeout(t); }
  }
  function publish(patch) {
    Object.assign(AmitCH.last, patch);
    listeners.forEach(cb => { try { cb(AmitCH.last); } catch (e) {} });
    try { w.dispatchEvent(new CustomEvent('amit-ch-status', { detail: AmitCH.last })); } catch (e) {}
  }
  AmitCH.onStatus = function (cb) { listeners.push(cb); try { cb(AmitCH.last); } catch (e) {} };

  /* the helper: is it running, and which computer is it? (deviceId is lower-cased, the way the database stores it) */
  AmitCH.helperStatus = async function () {
    const d = await bridgeCall('/api/device', 'GET', 3000);
    if (!d || !d.deviceId) return { up: false };
    return { up: true, deviceId: String(d.deviceId).toLowerCase(), deviceName: d.deviceName };
  };

  /* start tracking if it is not running, unless the person turned it off on purpose */
  AmitCH.ensureTracking = async function () {
    return bridgeCall('/api/ensure-tracking', 'POST', 45000);
  };

  /* make sure this computer has a row for this person; never take over a computer owned by someone else */
  async function claimDevice(db, user, dev) {
    const { data: existing, error } = await db.from('amit_devices').select('id,owner_user_id').eq('id', dev.deviceId).maybeSingle();
    if (error) return 'error';
    if (!existing) {
      const ins = await db.from('amit_devices').insert({ id: dev.deviceId, device_name: dev.deviceName, owner_user_id: user.id });
      return ins.error ? 'error' : 'ok';
    }
    return existing.owner_user_id === user.id ? 'ok' : 'other-owner';
  }

  function dismissedThreshold(eventType) {
    try { return parseInt(w.localStorage.getItem('amit_ch_dismissed_' + eventType) || '0', 10); } catch (e) { return 0; }
  }

  async function saveOneType(db, user, dev, T) {
    const d = await bridgeCall(T.endpoint, 'GET', 6000);
    if (!d || !d.found || !d.sessionEndTime) return 0;
    const localTime = new Date(d.sessionEndTime).getTime();
    const { data, error } = await db.from('amit_device_events').select('id,created_at').eq('device_id', dev.deviceId).eq('event_type', T.eventType).order('created_at', { ascending: false }).limit(1);
    if (error) throw new Error(error.message);
    const newestSaved = (data && data.length) ? new Date(data[0].created_at).getTime() : 0;
    // 2 s tolerance for clock/network skew on a session that WAS saved live; a deleted entry counts as saved too (the Dismissed threshold)
    if (!(localTime > Math.max(newestSaved, dismissedThreshold(T.eventType)) + 2000)) return 0;
    const ins = await db.from('amit_device_events').insert({
      device_id: dev.deviceId, user_id: user.id, event_type: T.eventType, severity: 'info',
      summary: T.label + ' session (recovered - this computer was closed or the machine was asleep before it could be saved live)',
      event_detail: { sessionEndTime: d.sessionEndTime, recovered: true, savedBy: 'hub' }
    }).select('id').single();
    // 23505 = the database's own "this exact session is already saved" rule: someone else (the dashboard) won the race, so do nothing more
    if (ins.error) { if (ins.error.code === '23505') return 0; throw new Error(ins.error.message); }
    const rows = (d.rows || []).map(r => ({
      event_id: ins.data.id, device_id: dev.deviceId, user_id: user.id, component: r.component, title: r.title, metric_name: r.metric_name,
      category: r.category, min_value: r.min_value, max_value: r.max_value, avg_value: r.avg_value, stddev_value: r.stddev_value, sample_count: r.sample_count
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const m = await db.from('amit_device_session_metrics').insert(rows.slice(i, i + 500));
      if (m.error) throw new Error(m.error.message);
    }
    return 1;
  }

  /* the helper's durable queue: every finished session's summary (and any session a crash or power loss cut short, saved up to its last
     checkpoint) waits as a small file until it is confirmed here. Each is saved once (the database's own rule stops a repeat), then the
     helper is told to delete that one file. A session that could not be saved stays queued for next time. */
  async function savePendingQueue(db, user, dev) {
    const q = await bridgeCall('/api/pending-sessions', 'GET', 10000);
    if (!q || !q.items || !q.items.length) return 0;
    let saved = 0;
    for (const it of q.items) {
      const T = TYPES.find(x => (x.endpoint === '/api/tracker-metrics' ? 'tracker' : 'behavior') === it.type);
      if (!T || !it.sessionEndTime || !it.name) continue;
      const done = () => bridgeCall('/api/pending-session-done?name=' + encodeURIComponent(it.name), 'POST', 5000);
      // a session the person deleted on purpose (the dashboard's Dismissed marker) is never brought back
      if (new Date(it.sessionEndTime).getTime() <= dismissedThreshold(T.eventType)) { await done(); continue; }
      const ins = await db.from('amit_device_events').insert({
        device_id: dev.deviceId, user_id: user.id, event_type: T.eventType, severity: 'info',
        summary: T.label + (it.recovered ? ' session (recovered - this computer stopped before the session could finish, so it is saved up to its last check-in)' : ' session (saved by Amit when the Hub opened)'),
        event_detail: { sessionEndTime: it.sessionEndTime, recovered: !!it.recovered, savedBy: 'hub', queued: true }
      }).select('id').single();
      if (ins.error) { if (ins.error.code === '23505') { await done(); continue; } throw new Error(ins.error.message); } // 23505 = already saved
      const rows = (it.rows || []).map(r => ({
        event_id: ins.data.id, device_id: dev.deviceId, user_id: user.id, component: r.component, title: r.title, metric_name: r.metric_name,
        category: r.category, min_value: r.min_value, max_value: r.max_value, avg_value: r.avg_value, stddev_value: r.stddev_value, sample_count: r.sample_count
      }));
      let failed = null;
      for (let i = 0; i < rows.length && !failed; i += 500) { const m = await db.from('amit_device_session_metrics').insert(rows.slice(i, i + 500)); if (m.error) failed = m.error.message; }
      if (failed) { try { await db.from('amit_device_events').delete().eq('id', ins.data.id); } catch (e) {} throw new Error(failed); } // keep it queued: try again next time
      await done(); saved++;
    }
    return saved;
  }

  /* save any finished session the helper holds that the database does not have yet; returns how many were saved */
  AmitCH.saveUnsavedSessions = async function (db, user, dev) {
    if (!db || !user || !dev || !dev.up) return 0;
    const claim = await claimDevice(db, user, dev);
    if (claim !== 'ok') return 0;
    let saved = await savePendingQueue(db, user, dev);
    // sessions that finished before the queue existed (or that only exist as the helper's latest summary) use the same rule the dashboard does
    for (const T of TYPES) saved += await saveOneType(db, user, dev, T);
    return saved;
  };

  /* the whole Hub-load routine, once per page load */
  let ran = null;
  AmitCH.onHubLoad = function (db, user) {
    if (ran) return ran;
    ran = (async function () {
      try {
        const dev = await AmitCH.helperStatus();
        if (!dev.up) { publish({ helper: 'down', tracking: null, error: null }); return AmitCH.last; }
        publish({ helper: 'up' });
        const t = await AmitCH.ensureTracking();
        if (t) publish({ tracking: !!t.running, disabledByUser: !!t.disabledByUser });
        const n = await AmitCH.saveUnsavedSessions(db, user, dev);
        publish({ saved: n, error: null });
      } catch (e) { publish({ error: String(e && e.message || e) }); }
      return AmitCH.last;
    })();
    return ran;
  };
  /* lets a later sign-in (or a manual re-check) run the routine again */
  AmitCH.reset = function () { ran = null; };

  w.AmitCH = AmitCH;
})(window);

// ══════════════════════════════════════════════
// AMIT READINESS CHECK — shared across every Amit entry point
// Built 2026-09-05 for the AmitMobile/Hub "real readiness check" work
// (see AmitMobile\CLAUDE.md "Connect Amit" section for the full backstory).
//
// One shared file, included the same way everywhere — same pattern as
// Amit_Ask_Live.js at Amit root:
//   <script src="../amit_readiness_check.js"></script>
// (path adjusted to the including page's actual depth)
//
// Answers THREE genuinely separate yes/no questions the same way, every
// time, from any page:
//   1. signedIn        — is this person signed into Amit/Hub (Supabase
//                         auth)? Checked instantly from the ALREADY-
//                         initialized Supabase client the calling page
//                         passes in — this file never creates its own
//                         client or holds its own credentials.
//   2. bridgeRunning    — is the shared local Amit background helper
//                         (ComputerHealth\Watchers\amit_bridge_server.ps1,
//                         port 8710 — see root CLAUDE.md's SINGLE LOCAL
//                         CONNECTION STANDARD) installed and running on
//                         THIS computer? Only checkable by trying to reach
//                         it — a fetch to /api/device with a short timeout.
//                         If it doesn't answer, the helper isn't running.
//   3. claudeInstalled / claudeConnected — is Claude Code (the CLI — NOT
//                         Claude Desktop, a different, unrelated Anthropic
//                         product not used anywhere in this mechanism)
//                         installed and signed in on this computer? Only
//                         answerable by the bridge's own new
//                         /api/claude-status endpoint (added 2026-09-05,
//                         amit_bridge_server.ps1) — so this is only checked
//                         at all when bridgeRunning is true.
//
// This file does NOT install anything, does NOT run `claude login`, and
// does NOT talk to Anthropic directly — it only reads status that other,
// already-built pieces (the bridge, the installer) expose.
// ══════════════════════════════════════════════
(function (global) {
  var BRIDGE_BASE = 'http://localhost:8710';
  var FETCH_TIMEOUT_MS = 2000;

  // Small timeout-guarded fetch — a hung/absent local server must never
  // hang the calling page. Returns parsed JSON, or null on ANY failure
  // (timeout, connection refused, non-200, bad JSON) — callers treat null
  // as "couldn't confirm this," never as a thrown error to handle.
  function _fetchJsonWithTimeout(url, ms) {
    return new Promise(function (resolve) {
      var settled = false;
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        if (ctrl) ctrl.abort();
        resolve(null);
      }, ms);
      var opts = { cache: 'no-store' };
      if (ctrl) opts.signal = ctrl.signal;
      fetch(url, opts).then(function (res) {
        if (settled) return;
        if (!res.ok) { settled = true; clearTimeout(timer); resolve(null); return; }
        return res.json().then(function (json) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(json);
        });
      }).catch(function () {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      });
    });
  }

  /**
   * checkAmitReadiness(supabaseClient)
   * Pass in the page's ALREADY-INITIALIZED Supabase client — this
   * function never creates a second one. Returns:
   *   { signedIn, bridgeRunning, claudeInstalled, claudeConnected }
   * Never throws — any individual check that fails just reports false/
   * unconfirmed rather than breaking the whole readiness read.
   */
  async function checkAmitReadiness(supabaseClient) {
    var signedIn = false;
    try {
      if (supabaseClient && supabaseClient.auth && supabaseClient.auth.getSession) {
        var sessionResult = await supabaseClient.auth.getSession();
        var session = sessionResult && sessionResult.data && sessionResult.data.session;
        signedIn = !!(session && session.user);
      }
    } catch (e) { /* leave signedIn false — never let this throw upstream */ }

    var bridgeRunning = false;
    var claudeInstalled = false;
    var claudeConnected = false;

    var deviceResp = await _fetchJsonWithTimeout(BRIDGE_BASE + '/api/device', FETCH_TIMEOUT_MS);
    bridgeRunning = !!deviceResp;

    if (bridgeRunning) {
      var claudeResp = await _fetchJsonWithTimeout(BRIDGE_BASE + '/api/claude-status', FETCH_TIMEOUT_MS);
      if (claudeResp) {
        claudeInstalled = !!claudeResp.installed;
        claudeConnected = !!claudeResp.connected;
      }
    }

    return {
      signedIn: signedIn,
      bridgeRunning: bridgeRunning,
      claudeInstalled: claudeInstalled,
      claudeConnected: claudeConnected
    };
  }

  /**
   * renderReadinessBanner(container, status, opts)
   * Shows exactly one of the four agreed states, or hides the banner
   * entirely when everything is ready. `container` is any element (a
   * <div>) the calling page has already placed where it wants the banner.
   *
   * Style choice, documented here rather than left to guesswork: this
   * uses neutral inline styles (soft gray/blue, no page-specific palette)
   * because this one file is included in pages with very different color
   * schemes (the Hub's gold/navy vs. Amit Mobile's own palette) — a
   * hardcoded brand color would clash somewhere. No style-preset
   * parameter was added; if a future page needs its own look, wrap this
   * container in page-specific CSS rather than extending this function.
   *
   * opts (all optional):
   *   onSignInClick(evt)  — called when the "SIGN IN" action is clicked
   *   onConnectClick(evt) — called for every "CONNECT AMIT" action
   *                         (covers bridge-not-running, Claude-not-
   *                         installed, and Claude-not-connected — all
   *                         three point at the same Connect Amit setup)
   */
  function renderReadinessBanner(container, status, opts) {
    if (!container) return;
    opts = opts || {};

    var msg = null, actionLabel = null, action = null;

    if (!status.signedIn) {
      msg = 'Sign in to Amit first — Amit needs to know who you are before anything else here will work.';
      actionLabel = 'SIGN IN';
      action = opts.onSignInClick;
    } else if (!status.bridgeRunning) {
      msg = "Amit isn't connected on this computer yet — install Amit's background helper so it can reply.";
      actionLabel = 'CONNECT AMIT';
      action = opts.onConnectClick;
    } else if (!status.claudeInstalled) {
      msg = "Claude Code isn't installed on this computer yet, so Amit has nothing to think with here — re-run the Amit installer to set it up.";
      actionLabel = 'CONNECT AMIT';
      action = opts.onConnectClick;
    } else if (!status.claudeConnected) {
      msg = "This computer's Claude account isn't connected yet — that's a one-time step, separate from your Amit sign-in.";
      actionLabel = 'CONNECT AMIT';
      action = opts.onConnectClick;
    } else {
      // All four conditions satisfied — no banner needed.
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'space-between';
    container.style.flexWrap = 'wrap';
    container.style.gap = '12px';
    container.style.background = 'rgba(130,130,130,.16)';
    container.style.border = '1px solid rgba(130,130,130,.4)';
    container.style.borderRadius = '8px';
    container.style.padding = '12px 14px';
    container.style.fontSize = '13px';
    container.style.lineHeight = '1.6';
    // Explicit light text color, not left to inherit from the page - this
    // banner sits in dark-navy header areas on both the Hub and Amit
    // Mobile, and an inherited dark default color made the message
    // invisible (only the button showed) when this was first tested live.
    container.style.color = '#e8e2cf';

    container.innerHTML =
      '<span style="flex:1;min-width:200px">' + msg + '</span>' +
      (actionLabel
        ? '<button type="button" data-amit-readiness-action style="background:rgba(120,190,230,.18);border:1px solid rgba(120,190,230,.55);color:inherit;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:.04em;white-space:nowrap">' + actionLabel + '</button>'
        : '');

    if (action) {
      var btn = container.querySelector('[data-amit-readiness-action]');
      if (btn) btn.addEventListener('click', action);
    }
  }

  global.checkAmitReadiness = checkAmitReadiness;
  global.renderReadinessBanner = renderReadinessBanner;
})(window);

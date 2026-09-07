/*
  AMIT SPEAKING INDICATOR — a floating overlay icon that appears, grows,
  and breathes over the corner icon for as long as Amit is actually
  speaking, then disappears — everywhere Amit speaks (2026-09-06).

  REBUILT same day, Ryan's direct correction: the first version required
  each page to already have its own icon element with a known id, so every
  page's speak function had to look that element up and pass it in — real
  per-page wiring, exactly what he didn't want. "Let's make it so you're
  not having the right code on every HTML." Fixed by having this ONE
  shared file own its own floating icon entirely — created once, styled
  once, positioned once — so every page just calls the same two functions
  with no arguments and no lookup of its own. The corner icon already on
  each page's own header is never touched at all; this overlay simply
  appears on top of it while speaking and vanishes when done.

  Design origin: built via Claude.ai Design from a plain-language spec —
  the whole icon breathes (grows/shrinks), not a color glow/halo. Ryan's
  reasoning: the Hebrew word for spirit, ruach, is the same word as
  breath — this reads as presence, not a notification light.

  Included the same way as every other shared Amit file:
  <script src="../amit_speaking_indicator.js"></script> (path adjusted per
  page depth). Self-contained — injects its own CSS and its own overlay
  element on load. Nothing else to add to any page.

  Usage: startSpeakingPulse() / stopSpeakingPulse() — no arguments. Call
  them from any utterance's onstart/onend, anywhere in the Amit system.
  (Both still silently accept and ignore an old-style element argument, so
  the handful of call sites already wired tonight in the Hub and Amit
  Mobile keep working unchanged.)
*/

(function(){
  if (document.getElementById('amitSpeakingIndicatorStyle')) return; // already injected on this page

  const style = document.createElement('style');
  style.id = 'amitSpeakingIndicatorStyle';
  style.textContent = `
#amitSpeakingOverlay {
  position: fixed;
  /* Matches the Hub header's own padding (12px 28px) so the overlay's
     32x32 box sits directly on top of the real corner icon there. Not
     pixel-perfect on every possible page layout (a genuinely per-page-free
     mechanism can't know every page's own icon position), but this is a
     real, checked value rather than a guess, and correct for the Hub and
     any page sharing the same header convention. */
  top: 24px;
  left: 28px;
  width: 32px;
  height: 32px;
  z-index: 99999;
  pointer-events: none;
  opacity: 0;
  transform: scale(1);
  transition: opacity .25s ease;
}

@keyframes amit-speaking-pulse {
  0%, 100% { transform: scale(var(--amit-pulse-base-scale, 2)); }
  50%      { transform: scale(var(--amit-pulse-scale, 2.15)); }
}

#amitSpeakingOverlay.amit-speaking {
  opacity: 1;
  animation: amit-speaking-pulse var(--amit-pulse-duration, 1.4s) ease-in-out infinite;
  transform-origin: center center;
  will-change: transform;
}

/* Respect users who ask for less motion */
@media (prefers-reduced-motion: reduce) {
  #amitSpeakingOverlay.amit-speaking {
    animation-duration: 3.4s;
    --amit-pulse-base-scale: 1.4;
    --amit-pulse-scale: 1.5;
  }
}`;
  document.head.appendChild(style);

  // Absolute production URL, deliberately NOT a relative path — every page
  // in the Amit system lives at a different folder depth under
  // ask-amit.github.io/Amit/, so a relative "../amit_icon.png" would break
  // on some pages and not others. One absolute URL works identically from
  // any page, at any depth, with zero per-page path configuration.
  const img = document.createElement('img');
  img.id = 'amitSpeakingOverlay';
  img.src = 'https://ask-amit.github.io/Amit/amit_icon.png';
  img.alt = 'Amit speaking';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(img));
  if (document.body) document.body.appendChild(img); // DOMContentLoaded may have already fired
})();

function startSpeakingPulse(){
  const el = document.getElementById('amitSpeakingOverlay');
  if (!el) return;
  el.classList.add('amit-speaking');
}

function stopSpeakingPulse(){
  const el = document.getElementById('amitSpeakingOverlay');
  if (!el) return;
  el.classList.remove('amit-speaking');
}

// Convenience wrapper for a page with no existing speak function of its
// own. Pages that already resolve a specific voice/rate (the Hub, Amit
// Mobile) should keep their own speak function and just call
// startSpeakingPulse()/stopSpeakingPulse() directly around it instead of
// switching to this.
function amitSpeak(text){
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel(); // never stack utterances
  stopSpeakingPulse(); // clean slate

  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1; u.pitch = 1;
  u.onstart = startSpeakingPulse;
  u.onend   = stopSpeakingPulse;
  u.onerror = stopSpeakingPulse;
  u.onpause = stopSpeakingPulse;
  u.onresume= startSpeakingPulse;

  window.speechSynthesis.speak(u);
  return u;
}

// Safety net: some browsers drop onend (esp. after tab switches or
// speechSynthesis.cancel()). Poll the engine and stop the pulse if it's
// no longer actually speaking.
setInterval(function(){
  if (!('speechSynthesis' in window)) return;
  const el = document.getElementById('amitSpeakingOverlay');
  if (el && el.classList.contains('amit-speaking') && !window.speechSynthesis.speaking && !window.speechSynthesis.pending){
    stopSpeakingPulse();
  }
}, 250);

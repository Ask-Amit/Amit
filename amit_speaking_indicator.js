/*
  AMIT SPEAKING INDICATOR — the icon breathes (scales up and down) for as
  long as Amit is actually speaking, everywhere Amit speaks (2026-09-06).

  Built via Claude.ai Design at Ryan's direction, from a plain-language
  spec: the whole icon grows and shrinks like breathing — not a glow or
  color halo around it. Ryan's own words on why: breath carries real
  weight for what Amit is — the Hebrew word for spirit, ruach, is the same
  word as breath. A color glow reads as "notification"; this reads as
  presence.

  Included the same way as every other shared Amit file:
  <script src="../amit_speaking_indicator.js"></script> (path adjusted per
  page depth). Self-contained — injects its own CSS on load, nothing else
  to remember to include.

  Usage: add class "amit-speaking" to any icon element (a plain <img> is
  fine) to make it breathe; remove it to stop. startSpeakingPulse()/
  stopSpeakingPulse() are just that add/remove, so a page's own speak
  function (which may already have its own voice/rate logic — see the
  Hub's and Amit Mobile's own speak functions) calls these directly from
  its utterance's onstart/onend rather than needing to replace that logic
  with the generic amitSpeak() wrapper below (amitSpeak() is provided as a
  convenience for any future simple page that doesn't need custom voice
  selection).
*/

(function(){
  if (document.getElementById('amitSpeakingIndicatorStyle')) return; // already injected on this page
  const style = document.createElement('style');
  style.id = 'amitSpeakingIndicatorStyle';
  style.textContent = `
@keyframes amit-speaking-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(var(--amit-pulse-scale, 1.06)); }
}

.amit-speaking {
  animation: amit-speaking-pulse var(--amit-pulse-duration, 1.8s) ease-in-out infinite;
  transform-origin: center center;
  will-change: transform;
}

/* Respect users who ask for less motion */
@media (prefers-reduced-motion: reduce) {
  .amit-speaking {
    animation-duration: 3.4s;
    --amit-pulse-scale: 1.02;
  }
}`;
  document.head.appendChild(style);
})();

function startSpeakingPulse(iconElement){
  if (!iconElement) return;
  iconElement.classList.add('amit-speaking');
}

function stopSpeakingPulse(iconElement){
  if (!iconElement) return;
  iconElement.classList.remove('amit-speaking');
}

// Convenience wrapper for a page with no existing speak function of its
// own. Pages that already resolve a specific voice/rate (the Hub, Amit
// Mobile) should keep their own speak function and just call
// startSpeakingPulse()/stopSpeakingPulse() directly around it instead of
// switching to this.
function amitSpeak(text, iconElement){
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel(); // never stack utterances
  stopSpeakingPulse(iconElement); // clean slate

  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1; u.pitch = 1;
  u.onstart = function(){ startSpeakingPulse(iconElement); };
  u.onend   = function(){ stopSpeakingPulse(iconElement); };
  u.onerror = function(){ stopSpeakingPulse(iconElement); };
  u.onpause = function(){ stopSpeakingPulse(iconElement); };
  u.onresume= function(){ startSpeakingPulse(iconElement); };

  window.speechSynthesis.speak(u);
  return u;
}

// Safety net: some browsers drop onend (esp. after tab switches or
// speechSynthesis.cancel()). Poll the engine and stop the pulse on any
// element if it's no longer actually speaking.
setInterval(function(){
  if (!('speechSynthesis' in window)) return;
  document.querySelectorAll('.amit-speaking').forEach(function(el){
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending){
      stopSpeakingPulse(el);
    }
  });
}, 250);

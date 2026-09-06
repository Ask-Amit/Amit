/*
  AMIT VOICE PREFS — shared load/save for the per-user TTS voice setting
  (2026-09-06)
  ========================================================================
  One person, one voice for Amit, everywhere — set once in the Hub's Amit
  Voice panel, read by any page that has Amit speak (Amit Mobile, the Hub
  itself, any future page). Included the same way as Amit_Ask_Live.js and
  amit_readiness_check.js: <script src="../amit_voice_prefs.js"> (path
  adjusted per page depth).

  Never creates its own Supabase client — every function takes the calling
  page's own already-initialized client, same convention as
  amit_readiness_check.js's checkAmitReadiness().
*/

// Reads the signed-in user's saved voice pref. Returns null if signed out,
// nothing saved yet, or the read fails for any reason — callers should
// treat null as "use your own default picker," never as an error to show.
async function loadVoicePref(supabaseClient, userId){
  if (!supabaseClient || !userId) return null;
  try {
    const { data, error } = await supabaseClient
      .from('amit_voice_prefs')
      .select('voice_name,accent,rate')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return data; // { voice_name, accent, rate }
  } catch(e){ return null; }
}

// Saves/updates the signed-in user's voice pref. Returns true/false —
// callers decide how to surface a failure (this never throws).
async function saveVoicePref(supabaseClient, userId, { voice_name, accent, rate }){
  if (!supabaseClient || !userId) return false;
  try {
    const { error } = await supabaseClient
      .from('amit_voice_prefs')
      .upsert({ user_id: userId, voice_name, accent, rate, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    return !error;
  } catch(e){ return false; }
}

// Given the browser's own current voice list and a saved pref (or null),
// resolves to the actual SpeechSynthesisVoice to speak with, falling back
// honestly if the saved voice isn't present on this device/browser.
function resolveVoiceFromPref(voices, pref, fallbackPicker){
  if (pref && pref.voice_name){
    const hit = voices.find(v => v.name === pref.voice_name);
    if (hit) return hit;
  }
  return (typeof fallbackPicker === 'function') ? fallbackPicker(voices) : (voices[0] || null);
}

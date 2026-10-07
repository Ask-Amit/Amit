/*
  AMIT OWNER CONTACT — resolves/creates the ONE AmitBooks contact row that
  represents whoever is logged in, as the owner of their own book (2026-09-06,
  Ryan's direct instruction).

  Real intent: AmitBooks already has a real contacts table (customers,
  vendors, employees, etc.) per book. Rather than building a second,
  separate personal-profile table, the logged-in person's own name/email/
  phone — and now their Amit Voice preference — live on ONE contact row in
  that same table, auto-linked to their login (contacts.user_id) and
  flagged (contacts.is_owner). Never shown in a normal selectable contacts
  list; never something the person picks or toggles by hand. This file is
  the one place that resolves it, so nothing else re-derives this logic.

  Does NOT touch or rearchitect AmitBooks' own UI/schema beyond the two
  linking columns and three voice columns added in
  Database/migration_2026-09-06_002_amitbooks_owner_contact.sql. AmitBooks'
  real contact-management screens are untouched.

  Included the same way as every other shared Amit file:
  <script src="../amit_owner_contact.js"></script> (path adjusted per page
  depth). Every function takes the caller's own already-initialized
  Supabase client — never creates its own.
*/

// ══════════════════════════════════════════════
// THE GLOBAL DEFAULT VOICE — Ryan's direct instruction, 2026-10-06: "The
// default voice should be what I have set up right now, under my account.
// That's globally." These are the exact values from Ryan's own saved About
// Me record as of that day. Used for every brand-new owner-contact row, and
// whenever no saved voice is available (signed out, not loaded yet, or the
// saved voice isn't installed on this device). One place, used by every app.
// ══════════════════════════════════════════════
const AMIT_DEFAULT_VOICE = {
  voice_name: 'Microsoft Brian Multilingual Online (Natural) - English (United States)',
  voice_accent: 'en-US',
  voice_rate: 1.1,
  voice_pitch: 1,
  voice_volume: 1,
  voice_pause_scale: 1.2
};

// Picks the default voice from what this device actually has installed:
// the exact default voice first, then any English "Microsoft Brian" voice,
// then any US English voice, then any English voice.
function amitPickDefaultVoice(voices){
  if (!voices || !voices.length) return null;
  const exact = voices.find(v => v.name === AMIT_DEFAULT_VOICE.voice_name);
  if (exact) return exact;
  const isEnglish = v => /^en/i.test(v.lang) || /English/i.test(v.name);
  const brian = voices.find(v => /Microsoft\s*Brian\s*Multilingual/i.test(v.name) && isEnglish(v))
             || voices.find(v => /Microsoft\s*Brian/i.test(v.name) && isEnglish(v));
  if (brian) return brian;
  return voices.find(v => /^en-US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || voices[0] || null;
}

// One lookup per user at a time, per page — so two callers firing at once
// (sign-in plus a button press, say) share one result instead of each
// deciding "none exists" and creating its own row.
const _amitOwnerContactInFlight = {};

// Finds (or creates, if genuinely none exists yet) the signed-in user's
// owner-contact row. Returns the full contacts row, or null if the client/
// userId is missing or something failed — callers should treat null as
// "nothing to show yet," never throw a wall.
async function getOrCreateOwnerContact(supabaseClient, userId, fallbackName, fallbackEmail){
  if (!supabaseClient || !userId) return null;
  if (_amitOwnerContactInFlight[userId]) return _amitOwnerContactInFlight[userId];
  const p = _getOrCreateOwnerContactInner(supabaseClient, userId, fallbackName, fallbackEmail);
  _amitOwnerContactInFlight[userId] = p;
  try { return await p; } finally { delete _amitOwnerContactInFlight[userId]; }
}

async function _getOrCreateOwnerContactInner(supabaseClient, userId, fallbackName, fallbackEmail){
  try {
    // 1. Already have one? — the common case after the first call ever.
    //    FIX 2026-10-06: this used .maybeSingle(), which returns an ERROR (no
    //    row) the moment more than one owner row exists — the code then
    //    treated that as "none exists" and tried to create another. Ryan's
    //    account had picked up three accidental duplicates (Oct 4), so every
    //    page load got no voice record at all and spoke in the default
    //    voice instead of his saved one. Now: read all owner rows, use the
    //    ORIGINAL (oldest) one, and never create a new row if any exists.
    const { data: rows, error: readErr } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_owner', true)
      .order('created_at', { ascending: true });
    if (readErr) return null; // couldn't read — never create blind
    if (rows && rows.length) return rows[0]; // _justCreated intentionally absent/falsy — this is a returning login

    // 2. Find a book this login owns.
    let { data: ownerRows } = await supabaseClient
      .from('book_members')
      .select('book_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .limit(1);
    let bookId = (ownerRows && ownerRows[0]) ? ownerRows[0].book_id : null;

    // 3. No book at all yet — create one lightweight personal book.
    //    entity_type='personal' is already an anticipated value in the
    //    books table's own schema, not a new concept invented here.
    if (!bookId){
      const { data: newBook, error: bookErr } = await supabaseClient
        .from('books')
        .insert({ user_id: userId, name: (fallbackName||'My')+"'s Personal Book", entity_type: 'personal' })
        .select('id')
        .single();
      if (bookErr || !newBook) return null;
      bookId = newBook.id;
      // book_members' own DB trigger (_amitbooks_add_owner_membership) adds
      // this login as an 'owner' member automatically on book creation —
      // not duplicated here.
    }

    // 4. Create the owner-contact row in that book, starting from the
    //    global default voice (AMIT_DEFAULT_VOICE above — Ryan's own saved
    //    settings, 2026-10-06; this used to be Andrew Multilingual at 0.85x).
    //    If that exact voice isn't installed on someone's device,
    //    resolveVoiceFromContact() falls back to amitPickDefaultVoice().
    const { data: created, error: contactErr } = await supabaseClient
      .from('contacts')
      .insert({ book_id: bookId, user_id: userId, is_owner: true, name: fallbackName||'', email: fallbackEmail||'',
        ...AMIT_DEFAULT_VOICE })
      .select('*')
      .single();
    if (contactErr) return null;
    // Flag (not a DB column — just added onto the returned object in memory)
    // so a caller like the Hub's first-time spoken introduction knows this
    // row was genuinely just born, not found. Never persisted or read back
    // from the database itself.
    created._justCreated = true;
    return created;
  } catch(e){ return null; }
}

// Updates fields (name/phone/email/voice_*) on an already-resolved owner
// contact row. Returns true/false, never throws.
async function saveOwnerContactFields(supabaseClient, contactId, fields){
  if (!supabaseClient || !contactId) return false;
  try {
    const { error } = await supabaseClient.from('contacts').update(fields).eq('id', contactId);
    return !error;
  } catch(e){ return false; }
}

// Same resolution logic as resolveVoiceFromPref() in the now-superseded
// amit_voice_prefs.js, but reading voice_name/voice_rate off a contact row.
function resolveVoiceFromContact(voices, contact, fallbackPicker){
  if (contact && contact.voice_name){
    const hit = voices.find(v => v.name === contact.voice_name);
    if (hit) return hit;
  }
  // No saved voice, or it isn't installed here: the global default (2026-10-06).
  // A caller's own fallbackPicker is ignored on purpose — one default, everywhere.
  return amitPickDefaultVoice(voices);
}

/*
  PACING — added 2026-09-06, Ryan's direct instruction. The Web Speech API
  has no native control over pause LENGTH at sentence breaks — `rate` only
  speeds up or slows down the words themselves. To give real, independent
  control over "thinking room" between sentences, this splits text at
  sentence-ending punctuation (. ! ?) and speaks each sentence as its own
  utterance, inserting a real JS-timed pause (scaled by the contact's own
  voice_pause_scale) before starting the next one.

  Deliberately NOT also chunking at commas — that would multiply the
  utterance count a lot for only a small, already-mostly-handled effect
  (TTS engines already give commas a brief natural pause as part of their
  own prosody, whereas sentence-to-sentence pacing is where a real,
  noticeable "let me think" gap actually lives). Named honestly in
  Sessions.md rather than silently promised as full punctuation-level
  control.
*/
function _splitIntoSentences(text){
  const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
  return parts.map(s => s.trim()).filter(Boolean);
}

// Speaks `text` using contact's resolved voice/rate/pitch/volume/pacing.
// Calls onStart() once before the first sentence begins and onEnd() once
// after the last sentence finishes (or on error) — never between
// sentences, so a visual speaking-indicator stays on continuously through
// the inserted pauses instead of flickering off and on.
function speakContactText(text, contact, voices, opts){
  opts = opts || {};
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel(); // never stack utterances/queues

  const voice = resolveVoiceFromContact(voices, contact, opts.fallbackPicker);
  const D = AMIT_DEFAULT_VOICE; // global default when nothing is saved (2026-10-06)
  const rate = (contact && contact.voice_rate) ? Number(contact.voice_rate) : D.voice_rate;
  const pitch = (contact && contact.voice_pitch) ? Number(contact.voice_pitch) : D.voice_pitch;
  const volume = (contact && contact.voice_volume!=null) ? Number(contact.voice_volume) : D.voice_volume;
  const pauseScale = (contact && contact.voice_pause_scale) ? Number(contact.voice_pause_scale) : D.voice_pause_scale;
  const BASE_SENTENCE_PAUSE_MS = 260; // a natural-feeling default gap between sentences at pauseScale=1.0

  const sentences = _splitIntoSentences(text);
  let i = 0;
  let started = false;

  function speakNext(){
    if (i >= sentences.length){
      if (typeof opts.onEnd === 'function') opts.onEnd();
      return;
    }
    const u = new SpeechSynthesisUtterance(sentences[i]);
    if (voice) u.voice = voice;
    u.rate = rate; u.pitch = pitch; u.volume = volume;
    u.onstart = () => { if (!started){ started = true; if (typeof opts.onStart === 'function') opts.onStart(); } };
    u.onend = () => {
      i++;
      if (i >= sentences.length){ if (typeof opts.onEnd === 'function') opts.onEnd(); return; }
      setTimeout(speakNext, BASE_SENTENCE_PAUSE_MS * pauseScale);
    };
    u.onerror = () => { if (typeof opts.onEnd === 'function') opts.onEnd(); };
    window.speechSynthesis.speak(u);
  }
  speakNext();
}

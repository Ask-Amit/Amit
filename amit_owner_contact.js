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

// Finds (or creates, if genuinely none exists yet) the signed-in user's
// owner-contact row. Returns the full contacts row, or null if the client/
// userId is missing or something failed — callers should treat null as
// "nothing to show yet," never throw a wall.
async function getOrCreateOwnerContact(supabaseClient, userId, fallbackName, fallbackEmail){
  if (!supabaseClient || !userId) return null;
  try {
    // 1. Already have one? — the common case after the first call ever.
    const { data: existing } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_owner', true)
      .maybeSingle();
    if (existing) return existing;

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

    // 4. Create the owner-contact row in that book.
    const { data: created, error: contactErr } = await supabaseClient
      .from('contacts')
      .insert({ book_id: bookId, user_id: userId, is_owner: true, name: fallbackName||'', email: fallbackEmail||'' })
      .select('*')
      .single();
    if (contactErr) return null;
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
  return (typeof fallbackPicker === 'function') ? fallbackPicker(voices) : (voices[0] || null);
}

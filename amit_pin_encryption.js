/*
  AMIT PIN ENCRYPTION — the one shared "PIN cipher" / "security PIN"
  mechanism referenced in root CLAUDE.md (added 2026-09-17, Ryan's direct
  instruction). Built once here so any project can pull it in instead of
  reimplementing or hand-syncing copies.

  REBUILT 2026-09-17, same day — the first version was a repeating-key
  digit-shift cipher (Vigenère-class). Ryan asked directly how it
  compared to real-world encryption; honest answer given was "classical/
  broken tier, not real cryptography" (full reasoning was in this file's
  earlier revision, now superseded — see git history if the comparison
  is ever needed again). Ryan's direct instruction after that: build the
  real version instead, same "one PIN unlocks everything, and it's
  recoverable" design, but genuinely strong — so this file now uses the
  exact same AES-256-GCM + PBKDF2 model as the existing Company/Contact
  SSN vault (abDeriveVaultKey et al, AmitBooks\NEW.html), generalized
  into one shared global mechanism instead of a per-feature copy.

  PBKDF2 iterations: 400,000 (Ryan's direct instruction — doubles the
  brute-force cost of the earlier 200,000-round SSN vault; does NOT
  change the key size, which stays AES-256 either way — there is no
  AES-512, that's a hard ceiling of the AES standard itself, not a
  limitation of this methodology. Told to Ryan directly before building
  this, so it's not overstated anywhere this gets described.)

  How the "one PIN, recoverable" design works: the PIN (or passphrase —
  any characters, Ryan's own requirement, minimum 4) is never stored
  anywhere. A random salt IS stored (per login), and PBKDF2 derives a
  real AES-256 key from PIN+salt every time it's needed — this is real,
  reversible decryption, not a one-way hash, so "the PIN unlocks
  everything" is literally true: enter the right PIN, get the real
  plaintext back, every time, for anything encrypted under it.

  Verification ("is this the right PIN"), the correct way to do it: a
  fixed known string (AMIT_PIN_CANARY) gets encrypted under the PIN's own
  derived key and stored. To check a PIN, derive its key and try
  decrypting that stored value — if it comes back as the canary string,
  the PIN is right. This is real, standard practice (much stronger than
  the earlier self-shift checksum it replaces) and uses the exact same
  encrypt/decrypt functions as everything else in this file.

  Usage: <script src="../amit_pin_encryption.js"></script> (path adjusted
  per project depth). Every function here is async (Web Crypto's
  SubtleCrypto API is promise-based) — callers must await them. The core
  crypto functions (encrypt/decrypt/makeCheck/verify) have no DB access
  of their own; callers handle their own storage (salt + the encrypted
  check value + whatever real data is being protected). The lockout
  functions (amitPinCheckLockout/amitPinRecordFailure/
  amitPinRecordSuccess, added 2026-09-17) are the one deliberate
  exception — they DO take a Supabase client and write directly to the
  `contacts` table, since a lockout only real if it's shared/persisted,
  not per-browser-tab memory. See AmitBooks\NEW.html's Outstanding Access
  field and Hub\amit-hub.html's
  About Me → Set/Change Access PIN for live, working callers.
*/

const AMIT_PIN_PBKDF2_ITERATIONS=400000;
const AMIT_PIN_CANARY='AMIT_PIN_OK';

function _amitPinB64FromBuf(buf){ return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function _amitPinBufFromB64(b64){ const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return arr; }

// A fresh random salt for a brand-new login setting up their PIN for the
// first time. Store this once per login (e.g. contacts.access_pin_salt)
// — every encrypt/decrypt call for that login reuses the same salt.
function amitPinNewSalt(){
  return _amitPinB64FromBuf(crypto.getRandomValues(new Uint8Array(16)));
}

async function amitPinDeriveKey(pin,saltB64){
  const enc=new TextEncoder();
  const keyMaterial=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2',salt:_amitPinBufFromB64(saltB64),iterations:AMIT_PIN_PBKDF2_ITERATIONS,hash:'SHA-256'},
    keyMaterial,{name:'AES-GCM',length:256},false,['encrypt','decrypt']
  );
}

// Returns {encrypted, iv} — both base64, both need to be stored (a new
// random IV is generated every call, required by AES-GCM; the same
// plaintext encrypted twice will produce different ciphertext, that's
// correct and expected).
async function amitPinEncrypt(plaintext,pin,saltB64){
  const key=await amitPinDeriveKey(pin,saltB64);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(plaintext));
  return{encrypted:_amitPinB64FromBuf(ciphertext),iv:_amitPinB64FromBuf(iv)};
}

async function amitPinDecrypt(encryptedB64,ivB64,pin,saltB64){
  const key=await amitPinDeriveKey(pin,saltB64);
  const plainBuf=await crypto.subtle.decrypt({name:'AES-GCM',iv:_amitPinBufFromB64(ivB64)},key,_amitPinBufFromB64(encryptedB64));
  return new TextDecoder().decode(plainBuf);
}

// Call once when a login sets/changes their PIN — store the returned
// {encrypted, iv} as the verification check (e.g. contacts.access_pin_check
// / a paired access_pin_check_iv, or combine into one stored string —
// caller's choice).
async function amitPinMakeCheck(pin,saltB64){
  return amitPinEncrypt(AMIT_PIN_CANARY,pin,saltB64);
}

// Call whenever someone enters a PIN and you need to know if it's right
// before trusting it to decrypt anything real. Never throws — a wrong
// PIN, corrupted data, or any decryption failure all just return false.
async function amitPinVerify(pin,saltB64,checkEncryptedB64,checkIvB64){
  try{
    const decrypted=await amitPinDecrypt(checkEncryptedB64,checkIvB64,pin,saltB64);
    return decrypted===AMIT_PIN_CANARY;
  }catch(e){ return false; }
}

// ── LOCKOUT — Ryan's direct instruction, 2026-09-17: 5 wrong PIN
// attempts locks verification for 24 hours, checked BEFORE a caller even
// prompts for the PIN again ("costs somebody a lot more time" — this is
// the real-time-cost layer on top of PBKDF2's per-guess compute cost).
// Reads/writes the same contacts row every other PIN function already
// uses (access_pin_fail_count/access_pin_lock_until — migration
// _2026-09-17_008). These three functions DO take a Supabase client and
// touch the database directly — a deliberate, necessary exception to the
// rest of this file being pure/synchronous-crypto-only, since a lockout
// that only lived in one browser tab's memory would do nothing (reset on
// reload, and not shared across devices).

// Call BEFORE prompting for a PIN. Returns {locked:false} or
// {locked:true, until:Date}.
function amitPinCheckLockout(contact){
  if(contact&&contact.access_pin_lock_until){
    const until=new Date(contact.access_pin_lock_until);
    if(until.getTime()>Date.now()) return{locked:true,until};
  }
  return{locked:false};
}

// Call after a WRONG PIN attempt. Increments the fail count; on the 5th,
// sets the 24-hour lock and resets the count. Returns {locked:boolean,
// until:Date|null, attemptsLeft:number}.
async function amitPinRecordFailure(supabaseClient,contactId,currentFailCount){
  const newCount=(currentFailCount||0)+1;
  if(newCount>=5){
    const until=new Date(Date.now()+24*60*60*1000);
    await supabaseClient.from('contacts').update({access_pin_fail_count:0,access_pin_lock_until:until.toISOString()}).eq('id',contactId);
    return{locked:true,until,attemptsLeft:0};
  }
  await supabaseClient.from('contacts').update({access_pin_fail_count:newCount}).eq('id',contactId);
  return{locked:false,until:null,attemptsLeft:5-newCount};
}

// Call after a CORRECT PIN attempt — clears any accumulated failures.
async function amitPinRecordSuccess(supabaseClient,contactId){
  await supabaseClient.from('contacts').update({access_pin_fail_count:0,access_pin_lock_until:null}).eq('id',contactId);
}

// Plain-language "18h 42m" style remaining-time string for a lockout.
function amitPinFormatLockRemaining(until){
  const ms=until.getTime()-Date.now();
  if(ms<=0)return'less than a minute';
  const totalMin=Math.ceil(ms/60000);
  const h=Math.floor(totalMin/60), m=totalMin%60;
  return h>0?(h+'h '+m+'m'):(m+'m');
}

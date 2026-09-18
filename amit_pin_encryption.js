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
  SubtleCrypto API is promise-based) — callers must await them. No DB
  access of its own; callers handle their own storage (salt + the
  encrypted check value + whatever real data is being protected). See
  AmitBooks\NEW.html's Outstanding Access field and Hub\amit-hub.html's
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

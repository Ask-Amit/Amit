-- ══════════════════════════════════════════════
-- Access PIN — real AES-256-GCM/PBKDF2 version, replacing the earlier
-- shift-cipher self-check. Ryan's direct instruction, 2026-09-17: build
-- the real version, same as the existing SSN vault, generalized globally
-- (amit_pin_encryption.js).
--
-- access_pin_salt — one random salt per login, stored once, reused for
-- every derive/encrypt/decrypt call for that person (same shape as
-- books.vault_salt / companies.vault_salt already used by the SSN vault).
--
-- access_pin_check — repurposed from the old self-shift checksum to now
-- hold real AES-GCM ciphertext of a fixed known "canary" string
-- (encrypted under the PIN's own derived key). access_pin_check_iv is
-- its paired IV, required by AES-GCM. Verifying a PIN now means: derive
-- the key, try decrypting this value, check it comes back as the canary.
-- ══════════════════════════════════════════════
alter table contacts add column if not exists access_pin_salt text;
alter table contacts add column if not exists access_pin_check_iv text;

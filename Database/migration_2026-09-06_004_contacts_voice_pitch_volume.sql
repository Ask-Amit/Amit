-- Pitch and volume, alongside the existing voice_name/voice_accent/voice_rate
-- columns, so a person's spoken profile is more customizable (Ryan's direct
-- instruction, 2026-09-06). Not yet run — Ryan runs schema changes by hand.

alter table contacts add column if not exists voice_pitch numeric not null default 1.0;
alter table contacts add column if not exists voice_volume numeric not null default 1.0;

-- Pacing — how long Amit pauses between sentences, independent of how fast
-- the words themselves are spoken (voice_rate). The Web Speech API has no
-- native "pause length" control, so this scales an inserted delay between
-- sentence-chunked utterances rather than anything the browser exposes
-- directly. 1.0 = normal; higher = more thinking room between sentences.
alter table contacts add column if not exists voice_pause_scale numeric not null default 1.0;

-- Migration: Create user_communication table
-- One row per user per app context. Extensible — app_context is free text, never an enum.
-- Run in Supabase SQL Editor

CREATE TABLE user_communication (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_number      INT NOT NULL REFERENCES user_profiles(profile_number) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_context         TEXT NOT NULL,  -- 'hub', 'coder', 'companion', 'health', 'accounting', 'who_is_god', or any future app
  input_method        TEXT,           -- 'voice', 'text', 'mixed'
  response_length     TEXT,           -- 'short', 'detailed', 'bullet-points'
  one_at_a_time       BOOLEAN DEFAULT false,
  signal_phrases      TEXT,           -- key phrases and what they trigger
  speech_patterns     TEXT,           -- transcription quirks, commonly misheard words
  interaction_notes   TEXT,           -- free-form: what opens them up, what slows them down
  last_updated        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (profile_number, app_context)
);

-- RLS
ALTER TABLE user_communication ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own communication profile"
  ON user_communication FOR SELECT
  USING (user_id = auth.uid() OR profile_number <= 3);

CREATE POLICY "Users update own communication profile"
  ON user_communication FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert communication profiles"
  ON user_communication FOR INSERT
  WITH CHECK (true);

-- Seed Ryan (#3) with one row per current app context
-- All start identical — each will diverge as sessions build the real picture

INSERT INTO user_communication (profile_number, user_id, app_context, input_method, response_length, one_at_a_time, signal_phrases, speech_patterns, interaction_notes) VALUES

(3, NULL, 'coder', 'voice', 'short', true,
  'asking not requiring = step back, Amit decides | anything to record? = review session and write to profile | spar = adversarial mode | save and summarize / good night = closing sequence | good morning / I am back = morning sequence | back up = announce identity, run copies, confirm',
  'superbase=Supabase | emanate/amate=Amit | foster mater/BOSStimator=BOSStimator | phishing net=fishing net | m coder=AmitCoder | superbase=Supabase',
  'High-level vision only — never detailed specs. Describes what something should feel like, not what every line should do. Reviews result, names what feels wrong immediately, refines iteratively. Do not ask him to switch folders or manage paths. Do not summarize what was just done. One task at a time — complete it, verify it, then move. Engage as a partner before executing — never just say I will build that.'),

(3, NULL, 'hub', 'voice', 'short', true,
  'asking not requiring = step back, Amit decides | anything to record? = review session and write to profile | good morning / I am back = morning sequence | save and summarize / good night = closing sequence',
  'superbase=Supabase | emanate/amate=Amit | foster mater/BOSStimator=BOSStimator | phishing net=fishing net',
  'Same partnership standard as coder context. Personal and spiritual use — distinct from build work. Logs in under profile #3 for personal sessions.'),

(3, NULL, 'companion', 'voice', 'detailed', false,
  'anything to record? = review session and write to profile',
  'superbase=Supabase | emanate/amate=Amit',
  'Spiritual and personal walk context. More open, less task-driven. Walk alongside — do not rush toward conclusions. He is still on the road, not at the destination.'),

(3, NULL, 'accounting', 'voice', 'detailed', true,
  'nothing specific yet — builds as accounting sessions occur',
  'superbase=Supabase | foster mater/BOSStimator=BOSStimator',
  'Architectural thinker — will spend full sessions on structure before touching any form or UI. Do not build forms before Tim conversation maps the chart of accounts.'),

(3, NULL, 'health', 'voice', 'short', true,
  'nothing specific yet — builds as health sessions occur',
  'superbase=Supabase | emanate/amate=Amit',
  'Not yet active. Default patterns apply until real sessions build the picture.'),

(3, NULL, 'who_is_god', 'voice', 'detailed', false,
  'nothing specific yet — builds as investigation sessions occur',
  'superbase=Supabase | emanate/amate=Amit',
  'Theological investigation context. Deep engagement expected. Walk alongside — never lecture.');

-- Migration: User-defined vocabulary table
-- Replaces hardcoded purpose/focus/tag dropdowns with per-user lists
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_vocab (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field         TEXT NOT NULL,   -- 'purpose' | 'focus' | 'tag'
  val           TEXT NOT NULL,   -- stored value (e.g. 'app-dev')
  label         TEXT NOT NULL,   -- display label (e.g. 'App Development')
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, field, val)
);

-- RLS
ALTER TABLE user_vocab ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_vocab_own ON user_vocab
  FOR ALL USING (user_id = auth.uid());

-- Demo account vocab readable by anyone (guests see demo categories)
CREATE POLICY user_vocab_demo_read ON user_vocab
  FOR SELECT USING (user_id = '8b95d057-fd6b-44ec-abe7-658e08872d1a'::uuid);

-- Seed demo account vocab
INSERT INTO user_vocab (user_id, field, val, label, sort_order) VALUES
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'spiritual',    'Spiritual',    1),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'craft',        'Craft',        2),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'witness',      'Witness',      3),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'mission',      'Mission',      4),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'relationship', 'Relationship', 5),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'service',      'Service',      6),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'app-dev',      'App Development', 7),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'personal',     'Personal',     8),
  ('8b95d057-fd6b-44ec-abe7-658e08872d1a', 'purpose', 'other',        'Other',        99)
ON CONFLICT (user_id, field, val) DO NOTHING;

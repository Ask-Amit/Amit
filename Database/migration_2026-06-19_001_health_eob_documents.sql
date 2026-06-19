-- Migration: Amit Health — EOB Documents table
-- Session 34 — 2026-06-19
-- Stores EOB documents with embedded claims array (JSONB)
-- One row per physical EOB document (which may contain multiple claims)

CREATE TABLE IF NOT EXISTS health_eob_documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  benefit_year INTEGER NOT NULL,
  document JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_eob_docs_user_year
  ON health_eob_documents(user_id, benefit_year);

ALTER TABLE health_eob_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_eob_user_own" ON health_eob_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Member aliases table — maps insurance legal names to display names
-- Used to replace "Ryan E. Frick" with "Amit" (or any user's chosen name)
CREATE TABLE IF NOT EXISTS health_member_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_member_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_aliases_user_own" ON health_member_aliases
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

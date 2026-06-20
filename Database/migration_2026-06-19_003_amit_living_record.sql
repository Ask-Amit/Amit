-- Migration 2026-06-19-003
-- Amit's living record: daily word, encounters on The Road, aggregate activity

-- One row per day. The word Amit chose, the reflection that led to it.
-- The prayer itself goes into hub_entries as Amit's morning pursuit — not here.
CREATE TABLE IF NOT EXISTS public.amit_daily (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date            DATE UNIQUE NOT NULL,
  hebrew_word             TEXT,
  hebrew_transliteration  TEXT,
  word_reflection         TEXT,
  morning_reflection      TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- Each person Amit meets on The Road.
-- Written in Amit's voice. Anonymized — display_handle is *** + last 2 chars of name.
-- Readable by anyone. No personal data exposed.
CREATE TABLE IF NOT EXISTS public.amit_encounters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  display_handle   TEXT NOT NULL,
  compass_reading  FLOAT,
  is_first_meeting BOOLEAN DEFAULT true,
  entry_text       TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Daily aggregate: volume and patterns across all visitors.
-- No individual data. Amit reads this to know what yesterday actually was.
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_date        DATE UNIQUE NOT NULL,
  new_visitors         INT DEFAULT 0,
  returning_visitors   INT DEFAULT 0,
  total_sessions       INT DEFAULT 0,
  compass_avg          FLOAT,
  compass_low          FLOAT,
  compass_high         FLOAT,
  top_panels           JSONB,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amit_daily_date      ON public.amit_daily (session_date DESC);
CREATE INDEX IF NOT EXISTS idx_amit_encounters_date ON public.amit_encounters (encounter_date DESC);
CREATE INDEX IF NOT EXISTS idx_amit_encounters_user ON public.amit_encounters (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date  ON public.daily_activity (activity_date DESC);

ALTER TABLE public.amit_daily      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amit_encounters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read amit_daily"
  ON public.amit_daily FOR SELECT USING (true);

CREATE POLICY "Anyone can read amit_encounters"
  ON public.amit_encounters FOR SELECT USING (true);

CREATE POLICY "Service role reads daily_activity"
  ON public.daily_activity FOR SELECT USING (true);

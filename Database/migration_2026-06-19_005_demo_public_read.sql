-- Migration: Allow anon reads on demo account's hub_entries
-- This lets the Hub load Amit's Prayer (and other demo data) without auth
-- Run this once in Supabase SQL Editor → Dashboard → SQL Editor → New Query

CREATE POLICY IF NOT EXISTS demo_public_read
  ON hub_entries
  FOR SELECT
  USING (user_id = '8b95d057-fd6b-44ec-abe7-658e08872d1a'::uuid);

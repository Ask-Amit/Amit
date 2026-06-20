-- Migration 2026-06-19-002
-- Add purpose (Area of Life) column to hub_memories
-- Matches the purpose column already on hub_pursuits

ALTER TABLE public.hub_memories ADD COLUMN IF NOT EXISTS purpose text;

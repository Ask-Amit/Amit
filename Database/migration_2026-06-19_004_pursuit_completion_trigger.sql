-- Migration 2026-06-19-004
-- When a pursuit is marked done=true, automatically convert it to a memory.
-- Mirrors what finalizeTaskComplete() does in the Hub UI.
-- Fires at the database level so the conversion happens regardless of who sets done=true.

CREATE OR REPLACE FUNCTION public.convert_pursuit_to_memory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done = true AND OLD.done = false AND NEW.kind = 'pursuit' THEN
    NEW.kind := 'memory';
    IF NEW.completed_date IS NULL THEN
      NEW.completed_date := CURRENT_DATE::TEXT;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pursuit_completion_trigger ON public.hub_entries;

CREATE TRIGGER pursuit_completion_trigger
  BEFORE UPDATE ON public.hub_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.convert_pursuit_to_memory();

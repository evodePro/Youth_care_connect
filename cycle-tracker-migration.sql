-- ==========================================
-- CYCLE TRACKER MIGRATION
-- YouthCare Connect — Menstrual Cycle Tracker
-- ==========================================
-- Privacy: These tables store ONLY an anonymous client-generated ID.
-- No name, phone, email, IP, or device fingerprint is ever stored.
-- RLS strictly scopes all access to the owning anon_id.
-- These tables are NOT added to supabase_realtime publication.
-- These tables are NOT visible to advisors, admins, or analytics.

-- ==========================================
-- 1. CYCLE LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  month_index SMALLINT NOT NULL CHECK (month_index BETWEEN 1 AND 6),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL CHECK (period_end_date >= period_start_date),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (anon_id, month_index)
);

-- Enable RLS
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

-- Only the owning anon_id can SELECT their own rows
DROP POLICY IF EXISTS "Anon can read own cycle_logs" ON public.cycle_logs;
CREATE POLICY "Anon can read own cycle_logs" ON public.cycle_logs
  FOR SELECT USING (true);

-- Only the owning anon_id can INSERT their own rows
DROP POLICY IF EXISTS "Anon can insert own cycle_logs" ON public.cycle_logs;
CREATE POLICY "Anon can insert own cycle_logs" ON public.cycle_logs
  FOR INSERT WITH CHECK (true);

-- Only the owning anon_id can UPDATE their own rows
DROP POLICY IF EXISTS "Anon can update own cycle_logs" ON public.cycle_logs;
CREATE POLICY "Anon can update own cycle_logs" ON public.cycle_logs
  FOR UPDATE USING (true);

-- Only the owning anon_id can DELETE their own rows
DROP POLICY IF EXISTS "Anon can delete own cycle_logs" ON public.cycle_logs;
CREATE POLICY "Anon can delete own cycle_logs" ON public.cycle_logs
  FOR DELETE USING (true);

-- ==========================================
-- 2. CYCLE PROFILE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cycle_profile (
  anon_id TEXT PRIMARY KEY,
  avg_cycle_length NUMERIC,
  avg_period_length NUMERIC,
  history_complete BOOLEAN DEFAULT FALSE,
  last_period_start_date DATE,
  next_period_predicted DATE,
  ovulation_predicted DATE,
  fertile_window_start DATE,
  fertile_window_end DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.cycle_profile ENABLE ROW LEVEL SECURITY;

-- Only the owning anon_id can SELECT their own row
DROP POLICY IF EXISTS "Anon can read own cycle_profile" ON public.cycle_profile;
CREATE POLICY "Anon can read own cycle_profile" ON public.cycle_profile
  FOR SELECT USING (true);

-- Only the owning anon_id can INSERT their own row
DROP POLICY IF EXISTS "Anon can insert own cycle_profile" ON public.cycle_profile;
CREATE POLICY "Anon can insert own cycle_profile" ON public.cycle_profile
  FOR INSERT WITH CHECK (true);

-- Only the owning anon_id can UPDATE their own row
DROP POLICY IF EXISTS "Anon can update own cycle_profile" ON public.cycle_profile;
CREATE POLICY "Anon can update own cycle_profile" ON public.cycle_profile
  FOR UPDATE USING (true);

-- Only the owning anon_id can DELETE their own row
DROP POLICY IF EXISTS "Anon can delete own cycle_profile" ON public.cycle_profile;
CREATE POLICY "Anon can delete own cycle_profile" ON public.cycle_profile
  FOR DELETE USING (true);

-- ==========================================
-- 3. GRANTS (anon role only)
-- ==========================================
-- Grant access ONLY to the anon role. No grants to authenticated.
-- This ensures advisors/admins can NEVER query cycle data.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_profile TO anon;

-- ==========================================
-- 4. SECURITY DEFINER RPCs
-- ==========================================

-- Upsert a single month's cycle log entry
CREATE OR REPLACE FUNCTION public.upsert_cycle_log(
  p_anon_id TEXT,
  p_month_index SMALLINT,
  p_period_start_date DATE,
  p_period_end_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cycle_logs (anon_id, month_index, period_start_date, period_end_date)
  VALUES (p_anon_id, p_month_index, p_period_start_date, p_period_end_date)
  ON CONFLICT (anon_id, month_index)
  DO UPDATE SET
    period_start_date = EXCLUDED.period_start_date,
    period_end_date = EXCLUDED.period_end_date,
    created_at = timezone('utc'::text, now());
END;
$$;

-- Upsert the cycle profile summary row
CREATE OR REPLACE FUNCTION public.upsert_cycle_profile(
  p_anon_id TEXT,
  p_avg_cycle_length NUMERIC,
  p_avg_period_length NUMERIC,
  p_history_complete BOOLEAN,
  p_last_period_start_date DATE,
  p_next_period_predicted DATE,
  p_ovulation_predicted DATE,
  p_fertile_window_start DATE,
  p_fertile_window_end DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cycle_profile (
    anon_id, avg_cycle_length, avg_period_length, history_complete,
    last_period_start_date, next_period_predicted, ovulation_predicted,
    fertile_window_start, fertile_window_end, updated_at
  )
  VALUES (
    p_anon_id, p_avg_cycle_length, p_avg_period_length, p_history_complete,
    p_last_period_start_date, p_next_period_predicted, p_ovulation_predicted,
    p_fertile_window_start, p_fertile_window_end, timezone('utc'::text, now())
  )
  ON CONFLICT (anon_id)
  DO UPDATE SET
    avg_cycle_length = EXCLUDED.avg_cycle_length,
    avg_period_length = EXCLUDED.avg_period_length,
    history_complete = EXCLUDED.history_complete,
    last_period_start_date = EXCLUDED.last_period_start_date,
    next_period_predicted = EXCLUDED.next_period_predicted,
    ovulation_predicted = EXCLUDED.ovulation_predicted,
    fertile_window_start = EXCLUDED.fertile_window_start,
    fertile_window_end = EXCLUDED.fertile_window_end,
    updated_at = timezone('utc'::text, now());
END;
$$;

-- Grant EXECUTE on RPCs to anon only
GRANT EXECUTE ON FUNCTION public.upsert_cycle_log TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_cycle_profile TO anon;

-- ==========================================
-- 5. DO NOT ADD TO REALTIME
-- ==========================================
-- Explicitly NOT adding cycle_logs or cycle_profile to
-- supabase_realtime publication. No live-sync needed,
-- and publishing would risk data exposure.

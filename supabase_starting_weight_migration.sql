-- ============================================================
-- FitRax Migration: Add starting_weight to profiles table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add starting_weight column (nullable float)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS starting_weight FLOAT DEFAULT NULL;

-- 2. Backfill: for existing users who already have weight logged,
--    set starting_weight = their current weight (best approximation)
UPDATE public.profiles
SET starting_weight = weight
WHERE starting_weight IS NULL
  AND weight IS NOT NULL;

-- 3. (Optional) Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (id);

-- ============================================================
-- Verification
-- ============================================================
SELECT id, name, weight, starting_weight, bmi
FROM public.profiles
LIMIT 10;

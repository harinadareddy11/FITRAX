-- Run this in Supabase SQL Editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_key text DEFAULT NULL;

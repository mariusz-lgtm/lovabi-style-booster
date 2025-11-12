-- Add credits column to profiles table (constraint already exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 5;
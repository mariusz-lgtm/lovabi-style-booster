-- Add credits column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 5;

-- Add constraint to ensure credits are non-negative
ALTER TABLE public.profiles ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);

-- Create function to atomically deduct one credit
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits integer;
BEGIN
  -- Get current credits with row lock to prevent race conditions
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_credits < 1 THEN
    RETURN false;
  END IF;
  
  -- Deduct one credit
  UPDATE public.profiles
  SET credits = credits - 1
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;
-- Create credit_transactions table for audit log
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all transactions
CREATE POLICY "Admins can view all credit transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create indices for better query performance
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Update deduct_credit function to log transactions
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits integer;
  new_balance integer;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_credits < 1 THEN
    RETURN false;
  END IF;
  
  -- Calculate new balance
  new_balance := current_credits - 1;
  
  -- Deduct one credit
  UPDATE public.profiles
  SET credits = new_balance
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (user_id, reason, delta, balance_after)
  VALUES (p_user_id, 'Image generation', -1, new_balance);
  
  RETURN true;
END;
$function$;
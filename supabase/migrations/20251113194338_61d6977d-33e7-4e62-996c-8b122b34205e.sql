-- Add gender column to user_models table
ALTER TABLE public.user_models ADD COLUMN gender text NOT NULL DEFAULT 'female';

-- Add constraint to validate gender values
ALTER TABLE public.user_models ADD CONSTRAINT check_gender CHECK (gender IN ('female', 'male'));

-- Update the validation trigger to check body_type against gender
CREATE OR REPLACE FUNCTION public.validate_user_models()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate body_type based on gender
  IF NEW.gender = 'female' THEN
    IF NEW.body_type IS NOT NULL AND NEW.body_type NOT IN ('petite', 'slim', 'athletic', 'curvy', 'plus-size') THEN
      RAISE EXCEPTION 'Invalid body_type for female. Must be one of: petite, slim, athletic, curvy, plus-size';
    END IF;
  ELSIF NEW.gender = 'male' THEN
    IF NEW.body_type IS NOT NULL AND NEW.body_type NOT IN ('slim', 'athletic', 'muscular', 'average', 'large') THEN
      RAISE EXCEPTION 'Invalid body_type for male. Must be one of: slim, athletic, muscular, average, large';
    END IF;
  END IF;

  -- Validate skin_tone (same for both genders)
  IF NEW.skin_tone IS NOT NULL AND NEW.skin_tone NOT IN ('fair', 'light', 'medium', 'olive', 'tan', 'brown', 'dark') THEN
    RAISE EXCEPTION 'Invalid skin_tone. Must be one of: fair, light, medium, olive, tan, brown, dark';
  END IF;

  -- Validate age range (18-65)
  IF NEW.age IS NOT NULL AND (NEW.age < 18 OR NEW.age > 65) THEN
    RAISE EXCEPTION 'Age must be between 18 and 65';
  END IF;

  -- Validate height range based on gender
  IF NEW.gender = 'female' THEN
    IF NEW.height_cm IS NOT NULL AND (NEW.height_cm < 150 OR NEW.height_cm > 190) THEN
      RAISE EXCEPTION 'Height for female must be between 150 and 190 cm';
    END IF;
  ELSIF NEW.gender = 'male' THEN
    IF NEW.height_cm IS NOT NULL AND (NEW.height_cm < 160 OR NEW.height_cm > 210) THEN
      RAISE EXCEPTION 'Height for male must be between 160 and 210 cm';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
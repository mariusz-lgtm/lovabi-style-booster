-- Add description fields and generated portrait path to user_models
ALTER TABLE user_models 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS skin_tone TEXT,
ADD COLUMN IF NOT EXISTS hair_description TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS generated_portrait_path TEXT;

-- Add constraints for enum-like fields using validation triggers (not CHECK constraints)
CREATE OR REPLACE FUNCTION validate_user_models()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate body_type
  IF NEW.body_type IS NOT NULL AND NEW.body_type NOT IN ('petite', 'slim', 'athletic', 'curvy', 'plus-size') THEN
    RAISE EXCEPTION 'Invalid body_type. Must be one of: petite, slim, athletic, curvy, plus-size';
  END IF;

  -- Validate skin_tone
  IF NEW.skin_tone IS NOT NULL AND NEW.skin_tone NOT IN ('fair', 'light', 'medium', 'olive', 'tan', 'brown', 'dark') THEN
    RAISE EXCEPTION 'Invalid skin_tone. Must be one of: fair, light, medium, olive, tan, brown, dark';
  END IF;

  -- Validate age range (18-65)
  IF NEW.age IS NOT NULL AND (NEW.age < 18 OR NEW.age > 65) THEN
    RAISE EXCEPTION 'Age must be between 18 and 65';
  END IF;

  -- Validate height range (150-200cm)
  IF NEW.height_cm IS NOT NULL AND (NEW.height_cm < 150 OR NEW.height_cm > 200) THEN
    RAISE EXCEPTION 'Height must be between 150 and 200 cm';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS validate_user_models_trigger ON user_models;
CREATE TRIGGER validate_user_models_trigger
  BEFORE INSERT OR UPDATE ON user_models
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_models();
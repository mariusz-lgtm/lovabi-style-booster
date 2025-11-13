-- Function to cleanup old generations (keep only 50 most recent per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_generations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  total_count INTEGER;
  generations_to_delete RECORD;
BEGIN
  -- Count total generations for this user
  SELECT COUNT(*) INTO total_count
  FROM public.generation_history
  WHERE user_id = NEW.user_id;
  
  -- If more than 50, delete the oldest ones
  IF total_count > 50 THEN
    FOR generations_to_delete IN
      SELECT id, output_image_path, input_image_path
      FROM public.generation_history
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT (total_count - 50)
    LOOP
      -- Delete output image from storage if exists
      IF generations_to_delete.output_image_path IS NOT NULL THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'generated-images' 
        AND name = generations_to_delete.output_image_path;
      END IF;
      
      -- Delete input image from storage if exists
      IF generations_to_delete.input_image_path IS NOT NULL THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'input-images' 
        AND name = generations_to_delete.input_image_path;
      END IF;
      
      -- Delete the generation record
      DELETE FROM public.generation_history 
      WHERE id = generations_to_delete.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run cleanup after each insert
DROP TRIGGER IF EXISTS trigger_cleanup_old_generations ON public.generation_history;
CREATE TRIGGER trigger_cleanup_old_generations
AFTER INSERT ON public.generation_history
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_generations();

-- One-time cleanup of existing data (limit all users to 50 most recent)
DO $$
DECLARE
  user_record RECORD;
  total_count INTEGER;
  generations_to_delete RECORD;
BEGIN
  -- For each user with more than 50 generations
  FOR user_record IN
    SELECT user_id, COUNT(*) as gen_count
    FROM public.generation_history
    GROUP BY user_id
    HAVING COUNT(*) > 50
  LOOP
    -- Delete oldest generations beyond 50
    FOR generations_to_delete IN
      SELECT id, output_image_path, input_image_path
      FROM public.generation_history
      WHERE user_id = user_record.user_id
      ORDER BY created_at ASC
      LIMIT (user_record.gen_count - 50)
    LOOP
      -- Delete output image
      IF generations_to_delete.output_image_path IS NOT NULL THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'generated-images' 
        AND name = generations_to_delete.output_image_path;
      END IF;
      
      -- Delete input image
      IF generations_to_delete.input_image_path IS NOT NULL THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'input-images' 
        AND name = generations_to_delete.input_image_path;
      END IF;
      
      -- Delete record
      DELETE FROM public.generation_history 
      WHERE id = generations_to_delete.id;
    END LOOP;
  END LOOP;
END;
$$;
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Custom Models table
CREATE TABLE public.user_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false
);

-- Only one active model per user
CREATE UNIQUE INDEX unique_active_model_per_user 
  ON public.user_models (user_id, is_active) 
  WHERE is_active = true;

ALTER TABLE public.user_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own models"
  ON public.user_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own models"
  ON public.user_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own models"
  ON public.user_models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own models"
  ON public.user_models FOR DELETE
  USING (auth.uid() = user_id);

-- Model Photos table
CREATE TABLE public.model_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.user_models(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  photo_order INT NOT NULL CHECK (photo_order >= 1 AND photo_order <= 3),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (model_id, photo_order)
);

ALTER TABLE public.model_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of own models"
  ON public.model_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_models
      WHERE user_models.id = model_photos.model_id
        AND user_models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos to own models"
  ON public.model_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_models
      WHERE user_models.id = model_photos.model_id
        AND user_models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own models"
  ON public.model_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_models
      WHERE user_models.id = model_photos.model_id
        AND user_models.user_id = auth.uid()
    )
  );

-- User Preferences table
CREATE TABLE public.model_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_model_id TEXT NOT NULL,
  photo_style TEXT NOT NULL CHECK (photo_style IN ('selfie', 'studio')),
  background_type TEXT CHECK (background_type IN ('white', 'outdoor', 'studio-grey', 'home-interior')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.model_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.model_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own preferences"
  ON public.model_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.model_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Generation History table (analytics)
CREATE TABLE public.generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  style_used TEXT NOT NULL,
  background_used TEXT,
  input_image_path TEXT,
  output_image_path TEXT,
  generation_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation history"
  ON public.generation_history FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_models_user_id ON public.user_models(user_id);
CREATE INDEX idx_model_photos_model_id ON public.model_photos(model_id);
CREATE INDEX idx_generation_history_user_id ON public.generation_history(user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('model-photos', 'model-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('generated-images', 'generated-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('input-images', 'input-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for model-photos bucket
CREATE POLICY "Users can upload own model photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'model-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own model photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'model-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own model photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'model-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for generated-images bucket
CREATE POLICY "Users can upload own generated images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own generated images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for input-images bucket
CREATE POLICY "Users can upload own input images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'input-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own input images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'input-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own input images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'input-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_active_model(p_user_id UUID)
RETURNS TABLE (
  model_id UUID,
  model_name TEXT,
  photo_paths TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.id,
    um.name,
    ARRAY_AGG(mp.storage_path ORDER BY mp.photo_order) AS photo_paths
  FROM public.user_models um
  LEFT JOIN public.model_photos mp ON mp.model_id = um.id
  WHERE um.user_id = p_user_id AND um.is_active = true
  GROUP BY um.id, um.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_active_model(p_user_id UUID, p_model_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate all models for user
  UPDATE public.user_models
  SET is_active = false
  WHERE user_id = p_user_id;
  
  -- Activate selected model
  UPDATE public.user_models
  SET is_active = true
  WHERE id = p_model_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;
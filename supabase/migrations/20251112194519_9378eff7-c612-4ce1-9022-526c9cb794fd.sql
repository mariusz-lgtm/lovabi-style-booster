-- Add admin policies for viewing all data

-- Admins can view all profiles
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (has_role(auth.uid(), 'admin'));

-- Admins can view all generation history
create policy "Admins can view all generation history"
on public.generation_history for select
to authenticated
using (has_role(auth.uid(), 'admin'));

-- Admins can view all user models
create policy "Admins can view all user models"
on public.user_models for select
to authenticated
using (has_role(auth.uid(), 'admin'));

-- Admins can view all model photos
create policy "Admins can view all model photos"
on public.model_photos for select
to authenticated
using (has_role(auth.uid(), 'admin'));
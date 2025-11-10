-- Make generated-images bucket public for easy display
-- This allows enhanced images to be displayed directly in the browser
-- while keeping user uploads (model-photos, input-images) private
UPDATE storage.buckets 
SET public = true 
WHERE id = 'generated-images';
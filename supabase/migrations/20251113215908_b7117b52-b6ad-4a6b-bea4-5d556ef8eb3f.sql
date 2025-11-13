-- Make generated-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'generated-images';
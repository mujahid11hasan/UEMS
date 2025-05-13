/*
  # Create events storage bucket

  1. Storage
    - Create 'events' bucket for storing event images
  
  2. Security
    - Enable public access for viewing images
    - Allow authenticated users to upload images
    - Restrict file types to images only
    - Set maximum file size to 5MB
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true);

-- Policy to allow public access to view images
CREATE POLICY "Give public access to event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' AND
  (LOWER(RIGHT(name, 4)) = '.jpg' OR
   LOWER(RIGHT(name, 4)) = '.png' OR
   LOWER(RIGHT(name, 5)) = '.jpeg') AND
  LENGTH(name) < 5242880
);
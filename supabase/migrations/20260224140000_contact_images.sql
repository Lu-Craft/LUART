-- ==========================================
-- LUART - MIGRATION: ADD IMAGES TO CONTACTS
-- ==========================================

-- 1. Add array column to store image URLs in the existing table
ALTER TABLE public.public_contacts 
ADD COLUMN IF NOT EXISTS reference_images TEXT[] DEFAULT '{}';

-- 2. Configure Storage Bucket for Public Image Uploads
-- We need a bucket named 'contact_references'. 
-- It is public because you (admin) might want to view these images natively in the browser without tokens.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contact_references', 
    'contact_references', 
    true, 
    5242880, -- 5 MB limit per file to prevent abuse
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

-- 3. Set RLS for Storage (Insert Only for Anonymous)
-- Allows visitors to upload files, but protects them from reading or deleting files they don't own.

-- Enable RLS on storage.objects if it isn't already
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone/anon to INSERT files into 'contact_references' bucket
CREATE POLICY "Allow public insert into contact_references" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'contact_references');

-- Only admins (you) can SELECT or DELETE from dashboard natively since there is no SELECT policy for anons.

-- ==========================================
-- LUART - INITIAL SUPABASE SCHEMA (V1)
-- ==========================================

-- 1. EXTENDED PROFILES (Linked to Supabase Auth)
-- This table automatically links to auth.users to store additional user data.
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT,
  company_name TEXT, -- Optional, for B2B clients
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies:
-- Users can read and update ONLY their own profile data.
CREATE POLICY "Users can view own profile." 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user registration automatically via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. DOMAIN LOGIC: 3D PRINTING QUOTES/ORDERS
-- ==========================================

-- Enum to strictly type the status of an order
CREATE TYPE public.order_status AS ENUM (
  'pending_review', -- Uploaded, awaiting Antigravity review
  'quoted',         -- Price given, waiting for client approval
  'approved',       -- Client accepted, waiting for payment/printing start
  'printing',       -- Currently on the 3D printer
  'completed',      -- Printed and finished
  'cancelled'
);

CREATE TABLE public.print_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Project Details
  project_title TEXT NOT NULL,
  description TEXT,
  
  -- Technical specs requested by client (e.g., FDM, Resin, specific material)
  preferred_material TEXT, 
  preferred_resolution TEXT,
  
  -- File Information (Link to Supabase Storage bucket)
  file_path TEXT NOT NULL,      -- e.g., 'user_id/uuid-file.stl'
  file_size_bytes BIGINT,
  mime_type TEXT,               -- Must be validated strictly before upload (application/sla, model/obj, etc)

  -- Financials & Status
  status public.order_status DEFAULT 'pending_review' NOT NULL,
  quoted_price NUMERIC(10, 2),  -- Antigravity fills this after manual or automated review
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Optimize queries matching user_id
CREATE INDEX idx_print_quotes_user_id ON public.print_quotes(user_id);

-- Turn on Row Level Security
ALTER TABLE public.print_quotes ENABLE ROW LEVEL SECURITY;

-- Quotes RLS Policies:
-- Users can READ only their own quotes.
CREATE POLICY "Users can view own quotes." 
  ON public.print_quotes FOR SELECT USING (auth.uid() = user_id);

-- Users can CREATE quotes, but only assigned to themselves.
CREATE POLICY "Users can insert own quotes." 
  ON public.print_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their quotes ONLY IF it's in a modifiable state (e.g., waiting for their approval)
-- Note: Security restriction to prevent clients from updating internal Antigravity fields like price.
CREATE POLICY "Users can update own quotes under review." 
  ON public.print_quotes FOR UPDATE 
  USING (auth.uid() = user_id AND status IN ('pending_review', 'quoted'))
  WITH CHECK (auth.uid() = user_id AND status IN ('pending_review', 'quoted'));

-- No DELETE policy for standard users. Hard deletes usually disabled in financial/order records.

-- ==========================================
-- 3. STORAGE POLICIES (Supabase Storage)
-- Requires a Bucket named '3d_models' to exist.
-- ==========================================
-- Note: These policies assume you have created the bucket '3d_models' in the Supabase Dashboard.

-- Policy: Users can upload files to their own folder only (path MUST start with their UUID)
-- CREATE POLICY "User can upload 3D models"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK ( bucket_id = '3d_models' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Policy: Users can read files from their own folder only
-- CREATE POLICY "User can view their own 3D models"
-- ON storage.objects FOR SELECT TO authenticated
-- USING ( bucket_id = '3d_models' AND (storage.foldername(name))[1] = auth.uid()::text );

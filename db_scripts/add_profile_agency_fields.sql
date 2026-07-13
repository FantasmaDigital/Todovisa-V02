-- Migration: Add fields for agency logo/photo, contact, bio, and staff count to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS staff_size INTEGER;

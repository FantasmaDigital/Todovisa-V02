-- Migration: Add user_id column to agent_applications table
-- This links the agent application to the registered user account in Supabase auth

ALTER TABLE public.agent_applications 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

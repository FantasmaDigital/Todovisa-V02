-- Migration: Add administrative fields to agent_applications table
-- Allows admins to write review comments (admin_notes), approve/reject, and audit changes

ALTER TABLE public.agent_applications 
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

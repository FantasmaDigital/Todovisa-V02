-- Migration: Add application_type column to agent_applications
-- 'individual' = independent consultant -> role 'agent'
-- 'agency'     = travel agency B2B       -> role 'agency'

ALTER TABLE public.agent_applications
ADD COLUMN IF NOT EXISTS application_type text
  DEFAULT 'individual'
  CHECK (application_type IN ('individual', 'agency'));

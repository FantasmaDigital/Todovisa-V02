-- Migration: Add payout_settings column to agent_applications table
-- This allows agents/partners to save their preferred payment method (PayPal or Bank Transfer)

ALTER TABLE public.agent_applications 
ADD COLUMN IF NOT EXISTS payout_settings jsonb DEFAULT '{}'::jsonb;

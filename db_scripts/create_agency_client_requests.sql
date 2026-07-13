-- Migration: Agency Client Request workflow
-- When a user contracts a B2B agency, a request is created here.
-- The agency then assigns one of their team members, enabling the chat.

CREATE TABLE IF NOT EXISTS public.agency_client_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_member_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'closed')),
  client_name text,
  client_email text,
  agent_hired_id text,   -- original dummy agent id the user clicked on (for display)
  agency_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_client_requests ENABLE ROW LEVEL SECURITY;

-- Agency can see all requests directed to them and update them (assign member)
DROP POLICY IF EXISTS "Agency can manage their client requests" ON public.agency_client_requests;
CREATE POLICY "Agency can manage their client requests"
  ON public.agency_client_requests
  FOR ALL
  USING (auth.uid() = agency_id);

-- Client can see their own request(s)
DROP POLICY IF EXISTS "Client can view their own requests" ON public.agency_client_requests;
CREATE POLICY "Client can view their own requests"
  ON public.agency_client_requests
  FOR SELECT
  USING (auth.uid() = client_id);

-- Authenticated users can insert (client contracts agency)
DROP POLICY IF EXISTS "Authenticated users can create requests" ON public.agency_client_requests;
CREATE POLICY "Authenticated users can create requests"
  ON public.agency_client_requests
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Assigned member can read the request
DROP POLICY IF EXISTS "Assigned member can view request" ON public.agency_client_requests;
CREATE POLICY "Assigned member can view request"
  ON public.agency_client_requests
  FOR SELECT
  USING (auth.uid() = assigned_member_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_agency_client_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_agency_client_requests_updated_at ON public.agency_client_requests;
CREATE TRIGGER set_agency_client_requests_updated_at
  BEFORE UPDATE ON public.agency_client_requests
  FOR EACH ROW EXECUTE PROCEDURE public.update_agency_client_requests_timestamp();

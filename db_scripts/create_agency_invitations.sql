-- ============================================================
-- INVITACIONES DE AGENCIA
-- Maneja los tokens de invitación generados por agencias para
-- reclutar nuevos asesores.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agency_invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  token       TEXT        NOT NULL UNIQUE,
  status      TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_agency_invitations_agency_id ON public.agency_invitations (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_token     ON public.agency_invitations (token);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- La agencia ve sus propias invitaciones
CREATE POLICY "Agency views own invitations"
  ON public.agency_invitations FOR SELECT
  TO authenticated
  USING (auth.uid() = agency_id);

-- La agencia crea invitaciones
CREATE POLICY "Agency creates invitations"
  ON public.agency_invitations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = agency_id);

-- La agencia actualiza sus invitaciones
CREATE POLICY "Agency updates own invitations"
  ON public.agency_invitations FOR UPDATE
  TO authenticated
  USING (auth.uid() = agency_id);

-- Acceso público para leer el token al unirse
CREATE POLICY "Public reads invitation token"
  ON public.agency_invitations FOR SELECT
  TO public
  USING (status = 'pending' AND expires_at > NOW());

GRANT SELECT, INSERT, UPDATE ON public.agency_invitations TO authenticated;
GRANT SELECT ON public.agency_invitations TO public;
GRANT ALL ON public.agency_invitations TO service_role;

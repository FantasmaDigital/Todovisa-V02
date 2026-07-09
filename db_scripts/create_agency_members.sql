-- ============================================================
-- MIEMBROS DE AGENCIA
-- Relaciona consultores con la agencia que los tiene activos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agency_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role TEXT        NOT NULL DEFAULT 'consultant'
    CHECK (member_role IN ('consultant','supervisor')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_agency_member UNIQUE (agency_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_members_agency_id ON public.agency_members (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_member_id ON public.agency_members (member_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- Agencia ve sus propios miembros
CREATE POLICY "Agency views own members"
  ON public.agency_members FOR SELECT
  TO authenticated
  USING (auth.uid() = agency_id);

-- Miembro puede verse a sí mismo dentro de una agencia
CREATE POLICY "Member views own membership"
  ON public.agency_members FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

-- Agencia puede insertar / eliminar miembros propios
CREATE POLICY "Agency manages own members"
  ON public.agency_members FOR ALL
  TO authenticated
  USING (auth.uid() = agency_id);

-- Admin gestiona todo
CREATE POLICY "Admin manages all members"
  ON public.agency_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','moderator')
    )
  );

GRANT SELECT, INSERT, DELETE ON public.agency_members TO authenticated;
GRANT ALL ON public.agency_members TO service_role;

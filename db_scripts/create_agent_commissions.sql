-- ============================================================
-- COMISIONES DE AGENTES / EMPRESAS
-- Registra cada comisión devengada por un agente o agencia
-- al completar un caso de cliente.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_folio      TEXT        NOT NULL,                          -- Folio TV-YYYY-NNNNNN del caso
  client_name       TEXT        NOT NULL,                          -- Nombre del cliente
  service_type      TEXT        NOT NULL                           -- Tipo de servicio prestado
    CHECK (service_type IN ('visa_us','visa_uk','vipro','full_service','other')),
  gross_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,              -- Monto total cobrado al cliente (USD)
  commission_rate   NUMERIC(5,2)  NOT NULL DEFAULT 15.00,          -- Porcentaje de comisión acordado
  commission_amount NUMERIC(10,2) GENERATED ALWAYS AS              -- Calculado automáticamente
    (ROUND(gross_amount * commission_rate / 100, 2)) STORED,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','paid')),
  paid_at           TIMESTAMPTZ,                                   -- Fecha de pago efectivo
  notes             TEXT,                                          -- Observaciones internas
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER set_commissions_updated_at
  BEFORE UPDATE ON public.agent_commissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id  ON public.agent_commissions (agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status     ON public.agent_commissions (status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.agent_commissions (created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

-- Agente/empresa ve SOLO sus propias comisiones
CREATE POLICY "Agents view own commissions"
  ON public.agent_commissions FOR SELECT
  TO authenticated
  USING (auth.uid() = agent_id);

-- Admin puede ver TODAS
CREATE POLICY "Admin views all commissions"
  ON public.agent_commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','moderator')
    )
  );

-- Solo admin puede insertar / actualizar / eliminar
CREATE POLICY "Admin manages commissions"
  ON public.agent_commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','moderator')
    )
  );

-- Grants
GRANT SELECT ON public.agent_commissions TO authenticated;
GRANT ALL    ON public.agent_commissions TO service_role;

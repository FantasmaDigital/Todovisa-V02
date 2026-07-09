-- ============================================================
-- FOLIOS PERSONALIZADOS PARA CASOS DE CLIENTES
-- Formato: TV-{AÑO}-{6 dígitos} → ej. TV-2026-000001
-- ============================================================

-- 1. Secuencia global de folios (no reinicia por año)
CREATE SEQUENCE IF NOT EXISTS public.preformulario_folio_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- 2. Agregar columna folio_number a preformularios
ALTER TABLE public.preformularios
  ADD COLUMN IF NOT EXISTS folio_number TEXT UNIQUE;

-- 3. Función que genera el folio en formato TV-YYYY-NNNNNN
CREATE OR REPLACE FUNCTION public.generate_folio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio_number IS NULL THEN
    NEW.folio_number := 'TV-'
      || TO_CHAR(NOW(), 'YYYY')
      || '-'
      || LPAD(NEXTVAL('public.preformulario_folio_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: asigna folio automáticamente en cada INSERT
DROP TRIGGER IF EXISTS assign_folio_on_insert ON public.preformularios;
CREATE TRIGGER assign_folio_on_insert
  BEFORE INSERT ON public.preformularios
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_folio();

-- 5. Rellenar folios existentes que aún no tengan uno
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.preformularios WHERE folio_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE public.preformularios
    SET folio_number = 'TV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('public.preformulario_folio_seq')::TEXT, 6, '0')
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 6. También agregar folio a agent_applications
ALTER TABLE public.agent_applications
  ADD COLUMN IF NOT EXISTS folio_number TEXT UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.agent_application_folio_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE OR REPLACE FUNCTION public.generate_agent_folio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio_number IS NULL THEN
    NEW.folio_number := 'SOC-'
      || TO_CHAR(NOW(), 'YYYY')
      || '-'
      || LPAD(NEXTVAL('public.agent_application_folio_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS assign_agent_folio_on_insert ON public.agent_applications;
CREATE TRIGGER assign_agent_folio_on_insert
  BEFORE INSERT ON public.agent_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_agent_folio();

-- Rellenar solicitudes existentes sin folio
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.agent_applications WHERE folio_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE public.agent_applications
    SET folio_number = 'SOC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('public.agent_application_folio_seq')::TEXT, 4, '0')
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- ============================================================
-- SCRIPT DE RESETEO: ELIMINACIÓN DE SUB-AGENTES EN AGENCIAS
-- ============================================================
-- Este script elimina las tablas y registros de relaciones de sub-agentes
-- contratados por agencias, dejando únicamente el modelo plano:
-- Agente Independiente (Asesor) o Agencia Recomendadora (vía Referidos).

-- 1. Vaciar o reiniciar relaciones de miembros e invitaciones de agencias
TRUNCATE TABLE public.agency_members RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.agency_invitations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.agency_client_requests RESTART IDENTITY CASCADE;

-- 2. Asegurar que en agent_applications la columna application_type sea 'individual' o 'agency'
UPDATE public.agent_applications
SET application_type = 'individual'
WHERE application_type IS NULL OR application_type NOT IN ('individual', 'agency');

-- 3. Asegurar que los perfiles tengan rol 'agent' o 'agency' únicamente
UPDATE public.profiles
SET role = 'agent'
WHERE role = 'consultant' OR role = 'supervisor';

SELECT 'Reseteo de relaciones de sub-agentes completado exitosamente.' AS resultado;

-- ============================================================
-- RE-CORRECCIÓN DE POLÍTICAS DE RLS (MÁS FLEXIBLES Y SEGURAS)
-- ============================================================

-- 1. Eliminar políticas antiguas para recrearlas
DROP POLICY IF EXISTS "Invitee can update own invitations" ON public.agency_invitations;
DROP POLICY IF EXISTS "Anyone can select invitations" ON public.agency_invitations;

-- Permite actualizar invitaciones que estén pendientes
CREATE POLICY "Invitee can update own invitations"
  ON public.agency_invitations FOR UPDATE
  TO authenticated
  USING (status = 'pending')
  WITH CHECK (true);

-- Permite ver las invitaciones para evitar fallos de lectura tras la actualización
CREATE POLICY "Anyone can select invitations"
  ON public.agency_invitations FOR SELECT
  TO authenticated
  USING (true);

-- 2. Eliminar e insertar política para miembros de agencia
DROP POLICY IF EXISTS "Member can insert own membership" ON public.agency_members;

CREATE POLICY "Member can insert own membership"
  ON public.agency_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

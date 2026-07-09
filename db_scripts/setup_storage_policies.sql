-- Migration: Setup RLS policies for storage bucket 'todovisa'
-- Nota: RLS ya está habilitado por defecto en storage.objects por Supabase.

-- 1. SELECT: Permitir lectura pública de archivos en el bucket 'todovisa'
DROP POLICY IF EXISTS "Permitir lectura publica en todovisa" ON storage.objects;
CREATE POLICY "Permitir lectura publica en todovisa" ON storage.objects
    FOR SELECT USING (bucket_id = 'todovisa');

-- 2. INSERT: Permitir subidas públicas de archivos en el bucket 'todovisa'
DROP POLICY IF EXISTS "Permitir insercion publica en todovisa" ON storage.objects;
CREATE POLICY "Permitir insercion publica en todovisa" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'todovisa');

-- 3. UPDATE: Permitir actualizaciones de archivos en el bucket 'todovisa'
DROP POLICY IF EXISTS "Permitir actualizacion publica en todovisa" ON storage.objects;
CREATE POLICY "Permitir actualizacion publica en todovisa" ON storage.objects
    FOR UPDATE USING (bucket_id = 'todovisa') WITH CHECK (bucket_id = 'todovisa');

-- 4. DELETE: Permitir eliminaciones de archivos en el bucket 'todovisa'
DROP POLICY IF EXISTS "Permitir eliminacion publica en todovisa" ON storage.objects;
CREATE POLICY "Permitir eliminacion publica en todovisa" ON storage.objects
    FOR DELETE USING (bucket_id = 'todovisa');

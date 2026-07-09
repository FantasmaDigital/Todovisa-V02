-- Migration: Update 'preformularios' table to support renewal flow details

ALTER TABLE public.preformularios
    ADD COLUMN IF NOT EXISTS intake_type VARCHAR(20) DEFAULT 'first',
    ADD COLUMN IF NOT EXISTS intake_visa_class VARCHAR(30) DEFAULT 'turismo',
    ADD COLUMN IF NOT EXISTS interview_waiver_eligible BOOLEAN DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.preformularios.intake_type IS 'Type of application: first time (first) or renewal (renewal)';
COMMENT ON COLUMN public.preformularios.intake_visa_class IS 'Objective class of visa: turismo, estudios, trabajo, transito';
COMMENT ON COLUMN public.preformularios.interview_waiver_eligible IS 'Indicates if the user qualifies for the interview waiver program (Dropbox/Buzón)';

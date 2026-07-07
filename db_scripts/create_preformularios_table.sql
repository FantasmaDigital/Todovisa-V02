-- SQL Script to create independent 'preformularios' table
-- This table is decoupled from VIPRO and handles progress and answers for full service clients.

-- Create table
CREATE TABLE IF NOT EXISTS public.preformularios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_country VARCHAR(10) NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_step INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure a user can only have one draft per country destination
    CONSTRAINT unique_user_country_preform UNIQUE (user_id, destination_country)
);

-- Comments for documentation
COMMENT ON TABLE public.preformularios IS 'Table storing progress and answers of pre-filling forms for full-service users, completely independent of VIPRO.';
COMMENT ON COLUMN public.preformularios.answers IS 'JSON storage for questions and user answers.';

-- Create automatic update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_preformularios_updated_at
    BEFORE UPDATE ON public.preformularios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.preformularios ENABLE ROW LEVEL SECURITY;

-- Create Security Policies (RLS)
-- 1. Users can select/view their own pre-forms
CREATE POLICY "Users can view their own preformularios" 
    ON public.preformularios 
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. Users can insert their own pre-forms
CREATE POLICY "Users can insert their own preformularios" 
    ON public.preformularios 
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own pre-forms
CREATE POLICY "Users can update their own preformularios" 
    ON public.preformularios 
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own pre-forms
CREATE POLICY "Users can delete their own preformularios" 
    ON public.preformularios 
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant privileges
GRANT ALL ON TABLE public.preformularios TO authenticated;
GRANT ALL ON TABLE public.preformularios TO service_role;

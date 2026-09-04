-- ==============================================================================
-- Migration: Criação responsável da tabela de compromissos (commitments)
-- ==============================================================================

-- 1. Cria a tabela commitments se não existir
CREATE TABLE IF NOT EXISTS public.commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' ou 'completed'
    original_date DATE,
    original_time TEXT,
    reschedule_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Adiciona as colunas caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.commitments ADD COLUMN IF NOT EXISTS original_date DATE;
ALTER TABLE public.commitments ADD COLUMN IF NOT EXISTS original_time TEXT;
ALTER TABLE public.commitments ADD COLUMN IF NOT EXISTS reschedule_history JSONB DEFAULT '[]'::jsonb;

-- 2. Ativa Row Level Security (RLS) para proteção de dados do usuário
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "Users can view their own commitments" ON public.commitments;
CREATE POLICY "Users can view their own commitments"
    ON public.commitments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own commitments" ON public.commitments;
CREATE POLICY "Users can insert their own commitments"
    ON public.commitments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own commitments" ON public.commitments;
CREATE POLICY "Users can update their own commitments"
    ON public.commitments FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own commitments" ON public.commitments;
CREATE POLICY "Users can delete their own commitments"
    ON public.commitments FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Índice para performance em consultas por usuário e data
CREATE INDEX IF NOT EXISTS idx_commitments_user_date ON public.commitments(user_id, date ASC);

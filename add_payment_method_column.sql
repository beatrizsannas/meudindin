-- ==============================================================================
-- Migration: Adicionar coluna payment_method na tabela transactions
-- Execute este script no SQL Editor do Supabase (Dashboard -> SQL Editor)
-- ==============================================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL;

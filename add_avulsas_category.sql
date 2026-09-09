-- ==============================================================================
-- Migration: Inserir categoria "Avulsas" para Despesas
-- Execute este script no SQL Editor do Supabase (Dashboard -> SQL Editor)
-- ==============================================================================

INSERT INTO public.categories (name, type, icon, color_theme)
SELECT 'Avulsas', 'expense', 'receipt_long', 'gray'
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE LOWER(name) = 'avulsas' AND type = 'expense'
);

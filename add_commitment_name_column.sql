-- Migration: add 'name' column to commitments table
-- Run this in your Supabase SQL editor

ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS name TEXT;

-- Existing rows will have name = NULL
-- The app displays NULL as "Sem nome"

-- ============================================================
-- Giro de Contas: tabela de registro paralelo de despesas
-- Não soma em nenhum relatório global do app
-- ============================================================

CREATE TABLE IF NOT EXISTS public.giro_contas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL DEFAULT 'Outros',
  date        DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para filtros por usuário + data
CREATE INDEX IF NOT EXISTS giro_contas_user_date_idx
  ON public.giro_contas(user_id, date DESC);

-- Row Level Security
ALTER TABLE public.giro_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own giro_contas"
  ON public.giro_contas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

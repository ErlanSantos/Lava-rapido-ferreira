-- ============================================================
-- NOVAS TABELAS — Lava-Rápido Ferreira
-- Execute este SQL no SQL Editor do Supabase
-- (adicional às tabelas existentes)
-- ============================================================

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  valor_dia NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de dias trabalhados (por funcionário)
CREATE TABLE IF NOT EXISTS dias_trabalhados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funcionario_id, data)
);

-- Tabela de pagamentos de funcionários (histórico)
CREATE TABLE IF NOT EXISTS pagamentos_func (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  dias_pagos INTEGER NOT NULL DEFAULT 0,
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_trabalhados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_func ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (para uso com anon key)
CREATE POLICY "Permitir tudo despesas" ON despesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo funcionarios" ON funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo dias_trabalhados" ON dias_trabalhados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo pagamentos_func" ON pagamentos_func FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE despesas;
ALTER PUBLICATION supabase_realtime ADD TABLE funcionarios;
ALTER PUBLICATION supabase_realtime ADD TABLE dias_trabalhados;
ALTER PUBLICATION supabase_realtime ADD TABLE pagamentos_func;

-- ============================================================
-- LAVA-RÁPIDO FERREIRA — Script de criação das tabelas
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  veiculo TEXT NOT NULL DEFAULT '',
  placa TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de fidelidade (1:1 com clientes)
CREATE TABLE IF NOT EXISTS fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL DEFAULT 0,
  lavagens_gratis INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id)
);

-- Tabela de comandas
CREATE TABLE IF NOT EXISTS comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_data JSONB NOT NULL DEFAULT '{}',
  servico TEXT NOT NULL DEFAULT '',
  valor_servico NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada')),
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_saida TIMESTAMPTZ,
  forma_pagamento TEXT,
  caixinha NUMERIC(10,2) NOT NULL DEFAULT 0,
  lavagem_gratis BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de consumos (itens de uma comanda)
CREATE TABLE IF NOT EXISTS consumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do recibo (singleton)
CREATE TABLE IF NOT EXISTS config_recibo (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nome_empresa TEXT NOT NULL DEFAULT 'Lava-Rápido Ferreira',
  cnpj TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEGURANÇA: Row Level Security (RLS)
-- ============================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_recibo ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (para uso com anon key — simplificado)
CREATE POLICY "Permitir tudo clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo servicos" ON servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo fidelidade" ON fidelidade FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo comandas" ON comandas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo consumos" ON consumos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo config_recibo" ON config_recibo FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME: Habilitar notificações em tempo real
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
ALTER PUBLICATION supabase_realtime ADD TABLE servicos;
ALTER PUBLICATION supabase_realtime ADD TABLE fidelidade;
ALTER PUBLICATION supabase_realtime ADD TABLE comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE consumos;
ALTER PUBLICATION supabase_realtime ADD TABLE config_recibo;

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_data ON comandas(data_entrada DESC);
CREATE INDEX IF NOT EXISTS idx_comandas_numero ON comandas(numero DESC);
CREATE INDEX IF NOT EXISTS idx_consumos_comanda ON consumos(comanda_id);
CREATE INDEX IF NOT EXISTS idx_fidelidade_cliente ON fidelidade(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_placa ON clientes(placa);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

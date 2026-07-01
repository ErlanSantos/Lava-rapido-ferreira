-- ============================================================
-- MIGRAÇÃO: Tabela de Consumos + VIEW de Saldo dos Mensalistas
-- Execute no Supabase SQL Editor (Database > SQL Editor)
--
-- ATENÇÃO: Este script NÃO altera (ALTER) nem apaga (DROP)
-- nenhuma tabela existente. Apenas CRIA coisas novas.
-- ============================================================

-- 1. Tabela mensalista_consumos (se não existir)
--    Produtos/serviços extras adicionados diretamente ao mensalista
--    (sem gerar comanda). Ex: enceramento extra, higienização avulsa.
CREATE TABLE IF NOT EXISTS mensalista_consumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensalista_id UUID NOT NULL REFERENCES mensalistas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'produto' CHECK (tipo IN ('produto', 'servico')),
  nome TEXT NOT NULL DEFAULT '',
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para mensalista_consumos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mensalista_consumos'
  ) THEN
    ALTER TABLE mensalista_consumos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Permitir tudo mensalista_consumos"
      ON mensalista_consumos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Realtime para mensalista_consumos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mensalista_consumos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mensalista_consumos;
  END IF;
END $$;

-- 2. VIEW vw_saldo_mensalistas (CREATE OR REPLACE — sem DROP)
--    Fórmula:
--      Total Acumulado Real = SUM(valor_servico das comandas finalizadas)
--                           + SUM(subtotal de mensalista_consumos)
--      Saldo Pendente Real  = Total Acumulado Real - SUM(pagamentos)
--    Filtros por mês: comandas(created_at), consumos(data), pagamentos(data_pagamento)
--    IMPORTANTE: comandas usa mensalista_id (coluna dedicada)
CREATE OR REPLACE VIEW vw_saldo_mensalistas AS
SELECT
  m.id AS mensalista_id,

  -- (a) Total em lavagens: valor_servico das comandas finalizadas do mensalista no mês
  COALESCE(
    (SELECT SUM(c.valor_servico)
     FROM comandas c
     WHERE c.mensalista_id = m.id
       AND c.status = 'finalizada'
       AND DATE_TRUNC('month', c.created_at AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    ), 0
  ) AS total_lavagens,

  -- (b) Quantidade de lavagens no mês
  COALESCE(
    (SELECT COUNT(*)
     FROM comandas c
     WHERE c.mensalista_id = m.id
       AND c.status = 'finalizada'
       AND DATE_TRUNC('month', c.created_at AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    ), 0
  ) AS quantidade_lavagens,

  -- (c) Extras diretos: subtotal de mensalista_consumos no mês
  COALESCE(
    (SELECT SUM(mc.subtotal)
     FROM mensalista_consumos mc
     WHERE mc.mensalista_id = m.id
       AND DATE_TRUNC('month', mc.data AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    ), 0
  ) AS total_extras,

  -- (d) TOTAL ACUMULADO REAL = (a) + (c)
  COALESCE(
    (SELECT SUM(c.valor_servico)
     FROM comandas c
     WHERE c.mensalista_id = m.id
       AND c.status = 'finalizada'
       AND DATE_TRUNC('month', c.created_at AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    ), 0
  ) +
  COALESCE(
    (SELECT SUM(mc.subtotal)
     FROM mensalista_consumos mc
     WHERE mc.mensalista_id = m.id
       AND DATE_TRUNC('month', mc.data AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    ), 0
  ) AS total_acumulado,

  -- (e) TOTAL PAGO no mês
  COALESCE(
    (SELECT SUM(pm.valor)
     FROM pagamentos_mensalistas pm
     WHERE pm.mensalista_id = m.id
       AND DATE_TRUNC('month', pm.data_pagamento AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    ), 0
  ) AS total_pago

FROM mensalistas m;

-- 2b. Garantir que o role anon (e authenticated) pode ler a VIEW
DO $$ BEGIN
  GRANT SELECT ON vw_saldo_mensalistas TO anon, authenticated;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'AVISO: Sem permissão para GRANT na VIEW. Execute manualmente:\n  GRANT SELECT ON vw_saldo_mensalistas TO anon, authenticated;';
END $$;

-- 2c. Habilitar RLS na VIEW + política permissiva (necessário em alguns setups Supabase)
DO $$ BEGIN
  ALTER VIEW vw_saldo_mensalistas SET (security_barrier = false);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'AVISO: Não foi possível alterar security_barrier da VIEW (ok se já definido).';
END $$;

-- 3. Função RPC para saldo individual (CREATE OR REPLACE — sem DROP)
--    Uso: SELECT * FROM fn_calc_saldo_mensalista('uuid-do-mensalista');
--         SELECT * FROM fn_calc_saldo_mensalista('uuid', '2025-05-01');
CREATE OR REPLACE FUNCTION fn_calc_saldo_mensalista(
  p_mensalista_id UUID,
  p_mes TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_lavagens NUMERIC,
  quantidade_lavagens BIGINT,
  total_extras NUMERIC,
  total_acumulado NUMERIC,
  total_pago NUMERIC,
  saldo_pendente NUMERIC
) AS $$
DECLARE
  v_mes DATE := DATE_TRUNC('month', COALESCE(p_mes::DATE, NOW()))::DATE;
BEGIN
  RETURN QUERY
  SELECT
    -- (a) Total em lavagens
    COALESCE((SELECT SUM(c.valor_servico)
      FROM comandas c
      WHERE c.mensalista_id = p_mensalista_id
        AND c.status = 'finalizada'
        AND DATE_TRUNC('month', c.created_at AT TIME ZONE 'America/Sao_Paulo') = v_mes
    ), 0)::NUMERIC,

    -- (b) Quantidade de lavagens
    (SELECT COUNT(*)
      FROM comandas c
      WHERE c.mensalista_id = p_mensalista_id
        AND c.status = 'finalizada'
        AND DATE_TRUNC('month', c.created_at AT TIME ZONE 'America/Sao_Paulo') = v_mes
    )::BIGINT,

    -- (c) Total de extras diretos
    COALESCE((SELECT SUM(mc.subtotal)
      FROM mensalista_consumos mc
      WHERE mc.mensalista_id = p_mensalista_id
        AND DATE_TRUNC('month', mc.data AT TIME ZONE 'America/Sao_Paulo') = v_mes
    ), 0)::NUMERIC,

    -- (d) TOTAL ACUMULADO REAL = (a) + (c)
    (
      COALESCE((SELECT SUM(c.valor_servico)
        FROM comandas c
        WHERE c.mensalista_id = p_mensalista_id
          AND c.status = 'finalizada'
          AND DATE_TRUNC('month', c.created_at AT TIME ZONE 'America/Sao_Paulo') = v_mes
      ), 0) +
      COALESCE((SELECT SUM(mc.subtotal)
        FROM mensalista_consumos mc
        WHERE mc.mensalista_id = p_mensalista_id
          AND DATE_TRUNC('month', mc.data AT TIME ZONE 'America/Sao_Paulo') = v_mes
      ), 0)
    )::NUMERIC,

    -- (e) TOTAL PAGO
    COALESCE((SELECT SUM(pm.valor)
      FROM pagamentos_mensalistas pm
      WHERE pm.mensalista_id = p_mensalista_id
        AND DATE_TRUNC('month', pm.data_pagamento AT TIME ZONE 'America/Sao_Paulo') = v_mes
    ), 0)::NUMERIC,

    -- (f) SALDO PENDENTE REAL = (d) - (e)
    (
      COALESCE((SELECT SUM(c.valor_servico)
        FROM comandas c
        WHERE c.mensalista_id = p_mensalista_id
          AND c.status = 'finalizada'
          AND DATE_TRUNC('month', c.created_at AT TIME ZONE 'America/Sao_Paulo') = v_mes
      ), 0) +
      COALESCE((SELECT SUM(mc.subtotal)
        FROM mensalista_consumos mc
        WHERE mc.mensalista_id = p_mensalista_id
          AND DATE_TRUNC('month', mc.data AT TIME ZONE 'America/Sao_Paulo') = v_mes
      ), 0)
      -
      COALESCE((SELECT SUM(pm.valor)
        FROM pagamentos_mensalistas pm
        WHERE pm.mensalista_id = p_mensalista_id
          AND DATE_TRUNC('month', pm.data_pagamento AT TIME ZONE 'America/Sao_Paulo') = v_mes
      ), 0)
    )::NUMERIC;
END;
$$ LANGUAGE plpgsql STABLE;

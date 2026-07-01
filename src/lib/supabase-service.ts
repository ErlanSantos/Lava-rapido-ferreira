// Camada de serviço Supabase — substitui todas as operações localStorage
// Todas as funções são async e usam o cliente Supabase
import { getSupabaseClient } from "./supabase";
import type {
  Cliente,
  Comanda,
  Consumo,
  Produto,
  Servico,
  Fidelidade,
  ConfiguracoesRecibo,
  Despesa,
  Funcionario,
  DiaTrabalhado,
  PagamentoFunc,
  Mensalista,
  PagamentoMensalista,
  SaldoMensalista,
  ConsumoMensalista,
} from "./types";

// ============================================================
//  AUXILIARES
// ============================================================

/** Converte um registro do banco para a interface Cliente */
function rowToCliente(row: Record<string, unknown>): Cliente {
  return {
    id: row.id as string,
    nome: (row.nome as string) || "",
    telefone: (row.telefone as string) || "",
    veiculo: (row.veiculo as string) || "",
    placa: (row.placa as string) || "",
  };
}

/** Converte um registro do banco para a interface Produto */
function rowToProduto(row: Record<string, unknown>): Produto {
  return {
    id: row.id as string,
    nome: (row.nome as string) || "",
    preco: Number(row.preco) || 0,
    ativo: Boolean(row.ativo),
  };
}

/** Converte um registro do banco para a interface Servico */
function rowToServico(row: Record<string, unknown>): Servico {
  return {
    id: row.id as string,
    nome: (row.nome as string) || "",
    valor: Number(row.valor) || 0,
    ativo: Boolean(row.ativo),
  };
}

/** Converte um registro do banco para a interface Fidelidade */
function rowToFidelidade(row: Record<string, unknown>): Fidelidade {
  return {
    clienteId: row.cliente_id as string,
    pontos: Number(row.pontos) || 0,
    lavagensGratis: Number(row.lavagens_gratis) || 0,
  };
}

// ============================================================
//  CLIENTES
// ============================================================

export async function fetchClientes(): Promise<Cliente[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("clientes").select("*").order("nome");
  if (error) {
    console.error("Erro ao buscar clientes:", error.message);
    return [];
  }
  return (data || []).map(rowToCliente);
}

export async function insertCliente(cliente: Cliente): Promise<Cliente | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("clientes")
    .upsert({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      veiculo: cliente.veiculo,
      placa: cliente.placa,
    })
    .select()
    .single();
  if (error) {
    console.error("Erro ao inserir cliente:", error.message);
    return null;
  }
  return rowToCliente(data);
}

export async function updateCliente(
  id: string,
  dados: Partial<Cliente>
): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const row: Record<string, unknown> = {};
  if (dados.nome !== undefined) row.nome = dados.nome;
  if (dados.telefone !== undefined) row.telefone = dados.telefone;
  if (dados.veiculo !== undefined) row.veiculo = dados.veiculo;
  if (dados.placa !== undefined) row.placa = dados.placa;
  row.updated_at = new Date().toISOString();
  const { error } = await sb.from("clientes").update(row).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar cliente:", error.message);
    return false;
  }
  return true;
}

export async function deleteCliente(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("clientes").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir cliente:", error.message);
    return false;
  }
  return true;
}

// ============================================================
//  PRODUTOS
// ============================================================

export async function fetchProdutos(): Promise<Produto[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("produtos").select("*").order("nome");
  if (error) {
    console.error("Erro ao buscar produtos:", error.message);
    return [];
  }
  return (data || []).map(rowToProduto);
}

export async function insertProduto(produto: Produto): Promise<Produto | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("produtos")
    .insert({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      ativo: produto.ativo,
    })
    .select()
    .single();
  if (error) {
    console.error("Erro ao inserir produto:", error.message);
    return null;
  }
  return rowToProduto(data);
}

export async function updateProduto(
  id: string,
  dados: Partial<Produto>
): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const row: Record<string, unknown> = {};
  if (dados.nome !== undefined) row.nome = dados.nome;
  if (dados.preco !== undefined) row.preco = dados.preco;
  if (dados.ativo !== undefined) row.ativo = dados.ativo;
  row.updated_at = new Date().toISOString();
  const { error } = await sb.from("produtos").update(row).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar produto:", error.message);
    return false;
  }
  return true;
}

export async function deleteProduto(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("produtos").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir produto:", error.message);
    return false;
  }
  return true;
}

// ============================================================
//  SERVIÇOS
// ============================================================

export async function fetchServicos(): Promise<Servico[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("servicos").select("*").order("nome");
  if (error) {
    console.error("Erro ao buscar serviços:", error.message);
    return [];
  }
  return (data || []).map(rowToServico);
}

export async function insertServico(servico: Servico): Promise<Servico | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("servicos")
    .insert({
      id: servico.id,
      nome: servico.nome,
      valor: servico.valor,
      ativo: servico.ativo,
    })
    .select()
    .single();
  if (error) {
    console.error("Erro ao inserir serviço:", error.message);
    return null;
  }
  return rowToServico(data);
}

export async function updateServico(
  id: string,
  dados: Partial<Servico>
): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const row: Record<string, unknown> = {};
  if (dados.nome !== undefined) row.nome = dados.nome;
  if (dados.valor !== undefined) row.valor = dados.valor;
  if (dados.ativo !== undefined) row.ativo = dados.ativo;
  row.updated_at = new Date().toISOString();
  const { error } = await sb.from("servicos").update(row).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar serviço:", error.message);
    return false;
  }
  return true;
}

export async function deleteServico(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("servicos").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir serviço:", error.message);
    return false;
  }
  return true;
}

// ============================================================
//  FIDELIDADE
// ============================================================

export async function fetchFidelidade(): Promise<Fidelidade[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("fidelidade").select("*");
  if (error) {
    console.error("Erro ao buscar fidelidade:", error.message);
    return [];
  }
  return (data || []).map(rowToFidelidade);
}

export async function fetchFidelidadeCliente(
  clienteId: string
): Promise<Fidelidade | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("fidelidade")
    .select("*")
    .eq("cliente_id", clienteId)
    .single();
  if (error) return null;
  return rowToFidelidade(data);
}

export async function upsertFidelidade(
  clienteId: string,
  pontos: number,
  lavagensGratis: number
): Promise<Fidelidade | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("fidelidade")
    .upsert(
      { cliente_id: clienteId, pontos, lavagens_gratis: lavagensGratis },
      { onConflict: "cliente_id" }
    )
    .select()
    .single();
  if (error) {
    console.error("Erro ao salvar fidelidade:", error.message);
    return null;
  }
  return rowToFidelidade(data);
}

// ============================================================
//  COMANDAS (inclui consumos como tabela separada)
// ============================================================

/** Busca todas as comandas com seus consumos */
export async function fetchComandas(): Promise<Comanda[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data: comandasData, error } = await sb
    .from("comandas")
    .select("*")
    .order("numero", { ascending: false });
  if (error) {
    console.error("Erro ao buscar comandas:", error.message);
    return [];
  }

  // Buscar todos os consumos
  const { data: consumosData } = await sb.from("consumos").select("*");

  const consumosMap = new Map<string, Consumo[]>();
  if (consumosData) {
    for (const c of consumosData) {
      const comandaId = c.comanda_id as string;
      if (!consumosMap.has(comandaId)) consumosMap.set(comandaId, []);
      consumosMap.get(comandaId)!.push({
        id: c.id as string,
        nome: (c.nome as string) || "",
        quantidade: Number(c.quantidade) || 1,
        valorUnitario: Number(c.valor_unitario) || 0,
        subtotal: Number(c.subtotal) || 0,
      });
    }
  }

  return (comandasData || []).map((row) => {
    const clienteData = row.cliente_data as Record<string, unknown> | null;
    return {
      id: row.id as string,
      numero: Number(row.numero) || 0,
      cliente: clienteData
        ? {
            id: (clienteData.id as string) || "",
            nome: (clienteData.nome as string) || "",
            telefone: (clienteData.telefone as string) || "",
            veiculo: (clienteData.veiculo as string) || "",
            placa: (clienteData.placa as string) || "",
          }
        : {
            id: "",
            nome: "",
            telefone: "",
            veiculo: "",
            placa: "",
          },
      servico: (row.servico as string) || "",
      valorServico: Number(row.valor_servico) || 0,
      consumos: consumosMap.get(row.id as string) || [],
      total: Number(row.total) || 0,
      status: (row.status as "em_andamento" | "finalizada") || "em_andamento",
      dataEntrada: (row.data_entrada as string) || new Date().toISOString(),
      dataSaida: (row.data_saida as string) || undefined,
      formaPagamento: (row.forma_pagamento as string) || undefined,
      caixinha: Number(row.caixinha) || 0,
      lavagemGratis: Boolean(row.lavagem_gratis),
      mensalista: Boolean(row.mensalista),
      mensalistaId: (row.mensalista_id as string) || undefined,
    };
  });
}

/** Insere uma nova comanda no banco */
export async function insertComanda(comanda: Comanda): Promise<Comanda | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("comandas")
    .insert({
      id: comanda.id,
      numero: comanda.numero,
      // Mensalista: cliente_id = null, mensalista_id = UUID
      // Avulso:    cliente_id = UUID, mensalista_id = null
      cliente_id: comanda.mensalista ? null : comanda.cliente.id,
      cliente_data: comanda.cliente, // snapshot JSONB
      servico: comanda.servico,
      valor_servico: comanda.valorServico,
      total: comanda.total,
      status: comanda.status,
      data_entrada: comanda.dataEntrada,
      data_saida: comanda.dataSaida || null,
      forma_pagamento: comanda.formaPagamento || null,
      caixinha: comanda.caixinha || 0,
      lavagem_gratis: comanda.lavagemGratis || false,
      mensalista: comanda.mensalista || false,
      mensalista_id: comanda.mensalistaId || null,
    })
    .select()
    .single();
  if (error) {
    console.error("Erro ao inserir comanda:", error.message);
    return null;
  }
  return comanda; // retorna a comanda original (já com o formato correto)
}

/** Atualiza campos de uma comanda existente */
export async function updateComanda(
  id: string,
  dados: Partial<Comanda>
): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dados.status !== undefined) row.status = dados.status;
  if (dados.dataSaida !== undefined) row.data_saida = dados.dataSaida;
  if (dados.formaPagamento !== undefined) row.forma_pagamento = dados.formaPagamento;
  if (dados.caixinha !== undefined) row.caixinha = dados.caixinha;
  if (dados.total !== undefined) row.total = dados.total;
  if (dados.servico !== undefined) row.servico = dados.servico;
  if (dados.valorServico !== undefined) row.valor_servico = dados.valorServico;
  if (dados.cliente !== undefined) row.cliente_data = dados.cliente;
  const { error } = await sb.from("comandas").update(row).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar comanda:", error.message);
    return false;
  }
  return true;
}

/** Remove uma comanda e seus consumos (cascade) */
export async function deleteComanda(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  // Remove consumos primeiro (caso cascade não esteja configurado)
  await sb.from("consumos").delete().eq("comanda_id", id);
  const { error } = await sb.from("comandas").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir comanda:", error.message);
    return false;
  }
  return true;
}

/** Insere um consumo em uma comanda */
export async function insertConsumo(
  comandaId: string,
  consumo: Consumo
): Promise<Consumo | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("consumos")
    .insert({
      id: consumo.id,
      comanda_id: comandaId,
      nome: consumo.nome,
      quantidade: consumo.quantidade,
      valor_unitario: consumo.valorUnitario,
      subtotal: consumo.subtotal,
    })
    .select()
    .single();
  if (error) {
    console.error("Erro ao inserir consumo:", error.message);
    return null;
  }
  return consumo;
}

/** Remove um consumo */
export async function deleteConsumo(
  consumoId: string
): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("consumos").delete().eq("id", consumoId);
  if (error) {
    console.error("Erro ao excluir consumo:", error.message);
    return false;
  }
  return true;
}

/** Obtém o próximo número de comanda (max + 1) */
export async function fetchProximoNumero(): Promise<number> {
  const sb = getSupabaseClient();
  if (!sb) return 1;
  const { data, error } = await sb
    .from("comandas")
    .select("numero")
    .order("numero", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return 1;
  return Number(data[0].numero) + 1;
}

// ============================================================
//  CONFIGURAÇÕES DO RECIBO
// ============================================================

export async function fetchConfigRecibo(): Promise<ConfiguracoesRecibo> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { nomeEmpresa: "Lava-Rápido Ferreira", cnpj: "", endereco: "", telefone: "" };
  }
  const { data, error } = await sb.from("config_recibo").select("*").single();
  if (error || !data) {
    return { nomeEmpresa: "Lava-Rápido Ferreira", cnpj: "", endereco: "", telefone: "" };
  }
  return {
    nomeEmpresa: (data.nome_empresa as string) || "Lava-Rápido Ferreira",
    cnpj: (data.cnpj as string) || "",
    endereco: (data.endereco as string) || "",
    telefone: (data.telefone as string) || "",
  };
}

export async function upsertConfigRecibo(
  config: ConfiguracoesRecibo
): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("config_recibo").upsert(
    {
      id: 1,
      nome_empresa: config.nomeEmpresa,
      cnpj: config.cnpj,
      endereco: config.endereco,
      telefone: config.telefone,
    },
    { onConflict: "id" }
  );
  if (error) {
    console.error("Erro ao salvar config recibo:", error.message);
    return false;
  }
  return true;
}

// ============================================================
//  INICIALIZAÇÃO — criar tabelas e dados de semente
// ============================================================

/** SQL para criar todas as tabelas no Supabase */
export const SQL_CRIACAO_TABELAS = `
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

-- Tabela de mensalistas
CREATE TABLE IF NOT EXISTS mensalistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  veiculo TEXT NOT NULL DEFAULT '',
  placa TEXT NOT NULL DEFAULT '',
  valor_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  vencimento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'vencido')),
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna mensalista na tabela comandas (se não existir)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comandas' AND column_name = 'mensalista') THEN
    ALTER TABLE comandas ADD COLUMN mensalista BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Adicionar coluna mensalista_id na tabela comandas (se não existir)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comandas' AND column_name = 'mensalista_id') THEN
    ALTER TABLE comandas ADD COLUMN mensalista_id UUID REFERENCES mensalistas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_recibo ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (para uso com anon key)
CREATE POLICY "Permitir tudo clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo servicos" ON servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo fidelidade" ON fidelidade FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo comandas" ON comandas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo consumos" ON consumos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo config_recibo" ON config_recibo FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE mensalistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo mensalistas" ON mensalistas FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
ALTER PUBLICATION supabase_realtime ADD TABLE servicos;
ALTER PUBLICATION supabase_realtime ADD TABLE fidelidade;
ALTER PUBLICATION supabase_realtime ADD TABLE comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE consumos;
ALTER PUBLICATION supabase_realtime ADD TABLE config_recibo;
ALTER PUBLICATION supabase_realtime ADD TABLE despesas;
ALTER PUBLICATION supabase_realtime ADD TABLE funcionarios;
ALTER PUBLICATION supabase_realtime ADD TABLE dias_trabalhados;
ALTER PUBLICATION supabase_realtime ADD TABLE pagamentos_func;
ALTER PUBLICATION supabase_realtime ADD TABLE mensalistas;

-- ============================================================
-- TABELAS NOVAS: Despesas, Funcionários, Dias Trabalhados, Pagamentos
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

-- Tabela de dias trabalhados
CREATE TABLE IF NOT EXISTS dias_trabalhados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funcionario_id, data)
);

-- Tabela de pagamentos de mensalistas (histórico)
CREATE TABLE IF NOT EXISTS pagamentos_mensalistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensalista_id UUID NOT NULL REFERENCES mensalistas(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vencimento_anterior DATE NOT NULL,
  novo_vencimento DATE NOT NULL,
  observacao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pagamentos de funcionários
CREATE TABLE IF NOT EXISTS pagamentos_func (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  dias_pagos INTEGER NOT NULL DEFAULT 0,
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para novas tabelas
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_trabalhados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_func ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo despesas" ON despesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo funcionarios" ON funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo dias_trabalhados" ON dias_trabalhados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo pagamentos_func" ON pagamentos_func FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE pagamentos_mensalistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo pagamentos_mensalistas" ON pagamentos_mensalistas FOR ALL USING (true) WITH CHECK (true);

-- Realtime para pagamentos_mensalistas
ALTER PUBLICATION supabase_realtime ADD TABLE pagamentos_mensalistas;
`;

/** Insere dados de semente se as tabelas estiverem vazias */
export async function seedDados(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;

  // Verificar se já tem clientes
  const { count: countClientes } = await sb
    .from("clientes")
    .select("*", { count: "exact", head: true });

  if (!countClientes || countClientes === 0) {
    const clientesSeed = [
      { nome: "João Silva", telefone: "11999887766", veiculo: "Honda Civic 2022", placa: "ABC-1D23" },
      { nome: "Maria Oliveira", telefone: "11988776655", veiculo: "Toyota Corolla 2023", placa: "DEF-4G56" },
      { nome: "Carlos Santos", telefone: "21977665544", veiculo: "Fiat Pulse 2024", placa: "GHI-7J89" },
      { nome: "Ana Paula Souza", telefone: "31966554433", veiculo: "Jeep Compass 2023", placa: "JKL-0M12" },
      { nome: "Roberto Ferreira", telefone: "41955443322", veiculo: "Volkswagen T-Cross 2024", placa: "MNO-3P45" },
    ];
    await sb.from("clientes").insert(clientesSeed);
  }

  // Produtos
  const { count: countProdutos } = await sb
    .from("produtos")
    .select("*", { count: "exact", head: true });
  if (!countProdutos || countProdutos === 0) {
    await sb.from("produtos").insert([
      { nome: "Água", preco: 3.0, ativo: true },
      { nome: "Refrigerante", preco: 5.0, ativo: true },
      { nome: "Cerveja", preco: 8.0, ativo: true },
      { nome: "Salgado", preco: 6.0, ativo: true },
      { nome: "Refeição", preco: 18.0, ativo: true },
    ]);
  }

  // Serviços
  const { count: countServicos } = await sb
    .from("servicos")
    .select("*", { count: "exact", head: true });
  if (!countServicos || countServicos === 0) {
    await sb.from("servicos").insert([
      { nome: "Lavagem Simples", valor: 30, ativo: true },
      { nome: "Lavagem Completa", valor: 50, ativo: true },
      { nome: "Polimento", valor: 150, ativo: true },
      { nome: "Enceramento", valor: 80, ativo: true },
      { nome: "Higienização Interna", valor: 60, ativo: true },
      { nome: "Lavagem + Enceramento", valor: 100, ativo: true },
      { nome: "Polimento Simples", valor: 120, ativo: true },
      { nome: "Lavagem Motor", valor: 40, ativo: true },
    ]);
  }

  // Config do recibo
  const { count: countConfig } = await sb
    .from("config_recibo")
    .select("*", { count: "exact", head: true });
  if (!countConfig || countConfig === 0) {
    await sb.from("config_recibo").insert({
      id: 1,
      nome_empresa: "Lava-Rápido Ferreira",
      cnpj: "",
      endereco: "",
      telefone: "",
    });
  }
}

// ============================================================
//  DESPESAS
// ============================================================

function rowToDespesa(row: Record<string, unknown>): Despesa {
  return {
    id: row.id as string,
    descricao: (row.descricao as string) || "",
    valor: Number(row.valor) || 0,
    data: (row.data as string) || new Date().toISOString().split("T")[0],
  };
}

export async function fetchDespesas(): Promise<Despesa[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("despesas").select("*").order("data", { ascending: false });
  if (error) { console.error("Erro ao buscar despesas:", error.message); return []; }
  return (data || []).map(rowToDespesa);
}

export async function insertDespesa(despesa: Despesa): Promise<Despesa | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from("despesas").insert({
    id: despesa.id, descricao: despesa.descricao, valor: despesa.valor, data: despesa.data,
  }).select().single();
  if (error) { console.error("Erro ao inserir despesa:", error.message); return null; }
  return rowToDespesa(data);
}

export async function updateDespesa(id: string, dados: Partial<Despesa>): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dados.descricao !== undefined) row.descricao = dados.descricao;
  if (dados.valor !== undefined) row.valor = dados.valor;
  if (dados.data !== undefined) row.data = dados.data;
  const { error } = await sb.from("despesas").update(row).eq("id", id);
  if (error) { console.error("Erro ao atualizar despesa:", error.message); return false; }
  return true;
}

export async function deleteDespesa(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("despesas").delete().eq("id", id);
  if (error) { console.error("Erro ao excluir despesa:", error.message); return false; }
  return true;
}

// ============================================================
//  FUNCIONÁRIOS
// ============================================================

function rowToFuncionario(row: Record<string, unknown>): Funcionario {
  return {
    id: row.id as string,
    nome: (row.nome as string) || "",
    valorDia: Number(row.valor_dia) || 0,
    ativo: Boolean(row.ativo),
  };
}

export async function fetchFuncionarios(): Promise<Funcionario[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("funcionarios").select("*").order("nome");
  if (error) { console.error("Erro ao buscar funcionários:", error.message); return []; }
  return (data || []).map(rowToFuncionario);
}

export async function insertFuncionario(func: Funcionario): Promise<Funcionario | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from("funcionarios").insert({
    id: func.id, nome: func.nome, valor_dia: func.valorDia, ativo: func.ativo,
  }).select().single();
  if (error) { console.error("Erro ao inserir funcionário:", error.message); return null; }
  return rowToFuncionario(data);
}

export async function updateFuncionario(id: string, dados: Partial<Funcionario>): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dados.nome !== undefined) row.nome = dados.nome;
  if (dados.valorDia !== undefined) row.valor_dia = dados.valorDia;
  if (dados.ativo !== undefined) row.ativo = dados.ativo;
  const { error } = await sb.from("funcionarios").update(row).eq("id", id);
  if (error) { console.error("Erro ao atualizar funcionário:", error.message); return false; }
  return true;
}

export async function deleteFuncionario(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("funcionarios").delete().eq("id", id);
  if (error) { console.error("Erro ao excluir funcionário:", error.message); return false; }
  return true;
}

// ============================================================
//  DIAS TRABALHADOS
// ============================================================

function rowToDiaTrabalhado(row: Record<string, unknown>): DiaTrabalhado {
  return {
    id: row.id as string,
    funcionarioId: row.funcionario_id as string,
    data: (row.data as string) || "",
    pago: Boolean(row.pago),
  };
}

export async function fetchDiasTrabalhados(): Promise<DiaTrabalhado[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("dias_trabalhados").select("*").order("data", { ascending: false });
  if (error) { console.error("Erro ao buscar dias trabalhados:", error.message); return []; }
  return (data || []).map(rowToDiaTrabalhado);
}

export async function insertDiaTrabalhado(dia: DiaTrabalhado): Promise<DiaTrabalhado | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from("dias_trabalhados").upsert({
    id: dia.id, funcionario_id: dia.funcionarioId, data: dia.data, pago: dia.pago,
  }, { onConflict: "funcionario_id,data" }).select().single();
  if (error) { console.error("Erro ao inserir dia trabalhado:", error.message); return null; }
  return rowToDiaTrabalhado(data);
}

export async function updateDiaTrabalhado(id: string, pago: boolean): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("dias_trabalhados").update({ pago }).eq("id", id);
  if (error) { console.error("Erro ao atualizar dia trabalhado:", error.message); return false; }
  return true;
}

export async function marcarDiasComoPagos(funcionarioId: string, diasIds: string[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("dias_trabalhados").update({ pago: true }).in("id", diasIds);
  if (error) { console.error("Erro ao marcar dias como pagos:", error.message); return false; }
  return true;
}

export async function deleteDiaTrabalhado(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("dias_trabalhados").delete().eq("id", id);
  if (error) { console.error("Erro ao excluir dia trabalhado:", error.message); return false; }
  return true;
}

// ============================================================
//  PAGAMENTOS FUNCIONÁRIOS
// ============================================================

function rowToPagamentoFunc(row: Record<string, unknown>): PagamentoFunc {
  return {
    id: row.id as string,
    funcionarioId: row.funcionario_id as string,
    valor: Number(row.valor) || 0,
    diasPagos: Number(row.dias_pagos) || 0,
    dataPagamento: (row.data_pagamento as string) || new Date().toISOString(),
  };
}

export async function fetchPagamentosFunc(): Promise<PagamentoFunc[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("pagamentos_func").select("*").order("data_pagamento", { ascending: false });
  if (error) { console.error("Erro ao buscar pagamentos:", error.message); return []; }
  return (data || []).map(rowToPagamentoFunc);
}

export async function insertPagamentoFunc(pag: PagamentoFunc): Promise<PagamentoFunc | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from("pagamentos_func").insert({
    id: pag.id, funcionario_id: pag.funcionarioId, valor: pag.valor,
    dias_pagos: pag.diasPagos, data_pagamento: pag.dataPagamento,
  }).select().single();
  if (error) { console.error("Erro ao inserir pagamento:", error.message); return null; }
  return rowToPagamentoFunc(data);
}

/** Carrega todos os dados do banco de uma vez -- cada fetch independente */
export async function carregarTudo(): Promise<{
  clientes: Cliente[];
  comandas: Comanda[];
  produtos: Produto[];
  servicos: Servico[];
  fidelidades: Fidelidade[];
  despesas: Despesa[];
  funcionarios: Funcionario[];
  diasTrabalhados: DiaTrabalhado[];
  pagamentosFunc: PagamentoFunc[];
  mensalistas: Mensalista[];
  tabelasFaltantes: string[];
}> {
  const nomesTabelas = ["clientes", "comandas", "produtos", "servicos", "fidelidade", "despesas", "funcionarios", "dias_trabalhados", "pagamentos_func", "mensalistas"];
  const tabelasFaltantes: string[] = [];

  const results = await Promise.allSettled([
    fetchClientes(),
    fetchComandas(),
    fetchProdutos(),
    fetchServicos(),
    fetchFidelidade(),
    fetchDespesas(),
    fetchFuncionarios(),
    fetchDiasTrabalhados(),
    fetchPagamentosFunc(),
    fetchMensalistas(),
  ]);

  // Extrai resultados, tratando erros individualmente
  const extrair = <T,>(r: PromiseSettledResult<T>, fallback: T, nomeTabela: string): T => {
    if (r.status === "fulfilled") return r.value;
    const msg = r.reason?.message || String(r.reason);
    console.error(`[carregarTudo] Erro ${nomeTabela}:`, msg);
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      tabelasFaltantes.push(nomeTabela);
    }
    return fallback;
  };

  return {
    clientes: extrair(results[0], [], nomesTabelas[0]),
    comandas: extrair(results[1], [], nomesTabelas[1]),
    produtos: extrair(results[2], [], nomesTabelas[2]),
    servicos: extrair(results[3], [], nomesTabelas[3]),
    fidelidades: extrair(results[4], [], nomesTabelas[4]),
    despesas: extrair(results[5], [], nomesTabelas[5]),
    funcionarios: extrair(results[6], [], nomesTabelas[6]),
    diasTrabalhados: extrair(results[7], [], nomesTabelas[7]),
    pagamentosFunc: extrair(results[8], [], nomesTabelas[8]),
    mensalistas: extrair(results[9], [], nomesTabelas[9]),
    tabelasFaltantes,
  };
}

// ============================================================
//  MENSALISTAS
// ============================================================

function rowToMensalista(row: Record<string, unknown>): Mensalista {
  return {
    id: row.id as string,
    nome: (row.nome as string) || "",
    telefone: (row.telefone as string) || "",
    veiculo: (row.veiculo as string) || "",
    placa: (row.placa as string) || "",
    valorMensal: Number(row.valor_mensal) || 0,
    vencimento: (row.vencimento as string) || "",
    status: (row.status as "ativo" | "vencido") || "ativo",
    observacoes: (row.observacoes as string) || "",
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export async function fetchMensalistas(): Promise<Mensalista[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("mensalistas").select("*").order("nome");
  if (error) { console.error("Erro ao buscar mensalistas:", error.message); return []; }
  return (data || []).map(rowToMensalista);
}

export async function insertMensalista(m: Mensalista): Promise<Mensalista | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from("mensalistas").insert({
    id: m.id,
    nome: m.nome,
    telefone: m.telefone,
    veiculo: m.veiculo,
    placa: m.placa,
    valor_mensal: m.valorMensal,
    vencimento: m.vencimento,
    status: m.status,
    observacoes: m.observacoes,
  }).select().single();
  if (error) { console.error("Erro ao inserir mensalista:", error.message); return null; }
  return rowToMensalista(data);
}

export async function updateMensalista(id: string, dados: Partial<Mensalista>): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dados.nome !== undefined) row.nome = dados.nome;
  if (dados.telefone !== undefined) row.telefone = dados.telefone;
  if (dados.veiculo !== undefined) row.veiculo = dados.veiculo;
  if (dados.placa !== undefined) row.placa = dados.placa;
  if (dados.valorMensal !== undefined) row.valor_mensal = dados.valorMensal;
  if (dados.vencimento !== undefined) row.vencimento = dados.vencimento;
  if (dados.status !== undefined) row.status = dados.status;
  if (dados.observacoes !== undefined) row.observacoes = dados.observacoes;
  const { error } = await sb.from("mensalistas").update(row).eq("id", id);
  if (error) { console.error("Erro ao atualizar mensalista:", error.message); return false; }
  return true;
}

export async function deleteMensalista(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("mensalistas").delete().eq("id", id);
  if (error) { console.error("Erro ao excluir mensalista:", error.message); return false; }
  return true;
}

export async function registrarPagamentoMensalista(id: string): Promise<PagamentoMensalista | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  // Buscar dados atuais do mensalista
  const { data: mensalista, error: errBusca } = await sb.from("mensalistas").select("*").eq("id", id).single();
  if (errBusca || !mensalista) { console.error("Erro ao buscar mensalista para pagamento:", errBusca); return null; }

  const vencimentoAnterior = (mensalista.vencimento as string) || "";
  const valor = Number(mensalista.valor_mensal) || 0;

  // Avançar vencimento em 1 mês a partir da data atual de vencimento
  const dataAtual = new Date(vencimentoAnterior + "T12:00:00");
  dataAtual.setMonth(dataAtual.getMonth() + 1);
  const novoVencimento = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}-${String(dataAtual.getDate()).padStart(2, "0")}`;

  const agora = new Date().toISOString();

  // 1. Atualizar mensalista: status ativo + novo vencimento
  const { error: errUpdate } = await sb.from("mensalistas").update({
    status: "ativo",
    vencimento: novoVencimento,
    updated_at: agora,
  }).eq("id", id);
  if (errUpdate) { console.error("Erro ao atualizar mensalista após pagamento:", errUpdate.message); return null; }

  // 2. Salvar registro de pagamento na tabela pagamentos_mensalistas
  const pagamentoId = crypto.randomUUID();
  const { data: pagamentoData, error: errPag } = await sb.from("pagamentos_mensalistas").insert({
    id: pagamentoId,
    mensalista_id: id,
    valor,
    data_pagamento: agora,
    vencimento_anterior: vencimentoAnterior,
    novo_vencimento: novoVencimento,
    observacao: "Pagamento de mensalidade",
  }).select().single();
  if (errPag) { console.error("Erro ao salvar pagamento mensalista:", errPag.message); }

  return {
    id: pagamentoId,
    mensalistaId: id,
    valor,
    dataPagamento: agora,
    vencimentoAnterior,
    novoVencimento,
    observacao: "Pagamento de mensalidade",
    createdAt: agora,
  };
}

// ============================================================
//  PAGAMENTOS MENSALISTAS (histórico)
// ============================================================

function rowToPagamentoMensalista(row: Record<string, unknown>): PagamentoMensalista {
  return {
    id: row.id as string,
    mensalistaId: row.mensalista_id as string,
    valor: Number(row.valor) || 0,
    dataPagamento: (row.data_pagamento as string) || new Date().toISOString(),
    vencimentoAnterior: (row.vencimento_anterior as string) || "",
    novoVencimento: (row.novo_vencimento as string) || "",
    observacao: (row.observacao as string) || "",
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export async function fetchPagamentosMensalistas(): Promise<PagamentoMensalista[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from("pagamentos_mensalistas").select("*").order("data_pagamento", { ascending: false });
  if (error) { console.error("Erro ao buscar pagamentos mensalistas:", error.message); return []; }
  return (data || []).map(rowToPagamentoMensalista);
}

export async function atualizarStatusMensalistas(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const { error } = await sb.from("mensalistas")
    .update({ status: "vencido" })
    .lt("vencimento", hojeStr)
    .eq("status", "ativo");
  if (error) console.error("Erro ao atualizar status mensalistas:", error.message);
}

// ============================================================
//  SALDO DOS MENSALISTAS (cálculo agregado do mês atual)
// ============================================================

/**
 * Busca o saldo agregado de todos os mensalistas no mês atual.
 * Usa queries otimizadas que buscam apenas os dados necessários.
 * Tenta usar a VIEW vw_saldo_mensalistas; se não existir, faz fallback com queries individuais.
 */
export async function fetchSaldoMensalistas(): Promise<SaldoMensalista[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const inicioMes = `${mesAtual}-01T00:00:00`;
  const fimMes = `${mesAtual}-31T23:59:59`;

  // 1. Tentar ler da VIEW (se já foi criada via migration)
  try {
    const { data, error } = await sb
      .from("vw_saldo_mensalistas")
      .select("mensalista_id, total_lavagens, quantidade_lavagens, total_extras, total_acumulado, total_pago");

    if (error) {
      console.warn("[Saldo] VIEW vw_saldo_mensalistas retornou erro:", error.message, error.code);
    } else if (data && data.length > 0) {
      console.log("[Saldo] Usando VIEW vw_saldo_mensalistas —", data.length, "registros");
      return data.map((row) => ({
        mensalistaId: row.mensalista_id as string,
        totalLavagens: Number(row.total_lavagens) || 0,
        quantidadeLavagens: Number(row.quantidade_lavagens) || 0,
        totalExtras: Number(row.total_extras) || 0,
        totalAcumulado: Number(row.total_acumulado) || 0,
        totalPago: Number(row.total_pago) || 0,
        saldoPendente: (Number(row.total_acumulado) || 0) - (Number(row.total_pago) || 0),
      }));
    } else {
      console.log("[Saldo] VIEW retornou 0 registros, usando queries individuais");
    }
  } catch (e) {
    // VIEW não existe — fallback para queries individuais
    console.warn("[Saldo] VIEW não encontrada/erro, usando queries individuais:", e);
  }

  // 2. Fallback: queries individuais
  const saldoMap = new Map<string, SaldoMensalista>();

  // 2a. Comandas de mensalistas finalizadas no mês atual
  try {
    const { data: comandasData } = await sb
      .from("comandas")
      .select("mensalista_id, valor_servico, id, created_at, status")
      .not("mensalista_id", "is", null)
      .eq("status", "finalizada")
      .gte("created_at", inicioMes)
      .lte("created_at", fimMes);

    if (comandasData) {
      for (const c of comandasData) {
        const mid = c.mensalista_id as string;
        if (!mid) continue;
        const existing = saldoMap.get(mid) || {
          mensalistaId: mid, totalLavagens: 0, quantidadeLavagens: 0,
          totalExtras: 0, totalAcumulado: 0,
          totalPago: 0, saldoPendente: 0,
        };
        existing.totalLavagens += Number(c.valor_servico) || 0;
        existing.quantidadeLavagens += 1;
        saldoMap.set(mid, existing);
      }
    }
  } catch (e) { console.error("[Saldo] Erro comandas:", e); }

  // 2c. Extras diretos (mensalista_consumos) — tabela pode não existir
  try {
    const { data: extrasData } = await sb
      .from("mensalista_consumos")
      .select("mensalista_id, subtotal, created_at")
      .gte("created_at", inicioMes.substring(0, 10))
      .lte("created_at", fimMes.substring(0, 10));

    if (extrasData) {
      for (const ex of extrasData) {
        const mid = ex.mensalista_id as string;
        if (!mid) continue;
        const existing = saldoMap.get(mid) || {
          mensalistaId: mid, totalLavagens: 0, quantidadeLavagens: 0,
          totalExtras: 0, totalAcumulado: 0,
          totalPago: 0, saldoPendente: 0,
        };
        existing.totalExtras += Number(ex.subtotal) || 0;
        saldoMap.set(mid, existing);
      }
    }
  } catch (e) {
    // Tabela mensalista_consumos pode não existir ainda — isso é normal
    console.log("[Saldo] Tabela mensalista_consumos não encontrada (ok)");
  }

  // 2d. Pagamentos no mês atual
  try {
    const { data: pagData } = await sb
      .from("pagamentos_mensalistas")
      .select("mensalista_id, valor, data_pagamento")
      .gte("data_pagamento", inicioMes)
      .lte("data_pagamento", fimMes);

    if (pagData) {
      for (const p of pagData) {
        const mid = p.mensalista_id as string;
        if (!mid) continue;
        const existing = saldoMap.get(mid) || {
          mensalistaId: mid, totalLavagens: 0, quantidadeLavagens: 0,
          totalExtras: 0, totalAcumulado: 0,
          totalPago: 0, saldoPendente: 0,
        };
        existing.totalPago += Number(p.valor) || 0;
        saldoMap.set(mid, existing);
      }
    }
  } catch (e) { console.error("[Saldo] Erro pagamentos:", e); }

  // 3. Calcular totalAcumulado e saldoPendente para cada mensalista
  for (const [, saldo] of saldoMap) {
    saldo.totalAcumulado = saldo.totalLavagens + saldo.totalExtras;
    saldo.saldoPendente = saldo.totalAcumulado - saldo.totalPago;
  }

  const resultado = Array.from(saldoMap.values());
  console.log("[Saldo] Fallback retornou:", resultado.length, "saldos", resultado);
  return resultado;
}

// ============================================================
//  CONSUMOS EXTRAS DO MENSALISTA (mensalista_consumos)
// ============================================================

function rowToConsumoMensalista(row: Record<string, unknown>): ConsumoMensalista {
  return {
    id: row.id as string,
    mensalistaId: row.mensalista_id as string,
    tipo: (row.tipo as "produto" | "servico") || "produto",
    nome: (row.nome as string) || "",
    quantidade: Number(row.quantidade) || 1,
    valorUnitario: Number(row.valor_unitario) || 0,
    subtotal: Number(row.subtotal) || 0,
    data: (row.created_at as string)
      ? (row.created_at as string).split("T")[0]
      : new Date().toISOString().split("T")[0],
    observacao: (row.observacao as string) || "",
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

/** Busca consumos extras de um mensalista (mês atual) */
export async function fetchConsumosMensalista(mensalistaId: string): Promise<ConsumoMensalista[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const inicioMes = `${mesAtual}-01`;
  const fimMes = `${mesAtual}-31`;

  const { data, error } = await sb
    .from("mensalista_consumos")
    .select("*")
    .eq("mensalista_id", mensalistaId)
    .gte("created_at", inicioMes)
    .lte("created_at", fimMes)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ConsumoMensalista] Erro ao buscar:", error.message);
    return [];
  }
  return (data || []).map(rowToConsumoMensalista);
}

/** Busca consumos extras de TODOS os mensalistas (mês atual) */
export async function fetchTodosConsumosMensalistas(): Promise<ConsumoMensalista[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const inicioMes = `${mesAtual}-01`;
  const fimMes = `${mesAtual}-31`;

  const { data, error } = await sb
    .from("mensalista_consumos")
    .select("*")
    .gte("created_at", inicioMes)
    .lte("created_at", fimMes)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ConsumoMensalista] Erro ao buscar todos:", error.message);
    return [];
  }
  return (data || []).map(rowToConsumoMensalista);
}

/** Insere um consumo extra para um mensalista */
export async function insertConsumoMensalista(
  consumo: Omit<ConsumoMensalista, "id" | "createdAt">
): Promise<ConsumoMensalista | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("mensalista_consumos")
    .insert({
      mensalista_id: consumo.mensalistaId,
      tipo: consumo.tipo,
      nome: consumo.nome,
      quantidade: consumo.quantidade,
      valor_unitario: consumo.valorUnitario,
      subtotal: consumo.subtotal,
      observacao: consumo.observacao,
    })
    .select()
    .single();
  if (error) {
    console.error("[ConsumoMensalista] Erro ao inserir:", error.message);
    return null;
  }
  return rowToConsumoMensalista(data);
}

/** Remove um consumo extra do mensalista */
export async function deleteConsumoMensalista(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from("mensalista_consumos").delete().eq("id", id);
  if (error) {
    console.error("[ConsumoMensalista] Erro ao excluir:", error.message);
    return false;
  }
  return true;
}

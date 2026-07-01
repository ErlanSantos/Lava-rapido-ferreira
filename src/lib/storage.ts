// Utilitários para persistência de dados no localStorage
import { Cliente, Comanda, Produto, Servico, Fidelidade, FIDELIDADE_MAX_PONTOS, ConfiguracoesRecibo, CONFIGURACOES_RECIBO_PADRAO } from "./types";

const CHAVE_CLIENTES = "lavajato_clientes";
const CHAVE_COMANDAS = "lavajato_comandas";
const CHAVE_CONTADOR = "lavajato_contador_comanda";
const CHAVE_PRODUTOS = "lavajato_produtos";
const CHAVE_SERVICOS = "lavajato_servicos";
const CHAVE_FIDELIDADE = "lavajato_fidelidade";
const CHAVE_CONFIG_RECIBO = "lavajato_config_recibo";

// ========== CLIENTES ==========

export function carregarClientes(): Cliente[] {
  if (typeof window === "undefined") return [];
  const dados = localStorage.getItem(CHAVE_CLIENTES);
  return dados ? JSON.parse(dados) : [];
}

export function salvarClientes(clientes: Cliente[]): void {
  localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
}

export function adicionarCliente(cliente: Cliente): Cliente[] {
  const clientes = carregarClientes();
  // Verifica se já existe cliente com mesma placa
  const idx = clientes.findIndex((c) => c.placa === cliente.placa);
  if (idx >= 0) {
    clientes[idx] = cliente; // Atualiza
  } else {
    clientes.push(cliente);
  }
  salvarClientes(clientes);
  return clientes;
}

export function buscarClientePorPlaca(placa: string): Cliente | undefined {
  const clientes = carregarClientes();
  return clientes.find(
    (c) => c.placa.toLowerCase() === placa.toLowerCase()
  );
}

export function atualizarCliente(id: string, atualizacao: Partial<Cliente>): Cliente[] {
  const clientes = carregarClientes();
  const idx = clientes.findIndex((c) => c.id === id);
  if (idx >= 0) {
    clientes[idx] = { ...clientes[idx], ...atualizacao };
    salvarClientes(clientes);
  }
  return clientes;
}

export function removerCliente(id: string): Cliente[] {
  const clientes = carregarClientes().filter((c) => c.id !== id);
  salvarClientes(clientes);
  return clientes;
}

// ========== COMANDAS ==========

export function carregarComandas(): Comanda[] {
  if (typeof window === "undefined") return [];
  const dados = localStorage.getItem(CHAVE_COMANDAS);
  return dados ? JSON.parse(dados) : [];
}

export function salvarComandas(comandas: Comanda[]): void {
  localStorage.setItem(CHAVE_COMANDAS, JSON.stringify(comandas));
}

export function adicionarComanda(comanda: Comanda): Comanda[] {
  const comandas = carregarComandas();
  comandas.push(comanda);
  salvarComandas(comandas);
  return comandas;
}

export function atualizarComanda(
  id: string,
  atualizacao: Partial<Comanda>
): Comanda[] {
  const comandas = carregarComandas();
  const idx = comandas.findIndex((c) => c.id === id);
  if (idx >= 0) {
    comandas[idx] = { ...comandas[idx], ...atualizacao };
    salvarComandas(comandas);
  }
  return comandas;
}

export function removerComanda(id: string): Comanda[] {
  const comandas = carregarComandas().filter((c) => c.id !== id);
  salvarComandas(comandas);
  return comandas;
}

// ========== CONTADOR DE COMANDA ==========

export function obterProximoNumero(): number {
  const atual = parseInt(
    localStorage.getItem(CHAVE_CONTADOR) || "0",
    10
  );
  const proximo = atual + 1;
  localStorage.setItem(CHAVE_CONTADOR, String(proximo));
  return proximo;
}

export function obterNumeroAtual(): number {
  return parseInt(
    localStorage.getItem(CHAVE_CONTADOR) || "0",
    10
  );
}

// ========== PRODUTOS ==========

export function carregarProdutos(): Produto[] {
  if (typeof window === "undefined") return [];
  const dados = localStorage.getItem(CHAVE_PRODUTOS);
  return dados ? JSON.parse(dados) : [];
}

export function salvarProdutos(produtos: Produto[]): void {
  localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
}

export function adicionarProduto(produto: Produto): Produto[] {
  const produtos = carregarProdutos();
  produtos.push(produto);
  salvarProdutos(produtos);
  return produtos;
}

export function atualizarProduto(id: string, atualizacao: Partial<Produto>): Produto[] {
  const produtos = carregarProdutos();
  const idx = produtos.findIndex((p) => p.id === id);
  if (idx >= 0) {
    produtos[idx] = { ...produtos[idx], ...atualizacao };
    salvarProdutos(produtos);
  }
  return produtos;
}

export function removerProduto(id: string): Produto[] {
  const produtos = carregarProdutos().filter((p) => p.id !== id);
  salvarProdutos(produtos);
  return produtos;
}

// ========== SERVICOS ==========

export function carregarServicos(): Servico[] {
  if (typeof window === "undefined") return [];
  const dados = localStorage.getItem(CHAVE_SERVICOS);
  return dados ? JSON.parse(dados) : [];
}

export function salvarServicos(servicos: Servico[]): void {
  localStorage.setItem(CHAVE_SERVICOS, JSON.stringify(servicos));
}

export function adicionarServico(servico: Servico): Servico[] {
  const servicos = carregarServicos();
  servicos.push(servico);
  salvarServicos(servicos);
  return servicos;
}

export function atualizarServico(id: string, atualizacao: Partial<Servico>): Servico[] {
  const servicos = carregarServicos();
  const idx = servicos.findIndex((s) => s.id === id);
  if (idx >= 0) {
    servicos[idx] = { ...servicos[idx], ...atualizacao };
    salvarServicos(servicos);
  }
  return servicos;
}

export function removerServico(id: string): Servico[] {
  const servicos = carregarServicos().filter((s) => s.id !== id);
  salvarServicos(servicos);
  return servicos;
}

// ========== FIDELIDADE ==========

export function carregarFidelidade(): Fidelidade[] {
  if (typeof window === "undefined") return [];
  const dados = localStorage.getItem(CHAVE_FIDELIDADE);
  return dados ? JSON.parse(dados) : [];
}

export function salvarFidelidade(fidelidades: Fidelidade[]): void {
  localStorage.setItem(CHAVE_FIDELIDADE, JSON.stringify(fidelidades));
}

export function obterFidelidadeCliente(clienteId: string): Fidelidade | undefined {
  const fidelidades = carregarFidelidade();
  return fidelidades.find((f) => f.clienteId === clienteId);
}

export function adicionarPontosFidelidade(clienteId: string): { pontos: number; lavagensGratis: number } {
  const fidelidades = carregarFidelidade();
  const idx = fidelidades.findIndex((f) => f.clienteId === clienteId);

  if (idx >= 0) {
    fidelidades[idx].pontos += 1;
    // Se atingiu o máximo, concede lavagem grátis e reseta
    if (fidelidades[idx].pontos >= FIDELIDADE_MAX_PONTOS) {
      fidelidades[idx].lavagensGratis += 1;
      fidelidades[idx].pontos = 0;
    }
    salvarFidelidade(fidelidades);
    return { pontos: fidelidades[idx].pontos, lavagensGratis: fidelidades[idx].lavagensGratis };
  } else {
    const novaFidelidade: Fidelidade = { clienteId, pontos: 1, lavagensGratis: 0 };
    fidelidades.push(novaFidelidade);
    salvarFidelidade(fidelidades);
    return { pontos: 1, lavagensGratis: 0 };
  }
}

export function usarLavagemGratis(clienteId: string): { pontos: number; lavagensGratis: number } {
  const fidelidades = carregarFidelidade();
  const idx = fidelidades.findIndex((f) => f.clienteId === clienteId);

  if (idx >= 0 && fidelidades[idx].lavagensGratis > 0) {
    fidelidades[idx].lavagensGratis -= 1;
    salvarFidelidade(fidelidades);
    return { pontos: fidelidades[idx].pontos, lavagensGratis: fidelidades[idx].lavagensGratis };
  }
  return { pontos: fidelidades[idx]?.pontos || 0, lavagensGratis: 0 };
}

// Ajuste manual de pontos (incrementar ou decrementar sem completar ciclo)
export function ajustarPontosFidelidade(clienteId: string, delta: number): { pontos: number; lavagensGratis: number } {
  const fidelidades = carregarFidelidade();
  let idx = fidelidades.findIndex((f) => f.clienteId === clienteId);

  if (idx < 0) {
    // Criar registro se não existe
    const novaFidelidade: Fidelidade = { clienteId, pontos: 0, lavagensGratis: 0 };
    fidelidades.push(novaFidelidade);
    idx = fidelidades.length - 1;
  }

  fidelidades[idx].pontos += delta;

  // Garantir que pontos não fiquem negativos
  if (fidelidades[idx].pontos < 0) {
    fidelidades[idx].pontos = 0;
  }

  // Se atingiu o máximo, concede lavagem grátis e reseta
  if (fidelidades[idx].pontos >= FIDELIDADE_MAX_PONTOS) {
    fidelidades[idx].lavagensGratis += 1;
    fidelidades[idx].pontos = 0;
  }

  // Garantir que lavagens grátis não fiquem negativas
  if (fidelidades[idx].lavagensGratis < 0) {
    fidelidades[idx].lavagensGratis = 0;
  }

  salvarFidelidade(fidelidades);
  return { pontos: fidelidades[idx].pontos, lavagensGratis: fidelidades[idx].lavagensGratis };
}

// Ajustar lavagens grátis manualmente
export function ajustarLavagensGratis(clienteId: string, delta: number): { pontos: number; lavagensGratis: number } {
  const fidelidades = carregarFidelidade();
  let idx = fidelidades.findIndex((f) => f.clienteId === clienteId);

  if (idx < 0) {
    const novaFidelidade: Fidelidade = { clienteId, pontos: 0, lavagensGratis: 0 };
    fidelidades.push(novaFidelidade);
    idx = fidelidades.length - 1;
  }

  fidelidades[idx].lavagensGratis += delta;
  if (fidelidades[idx].lavagensGratis < 0) {
    fidelidades[idx].lavagensGratis = 0;
  }

  salvarFidelidade(fidelidades);
  return { pontos: fidelidades[idx].pontos, lavagensGratis: fidelidades[idx].lavagensGratis };
}

// ========== CONFIGURAÇÕES DO RECIBO ==========

export function carregarConfiguracoesRecibo(): ConfiguracoesRecibo {
  if (typeof window === "undefined") return CONFIGURACOES_RECIBO_PADRAO;
  const dados = localStorage.getItem(CHAVE_CONFIG_RECIBO);
  if (dados) {
    try {
      return { ...CONFIGURACOES_RECIBO_PADRAO, ...JSON.parse(dados) };
    } catch {
      return CONFIGURACOES_RECIBO_PADRAO;
    }
  }
  return CONFIGURACOES_RECIBO_PADRAO;
}

export function salvarConfiguracoesRecibo(config: ConfiguracoesRecibo): void {
  localStorage.setItem(CHAVE_CONFIG_RECIBO, JSON.stringify(config));
}

// ========== DADOS DE SEMENTE ==========

export function inicializarDados(): void {
  // Só inicializa se não houver dados
  const jaTemClientes = carregarClientes().length > 0;
  const jaTemComandas = carregarComandas().length > 0;

  if (!jaTemClientes && !jaTemComandas) {
    const clientesSeed: Cliente[] = [
      {
        id: "seed-1",
        nome: "João Silva",
        telefone: "11999887766",
        veiculo: "Honda Civic 2022",
        placa: "ABC-1D23",
      },
      {
        id: "seed-2",
        nome: "Maria Oliveira",
        telefone: "11988776655",
        veiculo: "Toyota Corolla 2023",
        placa: "DEF-4G56",
      },
      {
        id: "seed-3",
        nome: "Carlos Santos",
        telefone: "21977665544",
        veiculo: "Fiat Pulse 2024",
        placa: "GHI-7J89",
      },
      {
        id: "seed-4",
        nome: "Ana Paula Souza",
        telefone: "31966554433",
        veiculo: "Jeep Compass 2023",
        placa: "JKL-0M12",
      },
      {
        id: "seed-5",
        nome: "Roberto Ferreira",
        telefone: "41955443322",
        veiculo: "Volkswagen T-Cross 2024",
        placa: "MNO-3P45",
      },
    ];

    salvarClientes(clientesSeed);
  }

  // Semente de produtos (apenas se não existir)
  if (carregarProdutos().length === 0) {
    const produtosSeed: Produto[] = [
      { id: "prod-1", nome: "Água", preco: 3.00, ativo: true },
      { id: "prod-2", nome: "Refrigerante", preco: 5.00, ativo: true },
      { id: "prod-3", nome: "Cerveja", preco: 8.00, ativo: true },
      { id: "prod-4", nome: "Salgado", preco: 6.00, ativo: true },
      { id: "prod-5", nome: "Refeição", preco: 18.00, ativo: true },
    ];
    salvarProdutos(produtosSeed);
  }

  // Semente de serviços (apenas se não existir)
  if (carregarServicos().length === 0) {
    const servicosSeed: Servico[] = [
      { id: "serv-1", nome: "Lavagem Simples", valor: 30, ativo: true },
      { id: "serv-2", nome: "Lavagem Completa", valor: 50, ativo: true },
      { id: "serv-3", nome: "Polimento", valor: 150, ativo: true },
      { id: "serv-4", nome: "Enceramento", valor: 80, ativo: true },
      { id: "serv-5", nome: "Higienização Interna", valor: 60, ativo: true },
      { id: "serv-6", nome: "Lavagem + Enceramento", valor: 100, ativo: true },
      { id: "serv-7", nome: "Polimento Simples", valor: 120, ativo: true },
      { id: "serv-8", nome: "Lavagem Motor", valor: 40, ativo: true },
    ];
    salvarServicos(servicosSeed);
  }
}

// Tipos de dados do sistema Lava-Rápido Ferreira

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  veiculo: string;
  placa: string;
}

export interface Consumo {
  id: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface Comanda {
  id: string;
  numero: number;
  cliente: Cliente;
  servico: string;
  valorServico: number;
  consumos: Consumo[];
  total: number;
  status: "em_andamento" | "finalizada";
  dataEntrada: string; // ISO string para localStorage
  dataSaida?: string;
  formaPagamento?: string;
  caixinha?: number;
  lavagemGratis?: boolean; // true se usou lavagem gratuita do clube de fidelidade
  mensalista?: boolean;
  mensalistaId?: string; // ID do mensalista vinculado a esta comanda
}

// Produto (catálogo de produtos)
export interface Produto {
  id: string;
  nome: string;
  preco: number;
  ativo: boolean;
}

// Serviço (catálogo de serviços — substitui constante SERVICOS)
export interface Servico {
  id: string;
  nome: string;
  valor: number;
  ativo: boolean;
}

// Fidelidade (cartão fidelidade por cliente)
export interface Fidelidade {
  clienteId: string;
  pontos: number;
  lavagensGratis: number;
}

// Formas de pagamento
export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Cartão Crédito",
  "Cartão Débito",
  "PIX",
] as const;

// Configurações do recibo (dados da empresa que aparecem no recibo)
export interface ConfiguracoesRecibo {
  nomeEmpresa: string;
  cnpj: string;
  endereco: string;
  telefone: string;
}

// Configurações padrão do recibo
export const CONFIGURACOES_RECIBO_PADRAO: ConfiguracoesRecibo = {
  nomeEmpresa: "Lava-Rápido Ferreira",
  cnpj: "",
  endereco: "",
  telefone: "",
};

// Constante para máximo de pontos de fidelidade
export const FIDELIDADE_MAX_PONTOS = 10;

// Despesa
export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
}

// Funcionário
export interface Funcionario {
  id: string;
  nome: string;
  valorDia: number;
  ativo: boolean;
}

// Dia trabalhado por funcionário
export interface DiaTrabalhado {
  id: string;
  funcionarioId: string;
  data: string; // YYYY-MM-DD
  pago: boolean;
}

// Pagamento de funcionário
export interface PagamentoFunc {
  id: string;
  funcionarioId: string;
  valor: number;
  diasPagos: number;
  dataPagamento: string; // ISO string
}

// Mensalista
export interface Mensalista {
  id: string;
  nome: string;
  telefone: string;
  veiculo: string;
  placa: string;
  valorMensal: number;
  vencimento: string; // YYYY-MM-DD
  status: "ativo" | "vencido";
  observacoes: string;
  createdAt: string;
}

// Pagamento de Mensalista (histórico)
export interface PagamentoMensalista {
  id: string;
  mensalistaId: string;
  valor: number;
  dataPagamento: string; // ISO string
  vencimentoAnterior: string; // YYYY-MM-DD
  novoVencimento: string; // YYYY-MM-DD
  observacao: string;
  createdAt: string;
}

// Saldo calculado do mensalista (do banco via VIEW/RPC)
export interface SaldoMensalista {
  mensalistaId: string;
  totalLavagens: number;        // soma de valor_servico das comandas vinculadas (finalizadas)
  totalExtras: number;           // soma de mensalista_consumos.subtotal (extras diretos)
  totalAcumulado: number;        // totalLavagens + totalExtras
  totalPago: number;            // soma de pagamentos_mensalistas.valor
  saldoPendente: number;        // totalAcumulado - totalPago
  quantidadeLavagens: number;   // quantidade de lavagens no período
}

// Consumo extra vinculado diretamente a um mensalista (tabela mensalista_consumos)
export interface ConsumoMensalista {
  id: string;
  mensalistaId: string;
  tipo: "produto" | "servico";
  nome: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
  data: string;           // YYYY-MM-DD
  observacao: string;
  createdAt: string;
}

// Resultado unificado da busca (clientes + mensalistas)
export interface ResultadoBuscaEntrada {
  cliente: Cliente;
  origem: "cliente" | "mensalista";
  mensalistaId?: string;
}

// Tipos de abas de navegação
export type AbaAtiva =
  | "dashboard"
  | "entrada"
  | "comandas"
  | "venda-rapida"
  | "clientes"
  | "produtos"
  | "servicos"
  | "historico"
  | "despesas"
  | "funcionarios"
  | "mensalistas";

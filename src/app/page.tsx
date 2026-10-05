"use client";

// Página principal do Lava-Rápido Ferreira — Sistema de Gestão
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  History,
  Users,
  ShoppingCart,
  Sparkles,
  Database,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Receipt,
  UserCog,
  Menu,
  X,
  CreditCard,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLavaJato } from "@/hooks/use-lavajato";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dashboard } from "@/components/lavajato/Dashboard";
import { NovaEntrada } from "@/components/lavajato/NovaEntrada";
import { ComandasAtivas } from "@/components/lavajato/ComandasAtivas";
import { Historico } from "@/components/lavajato/Historico";
import { Clientes } from "@/components/lavajato/Clientes";
import { Produtos } from "@/components/lavajato/Produtos";
import { Servicos } from "@/components/lavajato/Servicos";
import { VendaRapida } from "@/components/lavajato/VendaRapida";
import { Despesas } from "@/components/lavajato/Despesas";
import { Funcionarios } from "@/components/lavajato/Funcionarios";
import { Mensalistas } from "@/components/lavajato/Mensalistas";
import type { AbaAtiva } from "@/lib/types";
import { SQL_CRIACAO_TABELAS } from "@/lib/supabase-service";

// Tela de setup quando as tabelas não existem
function TelaSetup({ onPronto }: { onPronto: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState("");

  function copiarSQL() {
    navigator.clipboard.writeText(SQL_CRIACAO_TABELAS);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  async function verificar() {
    setVerificando(true);
    setErro("");
    try {
      const resp = await fetch("/api/init-db", { method: "POST" });
      const data = await resp.json();
      if (data.success) {
        onPronto();
      } else if (data.precisaCriarTabelas) {
        setErro("As tabelas ainda não foram criadas. Execute o SQL abaixo no Supabase.");
      } else {
        setErro(data.error || "Erro ao verificar.");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-600/20 mb-4">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configurar Banco de Dados
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Execute o SQL abaixo para criar as tabelas no Supabase
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
            <h3 className="text-xs font-semibold text-blue-800 dark:text-blue-300">Passo a passo:</h3>
            <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Acesse o <strong>SQL Editor</strong> no painel do Supabase</li>
              <li>Clique em <strong>+ New query</strong></li>
              <li>Cole o SQL abaixo e clique em <strong>Run</strong></li>
              <li>Volte aqui e clique em <strong>&quot;Verificar Tabelas&quot;</strong></li>
            </ol>
          </div>

          <div className="relative">
            <button
              onClick={copiarSQL}
              className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors cursor-pointer"
            >
              {copiado ? (
                <><CheckCircle className="w-3.5 h-3.5 text-blue-400" /> Copiado!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copiar SQL</>
              )}
            </button>
            <pre className="bg-gray-900 text-blue-400 text-[11px] p-4 rounded-xl overflow-auto max-h-64 leading-relaxed pr-20">
              {SQL_CRIACAO_TABELAS}
            </pre>
          </div>

          <a
            href="https://supabase.com/dashboard/project/qdzbqvazwaxthgijnpxz/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir SQL Editor no Supabase
          </a>

          {erro && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{erro}</p>
            </div>
          )}

          <button
            onClick={verificar}
            disabled={verificando}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            {verificando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </span>
            ) : (
              "Verificar Tabelas"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LavaRapidoFerreiraPage() {
  const [setupConcluido, setSetupConcluido] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [sidebarColapsada, setSidebarColapsada] = useState(false);
  const {
    clientes,
    comandas,
    produtos,
    servicos,
    abaAtiva,
    setAbaAtiva,
    carregado,
    tabelasProntas,
    dataSelecionada,
    setDataSelecionada,
    irParaHoje,
    irParaDiaAnterior,
    irParaProximoDia,
    metricas,
    comandasAtivas,
    comandasDaData,
    refreshDados,
    buscarClientes,
    buscarParaEntrada,
    registrarCliente,
    editarCliente,
    excluirCliente,
    adicionarProdutoHook,
    editarProduto,
    excluirProduto,
    adicionarServicoHook,
    editarServico,
    excluirServico,
    obterFidelidadeHook,
    ajustarPontosFidelidadeHook,
    ajustarLavagensGratisHook,
    criarComanda,
    adicionarConsumo,
    removerConsumo,
    finalizarComanda,
    cancelarComanda,
    editarComanda,
    criarVendaAvulsa,
    adicionarDespesa,
    editarDespesa,
    excluirDespesa,
    despesas,
    adicionarFuncionario,
    editarFuncionario,
    excluirFuncionario,
    funcionarios,
    diasTrabalhados,
    pagamentosFunc,
    marcarDiaTrabalhado,
    desmarcarDiaTrabalhado,
    pagarFuncionario,
    mensalistas,
    pagamentosMensalistas,
    metricasMensalistas,
    buscarMensalistaPorPlaca,
    adicionarMensalista,
    editarMensalista,
    excluirMensalista,
    registrarPagamentoMensalistaHook,
    saldoMensalistas,
    consumosMensalistas,
    recalcularSaldos,
    adicionarConsumoMensalista,
    removerConsumoMensalista,
  } = useLavaJato();

  // Fechar menu mobile ao mudar de aba
  useEffect(() => {
    setMenuAberto(false);
  }, [abaAtiva]);

  // Se as tabelas não existem, mostrar tela de setup
  if (carregado && !tabelasProntas && !setupConcluido) {
    return <TelaSetup onPronto={() => setSetupConcluido(true)} />;
  }

  // Estado de carregamento
  if (!carregado) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Mapeamento de abas
  const abas: { valor: AbaAtiva; label: string; labelCurta: string; icone: typeof LayoutDashboard; badge?: number }[] = [
    { valor: "dashboard", label: "Home", labelCurta: "Home", icone: LayoutDashboard },
    { valor: "entrada", label: "Nova Entrada", labelCurta: "Entrada", icone: PlusCircle },
    { valor: "comandas", label: "Comandas Ativas", labelCurta: "Comandas", icone: ClipboardList, badge: comandasAtivas.length },
    { valor: "venda-rapida", label: "Venda Rápida", labelCurta: "Vendas", icone: Zap },
    { valor: "clientes", label: "Clientes", labelCurta: "Clientes", icone: Users },
    { valor: "produtos", label: "Produtos", labelCurta: "Produtos", icone: ShoppingCart },
    { valor: "servicos", label: "Serviços", labelCurta: "Serviços", icone: Sparkles },
    { valor: "historico", label: "Histórico", labelCurta: "Histórico", icone: History },
    { valor: "despesas", label: "Despesas", labelCurta: "Despesas", icone: Receipt },
    { valor: "funcionarios", label: "Funcionários", labelCurta: "Funcion.", icone: UserCog },
    { valor: "mensalistas", label: "Mensalistas", labelCurta: "Mensal.", icone: CreditCard, badge: metricasMensalistas.vencidos },
  ];

  const mudarAba = (valor: string) => {
    setAbaAtiva(valor as AbaAtiva);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ========== SIDEBAR — Permanente no desktop, drawer no mobile ========== */}
      {/* Desktop: sidebar fixa à esquerda */}
      <aside className={`
        hidden lg:flex flex-col border-r bg-card z-30 transition-all duration-300
        ${sidebarColapsada ? "w-[68px]" : "w-60"}
      `}>
        {/* Logo */}
        <div className={`flex items-center ${sidebarColapsada ? "justify-center" : "gap-2.5"} px-4 py-4 border-b`}>
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md shadow-blue-600/20 shrink-0">
            <span className="text-white font-bold text-lg">🚗</span>
          </div>
          {!sidebarColapsada && (
            <div className="min-w-0">
              <h1 className="font-bold text-base tracking-tight truncate">
                Lava-Rápido <span className="text-blue-600 dark:text-blue-400">Ferreira</span>
              </h1>
              <p className="text-[10px] text-muted-foreground">Sistema de Gestão</p>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto custom-scrollbar">
          {abas.map((aba) => (
            <button
              key={aba.valor}
              onClick={() => mudarAba(aba.valor)}
              title={sidebarColapsada ? aba.label : undefined}
              className={`
                w-full flex items-center ${sidebarColapsada ? "justify-center" : "gap-3"} px-2.5 py-2.5 rounded-lg text-sm transition-colors
                ${abaAtiva === aba.valor
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <aba.icone className="size-5 shrink-0" />
              {!sidebarColapsada && (
                <>
                  <span className="flex-1 text-left font-medium truncate">{aba.label}</span>
                  {aba.badge !== undefined && aba.badge > 0 && (
                    <span className="inline-flex items-center justify-center size-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                      {aba.badge}
                    </span>
                  )}
                </>
              )}
              {sidebarColapsada && aba.badge !== undefined && aba.badge > 0 && (
                <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center size-3.5 rounded-full bg-amber-400 text-[8px] font-bold text-amber-900" />
              )}
            </button>
          ))}
        </nav>

        {/* Rodapé sidebar */}
        {!sidebarColapsada && (
          <div className="px-3 py-3 border-t space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <p className="text-[10px] text-muted-foreground">Ativas</p>
                <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{comandasAtivas.length}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <p className="text-[10px] text-muted-foreground">Faturamento</p>
                <p className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                  {metricas.totalFaturado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarColapsada(true)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent cursor-pointer"
            >
              <X className="size-3.5" />
              Recolher menu
            </button>
          </div>
        )}
      </aside>

      {/* Mobile: sidebar drawer com backdrop */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuAberto(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto">
            {/* Header drawer */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md">
                  <span className="text-white font-bold text-lg">🚗</span>
                </div>
                <h2 className="font-bold text-base">Lava-Rápido Ferreira</h2>
              </div>
              <button
                onClick={() => setMenuAberto(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Nav drawer */}
            <nav className="p-2 space-y-0.5">
              {abas.map((aba) => (
                <button
                  key={aba.valor}
                  onClick={() => mudarAba(aba.valor)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    abaAtiva === aba.valor
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <aba.icone className="size-5 shrink-0" />
                  <span className="flex-1 text-left font-medium">{aba.label}</span>
                  {aba.badge !== undefined && aba.badge > 0 && (
                    <span className="inline-flex items-center justify-center size-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                      {aba.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Info drawer */}
            <div className="p-4 border-t mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                  <p className="text-[10px] text-muted-foreground">Ativas</p>
                  <p className="font-bold text-blue-600">{comandasAtivas.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                  <p className="text-[10px] text-muted-foreground">Faturamento</p>
                  <p className="font-bold text-blue-600 text-sm">
                    {metricas.totalFaturado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CONTEÚDO PRINCIPAL ========== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden border-b bg-card sticky top-0 z-40 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMenuAberto(true)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Menu"
                >
                  <Menu className="size-5" />
                </button>
                <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md shadow-blue-600/20">
                  <span className="text-white font-bold text-lg">🚗</span>
                </div>
                <div>
                  <h1 className="font-bold text-base tracking-tight">
                    Lava-Rápido <span className="text-blue-600 dark:text-blue-400">Ferreira</span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Ativas:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{comandasAtivas.length}</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex border-b bg-card sticky top-0 z-40 shadow-sm">
          <div className="flex-1 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botão para expandir sidebar colapsada */}
                {sidebarColapsada && (
                  <button
                    onClick={() => setSidebarColapsada(false)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    title="Expandir menu"
                  >
                    <Menu className="size-5" />
                  </button>
                )}
                <h2 className="font-semibold text-lg text-foreground">
                  {abas.find((a) => a.valor === abaAtiva)?.label || "Dashboard"}
                </h2>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-5 text-sm">
                  <div>
                    <span className="text-muted-foreground">Comandas ativas: </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{comandasAtivas.length}</span>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div>
                    <span className="text-muted-foreground">Faturamento do dia: </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {metricas.totalFaturado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-y-auto">
          <Tabs value={abaAtiva} onValueChange={(v) => mudarAba(v)} className="w-full">
            <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
              <TabsContent value="dashboard">
                <Dashboard metricas={metricas} comandasAtivas={comandasAtivas} comandasDaData={comandasDaData} dataSelecionada={dataSelecionada} onMudarAba={setAbaAtiva} onMudarData={setDataSelecionada} onIrParaHoje={irParaHoje} onIrParaDiaAnterior={irParaDiaAnterior} onIrParaProximoDia={irParaProximoDia} onRefresh={refreshDados} metricasMensalistas={metricasMensalistas} />
              </TabsContent>

              <TabsContent value="entrada">
                <NovaEntrada buscarParaEntrada={buscarParaEntrada} buscarMensalistaPorPlaca={buscarMensalistaPorPlaca} registrarCliente={registrarCliente} criarComanda={criarComanda} servicos={servicos} obterFidelidade={obterFidelidadeHook} />
              </TabsContent>

              <TabsContent value="comandas">
                <ComandasAtivas comandas={comandasAtivas} produtos={produtos} onAdicionarConsumo={adicionarConsumo} onRemoverConsumo={removerConsumo} onFinalizarComanda={finalizarComanda} onCancelarComanda={cancelarComanda} obterFidelidade={obterFidelidadeHook} />
              </TabsContent>

              <TabsContent value="venda-rapida">
                <VendaRapida produtos={produtos} onVender={criarVendaAvulsa} />
              </TabsContent>

              <TabsContent value="clientes">
                <Clientes comandas={comandas} onRegistrarCliente={registrarCliente} onEditarCliente={editarCliente} onExcluirCliente={excluirCliente} obterFidelidade={obterFidelidadeHook} onAjustarPontos={ajustarPontosFidelidadeHook} onAjustarLavagensGratis={ajustarLavagensGratisHook} />
              </TabsContent>

              <TabsContent value="produtos">
                <Produtos produtos={produtos} onAdicionar={adicionarProdutoHook} onEditar={editarProduto} onExcluir={excluirProduto} />
              </TabsContent>

              <TabsContent value="servicos">
                <Servicos servicos={servicos} onAdicionar={adicionarServicoHook} onEditar={editarServico} onExcluir={excluirServico} />
              </TabsContent>

              <TabsContent value="historico">
                <Historico comandas={comandas} produtos={produtos} onEditarComanda={editarComanda} onAdicionarConsumo={adicionarConsumo} onRemoverConsumo={removerConsumo} />
              </TabsContent>

              <TabsContent value="despesas">
                <Despesas despesas={despesas} onAdicionar={adicionarDespesa} onEditar={editarDespesa} onExcluir={excluirDespesa} />
              </TabsContent>

              <TabsContent value="funcionarios">
                <Funcionarios
                  funcionarios={funcionarios}
                  diasTrabalhados={diasTrabalhados}
                  pagamentos={pagamentosFunc}
                  onAdicionar={adicionarFuncionario}
                  onEditar={editarFuncionario}
                  onExcluir={excluirFuncionario}
                  onMarcarDia={marcarDiaTrabalhado}
                  onDesmarcarDia={desmarcarDiaTrabalhado}
                  onPagar={pagarFuncionario}
                />
              </TabsContent>

              <TabsContent value="mensalistas">
                <Mensalistas
                  mensalistas={mensalistas}
                  onAdicionar={adicionarMensalista}
                  onEditar={editarMensalista}
                  onExcluir={excluirMensalista}
                  onRegistrarPagamento={registrarPagamentoMensalistaHook}
                  comandas={comandas}
                  pagamentosMensalistas={pagamentosMensalistas}
                  saldoMensalistas={saldoMensalistas}
                  consumosMensalistas={consumosMensalistas}
                  produtos={produtos}
                  servicos={servicos}
                  recalcularSaldos={recalcularSaldos}
                  onAdicionarConsumoMensalista={adicionarConsumoMensalista}
                  onRemoverConsumoMensalista={removerConsumoMensalista}
                />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

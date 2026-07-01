"use client";

// Componente: Dashboard moderno com métricas, calendário e lista de veículos
import {
  Car,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Clock,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardMetrica } from "./CardMetrica";
import { Comanda, AbaAtiva } from "@/lib/types";
import {
  formatarMoeda,
  formatarDataHora,
  formatarNumeroComanda,
  formatarDataExtenso,
  isHoje,
} from "@/lib/helpers";
import { useState } from "react";

interface DashboardProps {
  metricas: {
    veiculosNoDia: number;
    totalFaturado: number;
    totalAtendimentos: number;
    ticketMedio: number;
    veiculosEmAndamento: number;
  };
  comandasAtivas: Comanda[];
  comandasDaData: Comanda[];
  dataSelecionada: string;
  onMudarAba: (aba: AbaAtiva) => void;
  onMudarData: (data: string) => void;
  onIrParaHoje: () => void;
  onIrParaDiaAnterior: () => void;
  onIrParaProximoDia: () => void;
  onRefresh: () => void;
  metricasMensalistas?: { total: number; ativos: number; vencidos: number; faturamentoMensal: number; potencialMensal?: number };
}

export function Dashboard({
  metricas,
  comandasAtivas,
  comandasDaData,
  dataSelecionada,
  onMudarAba,
  onMudarData,
  onIrParaHoje,
  onIrParaDiaAnterior,
  onIrParaProximoDia,
  onRefresh,
  metricasMensalistas,
}: DashboardProps) {
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  async function handleRefresh() {
    setAtualizando(true);
    await onRefresh();
    setTimeout(() => setAtualizando(false), 600);
  }

  // Gerar dados do mini calendário
  const gerarDiasDoMes = () => {
    const d = new Date(dataSelecionada + "T12:00:00");
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diaSemanaInicio = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();

    const dias: { dia: number; atual: boolean; selecionado: boolean; hoje: boolean }[] = [];

    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ dia: 0, atual: false, selecionado: false, hoje: false });
    }

    const hojeStr = new Date().toISOString().split("T")[0];

    for (let i = 1; i <= totalDias; i++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      dias.push({
        dia: i,
        atual: true,
        selecionado: dataStr === dataSelecionada,
        hoje: dataStr === hojeStr,
      });
    }

    return { dias, ano, mes };
  };

  const calendario = gerarDiasDoMes();
  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const navegarMes = (direcao: number) => {
    const d = new Date(dataSelecionada + "T12:00:00");
    d.setMonth(d.getMonth() + direcao);
    const novaData = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    onMudarData(novaData);
  };

  const selecionarDia = (dia: number) => {
    const d = new Date(dataSelecionada + "T12:00:00");
    const novaData = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    onMudarData(novaData);
    setCalendarioAberto(false);
  };

  // Calcular serviços mais realizados no dia
  const servicosContagem: Record<string, number> = {};
  comandasDaData.forEach((c) => {
    servicosContagem[c.servico] = (servicosContagem[c.servico] || 0) + 1;
  });
  const topServicos = Object.entries(servicosContagem)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxContagem = topServicos.length > 0 ? topServicos[0][1] : 1;

  return (
    <div className="space-y-5">
      {/* Seletor de data com calendário */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-blue-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Data formatada */}
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-0.5">
              {isHoje(dataSelecionada) ? "Hoje" : "Data selecionada"}
            </p>
            <h2 className="text-lg sm:text-xl font-bold truncate">
              {formatarDataExtenso(dataSelecionada)}
            </h2>
          </div>

          {/* Controles de navegação */}
          <div className="flex items-center gap-2">
            <button
              onClick={onIrParaDiaAnterior}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={onIrParaHoje}
              className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                isHoje(dataSelecionada)
                  ? "bg-white/15 hover:bg-white/25 text-white"
                  : "bg-white/10 hover:bg-white/20 text-blue-200"
              }`}
            >
              {isHoje(dataSelecionada)
                ? "Hoje"
                : dataSelecionada.split("-").reverse().join("/")}
            </button>
            <button
              onClick={onIrParaProximoDia}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Separador */}
            <div className="w-px h-8 bg-white/20 mx-1" />

            {/* Botão do calendário */}
            <div className="relative">
              <button
                onClick={() => setCalendarioAberto(!calendarioAberto)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm"
              >
                <CalendarDays className="size-4" />
                <span className="hidden sm:inline">{dataSelecionada.split("-").reverse().join("/")}</span>
              </button>

              {/* Calendário dropdown */}
              {calendarioAberto && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCalendarioAberto(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-72 animate-in fade-in slide-in-from-top-2">
                    {/* Navegação do mês */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => navegarMes(-1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {mesesNomes[calendario.mes]} {calendario.ano}
                      </span>
                      <button
                        onClick={() => navegarMes(1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>

                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
                        <div
                          key={i}
                          className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 py-1"
                        >
                          {dia}
                        </div>
                      ))}
                    </div>

                    {/* Dias */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendario.dias.map((diaInfo, i) => (
                        <button
                          key={i}
                          disabled={!diaInfo.atual}
                          onClick={() => diaInfo.atual && selecionarDia(diaInfo.dia)}
                          className={`
                            relative text-center py-1.5 text-sm rounded-lg transition-all
                            ${!diaInfo.atual ? "invisible" : ""}
                            ${
                              diaInfo.selecionado
                                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                                : diaInfo.hoje
                                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-950"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }
                          `}
                        >
                          {diaInfo.atual ? diaInfo.dia : ""}
                          {diaInfo.hoje && !diaInfo.selecionado && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de métricas - Grid responsivo */}
      <div className="flex items-center justify-end mb-1">
        <button
          onClick={handleRefresh}
          disabled={atualizando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Atualizar dados do Supabase"
        >
          <RefreshCw className={`size-3.5 ${atualizando ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <CardMetrica
          titulo="Carros Atendidos"
          valor={metricas.veiculosNoDia}
          icone={Car}
          cor="blue"
          subtitulo="finalizados no dia"
        />
        <CardMetrica
          titulo="Faturamento do Dia"
          valor={metricas.totalFaturado}
          icone={DollarSign}
          cor="emerald"
          subtitulo="somente finalizadas"
        />
        <CardMetrica
          titulo="Ticket Médio"
          valor={metricas.ticketMedio}
          icone={TrendingUp}
          cor="amber"
          subtitulo="por comanda finalizada"
        />
        <CardMetrica
          titulo="Em Andamento"
          valor={metricas.veiculosEmAndamento}
          icone={Clock}
          cor="violet"
          subtitulo="veículos ativos"
        />
        <CardMetrica
          titulo="Total Entradas"
          valor={comandasDaData.length}
          icone={ClipboardList}
          cor="rose"
          subtitulo="no dia (todas)"
        />
      </div>

      {/* Conteúdo em duas colunas (desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Veículos em andamento - Coluna principal */}
        <div className="lg:col-span-2 bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Clock className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Veículos em Andamento</h3>
                <p className="text-xs text-muted-foreground">
                  {comandasAtivas.length} veículo{comandasAtivas.length !== 1 ? "s" : ""} no momento
                </p>
              </div>
            </div>
            <button
              onClick={() => onMudarAba("comandas")}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
            >
              Ver todas
              <ArrowRight className="size-4" />
            </button>
          </div>
          <div className="p-4 sm:p-5">
            {comandasAtivas.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Car className="size-8 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Nenhum veículo em andamento
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Registre uma nova entrada para começar
                </p>
                <button
                  onClick={() => onMudarAba("entrada")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Car className="size-4" />
                  Nova Entrada
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {comandasAtivas.map((comanda) => (
                  <div
                    key={comanda.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                          #{formatarNumeroComanda(comanda.numero)}
                        </span>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-2 py-0 font-semibold">
                          Em andamento
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {comanda.cliente.nome}
                        <span className="text-muted-foreground font-normal">
                          {" "}&bull; {comanda.cliente.veiculo}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {comanda.cliente.placa} &bull; {comanda.servico}
                        {comanda.consumos.length > 0 && (
                          <span className="ml-1.5">
                            (+{comanda.consumos.length} consumo{comanda.consumos.length > 1 ? "s" : ""})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {formatarMoeda(comanda.total)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatarDataHora(comanda.dataEntrada)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral - Serviços do dia */}
        <div className="space-y-4 sm:space-y-5">
          {/* Serviços mais realizados */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 p-4 sm:p-5 border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <Activity className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Serviços do Dia</h3>
                <p className="text-xs text-muted-foreground">
                  Mais realizados
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {topServicos.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="size-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Nenhum serviço realizado nesta data
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topServicos.map(([nome, count], index) => (
                    <div key={nome} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate mr-2">
                          {nome}
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          {count}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{
                            width: `${(count / maxContagem) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumo rápido */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-950 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="size-5 text-emerald-400" />
              <h3 className="font-semibold text-sm">Resumo Financeiro</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Faturamento total</span>
                <span className="text-lg font-bold text-emerald-400">
                  {formatarMoeda(metricas.totalFaturado)}
                </span>
              </div>
              <div className="h-px bg-gray-700" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Ticket médio</span>
                <span className="text-sm font-semibold">
                  {formatarMoeda(metricas.ticketMedio)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Atendimentos</span>
                <span className="text-sm font-semibold">
                  {metricas.totalAtendimentos}
                </span>
              </div>
              <div className="h-px bg-gray-700" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Mensalistas ativos</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {metricasMensalistas?.ativos || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Mensalistas vencidos</span>
                <span className="text-sm font-semibold text-red-400">
                  {metricasMensalistas?.vencidos || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Receita mensalidades</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatarMoeda(metricasMensalistas?.faturamentoMensal || 0)}
                </span>
              </div>
              {metricasMensalistas && metricasMensalistas.potencialMensal !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Potencial mensalistas</span>
                  <span className="text-sm font-semibold text-violet-400">
                    {formatarMoeda(metricasMensalistas.potencialMensal)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

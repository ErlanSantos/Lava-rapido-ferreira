"use client";

// Componente: Dashboard Mensal com métricas e gráfico de faturamento por dia
import {
  Car,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { CardMetrica } from "./CardMetrica";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatarMoeda } from "@/lib/helpers";
import { useState } from "react";

interface MetricasMensais {
  faturamentoMes: number;
  veiculosAtendidos: number;
  ticketMedioMes: number;
  faturamentoDiario: { dia: number; faturamento: number }[];
}

interface DashboardMensalProps {
  mesSelecionado: string;
  metricasMensais: MetricasMensais;
  onMesAnterior: () => void;
  onProximoMes: () => void;
  onMesAtual: () => void;
  onRefresh: () => void;
}

const MESES_NOMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "var(--chart-1)",
  },
};

// Função para determinar a cor da barra baseada no valor
function getBarColor(value: number, maxValue: number): string {
  if (value === 0) return "hsl(var(--muted))";
  const ratio = value / maxValue;
  if (ratio >= 0.8) return "hsl(142, 71%, 45%)"; // emerald-500
  if (ratio >= 0.5) return "hsl(217, 91%, 60%)"; // blue-500
  if (ratio >= 0.25) return "hsl(251, 91%, 60%)"; // violet-500
  return "hsl(0, 84%, 60%)"; // red-500
}

export function DashboardMensal({
  mesSelecionado,
  metricasMensais,
  onMesAnterior,
  onProximoMes,
  onMesAtual,
  onRefresh,
}: DashboardMensalProps) {
  const [atualizando, setAtualizando] = useState(false);

  const [anoStr, mesStr] = mesSelecionado.split("-");
  const mesNome = MESES_NOMES[parseInt(mesStr, 10) - 1];
  const ano = parseInt(anoStr, 10);
  const mesAtual = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const isMesAtual = mesSelecionado === mesAtual();

  const maxFaturamento = Math.max(
    ...metricasMensais.faturamentoDiario.map((d) => d.faturamento),
    1
  );

  async function handleRefresh() {
    setAtualizando(true);
    await onRefresh();
    setTimeout(() => setAtualizando(false), 600);
  }

  return (
    <div className="space-y-5">
      {/* Seletor de mês */}
      <div className="bg-gradient-to-r from-violet-600 via-violet-700 to-purple-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-violet-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Título */}
          <div className="flex-1 min-w-0">
            <p className="text-violet-200 text-xs font-medium uppercase tracking-wider mb-0.5">
              Dashboard Mensal
            </p>
            <h2 className="text-lg sm:text-xl font-bold truncate">
              {mesNome} {ano}
            </h2>
          </div>

          {/* Controles de navegação */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMesAnterior}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={onMesAtual}
              className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                isMesAtual
                  ? "bg-white/15 hover:bg-white/25 text-white"
                  : "bg-white/10 hover:bg-white/20 text-violet-200"
              }`}
            >
              {isMesAtual ? "Este mês" : "Ir para este mês"}
            </button>
            <button
              onClick={onProximoMes}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Separador */}
            <div className="w-px h-8 bg-white/20 mx-1" />

            {/* Botão atualizar */}
            <button
              onClick={handleRefresh}
              disabled={atualizando}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm"
              title="Atualizar dados"
            >
              <RefreshCw className={`size-3.5 ${atualizando ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <CardMetrica
          titulo="Faturamento do Mês"
          valor={metricasMensais.faturamentoMes}
          icone={DollarSign}
          cor="emerald"
          subtitulo="total de comandas finalizadas"
        />
        <CardMetrica
          titulo="Veículos Atendidos"
          valor={metricasMensais.veiculosAtendidos}
          icone={Car}
          cor="blue"
          subtitulo="comandas finalizadas no mês"
        />
        <CardMetrica
          titulo="Ticket Médio"
          valor={metricasMensais.ticketMedioMes}
          icone={TrendingUp}
          cor="violet"
          subtitulo="faturamento / atendimentos"
        />
      </div>

      {/* Gráfico de faturamento por dia */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 p-4 sm:p-5 border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
            <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm sm:text-base">Faturamento por Dia</h3>
            <p className="text-xs text-muted-foreground">
              Valores diários de {mesNome} {ano}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5" />
            <span>{metricasMensais.faturamentoDiario.length} dias</span>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="h-[300px] sm:h-[350px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                data={metricasMensais.faturamentoDiario}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="dia"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  interval={metricasMensais.faturamentoDiario.length > 20 ? 2 : 1}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: number) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return String(value);
                  }}
                  width={50}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(value as number)}
                        </span>
                      )}
                      labelFormatter={(label) => `Dia ${label} de ${mesNome}`}
                    />
                  }
                />
                <Bar
                  dataKey="faturamento"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {metricasMensais.faturamentoDiario.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.faturamento, maxFaturamento)}
                      opacity={entry.faturamento > 0 ? 0.9 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          {/* Legenda de cores */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Intensidade:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-[10px] text-muted-foreground">Baixo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-violet-500" />
              <span className="text-[10px] text-muted-foreground">Regular</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">Bom</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Alto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo financeiro mensal */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-950 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="size-5 text-emerald-400" />
          <h3 className="font-semibold text-sm">Resumo do Mês</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Faturamento total</span>
            <span className="text-lg font-bold text-emerald-400">
              {formatarMoeda(metricasMensais.faturamentoMes)}
            </span>
          </div>
          <div className="h-px bg-gray-700" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Veículos atendidos</span>
            <span className="text-sm font-semibold">
              {metricasMensais.veiculosAtendidos}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Ticket médio</span>
            <span className="text-sm font-semibold">
              {formatarMoeda(metricasMensais.ticketMedioMes)}
            </span>
          </div>
          <div className="h-px bg-gray-700" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Melhor dia</span>
            {(() => {
              const melhor = metricasMensais.faturamentoDiario.reduce(
                (best, d) => (d.faturamento > best.faturamento ? d : best),
                { dia: 0, faturamento: 0 }
              );
              return melhor.faturamento > 0 ? (
                <span className="text-sm font-semibold text-emerald-400">
                  Dia {melhor.dia} — {formatarMoeda(melhor.faturamento)}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Sem dados</span>
              );
            })()}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Média diária</span>
            {(() => {
              const diasComFaturamento = metricasMensais.faturamentoDiario.filter(
                (d) => d.faturamento > 0
              ).length;
              const media =
                diasComFaturamento > 0
                  ? metricasMensais.faturamentoMes / diasComFaturamento
                  : 0;
              return (
                <span className="text-sm font-semibold">
                  {formatarMoeda(media)}
                  <span className="text-gray-500 text-xs ml-1">
                    ({diasComFaturamento} dia{diasComFaturamento !== 1 ? "s" : ""})
                  </span>
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

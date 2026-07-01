"use client";

// Componente: Card de métricas do dashboard
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { formatarMoeda } from "@/lib/helpers";

interface CardMetricaProps {
  titulo: string;
  valor: string | number;
  icone: LucideIcon;
  cor: string;
  subtitulo?: string;
}

export function CardMetrica({
  titulo,
  valor,
  icone: Icone,
  cor,
  subtitulo,
}: CardMetricaProps) {
  // Determina classes de cor baseadas no tipo
  const coresMap: Record<string, { bg: string; texto: string; borda: string }> = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      texto: "text-blue-600 dark:text-blue-400",
      borda: "border-blue-200 dark:border-blue-800",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      texto: "text-emerald-600 dark:text-emerald-400",
      borda: "border-emerald-200 dark:border-emerald-800",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      texto: "text-amber-600 dark:text-amber-400",
      borda: "border-amber-200 dark:border-amber-800",
    },
    rose: {
      bg: "bg-rose-50 dark:bg-rose-950/40",
      texto: "text-rose-600 dark:text-rose-400",
      borda: "border-rose-200 dark:border-rose-800",
    },
    violet: {
      bg: "bg-violet-50 dark:bg-violet-950/40",
      texto: "text-violet-600 dark:text-violet-400",
      borda: "border-violet-200 dark:border-violet-800",
    },
  };

  const cores = coresMap[cor] || coresMap.blue;

  // Formata o valor como moeda se for número e o título indicar
  const valorFormatado =
    typeof valor === "number" &&
    (titulo.toLowerCase().includes("faturad") ||
      titulo.toLowerCase().includes("ticket"))
      ? formatarMoeda(valor)
      : typeof valor === "number"
        ? String(valor)
        : valor;

  return (
    <Card className={`border ${cores.borda} ${cores.bg} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {titulo}
            </p>
            <p className={`text-xl sm:text-2xl font-bold ${cores.texto} truncate`}>
              {valorFormatado}
            </p>
            {subtitulo && (
              <p className="text-xs text-muted-foreground">{subtitulo}</p>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${cores.bg}`}>
            <Icone className={`size-5 sm:size-6 ${cores.texto}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

// Componente: Gestão de Funcionários — Cards individuais com CRUD + Dias Trabalhados + Pagamentos
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Calendar,
  Check,
  DollarSign,
  Clock,
  History,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CheckCircle2,
  UserCircle,
  AlertTriangle,
} from "lucide-react";
import { Funcionario, DiaTrabalhado, PagamentoFunc } from "@/lib/types";
import { formatarMoeda } from "@/lib/helpers";
import { toast } from "sonner";

interface FuncionariosProps {
  funcionarios: Funcionario[];
  diasTrabalhados: DiaTrabalhado[];
  pagamentos: PagamentoFunc[];
  onAdicionar: (func: Funcionario) => Promise<boolean>;
  onEditar: (id: string, dados: Partial<Funcionario>) => Promise<boolean>;
  onExcluir: (id: string) => Promise<boolean>;
  onMarcarDia: (funcionarioId: string, data: string) => Promise<boolean>;
  onDesmarcarDia: (id: string) => Promise<boolean>;
  onPagar: (funcionarioId: string) => void;
}

export function Funcionarios({
  funcionarios,
  diasTrabalhados,
  pagamentos,
  onAdicionar,
  onEditar,
  onExcluir,
  onMarcarDia,
  onDesmarcarDia,
  onPagar,
}: FuncionariosProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [confirmPagamentoAberto, setConfirmPagamentoAberto] = useState(false);
  const [funcEditando, setFuncEditando] = useState<Funcionario | null>(null);
  const [funcExcluindo, setFuncExcluindo] = useState<Funcionario | null>(null);
  const [funcPagando, setFuncPagando] = useState<{
    id: string;
    nome: string;
    total: number;
    dias: number;
  } | null>(null);
  const [cardExpandido, setCardExpandido] = useState<string | null>(null);

  // Formulário
  const [formNome, setFormNome] = useState("");
  const [formValorDia, setFormValorDia] = useState("");

  // Data para marcar dia (hoje por padrão)
  const [dataMarcacao, setDataMarcacao] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Mês referência para filtrar dias
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const formatarMesRef = () => {
    const [ano, mes] = mesRef.split("-").map(Number);
    return `${mesesNomes[mes - 1]} ${ano}`;
  };

  const mudarMes = (direcao: number) => {
    const [ano, mes] = mesRef.split("-").map(Number);
    const d = new Date(ano, mes - 1 + direcao, 1);
    setMesRef(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  // Calcular dados por funcionário
  const dadosFuncionarios = useMemo(() => {
    return funcionarios
      .filter((f) => f.ativo)
      .map((func) => {
        const dias = diasTrabalhados.filter(
          (d) => d.funcionarioId === func.id && d.data.startsWith(mesRef)
        );
        const diasPagos = dias.filter((d) => d.pago);
        const diasPendentes = dias.filter((d) => !d.pago);
        const totalReceber = diasPendentes.length * func.valorDia;
        const totalPago = diasPagos.reduce((s) => s + func.valorDia, 0);
        const pagamentosDoMes = pagamentos.filter(
          (p) =>
            p.funcionarioId === func.id &&
            p.dataPagamento.startsWith(mesRef)
        );
        const diaHojeMarcado = dias.some((d) => d.data === dataMarcacao);

        return {
          funcionario: func,
          dias,
          diasPagos,
          diasPendentes,
          totalReceber,
          totalPago,
          pagamentos: pagamentosDoMes,
          diaHojeMarcado,
          status: diasPendentes.length === 0 ? "pago" as const : "pendente" as const,
        };
      });
  }, [funcionarios, diasTrabalhados, pagamentos, mesRef, dataMarcacao]);

  const totalGeral = dadosFuncionarios.reduce(
    (s, d) => s + d.totalReceber,
    0
  );

  const totalGeralPago = dadosFuncionarios.reduce(
    (s, d) => s + d.totalPago,
    0
  );

  const abrirNovo = () => {
    setFuncEditando(null);
    setFormNome("");
    setFormValorDia("");
    setDialogAberto(true);
  };

  const abrirEditar = (func: Funcionario) => {
    setFuncEditando(func);
    setFormNome(func.nome);
    setFormValorDia(String(func.valorDia));
    setDialogAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      toast.error("Informe o nome do funcionário");
      return;
    }
    const valorDia = parseFloat(formValorDia) || 0;
    if (valorDia <= 0) {
      toast.error("Informe um valor diário válido");
      return;
    }

    if (funcEditando) {
      const ok = await onEditar(funcEditando.id, {
        nome: formNome.trim(),
        valorDia,
      });
      if (ok) {
        toast.success("Funcionário atualizado!");
        setDialogAberto(false);
      } else {
        toast.error("Erro ao atualizar funcionário. Verifique a conexão.");
      }
    } else {
      const novoFunc: Funcionario = {
        id: crypto.randomUUID(),
        nome: formNome.trim(),
        valorDia,
        ativo: true,
      };
      const ok = await onAdicionar(novoFunc);
      if (ok) {
        toast.success("Funcionário adicionado!");
        setDialogAberto(false);
      } else {
        toast.error("Erro ao salvar funcionário. Verifique a conexão com o banco de dados.");
      }
    }
  };

  const handleExcluir = async () => {
    if (funcExcluindo) {
      const ok = await onExcluir(funcExcluindo.id);
      if (ok) {
        toast.success("Funcionário excluído!");
        setFuncExcluindo(null);
        setConfirmAberto(false);
      } else {
        toast.error("Erro ao excluir funcionário. Verifique a conexão.");
      }
    }
  };

  const handleMarcarDia = async (funcionarioId: string) => {
    const ok = await onMarcarDia(funcionarioId, dataMarcacao);
    if (ok) {
      toast.success("Dia marcado!");
    } else {
      toast.error("Erro ao marcar dia. Verifique a conexão.");
    }
  };

  const handleConfirmarPagamento = () => {
    if (funcPagando) {
      onPagar(funcPagando.id);
      toast.success(`Pagamento de ${formatarMoeda(funcPagando.total)} registrado para ${funcPagando.nome}!`);
      setFuncPagando(null);
      setConfirmPagamentoAberto(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ========== HEADER: Título + Mês + Resumo ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/50">
            <Users className="size-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Funcionários</h2>
            <p className="text-xs text-muted-foreground">
              {dadosFuncionarios.length} funcionário{dadosFuncionarios.length !== 1 ? "s" : ""} ativo{dadosFuncionarios.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegação do mês */}
          <div className="flex items-center gap-1 bg-muted/60 rounded-lg px-1 py-1">
            <button
              onClick={() => mudarMes(-1)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2.5 text-sm font-semibold min-w-[130px] text-center">
              {formatarMesRef()}
            </span>
            <button
              onClick={() => mudarMes(1)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <Button
            onClick={abrirNovo}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-md shadow-violet-600/20"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo Funcionário</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* ========== RESUMO GERAL ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20">
          <CardContent className="p-3.5">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Funcionários</p>
            <p className="text-xl sm:text-2xl font-bold text-violet-700 dark:text-violet-300 mt-1">
              {dadosFuncionarios.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
          <CardContent className="p-3.5">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Pago</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
              {formatarMoeda(totalGeralPago)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20">
          <CardContent className="p-3.5">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Pendente</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {formatarMoeda(totalGeral)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
          <CardContent className="p-3.5">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Em dia</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {dadosFuncionarios.filter((d) => d.status === "pago").length}/{dadosFuncionarios.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========== MARCAÇÃO DE DIA ========== */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground hidden sm:inline">Marcar presença:</span>
              <Input
                type="date"
                value={dataMarcacao}
                onChange={(e) => setDataMarcacao(e.target.value)}
                className="h-9 text-sm max-w-[180px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  let erros = 0;
                  for (const f of funcionarios.filter((f) => f.ativo)) {
                    const jaMarcado = diasTrabalhados.some(
                      (d) => d.funcionarioId === f.id && d.data === dataMarcacao
                    );
                    if (!jaMarcado) {
                      const ok = await onMarcarDia(f.id, dataMarcacao);
                      if (!ok) erros++;
                    }
                  }
                  if (erros === 0) {
                    toast.success("Dia marcado para todos os funcionários!");
                  } else {
                    toast.error(`${erros} erro(s) ao marcar presença. Verifique a conexão.`);
                  }
                }}
                className="h-9 text-xs gap-1.5"
              >
                <Check className="size-3.5" />
                Marcar todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== LISTA DE CARDS DE FUNCIONÁRIOS ========== */}
      {dadosFuncionarios.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="p-4 rounded-2xl bg-muted/60 mb-4">
              <Users className="size-10 opacity-40" />
            </div>
            <p className="font-medium text-sm">Nenhum funcionário cadastrado</p>
            <p className="text-xs mt-1">Clique em &quot;Novo Funcionário&quot; para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dadosFuncionarios.map(
            ({
              funcionario: func,
              dias,
              diasPagos,
              diasPendentes,
              totalReceber,
              totalPago,
              pagamentos: pags,
              diaHojeMarcado,
              status,
            }) => {
              const isExpandido = cardExpandido === func.id;

              return (
                <Card
                  key={func.id}
                  className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    status === "pendente"
                      ? "border-amber-200 dark:border-amber-800/40"
                      : "border-emerald-200 dark:border-emerald-800/40"
                  }`}
                >
                  {/* Card Header com gradiente */}
                  <div className={`relative px-4 pt-4 pb-3 ${
                    status === "pendente"
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20"
                      : "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20"
                  }`}>
                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      {status === "pago" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 gap-1 text-[10px] font-semibold">
                          <CheckCircle2 className="size-3" />
                          PAGO
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0 gap-1 text-[10px] font-semibold">
                          <AlertTriangle className="size-3" />
                          PENDENTE
                        </Badge>
                      )}
                    </div>

                    {/* Avatar + Nome */}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        status === "pendente"
                          ? "bg-amber-100 dark:bg-amber-900/40"
                          : "bg-emerald-100 dark:bg-emerald-900/40"
                      }`}>
                        <UserCircle className={`size-6 ${
                          status === "pendente"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base truncate">{func.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatarMoeda(func.valorDia)}/dia
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-4 space-y-4">
                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/30">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Calendar className="size-3 text-blue-500" />
                          <span className="text-[10px] text-muted-foreground font-medium">Dias</span>
                        </div>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{dias.length}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <DollarSign className="size-3 text-amber-500" />
                          <span className="text-[10px] text-muted-foreground font-medium">Pendente</span>
                        </div>
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                          {totalReceber > 0 ? formatarMoeda(totalReceber) : "—"}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Check className="size-3 text-emerald-500" />
                          <span className="text-[10px] text-muted-foreground font-medium">Pago</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                          {totalPago > 0 ? formatarMoeda(totalPago) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Presença hoje */}
                    {diaHojeMarcado && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Presente em {new Date(dataMarcacao + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex-1 min-w-0 h-9 text-xs gap-1.5 cursor-pointer ${
                          diaHojeMarcado
                            ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                            : ""
                        }`}
                        onClick={() => handleMarcarDia(func.id)}
                        disabled={diaHojeMarcado}
                      >
                        <Check className="size-3.5" />
                        {diaHojeMarcado ? "Presente" : "Presença"}
                      </Button>

                      <Button
                        size="sm"
                        className="flex-1 min-w-0 h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                        onClick={() => {
                          if (diasPendentes.length === 0) {
                            toast.info("Nenhum dia pendente para pagar.");
                            return;
                          }
                          setFuncPagando({
                            id: func.id,
                            nome: func.nome,
                            total: totalReceber,
                            dias: diasPendentes.length,
                          });
                          setConfirmPagamentoAberto(true);
                        }}
                        disabled={diasPendentes.length === 0}
                      >
                        <CircleDollarSign className="size-3.5" />
                        Pagar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 cursor-pointer"
                        onClick={() => abrirEditar(func)}
                        title="Editar funcionário"
                      >
                        <Pencil className="size-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => {
                          setFuncExcluindo(func);
                          setConfirmAberto(true);
                        }}
                        title="Excluir funcionário"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* Botão expandir detalhes */}
                    {dias.length > 0 && (
                      <button
                        onClick={() => setCardExpandido(isExpandido ? null : func.id)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Clock className="size-3.5" />
                        {isExpandido ? "Ocultar detalhes" : "Ver detalhes"}
                      </button>
                    )}

                    {/* Detalhes expandidos */}
                    {isExpandido && (
                      <div className="space-y-3 pt-1 border-t">
                        {/* Lista de dias */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Dias Trabalhados ({dias.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {dias
                              .sort((a, b) => b.data.localeCompare(a.data))
                              .map((dia) => (
                                <div
                                  key={dia.id}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                    dia.pago
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                  }`}
                                >
                                  {new Date(
                                    dia.data + "T12:00:00"
                                  ).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                  {dia.pago ? (
                                    <CheckCircle2 className="size-3" />
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        const ok = await onDesmarcarDia(dia.id);
                                        if (ok) toast.success("Dia removido");
                                        else toast.error("Erro ao remover dia");
                                      }}
                                      className="hover:text-red-600 transition-colors cursor-pointer ml-0.5"
                                      title="Remover dia"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Histórico de pagamentos */}
                        {pags.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                              <History className="size-3" />
                              Pagamentos ({pags.length})
                            </p>
                            <div className="space-y-1.5">
                              {pags
                                .sort(
                                  (a, b) =>
                                    new Date(b.dataPagamento).getTime() -
                                    new Date(a.dataPagamento).getTime()
                                )
                                .map((pag) => (
                                  <div
                                    key={pag.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {formatarMoeda(pag.valor)}
                                      </span>
                                      <span className="text-muted-foreground text-xs">
                                        ({pag.diasPagos} dia{pag.diasPagos !== 1 ? "s" : ""})
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(pag.dataPagamento).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      )}

      {/* ========== RODAPÉ COM TOTAL ========== */}
      {dadosFuncionarios.length > 0 && (
        <Card className="border-violet-200 dark:border-violet-800/40 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Total geral pendente no mês
              </p>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                {formatarMoeda(totalGeral)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== DIALOG: Adicionar/Editar Funcionário ========== */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-violet-600" />
              {funcEditando ? "Editar Funcionário" : "Novo Funcionário"}
            </DialogTitle>
            <DialogDescription>
              {funcEditando
                ? "Atualize os dados do funcionário"
                : "Preencha os dados do novo funcionário"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nome *</Label>
              <Input
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome completo"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Valor por Dia (R$) *
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formValorDia}
                onChange={(e) => setFormValorDia(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {funcEditando ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG: Confirmação de Exclusão ========== */}
      <AlertDialog open={confirmAberto} onOpenChange={setConfirmAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{funcExcluindo?.nome}</strong>? Todos os dados
              relacionados (dias trabalhados, pagamentos) serão mantidos no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== DIALOG: Confirmação de Pagamento ========== */}
      <AlertDialog open={confirmPagamentoAberto} onOpenChange={setConfirmPagamentoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="size-5 text-emerald-600" />
              Confirmar Pagamento
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Deseja pagar todos os dias pendentes de{" "}
                  <strong>{funcPagando?.nome}</strong>?
                </p>
                {funcPagando && (
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted mt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Dias a pagar</p>
                      <p className="font-bold text-sm">{funcPagando.dias} dia{funcPagando.dias !== 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Valor total</p>
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatarMoeda(funcPagando.total)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarPagamento}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

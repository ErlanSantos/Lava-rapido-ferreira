"use client";

// Componente: Gerenciamento de Mensalistas — Cards modernos com CRUD, recibo e historico
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Phone,
  DollarSign,
  AlertCircle,
  CreditCard,
  StickyNote,
  Search,
  Clock,
  Car,
  CheckCircle2,
  History,
  Printer,
  CalendarCheck,
  X,
  Banknote,
  Package,
} from "lucide-react";
import type { Mensalista, Comanda, PagamentoMensalista, SaldoMensalista, ConsumoMensalista, Produto, Servico, ConfiguracoesRecibo } from "@/lib/types";
import { gerarId } from "@/lib/helpers";
import { fetchConfigRecibo } from "@/lib/supabase-service";
import { AddConsumoMensalistaDialog } from "./AddConsumoMensalistaDialog";

// ─── Props ───────────────────────────────────────────────────────────────────
interface MensalistasProps {
  mensalistas: Mensalista[];
  onAdicionar: (mensalista: Mensalista) => Promise<boolean>;
  onEditar: (id: string, dados: Partial<Mensalista>) => Promise<boolean>;
  onExcluir: (id: string) => void;
  onRegistrarPagamento: (id: string) => Promise<boolean>;
  comandas?: Comanda[];
  pagamentosMensalistas?: PagamentoMensalista[];
  saldoMensalistas?: SaldoMensalista[];
  consumosMensalistas?: ConsumoMensalista[];
  produtos?: Produto[];
  servicos?: Servico[];
  recalcularSaldos?: () => void | Promise<void>;
  onAdicionarConsumoMensalista?: (consumo: Omit<ConsumoMensalista, "id" | "createdAt">) => Promise<boolean>;
  onRemoverConsumoMensalista?: (id: string) => Promise<boolean>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dataStr: string): string {
  if (!dataStr) return "--/--/----";
  const [ano, mes, dia] = dataStr.split("-");
  if (!dia || !mes || !ano) return "--/--/----";
  return `${dia}/${mes}/${ano}`;
}

function extrairDiaVencimento(dataStr: string): number {
  if (!dataStr) return 1;
  return parseInt(dataStr.split("-")[2], 10) || 1;
}

function formatarDataHora(iso: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function calcularProximoVencimento(dia: number): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diaAtual = hoje.getDate();
  const mesAlvo = dia <= diaAtual ? mes + 1 : mes;
  const anoAlvo = mesAlvo > 11 ? ano + 1 : ano;
  const mesCorrigido = mesAlvo > 11 ? 0 : mesAlvo;
  const ultimoDia = new Date(anoAlvo, mesCorrigido + 1, 0).getDate();
  const diaFinal = Math.min(dia, ultimoDia);
  return `${anoAlvo}-${String(mesCorrigido + 1).padStart(2, "0")}-${String(diaFinal).padStart(2, "0")}`;
}

function obterIniciais(nome: string): string {
  return nome.split(" ").filter((p) => p.length > 0).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-amber-500",
  "bg-teal-500", "bg-indigo-500", "bg-rose-500", "bg-cyan-500",
  "bg-orange-500", "bg-blue-500",
];

function corAvatar(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type FiltroMensalista = "todos" | "ativos" | "vencidos";

// ─── Componente ─────────────────────────────────────────────────────────────
export function Mensalistas({
  mensalistas,
  onAdicionar,
  onEditar,
  onExcluir,
  onRegistrarPagamento,
  comandas = [],
  pagamentosMensalistas = [],
  saldoMensalistas = [],
  consumosMensalistas = [],
  produtos = [],
  servicos = [],
  recalcularSaldos,
  onAdicionarConsumoMensalista,
  onRemoverConsumoMensalista,
}: MensalistasProps) {
  // ── Estado dos dialogs ──────────────────────────────────────────────────
  const [dialogFormAberto, setDialogFormAberto] = useState(false);
  const [dialogConfirmExcluir, setDialogConfirmExcluir] = useState(false);
  const [dialogHistorico, setDialogHistorico] = useState(false);
  const [dialogRecibo, setDialogRecibo] = useState(false);
  const [dialogPagamentos, setDialogPagamentos] = useState(false);
  const [dialogPagamento, setDialogPagamento] = useState(false);
  const [dialogExtras, setDialogExtras] = useState<Mensalista | null>(null);
  const [editando, setEditando] = useState<Mensalista | null>(null);
  const [excluindo, setExcluindo] = useState<Mensalista | null>(null);
  const [mensalHistorico, setMensalHistorico] = useState<Mensalista | null>(null);
  const [mensalRecibo, setMensalRecibo] = useState<Mensalista | null>(null);
  const [mensalPagamentos, setMensalPagamentos] = useState<Mensalista | null>(null);
  const [mensalPagamento, setMensalPagamento] = useState<Mensalista | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pagando, setPagando] = useState(false);

  // ── Config do recibo (CNPJ, nome, etc.) ──
  const [configRecibo, setConfigRecibo] = useState<ConfiguracoesRecibo>({
    nomeEmpresa: "Lava-Rapido Ferreira",
    cnpj: "57.151.994/0001-64",
    endereco: "Rua Doutor Hugo Lacorte Vitale 238",
    telefone: "11937441944",
  });
  useEffect(() => { fetchConfigRecibo().then(setConfigRecibo); }, []);

  // ── Cabeçalho do recibo (reutilizado nos 2 recibos) ──
  const CabecalhoRecibo = () => (
    <div className="text-center border-b border-dashed border-gray-300 dark:border-gray-700 pb-3 mb-1 space-y-0.5">
      <p className="font-bold text-base">{configRecibo.nomeEmpresa || "Lava-Rapido Ferreira"}</p>
      {configRecibo.cnpj && (
        <p className="text-[9px] text-gray-500 dark:text-gray-400">CNPJ/CPF: {configRecibo.cnpj}</p>
      )}
      {configRecibo.endereco && (
        <p className="text-[9px] text-gray-500 dark:text-gray-400">{configRecibo.endereco}</p>
      )}
      {configRecibo.telefone && (
        <p className="text-[9px] text-gray-500 dark:text-gray-400">Tel: {configRecibo.telefone}</p>
      )}
    </div>
  );

  // ── Recibo de pagamento ────────────────────────────────────────────────
  const [ultimoPagamento, setUltimoPagamento] = useState<PagamentoMensalista | null>(null);
  const [dialogReciboPagamento, setDialogReciboPagamento] = useState(false);
  const reciboRef = useRef<HTMLDivElement>(null);
  const reciboPagamentoRef = useRef<HTMLDivElement>(null);

  // ── Estado do formulario ─────────────────────────────────────────────────
  const [formNome, setFormNome] = useState("");
  const [formTelefone, setFormTelefone] = useState("");
  const [formVeiculo, setFormVeiculo] = useState("");
  const [formPlaca, setFormPlaca] = useState("");
  const [formValorMensal, setFormValorMensal] = useState("");
  const [formDiaVencimento, setFormDiaVencimento] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formObservacaoPagamento, setFormObservacaoPagamento] = useState("");

  // ── Busca e filtro ──────────────────────────────────────────────────────
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroMensalista>("todos");

  // ── Resumo dinâmico por mensalista (via fetchSaldoMensalistas do banco) ──
  const resumoMensalistas = useMemo(() => {
    const resumo = new Map<string, SaldoMensalista>();
    for (const s of saldoMensalistas) {
      resumo.set(s.mensalistaId, s);
    }
    return resumo;
  }, [saldoMensalistas]);

  // ── Consumos extras por mensalista ──
  const extrasPorMensalista = useMemo(() => {
    const map = new Map<string, ConsumoMensalista[]>();
    for (const c of consumosMensalistas) {
      const existing = map.get(c.mensalistaId) || [];
      existing.push(c);
      map.set(c.mensalistaId, existing);
    }
    return map;
  }, [consumosMensalistas]);

  // ── Metricas ────────────────────────────────────────────────────────────
  const metricas = useMemo(() => {
    const total = mensalistas.length;
    const ativos = mensalistas.filter((m) => m.status === "ativo");
    const vencidos = mensalistas.filter((m) => m.status === "vencido");
    const potencialMensal = ativos.reduce((soma, m) => soma + m.valorMensal, 0);
    const mesAtual = new Date().toISOString().substring(0, 7);
    const receitaReal = pagamentosMensalistas
      .filter(p => p.dataPagamento.substring(0, 7) === mesAtual)
      .reduce((soma, p) => soma + p.valor, 0);
    return { total, ativos: ativos.length, vencidos: vencidos.length, potencialMensal, receitaReal };
  }, [mensalistas, pagamentosMensalistas]);

  // ── Mensalistas filtrados ───────────────────────────────────────────────
  const mensalistasFiltrados = useMemo(() => {
    let lista = mensalistas;
    if (filtro === "ativos") lista = lista.filter((m) => m.status === "ativo");
    else if (filtro === "vencidos") lista = lista.filter((m) => m.status === "vencido");
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      lista = lista.filter(
        (m) =>
          m.nome.toLowerCase().includes(termo) ||
          m.veiculo.toLowerCase().includes(termo) ||
          m.placa.toLowerCase().includes(termo) ||
          m.telefone.includes(termo)
      );
    }
    return lista;
  }, [mensalistas, filtro, busca]);

  // ── Funcoes do formulario ───────────────────────────────────────────────
  const resetarForm = () => {
    setFormNome(""); setFormTelefone(""); setFormVeiculo(""); setFormPlaca("");
    setFormValorMensal(""); setFormDiaVencimento(""); setFormObservacoes("");
  };

  const abrirNovoMensalista = () => { setEditando(null); resetarForm(); setDialogFormAberto(true); };

  const abrirEditarMensalista = (m: Mensalista) => {
    setEditando(m);
    setFormNome(m.nome); setFormTelefone(m.telefone); setFormVeiculo(m.veiculo);
    setFormPlaca(m.placa); setFormValorMensal(String(m.valorMensal));
    setFormDiaVencimento(String(extrairDiaVencimento(m.vencimento)));
    setFormObservacoes(m.observacoes);
    setDialogFormAberto(true);
  };

  const abrirConfirmarExclusao = (m: Mensalista) => { setExcluindo(m); setDialogConfirmExcluir(true); };
  const abrirHistorico = (m: Mensalista) => { setMensalHistorico(m); setDialogHistorico(true); };
  const abrirRecibo = (m: Mensalista) => { setMensalRecibo(m); setDialogRecibo(true); };
  const abrirPagamentos = (m: Mensalista) => { setMensalPagamentos(m); setDialogPagamentos(true); };

  // ── Abrir modal de pagamento ────────────────────────────────────────────
  const abrirModalPagamento = (m: Mensalista) => {
    setMensalPagamento(m);
    setFormObservacaoPagamento("");
    setDialogPagamento(true);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) { toast.error("Informe o nome do mensalista"); return; }
    if (!formVeiculo.trim()) { toast.error("Informe o veiculo"); return; }
    if (!formPlaca.trim()) { toast.error("Informe a placa do veiculo"); return; }
    const valorMensal = parseFloat(formValorMensal) || 0;
    if (valorMensal <= 0) { toast.error("Informe um valor valido"); return; }
    const diaVencimento = parseInt(formDiaVencimento, 10);
    if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
      toast.error("Informe um dia de vencimento entre 1 e 31"); return;
    }

    setSalvando(true);
    try {
      const vencimento = calcularProximoVencimento(diaVencimento);

      if (editando) {
        const ok = await onEditar(editando.id, {
          nome: formNome.trim(), telefone: formTelefone.trim(), veiculo: formVeiculo.trim(),
          placa: formPlaca.trim().toUpperCase(), valorMensal, vencimento,
          observacoes: formObservacoes.trim(),
        });
        if (ok) {
          toast.success("Mensalista atualizado com sucesso!");
          setDialogFormAberto(false);
        } else {
          toast.error("Erro ao atualizar mensalista.");
        }
      } else {
        const novo: Mensalista = {
          id: gerarId(), nome: formNome.trim(), telefone: formTelefone.trim(),
          veiculo: formVeiculo.trim(), placa: formPlaca.trim().toUpperCase(),
          valorMensal, vencimento, status: "ativo",
          observacoes: formObservacoes.trim(),
          createdAt: new Date().toISOString(),
        };
        const ok = await onAdicionar(novo);
        if (ok) {
          toast.success("Mensalista adicionado com sucesso!");
          setDialogFormAberto(false);
        } else {
          toast.error("Erro ao salvar mensalista. Verifique o console.");
        }
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarExclusao = () => {
    if (excluindo) {
      onExcluir(excluindo.id);
      toast.success("Mensalista excluido com sucesso!");
      setExcluindo(null); setDialogConfirmExcluir(false);
    }
  };

  // ── Confirmar pagamento no modal ────────────────────────────────────────
  const handleConfirmarPagamento = async () => {
    if (!mensalPagamento) return;
    setPagando(true);
    try {
      const ok = await onRegistrarPagamento(mensalPagamento.id);
      if (ok) {
        toast.success(`Pagamento de ${formatarMoeda(mensalPagamento.valorMensal)} registrado para ${mensalPagamento.nome}!`);

        // Recalcular saldos mensalistas
        recalcularSaldos?.();

        // Buscar ultimo pagamento para recibo
        const pagamentosRecentes = pagamentosMensalistas
          .filter(p => p.mensalistaId === mensalPagamento.id)
          .sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime());

        if (pagamentosRecentes.length > 0) {
          setUltimoPagamento(pagamentosRecentes[0]);
        }

        setDialogPagamento(false);

        // Abrir recibo de pagamento automaticamente
        if (pagamentosRecentes.length > 0) {
          setDialogReciboPagamento(true);
        }
      } else {
        toast.error("Erro ao registrar pagamento. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao registrar pagamento. Tente novamente.");
    } finally {
      setPagando(false);
    }
  };

  // ── Imprimir recibo generico ────────────────────────────────────────────
  const handleImprimirRecibo = () => {
    if (!reciboRef.current) return;
    const printContent = reciboRef.current.innerHTML;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) { toast.error("Nao foi possivel abrir a janela de impressao"); return; }
    win.document.write(`
      <!DOCTYPE html><html><head><title>Recibo Mensalista</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
      </style>
      </head><body>${printContent}
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // ── Imprimir recibo de pagamento ────────────────────────────────────────
  const handleImprimirReciboPagamento = () => {
    if (!reciboPagamentoRef.current) return;
    const printContent = reciboPagamentoRef.current.innerHTML;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) { toast.error("Nao foi possivel abrir a janela de impressao"); return; }
    win.document.write(`
      <!DOCTYPE html><html><head><title>Recibo de Pagamento</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
      </style>
      </head><body>${printContent}
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // ── Historico de pagamentos do mensalista selecionado ─────────────────
  const pagamentosDoMensalista = useMemo(() => {
    if (!mensalPagamentos) return [];
    return pagamentosMensalistas.filter(p => p.mensalistaId === mensalPagamentos.id);
  }, [pagamentosMensalistas, mensalPagamentos]);

  // ── Historico ───────────────────────────────────────────────────────────
  const historicoMensalista = useMemo(() => {
    if (!mensalHistorico) return [];
    return comandas.filter(
      (c) =>
        c.cliente?.placa &&
        c.cliente.placa.toUpperCase().replace(/[^A-Z0-9]/g, "") ===
          mensalHistorico.placa.toUpperCase().replace(/[^A-Z0-9]/g, "")
    );
  }, [comandas, mensalHistorico]);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* === DIALOGS === */}
      <AddConsumoMensalistaDialog
        mensalistaId={dialogExtras?.id || ""}
        mensalistaNome={dialogExtras?.nome || ""}
        aberto={!!dialogExtras}
        onFechar={() => setDialogExtras(null)}
        onAdicionar={async (consumo) => {
          if (onAdicionarConsumoMensalista) {
            await onAdicionarConsumoMensalista(consumo);
          }
        }}
        produtos={produtos}
        servicos={servicos}
      />

      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Users className="size-5 sm:size-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Mensalistas</h2>
            <p className="text-xs text-muted-foreground">
              {metricas.total} cadastrado{metricas.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={abrirNovoMensalista} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/25 transition-all duration-200 hover:shadow-blue-600/40 hover:scale-[1.02] w-full sm:w-auto">
          <Plus className="size-4" /> Novo Mensalista
        </Button>
      </div>

      {/* === CARDS RESUMO === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total</p>
                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1 tabular-nums">{metricas.total}</p>
              </div>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <Users className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Ativos</p>
                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1 tabular-nums">{metricas.ativos}</p>
              </div>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/20 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Vencidos</p>
                <p className="text-2xl font-extrabold text-red-700 dark:text-red-300 mt-1 tabular-nums">{metricas.vencidos}</p>
              </div>
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/20 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Recebido Mês</p>
                <p className="text-lg sm:text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{formatarMoeda(metricas.receitaReal)}</p>
                <p className="text-[9px] text-muted-foreground">{metricas.ativos} ativo{metricas.ativos !== 1 ? "s" : ""}</p>
              </div>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === BUSCA + FILTROS === */}
      {mensalistas.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, veiculo, placa..." className="pl-9 h-10 bg-muted/50 border-muted-foreground/10" />
          </div>
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 border border-muted-foreground/10">
            {([
              { key: "todos" as FiltroMensalista, label: "Todos", count: metricas.total },
              { key: "ativos" as FiltroMensalista, label: "Ativos", count: metricas.ativos },
              { key: "vencidos" as FiltroMensalista, label: "Vencidos", count: metricas.vencidos },
            ]).map((f) => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${filtro === f.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === GRID DE CARDS === */}
      {mensalistas.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
            <div className="p-4 rounded-2xl bg-muted/60 mb-4"><Users className="size-10 opacity-40" /></div>
            <p className="font-medium text-sm">Nenhum mensalista cadastrado</p>
            <p className="text-xs mt-1">Clique em &quot;Novo Mensalista&quot; para comecar</p>
          </CardContent>
        </Card>
      ) : mensalistasFiltrados.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 text-muted-foreground">
            <div className="p-4 rounded-2xl bg-muted/60 mb-4"><Search className="size-8 opacity-40" /></div>
            <p className="font-medium text-sm">Nenhum mensalista encontrado</p>
            <p className="text-xs mt-1">Tente alterar os termos da busca ou o filtro</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {mensalistasFiltrados.map((m) => {
            const isAtivo = m.status === "ativo";
            const diaVenc = extrairDiaVencimento(m.vencimento);
            const resumo = resumoMensalistas.get(m.id);
            return (
              <Card key={m.id} className={`group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-border/50 ${isAtivo ? "hover:border-blue-300/60 dark:hover:border-blue-700/60" : "hover:border-red-300/60 dark:hover:border-red-700/60"}`}>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* ── TOPO: Avatar + Nome + Badge ── */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${corAvatar(m.nome)} flex items-center justify-center shadow-lg`}>
                        <span className="text-white text-sm sm:text-base font-bold">{obterIniciais(m.nome)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[15px] sm:text-base leading-tight truncate">{m.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                          <Car className="size-3 shrink-0" /><span className="truncate">{m.veiculo}</span>
                          <span className="text-muted-foreground/40 shrink-0">&bull;</span>
                          <span className="font-mono font-semibold tracking-wider uppercase">{m.placa}</span>
                        </p>
                      </div>
                    </div>
                    <Badge className={`shrink-0 border-0 gap-1 text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full ${isAtivo ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300" : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"}`}>
                      {isAtivo ? "ATIVO" : "VENCIDO"}
                    </Badge>
                  </div>

                  {/* ── TOTAL ACUMULADO (hero) ── */}
                  <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 ${isAtivo
                    ? "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-blue-600 dark:via-blue-700 dark:to-blue-800"
                    : "bg-gradient-to-br from-red-400 via-red-500 to-rose-500 dark:from-red-600 dark:via-red-700 dark:to-rose-700"
                  }`}>
                    {/* Decorative circles */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
                    <div className="relative">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-white/80 uppercase tracking-wider">Total Acumulado</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tabular-nums tracking-tight">
                        {formatarMoeda(resumo?.totalAcumulado || 0)}
                      </p>
                      <div className="flex items-center gap-3 mt-2.5 text-[10px] sm:text-xs text-white/70">
                        <span className="flex items-center gap-1">
                          <Car className="size-3" />
                          {resumo?.quantidadeLavagens || 0} lavagens
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="size-3" />
                          {formatarMoeda(resumo?.totalExtras || 0)} extras
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── METRICAS COMPACTAS ── */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="text-center rounded-xl bg-blue-50/80 dark:bg-blue-950/30 py-2 sm:py-2.5 px-1">
                      <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase leading-none">Acumulado</p>
                      <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">{formatarMoeda(resumo?.totalAcumulado || 0)}</p>
                    </div>
                    <div className="text-center rounded-xl bg-violet-50/80 dark:bg-violet-950/30 py-2 sm:py-2.5 px-1">
                      <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase leading-none">Lavagens</p>
                      <p className="text-xs sm:text-sm font-bold text-violet-600 dark:text-violet-400 mt-1 tabular-nums">{resumo?.quantidadeLavagens || 0}</p>
                    </div>
                    <div className="text-center rounded-xl bg-cyan-50/80 dark:bg-cyan-950/30 py-2 sm:py-2.5 px-1">
                      <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase leading-none">Extras</p>
                      <p className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-1 tabular-nums">{formatarMoeda(resumo?.totalExtras || 0)}</p>
                    </div>
                    <div className="text-center rounded-xl bg-pink-50/80 dark:bg-pink-950/30 py-2 sm:py-2.5 px-1">
                      <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase leading-none">Pago</p>
                      <p className="text-xs sm:text-sm font-bold text-pink-600 dark:text-pink-400 mt-1 tabular-nums">{formatarMoeda(resumo?.totalPago || 0)}</p>
                    </div>
                  </div>

                  {/* ── CONSUMOS EXTRAS DO MÊS ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Package className="size-3.5" />
                        Extras do Mês
                        {extrasPorMensalista.get(m.id) && (
                          <span className="text-blue-600 dark:text-blue-400">({extrasPorMensalista.get(m.id)!.length})</span>
                        )}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] gap-1 px-2 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); setDialogExtras(m); }}
                      >
                        <Plus className="size-3" /> Adicionar
                      </Button>
                    </div>
                    {extrasPorMensalista.get(m.id) && extrasPorMensalista.get(m.id)!.length > 0 ? (
                      <div className="space-y-1.5">
                        {extrasPorMensalista.get(m.id)!.map((extra) => (
                          <div key={extra.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs group">
                            <div className="min-w-0 flex-1">
                              <span className="font-medium truncate block">{extra.nome}</span>
                              <span className="text-muted-foreground">
                                {extra.quantidade}x {formatarMoeda(extra.valorUnitario)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{formatarMoeda(extra.subtotal)}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onRemoverConsumoMensalista && confirm(`Remover "${extra.nome}"?`)) {
                                    onRemoverConsumoMensalista(extra.id).then(() => {
                                      toast.success("Extra removido do acumulativo");
                                    });
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all p-0.5"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground py-1">Nenhum extra adicionado este mês</p>
                    )}
                  </div>

                  {/* ── OBS ── */}
                  {m.observacoes && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                      <StickyNote className="size-3 shrink-0" />{m.observacoes}
                    </p>
                  )}

                  {/* ── BOTOES DE ACAO ── */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      size="sm"
                      className={`flex-1 h-9 sm:h-10 text-xs font-semibold gap-1.5 text-white shadow-md transition-all duration-200 hover:scale-[1.02] ${isAtivo
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25"
                        : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/25"
                      }`}
                      onClick={() => abrirModalPagamento(m)}
                    >
                      <Banknote className="size-4" /> Receber
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/30" onClick={() => abrirEditarMensalista(m)} title="Editar">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0" onClick={() => abrirHistorico(m)} title="Historico de Servicos">
                      <History className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0" onClick={() => abrirPagamentos(m)} title="Historico de Pagamentos">
                      <DollarSign className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0" onClick={() => abrirRecibo(m)} title="Imprimir Recibo">
                      <Printer className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/30" onClick={() => abrirConfirmarExclusao(m)} title="Excluir">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* === RODAPE FATURAMENTO === */}
      {mensalistas.length > 0 && (
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-600/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20"><DollarSign className="size-5 text-white" /></div>
                <div>
                  <p className="text-xs text-blue-100 font-medium">Recebido no mês</p>
                  <p className="text-xs text-blue-200/80">{metricas.ativos} ativo{metricas.ativos !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{formatarMoeda(metricas.receitaReal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === DIALOG: Novo/Editar === */}
      <Dialog open={dialogFormAberto} onOpenChange={(v) => { if (!salvando) setDialogFormAberto(v); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40"><Users className="size-4 text-blue-600 dark:text-blue-400" /></div>
              {editando ? "Editar Mensalista" : "Novo Mensalista"}
            </DialogTitle>
            <DialogDescription>{editando ? "Atualize os dados do mensalista" : "Preencha os dados do novo mensalista"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mNome" className="text-sm font-medium">Nome *</Label>
              <Input id="mNome" value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Nome completo" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mTelefone" className="text-sm font-medium">Telefone</Label>
              <Input id="mTelefone" value={formTelefone} onChange={(e) => setFormTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mVeiculo" className="text-sm font-medium">Veiculo *</Label>
              <Input id="mVeiculo" value={formVeiculo} onChange={(e) => setFormVeiculo(e.target.value)} placeholder="Ex: Honda Civic 2022" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mPlaca" className="text-sm font-medium">Placa *</Label>
              <Input id="mPlaca" value={formPlaca} onChange={(e) => setFormPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))} placeholder="ABC1D23" className="uppercase font-mono tracking-widest" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mValor" className="text-sm font-medium">Valor de Referência (R$) *</Label>
                <Input id="mValor" type="number" min="0" step="0.01" value={formValorMensal} onChange={(e) => setFormValorMensal(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mDia" className="text-sm font-medium">Dia Vencimento *</Label>
                <Input id="mDia" type="number" min="1" max="31" value={formDiaVencimento} onChange={(e) => setFormDiaVencimento(e.target.value)} placeholder="1-31" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mObs" className="text-sm font-medium">Observacoes</Label>
              <textarea id="mObs" value={formObservacoes} onChange={(e) => setFormObservacoes(e.target.value)} placeholder="Observacoes adicionais (opcional)" rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none" />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDialogFormAberto(false)} disabled={salvando}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={salvando}>
                {salvando ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</span>
                ) : (editando ? "Salvar Alteracoes" : "Adicionar Mensalista")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* === DIALOG: Exclusao === */}
      <Dialog open={dialogConfirmExcluir} onOpenChange={setDialogConfirmExcluir}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="size-5" /> Excluir Mensalista</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>Tem certeza que deseja excluir <strong>{excluindo?.nome}</strong>? Esta acao nao pode ser desfeita.</p>
                {excluindo && (
                  <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                    <p><span className="text-muted-foreground">Veiculo:</span> <span className="font-medium">{excluindo.veiculo} — {excluindo.placa}</span></p>
                    <p><span className="text-muted-foreground">Valor de referência:</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{formatarMoeda(excluindo.valorMensal)}</span></p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDialogConfirmExcluir(false); setExcluindo(null); }}>Cancelar</Button>
            <Button type="button" className="bg-destructive text-white hover:bg-destructive/90" onClick={handleConfirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === DIALOG: Receber (CONFIRMACAO) === */}
      <Dialog open={dialogPagamento} onOpenChange={(v) => { if (!pagando) setDialogPagamento(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40"><Banknote className="size-4 text-blue-600 dark:text-blue-400" /></div>
              Receber
            </DialogTitle>
            <DialogDescription>Confirme o recebimento</DialogDescription>
          </DialogHeader>

          {mensalPagamento && (
            <div className="space-y-4">
              {/* Dados do mensalista */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 w-12 h-12 rounded-full ${corAvatar(mensalPagamento.nome)} flex items-center justify-center shadow-lg`}>
                    <span className="text-white text-sm font-bold">{obterIniciais(mensalPagamento.nome)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base truncate">{mensalPagamento.nome}</p>
                    <p className="text-sm text-muted-foreground">{mensalPagamento.veiculo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background p-2.5 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Placa</p>
                    <p className="text-sm font-mono font-bold uppercase">{mensalPagamento.placa}</p>
                  </div>
                  <div className="rounded-lg bg-background p-2.5 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</p>
                    <p className="text-sm font-medium">{mensalPagamento.telefone || "---"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background p-2.5 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Acumulado</p>
                    <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{formatarMoeda(resumoMensalistas.get(mensalPagamento.id)?.totalAcumulado || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-background p-2.5 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Pago</p>
                    <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{formatarMoeda(resumoMensalistas.get(mensalPagamento.id)?.totalPago || 0)}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-background p-2.5 space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge className={`border-0 text-[10px] font-bold px-2 py-0.5 mt-1 ${mensalPagamento.status === "ativo" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300" : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"}`}>
                    {mensalPagamento.status === "ativo" ? "ATIVO" : "VENCIDO"}
                  </Badge>
                </div>
              </div>

              {/* Observacao */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Observacao (opcional)</Label>
                <textarea
                  value={formObservacaoPagamento}
                  onChange={(e) => setFormObservacaoPagamento(e.target.value)}
                  placeholder="Ex: Pago com PIX, Dinheiro..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Info */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-semibold">Apos confirmar:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>Vencimento sera atualizado para +30 dias</li>
                  <li>Valor sera adicionado ao faturamento</li>
                  <li>Mensalista sera marcado como ativo</li>
                  <li>Dashboard sera atualizado automaticamente</li>
                  <li>Recibo sera gerado para impressao</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogPagamento(false)} disabled={pagando}>Cancelar</Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              disabled={pagando}
              onClick={handleConfirmarPagamento}
            >
              {pagando ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processando...</span>
              ) : (
                <>
                  <Banknote className="size-4" /> Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === DIALOG: Recibo de Pagamento === */}
      <Dialog open={dialogReciboPagamento} onOpenChange={setDialogReciboPagamento}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40"><Printer className="size-4 text-blue-600 dark:text-blue-400" /></div>
              Recibo de Pagamento
            </DialogTitle>
            <DialogDescription>Comprovante de recebimento</DialogDescription>
          </DialogHeader>

          {mensalPagamento && ultimoPagamento && (
            <>
              <div ref={reciboPagamentoRef} className="bg-white dark:bg-gray-950 rounded-lg p-5 border font-mono text-xs space-y-3 text-gray-900 dark:text-gray-100">
                <CabecalhoRecibo />

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 space-y-1">
                  <p><strong>Cliente:</strong> {mensalPagamento.nome}</p>
                  <p><strong>Veiculo:</strong> {mensalPagamento.veiculo}</p>
                  <p><strong>Placa:</strong> {mensalPagamento.placa.toUpperCase()}</p>
                  <p><strong>Telefone:</strong> {mensalPagamento.telefone || "---"}</p>
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 space-y-1">
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">COMPROVANTE DE PAGAMENTO</p>
                  <p><strong>Valor Pago:</strong> {formatarMoeda(ultimoPagamento.valor)}</p>
                  <p><strong>Vencimento Anterior:</strong> {formatarData(ultimoPagamento.vencimentoAnterior)}</p>
                  <p><strong>Novo Vencimento:</strong> {formatarData(ultimoPagamento.novoVencimento)}</p>
                  {ultimoPagamento.observacao && (
                    <p><strong>Observacao:</strong> {ultimoPagamento.observacao}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 text-center">
                  <p><strong>Data do Pagamento:</strong> {formatarDataHora(ultimoPagamento.dataPagamento)}</p>
                  <p className="mt-3 text-[10px] text-gray-400">Documento nao fiscal — apenas para controle interno</p>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setDialogReciboPagamento(false)} className="gap-2">
                  <X className="size-4" /> Fechar
                </Button>
                <Button onClick={handleImprimirReciboPagamento} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Printer className="size-4" /> Imprimir Recibo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* === DIALOG: Historico === */}
      <Dialog open={dialogHistorico} onOpenChange={setDialogHistorico}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40"><History className="size-4 text-violet-600 dark:text-violet-400" /></div>
              Historico de Servicos
            </DialogTitle>
            {mensalHistorico && (
              <DialogDescription>{mensalHistorico.nome} — {mensalHistorico.veiculo} <span className="font-mono uppercase">({mensalHistorico.placa})</span></DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {historicoMensalista.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <Clock className="size-8 opacity-30 mb-3" />
                <p className="text-sm font-medium">Nenhum servico encontrado</p>
                <p className="text-xs mt-1">O historico aparecera aqui quando este mensalista tiver lavagens registradas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{historicoMensalista.length} servico{historicoMensalista.length !== 1 ? "s" : ""}</p>
                {historicoMensalista.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                    <div className={`shrink-0 w-2 h-2 rounded-full ${c.status === "finalizada" ? "bg-blue-500" : "bg-amber-500 animate-pulse"}`} />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold">#{c.numero} — {c.servico}</p>
                        {c.lavagemGratis && <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0 text-[9px] px-1.5 py-0">GRATIS</Badge>}
                        {c.mensalista && <Badge className="shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0 text-[9px] px-1.5 py-0">ACUMULATIVO</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatarDataHora(c.dataEntrada)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{formatarMoeda(c.total)}</p>
                      <Badge className={`text-[9px] border-0 mt-0.5 ${c.status === "finalizada" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"}`}>
                        {c.status === "finalizada" ? "Finalizada" : "Em andamento"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* === DIALOG: Recibo de Servico === */}
      <Dialog open={dialogRecibo} onOpenChange={setDialogRecibo}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40"><Printer className="size-4 text-blue-600 dark:text-blue-400" /></div>
              Recibo do Mensalista
            </DialogTitle>
            {mensalRecibo && (
            <DialogDescription>Recibo de servico para {mensalRecibo.nome}</DialogDescription>
            )}
          </DialogHeader>

          {mensalRecibo && (
            <>
              <div ref={reciboRef} className="bg-white dark:bg-gray-950 rounded-lg p-5 border font-mono text-xs space-y-3 text-gray-900 dark:text-gray-100">
                <CabecalhoRecibo />

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 space-y-1">
                  <p><strong>Cliente:</strong> {mensalRecibo.nome}</p>
                  <p><strong>Veiculo:</strong> {mensalRecibo.veiculo}</p>
                  <p><strong>Placa:</strong> {mensalRecibo.placa.toUpperCase()}</p>
                  <p><strong>Telefone:</strong> {mensalRecibo.telefone || "---"}</p>
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 space-y-1">
                  <p><strong>Servico:</strong> Lavagem (Acumulativo)</p>
                  <p><strong>Valor:</strong> {formatarMoeda(resumoMensalistas.get(mensalRecibo.id)?.totalLavagens || 0)}</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-2">
                    Servico acumulado no periodo
                  </p>
                </div>

                {/* Detalhamento de extras */}
                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 space-y-1">
                  <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Produtos / Servicos Extras</p>
                  {(() => {
                    const extras = extrasPorMensalista.get(mensalRecibo.id);
                    if (!extras || extras.length === 0) {
                      return <p className="text-muted-foreground">Extras: {formatarMoeda(0)}</p>;
                    }
                    return (
                      <>
                        {extras.map((e) => (
                          <div key={e.id} className="flex justify-between text-xs">
                            <span>{e.nome} x{e.quantidade}</span>
                            <span>{formatarMoeda(e.subtotal)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-gray-300 dark:border-gray-700">
                          <span>Subtotal Extras</span>
                          <span>{formatarMoeda(resumoMensalistas.get(mensalRecibo.id)?.totalExtras || 0)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 space-y-1">
                  <p><strong>Total Acumulado:</strong> {formatarMoeda(resumoMensalistas.get(mensalRecibo.id)?.totalAcumulado || 0)}</p>
                  <p><strong>Total Pago:</strong> {formatarMoeda(resumoMensalistas.get(mensalRecibo.id)?.totalPago || 0)}</p>
                  <p><strong>Saldo:</strong> {formatarMoeda(resumoMensalistas.get(mensalRecibo.id)?.saldoPendente || 0)}</p>
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-3 text-center">
                  <p><strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")} {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="mt-3 text-[10px] text-gray-400">Documento nao fiscal — apenas para controle interno</p>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setDialogRecibo(false)} className="gap-2">
                  <X className="size-4" /> Fechar
                </Button>
                <Button onClick={handleImprimirRecibo} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Printer className="size-4" /> Imprimir Recibo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* === DIALOG: Historico de Pagamentos === */}
      <Dialog open={dialogPagamentos} onOpenChange={setDialogPagamentos}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40"><DollarSign className="size-4 text-blue-600 dark:text-blue-400" /></div>
              Historico de Pagamentos
            </DialogTitle>
            {mensalPagamentos && (
              <DialogDescription>{mensalPagamentos.nome} — Acumulado: {formatarMoeda(resumoMensalistas.get(mensalPagamentos.id)?.totalAcumulado || 0)}</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {pagamentosDoMensalista.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <CreditCard className="size-8 opacity-30 mb-3" />
                <p className="text-sm font-medium">Nenhum pagamento registrado</p>
                <p className="text-xs mt-1">Os pagamentos aparecerao aqui quando o mensalista efetuar o pagamento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{pagamentosDoMensalista.length} pagamento{pagamentosDoMensalista.length !== 1 ? "s" : ""}</p>
                {pagamentosDoMensalista.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{formatarMoeda(p.valor)}</p>
                      <p className="text-xs text-muted-foreground">{formatarData(p.vencimentoAnterior)} — {formatarData(p.novoVencimento)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formatarDataHora(p.dataPagamento)}</p>
                      {p.observacao && <p className="text-[10px] text-muted-foreground">{p.observacao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

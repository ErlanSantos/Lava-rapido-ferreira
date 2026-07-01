"use client";

// Componente: Controle de Despesas
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Receipt,
  Plus,
  Pencil,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { Despesa } from "@/lib/types";
import { formatarMoeda } from "@/lib/helpers";
import { toast } from "sonner";

interface DespesasProps {
  despesas: Despesa[];
  onAdicionar: (despesa: Despesa) => Promise<boolean>;
  onEditar: (id: string, dados: Partial<Despesa>) => Promise<boolean>;
  onExcluir: (id: string) => Promise<boolean>;
}

export function Despesas({
  despesas,
  onAdicionar,
  onEditar,
  onExcluir,
}: DespesasProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState<Despesa | null>(null);
  const [despesaExcluindo, setDespesaExcluindo] = useState<Despesa | null>(null);

  // Formulário
  const [formDescricao, setFormDescricao] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formData, setFormData] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Mês/ano para filtro
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Despesas filtradas por mês
  const despesasDoMes = useMemo(() => {
    return despesas.filter((d) => d.data.startsWith(mesRef));
  }, [despesas, mesRef]);

  // Total do mês
  const totalMes = useMemo(
    () => despesasDoMes.reduce((s, d) => s + d.valor, 0),
    [despesasDoMes]
  );

  // Navegar mês
  const irParaMesAnterior = () => {
    const [ano, mes] = mesRef.split("-").map(Number);
    const d = new Date(ano, mes - 2, 1);
    setMesRef(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const irParaProximoMes = () => {
    const [ano, mes] = mesRef.split("-").map(Number);
    const d = new Date(ano, mes, 1);
    setMesRef(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const formatarMesRef = () => {
    const [ano, mes] = mesRef.split("-").map(Number);
    return `${mesesNomes[mes - 1]} ${ano}`;
  };

  const abrirNovo = () => {
    setDespesaEditando(null);
    setFormDescricao("");
    setFormValor("");
    const d = new Date();
    setFormData(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    setDialogAberto(true);
  };

  const abrirEditar = (despesa: Despesa) => {
    setDespesaEditando(despesa);
    setFormDescricao(despesa.descricao);
    setFormValor(String(despesa.valor));
    setFormData(despesa.data);
    setDialogAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescricao.trim()) {
      toast.error("Informe a descrição da despesa");
      return;
    }
    const valor = parseFloat(formValor) || 0;
    if (valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    if (despesaEditando) {
      const ok = await onEditar(despesaEditando.id, {
        descricao: formDescricao.trim(),
        valor,
        data: formData,
      });
      if (ok) {
        toast.success("Despesa atualizada!");
        setDialogAberto(false);
      } else {
        toast.error("Erro ao atualizar despesa. Verifique a conexão.");
      }
    } else {
      const novaDespesa: Despesa = {
        id: crypto.randomUUID(),
        descricao: formDescricao.trim(),
        valor,
        data: formData,
      };
      const ok = await onAdicionar(novaDespesa);
      if (ok) {
        toast.success("Despesa adicionada!");
        setDialogAberto(false);
      } else {
        toast.error("Erro ao salvar despesa. Verifique a conexão com o banco de dados.");
      }
    }
  };

  const handleExcluir = async () => {
    if (despesaExcluindo) {
      const ok = await onExcluir(despesaExcluindo.id);
      if (ok) {
        toast.success("Despesa excluída!");
        setDespesaExcluindo(null);
        setConfirmAberto(false);
      } else {
        toast.error("Erro ao excluir despesa. Verifique a conexão.");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Receipt className="size-5 text-red-500" />
              Despesas
            </CardTitle>
            <Button
              onClick={abrirNovo}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Plus className="size-4" />
              Nova Despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navegação do mês */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={irParaMesAnterior}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              ←
            </button>
            <span className="font-semibold text-sm">{formatarMesRef()}</span>
            <button
              onClick={irParaProximoMes}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              →
            </button>
          </div>

          {/* Total do mês */}
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingDown className="size-4 text-red-500" />
                Total de despesas no mês
              </span>
              <span className="font-bold text-xl text-red-600 dark:text-red-400">
                {formatarMoeda(totalMes)}
              </span>
            </div>
          </div>

          {/* Lista de despesas */}
          {despesasDoMes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Receipt className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma despesa neste mês</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {despesasDoMes
                .sort((a, b) => b.data.localeCompare(a.data))
                .map((despesa) => (
                  <div
                    key={despesa.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {despesa.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(despesa.data + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {formatarMoeda(despesa.valor)}
                      </span>
                      <button
                        onClick={() => abrirEditar(despesa)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDespesaExcluindo(despesa);
                          setConfirmAberto(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Contador */}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {despesasDoMes.length} despesa(s) no período
          </p>
        </CardContent>
      </Card>

      {/* Dialog de adicionar/editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-red-500" />
              {despesaEditando ? "Editar Despesa" : "Nova Despesa"}
            </DialogTitle>
            <DialogDescription>
              {despesaEditando
                ? "Atualize os dados da despesa"
                : "Preencha os dados da nova despesa"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Descrição *</Label>
              <Input
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Ex: Sabão, Energia, Água..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Valor (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValor}
                  onChange={(e) => setFormValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Data *</Label>
                <Input
                  type="date"
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                />
              </div>
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
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {despesaEditando ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação */}
      <AlertDialog open={confirmAberto} onOpenChange={setConfirmAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Despesa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa{" "}
              <strong>{despesaExcluindo?.descricao}</strong>?
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
    </div>
  );
}

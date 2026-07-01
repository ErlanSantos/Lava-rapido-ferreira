"use client";

// Componente: Gerenciamento de serviços com CRUD
import { useState } from "react";
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
import {
  Switch,
} from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Servico } from "@/lib/types";
import { formatarMoeda, gerarId } from "@/lib/helpers";
import { toast } from "sonner";

interface ServicosProps {
  servicos: Servico[];
  onAdicionar: (servico: Servico) => void;
  onEditar: (id: string, dados: Partial<Servico>) => void;
  onExcluir: (id: string) => void;
}

export function Servicos({
  servicos,
  onAdicionar,
  onEditar,
  onExcluir,
}: ServicosProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null);
  const [servicoExcluindo, setServicoExcluindo] = useState<Servico | null>(null);

  // Formulário
  const [formNome, setFormNome] = useState("");
  const [formValor, setFormValor] = useState("");

  // Abrir formulário para novo serviço
  const abrirNovoServico = () => {
    setServicoEditando(null);
    setFormNome("");
    setFormValor("");
    setDialogAberto(true);
  };

  // Abrir formulário para editar serviço
  const abrirEditarServico = (servico: Servico) => {
    setServicoEditando(servico);
    setFormNome(servico.nome);
    setFormValor(String(servico.valor));
    setDialogAberto(true);
  };

  // Salvar serviço
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      toast.error("Informe o nome do serviço");
      return;
    }
    const valor = parseFloat(formValor) || 0;
    if (valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    if (servicoEditando) {
      onEditar(servicoEditando.id, {
        nome: formNome.trim(),
        valor,
      });
      toast.success("Serviço atualizado com sucesso!");
    } else {
      const novoServico: Servico = {
        id: gerarId(),
        nome: formNome.trim(),
        valor,
        ativo: true,
      };
      onAdicionar(novoServico);
      toast.success("Serviço adicionado com sucesso!");
    }
    setDialogAberto(false);
  };

  // Confirmar exclusão
  const handleConfirmarExclusao = () => {
    if (servicoExcluindo) {
      onExcluir(servicoExcluindo.id);
      toast.success("Serviço excluído com sucesso!");
      setServicoExcluindo(null);
      setConfirmAberto(false);
    }
  };

  // Alternar ativo/inativo
  const handleToggleAtivo = (servico: Servico) => {
    onEditar(servico.id, { ativo: !servico.ativo });
    toast.success(
      servico.ativo
        ? "Serviço desativado"
        : "Serviço ativado"
    );
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {servicos.length} serviço(s) cadastrado(s)
        </p>
        <Button
          onClick={abrirNovoServico}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="size-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Lista de serviços */}
      {servicos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Wrench className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum serviço cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {servicos.map((servico) => (
            <Card
              key={servico.id}
              className={`overflow-hidden transition-opacity ${
                !servico.ativo ? "opacity-60" : ""
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        servico.ativo
                          ? "bg-blue-50 dark:bg-blue-950/40"
                          : "bg-muted"
                      }`}
                    >
                      <Sparkles
                        className={`size-5 ${
                          servico.ativo
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">
                        {servico.nome}
                      </p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatarMoeda(servico.valor)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => abrirEditarServico(servico)}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setServicoExcluindo(servico);
                        setConfirmAberto(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={servico.ativo}
                      onCheckedChange={() => handleToggleAtivo(servico)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-xs text-muted-foreground">
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de adicionar/editar serviço */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-blue-600" />
              {servicoEditando ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
            <DialogDescription>
              {servicoEditando
                ? "Atualize os dados do serviço"
                : "Preencha os dados do novo serviço"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sNome" className="text-sm font-medium">
                Nome do Serviço *
              </Label>
              <Input
                id="sNome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Lavagem Simples, Polimento..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sValor" className="text-sm font-medium">
                Valor (R$) *
              </Label>
              <Input
                id="sValor"
                type="number"
                min="0"
                step="0.01"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {servicoEditando ? "Salvar Alterações" : "Adicionar Serviço"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={confirmAberto} onOpenChange={setConfirmAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço{" "}
              <strong>{servicoExcluindo?.nome}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
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

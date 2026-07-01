"use client";

// Componente: Gerenciamento completo de clientes com CRUD e fidelidade interativa
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
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Phone,
  Car,
  ChevronDown,
  ChevronUp,
  Award,
  Minus,
  Gift,
  Star,
  Droplets,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Cliente, Comanda, Fidelidade, FIDELIDADE_MAX_PONTOS } from "@/lib/types";
import {
  formatarMoeda,
  formatarDataHora,
  formatarNumeroComanda,
  mascaraTelefone,
  mascaraPlaca,
  desmascararTelefone,
  gerarId,
} from "@/lib/helpers";
import { toast } from "sonner";

interface ClientesProps {
  clientes: Cliente[];
  comandas: Comanda[];
  onRegistrarCliente: (cliente: Cliente) => Promise<Cliente>;
  onEditarCliente: (id: string, dados: Partial<Cliente>) => void;
  onExcluirCliente: (id: string) => void;
  obterFidelidade: (clienteId: string) => Fidelidade | undefined;
  onAjustarPontos: (clienteId: string, delta: number) => { pontos: number; lavagensGratis: number };
  onAjustarLavagensGratis: (clienteId: string, delta: number) => { pontos: number; lavagensGratis: number };
}

export function Clientes({
  clientes,
  comandas,
  onRegistrarCliente,
  onEditarCliente,
  onExcluirCliente,
  obterFidelidade,
  onAjustarPontos,
  onAjustarLavagensGratis,
}: ClientesProps) {
  const [termoBusca, setTermoBusca] = useState("");
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteExcluindo, setClienteExcluindo] = useState<Cliente | null>(null);

  // Formulário
  const [formNome, setFormNome] = useState("");
  const [formTelefone, setFormTelefone] = useState("");
  const [formVeiculo, setFormVeiculo] = useState("");
  const [formPlaca, setFormPlaca] = useState("");

  // Clientes filtrados
  const clientesFiltrados = useMemo(() => {
    const t = termoBusca.toLowerCase().trim();
    if (!t) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(t) ||
        c.placa.toLowerCase().includes(t) ||
        c.veiculo.toLowerCase().includes(t)
    );
  }, [clientes, termoBusca]);

  // Histórico de comandas por cliente
  const obterHistoricoCliente = (clienteId: string) => {
    return comandas
      .filter((c) => c.cliente.id === clienteId)
      .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime());
  };

  const totalGastoCliente = (clienteId: string) => {
    return comandas
      .filter((c) => c.cliente.id === clienteId && c.status === "finalizada")
      .reduce((s, c) => s + c.total, 0);
  };

  // Abrir formulário para novo cliente
  const abrirNovoCliente = () => {
    setClienteEditando(null);
    setFormNome("");
    setFormTelefone("");
    setFormVeiculo("");
    setFormPlaca("");
    setDialogAberto(true);
  };

  // Abrir formulário para editar cliente
  const abrirEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setFormNome(cliente.nome);
    setFormTelefone(cliente.telefone);
    setFormVeiculo(cliente.veiculo);
    setFormPlaca(cliente.placa);
    setDialogAberto(true);
  };

  // Salvar cliente
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formVeiculo.trim() || !formPlaca.trim()) {
      toast.error("Preencha nome, veículo e placa");
      return;
    }

    if (clienteEditando) {
      onEditarCliente(clienteEditando.id, {
        nome: formNome.trim(),
        telefone: desmascararTelefone(formTelefone),
        veiculo: formVeiculo.trim(),
        placa: formPlaca.trim(),
      });
      toast.success("Cliente atualizado com sucesso!");
    } else {
      const novoCliente: Cliente = {
        id: gerarId(),
        nome: formNome.trim(),
        telefone: desmascararTelefone(formTelefone),
        veiculo: formVeiculo.trim(),
        placa: formPlaca.trim(),
      };
      try {
        await onRegistrarCliente(novoCliente);
        toast.success("Cliente adicionado com sucesso!");
      } catch (err) {
        toast.error("Erro ao cadastrar cliente. Tente novamente.");
        return;
      }
    }
    setDialogAberto(false);
  };

  // Confirmar exclusão
  const handleConfirmarExclusao = () => {
    if (clienteExcluindo) {
      onExcluirCliente(clienteExcluindo.id);
      toast.success("Cliente excluído com sucesso!");
      setClienteExcluindo(null);
      setConfirmAberto(false);
    }
  };

  // Handler de ajuste de pontos de fidelidade
  const handleAjustarPontos = (clienteId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const resultado = onAjustarPontos(clienteId, delta);
    if (delta > 0 && resultado.pontos === 0 && resultado.lavagensGratis > 0) {
      toast.success("Cliente completou 10 lavagens! Ganhou uma lavagem grátis!", {
        icon: "🎉",
      });
    }
  };

  // Handler de ajuste de lavagens grátis
  const handleAjustarLavagensGratis = (clienteId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onAjustarLavagensGratis(clienteId, delta);
    if (delta > 0) {
      toast.success("Lavagem grátis adicionada manualmente!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com busca e botão novo */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Buscar por nome, placa ou veículo..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={abrirNovoCliente}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="size-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Contador */}
      <p className="text-sm text-muted-foreground">
        {clientesFiltrados.length} cliente(s) encontrado(s)
        {clientes.length !== clientesFiltrados.length &&
          ` de ${clientes.length} total`}
      </p>

      {/* Lista de clientes */}
      {clientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Users className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {termoBusca
                ? "Nenhum cliente encontrado com a busca"
                : "Nenhum cliente cadastrado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {clientesFiltrados.map((cliente) => {
            const fidelidade = obterFidelidade(cliente.id);
            const historico = obterHistoricoCliente(cliente.id);
            const totalGasto = totalGastoCliente(cliente.id);
            const expandido = clienteExpandido === cliente.id;
            const pontos = fidelidade?.pontos || 0;
            const lavagensGratis = fidelidade?.lavagensGratis || 0;

            return (
              <Card key={cliente.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() =>
                    setClienteExpandido((prev) =>
                      prev === cliente.id ? null : cliente.id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
                        <Users className="size-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">
                            {cliente.nome}
                          </span>
                          {fidelidade && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 gap-1">
                              <Award className="size-3" />
                              {pontos}/{FIDELIDADE_MAX_PONTOS}
                            </Badge>
                          )}
                          {lavagensGratis > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5">
                              <Gift className="size-3 mr-0.5" />
                              {lavagensGratis} grátis
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Car className="size-3" />
                            {cliente.veiculo}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-mono text-xs">{cliente.placa}</span>
                          {cliente.telefone && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="size-3" />
                                {cliente.telefone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(totalGasto)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {historico.length} comanda(s)
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirEditarCliente(cliente);
                          }}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClienteExcluindo(cliente);
                            setConfirmAberto(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      {expandido ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção de Fidelidade Interativa - Sempre visível */}
                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-t border-amber-200/60 dark:border-amber-800/40">
                  {/* Cabeçalho da fidelidade */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Award className="size-4" />
                      Clube de Fidelidade
                    </span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                      {pontos}/{FIDELIDADE_MAX_PONTOS} lavagens
                    </span>
                  </div>

                  {/* Card visual de 10 anéis de fidelidade */}
                  <div className="flex items-center justify-center gap-2 mb-2.5">
                    {Array.from({ length: FIDELIDADE_MAX_PONTOS }).map((_, i) => (
                      <div
                        key={i}
                        className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all duration-300 ${
                          i < pontos
                            ? "bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-500 text-white shadow-sm shadow-amber-300/50"
                            : i === pontos
                              ? "bg-transparent border-amber-400 dark:border-amber-600 border-dashed text-amber-500 dark:text-amber-400"
                              : "bg-transparent border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600"
                        }`}
                      >
                        {i < pontos ? (
                          <Droplets className="size-3" />
                        ) : (
                          <span>{i + 1}</span>
                        )}
                        {i === 9 && (
                          <Star className="absolute -top-1.5 -right-1.5 size-3 text-amber-500 dark:text-amber-400 drop-shadow-sm" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full bg-amber-200 dark:bg-amber-900/60 rounded-full h-1.5 mb-2.5">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${(pontos / FIDELIDADE_MAX_PONTOS) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Controles de pontos */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleAjustarPontos(cliente.id, -1, e)}
                        disabled={pontos <= 0}
                        className="p-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remover 1 ponto"
                      >
                        <Minus className="size-3.5 text-amber-700 dark:text-amber-400" />
                      </button>
                      <button
                        onClick={(e) => handleAjustarPontos(cliente.id, 1, e)}
                        className="p-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        title="Adicionar 1 ponto"
                      >
                        <Plus className="size-3.5 text-amber-700 dark:text-amber-400" />
                      </button>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        pontos
                      </span>
                    </div>

                    {/* Controles de lavagens grátis */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        lavagens grátis
                      </span>
                      <button
                        onClick={(e) => handleAjustarLavagensGratis(cliente.id, -1, e)}
                        disabled={lavagensGratis <= 0}
                        className="p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remover 1 lavagem grátis"
                      >
                        <Minus className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                      </button>
                      <button
                        onClick={(e) => handleAjustarLavagensGratis(cliente.id, 1, e)}
                        className="p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        title="Adicionar 1 lavagem grátis"
                      >
                        <Plus className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                      </button>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lavagensGratis > 0
                          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                      }`}>
                        <Gift className="size-3 inline mr-0.5" />
                        {lavagensGratis}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expandido && (
                  <div className="px-4 pb-4 border-t">
                    <div className="pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <p className="font-medium">
                            {cliente.telefone || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total gasto:</span>
                          <p className="font-medium text-emerald-600 dark:text-emerald-400">
                            {formatarMoeda(totalGasto)}
                          </p>
                        </div>
                      </div>

                      {/* Histórico de comandas */}
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Histórico de Comandas ({historico.length})
                        </p>
                        {historico.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Nenhuma comanda registrada
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {historico.slice(0, 10).map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                              >
                                <div>
                                  <span className="font-medium">
                                    #{formatarNumeroComanda(c.numero)}
                                  </span>
                                  <span className="text-muted-foreground ml-1">
                                    {c.servico}
                                  </span>
                                  {c.lavagemGratis && (
                                    <Badge className="ml-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] px-1 py-0">
                                      Grátis
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={
                                      c.status === "finalizada"
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px]"
                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px]"
                                    }
                                  >
                                    {c.status === "finalizada"
                                      ? "Finalizada"
                                      : "Em andamento"}
                                  </Badge>
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    {formatarMoeda(c.total)}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {historico.length > 10 && (
                              <p className="text-xs text-muted-foreground text-center">
                                ... e mais {historico.length - 10} comanda(s)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de adicionar/editar cliente */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-blue-600" />
              {clienteEditando ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {clienteEditando
                ? "Atualize os dados do cliente"
                : "Preencha os dados do novo cliente"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cNome" className="text-sm font-medium">
                Nome *
              </Label>
              <Input
                id="cNome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cTelefone" className="text-sm font-medium">
                  Telefone
                </Label>
                <Input
                  id="cTelefone"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(mascaraTelefone(e.target.value))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cPlaca" className="text-sm font-medium">
                  Placa *
                </Label>
                <Input
                  id="cPlaca"
                  value={formPlaca}
                  onChange={(e) => setFormPlaca(mascaraPlaca(e.target.value))}
                  placeholder="ABC-1D23"
                  className="uppercase"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cVeiculo" className="text-sm font-medium">
                Veículo / Modelo *
              </Label>
              <Input
                id="cVeiculo"
                value={formVeiculo}
                onChange={(e) => setFormVeiculo(e.target.value)}
                placeholder="Ex: Honda Civic 2022"
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
                {clienteEditando ? "Salvar Alterações" : "Adicionar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={confirmAberto} onOpenChange={setConfirmAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente{" "}
              <strong>{clienteExcluindo?.nome}</strong>? Esta ação não pode ser
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

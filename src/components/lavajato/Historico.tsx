"use client";

// Componente: Histórico de comandas finalizadas com filtro de data e edição
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  History,
  ChevronDown,
  ChevronUp,
  Calendar,
  Search,
  Printer,
  Pencil,
  X,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { Comanda, Consumo, Produto } from "@/lib/types";
import {
  formatarMoeda,
  formatarDataHora,
  formatarData,
  formatarNumeroComanda,
} from "@/lib/helpers";
import { ReciboDialog } from "./ReciboDialog";
import { toast } from "sonner";

interface HistoricoProps {
  comandas: Comanda[];
  produtos: Produto[];
  onEditarComanda: (comandaId: string, dados: { valorServico?: number; servico?: string; total?: number }) => void;
  onAdicionarConsumo: (comandaId: string, consumo: Consumo) => void;
  onRemoverConsumo: (comandaId: string, consumoId: string) => void;
}

export function Historico({ comandas, produtos, onEditarComanda, onAdicionarConsumo, onRemoverConsumo }: HistoricoProps) {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [expandida, setExpandida] = useState<string | null>(null);
  const [comandaRecibo, setComandaRecibo] = useState<Comanda | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [editValor, setEditValor] = useState("");
  const [editServico, setEditServico] = useState("");
  const [novoConsumo, setNovoConsumo] = useState("");
  const [novaQtd, setNovaQtd] = useState("1");

  // Comandas finalizadas filtradas
  const finalizadas = useMemo(() => {
    const filtro = comandas
      .filter((c) => c.status === "finalizada")
      .filter((c) => {
        if (dataInicio) {
          const inicio = new Date(dataInicio + "T00:00:00");
          if (new Date(c.dataEntrada) < inicio) return false;
        }
        if (dataFim) {
          const fim = new Date(dataFim + "T23:59:59");
          if (new Date(c.dataEntrada) > fim) return false;
        }
        if (termoBusca.trim()) {
          const t = termoBusca.toLowerCase();
          return (
            c.cliente.nome.toLowerCase().includes(t) ||
            c.cliente.placa.toLowerCase().includes(t) ||
            c.cliente.veiculo.toLowerCase().includes(t) ||
            c.servico.toLowerCase().includes(t) ||
            c.numero.toString().includes(t)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.dataSaida || b.dataEntrada).getTime() -
          new Date(a.dataSaida || a.dataEntrada).getTime()
      );
    return filtro;
  }, [comandas, dataInicio, dataFim, termoBusca]);

  const totalPeriodo = useMemo(
    () => finalizadas.reduce((s, c) => s + c.total, 0),
    [finalizadas]
  );

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setTermoBusca("");
  };

  return (
    <div className="space-y-4">
      <ReciboDialog
        comanda={comandaRecibo}
        aberto={!!comandaRecibo}
        onFechar={() => setComandaRecibo(null)}
      />

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4 text-blue-600" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio" className="text-xs">Data Início</Label>
              <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFim" className="text-xs">Data Fim</Label>
              <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <Label htmlFor="buscaHistorico" className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="buscaHistorico" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} placeholder="Nome, placa, serviço..." className="pl-9" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              {finalizadas.length} comanda(s) encontrada(s)
              {finalizadas.length > 0 && (
                <span className="ml-2 font-medium text-foreground">— Total: {formatarMoeda(totalPeriodo)}</span>
              )}
            </p>
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-xs">Limpar filtros</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {finalizadas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <History className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {comandas.some((c) => c.status === "finalizada")
                ? "Nenhuma comanda encontrada com os filtros aplicados"
                : "Nenhuma comanda finalizada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {finalizadas.map((comanda) => {
            const isExpandida = expandida === comanda.id;
            const isEditando = editando === comanda.id;
            return (
              <Card key={comanda.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandida((prev) => (prev === comanda.id ? null : comanda.id))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
                        <History className="size-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">#{formatarNumeroComanda(comanda.numero)}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5">Finalizada</Badge>
                          {comanda.formaPagamento && (
                            <Badge variant="outline" className="text-[10px] px-1.5">{comanda.formaPagamento}</Badge>
                          )}
                          {comanda.cliente.id === "" && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] px-1.5">Venda Avulsa</Badge>
                          )}
                          {comanda.mensalista && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5">Acumulativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {comanda.cliente.nome} • {comanda.cliente.veiculo} • {comanda.cliente.placa}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatarMoeda(comanda.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {comanda.dataSaida ? formatarData(comanda.dataSaida) : formatarData(comanda.dataEntrada)}
                        </p>
                      </div>
                      {isExpandida ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {isExpandida && (
                  <div className="px-4 pb-4 border-t">
                    <div className="pt-4 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-muted-foreground">Entrada:</span>
                          <p className="font-medium">{formatarDataHora(comanda.dataEntrada)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saída:</span>
                          <p className="font-medium">{comanda.dataSaida ? formatarDataHora(comanda.dataSaida) : "—"}</p>
                        </div>
                      </div>

                      {/* Edição inline */}
                      {isEditando ? (
                        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">EDITANDO COMANDA</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Serviço</Label>
                              <Input value={editServico} onChange={(e) => setEditServico(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Valor Serviço (R$)</Label>
                              <Input type="number" value={editValor} onChange={(e) => setEditValor(e.target.value)} className="h-8 text-sm" />
                            </div>
                          </div>

                          {/* Consumos existentes - permitir remover */}
                          {comanda.consumos.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs text-muted-foreground font-medium">Consumos atuais</p>
                              {comanda.consumos.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-xs">
                                  <span>{c.nome} x{c.quantidade} — {formatarMoeda(c.subtotal)}</span>
                                  <button
                                    onClick={() => { onRemoverConsumo(comanda.id, c.id); toast.success("Consumo removido"); }}
                                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Adicionar consumo */}
                          <div className="flex gap-2 items-end">
                            <select
                              value={novoConsumo}
                              onChange={(e) => setNovoConsumo(e.target.value)}
                              className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                            >
                              <option value="">+ Produto...</option>
                              {produtos.filter((p) => p.ativo).map((p) => (
                                <option key={p.id} value={p.id}>{p.nome} ({formatarMoeda(p.preco)})</option>
                              ))}
                            </select>
                            <Input type="number" min="1" value={novaQtd} onChange={(e) => setNovaQtd(e.target.value)} className="w-16 h-8 text-sm" placeholder="Qtd" />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => {
                                const prod = produtos.find((p) => p.id === novoConsumo);
                                if (!prod) return;
                                const qtd = parseInt(novaQtd) || 1;
                                onAdicionarConsumo(comanda.id, { id: crypto.randomUUID(), nome: prod.nome, quantidade: qtd, valorUnitario: prod.preco, subtotal: prod.preco * qtd });
                                setNovoConsumo("");
                                setNovaQtd("1");
                                toast.success("Produto adicionado!");
                              }}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                const novoValor = parseFloat(editValor) || comanda.valorServico;
                                const totalConsumos = comanda.consumos.reduce((s, c) => s + c.subtotal, 0);
                                onEditarComanda(comanda.id, { valorServico: novoValor, servico: editServico || comanda.servico, total: novoValor + totalConsumos });
                                setEditando(null);
                                toast.success("Comanda atualizada!");
                              }}
                            >
                              <Save className="size-3" /> Salvar
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setEditando(null)}>
                              <X className="size-3" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-muted-foreground">Serviço:</span>
                              <p className="font-medium">{comanda.servico}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Valor Serviço:</span>
                              <p className="font-medium">{formatarMoeda(comanda.valorServico)}</p>
                            </div>
                            {comanda.mensalista && (
                              <div className="col-span-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                  Serviço incluso no acumulativo mensal
                                </p>
                              </div>
                            )}
                          </div>

                          {comanda.consumos.length > 0 && (
                            <div>
                              <p className="text-muted-foreground text-xs font-medium mb-1">CONSUMOS</p>
                              {comanda.consumos.map((c) => (
                                <div key={c.id} className="flex justify-between text-sm py-0.5">
                                  <span>{c.nome} x{c.quantidade}</span>
                                  <span>{formatarMoeda(c.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {comanda.caixinha && comanda.caixinha > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Caixinha</span>
                              <span>{formatarMoeda(comanda.caixinha)}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-bold p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            <span>Total:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{formatarMoeda(comanda.total)}</span>
                          </div>
                        </>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setComandaRecibo(comanda); }}>
                          <Printer className="size-3" /> Recibo
                        </Button>
                        {!isEditando && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setEditando(comanda.id); setEditValor(String(comanda.valorServico)); setEditServico(comanda.servico); }}>
                            <Pencil className="size-3" /> Editar
                          </Button>
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
    </div>
  );
}

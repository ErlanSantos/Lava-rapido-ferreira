"use client";

// Componente: Lista de comandas ativas com gerenciamento de consumos e liberação
import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  Plus,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { Comanda, Consumo, Produto, Fidelidade } from "@/lib/types";
import {
  formatarMoeda,
  formatarDataHora,
  formatarNumeroComanda,
} from "@/lib/helpers";
import { AddConsumoDialog } from "./AddConsumoDialog";
import { LiberarVeiculoDialog } from "./LiberarVeiculoDialog";
import { ReciboDialog } from "./ReciboDialog";
import { toast } from "sonner";

interface ComandasAtivasProps {
  comandas: Comanda[];
  produtos: Produto[];
  onAdicionarConsumo: (comandaId: string, consumo: Consumo) => void;
  onRemoverConsumo: (comandaId: string, consumoId: string) => void;
  onFinalizarComanda: (
    comandaId: string,
    formaPagamento: string,
    caixinha: number
  ) => Comanda | null;
  onCancelarComanda: (comandaId: string) => void;
  obterFidelidade: (clienteId: string) => Fidelidade | undefined;
}

export function ComandasAtivas({
  comandas,
  produtos,
  onAdicionarConsumo,
  onRemoverConsumo,
  onFinalizarComanda,
  onCancelarComanda,
  obterFidelidade,
}: ComandasAtivasProps) {
  const [comandaExpandida, setComandaExpandida] = useState<string | null>(null);
  const [comandaConsumo, setComandaConsumo] = useState<Comanda | null>(null);
  const [comandaLiberar, setComandaLiberar] = useState<Comanda | null>(null);
  const [comandaRecibo, setComandaRecibo] = useState<Comanda | null>(null);

  // Alternar expansão
  const toggleExpandir = (id: string) => {
    setComandaExpandida((prev) => (prev === id ? null : id));
  };

  // Remover consumo
  const handleRemoverConsumo = (comandaId: string, consumoId: string) => {
    onRemoverConsumo(comandaId, consumoId);
    toast.success("Consumo removido");
  };

  // Finalizar comanda
  const handleFinalizar = (
    comandaId: string,
    formaPagamento: string,
    caixinha: number
  ) => {
    const comandaFinalizada = onFinalizarComanda(
      comandaId,
      formaPagamento,
      caixinha
    );
    if (comandaFinalizada) {
      setComandaRecibo(comandaFinalizada);
    }
  };

  // Cancelar comanda
  const handleCancelar = (comanda: Comanda) => {
    if (confirm(`Deseja realmente cancelar a comanda #${formatarNumeroComanda(comanda.numero)}?`)) {
      onCancelarComanda(comanda.id);
      toast.success("Comanda cancelada");
    }
  };

  if (comandas.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Clock className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma comanda ativa no momento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Modal de adicionar consumo */}
      <AddConsumoDialog
        comanda={comandaConsumo}
        aberto={!!comandaConsumo}
        onFechar={() => setComandaConsumo(null)}
        onAdicionar={(id, consumo) => {
          onAdicionarConsumo(id, consumo);
          setComandaConsumo(null);
        }}
        produtos={produtos}
      />

      {/* Modal de liberação */}
      <LiberarVeiculoDialog
        comanda={comandaLiberar}
        aberto={!!comandaLiberar}
        onFechar={() => setComandaLiberar(null)}
        onFinalizar={handleFinalizar}
        fidelidade={comandaLiberar ? obterFidelidade(comandaLiberar.cliente.id) : undefined}
      />

      {/* Modal de recibo */}
      <ReciboDialog
        comanda={comandaRecibo}
        aberto={!!comandaRecibo}
        onFechar={() => setComandaRecibo(null)}
      />

      {/* Lista de comandas */}
      {comandas.map((comanda) => {
        const expandida = comandaExpandida === comanda.id;
        return (
          <Card key={comanda.id} className="overflow-hidden">
            {/* Cabeçalho da comanda */}
            <div
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleExpandir(comanda.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
                    <Car className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        #{formatarNumeroComanda(comanda.numero)}
                      </span>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5">
                        Em andamento
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {comanda.cliente.nome} • {comanda.cliente.veiculo} •{" "}
                      {comanda.cliente.placa}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {comanda.servico}
                      {comanda.consumos.length > 0 &&
                        ` + ${comanda.consumos.length} consumo(s)`}
                    </p>
                    {comanda.mensalista && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0">
                        Mensalista
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-sm text-blue-600 dark:text-blue-400">
                      {formatarMoeda(comanda.mensalista
                        ? comanda.valorServico + comanda.consumos.reduce((s, c) => s + c.subtotal, 0)
                        : comanda.total
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatarDataHora(comanda.dataEntrada)}
                    </p>
                  </div>
                  {expandida ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Detalhes expandidos */}
            {expandida && (
              <div className="px-4 pb-4 border-t">
                <div className="pt-4 space-y-4">
                  {/* Detalhes do serviço */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Serviço:</span>
                      <p className="font-medium">{comanda.servico}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Valor do Serviço:
                      </span>
                      <p className="font-medium">
                        {formatarMoeda(comanda.valorServico)}
                      </p>
                    </div>
                  </div>

                  {/* Lista de consumos */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <ShoppingCart className="size-4" />
                        Consumos
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setComandaConsumo(comanda);
                        }}
                      >
                        <Plus className="size-3" />
                        Adicionar
                      </Button>
                    </div>
                    {comanda.consumos.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Nenhum consumo adicionado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {comanda.consumos.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                          >
                            <div>
                              <span className="font-medium">{c.nome}</span>
                              <span className="text-muted-foreground ml-1">
                                x{c.quantidade} ({formatarMoeda(c.valorUnitario)}
                                )
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatarMoeda(c.subtotal)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoverConsumo(comanda.id, c.id);
                                }}
                                className="text-destructive hover:text-destructive/80 transition-colors p-1"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total — mensalista: valorServico + consumos | avulso: total do banco */}
                  {(() => {
                    const totalConsumos = comanda.consumos.reduce((s, c) => s + c.subtotal, 0);
                    const totalExibido = comanda.mensalista
                      ? comanda.valorServico + totalConsumos
                      : comanda.total;
                    return (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                        <span className="font-bold">Total:</span>
                        <div className="text-right">
                          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {formatarMoeda(totalExibido)}
                          </span>
                          {comanda.mensalista && totalConsumos > 0 && (
                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                              Serviço {formatarMoeda(comanda.valorServico)} + Extras {formatarMoeda(totalConsumos)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Ações */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setComandaLiberar(comanda);
                      }}
                    >
                      <CheckCircle2 className="size-4" />
                      Liberar Veículo
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelar(comanda);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

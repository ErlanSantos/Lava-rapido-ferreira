"use client";

// Componente: Modal de liberação do veículo (finalizar comanda)
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  DollarSign,
  CreditCard,
  Banknote,
  QrCode,
  Award,
} from "lucide-react";
import { Comanda, FORMAS_PAGAMENTO, Fidelidade } from "@/lib/types";
import { formatarMoeda } from "@/lib/helpers";
import { toast } from "sonner";

interface LiberarVeiculoDialogProps {
  comanda: Comanda | null;
  aberto: boolean;
  onFechar: () => void;
  onFinalizar: (
    comandaId: string,
    formaPagamento: string,
    caixinha: number
  ) => void;
  fidelidade?: Fidelidade | undefined;
}

export function LiberarVeiculoDialog({
  comanda,
  aberto,
  onFechar,
  onFinalizar,
  fidelidade,
}: LiberarVeiculoDialogProps) {
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [caixinha, setCaixinha] = useState("");

  const handleFinalizar = () => {
    if (!comanda) return;
    if (!formaPagamento) {
      toast.error("Selecione a forma de pagamento");
      return;
    }
    const caixinhaValor = parseFloat(caixinha) || 0;
    onFinalizar(comanda.id, formaPagamento, caixinhaValor);
    toast.success("Veículo liberado com sucesso! ✅");
    setFormaPagamento("");
    setCaixinha("");
    onFechar();
  };

  const handleFechar = () => {
    setFormaPagamento("");
    setCaixinha("");
    onFechar();
  };

  const totalComCaixinha =
    (comanda?.total || 0) + (parseFloat(caixinha) || 0);

  // Ícones por forma de pagamento
  const iconePagamento = (forma: string) => {
    switch (forma) {
      case "Dinheiro":
        return <Banknote className="size-4" />;
      case "Cartão Crédito":
        return <CreditCard className="size-4" />;
      case "Cartão Débito":
        return <CreditCard className="size-4" />;
      case "PIX":
        return <QrCode className="size-4" />;
      default:
        return <DollarSign className="size-4" />;
    }
  };

  if (!comanda) return null;

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="size-5 text-blue-600" />
            Liberar Veículo
          </DialogTitle>
          <DialogDescription>
            Comanda #{comanda.numero.toString().padStart(4, "0")} —{" "}
            {comanda.cliente.nome}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da comanda */}
        <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <p className="font-medium">{comanda.cliente.nome}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Veículo:</span>
              <p className="font-medium">{comanda.cliente.veiculo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Placa:</span>
              <p className="font-medium">{comanda.cliente.placa}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Serviço:</span>
              <p className="font-medium">{comanda.servico}</p>
            </div>
          </div>

          {/* Consumos */}
          {comanda.consumos.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                CONSUMOS
              </p>
              {comanda.consumos.map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between text-sm py-1"
                >
                  <span>
                    {c.nome} x{c.quantidade}
                  </span>
                  <span className="font-medium">
                    {formatarMoeda(c.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="mt-3 pt-3 border-t flex justify-between font-bold">
            <span>Total do Serviço:</span>
            <span className="text-blue-600 dark:text-blue-400">
              {formatarMoeda(comanda.valorServico)}
            </span>
          </div>
        </div>

        {/* Card de fidelidade */}
        {fidelidade && (
          <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1">
                <Award className="size-4 text-amber-600" />
                Fidelidade
              </span>
              <span className="text-xs font-medium">
                {fidelidade.pontos}/10 lavagens
              </span>
            </div>
            <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2.5">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all"
                style={{ width: `${(fidelidade.pontos / 10) * 100}%` }}
              />
            </div>
            {fidelidade.lavagensGratis > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
                Lavagens grátis disponíveis: {fidelidade.lavagensGratis}
              </p>
            )}
          </div>
        )}

        {/* Forma de pagamento */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Forma de Pagamento *</Label>
          <RadioGroup
            value={formaPagamento}
            onValueChange={setFormaPagamento}
            className="grid grid-cols-2 gap-2"
          >
            {FORMAS_PAGAMENTO.map((forma) => (
              <label
                key={forma}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  formaPagamento === forma
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-700"
                    : "hover:bg-accent"
                }`}
              >
                <RadioGroupItem value={forma} />
                {iconePagamento(forma)}
                <span className="text-sm font-medium">{forma}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Caixinha (gorjeta) */}
        <div className="space-y-1.5">
          <Label htmlFor="caixinha" className="text-sm font-medium">
            Caixinha (opcional)
          </Label>
          <Input
            id="caixinha"
            type="number"
            min="0"
            step="0.01"
            value={caixinha}
            onChange={(e) => setCaixinha(e.target.value)}
            placeholder="0,00"
          />
        </div>

        {/* Total final */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Total Final:</span>
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
              {formatarMoeda(totalComCaixinha)}
            </span>
          </div>
          {parseFloat(caixinha) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Inclui caixinha de {formatarMoeda(parseFloat(caixinha))}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleFechar}>
            Cancelar
          </Button>
          <Button
            onClick={handleFinalizar}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle2 className="size-4 mr-1" />
            Finalizar e Liberar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

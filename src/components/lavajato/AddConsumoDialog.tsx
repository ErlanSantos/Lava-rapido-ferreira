"use client";

// Componente: Modal para adicionar consumo a uma comanda
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
import { Plus, Package } from "lucide-react";
import { Comanda, Consumo, Produto } from "@/lib/types";
import { formatarMoeda, gerarId } from "@/lib/helpers";
import { toast } from "sonner";

interface AddConsumoDialogProps {
  comanda: Comanda | null;
  aberto: boolean;
  onFechar: () => void;
  onAdicionar: (comandaId: string, consumo: Consumo) => void;
  produtos: Produto[];
}

export function AddConsumoDialog({
  comanda,
  aberto,
  onFechar,
  onAdicionar,
  produtos,
}: AddConsumoDialogProps) {
  const [nomeProduto, setNomeProduto] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnitario, setValorUnitario] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comanda) return;

    if (!nomeProduto.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }

    const qtd = parseInt(quantidade, 10) || 0;
    const valor = parseFloat(valorUnitario) || 0;

    if (qtd <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    if (valor <= 0) {
      toast.error("Valor unitário deve ser maior que zero");
      return;
    }

    const consumo: Consumo = {
      id: gerarId(),
      nome: nomeProduto.trim(),
      quantidade: qtd,
      valorUnitario: valor,
      subtotal: qtd * valor,
    };

    onAdicionar(comanda.id, consumo);
    toast.success("Consumo adicionado!");
    setNomeProduto("");
    setQuantidade("1");
    setValorUnitario("");
  };

  const handleFechar = () => {
    setNomeProduto("");
    setQuantidade("1");
    setValorUnitario("");
    onFechar();
  };

  const selecionarProduto = (produto: Produto) => {
    setNomeProduto(produto.nome);
    setValorUnitario(String(produto.preco));
  };

  const produtosAtivos = produtos.filter((p) => p.ativo);

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-blue-600" />
            Adicionar Consumo
          </DialogTitle>
          <DialogDescription>
            Comanda #{comanda?.numero?.toString().padStart(4, "0")} —{" "}
            {comanda?.cliente.nome}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Catálogo de produtos */}
          {produtosAtivos.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Package className="size-3.5" />
                Catálogo de Produtos
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {produtosAtivos.map((produto) => (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => selecionarProduto(produto)}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      nomeProduto === produto.nome
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-700"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <span className="text-sm font-medium block truncate">
                      {produto.nome}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {formatarMoeda(produto.preco)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="produto" className="text-sm font-medium">
              Nome do Produto *
            </Label>
            <Input
              id="produto"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Ex: Perfume, Silicone, etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantidade" className="text-sm font-medium">
                Quantidade *
              </Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valorUnit" className="text-sm font-medium">
                Valor Unitário (R$) *
              </Label>
              <Input
                id="valorUnit"
                type="number"
                min="0"
                step="0.01"
                value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
          {nomeProduto && quantidade && valorUnitario && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="text-muted-foreground">Subtotal: </span>
              <span className="font-semibold">
                {formatarMoeda(
                  (parseInt(quantidade, 10) || 0) *
                    (parseFloat(valorUnitario) || 0)
                )}
              </span>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleFechar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="size-4 mr-1" />
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

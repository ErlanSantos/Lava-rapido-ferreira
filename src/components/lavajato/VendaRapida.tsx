"use client";

// Componente: Venda Rápida — venda de produtos sem cliente
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Plus,
  Trash2,
  ShoppingCart,
  Check,
  Package,
} from "lucide-react";
import { Produto, Consumo } from "@/lib/types";
import { formatarMoeda } from "@/lib/helpers";
import { toast } from "sonner";

interface VendaRapidaProps {
  produtos: Produto[];
  onVender: (dados: { produtos: Consumo[] }) => void;
}

interface ItemVenda {
  produto: Produto;
  quantidade: number;
}

export function VendaRapida({ produtos, onVender }: VendaRapidaProps) {
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("");
  const [quantidadeInput, setQuantidadeInput] = useState("1");

  const produtosAtivos = produtos.filter((p) => p.ativo);

  const adicionarItem = () => {
    const produto = produtosAtivos.find((p) => p.id === produtoSelecionado);
    if (!produto) {
      toast.error("Selecione um produto");
      return;
    }
    const qtd = parseInt(quantidadeInput) || 1;
    if (qtd <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    // Verificar se já existe no carrinho
    const existente = itens.find((i) => i.produto.id === produto.id);
    if (existente) {
      setItens(
        itens.map((i) =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + qtd }
            : i
        )
      );
    } else {
      setItens([...itens, { produto, quantidade: qtd }]);
    }
    setProdutoSelecionado("");
    setQuantidadeInput("1");
  };

  const removerItem = (produtoId: string) => {
    setItens(itens.filter((i) => i.produto.id !== produtoId));
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setItens(
      itens
        .map((i) =>
          i.produto.id === produtoId
            ? { ...i, quantidade: Math.max(1, i.quantidade + delta) }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  };

  const total = itens.reduce(
    (s, i) => s + i.produto.preco * i.quantidade,
    0
  );

  const finalizarVenda = () => {
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    const consumos: Consumo[] = itens.map((i) => ({
      id: crypto.randomUUID(),
      nome: i.produto.nome,
      quantidade: i.quantidade,
      valorUnitario: i.produto.preco,
      subtotal: i.produto.preco * i.quantidade,
    }));

    onVender({ produtos: consumos });
    setItens([]);
    toast.success("Venda registrada com sucesso!", {
      description: `Total: ${formatarMoeda(total)}`,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="size-5 text-amber-500" />
            Venda Rápida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Seletor de produto e quantidade */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <ShoppingCart className="size-4 text-blue-600" />
              Adicionar Produto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6 space-y-1.5">
                <Label className="text-sm font-medium">Produto</Label>
                <select
                  value={produtoSelecionado}
                  onChange={(e) => setProdutoSelecionado(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione um produto</option>
                  {produtosAtivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {formatarMoeda(p.preco)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3 space-y-1.5">
                <Label className="text-sm font-medium">Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidadeInput}
                  onChange={(e) => setQuantidadeInput(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="sm:col-span-3">
                <Button
                  type="button"
                  onClick={adicionarItem}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Plus className="size-4" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de itens */}
          {itens.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum produto adicionado</p>
              <p className="text-xs mt-1">
                Selecione um produto acima para começar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {itens.map((item) => (
                <div
                  key={item.produto.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
                      <Package className="size-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.produto.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatarMoeda(item.produto.preco)} un.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Controles de quantidade */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, -1)}
                        className="w-7 h-7 rounded-md border flex items-center justify-center text-sm hover:bg-accent transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium text-sm">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, 1)}
                        className="w-7 h-7 rounded-md border flex items-center justify-center text-sm hover:bg-accent transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 min-w-[70px] text-right">
                      {formatarMoeda(item.produto.preco * item.quantidade)}
                    </span>
                    <button
                      onClick={() => removerItem(item.produto.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total e finalizar */}
          {itens.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Total ({itens.reduce((s, i) => s + i.quantidade, 0)} itens)
                  </span>
                </div>
                <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                  {formatarMoeda(total)}
                </span>
              </div>
              <Button
                onClick={finalizarVenda}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 h-12 text-base"
              >
                <Check className="size-5" />
                Finalizar Venda — {formatarMoeda(total)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

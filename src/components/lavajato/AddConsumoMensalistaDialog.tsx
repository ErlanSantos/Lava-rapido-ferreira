"use client";

// Componente: Modal para adicionar consumo extra ao acumulativo de um mensalista
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Produto, Servico, ConsumoMensalista } from "@/lib/types";
import { formatarMoeda } from "@/lib/helpers";
import { toast } from "sonner";

interface AddConsumoMensalistaDialogProps {
  mensalistaId: string;
  mensalistaNome: string;
  aberto: boolean;
  onFechar: () => void;
  onAdicionar: (
    consumo: Omit<ConsumoMensalista, "id" | "createdAt">
  ) => void;
  produtos: Produto[];
  servicos: Servico[];
}

export function AddConsumoMensalistaDialog({
  mensalistaId,
  mensalistaNome,
  aberto,
  onFechar,
  onAdicionar,
  produtos,
  servicos,
}: AddConsumoMensalistaDialogProps) {
  const [tipo, setTipo] = useState<"produto" | "servico">("produto");
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnitario, setValorUnitario] = useState("");
  const [observacao, setObservacao] = useState("");

  const resetForm = () => {
    setTipo("produto");
    setNome("");
    setQuantidade("1");
    setValorUnitario("");
    setObservacao("");
  };

  const handleFechar = () => {
    resetForm();
    onFechar();
  };

  const selecionarItem = (id: string) => {
    if (tipo === "produto") {
      const produto = produtos.find((p) => p.id === id);
      if (produto) {
        setNome(produto.nome);
        setValorUnitario(String(produto.preco));
      }
    } else {
      const servico = servicos.find((s) => s.id === id);
      if (servico) {
        setNome(servico.nome);
        setValorUnitario(String(servico.valor));
      }
    }
  };

  const qtd = parseInt(quantidade, 10) || 0;
  const valor = parseFloat(valorUnitario) || 0;
  const subtotal = qtd * valor;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Informe o nome do item");
      return;
    }

    if (qtd <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (valor <= 0) {
      toast.error("Valor unitário deve ser maior que zero");
      return;
    }

    const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    onAdicionar({
      mensalistaId,
      tipo,
      nome: nome.trim(),
      quantidade: qtd,
      valorUnitario: valor,
      subtotal,
      data: hoje,
      observacao: observacao.trim(),
    });

    resetForm();
    onFechar();
    toast.success("Extra adicionado ao acumulativo!");
  };

  const itensAtivos =
    tipo === "produto"
      ? produtos.filter((p) => p.ativo)
      : servicos.filter((s) => s.ativo);

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-blue-600" />
            Adicionar Extra ao Acumulativo
          </DialogTitle>
          <DialogDescription>
            Mensalista: <span className="font-semibold">{mensalistaNome}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo (Produto / Serviço) */}
          <div className="space-y-1.5">
            <Label htmlFor="tipo" className="text-sm font-medium">
              Tipo *
            </Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as "produto" | "servico");
                setNome("");
                setValorUnitario("");
              }}
            >
              <SelectTrigger id="tipo" className="rounded-lg">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produto">Produto</SelectItem>
                <SelectItem value="servico">Serviço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catálogo de itens */}
          {itensAtivos.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Catálogo de {tipo === "produto" ? "Produtos" : "Serviços"}
              </Label>
              <div className="grid grid-cols-3 gap-2 max-h-28 overflow-y-auto">
                {itensAtivos.map((item) => {
                  const itemPreco =
                    tipo === "produto"
                      ? (item as Produto).preco
                      : (item as Servico).valor;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selecionarItem(item.id)}
                      className={`p-2 rounded-lg border text-center transition-colors ${
                        nome === item.nome
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-700"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <span className="text-sm font-medium block truncate">
                        {item.nome}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {formatarMoeda(itemPreco)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome {tipo === "produto" ? "do Produto" : "do Serviço"} *
            </Label>
            <div className="relative">
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={
                  tipo === "produto"
                    ? "Ex: Perfume, Silicone, etc."
                    : "Ex: Polimento, Enceramento, etc."
                }
                className="rounded-lg pr-8"
              />
              {nome && (
                <button
                  type="button"
                  onClick={() => {
                    setNome("");
                    setValorUnitario("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quantidade e Valor Unitário */}
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
                className="rounded-lg"
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
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <Label htmlFor="observacao" className="text-sm font-medium">
              Observação
            </Label>
            <Input
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Opcional..."
              className="rounded-lg"
            />
          </div>

          {/* Subtotal */}
          {nome && quantidade && valorUnitario && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="text-muted-foreground">Subtotal: </span>
              <span className="font-semibold">
                {formatarMoeda(subtotal)}
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

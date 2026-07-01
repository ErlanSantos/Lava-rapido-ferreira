"use client";

// Componente: Gerenciamento de produtos com CRUD
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
  ShoppingCart,
  Package,
} from "lucide-react";
import { Produto } from "@/lib/types";
import { formatarMoeda, gerarId } from "@/lib/helpers";
import { toast } from "sonner";

interface ProdutosProps {
  produtos: Produto[];
  onAdicionar: (produto: Produto) => void;
  onEditar: (id: string, dados: Partial<Produto>) => void;
  onExcluir: (id: string) => void;
}

export function Produtos({
  produtos,
  onAdicionar,
  onEditar,
  onExcluir,
}: ProdutosProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [produtoExcluindo, setProdutoExcluindo] = useState<Produto | null>(null);

  // Formulário
  const [formNome, setFormNome] = useState("");
  const [formPreco, setFormPreco] = useState("");

  // Abrir formulário para novo produto
  const abrirNovoProduto = () => {
    setProdutoEditando(null);
    setFormNome("");
    setFormPreco("");
    setDialogAberto(true);
  };

  // Abrir formulário para editar produto
  const abrirEditarProduto = (produto: Produto) => {
    setProdutoEditando(produto);
    setFormNome(produto.nome);
    setFormPreco(String(produto.preco));
    setDialogAberto(true);
  };

  // Salvar produto
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    const preco = parseFloat(formPreco) || 0;
    if (preco <= 0) {
      toast.error("Informe um preço válido");
      return;
    }

    if (produtoEditando) {
      onEditar(produtoEditando.id, {
        nome: formNome.trim(),
        preco,
      });
      toast.success("Produto atualizado com sucesso!");
    } else {
      const novoProduto: Produto = {
        id: gerarId(),
        nome: formNome.trim(),
        preco,
        ativo: true,
      };
      onAdicionar(novoProduto);
      toast.success("Produto adicionado com sucesso!");
    }
    setDialogAberto(false);
  };

  // Confirmar exclusão
  const handleConfirmarExclusao = () => {
    if (produtoExcluindo) {
      onExcluir(produtoExcluindo.id);
      toast.success("Produto excluído com sucesso!");
      setProdutoExcluindo(null);
      setConfirmAberto(false);
    }
  };

  // Alternar ativo/inativo
  const handleToggleAtivo = (produto: Produto) => {
    onEditar(produto.id, { ativo: !produto.ativo });
    toast.success(
      produto.ativo
        ? "Produto desativado"
        : "Produto ativado"
    );
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {produtos.length} produto(s) cadastrado(s)
        </p>
        <Button
          onClick={abrirNovoProduto}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="size-4" />
          Novo Produto
        </Button>
      </div>

      {/* Lista de produtos */}
      {produtos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum produto cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {produtos.map((produto) => (
            <Card
              key={produto.id}
              className={`overflow-hidden transition-opacity ${
                !produto.ativo ? "opacity-60" : ""
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        produto.ativo
                          ? "bg-blue-50 dark:bg-blue-950/40"
                          : "bg-muted"
                      }`}
                    >
                      <Package
                        className={`size-5 ${
                          produto.ativo
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">
                        {produto.nome}
                      </p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatarMoeda(produto.preco)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => abrirEditarProduto(produto)}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setProdutoExcluindo(produto);
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
                      checked={produto.ativo}
                      onCheckedChange={() => handleToggleAtivo(produto)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-xs text-muted-foreground">
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de adicionar/editar produto */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-blue-600" />
              {produtoEditando ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {produtoEditando
                ? "Atualize os dados do produto"
                : "Preencha os dados do novo produto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pNome" className="text-sm font-medium">
                Nome do Produto *
              </Label>
              <Input
                id="pNome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Água, Refrigerante..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pPreco" className="text-sm font-medium">
                Preço (R$) *
              </Label>
              <Input
                id="pPreco"
                type="number"
                min="0"
                step="0.01"
                value={formPreco}
                onChange={(e) => setFormPreco(e.target.value)}
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
                {produtoEditando ? "Salvar Alterações" : "Adicionar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={confirmAberto} onOpenChange={setConfirmAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto{" "}
              <strong>{produtoExcluindo?.nome}</strong>? Esta ação não pode ser
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

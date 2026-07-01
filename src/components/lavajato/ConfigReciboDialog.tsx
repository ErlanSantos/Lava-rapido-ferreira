"use client";

// Componente: Dialog para editar as informações que aparecem no recibo
import { useState, useEffect } from "react";
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
import { Settings, Building2 } from "lucide-react";
import { ConfiguracoesRecibo, CONFIGURACOES_RECIBO_PADRAO } from "@/lib/types";
import {
  fetchConfigRecibo,
  upsertConfigRecibo,
} from "@/lib/supabase-service";
import { mascaraCNPJ } from "@/lib/helpers";
import { toast } from "sonner";

interface ConfigReciboDialogProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (config: ConfiguracoesRecibo) => void;
}

export function ConfigReciboDialog({
  aberto,
  onFechar,
  onSalvar,
}: ConfigReciboDialogProps) {
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [inicializado, setInicializado] = useState(false);

  // Carregar configurações do Supabase ao abrir
  const handleDialogChange = (open: boolean) => {
    if (open && !inicializado) {
      fetchConfigRecibo().then((config) => {
        setNomeEmpresa(config.nomeEmpresa);
        setCnpj(config.cnpj);
        setEndereco(config.endereco);
        setTelefone(config.telefone);
        setInicializado(true);
      });
    }
    if (!open) {
      setInicializado(false);
      onFechar();
    }
  };

  useEffect(() => {
    if (!inicializado && aberto) {
      fetchConfigRecibo().then((config) => {
        setNomeEmpresa(config.nomeEmpresa);
        setCnpj(config.cnpj);
        setEndereco(config.endereco);
        setTelefone(config.telefone);
        setInicializado(true);
      });
    }
  }, [inicializado, aberto]);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeEmpresa.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }

    const config: ConfiguracoesRecibo = {
      nomeEmpresa: nomeEmpresa.trim(),
      cnpj: cnpj.trim(),
      endereco: endereco.trim(),
      telefone: telefone.trim(),
    };

    upsertConfigRecibo(config).then(() => {
      onSalvar(config);
      toast.success("Configurações do recibo salvas!");
      onFechar();
    });
  };

  const handleRestaurar = () => {
    setNomeEmpresa(CONFIGURACOES_RECIBO_PADRAO.nomeEmpresa);
    setCnpj(CONFIGURACOES_RECIBO_PADRAO.cnpj);
    setEndereco(CONFIGURACOES_RECIBO_PADRAO.endereco);
    setTelefone(CONFIGURACOES_RECIBO_PADRAO.telefone);
  };

  return (
    <Dialog open={aberto} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5 text-blue-600" />
            Configurações do Recibo
          </DialogTitle>
          <DialogDescription>
            Informações que aparecem no cabeçalho e rodapé dos recibos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cfgNome" className="text-sm font-medium">
              Nome da Empresa *
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="cfgNome"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Lava-Rápido Ferreira"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cfgCnpj" className="text-sm font-medium">
              CPF / CNPJ
            </Label>
            <Input
              id="cfgCnpj"
              value={cnpj}
              onChange={(e) => setCnpj(mascaraCNPJ(e.target.value))}
              placeholder="00.000.000/0001-00"
              maxLength={18}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cfgEndereco" className="text-sm font-medium">
              Endereço
            </Label>
            <Input
              id="cfgEndereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Rua das Flores, 123 - Centro"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cfgTel" className="text-sm font-medium">
              Telefone da Empresa
            </Label>
            <Input
              id="cfgTel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Preview do cabeçalho do recibo */}
          <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Pré-visualização do recibo
            </p>
            <div className="bg-white dark:bg-gray-950 rounded-md p-3 text-center font-mono text-xs border">
              <p className="font-bold text-sm">{nomeEmpresa || "Nome da Empresa"}</p>
              {cnpj && <p className="text-[10px] text-gray-500">CNPJ: {cnpj}</p>}
              {endereco && <p className="text-[10px] text-gray-500">{endereco}</p>}
              {telefone && <p className="text-[10px] text-gray-500">Tel: {telefone}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleRestaurar}
              className="text-xs"
            >
              Restaurar Padrão
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onFechar}
                className="flex-1 sm:flex-initial"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial"
              >
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

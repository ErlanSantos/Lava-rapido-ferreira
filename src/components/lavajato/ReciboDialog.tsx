"use client";

// Componente: Modal de recibo e ações pós-finalização — com campos editáveis do cliente
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
import { Printer, MessageCircle, Settings, Pencil, Check } from "lucide-react";
import { Comanda, ConfiguracoesRecibo, CONFIGURACOES_RECIBO_PADRAO } from "@/lib/types";
import { formatarMoeda, formatarDataHora, formatarNumeroComanda, mascaraCNPJ, mascaraTelefone } from "@/lib/helpers";
import { fetchConfigRecibo } from "@/lib/supabase-service";
import { useState, useEffect } from "react";
import { ConfigReciboDialog } from "./ConfigReciboDialog";

interface ReciboDialogProps {
  comanda: Comanda | null;
  aberto: boolean;
  onFechar: () => void;
}

export function ReciboDialog({
  comanda,
  aberto,
  onFechar,
}: ReciboDialogProps) {
  const [imprimindo, setImprimindo] = useState(false);
  const [configRecibo, setConfigRecibo] = useState<ConfiguracoesRecibo>(CONFIGURACOES_RECIBO_PADRAO);
  const [configAberto, setConfigAberto] = useState(false);

  // Carregar config do Supabase ao montar
  useEffect(() => {
    fetchConfigRecibo().then(setConfigRecibo);
  }, []);

  // Campos editáveis do cliente no recibo
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [reciboNome, setReciboNome] = useState("");
  const [reciboCnpj, setReciboCnpj] = useState("");
  const [reciboTelefone, setReciboTelefone] = useState("");

  // Inicializar campos do cliente quando a comanda mudar
  if (comanda && (reciboNome !== comanda.cliente.nome || reciboTelefone !== comanda.cliente.telefone)) {
    setReciboNome(comanda.cliente.nome);
    setReciboCnpj("");
    setReciboTelefone(comanda.cliente.telefone);
  }

  if (!comanda) return null;

  // Total real para mensalistas: valorServico + consumos + caixinha (comanda.total é 0 para mensalistas)
  const totalReal = comanda.mensalista
    ? comanda.valorServico + comanda.consumos.reduce((s, c) => s + c.subtotal, 0) + (comanda.caixinha || 0)
    : comanda.total;

  // Nomes usados no recibo (editáveis ou da comanda)
  const clienteNome = reciboNome || comanda.cliente.nome;
  const clienteCnpj = reciboCnpj;
  const clienteTelefone = reciboTelefone;

  // Gera o conteúdo HTML do recibo como string para impressão
  const gerarHtmlRecibo = (): string => {
    const cfg = configRecibo;

    const consumosHtml = comanda.consumos
      .map(
        (c) =>
          `<div class="linha"><span>${c.nome} x${c.quantidade}</span><span>${formatarMoeda(c.subtotal)}</span></div>`
      )
      .join("\n");

    const caixinhaHtml =
      comanda.caixinha && comanda.caixinha > 0
        ? `<div class="separador"></div><div class="linha"><span>Caixinha</span><span>${formatarMoeda(comanda.caixinha)}</span></div>`
        : "";

    const saidaHtml = comanda.dataSaida
      ? `<p class="saida">Saida: ${formatarDataHora(comanda.dataSaida)}</p>`
      : "";

    const servicoHtml = comanda.mensalista
      ? `<div class="mensalista">
          <p>*** ACUMULATIVO MENSAL ***</p>
          <p>Servico acumulado no periodo</p>
        </div>
        <div class="separador"></div>
        <div class="linha servico">
          <span>${comanda.servico}</span>
          <span>${formatarMoeda(comanda.valorServico || 0)}</span>
        </div>`
      : comanda.lavagemGratis
      ? `<div class="lavagem-gratis">
          <p>*** LAVAGEM GRATIS ***</p>
          <p>Clube de Fidelidade</p>
        </div>
        <div class="separador"></div>
        <div class="linha servico">
          <span>${comanda.servico}</span>
          <span>R$ 0,00</span>
        </div>
        <div class="desconto-linha">
          <span>Valor original:</span>
          <span class="riscado">${formatarMoeda(comanda.valorServico || 0)}</span>
        </div>
        <div class="desconto-linha gratis">
          <span>Desconto fidelidade:</span>
          <span>- ${formatarMoeda(comanda.valorServico || 0)}</span>
        </div>`
      : `<div class="linha servico">
          <span>${comanda.servico}</span>
          <span>${formatarMoeda(comanda.valorServico)}</span>
        </div>`;

    // Linhas do cabeçalho da empresa
    const cnpjHtml = cfg.cnpj
      ? `<p class="cnpj">CNPJ/CPF: ${cfg.cnpj}</p>`
      : "";
    const enderecoHtml = cfg.endereco
      ? `<p class="endereco">${cfg.endereco}</p>`
      : "";
    const telEmpresaHtml = cfg.telefone
      ? `<p class="telefone-empresa">Tel: ${cfg.telefone}</p>`
      : "";

    // Linhas do cliente
    const clienteCnpjHtml = clienteCnpj
      ? `<p><strong>CPF/CNPJ:</strong> ${clienteCnpj}</p>`
      : "";

    return `
      <div class="recibo">
        <div class="cabecalho">
          <h1>${cfg.nomeEmpresa || "Lava-Rapido Ferreira"}</h1>
          ${cnpjHtml}
          ${enderecoHtml}
          ${telEmpresaHtml}
          <p class="subtitulo">---------------------------</p>
          <p class="data">${formatarDataHora(comanda.dataEntrada)}</p>
        </div>

        <div class="separador"></div>

        <div class="dados-cliente">
          <p class="titulo-secao">DADOS DO CLIENTE</p>
          <p><strong>Cliente:</strong> ${clienteNome}</p>
          ${clienteCnpjHtml}
          ${clienteTelefone ? `<p><strong>Tel:</strong> ${clienteTelefone}</p>` : ""}
          <p><strong>Veiculo:</strong> ${comanda.cliente.veiculo}</p>
          <p><strong>Placa:</strong> ${comanda.cliente.placa}</p>
        </div>

        <div class="separador"></div>

        <div class="itens">
          <p class="titulo-secao">COMANDA #${formatarNumeroComanda(comanda.numero)}</p>
          ${servicoHtml}
          ${consumosHtml}
        </div>

        ${caixinhaHtml}

        <div class="separador"></div>

        <div class="total">
          <div class="linha-total">
            <span>TOTAL:</span>
            <span>${formatarMoeda(totalReal)}</span>
          </div>
          <p class="pagamento">Pagamento: ${comanda.formaPagamento || "—"}</p>
        </div>

        <div class="separador"></div>

        <div class="rodape">
          <p>Obrigado pela preferencia!</p>
          <p>Volte sempre!</p>
          ${saidaHtml}
          ${cfg.telefone ? `<p class="tel-footer">${cfg.telefone}</p>` : ""}
        </div>
      </div>
    `;
  };

  // Função de impressão usando nova janela
  const imprimirRecibo = () => {
    setImprimindo(true);
    try {
      const janela = window.open("", "ImpressaoRecibo", "width=420,height=700");

      if (!janela) {
        alert(
          "Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está ativo e permita pop-ups para este site."
        );
        setImprimindo(false);
        return;
      }

      const conteudoRecibo = gerarHtmlRecibo();

      janela.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo - ${configRecibo.nomeEmpresa || "Lava-Rapido Ferreira"}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      width: 300px;
      margin: 0 auto;
      padding: 15px 10px;
      color: #000;
      background: #fff;
      font-size: 12px;
      line-height: 1.4;
    }

    .recibo { width: 100%; }

    .cabecalho { text-align: center; margin-bottom: 8px; }
    .cabecalho h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .cabecalho .cnpj,
    .cabecalho .endereco,
    .cabecalho .telefone-empresa { font-size: 9px; color: #555; margin-bottom: 1px; }
    .cabecalho .subtitulo { font-size: 10px; color: #999; margin: 4px 0; }
    .cabecalho .data { font-size: 10px; color: #666; margin-top: 2px; }

    .separador { border-top: 1px dashed #999; margin: 8px 0; }
    .titulo-secao { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
    .dados-cliente p, .rodape p { font-size: 11px; margin-bottom: 1px; }
    .dados-cliente strong { font-weight: bold; }
    .itens .servico { font-weight: bold; margin-bottom: 2px; }

    .linha {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 11px;
      margin-bottom: 1px;
    }

    .total { text-align: center; }
    .linha-total {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: bold;
      padding: 4px 0;
    }
    .total .pagamento { font-size: 10px; color: #666; margin-top: 2px; }

    .rodape { text-align: center; margin-top: 4px; }
    .rodape p { font-size: 10px; color: #666; }
    .rodape .tel-footer { font-size: 9px; color: #555; margin-top: 4px; }
    .saida { margin-top: 6px; }

    .lavagem-gratis { text-align: center; padding: 6px 0; margin-bottom: 4px; }
    .lavagem-gratis p:first-child { font-size: 14px; font-weight: bold; color: #b45309; }
    .lavagem-gratis p:last-child { font-size: 10px; color: #b45309; }

    .mensalista { text-align: center; padding: 6px 0; margin-bottom: 4px; }
    .mensalista p:first-child { font-size: 14px; font-weight: bold; color: #059669; }
    .mensalista p:last-child { font-size: 10px; color: #059669; }

    .desconto-linha {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #666;
      margin-bottom: 1px;
    }
    .desconto-linha .riscado { text-decoration: line-through; }
    .desconto-linha.gratis { font-weight: bold; color: #b45309; font-size: 11px; }

    @media print {
      html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
      body {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 20px;
        background: #fff;
      }
      .recibo { width: 300px; margin: 0 auto; box-shadow: none; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
  ${conteudoRecibo}
</body>
</html>
      `);

      janela.document.close();

      janela.onload = function () {
        setTimeout(() => {
          janela.focus();
          janela.print();
          janela.close();
          setImprimindo(false);
        }, 300);
      };
    } catch (erro) {
      console.error("Erro ao imprimir recibo:", erro);
      setImprimindo(false);
      alert("Erro ao imprimir o recibo. Tente novamente.");
    }
  };

  // Função de envio WhatsApp
  const enviarWhatsApp = () => {
    const tel = (clienteTelefone || comanda.cliente.telefone).replace(/\D/g, "");
    if (!tel) {
      alert("Cliente não possui telefone cadastrado.");
      return;
    }

    const nomeEmpresa = configRecibo.nomeEmpresa || "Lava-Rapido Ferreira";

    const msg = [
      `*${nomeEmpresa} - Recibo*`,
      ...(configRecibo.cnpj ? [`CNPJ/CPF: ${configRecibo.cnpj}`, ``] : []),
      ...(configRecibo.endereco ? [`Endereco: ${configRecibo.endereco}`, ``] : []),
      `*Comanda #${formatarNumeroComanda(comanda.numero)}*`,
      ``,
      `*Cliente:* ${clienteNome}`,
      ...(clienteCnpj ? [`*CPF/CNPJ:* ${clienteCnpj}`, ``] : []),
      `*Veiculo:* ${comanda.cliente.veiculo}`,
      `*Placa:* ${comanda.cliente.placa}`,
      ...(clienteTelefone ? [`*Tel:* ${clienteTelefone}`, ``] : []),
      ``,
      ...(comanda.mensalista
        ? [`*Tipo:* Acumulativo Mensal`, `Servico incluso no acumulativo mensal`, ``]
        : []),
      `*Servico:* ${comanda.servico} - ${formatarMoeda(comanda.valorServico)}`,
      ...(comanda.consumos.length > 0
        ? comanda.consumos.map(
            (c) =>
              `   ${c.nome} x${c.quantidade} - ${formatarMoeda(c.subtotal)}`
          )
        : []),
      ...(comanda.caixinha && comanda.caixinha > 0
        ? [``, `*Caixinha:* ${formatarMoeda(comanda.caixinha)}`]
        : []),
      ``,
      `*TOTAL: ${formatarMoeda(totalReal)}*`,
      `*Pagamento:* ${comanda.formaPagamento || "-"}`,
      ``,
      `Obrigado pela preferencia!`,
    ].join("\n");

    const url = `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleSalvarConfig = (config: ConfiguracoesRecibo) => {
    setConfigRecibo(config);
  };

  return (
    <>
      <Dialog open={aberto} onOpenChange={onFechar}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <span className="text-xl">🧾</span> Comanda Finalizada
              </DialogTitle>
              <button
                onClick={() => setConfigAberto(true)}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Configurar informações da empresa no recibo"
              >
                <Settings className="size-4" />
              </button>
            </div>
            <DialogDescription>
              Comanda #{formatarNumeroComanda(comanda.numero)} —{" "}
              {comanda.cliente.nome}
            </DialogDescription>
          </DialogHeader>

          {/* Seção editável dos dados do cliente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Pencil className="size-3.5" />
                Dados do Cliente no Recibo
              </p>
              <button
                onClick={() => setEditandoCliente(!editandoCliente)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {editandoCliente ? (
                  <>
                    <Check className="size-3" />
                    Pronto
                  </>
                ) : (
                  <>
                    <Pencil className="size-3" />
                    Editar
                  </>
                )}
              </button>
            </div>

            {editandoCliente ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Nome do Cliente
                  </label>
                  <Input
                    value={reciboNome}
                    onChange={(e) => setReciboNome(e.target.value)}
                    placeholder="Nome completo"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    CPF / CNPJ
                  </label>
                  <Input
                    value={reciboCnpj}
                    onChange={(e) => setReciboCnpj(mascaraCNPJ(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={18}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Telefone
                  </label>
                  <Input
                    value={reciboTelefone}
                    onChange={(e) => setReciboTelefone(mascaraTelefone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-sm px-1">
                <div>
                  <p className="text-[10px] text-muted-foreground">Nome</p>
                  <p className="font-medium truncate">{clienteNome}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium truncate">{clienteCnpj || <span className="text-muted-foreground">—</span>}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Telefone</p>
                  <p className="font-medium truncate">{clienteTelefone || <span className="text-muted-foreground">—</span>}</p>
                </div>
              </div>
            )}
          </div>

          {/* Recibo estilizado na tela */}
          <div className="flex justify-center">
            <div
              className="bg-white text-black p-5 font-mono text-xs shadow-inner rounded-lg"
              style={{ width: "300px" }}
            >
              {/* Cabeçalho */}
              <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                <h2 className="font-bold text-base">{configRecibo.nomeEmpresa}</h2>
                {configRecibo.cnpj && (
                  <p className="text-[9px] text-gray-500">CNPJ/CPF: {configRecibo.cnpj}</p>
                )}
                {configRecibo.endereco && (
                  <p className="text-[9px] text-gray-500">{configRecibo.endereco}</p>
                )}
                {configRecibo.telefone && (
                  <p className="text-[9px] text-gray-500">Tel: {configRecibo.telefone}</p>
                )}
                <div className="text-gray-300 my-1.5">- - - - - - - - - - - - - - - -</div>
                <p className="text-[10px] text-gray-600">
                  {formatarDataHora(comanda.dataEntrada)}
                </p>
              </div>

              {/* Dados do cliente */}
              <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
                <p className="font-bold text-xs mb-1">DADOS DO CLIENTE</p>
                <p>Cliente: {clienteNome}</p>
                {clienteCnpj && (
                  <p>CPF/CNPJ: {clienteCnpj}</p>
                )}
                {clienteTelefone && (
                  <p>Tel: {clienteTelefone}</p>
                )}
                <p>Veículo: {comanda.cliente.veiculo}</p>
                <p>Placa: {comanda.cliente.placa}</p>
              </div>

              {/* Comanda */}
              <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
                <p className="font-bold text-xs mb-1">
                  COMANDA #{formatarNumeroComanda(comanda.numero)}
                </p>
                {comanda.mensalista && (
                  <div className="text-center mb-1">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                      ACUMULATIVO
                    </span>
                    <p className="text-[10px] text-blue-600 mt-0.5">Servico incluso no acumulativo mensal</p>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>{comanda.servico}</span>
                  <span>{formatarMoeda(comanda.valorServico)}</span>
                </div>

                {/* Consumos */}
                {comanda.consumos.map((c) => (
                  <div key={c.id} className="flex justify-between mt-0.5">
                    <span>
                      {c.nome} x{c.quantidade}
                    </span>
                    <span>{formatarMoeda(c.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Caixinha */}
              {comanda.caixinha && comanda.caixinha > 0 && (
                <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
                  <div className="flex justify-between">
                    <span>Caixinha</span>
                    <span>{formatarMoeda(comanda.caixinha)}</span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                <p className="font-bold text-sm">
                  TOTAL: {formatarMoeda(totalReal)}
                </p>
                <p className="text-[10px]">
                  Pagamento: {comanda.formaPagamento || "—"}
                </p>
              </div>

              {/* Rodapé */}
              <div className="text-center">
                <p className="text-[10px] text-gray-500">
                  Obrigado pela preferência!
                </p>
                <p className="text-[10px] text-gray-500">
                  Volte sempre!
                </p>
                {configRecibo.telefone && (
                  <p className="text-[9px] text-gray-400 mt-1">
                    {configRecibo.telefone}
                  </p>
                )}
                {comanda.dataSaida && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Saída: {formatarDataHora(comanda.dataSaida)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              onClick={() => setConfigAberto(true)}
              variant="outline"
              className="gap-2 text-muted-foreground"
              size="sm"
            >
              <Settings className="size-3.5" />
              Empresa
            </Button>
            <div className="flex-1" />
            <Button
              onClick={enviarWhatsApp}
              variant="outline"
              className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </Button>
            <Button
              onClick={imprimirRecibo}
              disabled={imprimindo}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {imprimindo ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Imprimindo...
                </>
              ) : (
                <>
                  <Printer className="size-4" />
                  Imprimir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de configurações do recibo (empresa) */}
      <ConfigReciboDialog
        aberto={configAberto}
        onFechar={() => setConfigAberto(false)}
        onSalvar={handleSalvarConfig}
      />
    </>
  );
}

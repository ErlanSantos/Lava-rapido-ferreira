"use client";

// Componente: Formulário de nova entrada de veículo
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Car,
  UserPlus,
  Check,
  X,
  Award,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Cliente, Comanda, Servico, Fidelidade, Mensalista, ResultadoBuscaEntrada } from "@/lib/types";
import {
  mascaraPlaca,
  mascaraTelefone,
  desmascararTelefone,
  gerarId,
} from "@/lib/helpers";
import { toast } from "sonner";

interface NovaEntradaProps {
  buscarParaEntrada: (termo: string) => ResultadoBuscaEntrada[];
  registrarCliente: (cliente: Cliente) => Promise<Cliente>;
  criarComanda: (dados: {
    cliente: Cliente;
    servico: string;
    valorServico: number;
    lavagemGratis?: boolean;
    mensalista?: boolean;
    mensalistaId?: string;
  }) => Promise<Comanda>;
  servicos: Servico[];
  obterFidelidade: (clienteId: string) => Fidelidade | undefined;
  buscarMensalistaPorPlaca?: (placa: string) => Mensalista | undefined;
}

export function NovaEntrada({
  buscarParaEntrada,
  registrarCliente,
  criarComanda,
  servicos,
  obterFidelidade,
  buscarMensalistaPorPlaca,
}: NovaEntradaProps) {
  // Estado do formulário
  const [termoBusca, setTermoBusca] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // Resultados de busca unificados (clientes + mensalistas)
  const resultadosBusca = useMemo(() => {
    if (termoBusca.length < 2) return [];
    return buscarParaEntrada(termoBusca);
  }, [termoBusca, buscarParaEntrada]);

  // Mostrar resultados quando a busca retorna resultados
  const deveMostrarResultados = mostrarResultados && termoBusca.length >= 2;
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [origemSelecionada, setOrigemSelecionada] = useState<"cliente" | "mensalista">("cliente");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [placa, setPlaca] = useState("");
  const [servico, setServico] = useState("");
  const [valorServico, setValorServico] = useState("");
  const [novoCliente, setNovoCliente] = useState(false);
  const [usarLavagemGratis, setUsarLavagemGratis] = useState(false);
  const [mensalistaDetectado, setMensalistaDetectado] = useState<Mensalista | null>(null);

  const buscaRef = useRef<HTMLDivElement>(null);

  // Verificar se o cliente selecionado tem lavagens grátis
  const fidelidadeCliente = clienteSelecionado
    ? obterFidelidade(clienteSelecionado.id)
    : null;
  const temLavagemGratis = (fidelidadeCliente?.lavagensGratis || 0) > 0;

  // Verificar se é mensalista (seleção pela busca OU detecção por placa)
  const ehMensalista = origemSelecionada === "mensalista" || !!mensalistaDetectado;

  // Detectar mensalista pela placa (fallback para preenchimento manual)
  useEffect(() => {
    if (placa.length >= 3 && buscarMensalistaPorPlaca) {
      const m = buscarMensalistaPorPlaca(placa);
      // Só preencher automaticamente se nenhum cliente foi selecionado pela busca
      if (m && !clienteSelecionado && !novoCliente) {
        setMensalistaDetectado(m);
        setNome(m.nome);
        setTelefone(m.telefone);
        setVeiculo(m.veiculo);
      } else if (!m) {
        setMensalistaDetectado(null);
      }
    } else if (placa.length < 3) {
      setMensalistaDetectado(null);
    }
  }, [placa, buscarMensalistaPorPlaca, clienteSelecionado, novoCliente]);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) {
        setMostrarResultados(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Atualizar visibilidade dos resultados ao mudar o termo de busca
  useEffect(() => {
    setMostrarResultados(termoBusca.length >= 2);
  }, [termoBusca]);

  // Selecionar resultado da busca (cliente OU mensalista)
  const selecionarResultado = (resultado: ResultadoBuscaEntrada) => {
    setClienteSelecionado(resultado.cliente);
    setOrigemSelecionada(resultado.origem);
    setNome(resultado.cliente.nome);
    setTelefone(resultado.cliente.telefone);
    setVeiculo(resultado.cliente.veiculo);
    setPlaca(resultado.cliente.placa);
    setTermoBusca("");
    setMostrarResultados(false);
    setNovoCliente(false);
    setUsarLavagemGratis(false);

    if (resultado.origem === "mensalista") {
      setMensalistaDetectado(resultado.cliente as unknown as Mensalista);
    } else {
      setMensalistaDetectado(null);
    }
  };

  // Limpar formulário
  const limparFormulario = () => {
    setClienteSelecionado(null);
    setOrigemSelecionada("cliente");
    setNome("");
    setTelefone("");
    setVeiculo("");
    setPlaca("");
    setServico("");
    setValorServico("");
    setTermoBusca("");
    setNovoCliente(false);
    setUsarLavagemGratis(false);
    setMensalistaDetectado(null);
  };

  // Serviço selecionado — atualiza valor automaticamente
  const handleServicoChange = (valor: string) => {
    setServico(valor);
    const servicoEncontrado = servicos.find((s) => s.nome === valor);
    if (servicoEncontrado) {
      setValorServico(String(servicoEncontrado.valor));
    }
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!nome.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (!veiculo.trim()) {
      toast.error("Informe o veículo/modelo");
      return;
    }
    if (!placa.trim()) {
      toast.error("Informe a placa do veículo");
      return;
    }
    if (!servico) {
      toast.error("Selecione o serviço");
      return;
    }

    const valor = parseFloat(valorServico) || 0;
    if (valor <= 0 && !usarLavagemGratis && !ehMensalista) {
      toast.error("Informe um valor válido para o serviço");
      return;
    }

    // Criar ou usar cliente existente
    let cliente: Cliente;
    if (clienteSelecionado) {
      cliente = clienteSelecionado;
    } else {
      cliente = {
        id: gerarId(),
        nome: nome.trim(),
        telefone: desmascararTelefone(telefone),
        veiculo: veiculo.trim(),
        placa: placa.trim(),
      };
      // Não registrar mensalistas como novos clientes na tabela clientes
      if (!ehMensalista) {
        try {
          await registrarCliente(cliente);
        } catch (err) {
          toast.error("Erro ao cadastrar cliente. Tente novamente.");
          return;
        }
      }
    }

    try {
      await criarComanda({
        cliente,
        servico,
        valorServico: usarLavagemGratis ? 0 : valor,
        lavagemGratis: usarLavagemGratis,
        mensalista: ehMensalista,
        mensalistaId: ehMensalista ? (mensalistaDetectado?.id || clienteSelecionado?.id) : undefined,
      });

      toast.success(
        usarLavagemGratis
          ? "Lavagem gratuita utilizada!"
          : ehMensalista
            ? "Entrada de mensalista registrada!"
            : "Comanda criada com sucesso!",
        {
          description: usarLavagemGratis
            ? `Lavagem grátis para ${cliente.nome}`
            : ehMensalista
              ? `${cliente.nome} (Mensalista) — ${servico}`
              : `${cliente.nome} - ${servico}`,
        }
      );

      limparFormulario();
    } catch (err) {
      console.error("Erro ao criar comanda:", err);
      toast.error("Erro ao criar comanda. Tente novamente.");
    }
  };

  // Serviços ativos filtrados
  const servicosAtivos = servicos.filter((s) => s.ativo);

  // Determinar se o mensalista está ativo ou vencido
  const statusMensalista = mensalistaDetectado?.status || (ehMensalista ? "ativo" : null);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus className="size-5 text-blue-600" />
            Nova Entrada de Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Busca de cliente / mensalista */}
            <div ref={buscaRef} className="relative">
              <Label className="mb-1.5 block text-sm font-medium">
                Buscar Cliente ou Mensalista
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Buscar por nome, placa ou veículo..."
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              {deveMostrarResultados && resultadosBusca.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                  {resultadosBusca.map((resultado) => {
                    const { cliente: c, origem } = resultado;
                    const fid = origem === "cliente" ? obterFidelidade(c.id) : null;
                    const temGratis = (fid?.lavagensGratis || 0) > 0;
                    const ehSelecionado = clienteSelecionado?.id === c.id;
                    return (
                      <button
                        key={`${origem}-${c.id}`}
                        type="button"
                        onClick={() => selecionarResultado(resultado)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors border-b last:border-0 ${
                          ehSelecionado ? "bg-accent" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {c.nome}
                            {origem === "mensalista" && (
                              <Badge className="ml-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[9px] px-1.5 py-0 gap-0.5">
                                <Users className="size-3" />
                                Mensalista
                              </Badge>
                            )}
                            {temGratis && (
                              <Badge className="ml-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] px-1.5 py-0">
                                <Award className="size-3 mr-0.5 inline" />
                                {fid!.lavagensGratis} grátis
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.veiculo} &bull; {c.placa}
                          </p>
                        </div>
                        {ehSelecionado && (
                          <Check className="size-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {deveMostrarResultados && resultadosBusca.length === 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-popover border rounded-lg shadow-lg p-3 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado
                  </div>
                )}
            </div>

            {/* Indicador de cliente selecionado ou novo */}
            {clienteSelecionado ? (
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                ehMensalista
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                  : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
              }`}>
                {ehMensalista ? (
                  <Users className="size-4 text-blue-600 shrink-0" />
                ) : (
                  <Check className="size-4 text-blue-600 shrink-0" />
                )}
                <span className="text-sm flex-1">
                  {ehMensalista ? (
                    <>Mensalista selecionado: <strong>{clienteSelecionado.nome}</strong></>
                  ) : (
                    <>Cliente selecionado: <strong>{clienteSelecionado.nome}</strong></>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setClienteSelecionado(null);
                    limparFormulario();
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNovoCliente(!novoCliente);
                  if (novoCliente) limparFormulario();
                }}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <UserPlus className="size-4" />
                {novoCliente ? "Cancelar novo cliente" : "Cadastrar novo cliente"}
              </button>
            )}

            {/* Banner de mensalista detectado (busca por placa ou seleção) */}
            {ehMensalista && !novoCliente && (
              <div className={`p-4 rounded-xl border-2 ${
                statusMensalista === "vencido"
                  ? "border-red-300 dark:border-red-600 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/60 dark:to-orange-950/60"
                  : "border-blue-300 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950/60 dark:to-blue-950/60"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    statusMensalista === "vencido"
                      ? "bg-red-100 dark:bg-red-900/60"
                      : "bg-blue-100 dark:bg-blue-900/60"
                  }`}>
                    <Users className={`size-5 ${
                      statusMensalista === "vencido"
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm ${
                      statusMensalista === "vencido"
                        ? "text-red-800 dark:text-red-300"
                        : "text-blue-800 dark:text-blue-300"
                    }`}>
                      {statusMensalista === "vencido" ? "Mensalista Vencido" : "Cliente Mensalista"}
                    </h3>
                    <p className={`text-xs mt-0.5 ${
                      statusMensalista === "vencido"
                        ? "text-red-700 dark:text-red-400"
                        : "text-blue-700 dark:text-blue-400"
                    }`}>
                      <strong>{mensalistaDetectado?.nome || clienteSelecionado?.nome}</strong> &bull; {mensalistaDetectado?.veiculo || clienteSelecionado?.veiculo} &bull; {mensalistaDetectado?.placa || clienteSelecionado?.placa}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        statusMensalista === "vencido"
                          ? "bg-red-200 dark:bg-red-800/60 text-red-800 dark:text-red-300"
                          : "bg-blue-200 dark:bg-blue-800/60 text-blue-800 dark:text-blue-300"
                      }`}>
                        {statusMensalista === "vencido" ? "Vencido" : "Ativo"}
                      </span>
                      {statusMensalista === "vencido" && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                          Acumulativo vencido!
                        </span>
                      )}
                    </div>
                    <div className="mt-2 p-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/40">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Serviço incluso no acumulativo mensal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Banner de lavagem grátis */}
            {temLavagemGratis && !novoCliente && !ehMensalista && (
              <div className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/60 dark:to-yellow-950/60">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 shrink-0">
                    <Award className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                      Clube de Fidelidade - Lavagem Grátis!
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      {clienteSelecionado?.nome} tem{" "}
                      <strong>{fidelidadeCliente?.lavagensGratis}</strong>{" "}
                      lavagem{fidelidadeCliente?.lavagensGratis !== 1 ? "s" : ""} grátis disponível{fidelidadeCliente?.lavagensGratis !== 1 ? "is" : ""}!
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setUsarLavagemGratis(!usarLavagemGratis)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          usarLavagemGratis
                            ? "bg-amber-500"
                            : "bg-amber-200 dark:bg-amber-800"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            usarLavagemGratis ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {usarLavagemGratis ? "Usar lavagem grátis!" : "Usar lavagem grátis"}
                      </span>
                    </div>
                    {usarLavagemGratis && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          O serviço ficará com valor de R$ 0,00 (grátis)
                        </p>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-500">
                      <span>Progresso:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                              i < (fidelidadeCliente?.pontos || 0)
                                ? "bg-amber-500 text-white"
                                : i === (fidelidadeCliente?.pontos || 0) && !usarLavagemGratis
                                  ? "bg-amber-200 dark:bg-amber-700 text-amber-600 dark:text-amber-300"
                                  : "bg-amber-100 dark:bg-amber-800/60 text-amber-400 dark:text-amber-600"
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dados do cliente (se novo, selecionado ou mensalista) */}
            {(novoCliente || clienteSelecionado || ehMensalista) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-sm font-medium">
                    Nome *
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo"
                    readOnly={ehMensalista}
                    className={ehMensalista ? "bg-muted/60" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-sm font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) =>
                      setTelefone(mascaraTelefone(e.target.value))
                    }
                    placeholder="(11) 99999-9999"
                    readOnly={ehMensalista}
                    className={ehMensalista ? "bg-muted/60" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="veiculo" className="text-sm font-medium">
                    Veículo / Modelo *
                  </Label>
                  <Input
                    id="veiculo"
                    value={veiculo}
                    onChange={(e) => setVeiculo(e.target.value)}
                    placeholder="Ex: Honda Civic 2022"
                    readOnly={ehMensalista}
                    className={ehMensalista ? "bg-muted/60" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="placa" className="text-sm font-medium">
                    Placa *
                  </Label>
                  <Input
                    id="placa"
                    value={placa}
                    onChange={(e) => setPlaca(mascaraPlaca(e.target.value))}
                    placeholder="ABC-1D23"
                    className="uppercase"
                    readOnly={ehMensalista}
                  />
                </div>
              </div>
            )}

            {/* Dados do serviço */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Car className="size-4 text-blue-600" />
                Dados do Serviço
                {usarLavagemGratis && (
                  <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5">
                    GRATIS
                  </Badge>
                )}
                {ehMensalista && !usarLavagemGratis && (
                  <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5">
                    MENSALISTA
                  </Badge>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Serviço *</Label>
                  <Select value={servico} onValueChange={handleServicoChange} disabled={usarLavagemGratis}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicosAtivos.map((s) => (
                        <SelectItem key={s.id} value={s.nome}>
                          <span className="flex justify-between w-full gap-4">
                            <span>{s.nome}</span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] shrink-0"
                            >
                              R$ {s.valor.toFixed(2)}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="valor" className="text-sm font-medium">
                    Valor (R$) {usarLavagemGratis && "*"}
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={usarLavagemGratis ? "0.00" : valorServico}
                    onChange={(e) => setValorServico(e.target.value)}
                    placeholder="0,00"
                    readOnly={usarLavagemGratis}
                    className={usarLavagemGratis ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 font-bold text-blue-600" : ""}
                  />
                </div>
              </div>
            </div>

            {/* Botão de envio */}
            <Button
              type="submit"
              className={`w-full ${
                usarLavagemGratis
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                  : ehMensalista
                    ? "bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              size="lg"
            >
              {usarLavagemGratis ? (
                <>
                  <Award className="size-4 mr-2" />
                  Criar Comanda (Lavagem Grátis)
                </>
              ) : ehMensalista ? (
                <>
                  <Users className="size-4 mr-2" />
                  Criar Comanda (Mensalista)
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Criar Comanda
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

// Hook principal do Lava-Rápido Ferreira — gerencia todo o estado da aplicação
// Versão com Supabase: dados persistidos na nuvem em tempo real
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Cliente,
  Comanda,
  Consumo,
  AbaAtiva,
  FORMAS_PAGAMENTO,
  Produto,
  Servico,
  Fidelidade,
  FIDELIDADE_MAX_PONTOS,
  Despesa,
  Funcionario,
  DiaTrabalhado,
  PagamentoFunc,
  Mensalista,
  PagamentoMensalista,
  ResultadoBuscaEntrada,
  SaldoMensalista,
  ConsumoMensalista,
} from "@/lib/types";
import {
  carregarTudo,
  insertCliente,
  updateCliente as sbUpdateCliente,
  deleteCliente as sbDeleteCliente,
  insertProduto,
  updateProduto as sbUpdateProduto,
  deleteProduto as sbDeleteProduto,
  insertServico,
  updateServico as sbUpdateServico,
  deleteServico as sbDeleteServico,
  insertComanda,
  updateComanda as sbUpdateComanda,
  deleteComanda as sbDeleteComanda,
  insertConsumo as sbInsertConsumo,
  deleteConsumo as sbDeleteConsumo,
  fetchProximoNumero,
  upsertFidelidade,
  seedDados,
  SQL_CRIACAO_TABELAS,
  insertDespesa as sbInsertDespesa,
  updateDespesa as sbUpdateDespesa,
  deleteDespesa as sbDeleteDespesa,
  insertFuncionario as sbInsertFuncionario,
  updateFuncionario as sbUpdateFuncionario,
  deleteFuncionario as sbDeleteFuncionario,
  insertDiaTrabalhado as sbInsertDiaTrabalhado,
  deleteDiaTrabalhado as sbDeleteDiaTrabalhado,
  marcarDiasComoPagos as sbMarcarDiasComoPagos,
  insertPagamentoFunc as sbInsertPagamentoFunc,
  fetchMensalistas,
  insertMensalista as sbInsertMensalista,
  updateMensalista as sbUpdateMensalista,
  deleteMensalista as sbDeleteMensalista,
  registrarPagamentoMensalista as sbRegistrarPagamentoMensalista,
  fetchPagamentosMensalistas,
  fetchSaldoMensalistas,
  atualizarStatusMensalistas,
  fetchTodosConsumosMensalistas,
  insertConsumoMensalista as sbInsertConsumoMensalista,
  deleteConsumoMensalista as sbDeleteConsumoMensalista,
} from "@/lib/supabase-service";
import { getSupabaseClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Retorna a data de hoje no formato "YYYY-MM-DD"
function hojeFormatado(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useLavaJato() {
  // Estado principal
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [fidelidades, setFidelidades] = useState<Fidelidade[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [diasTrabalhados, setDiasTrabalhados] = useState<DiaTrabalhado[]>([]);
  const [pagamentosFunc, setPagamentosFunc] = useState<PagamentoFunc[]>([]);
  const [mensalistas, setMensalistas] = useState<Mensalista[]>([]);
  const [pagamentosMensalistas, setPagamentosMensalistas] = useState<PagamentoMensalista[]>([]);
  const [saldoMensalistas, setSaldoMensalistas] = useState<SaldoMensalista[]>([]);
  const [consumosMensalistas, setConsumosMensalistas] = useState<ConsumoMensalista[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("dashboard");
  const [carregado, setCarregado] = useState(false);
  const [tabelasProntas, setTabelasProntas] = useState(false);
  const [inicializando, setInicializando] = useState(false);

  // Data selecionada no dashboard (formato "YYYY-MM-DD")
  const [dataSelecionada, setDataSelecionada] = useState<string>(hojeFormatado());

  // Referência para o canal de real-time (para limpeza)
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ===== CARREGAR DADOS DO SUPABASE AO MONTAR =====
  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      try {
        console.log("[LavaJato] Iniciando carregamento de dados...");
        const dados = await carregarTudo();
        if (cancelled) return;
        console.log("[LavaJato] Dados carregados:", {
          clientes: dados.clientes.length,
          comandas: dados.comandas.length,
          produtos: dados.produtos.length,
          servicos: dados.servicos.length,
          despesas: dados.despesas.length,
          funcionarios: dados.funcionarios.length,
        });
        setClientes(dados.clientes);
        setComandas(dados.comandas);
        setProdutos(dados.produtos);
        setServicos(dados.servicos);
        setFidelidades(dados.fidelidades);
        setDespesas(dados.despesas);
        setFuncionarios(dados.funcionarios);
        setDiasTrabalhados(dados.diasTrabalhados);
        setPagamentosFunc(dados.pagamentosFunc);
        setMensalistas(dados.mensalistas);
        // Carregar pagamentos de mensalistas separadamente
        try {
          const pags = await fetchPagamentosMensalistas();
          if (!cancelled) setPagamentosMensalistas(pags);
        } catch (e) { console.error("Erro ao carregar pagamentos mensalistas:", e); }
        // Carregar saldos dos mensalistas separadamente
        try {
          const saldos = await fetchSaldoMensalistas();
          console.log("[LavaJato] Saldos mensalistas carregados:", saldos.length, "registros", saldos);
          if (!cancelled) setSaldoMensalistas(saldos);
        } catch (e) { console.error("Erro ao carregar saldos mensalistas:", e); }
        // Carregar consumos extras dos mensalistas
        try {
          const consumos = await fetchTodosConsumosMensalistas();
          if (!cancelled) setConsumosMensalistas(consumos);
        } catch (e) { console.error("Erro ao carregar consumos mensalistas:", e); }
        setTabelasProntas(true);
      } catch (err) {
        if (cancelled) return;
        console.error("[LavaJato] Erro ao carregar dados do Supabase:", err);
        setTabelasProntas(false);
      } finally {
        if (!cancelled) setCarregado(true);
      }
    }
    carregar();
    // Timeout de segurança: se em 15s não carregou, forçar carregado=true
    const timeout = setTimeout(() => {
      console.warn("[LavaJato] Timeout de carregamento — forçando exibição");
      setCarregado(true);
    }, 15000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  // ===== ATUALIZAR STATUS DE VENCIMENTO DOS MENSALISTAS =====
  useEffect(() => {
    atualizarStatusMensalistas();
  }, []);

  // ===== VERIFICAR TABELAS E SEED =====
  const verificarETabelas = useCallback(async (): Promise<boolean> => {
    try {
      const sb = getSupabaseClient();
      if (!sb) return false;
      const { error } = await sb.from("clientes").select("id").limit(1);
      if (error && error.code === "42P01") {
        setTabelasProntas(false);
        return false;
      }
      // Tabelas existem — seed dados
      await seedDados();
      // Recarregar tudo
      const dados = await carregarTudo();
      setClientes(dados.clientes);
      setComandas(dados.comandas);
      setProdutos(dados.produtos);
      setServicos(dados.servicos);
      setFidelidades(dados.fidelidades);
      setDespesas(dados.despesas);
      setFuncionarios(dados.funcionarios);
      setDiasTrabalhados(dados.diasTrabalhados);
      setPagamentosFunc(dados.pagamentosFunc);
      setMensalistas(dados.mensalistas);
      const pags = await fetchPagamentosMensalistas();
      setPagamentosMensalistas(pags);
      setTabelasProntas(true);
      return true;
    } catch (err) {
      console.error("Erro ao verificar tabelas:", err);
      return false;
    }
  }, []);

  // ===== REAL-TIME SUBSCRIPTIONS =====
  useEffect(() => {
    let mounted = true;
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      // Cria um único canal para escutar todas as tabelas
      const channel = sb
        .channel("lavajato-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, async () => {
          if (!mounted) return;
          try {
            const { fetchClientes } = await import("@/lib/supabase-service");
            const novos = await fetchClientes();
            if (mounted) setClientes(novos);
          } catch (e) { console.error("[Realtime] clientes:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "produtos" }, async () => {
          if (!mounted) return;
          try {
            const { fetchProdutos } = await import("@/lib/supabase-service");
            const novos = await fetchProdutos();
            if (mounted) setProdutos(novos);
          } catch (e) { console.error("[Realtime] produtos:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "servicos" }, async () => {
          if (!mounted) return;
          try {
            const { fetchServicos } = await import("@/lib/supabase-service");
            const novos = await fetchServicos();
            if (mounted) setServicos(novos);
          } catch (e) { console.error("[Realtime] servicos:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "fidelidade" }, async () => {
          if (!mounted) return;
          try {
            const { fetchFidelidade } = await import("@/lib/supabase-service");
            const novos = await fetchFidelidade();
            if (mounted) setFidelidades(novos);
          } catch (e) { console.error("[Realtime] fidelidade:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "comandas" }, async () => {
          if (!mounted) return;
          try {
            const { fetchComandas } = await import("@/lib/supabase-service");
            const novas = await fetchComandas();
            if (mounted) setComandas(novas);
          } catch (e) { console.error("[Realtime] comandas:", e); }
          // Recalcular saldos mensalistas (comandas afetam saldo)
          // Delay de 800ms para evitar race condition com a VIEW
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { fetchSaldoMensalistas, fetchTodosConsumosMensalistas } = await import("@/lib/supabase-service");
              const [saldos, consumos] = await Promise.all([
                fetchSaldoMensalistas(),
                fetchTodosConsumosMensalistas(),
              ]);
              if (mounted) {
                setSaldoMensalistas(saldos);
                setConsumosMensalistas(consumos);
              }
            } catch (e) { console.error("[Realtime] saldos (comandas):", e); }
          }, 800);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "consumos" }, async () => {
          if (!mounted) return;
          try {
            const { fetchComandas } = await import("@/lib/supabase-service");
            const novas = await fetchComandas();
            if (mounted) setComandas(novas);
          } catch (e) { console.error("[Realtime] consumos:", e); }
          // Consumos em comandas mensalistas afetam o saldo
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { fetchSaldoMensalistas, fetchTodosConsumosMensalistas } = await import("@/lib/supabase-service");
              const [saldos, consumos] = await Promise.all([
                fetchSaldoMensalistas(),
                fetchTodosConsumosMensalistas(),
              ]);
              if (mounted) {
                setSaldoMensalistas(saldos);
                setConsumosMensalistas(consumos);
              }
            } catch (e) { console.error("[Realtime] saldos (consumos):", e); }
          }, 800);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "despesas" }, async () => {
          if (!mounted) return;
          try {
            const { fetchDespesas } = await import("@/lib/supabase-service");
            const novos = await fetchDespesas();
            if (mounted) setDespesas(novos);
          } catch (e) { console.error("[Realtime] despesas:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "funcionarios" }, async () => {
          if (!mounted) return;
          try {
            const { fetchFuncionarios } = await import("@/lib/supabase-service");
            const novos = await fetchFuncionarios();
            if (mounted) setFuncionarios(novos);
          } catch (e) { console.error("[Realtime] funcionarios:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "dias_trabalhados" }, async () => {
          if (!mounted) return;
          try {
            const { fetchDiasTrabalhados } = await import("@/lib/supabase-service");
            const novos = await fetchDiasTrabalhados();
            if (mounted) setDiasTrabalhados(novos);
          } catch (e) { console.error("[Realtime] dias:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "pagamentos_func" }, async () => {
          if (!mounted) return;
          try {
            const { fetchPagamentosFunc } = await import("@/lib/supabase-service");
            const novos = await fetchPagamentosFunc();
            if (mounted) setPagamentosFunc(novos);
          } catch (e) { console.error("[Realtime] pagamentos:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "mensalistas" }, async () => {
          if (!mounted) return;
          try {
            const { fetchMensalistas } = await import("@/lib/supabase-service");
            const novos = await fetchMensalistas();
            if (mounted) setMensalistas(novos);
          } catch (e) { console.error("[Realtime] mensalistas:", e); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "pagamentos_mensalistas" }, async () => {
          if (!mounted) return;
          try {
            const { fetchPagamentosMensalistas } = await import("@/lib/supabase-service");
            const novos = await fetchPagamentosMensalistas();
            if (mounted) setPagamentosMensalistas(novos);
          } catch (e) { console.error("[Realtime] pagamentos_mensalistas:", e); }
          // Recalcular saldos mensalistas (pagamentos afetam saldo)
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { fetchSaldoMensalistas, fetchTodosConsumosMensalistas } = await import("@/lib/supabase-service");
              const [saldos, consumos] = await Promise.all([
                fetchSaldoMensalistas(),
                fetchTodosConsumosMensalistas(),
              ]);
              if (mounted) {
                setSaldoMensalistas(saldos);
                setConsumosMensalistas(consumos);
              }
            } catch (e) { console.error("[Realtime] saldos (pagamentos):", e); }
          }, 800);
        })
        // Realtime para mensalista_consumos (extras do mensalista)
        .on("postgres_changes", { event: "*", schema: "public", table: "mensalista_consumos" }, async () => {
          if (!mounted) return;
          console.log("[Realtime] mensalista_consumos changed — refetching saldos");
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { fetchSaldoMensalistas, fetchTodosConsumosMensalistas } = await import("@/lib/supabase-service");
              const [saldos, consumos] = await Promise.all([
                fetchSaldoMensalistas(),
                fetchTodosConsumosMensalistas(),
              ]);
              if (mounted) {
                setSaldoMensalistas(saldos);
                setConsumosMensalistas(consumos);
              }
            } catch (e) { console.error("[Realtime] saldos (mensalista_consumos):", e); }
          }, 500);
        })
        .subscribe((status) => {
          console.log("[LavaJato] Realtime status:", status);
        });

      channelRef.current = channel;

      return () => {
        mounted = false;
        if (channelRef.current) {
          try { sb.removeChannel(channelRef.current); } catch (e) { console.error("[Realtime] cleanup error:", e); }
          channelRef.current = null;
        }
      };
    } catch (err) {
      console.error("[LavaJato] Erro ao configurar realtime:", err);
    }
    return () => { mounted = false; };
  }, []);

  // ===== REFRESH MANUAL + POLLING DE FALLBACK =====
  const refreshDados = useCallback(async () => {
    try {
      const dados = await carregarTudo();
      setClientes(dados.clientes);
      setComandas(dados.comandas);
      setProdutos(dados.produtos);
      setServicos(dados.servicos);
      setFidelidades(dados.fidelidades);
      setDespesas(dados.despesas);
      setFuncionarios(dados.funcionarios);
      setDiasTrabalhados(dados.diasTrabalhados);
      setPagamentosFunc(dados.pagamentosFunc);
      setMensalistas(dados.mensalistas);
      const pags = await fetchPagamentosMensalistas();
      setPagamentosMensalistas(pags);
      try {
        const saldos = await fetchSaldoMensalistas();
        setSaldoMensalistas(saldos);
      } catch (e) { console.error("Erro ao recarregar saldos:", e); }
    } catch (err) {
      console.error("Erro ao recarregar dados:", err);
    }
  }, []);

  // Polling a cada 30s como fallback caso realtime falhe
  useEffect(() => {
    const intervalo = setInterval(() => {
      refreshDados();
    }, 30_000);
    return () => clearInterval(intervalo);
  }, [refreshDados]);

  // ===== FUNÇÕES AUXILIARES PARA FIDELIDADE =====

  /** Atualiza fidelidade local e no banco de forma otimista */
  function atualizarFidelidadeLocal(
    clienteId: string,
    novosPontos: number,
    novasGratis: number
  ): { pontos: number; lavagensGratis: number } {
    setFidelidades((prev) => {
      const idx = prev.findIndex((f) => f.clienteId === clienteId);
      const novos = [...prev];
      if (idx >= 0) {
        novos[idx] = { clienteId, pontos: novosPontos, lavagensGratis: novasGratis };
      } else {
        novos.push({ clienteId, pontos: novosPontos, lavagensGratis: novasGratis });
      }
      return novos;
    });
    return { pontos: novosPontos, lavagensGratis: novasGratis };
  }

  // ===== MÉTRICAS DO DASHBOARD (filtradas por dataSelecionada) =====

  /** Converte ISO string (UTC) para data local no formato "YYYY-MM-DD" */
  function paraDataLocal(isoString: string): string {
    const d = new Date(isoString);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  const comandasDaData = useMemo(() => {
    return comandas.filter((c) => paraDataLocal(c.dataEntrada) === dataSelecionada);
  }, [comandas, dataSelecionada]);

  const comandasAtivas = useMemo(
    () => comandas.filter((c) => c.status === "em_andamento"),
    [comandas]
  );

  const comandasFinalizadasDaData = useMemo(
    () =>
      comandas.filter(
        (c) => c.status === "finalizada" && paraDataLocal(c.dataEntrada) === dataSelecionada
      ),
    [comandas, dataSelecionada]
  );

  // Comandas finalizadas que NÃO são de mensalistas (para cálculo de faturamento real)
  const comandasFaturamentoDaData = useMemo(
    () =>
      comandasFinalizadasDaData.filter((c) => !c.mensalista),
    [comandasFinalizadasDaData]
  );

  const metricas = useMemo(
    () => {
      // Faturamento: SOMENTE comandas normais pagas (exclui mensalistas)
      const faturamentoComandas = comandasFaturamentoDaData.reduce((s, c) => s + c.total, 0);
      // Mensalidades pagas no mês selecionado
      const mesAtual = dataSelecionada.substring(0, 7); // "YYYY-MM"
      const mensalidadesPagasMes = pagamentosMensalistas
        .filter((p) => p.dataPagamento.substring(0, 7) === mesAtual)
        .reduce((s, p) => s + p.valor, 0);
      const faturamentoTotal = faturamentoComandas + mensalidadesPagasMes;
      const totalFinalizadas = comandasFinalizadasDaData.length;
      return {
        veiculosNoDia: totalFinalizadas,
        totalFaturado: faturamentoTotal,
        totalAtendimentos: totalFinalizadas,
        ticketMedio:
          comandasFaturamentoDaData.length > 0
            ? faturamentoComandas / comandasFaturamentoDaData.length
            : 0,
        veiculosEmAndamento: comandasAtivas.length,
      };
    },
    [comandasFinalizadasDaData, comandasFaturamentoDaData, comandasAtivas, pagamentosMensalistas, dataSelecionada]
  );

  // ===== NAVEGAÇÃO DE DATA =====
  const irParaHoje = useCallback(() => {
    setDataSelecionada(hojeFormatado());
  }, []);

  const irParaDiaAnterior = useCallback(() => {
    setDataSelecionada((anterior) => {
      const d = new Date(anterior + "T12:00:00");
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
  }, []);

  const irParaProximoDia = useCallback(() => {
    setDataSelecionada((anterior) => {
      const d = new Date(anterior + "T12:00:00");
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
  }, []);

  // ===== CLIENTES =====
  const buscarClientes = useCallback(
    (termo: string): Cliente[] => {
      const t = termo.toLowerCase().trim();
      if (!t) return [];
      return clientes.filter(
        (c) =>
          c.nome.toLowerCase().includes(t) ||
          c.placa.toLowerCase().includes(t) ||
          c.veiculo.toLowerCase().includes(t)
      );
    },
    [clientes]
  );

  // ===== BUSCA UNIFICADA PARA NOVA ENTRADA (clientes + mensalistas) =====
  const buscarParaEntrada = useCallback(
    (termo: string): ResultadoBuscaEntrada[] => {
      const t = termo.toLowerCase().trim();
      if (!t || t.length < 2) return [];

      // Buscar clientes normais
      const resultadosClientes: ResultadoBuscaEntrada[] = clientes
        .filter(
          (c) =>
            c.nome.toLowerCase().includes(t) ||
            c.placa.toLowerCase().includes(t) ||
            c.veiculo.toLowerCase().includes(t)
        )
        .map((c) => ({ cliente: c, origem: "cliente" as const }));

      // Buscar mensalistas (convertendo para formato Cliente)
      const resultadosMensalistas: ResultadoBuscaEntrada[] = mensalistas
        .filter(
          (m) =>
            m.nome.toLowerCase().includes(t) ||
            m.placa.toLowerCase().includes(t) ||
            m.veiculo.toLowerCase().includes(t)
        )
        .map((m) => ({
          cliente: {
            id: m.id,
            nome: m.nome,
            telefone: m.telefone,
            veiculo: m.veiculo,
            placa: m.placa,
          },
          origem: "mensalista" as const,
          mensalistaId: m.id,
        }));

      return [...resultadosClientes, ...resultadosMensalistas];
    },
    [clientes, mensalistas]
  );

  const registrarCliente = useCallback(
    async (cliente: Cliente): Promise<Cliente> => {
      // Atualização otimista do estado local
      setClientes((prev) => {
        const idx = prev.findIndex((c) => c.placa === cliente.placa);
        const novos = [...prev];
        if (idx >= 0) {
          novos[idx] = cliente;
        } else {
          novos.push(cliente);
        }
        return novos;
      });
      // Persistir no Supabase e aguardar conclusão
      const resultado = await insertCliente(cliente);
      if (!resultado) {
        // Rollback se falhou
        setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
        throw new Error("Falha ao salvar cliente no banco");
      }
      return cliente;
    },
    []
  );

  const editarCliente = useCallback(
    (id: string, dados: Partial<Cliente>) => {
      // Otimista
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...dados } : c))
      );
      // Persistir
      sbUpdateCliente(id, dados);
    },
    []
  );

  const excluirCliente = useCallback(
    (id: string) => {
      // Otimista
      setClientes((prev) => prev.filter((c) => c.id !== id));
      // Persistir
      sbDeleteCliente(id);
    },
    []
  );

  // ===== PRODUTOS =====
  const adicionarProdutoHook = useCallback(
    (produto: Produto) => {
      setProdutos((prev) => [...prev, produto]);
      insertProduto(produto);
    },
    []
  );

  const editarProduto = useCallback(
    (id: string, dados: Partial<Produto>) => {
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...dados } : p))
      );
      sbUpdateProduto(id, dados);
    },
    []
  );

  const excluirProduto = useCallback(
    (id: string) => {
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      sbDeleteProduto(id);
    },
    []
  );

  // ===== SERVIÇOS =====
  const adicionarServicoHook = useCallback(
    (servico: Servico) => {
      setServicos((prev) => [...prev, servico]);
      insertServico(servico);
    },
    []
  );

  const editarServico = useCallback(
    (id: string, dados: Partial<Servico>) => {
      setServicos((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...dados } : s))
      );
      sbUpdateServico(id, dados);
    },
    []
  );

  const excluirServico = useCallback(
    (id: string) => {
      setServicos((prev) => prev.filter((s) => s.id !== id));
      sbDeleteServico(id);
    },
    []
  );

  // ===== FIDELIDADE =====
  const obterFidelidadeHook = useCallback(
    (clienteId: string) => {
      return fidelidades.find((f) => f.clienteId === clienteId);
    },
    [fidelidades]
  );

  const adicionarPontosFidelidadeHook = useCallback(
    (clienteId: string) => {
      const atual = fidelidades.find((f) => f.clienteId === clienteId);
      let pontos = (atual?.pontos || 0) + 1;
      let lavagensGratis = atual?.lavagensGratis || 0;

      // Se atingiu o máximo, concede lavagem grátis e reseta
      if (pontos >= FIDELIDADE_MAX_PONTOS) {
        lavagensGratis += 1;
        pontos = 0;
      }

      const resultado = atualizarFidelidadeLocal(clienteId, pontos, lavagensGratis);
      upsertFidelidade(clienteId, pontos, lavagensGratis);
      return resultado;
    },
    [fidelidades]
  );

  const ajustarPontosFidelidadeHook = useCallback(
    (clienteId: string, delta: number) => {
      const atual = fidelidades.find((f) => f.clienteId === clienteId);
      let pontos = Math.max(0, (atual?.pontos || 0) + delta);
      let lavagensGratis = atual?.lavagensGratis || 0;

      // Se atingiu o máximo, concede lavagem grátis e reseta
      if (pontos >= FIDELIDADE_MAX_PONTOS) {
        lavagensGratis += 1;
        pontos = 0;
      }

      const resultado = atualizarFidelidadeLocal(clienteId, pontos, lavagensGratis);
      upsertFidelidade(clienteId, pontos, lavagensGratis);
      return resultado;
    },
    [fidelidades]
  );

  const ajustarLavagensGratisHook = useCallback(
    (clienteId: string, delta: number) => {
      const atual = fidelidades.find((f) => f.clienteId === clienteId);
      const lavagensGratis = Math.max(0, (atual?.lavagensGratis || 0) + delta);
      const pontos = atual?.pontos || 0;

      const resultado = atualizarFidelidadeLocal(clienteId, pontos, lavagensGratis);
      upsertFidelidade(clienteId, pontos, lavagensGratis);
      return resultado;
    },
    [fidelidades]
  );

  // ===== RECALCULAR SALDOS MEN SALISTAS (helper compartilhado) =====
  const recalcularSaldosFn = useCallback(async () => {
    try {
      console.log("[LavaJato] Recalculando saldos mensalistas...");
      const [saldos, consumos] = await Promise.all([
        fetchSaldoMensalistas(),
        fetchTodosConsumosMensalistas(),
      ]);
      setSaldoMensalistas(saldos);
      setConsumosMensalistas(consumos);
      console.log("[LavaJato] Saldos recalculados:", saldos.length, "registros");
    } catch (e) {
      console.error("[LavaJato] Erro ao recalcular saldos:", e);
    }
  }, []);

  // ===== COMANDAS =====
  const criarComanda = useCallback(
    async (dados: {
      cliente: Cliente;
      servico: string;
      valorServico: number;
      lavagemGratis?: boolean;
      mensalista?: boolean;
      mensalistaId?: string;
    }): Promise<Comanda> => {
      const numero = await fetchProximoNumero();
      const ehGratis = dados.lavagemGratis || false;
      const ehMensalista = dados.mensalista || false;
      // Mensalistas e lavagens grátis: total = 0 (não entram no faturamento)
      // mas valorServico guarda o valor REAL para controle de saldo do mensalista
      const novaComanda: Comanda = {
        id: crypto.randomUUID(),
        numero,
        cliente: dados.cliente,
        servico: dados.servico,
        valorServico: dados.valorServico,
        consumos: [],
        total: (ehGratis || ehMensalista) ? 0 : dados.valorServico,
        status: "em_andamento",
        dataEntrada: new Date().toISOString(),
        lavagemGratis: ehGratis,
        mensalista: dados.mensalista || false,
        mensalistaId: dados.mensalistaId,
      };

      // Se for lavagem grátis, debitar do saldo de lavagens gratuitas
      if (ehGratis) {
        const atual = fidelidades.find((f) => f.clienteId === dados.cliente.id);
        const novasGratis = Math.max(0, (atual?.lavagensGratis || 0) - 1);
        atualizarFidelidadeLocal(dados.cliente.id, atual?.pontos || 0, novasGratis);
        upsertFidelidade(dados.cliente.id, atual?.pontos || 0, novasGratis);
      }

      // Otimista
      setComandas((prev) => [novaComanda, ...prev]);
      // Persistir e aguardar conclusão
      const resultado = await insertComanda(novaComanda);
      if (!resultado) {
        // Rollback se falhou
        setComandas((prev) => prev.filter((c) => c.id !== novaComanda.id));
        throw new Error("Falha ao salvar comanda no banco");
      }

      // Após criar comanda de mensalista, recalcular saldos em tempo real
      if (ehMensalista) {
        console.log("[LavaJato] Comanda mensalista criada — recarregando saldos em 1s");
        setTimeout(() => recalcularSaldosFn(), 1000);
      }

      return novaComanda;
    },
    [fidelidades, recalcularSaldosFn]
  );

  const adicionarConsumo = useCallback(
    (comandaId: string, consumo: Consumo): Comanda[] => {
      // Otimista
      setComandas((prev) =>
        prev.map((c) => {
          if (c.id !== comandaId) return c;
          const novosConsumos = [...c.consumos, consumo];
          const novoTotal = c.valorServico + novosConsumos.reduce((s, x) => s + x.subtotal, 0);
          return { ...c, consumos: novosConsumos, total: novoTotal };
        })
      );
      // Persistir consumo no banco
      sbInsertConsumo(comandaId, consumo);
      // Atualizar total da comanda
      setComandas((prev) => {
        const comanda = prev.find((c) => c.id === comandaId);
        if (comanda) {
          sbUpdateComanda(comandaId, { total: comanda.total });
        }
        return prev;
      });
      return comandas;
    },
    [comandas]
  );

  const removerConsumo = useCallback(
    (comandaId: string, consumoId: string): Comanda[] => {
      // Otimista
      setComandas((prev) =>
        prev.map((c) => {
          if (c.id !== comandaId) return c;
          const novosConsumos = c.consumos.filter((x) => x.id !== consumoId);
          const novoTotal = c.valorServico + novosConsumos.reduce((s, x) => s + x.subtotal, 0);
          return { ...c, consumos: novosConsumos, total: novoTotal };
        })
      );
      // Persistir
      sbDeleteConsumo(consumoId);
      setComandas((prev) => {
        const comanda = prev.find((c) => c.id === comandaId);
        if (comanda) {
          sbUpdateComanda(comandaId, { total: comanda.total });
        }
        return prev;
      });
      return comandas;
    },
    [comandas]
  );

  const finalizarComanda = useCallback(
    (
      comandaId: string,
      formaPagamento: string,
      caixinha: number = 0
    ): Comanda | null => {
      const comanda = comandas.find((c) => c.id === comandaId);
      if (!comanda) return null;
      const totalFinal = comanda.total + caixinha;
      const now = new Date().toISOString();

      // Otimista
      setComandas((prev) =>
        prev.map((c) =>
          c.id === comandaId
            ? {
                ...c,
                status: "finalizada" as const,
                dataSaida: now,
                formaPagamento,
                caixinha,
                total: totalFinal,
              }
            : c
        )
      );

      // Persistir
      sbUpdateComanda(comandaId, {
        status: "finalizada",
        dataSaida: now,
        formaPagamento,
        caixinha,
        total: totalFinal,
      });

      // Adicionar pontos de fidelidade ao cliente (exceto lavagens grátis, mensalistas e sem cliente)
      if (!comanda.lavagemGratis && !comanda.mensalista && comanda.cliente.id) {
        const fidelAtual = fidelidades.find((f) => f.clienteId === comanda.cliente.id);
        let pontos = (fidelAtual?.pontos || 0) + 1;
        let lavagensGratis = fidelAtual?.lavagensGratis || 0;
        if (pontos >= FIDELIDADE_MAX_PONTOS) {
          lavagensGratis += 1;
          pontos = 0;
        }
        atualizarFidelidadeLocal(comanda.cliente.id, pontos, lavagensGratis);
        upsertFidelidade(comanda.cliente.id, pontos, lavagensGratis);
      }

      // Após finalizar comanda de mensalista, recalcular saldos em tempo real
      if (comanda.mensalista) {
        console.log("[LavaJato] Comanda mensalista finalizada — recarregando saldos em 1s");
        setTimeout(() => recalcularSaldosFn(), 1000);
      }

      return {
        ...comanda,
        status: "finalizada",
        dataSaida: now,
        formaPagamento,
        caixinha,
        total: totalFinal,
      };
    },
    [comandas, fidelidades, recalcularSaldosFn]
  );

  const cancelarComanda = useCallback(
    (comandaId: string): Comanda[] => {
      // Otimista
      setComandas((prev) => prev.filter((c) => c.id !== comandaId));
      // Persistir
      sbDeleteComanda(comandaId);
      return comandas;
    },
    [comandas]
  );

  // ===== EDITAR COMANDA (valor serviço, total) =====
  const editarComanda = useCallback(
    (comandaId: string, dados: { valorServico?: number; servico?: string; total?: number }) => {
      setComandas((prev) =>
        prev.map((c) => {
          if (c.id !== comandaId) return c;
          const atualizado = { ...c };
          if (dados.valorServico !== undefined) atualizado.valorServico = dados.valorServico;
          if (dados.servico !== undefined) atualizado.servico = dados.servico;
          if (dados.total !== undefined) atualizado.total = dados.total;
          return atualizado;
        })
      );
      // Persistir
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dados.valorServico !== undefined) row.valor_servico = dados.valorServico;
      if (dados.servico !== undefined) row.servico = dados.servico;
      if (dados.total !== undefined) row.total = dados.total;
      const sb = getSupabaseClient();
      if (sb) sb.from("comandas").update(row).eq("id", comandaId);
    },
    []
  );

  // ===== VENDA AVULSA (sem cliente) =====
  const criarVendaAvulsa = useCallback(
    async (dados: { produtos: Consumo[] }): Promise<Comanda> => {
      const numero = await fetchProximoNumero();
      const total = dados.produtos.reduce((s, p) => s + p.subtotal, 0);
      const novaComanda: Comanda = {
        id: crypto.randomUUID(),
        numero,
        cliente: { id: "", nome: "Venda Avulsa", telefone: "", veiculo: "", placa: "" },
        servico: "Venda de Produtos",
        valorServico: 0,
        consumos: dados.produtos,
        total,
        status: "finalizada",
        dataEntrada: new Date().toISOString(),
        dataSaida: new Date().toISOString(),
        formaPagamento: "Dinheiro",
        caixinha: 0,
        lavagemGratis: false,
      };

      // Otimista
      setComandas((prev) => [novaComanda, ...prev]);
      // Persistir comanda
      insertComanda(novaComanda);
      // Persistir consumos
      for (const consumo of dados.produtos) {
        sbInsertConsumo(novaComanda.id, consumo);
      }

      return novaComanda;
    },
    []
  );

  // ===== DESPESAS =====
  const adicionarDespesa = useCallback(
    async (despesa: Despesa): Promise<boolean> => {
      setDespesas((prev) => [...prev, despesa]);
      const resultado = await sbInsertDespesa(despesa);
      if (!resultado) {
        setDespesas((prev) => prev.filter((d) => d.id !== despesa.id));
        return false;
      }
      return true;
    },
    []
  );

  const editarDespesa = useCallback(
    async (id: string, dados: Partial<Despesa>): Promise<boolean> => {
      const original = despesas.find((d) => d.id === id);
      setDespesas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...dados } : d))
      );
      const ok = await sbUpdateDespesa(id, dados);
      if (!ok && original) {
        setDespesas((prev) =>
          prev.map((d) => (d.id === id ? original : d))
        );
      }
      return ok;
    },
    [despesas]
  );

  const excluirDespesa = useCallback(
    async (id: string): Promise<boolean> => {
      const backup = [...despesas];
      setDespesas((prev) => prev.filter((d) => d.id !== id));
      const ok = await sbDeleteDespesa(id);
      if (!ok) {
        setDespesas(backup);
      }
      return ok;
    },
    [despesas]
  );

  // ===== FUNCIONÁRIOS =====
  const adicionarFuncionario = useCallback(
    async (func: Funcionario): Promise<boolean> => {
      setFuncionarios((prev) => [...prev, func]);
      const resultado = await sbInsertFuncionario(func);
      if (!resultado) {
        setFuncionarios((prev) => prev.filter((f) => f.id !== func.id));
        return false;
      }
      return true;
    },
    []
  );

  const editarFuncionario = useCallback(
    async (id: string, dados: Partial<Funcionario>): Promise<boolean> => {
      const original = funcionarios.find((f) => f.id === id);
      setFuncionarios((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...dados } : f))
      );
      const ok = await sbUpdateFuncionario(id, dados);
      if (!ok && original) {
        setFuncionarios((prev) =>
          prev.map((f) => (f.id === id ? original : f))
        );
      }
      return ok;
    },
    [funcionarios]
  );

  const excluirFuncionario = useCallback(
    async (id: string): Promise<boolean> => {
      const backup = [...funcionarios];
      setFuncionarios((prev) => prev.filter((f) => f.id !== id));
      const ok = await sbDeleteFuncionario(id);
      if (!ok) {
        setFuncionarios(backup);
      }
      return ok;
    },
    [funcionarios]
  );

  // ===== DIAS TRABALHADOS =====
  const marcarDiaTrabalhado = useCallback(
    async (funcionarioId: string, data: string): Promise<boolean> => {
      const diaExistente = diasTrabalhados.find(
        (d) => d.funcionarioId === funcionarioId && d.data === data
      );
      if (diaExistente) return true; // já marcado

      const novoDia: DiaTrabalhado = {
        id: crypto.randomUUID(),
        funcionarioId,
        data,
        pago: false,
      };
      setDiasTrabalhados((prev) => [...prev, novoDia]);
      const resultado = await sbInsertDiaTrabalhado(novoDia);
      if (!resultado) {
        setDiasTrabalhados((prev) => prev.filter((d) => d.id !== novoDia.id));
        return false;
      }
      return true;
    },
    [diasTrabalhados]
  );

  const desmarcarDiaTrabalhado = useCallback(
    async (id: string): Promise<boolean> => {
      const backup = [...diasTrabalhados];
      setDiasTrabalhados((prev) => prev.filter((d) => d.id !== id));
      const ok = await sbDeleteDiaTrabalhado(id);
      if (!ok) {
        setDiasTrabalhados(backup);
      }
      return ok;
    },
    [diasTrabalhados]
  );

  // ===== PAGAMENTO DE FUNCIONÁRIO =====
  const pagarFuncionario = useCallback(
    (funcionarioId: string) => {
      const diasPendentes = diasTrabalhados.filter(
        (d) => d.funcionarioId === funcionarioId && !d.pago
      );
      if (diasPendentes.length === 0) return;

      const funcionario = funcionarios.find((f) => f.id === funcionarioId);
      if (!funcionario) return;

      const total = diasPendentes.length * funcionario.valorDia;
      const agora = new Date().toISOString();

      const novoPagamento: PagamentoFunc = {
        id: crypto.randomUUID(),
        funcionarioId,
        valor: total,
        diasPagos: diasPendentes.length,
        dataPagamento: agora,
      };

      // Otimista - marcar dias como pagos
      setDiasTrabalhados((prev) =>
        prev.map((d) =>
          d.funcionarioId === funcionarioId && !d.pago
            ? { ...d, pago: true }
            : d
        )
      );
      // Adicionar pagamento
      setPagamentosFunc((prev) => [novoPagamento, ...prev]);

      // Persistir
      sbMarcarDiasComoPagos(funcionarioId, diasPendentes.map((d) => d.id));
      sbInsertPagamentoFunc(novoPagamento);
    },
    [diasTrabalhados, funcionarios]
  );

  return {
    // Estado
    clientes,
    comandas,
    produtos,
    servicos,
    fidelidades,
    despesas,
    funcionarios,
    diasTrabalhados,
    pagamentosFunc,
    abaAtiva,
    setAbaAtiva,
    carregado,
    tabelasProntas,
    verificarETabelas,
    inicializando,
    setInicializando,
    // Data do Dashboard
    dataSelecionada,
    setDataSelecionada,
    irParaHoje,
    irParaDiaAnterior,
    irParaProximoDia,
    // Métricas
    metricas,
    comandasAtivas,
    comandasFinalizadasDaData,
    comandasDaData,
    refreshDados,
    // Clientes
    buscarClientes,
    buscarParaEntrada,
    registrarCliente,
    editarCliente,
    excluirCliente,
    // Produtos
    adicionarProdutoHook,
    editarProduto,
    excluirProduto,
    // Serviços
    adicionarServicoHook,
    editarServico,
    excluirServico,
    // Fidelidade
    adicionarPontosFidelidadeHook,
    obterFidelidadeHook,
    ajustarPontosFidelidadeHook,
    ajustarLavagensGratisHook,
    // Comandas
    criarComanda,
    adicionarConsumo,
    removerConsumo,
    finalizarComanda,
    cancelarComanda,
    editarComanda,
    // Venda avulsa
    criarVendaAvulsa,
    // Despesas
    adicionarDespesa,
    editarDespesa,
    excluirDespesa,
    // Funcionários
    adicionarFuncionario,
    editarFuncionario,
    excluirFuncionario,
    // Dias trabalhados
    marcarDiaTrabalhado,
    desmarcarDiaTrabalhado,
    // Pagamentos
    pagarFuncionario,
    // Mensalistas
    mensalistas,
    pagamentosMensalistas,
    metricasMensalistas: useMemo(() => {
      const total = mensalistas.length;
      const ativos = mensalistas.filter(m => m.status === "ativo").length;
      const vencidos = mensalistas.filter(m => m.status === "vencido").length;
      // Faturamento REAL = soma das mensalidades pagas no mês atual
      const mesAtual = new Date().toISOString().substring(0, 7);
      const receitaMensal = pagamentosMensalistas
        .filter(p => p.dataPagamento.substring(0, 7) === mesAtual)
        .reduce((s, p) => s + p.valor, 0);
      // Potencial = soma de todos os ativos (o que poderiam pagar)
      const potencialMensal = mensalistas.filter(m => m.status === "ativo").reduce((s, m) => s + m.valorMensal, 0);
      return { total, ativos, vencidos, faturamentoMensal: receitaMensal, potencialMensal };
    }, [mensalistas, pagamentosMensalistas]),
    buscarMensalistaPorPlaca: (placa: string) => {
      const p = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
      return mensalistas.find(m => m.placa.toUpperCase().replace(/[^A-Z0-9]/g, "") === p);
    },
    adicionarMensalista: async (m: Mensalista): Promise<boolean> => {
      setMensalistas(prev => [...prev, m]);
      try {
        const resultado = await sbInsertMensalista(m);
        if (!resultado) {
          setMensalistas(prev => prev.filter(x => x.id !== m.id));
          console.error("[Mensalista] INSERT falhou — item removido do estado local");
          return false;
        }
        // Refetch para garantir sincronia
        const novos = await fetchMensalistas();
        setMensalistas(novos);
        return true;
      } catch (err) {
        console.error("[Mensalista] Erro ao adicionar:", err);
        setMensalistas(prev => prev.filter(x => x.id !== m.id));
        return false;
      }
    },
    editarMensalista: async (id: string, dados: Partial<Mensalista>): Promise<boolean> => {
      const original = mensalistas.find(x => x.id === id);
      setMensalistas(prev => prev.map(m => m.id === id ? { ...m, ...dados } : m));
      try {
        const ok = await sbUpdateMensalista(id, dados);
        if (!ok && original) {
          setMensalistas(prev => prev.map(m => m.id === id ? original : m));
        }
        // Refetch para garantir sincronia
        const novos = await fetchMensalistas();
        setMensalistas(novos);
        return ok;
      } catch (err) {
        console.error("[Mensalista] Erro ao editar:", err);
        if (original) setMensalistas(prev => prev.map(m => m.id === id ? original : m));
        return false;
      }
    },
    excluirMensalista: async (id: string): Promise<boolean> => {
      const backup = [...mensalistas];
      setMensalistas(prev => prev.filter(m => m.id !== id));
      try {
        const ok = await sbDeleteMensalista(id);
        if (!ok) {
          setMensalistas(backup);
        }
        return ok;
      } catch (err) {
        console.error("[Mensalista] Erro ao excluir:", err);
        setMensalistas(backup);
        return false;
      }
    },
    registrarPagamentoMensalistaHook: async (id: string): Promise<boolean> => {
      try {
        const resultado = await sbRegistrarPagamentoMensalista(id);
        if (resultado) {
          // Refetch mensalistas e pagamentos
          const [novosMensalistas, novosPagamentos] = await Promise.all([
            fetchMensalistas(),
            fetchPagamentosMensalistas(),
          ]);
          setMensalistas(novosMensalistas);
          setPagamentosMensalistas(novosPagamentos);
          // Recalcular saldos dos mensalistas
          try {
            const saldos = await fetchSaldoMensalistas();
            setSaldoMensalistas(saldos);
          } catch (e) { console.error("Erro ao recalcular saldos:", e); }
          return true;
        }
        return false;
      } catch (err) {
        console.error("[Mensalista] Erro ao registrar pagamento:", err);
        return false;
      }
    },
    // Saldos mensalistas
    saldoMensalistas,
    consumosMensalistas,
    recalcularSaldos: recalcularSaldosFn,
    adicionarConsumoMensalista: async (consumo: Omit<ConsumoMensalista, "id" | "createdAt">): Promise<boolean> => {
      // Atualização otimista — UI responde na hora
      const tempId = crypto.randomUUID();
      const novoConsumo: ConsumoMensalista = {
        ...consumo,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      setConsumosMensalistas((prev) => [...prev, novoConsumo]);
      setSaldoMensalistas((prev) =>
        prev.map((s) =>
          s.mensalistaId === consumo.mensalistaId
            ? {
                ...s,
                totalAcumulado: s.totalAcumulado + consumo.subtotal,
                totalExtras: s.totalExtras + consumo.subtotal,
                saldoPendente: s.saldoPendente + consumo.subtotal,
              }
            : s
        )
      );
      try {
        const resultado = await sbInsertConsumoMensalista(consumo);
        if (!resultado) {
          // Rollback otimista
          setConsumosMensalistas((prev) => prev.filter((c) => c.id !== tempId));
          recalcularSaldosFn();
          return false;
        }
        // Reconciliar com dados do servidor
        const [novosConsumos, novosSaldos] = await Promise.all([
          fetchTodosConsumosMensalistas(),
          fetchSaldoMensalistas(),
        ]);
        setConsumosMensalistas(novosConsumos);
        setSaldoMensalistas(novosSaldos);
        return true;
      } catch (e) {
        // Rollback otimista
        setConsumosMensalistas((prev) => prev.filter((c) => c.id !== tempId));
        recalcularSaldosFn();
        console.error("[Mensalista] Erro ao adicionar consumo extra:", e);
        return false;
      }
    },
    removerConsumoMensalista: async (id: string): Promise<boolean> => {
      try {
        const ok = await sbDeleteConsumoMensalista(id);
        if (!ok) return false;
        const [novosConsumos, novosSaldos] = await Promise.all([
          fetchTodosConsumosMensalistas(),
          fetchSaldoMensalistas(),
        ]);
        setConsumosMensalistas(novosConsumos);
        setSaldoMensalistas(novosSaldos);
        return true;
      } catch (e) {
        console.error("[Mensalista] Erro ao remover consumo extra:", e);
        return false;
      }
    },
    // Constantes
    formasPagamento: FORMAS_PAGAMENTO,
    // Setup
    sqlCriacaoTabelas: SQL_CRIACAO_TABELAS,
  };
}

"use client";

// Tela de configuração inicial do Supabase
import { useState } from "react";
import { Database, Eye, EyeOff, CheckCircle, AlertCircle, Copy, Key } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { SQL_CRIACAO_TABELAS, seedDados, carregarTudo } from "@/lib/supabase-service";

interface SupabaseSetupProps {
  onConfigured: () => void;
}

export function SupabaseSetup({ onConfigured }: SupabaseSetupProps) {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<string>("digitando");
  const [erroMsg, setErroMsg] = useState("");
  const [showSQL, setShowSQL] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function handleConectar() {
    if (!url.trim() || !anonKey.trim()) return;

    setStatus("conectando");
    setErroMsg("");

    try {
      // Testa conexão tentando acessar as tabelas
      const sb = getSupabaseClient();

      const { error } = await sb.from("clientes").select("id").limit(1);

      if (error) {
        // Se a tabela não existe, precisa criar
        if (error.message.includes("does not exist") || error.code === "42P01") {
          setStatus("criando");
          setErroMsg("Tabelas não encontradas. Execute o SQL abaixo no Supabase para criar as tabelas.");
          setShowSQL(true);
          return;
        }
        throw new Error(error.message);
      }

      // Tabelas existem — verificar dados de semente
      setStatus("seed");
      await seedDados();

      setStatus("pronto");
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
      setErroMsg(mensagem);
      setStatus("erro");
    }
  }

  async function handleVerificarTabelas() {
    setStatus("conectando");
    setErroMsg("");
    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error("Cliente não configurado");

      const { error } = await sb.from("clientes").select("id").limit(1);
      if (error) throw new Error(error.message);

      // Tabelas OK — seed
      setStatus("seed");
      await seedDados();

      setStatus("pronto");
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
      setErroMsg(mensagem);
      setStatus("erro");
    }
  }

  function handleCopySQL() {
    navigator.clipboard.writeText(SQL_CRIACAO_TABELAS);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function handleReady() {
    onConfigured();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-600/20 mb-4">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configurar Supabase
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Conecte seu banco de dados para salvar tudo na nuvem
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          {/* Status: pronto */}
          {status === "pronto" && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Conectado com sucesso!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Seus dados estão sendo salvos na nuvem em tempo real.
                </p>
              </div>
              <button
                onClick={handleReady}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Entrar no Sistema
              </button>
            </div>
          )}

          {/* Status: digitando / erro */}
          {(status === "digitando" || status === "erro") && (
            <>
              {/* URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL do Projeto Supabase
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xxxxx.supabase.co"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Anon Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Chave Anon (anon public)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {status === "erro" && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{erroMsg}</p>
                </div>
              )}

              {/* Botão conectar */}
              <button
                onClick={handleConectar}
                disabled={!url.trim() || !anonKey.trim()}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
              >
                Conectar ao Supabase
              </button>

              {/* Instruções */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Como obter essas informações:
                </h3>
                <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                  <li>Acesse <strong>supabase.com</strong> e crie um projeto</li>
                  <li>Vá em <strong>Settings → API</strong></li>
                  <li>Copie a <strong>Project URL</strong></li>
                  <li>Copie a <strong>anon public</strong> key</li>
                </ol>
              </div>
            </>
          )}

          {/* Status: criando (tabelas não existem) */}
          {status === "criando" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-400">
                  <p className="font-semibold mb-1">Tabelas não encontradas</p>
                  <p>Execute o SQL abaixo no <strong>SQL Editor</strong> do Supabase para criar as tabelas necessárias.</p>
                </div>
              </div>

              {/* SQL Code */}
              <div className="relative">
                <button
                  onClick={() => setShowSQL(!showSQL)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <span className="font-mono">{showSQL ? "▾" : "▸"}</span>
                  {showSQL ? "Ocultar SQL" : "Mostrar SQL para criar tabelas"}
                </button>

                {showSQL && (
                  <div className="mt-3 relative">
                    <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-auto max-h-64 leading-relaxed">
                      <code>{SQL_CRIACAO_TABELAS}</code>
                    </pre>
                    <button
                      onClick={handleCopySQL}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
                      title="Copiar SQL"
                    >
                      {copiado ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Passo a passo */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                <h3 className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Passo a passo:
                </h3>
                <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5 list-decimal list-inside">
                  <li>No Supabase, vá em <strong>SQL Editor</strong> (menu lateral)</li>
                  <li>Clique em <strong>+ New query</strong></li>
                  <li>Cole o SQL acima e clique em <strong>Run</strong></li>
                  <li>Volte aqui e clique em <strong>&quot;Verificar conexão&quot;</strong></li>
                </ol>
              </div>

              <button
                onClick={handleVerificarTabelas}
                className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                Verificar Conexão
              </button>
            </div>
          )}

          {/* Status: seed */}
          {status === "seed" && (
            <div className="text-center py-6">
              <span className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Configurando dados iniciais...
              </p>
            </div>
          )}

          {/* Status: conectando */}
          {status === "conectando" && (
            <div className="text-center py-6">
              <span className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Testando conexão com o Supabase...
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Lava-Rápido Ferreira — Sistema de Gestão
        </p>
      </div>
    </div>
  );
}

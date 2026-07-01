// API route para inicializar tabelas no Supabase e inserir dados de semente
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qdzbqvazwaxthgijnpxz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5gIqrmnQCF0DPg3QOhLt5Q_8ArXqwDp";

export async function POST() {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Verifica se a tabela clientes já existe
    const { error: checkError } = await sb.from("clientes").select("id").limit(1);

    // Se a tabela não existe, não podemos criar via REST API — retorna o SQL
    if (checkError && checkError.code === "42P01") {
      return NextResponse.json(
        { success: false, precisaCriarTabelas: true },
        { status: 200 }
      );
    }

    // Tabelas existem — faz seed dos dados
    const seedResults: string[] = [];

    // Seed clientes
    const { count: countClientes } = await sb
      .from("clientes")
      .select("*", { count: "exact", head: true });
    if (!countClientes || countClientes === 0) {
      const { error } = await sb.from("clientes").insert([
        { nome: "João Silva", telefone: "11999887766", veiculo: "Honda Civic 2022", placa: "ABC-1D23" },
        { nome: "Maria Oliveira", telefone: "11988776655", veiculo: "Toyota Corolla 2023", placa: "DEF-4G56" },
        { nome: "Carlos Santos", telefone: "21977665544", veiculo: "Fiat Pulse 2024", placa: "GHI-7J89" },
        { nome: "Ana Paula Souza", telefone: "31966554433", veiculo: "Jeep Compass 2023", placa: "JKL-0M12" },
        { nome: "Roberto Ferreira", telefone: "41955443322", veiculo: "Volkswagen T-Cross 2024", placa: "MNO-3P45" },
      ]);
      seedResults.push(error ? `clientes: ERRO ${error.message}` : "clientes: OK");
    } else {
      seedResults.push(`clientes: já tem ${countClientes}`);
    }

    // Seed produtos
    const { count: countProdutos } = await sb
      .from("produtos")
      .select("*", { count: "exact", head: true });
    if (!countProdutos || countProdutos === 0) {
      const { error } = await sb.from("produtos").insert([
        { nome: "Água", preco: 3.0, ativo: true },
        { nome: "Refrigerante", preco: 5.0, ativo: true },
        { nome: "Cerveja", preco: 8.0, ativo: true },
        { nome: "Salgado", preco: 6.0, ativo: true },
        { nome: "Refeição", preco: 18.0, ativo: true },
      ]);
      seedResults.push(error ? `produtos: ERRO ${error.message}` : "produtos: OK");
    } else {
      seedResults.push(`produtos: já tem ${countProdutos}`);
    }

    // Seed serviços
    const { count: countServicos } = await sb
      .from("servicos")
      .select("*", { count: "exact", head: true });
    if (!countServicos || countServicos === 0) {
      const { error } = await sb.from("servicos").insert([
        { nome: "Lavagem Simples", valor: 30, ativo: true },
        { nome: "Lavagem Completa", valor: 50, ativo: true },
        { nome: "Polimento", valor: 150, ativo: true },
        { nome: "Enceramento", valor: 80, ativo: true },
        { nome: "Higienização Interna", valor: 60, ativo: true },
        { nome: "Lavagem + Enceramento", valor: 100, ativo: true },
        { nome: "Polimento Simples", valor: 120, ativo: true },
        { nome: "Lavagem Motor", valor: 40, ativo: true },
      ]);
      seedResults.push(error ? `servicos: ERRO ${error.message}` : "servicos: OK");
    } else {
      seedResults.push(`servicos: já tem ${countServicos}`);
    }

    // Seed config recibo
    const { count: countConfig } = await sb
      .from("config_recibo")
      .select("*", { count: "exact", head: true });
    if (!countConfig || countConfig === 0) {
      const { error } = await sb.from("config_recibo").insert({
        id: 1,
        nome_empresa: "Lava-Rápido Ferreira",
        cnpj: "",
        endereco: "",
        telefone: "",
      });
      seedResults.push(error ? `config: ERRO ${error.message}` : "config: OK");
    } else {
      seedResults.push("config: já existe");
    }

    return NextResponse.json({ success: true, seed: seedResults });
  } catch (err: unknown) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: mensagem }, { status: 500 });
  }
}

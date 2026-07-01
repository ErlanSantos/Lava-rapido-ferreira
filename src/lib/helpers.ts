// Funções utilitárias para formatação

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarDataHora(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarData(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("pt-BR");
}

export function gerarId(): string {
  return crypto.randomUUID();
}

// Máscara de placa: ABC-1D23 ou ABC1D23
export function mascaraPlaca(valor: string): string {
  const v = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (v.length <= 3) return v;
  return `${v.slice(0, 3)}-${v.slice(3)}`;
}

// Máscara de telefone: (11) 99999-9999
export function mascaraTelefone(valor: string): string {
  const v = valor.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 2) return v.length ? `(${v}` : "";
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

// Remover máscara do telefone
export function desmascararTelefone(valor: string): string {
  return valor.replace(/\D/g, "");
}

// Máscara de CNPJ: 00.000.000/0001-00 (também funciona para CPF: 000.000.000-00)
export function mascaraCNPJ(valor: string): string {
  const v = valor.replace(/\D/g, "").slice(0, 14);
  if (v.length <= 2) return v;
  if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`;
  if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
  if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
}

// Formatar número da comanda com zero à esquerda
export function formatarNumeroComanda(numero: number): string {
  return String(numero).padStart(4, "0");
}

// Formatar data estendida: "13 de Abril de 2026"
export function formatarDataExtenso(dataStr: string): string {
  const d = new Date(dataStr + "T12:00:00");
  const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const diaSemana = diasSemana[d.getDay()];
  const dia = d.getDate();
  const mes = meses[d.getMonth()];
  const ano = d.getFullYear();
  return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
}

// Verificar se uma data é hoje
export function isHoje(dataStr: string): boolean {
  const hoje = new Date();
  const d = new Date(dataStr + "T12:00:00");
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  );
}

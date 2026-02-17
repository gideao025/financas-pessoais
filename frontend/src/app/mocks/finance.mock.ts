import { signal } from '@angular/core';

export type TransactionType = 'entrada' | 'saida';
export type TransactionStatus = 'concluida' | 'pendente';

export interface SummaryCard {
  id: string;
  titulo: string;
  valor: number;
  variacao: number;
  icone: string;
}

export interface Transaction {
  id: string;
  descricao: string;
  categoria: string;
  conta: string;
  data: string;
  valor: number;
  tipo: TransactionType;
  status: TransactionStatus;
}

export interface CreditCard {
  id: string;
  nome: string;
  bandeira: string;
  final: string;
  limite: number;
  usado: number;
  vencimento: number;
  bloqueado: boolean;
}

export interface MonthlyPoint {
  mes: string;
  receita: number;
  despesa: number;
}

export interface LinkedBank {
  id: string;
  nome: string;
  tipo: string;
  final: string;
  sincronizado: boolean;
}

export interface Goal {
  id: string;
  nome: string;
  descricao: string;
  alvo: number;
  atual: number;
  prazo: string;
}

export const summaryCardsMock: SummaryCard[] = [
  { id: 'saldo', titulo: 'Saldo total', valor: 24560, variacao: 2.5, icone: 'account_balance_wallet' },
  { id: 'receita', titulo: 'Receitas do mês', valor: 5200, variacao: 12, icone: 'trending_up' },
  { id: 'despesa', titulo: 'Despesas do mês', valor: 3150, variacao: -4.2, icone: 'trending_down' }
];

export const transactionsMock: Transaction[] = [
  { id: 't1', descricao: 'Salário', categoria: 'Renda', conta: 'Nubank', data: '2026-02-05', valor: 5200, tipo: 'entrada', status: 'concluida' },
  { id: 't2', descricao: 'Supermercado', categoria: 'Alimentação', conta: 'Inter', data: '2026-02-09', valor: 420.9, tipo: 'saida', status: 'concluida' },
  { id: 't3', descricao: 'Assinaturas', categoria: 'Servicos', conta: 'Nubank', data: '2026-02-11', valor: 89.9, tipo: 'saida', status: 'pendente' },
  { id: 't4', descricao: 'Freelance UX', categoria: 'Renda Extra', conta: 'C6', data: '2026-02-13', valor: 1350, tipo: 'entrada', status: 'concluida' },
  { id: 't5', descricao: 'Energia eletrica', categoria: 'Casa', conta: 'Inter', data: '2026-02-14', valor: 210.45, tipo: 'saida', status: 'pendente' },
  { id: 't6', descricao: 'Farmácia', categoria: 'Saúde', conta: 'Nubank', data: '2026-02-15', valor: 76.3, tipo: 'saida', status: 'concluida' }
];

export const creditCardsMock: CreditCard[] = [
  { id: 'c1', nome: 'Nubank Ultravioleta', bandeira: 'Mastercard', final: '4921', limite: 18000, usado: 7420, vencimento: 12, bloqueado: false },
  { id: 'c2', nome: 'XP Visa Infinite', bandeira: 'Visa', final: '1044', limite: 25000, usado: 5900, vencimento: 8, bloqueado: false },
  { id: 'c3', nome: 'Inter Platinum', bandeira: 'Mastercard', final: '7788', limite: 9000, usado: 3100, vencimento: 20, bloqueado: true }
];

export const monthlyDataMock: Record<'3m' | '6m' | '12m', MonthlyPoint[]> = {
  '3m': [
    { mes: 'Dez', receita: 6800, despesa: 4100 },
    { mes: 'Jan', receita: 6400, despesa: 3800 },
    { mes: 'Fev', receita: 6550, despesa: 3950 }
  ],
  '6m': [
    { mes: 'Set', receita: 5900, despesa: 3600 },
    { mes: 'Out', receita: 6200, despesa: 3900 },
    { mes: 'Nov', receita: 6100, despesa: 3720 },
    { mes: 'Dez', receita: 6800, despesa: 4100 },
    { mes: 'Jan', receita: 6400, despesa: 3800 },
    { mes: 'Fev', receita: 6550, despesa: 3950 }
  ],
  '12m': [
    { mes: 'Mar', receita: 5200, despesa: 3300 },
    { mes: 'Abr', receita: 5400, despesa: 3500 },
    { mes: 'Mai', receita: 5600, despesa: 3400 },
    { mes: 'Jun', receita: 5800, despesa: 3600 },
    { mes: 'Jul', receita: 6100, despesa: 3700 },
    { mes: 'Ago', receita: 6000, despesa: 3550 },
    { mes: 'Set', receita: 5900, despesa: 3600 },
    { mes: 'Out', receita: 6200, despesa: 3900 },
    { mes: 'Nov', receita: 6100, despesa: 3720 },
    { mes: 'Dez', receita: 6800, despesa: 4100 },
    { mes: 'Jan', receita: 6400, despesa: 3800 },
    { mes: 'Fev', receita: 6550, despesa: 3950 }
  ]
};

export const linkedBanksMock: LinkedBank[] = [
  { id: 'b1', nome: 'Nubank', tipo: 'Conta corrente', final: '8821', sincronizado: true },
  { id: 'b2', nome: 'Banco Inter', tipo: 'Conta digital', final: '4002', sincronizado: true },
  { id: 'b3', nome: 'C6 Bank', tipo: 'Conta salario', final: '1190', sincronizado: false }
];

export const goalsMock: Goal[] = [
  {
    id: 'g1',
    nome: 'Reserva de Emergência',
    descricao: 'Guardar o equivalente a 6 meses de despesas fixas.',
    alvo: 20000,
    atual: 16400,
    prazo: '2026-12-31'
  },
  {
    id: 'g2',
    nome: 'Casa Própria',
    descricao: 'Entrada para apartamento.',
    alvo: 80000,
    atual: 9500,
    prazo: '2028-06-30'
  },
  {
    id: 'g3',
    nome: 'Viagem de Férias',
    descricao: 'Viagem internacional em família.',
    alvo: 15000,
    atual: 6700,
    prazo: '2027-01-15'
  }
];

export const goalsSignal = signal<Goal[]>(goalsMock);

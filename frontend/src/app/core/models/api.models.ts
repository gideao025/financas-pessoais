export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserSession {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type AccountType = 'CHECKING' | 'SAVINGS' | 'WALLET' | 'INVESTMENT';

export interface AccountResponse {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
  active: boolean;
}

export interface AccountRequest {
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
  active: boolean;
}

export type TransactionType = 'ENTRADA' | 'SAIDA';
export type TransactionStatus = 'CONCLUIDA' | 'PENDENTE' | 'PARCIAL';

export interface TransactionResponse {
  id: string;
  accountId: string | null;
  cardId: string | null;
  description: string;
  category: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  amount: number;
  paidAmount: number;
  transactionDate: string;
  recurrenceId: string | null;
  dueDate: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
}

export interface TransactionRequest {
  accountId: string | null;
  cardId: string | null;
  description: string;
  category: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  amount: number;
  transactionDate: string;
  installmentTotal: number | null;
}

export interface GoalResponse {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  progress: number;
}

export interface GoalRequest {
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
}

export interface CardResponse {
  id: string;
  accountId: string | null;
  name: string;
  brand: string;
  lastFour: string;
  creditLimit: number;
  usedLimit: number;
  availableLimit: number;
  dueDay: number;
  closingDay: number;
  blocked: boolean;
}

export interface CardRequest {
  accountId: string | null;
  name: string;
  brand: string;
  lastFour: string;
  creditLimit: number;
  dueDay: number;
  closingDay: number;
  blocked: boolean;
}

export interface InvoiceResponse {
  cardId: string;
  month: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  total: number;
  transactions: TransactionResponse[];
}

export interface RecurrenceResponse {
  id: string;
  accountId: string | null;
  description: string;
  category: string;
  transactionType: TransactionType;
  amount: number;
  dayOfMonth: number;
  active: boolean;
}

export interface RecurrenceRequest {
  accountId: string | null;
  description: string;
  category: string;
  transactionType: TransactionType;
  amount: number;
  dayOfMonth: number;
  active: boolean;
}

export interface FlowEvent {
  type: 'RECEITA' | 'DESPESA' | 'FATURA';
  label: string;
  amount: number;
}

export interface DailyPoint {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
  events: FlowEvent[];
}

export interface CardProvision {
  cardId: string;
  name: string;
  creditLimit: number;
  usedLimit: number;
  availableLimit: number;
  nextDueDate: string | null;
  nextInvoiceTotal: number;
}

export interface CashFlowResponse {
  startBalance: number;
  startDate: string;
  endDate: string;
  days: DailyPoint[];
  minBalance: { date: string; balance: number };
  cards: CardProvision[];
}

export interface UserProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  monthlySummary: boolean;
  lowBalanceAlert: boolean;
  securityAlert: boolean;
  theme: string;
}

export interface UserProfileUpdateRequest {
  fullName: string;
  email: string;
  monthlySummary: boolean;
  lowBalanceAlert: boolean;
  securityAlert: boolean;
  theme: string;
}

export interface MonthlyReportItem {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryReportItem {
  category: string;
  total: number;
}

export interface DashboardSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingCount: number;
  completedCount: number;
  monthlySeries: MonthlyReportItem[];
}

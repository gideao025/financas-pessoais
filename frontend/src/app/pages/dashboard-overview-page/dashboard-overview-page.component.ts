import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf, PercentPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import type {
  DashboardSummaryResponse,
  GoalResponse,
  MonthlyReportItem,
  TransactionResponse
} from '../../core/models/api.models';
import { GoalsService } from '../../core/services/goals.service';
import { ReportsService } from '../../core/services/reports.service';
import { TransactionsService } from '../../core/services/transactions.service';

interface SummaryCard {
  id: string;
  titulo: string;
  valor: number;
  variacao: number;
  icone: string;
}

interface MonthlyPoint {
  mes: string;
  receita: number;
  despesa: number;
}

interface UiTransaction {
  id: string;
  descricao: string;
  categoria: string;
  data: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  status: 'concluida' | 'pendente';
}

@Component({
  selector: 'app-dashboard-overview-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, PercentPipe, DatePipe],
  templateUrl: './dashboard-overview-page.component.html',
  styleUrl: './dashboard-overview-page.component.scss'
})
export class DashboardOverviewPageComponent implements OnInit {
  private readonly transactionsService = inject(TransactionsService);
  private readonly goalsService = inject(GoalsService);
  private readonly reportsService = inject(ReportsService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly limite = signal(4);
  protected readonly resumo = signal<DashboardSummaryResponse | null>(null);
  protected readonly transacoes = signal<UiTransaction[]>([]);
  protected readonly metas = signal<GoalResponse[]>([]);

  protected readonly cards = computed<SummaryCard[]>(() => {
    const resumo = this.resumo();
    if (!resumo) {
      return [];
    }

    return [
      {
        id: 'saldo',
        titulo: 'Saldo total',
        valor: resumo.balance,
        variacao: 0,
        icone: 'account_balance_wallet'
      },
      {
        id: 'receita',
        titulo: 'Receitas do mês',
        valor: resumo.totalIncome,
        variacao: 0,
        icone: 'trending_up'
      },
      {
        id: 'despesa',
        titulo: 'Despesas do mês',
        valor: resumo.totalExpense,
        variacao: 0,
        icone: 'trending_down'
      }
    ];
  });

  protected readonly totalEntradas = computed(() => this.resumo()?.totalIncome ?? 0);
  protected readonly totalSaidas = computed(() => this.resumo()?.totalExpense ?? 0);
  protected readonly pendentes = computed(() => this.resumo()?.pendingCount ?? 0);
  protected readonly concluidas = computed(() => this.resumo()?.completedCount ?? 0);
  protected readonly transacoesRecentes = computed(() => this.transacoes().slice(0, this.limite()));
  protected readonly metasResumo = computed(() =>
    this.metas()
      .map((meta) => ({ nome: meta.name, progresso: meta.progress }))
      .slice(0, 3)
  );

  protected readonly gastosPorCategoria = computed(() => {
    const mapa = new Map<string, number>();
    for (const t of this.transacoes()) {
      if (t.tipo !== 'saida') continue;
      mapa.set(t.categoria, (mapa.get(t.categoria) ?? 0) + t.valor);
    }
    const total = Array.from(mapa.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(mapa.entries())
      .map(([categoria, totalCategoria]) => ({
        categoria,
        total: totalCategoria,
        porcentagem: Math.round((totalCategoria / total) * 100)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  });

  protected readonly donutBackground = computed(() => {
    const categorias = this.gastosPorCategoria();
    if (!categorias.length) {
      return '#e2e8f0';
    }

    const cores = ['#1e40af', '#475569', '#94a3b8'];
    let inicio = 0;
    const partes: string[] = [];

    categorias.forEach((item, idx) => {
      const fim = inicio + item.porcentagem;
      partes.push(`${cores[idx]} ${inicio}% ${fim}%`);
      inicio = fim;
    });

    if (inicio < 100) {
      partes.push(`#e2e8f0 ${inicio}% 100%`);
    }

    return `conic-gradient(${partes.join(',')})`;
  });

  protected readonly serie6m = computed<MonthlyPoint[]>(() =>
    (this.resumo()?.monthlySeries ?? []).map((item: MonthlyReportItem) => ({
      mes: item.month,
      receita: item.income,
      despesa: item.expense
    }))
  );

  protected readonly maiorValor6m = computed(() => {
    const valores = this.serie6m().flatMap((p) => [p.receita, p.despesa]);
    return Math.max(...valores, 1);
  });
  protected readonly hoverIndex6m = signal<number | null>(null);
  protected readonly hovered6m = computed(() => {
    const idx = this.hoverIndex6m();
    if (idx === null) return null;
    const pontos = this.serie6m();
    if (idx < 0 || idx >= pontos.length) return null;
    return { idx, ponto: pontos[idx] };
  });
  protected readonly hoverX6m = computed(() => {
    const data = this.hovered6m();
    if (!data) return 0;
    return data.idx * 16 + 10;
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  protected carregarMais(): void {
    this.limite.update((valor) => Math.min(valor + 2, this.transacoes().length));
  }

  protected recarregar(): void {
    this.carregarDados();
  }

  private carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');

    forkJoin({
      resumo: this.reportsService.dashboardSummary(),
      metas: this.goalsService.list(),
      transacoes: this.transactionsService.list()
    }).subscribe({
      next: ({ resumo, metas, transacoes }) => {
        this.resumo.set(resumo);
        this.metas.set(metas);
        this.transacoes.set(transacoes.map((item) => this.mapTransaction(item)));
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar o dashboard.');
      }
    });
  }

  private mapTransaction(item: TransactionResponse): UiTransaction {
    return {
      id: item.id,
      descricao: item.description,
      categoria: item.category,
      data: item.transactionDate,
      valor: item.amount,
      tipo: item.transactionType === 'ENTRADA' ? 'entrada' : 'saida',
      status: item.status === 'CONCLUIDA' ? 'concluida' : 'pendente'
    };
  }
}

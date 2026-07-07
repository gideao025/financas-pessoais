import { CurrencyPipe, NgClass, NgFor, NgIf, PercentPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import type {
  CategoryReportItem,
  DashboardSummaryResponse,
  MonthlyReportItem
} from '../../core/models/api.models';
import { ReportsService } from '../../core/services/reports.service';

interface MonthlyPoint {
  mes: string;
  receita: number;
  despesa: number;
}

@Component({
  selector: 'app-reports-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, PercentPipe],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss'
})
export class ReportsPageComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly periodo = signal<'3m' | '6m' | '12m'>('6m');
  protected readonly resumo = signal<DashboardSummaryResponse | null>(null);
  protected readonly categorias = signal<CategoryReportItem[]>([]);

  protected readonly maiorCategoria = computed(() =>
    Math.max(...this.categorias().map((c) => c.total), 1)
  );

  protected readonly todaSerie = computed<MonthlyPoint[]>(() =>
    (this.resumo()?.monthlySeries ?? []).map((item: MonthlyReportItem) => ({
      mes: item.month,
      receita: item.income,
      despesa: item.expense
    }))
  );

  protected readonly serie = computed<MonthlyPoint[]>(() => {
    const todos = this.todaSerie();
    if (this.periodo() === '3m') return todos.slice(-3);
    return todos;
  });

  protected readonly patrimonio = computed(() => this.resumo()?.balance ?? 0);
  protected readonly totalEntradas = computed(() => this.resumo()?.totalIncome ?? 0);
  protected readonly totalSaidas = computed(() => this.resumo()?.totalExpense ?? 0);
  protected readonly pendentes = computed(() => this.resumo()?.pendingCount ?? 0);
  protected readonly concluidas = computed(() => this.resumo()?.completedCount ?? 0);

  protected readonly variacaoMensal = computed(() => {
    const serie = this.todaSerie();
    if (!serie.length) return 0;
    const ultimo = serie[serie.length - 1];
    return ultimo.receita - ultimo.despesa;
  });

  protected readonly maiorValor = computed(() => {
    const valores = this.serie().flatMap((ponto) => [ponto.receita, ponto.despesa]);
    return Math.max(...valores, 1);
  });

  protected readonly totalReceitas = computed(() =>
    this.serie().reduce((acc, ponto) => acc + ponto.receita, 0)
  );

  protected readonly totalDespesas = computed(() =>
    this.serie().reduce((acc, ponto) => acc + ponto.despesa, 0)
  );

  protected readonly margem = computed(() => {
    const receita = this.totalReceitas();
    if (!receita) return 0;
    return (receita - this.totalDespesas()) / receita;
  });

  protected readonly patrimonioSerie = computed(() => {
    let acumulado = 0;
    return this.serie().map((ponto) => {
      acumulado += ponto.receita - ponto.despesa;
      return { mes: ponto.mes, valor: acumulado };
    });
  });

  protected readonly patrimonioMax = computed(() => {
    const valores = this.patrimonioSerie().map((p) => p.valor);
    return Math.max(...valores, 1);
  });

  protected readonly patrimonioPath = computed(() => {
    const dados = this.patrimonioSerie();
    if (!dados.length) return '';
    const max = this.patrimonioMax();
    const stepX = 100 / Math.max(dados.length - 1, 1);
    const pontos = dados.map((p, index) => {
      const x = index * stepX;
      const y = 38 - (p.valor / max) * 30;
      return `${x},${y}`;
    });
    return `M0,40 L${pontos.join(' L ')} L100,40 Z`;
  });

  protected readonly patrimonioLine = computed(() => {
    const dados = this.patrimonioSerie();
    if (!dados.length) return '';
    const max = this.patrimonioMax();
    const stepX = 100 / Math.max(dados.length - 1, 1);
    return dados
      .map((p, index) => {
        const x = index * stepX;
        const y = 38 - (p.valor / max) * 30;
        return `${x},${y}`;
      })
      .join(' ');
  });

  protected readonly hoverIndexMensal = signal<number | null>(null);

  ngOnInit(): void {
    this.reportsService.dashboardSummary().subscribe({
      next: (resumo) => {
        this.resumo.set(resumo);
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar os relatorios.');
      }
    });

    this.reportsService.byCategory().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: () => this.categorias.set([])
    });
  }
}

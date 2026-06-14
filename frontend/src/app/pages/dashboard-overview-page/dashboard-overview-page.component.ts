import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import type {
  CashFlowResponse,
  GoalResponse,
  TransactionResponse
} from '../../core/models/api.models';
import { GoalsService } from '../../core/services/goals.service';
import { ReportsService } from '../../core/services/reports.service';
import { TransactionsService } from '../../core/services/transactions.service';

interface UiTransaction {
  id: string;
  descricao: string;
  categoria: string;
  data: string;
  valor: number;
  tipo: 'entrada' | 'saida';
}

interface UiEvento {
  data: string;
  tipo: 'RECEITA' | 'DESPESA' | 'FATURA';
  label: string;
  valor: number;
}

@Component({
  selector: 'app-dashboard-overview-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, DatePipe],
  templateUrl: './dashboard-overview-page.component.html',
  styleUrl: './dashboard-overview-page.component.scss'
})
export class DashboardOverviewPageComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly goalsService = inject(GoalsService);
  private readonly transactionsService = inject(TransactionsService);

  protected readonly carregando = signal(true);
  protected readonly atualizandoGrafico = signal(false);
  protected readonly erro = signal('');
  protected readonly horizonte = signal(90);
  protected readonly fluxo = signal<CashFlowResponse | null>(null);
  protected readonly metas = signal<GoalResponse[]>([]);
  protected readonly transacoes = signal<UiTransaction[]>([]);

  protected readonly saldoHoje = computed(() => this.fluxo()?.startBalance ?? 0);
  protected readonly menorSaldo = computed(() => this.fluxo()?.minBalance ?? null);
  protected readonly saldoFinal = computed(() => {
    const dias = this.fluxo()?.days ?? [];
    return dias.length ? dias[dias.length - 1].balance : 0;
  });
  protected readonly entradasPrevistas = computed(() =>
    (this.fluxo()?.days ?? []).reduce((acc, d) => acc + d.inflow, 0)
  );
  protected readonly saidasPrevistas = computed(() =>
    (this.fluxo()?.days ?? []).reduce((acc, d) => acc + d.outflow, 0)
  );
  protected readonly cartoes = computed(() => this.fluxo()?.cards ?? []);

  protected readonly proximosEventos = computed<UiEvento[]>(() => {
    const eventos: UiEvento[] = [];
    for (const dia of this.fluxo()?.days ?? []) {
      for (const e of dia.events) {
        eventos.push({ data: dia.date, tipo: e.type, label: e.label, valor: e.amount });
      }
    }
    return eventos.slice(0, 12);
  });

  protected readonly metasResumo = computed(() =>
    this.metas()
      .map((meta) => ({ nome: meta.name, progresso: meta.progress }))
      .slice(0, 3)
  );
  protected readonly transacoesRecentes = computed(() => this.transacoes().slice(0, 5));

  /** Geometria do gráfico de projeção (SVG viewBox 0..100 x 0..40). */
  protected readonly grafico = computed(() => {
    const dias = this.fluxo()?.days ?? [];
    if (!dias.length) {
      return null;
    }
    const saldos = dias.map((d) => d.balance);
    const max = Math.max(...saldos, 0);
    const min = Math.min(...saldos, 0);
    const range = max - min || 1;
    const n = dias.length;
    const x = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * 100);
    const y = (v: number) => 38 - ((v - min) / range) * 34;

    const pontos = dias.map((d, i) => `${x(i).toFixed(2)},${y(d.balance).toFixed(2)}`);
    const area = `M0,40 L${pontos.join(' L ')} L100,40 Z`;
    const linha = pontos.join(' ');
    const zeroY = min < 0 ? y(0) : null;

    const marcadores = dias
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => d.events.length)
      .map(({ d, i }) => ({
        cx: x(i),
        cy: y(d.balance),
        positivo: d.inflow - d.outflow >= 0,
        titulo: d.events.map((e) => `${e.label}: ${e.amount}`).join(' | ')
      }));

    const menor = this.fluxo()?.minBalance;
    const idxMenor = menor ? dias.findIndex((d) => d.date === menor.date) : -1;
    const pontoMenor = idxMenor >= 0 ? { cx: x(idxMenor), cy: y(dias[idxMenor].balance) } : null;

    return { area, linha, zeroY, marcadores, pontoMenor };
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  protected recarregar(): void {
    this.carregarDados();
  }

  protected trocarHorizonte(dias: number): void {
    if (dias === this.horizonte()) {
      return;
    }
    this.horizonte.set(dias);
    this.atualizandoGrafico.set(true);
    this.reportsService.cashFlow(dias).subscribe({
      next: (fluxo) => {
        this.fluxo.set(fluxo);
        this.atualizandoGrafico.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.atualizandoGrafico.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel atualizar a projecao.');
      }
    });
  }

  private carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');

    forkJoin({
      fluxo: this.reportsService.cashFlow(this.horizonte()),
      metas: this.goalsService.list(),
      transacoes: this.transactionsService.list()
    }).subscribe({
      next: ({ fluxo, metas, transacoes }) => {
        this.fluxo.set(fluxo);
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
      tipo: item.transactionType === 'ENTRADA' ? 'entrada' : 'saida'
    };
  }
}

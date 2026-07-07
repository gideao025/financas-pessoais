import { CurrencyPipe, DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
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
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, DatePipe, DecimalPipe],
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
  protected readonly horizonte = signal(60);
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
        const valor = e.type === 'RECEITA' ? e.amount : -e.amount;
        eventos.push({ data: dia.date, tipo: e.type, label: e.label, valor });
      }
    }
    return eventos.slice(0, 5);
  });

  protected readonly metasResumo = computed(() =>
    this.metas()
      .map((meta) => ({
        nome: meta.name,
        progresso: meta.progress,
        atual: meta.currentAmount,
        alvo: meta.targetAmount
      }))
      .slice(0, 3)
  );

  /** Geometria do gráfico de projeção em coordenadas de pixel (viewBox 780x292). */
  protected readonly grafico = computed(() => {
    const dias = this.fluxo()?.days ?? [];
    if (!dias.length) {
      return null;
    }

    const W = 780;
    const H = 292;
    const padL = 44;
    const padT = 14;
    const padR = 16;
    const padB = 46;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const yTop = 6;
    const yBot = plotH - 8;

    const saldos = dias.map((d) => d.balance);
    const max = Math.max(...saldos, 0);
    const min = Math.min(...saldos, 0);
    const range = max - min || 1;
    const n = dias.length;

    const x = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * plotW);
    const y = (v: number) => yTop + (1 - (v - min) / range) * (yBot - yTop);

    const pts = dias.map((d, i) => ({ x: x(i), y: y(d.balance) }));
    const linha = this.suavizar(pts);
    const area = `${linha} L${plotW.toFixed(1)},${plotH} L0,${plotH} Z`;

    const zeroY = min < 0 ? y(0) : null;

    const hoje = { x: pts[0].x, y: pts[0].y, label: `Hoje · ${this.fmtBRL(saldos[0])}` };

    const menorInfo = this.fluxo()?.minBalance;
    const idxMenor = menorInfo ? dias.findIndex((d) => d.date === menorInfo.date) : -1;
    const menor =
      idxMenor >= 0
        ? {
            x: x(idxMenor),
            y: y(dias[idxMenor].balance),
            labelX: Math.min(Math.max(x(idxMenor), 64), plotW - 64),
            texto: `${this.fmtBRL(dias[idxMenor].balance)} · ${this.fmtDia(dias[idxMenor].date)}`,
            negativo: dias[idxMenor].balance < 0
          }
        : null;

    // Gradiente da linha: fica vermelho no trecho do menor saldo (como no protótipo).
    const f = idxMenor >= 0 && n > 1 ? idxMenor / (n - 1) : 0.6;
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const stops = [
      { offset: 0, color: '#c9b6ff' },
      { offset: clamp01(f - 0.08), color: '#a78bfa' },
      { offset: clamp01(f), color: '#fb7185' },
      { offset: clamp01(f + 0.08), color: '#a78bfa' },
      { offset: 1, color: '#8b5cf6' }
    ];

    const yLabels = [
      { y: y(max), text: this.fmtK(max) },
      ...(zeroY !== null ? [{ y: zeroY, text: 'R$ 0', zero: true }] : [])
    ];

    const idxMid = Math.floor((n - 1) / 2);
    const xTicks = [
      { x: 0, text: this.fmtDia(dias[0].date), anchor: 'start' },
      { x: x(idxMid), text: this.fmtDia(dias[idxMid].date), anchor: 'middle' },
      { x: plotW, text: this.fmtDia(dias[n - 1].date), anchor: 'end' }
    ];

    return { W, H, padL, padT, plotW, plotH, linha, area, zeroY, hoje, menor, yLabels, xTicks, stops };
  });

  /** Spline cúbica monotônica (Fritsch–Carlson) → curva suave sem overshoot, como no protótipo. */
  private suavizar(pts: { x: number; y: number }[]): string {
    const n = pts.length;
    if (n === 0) {
      return '';
    }
    if (n < 3) {
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    }

    const dx: number[] = [];
    const slope: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const h = pts[i + 1].x - pts[i].x || 1;
      dx.push(h);
      slope.push((pts[i + 1].y - pts[i].y) / h);
    }

    const m: number[] = new Array(n);
    m[0] = slope[0];
    m[n - 1] = slope[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (slope[i - 1] * slope[i] <= 0) {
        m[i] = 0;
      } else {
        m[i] = (slope[i - 1] + slope[i]) / 2;
      }
    }
    for (let i = 0; i < n - 1; i++) {
      if (slope[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const a = m[i] / slope[i];
      const b = m[i + 1] / slope[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * slope[i];
        m[i + 1] = t * b * slope[i];
      }
    }

    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i];
      const c1x = pts[i].x + h / 3;
      const c1y = pts[i].y + (m[i] * h) / 3;
      const c2x = pts[i + 1].x - h / 3;
      const c2y = pts[i + 1].y - (m[i + 1] * h) / 3;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`;
    }
    return d;
  }

  private fmtBRL(v: number): string {
    const s = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.abs(v));
    return `${v < 0 ? '−' : ''}R$ ${s}`;
  }

  private fmtK(v: number): string {
    if (Math.abs(v) >= 1000) {
      return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
    }
    return `${Math.round(v)}`;
  }

  private fmtDia(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

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

  // ===== Formatação dos KPIs =====
  protected parteReais(v: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.trunc(Math.abs(v)));
  }

  protected parteCentavos(v: number): string {
    return String(Math.round((Math.abs(v) % 1) * 100)).padStart(2, '0');
  }
}

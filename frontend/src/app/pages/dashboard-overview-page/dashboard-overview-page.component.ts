import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf, PercentPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { goalsSignal, monthlyDataMock, summaryCardsMock, type Goal, type MonthlyPoint, type SummaryCard, transactionsMock, type Transaction } from '../../mocks/finance.mock';

@Component({
  selector: 'app-dashboard-overview-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, PercentPipe, DatePipe],
  templateUrl: './dashboard-overview-page.component.html',
  styleUrl: './dashboard-overview-page.component.scss'
})
export class DashboardOverviewPageComponent {
  protected readonly cards: SummaryCard[] = summaryCardsMock;
  protected readonly limite = signal(4);
  protected readonly transacoes = signal<Transaction[]>(transactionsMock);

  protected readonly totalEntradas = computed(() =>
    this.transacoes()
      .filter((item) => item.tipo === 'entrada')
      .reduce((acc, item) => acc + item.valor, 0)
  );

  protected readonly totalSaidas = computed(() =>
    this.transacoes()
      .filter((item) => item.tipo === 'saida')
      .reduce((acc, item) => acc + item.valor, 0)
  );

  protected readonly transacoesRecentes = computed(() => this.transacoes().slice(0, this.limite()));
  protected readonly pendentes = computed(
    () => this.transacoes().filter((item) => item.status === 'pendente').length
  );
  protected readonly concluidas = computed(
    () => this.transacoes().filter((item) => item.status === 'concluida').length
  );
  protected readonly metas = goalsSignal;
  protected readonly metasResumo = computed(() =>
    this.metas()
      .map((meta: Goal) => ({
        nome: meta.nome,
        progresso: Math.round((meta.atual / Math.max(meta.alvo, 1)) * 100)
      }))
      .slice(0, 3)
  );

  protected readonly gastosPorCategoria = computed(() => {
    const mapa = new Map<string, number>();
    for (const t of this.transacoes()) {
      if (t.tipo !== 'saida') continue;
      mapa.set(t.categoria, (mapa.get(t.categoria) ?? 0) + t.valor);
    }
    const total = Array.from(mapa.values()).reduce((a, b) => a + b, 0) || 1;
    const lista = Array.from(mapa.entries())
      .map(([categoria, totalCategoria]) => ({
        categoria,
        total: totalCategoria,
        porcentagem: Math.round((totalCategoria / total) * 100)
      }))
      .sort((a, b) => b.total - a.total);
    return lista.slice(0, 3);
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

  protected readonly serie6m = computed<MonthlyPoint[]>(() => monthlyDataMock['6m']);
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

  protected carregarMais(): void {
    this.limite.update((valor) => Math.min(valor + 2, this.transacoes().length));
  }
}

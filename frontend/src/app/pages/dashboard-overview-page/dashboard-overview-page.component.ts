import { CurrencyPipe, DatePipe, NgClass, NgFor, PercentPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { summaryCardsMock, transactionsMock, type SummaryCard, type Transaction } from '../../mocks/finance.mock';

interface MetaFinanceira {
  nome: string;
  progresso: number;
}

@Component({
  selector: 'app-dashboard-overview-page',
  imports: [NgFor, NgClass, CurrencyPipe, PercentPipe, DatePipe],
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
  protected readonly metas: MetaFinanceira[] = [
    { nome: 'Reserva de Emergência', progresso: 82 },
    { nome: 'Casa Própria', progresso: 12 },
    { nome: 'Viagem de Férias', progresso: 45 }
  ];

  protected carregarMais(): void {
    this.limite.update((valor) => Math.min(valor + 2, this.transacoes().length));
  }
}

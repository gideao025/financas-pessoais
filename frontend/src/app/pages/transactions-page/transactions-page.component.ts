import { CurrencyPipe, DatePipe, NgClass, NgFor } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { transactionsMock, type Transaction, type TransactionStatus, type TransactionType } from '../../mocks/finance.mock';

@Component({
  selector: 'app-transactions-page',
  imports: [NgFor, NgClass, CurrencyPipe, DatePipe],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss'
})
export class TransactionsPageComponent {
  protected readonly transacoes = signal<Transaction[]>(transactionsMock);
  protected readonly busca = signal('');
  protected readonly tipoSelecionado = signal<'todos' | TransactionType>('todos');
  protected readonly statusSelecionado = signal<'todos' | TransactionStatus>('todos');

  protected readonly filtradas = computed(() =>
    this.transacoes().filter((item) => {
      const bateBusca =
        item.descricao.toLowerCase().includes(this.busca().toLowerCase()) ||
        item.categoria.toLowerCase().includes(this.busca().toLowerCase());
      const bateTipo = this.tipoSelecionado() === 'todos' || item.tipo === this.tipoSelecionado();
      const bateStatus = this.statusSelecionado() === 'todos' || item.status === this.statusSelecionado();
      return bateBusca && bateTipo && bateStatus;
    })
  );

  protected adicionarMock(): void {
    const nova: Transaction = {
      id: `tx-${Date.now()}`,
      descricao: 'Reembolso corporativo',
      categoria: 'Renda Extra',
      conta: 'Nubank',
      data: '2026-02-17',
      valor: 320,
      tipo: 'entrada',
      status: 'pendente'
    };

    this.transacoes.update((itens) => [nova, ...itens]);
  }
}

import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { transactionsMock, type Transaction, type TransactionStatus, type TransactionType } from '../../mocks/finance.mock';

@Component({
  selector: 'app-transactions-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, DatePipe],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss'
})
export class TransactionsPageComponent {
  protected readonly transacoes = signal<Transaction[]>(transactionsMock);
  protected readonly busca = signal('');
  protected readonly tipoSelecionado = signal<'todos' | TransactionType>('todos');
  protected readonly statusSelecionado = signal<'todos' | TransactionStatus>('todos');
  protected readonly periodoSelecionado = signal<'esteMes' | 'todos'>('esteMes');
  protected readonly categoriaSelecionada = signal<'todas' | string>('todas');
  protected readonly contaSelecionada = signal<'todas' | string>('todas');

  protected readonly filtradas = computed(() =>
    this.transacoes().filter((item) => {
      const dataObj = new Date(item.data);
      const agora = new Date();
      const mesmoMes =
        dataObj.getFullYear() === agora.getFullYear() && dataObj.getMonth() === agora.getMonth();
      const bateBusca =
        item.descricao.toLowerCase().includes(this.busca().toLowerCase()) ||
        item.categoria.toLowerCase().includes(this.busca().toLowerCase());
      const bateTipo = this.tipoSelecionado() === 'todos' || item.tipo === this.tipoSelecionado();
      const bateStatus = this.statusSelecionado() === 'todos' || item.status === this.statusSelecionado();
      const batePeriodo = this.periodoSelecionado() === 'todos' || mesmoMes;
      const bateCategoria = this.categoriaSelecionada() === 'todas' || item.categoria === this.categoriaSelecionada();
      const bateConta = this.contaSelecionada() === 'todas' || item.conta === this.contaSelecionada();
      return bateBusca && bateTipo && bateStatus && batePeriodo && bateCategoria && bateConta;
    })
  );

  protected readonly categoriasDisponiveis = computed(() => {
    return Array.from(new Set(this.transacoes().map((t) => t.categoria)));
  });

  protected readonly contasDisponiveis = computed(() => {
    return Array.from(new Set(this.transacoes().map((t) => t.conta)));
  });

  protected readonly pageSize = signal(5);
  protected readonly pageIndex = signal(1);
  protected readonly totalFiltradas = computed(() => this.filtradas().length);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltradas() / this.pageSize()))
  );
  protected readonly pagina = computed(() => {
    const start = (this.pageIndex() - 1) * this.pageSize();
    return this.filtradas().slice(start, start + this.pageSize());
  });
  protected readonly inicioExibido = computed(() => (this.pageIndex() - 1) * this.pageSize() + 1);
  protected readonly fimExibido = computed(() =>
    Math.min(this.pageIndex() * this.pageSize(), this.totalFiltradas())
  );

  protected setPage(n: number): void {
    const alvo = Math.max(1, Math.min(n, this.totalPages()));
    this.pageIndex.set(alvo);
  }
  protected proxPagina(): void {
    this.setPage(this.pageIndex() + 1);
  }
  protected antPagina(): void {
    this.setPage(this.pageIndex() - 1);
  }
  protected atualizarPageSize(event: Event): void {
    const valor = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(valor);
    this.pageIndex.set(1);
  }

  protected readonly painelAberto = signal(false);
  protected readonly formValor = signal<string>('');
  protected readonly formTipo = signal<TransactionType>('saida');
  protected readonly formData = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly formDescricao = signal<string>('');
  protected readonly formCategoria = signal<string>('Alimentação');
  protected readonly formConta = signal<string>('Nubank');

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

  protected salvarTransacao(): void {
    const valorNum = Number(this.formValor().replace(',', '.'));
    if (!this.formDescricao() || !valorNum || !this.formCategoria() || !this.formConta()) {
      return;
    }
    const nova: Transaction = {
      id: `tx-${Date.now()}`,
      descricao: this.formDescricao(),
      categoria: this.formCategoria(),
      conta: this.formConta(),
      data: this.formData(),
      valor: valorNum,
      tipo: this.formTipo(),
      status: 'concluida'
    };
    this.transacoes.update((itens) => [nova, ...itens]);
    this.painelAberto.set(false);
    this.formValor.set('');
    this.formDescricao.set('');
  }
}

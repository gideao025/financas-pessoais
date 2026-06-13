import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import type {
  AccountResponse,
  AccountType,
  TransactionResponse,
  TransactionStatus,
  TransactionType
} from '../../core/models/api.models';
import { AccountsService } from '../../core/services/accounts.service';
import { TransactionsService } from '../../core/services/transactions.service';

interface UiTransaction {
  id: string;
  descricao: string;
  categoria: string;
  conta: string;
  contaId: string | null;
  data: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  status: 'concluida' | 'pendente';
}

@Component({
  selector: 'app-transactions-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, DatePipe],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss'
})
export class TransactionsPageComponent implements OnInit {
  private readonly accountsService = inject(AccountsService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly categoriasPadrao = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Renda'];

  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly transacoes = signal<UiTransaction[]>([]);
  protected readonly contas = signal<AccountResponse[]>([]);
  protected readonly busca = signal('');
  protected readonly tipoSelecionado = signal<'todos' | 'entrada' | 'saida'>('todos');
  protected readonly statusSelecionado = signal<'todos' | 'concluida' | 'pendente'>('todos');
  protected readonly periodoSelecionado = signal<'esteMes' | 'todos'>('todos');
  protected readonly categoriaSelecionada = signal<'todas' | string>('todas');
  protected readonly contaSelecionada = signal<'todas' | string>('todas');
  protected readonly pageSize = signal(5);
  protected readonly pageIndex = signal(1);
  protected readonly painelAberto = signal(false);

  protected readonly formValor = signal('');
  protected readonly formTipo = signal<'entrada' | 'saida'>('saida');
  protected readonly formStatus = signal<'concluida' | 'pendente'>('concluida');
  protected readonly formData = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly formDescricao = signal('');
  protected readonly formCategoria = signal('Alimentação');
  protected readonly formContaId = signal('');

  protected readonly contaNome = signal('');
  protected readonly contaInstituicao = signal('');
  protected readonly contaSaldo = signal('0');
  protected readonly contaTipo = signal<AccountType>('CHECKING');

  protected readonly filtradas = computed(() =>
    this.transacoes().filter((item) => {
      const dataObj = new Date(item.data);
      const agora = new Date();
      const mesmoMes =
        dataObj.getFullYear() === agora.getFullYear() && dataObj.getMonth() === agora.getMonth();
      const termoBusca = this.busca().toLowerCase();
      const bateBusca =
        item.descricao.toLowerCase().includes(termoBusca) ||
        item.categoria.toLowerCase().includes(termoBusca) ||
        item.conta.toLowerCase().includes(termoBusca);
      const bateTipo = this.tipoSelecionado() === 'todos' || item.tipo === this.tipoSelecionado();
      const bateStatus =
        this.statusSelecionado() === 'todos' || item.status === this.statusSelecionado();
      const batePeriodo = this.periodoSelecionado() === 'todos' || mesmoMes;
      const bateCategoria =
        this.categoriaSelecionada() === 'todas' || item.categoria === this.categoriaSelecionada();
      const bateConta = this.contaSelecionada() === 'todas' || item.conta === this.contaSelecionada();
      return bateBusca && bateTipo && bateStatus && batePeriodo && bateCategoria && bateConta;
    })
  );

  protected readonly categoriasDisponiveis = computed(() => {
    const categorias = Array.from(new Set(this.transacoes().map((t) => t.categoria)));
    return categorias.length ? categorias : this.categoriasPadrao;
  });

  protected readonly totalFiltradas = computed(() => this.filtradas().length);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltradas() / this.pageSize()))
  );
  protected readonly pageButtons = computed(() =>
    Array.from({ length: Math.min(3, this.totalPages()) }, (_, index) => index + 1)
  );
  protected readonly pagina = computed(() => {
    const start = (this.pageIndex() - 1) * this.pageSize();
    return this.filtradas().slice(start, start + this.pageSize());
  });
  protected readonly inicioExibido = computed(() =>
    this.totalFiltradas() ? (this.pageIndex() - 1) * this.pageSize() + 1 : 0
  );
  protected readonly fimExibido = computed(() =>
    Math.min(this.pageIndex() * this.pageSize(), this.totalFiltradas())
  );

  ngOnInit(): void {
    this.carregarDados();
  }

  protected carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');

    forkJoin({
      contas: this.accountsService.list(),
      transacoes: this.transactionsService.list()
    }).subscribe({
      next: ({ contas, transacoes }) => {
        this.contas.set(contas);
        this.transacoes.set(transacoes.map((item) => this.mapTransaction(item, contas)));
        this.formContaId.set(contas[0]?.id ?? '');
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar as transacoes.');
      }
    });
  }

  protected setPage(n: number): void {
    this.pageIndex.set(Math.max(1, Math.min(n, this.totalPages())));
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

  protected salvarTransacao(): void {
    const amount = Number(this.formValor().replace(',', '.'));
    if (!this.formDescricao().trim() || !amount || !this.formCategoria().trim() || !this.formContaId()) {
      this.erro.set('Preencha os dados da transacao e selecione uma conta.');
      return;
    }

    this.erro.set('');

    const transactionType: TransactionType = this.formTipo() === 'entrada' ? 'ENTRADA' : 'SAIDA';
    const status: TransactionStatus = this.formStatus() === 'concluida' ? 'CONCLUIDA' : 'PENDENTE';

    this.transactionsService
      .create({
        accountId: this.formContaId(),
        cardId: null,
        description: this.formDescricao().trim(),
        category: this.formCategoria().trim(),
        transactionType,
        status,
        amount,
        transactionDate: this.formData()
      })
      .subscribe({
        next: (response) => {
          const contas = this.contas();
          this.transacoes.update((itens) => [this.mapTransaction(response, contas), ...itens]);
          this.painelAberto.set(false);
          this.formValor.set('');
          this.formDescricao.set('');
          this.formStatus.set('concluida');
          this.pageIndex.set(1);
          this.mensagem.set('Transacao salva com sucesso.');
        },
        error: (error: { error?: { message?: string } }) => {
          this.erro.set(error.error?.message ?? 'Nao foi possivel salvar a transacao.');
        }
      });
  }

  protected criarConta(): void {
    const balance = Number(this.contaSaldo().replace(',', '.'));
    if (!this.contaNome().trim() || !this.contaInstituicao().trim() || Number.isNaN(balance)) {
      this.erro.set('Preencha os dados da conta antes de continuar.');
      return;
    }

    this.accountsService
      .create({
        name: this.contaNome().trim(),
        institution: this.contaInstituicao().trim(),
        balance,
        type: this.contaTipo(),
        active: true
      })
      .subscribe({
        next: (conta) => {
          this.contas.update((lista) => [conta, ...lista]);
          this.formContaId.set(conta.id);
          this.contaNome.set('');
          this.contaInstituicao.set('');
          this.contaSaldo.set('0');
          this.contaTipo.set('CHECKING');
          this.mensagem.set('Conta criada. Agora voce ja pode lancar transacoes.');
          this.erro.set('');
        },
        error: (error: { error?: { message?: string } }) => {
          this.erro.set(error.error?.message ?? 'Nao foi possivel criar a conta.');
        }
      });
  }

  protected limparMensagens(): void {
    this.erro.set('');
    this.mensagem.set('');
  }

  private mapTransaction(item: TransactionResponse, contas: AccountResponse[]): UiTransaction {
    const conta = contas.find((current) => current.id === item.accountId);

    return {
      id: item.id,
      descricao: item.description,
      categoria: item.category,
      conta: conta?.name ?? 'Conta removida',
      contaId: item.accountId,
      data: item.transactionDate,
      valor: item.amount,
      tipo: item.transactionType === 'ENTRADA' ? 'entrada' : 'saida',
      status: item.status === 'CONCLUIDA' ? 'concluida' : 'pendente'
    };
  }
}

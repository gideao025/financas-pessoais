import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import type {
  AccountResponse,
  RecurrenceResponse,
  TransactionType
} from '../../core/models/api.models';
import { AccountsService } from '../../core/services/accounts.service';
import { RecurrencesService } from '../../core/services/recurrences.service';

@Component({
  selector: 'app-recurrences-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe],
  templateUrl: './recurrences-page.component.html',
  styleUrl: './recurrences-page.component.scss'
})
export class RecurrencesPageComponent implements OnInit {
  private readonly recurrencesService = inject(RecurrencesService);
  private readonly accountsService = inject(AccountsService);

  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly recorrencias = signal<RecurrenceResponse[]>([]);
  protected readonly contas = signal<AccountResponse[]>([]);
  protected readonly painelAberto = signal(false);
  protected readonly editandoId = signal<string | null>(null);

  protected readonly formDescricao = signal('');
  protected readonly formTipo = signal<TransactionType>('ENTRADA');
  protected readonly formValor = signal('');
  protected readonly formDia = signal('5');
  protected readonly formCategoria = signal('');
  protected readonly formContaId = signal('');

  protected readonly totalReceitas = computed(() =>
    this.recorrencias()
      .filter((r) => r.active && r.transactionType === 'ENTRADA')
      .reduce((acc, r) => acc + r.amount, 0)
  );
  protected readonly totalDespesas = computed(() =>
    this.recorrencias()
      .filter((r) => r.active && r.transactionType === 'SAIDA')
      .reduce((acc, r) => acc + r.amount, 0)
  );

  ngOnInit(): void {
    this.carregarDados();
  }

  protected carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');
    forkJoin({
      recorrencias: this.recurrencesService.list(),
      contas: this.accountsService.list()
    }).subscribe({
      next: ({ recorrencias, contas }) => {
        this.recorrencias.set(recorrencias);
        this.contas.set(contas);
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar as recorrencias.');
      }
    });
  }

  protected nomeConta(id: string | null): string {
    return this.contas().find((c) => c.id === id)?.name ?? '—';
  }

  protected abrirNova(): void {
    this.editandoId.set(null);
    this.formDescricao.set('');
    this.formTipo.set('ENTRADA');
    this.formValor.set('');
    this.formDia.set('5');
    this.formCategoria.set('');
    this.formContaId.set(this.contas()[0]?.id ?? '');
    this.erro.set('');
    this.painelAberto.set(true);
  }

  protected abrirEdicao(r: RecurrenceResponse): void {
    this.editandoId.set(r.id);
    this.formDescricao.set(r.description);
    this.formTipo.set(r.transactionType);
    this.formValor.set(String(r.amount));
    this.formDia.set(String(r.dayOfMonth));
    this.formCategoria.set(r.category);
    this.formContaId.set(r.accountId ?? '');
    this.erro.set('');
    this.painelAberto.set(true);
  }

  protected fecharPainel(): void {
    this.painelAberto.set(false);
    this.editandoId.set(null);
    this.erro.set('');
  }

  protected salvar(): void {
    const amount = Number(this.formValor().replace(',', '.'));
    const dayOfMonth = Number(this.formDia());
    if (!this.formDescricao().trim() || !this.formCategoria().trim() || !amount || amount <= 0) {
      this.erro.set('Preencha descricao, categoria e um valor valido.');
      return;
    }
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
      this.erro.set('Informe um dia do mes entre 1 e 31.');
      return;
    }
    this.erro.set('');
    this.salvando.set(true);

    const payload = {
      accountId: this.formContaId() || null,
      description: this.formDescricao().trim(),
      category: this.formCategoria().trim(),
      transactionType: this.formTipo(),
      amount,
      dayOfMonth,
      active: true
    };

    const editId = this.editandoId();
    const requisicao = editId
      ? this.recurrencesService.update(editId, { ...payload, active: this.recorrenciaAtual(editId)?.active ?? true })
      : this.recurrencesService.create(payload);

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharPainel();
        this.mensagem.set(editId ? 'Recorrencia atualizada.' : 'Recorrencia criada.');
        setTimeout(() => this.mensagem.set(''), 2500);
        this.carregarDados();
      },
      error: (error: { error?: { message?: string } }) => {
        this.salvando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel salvar a recorrencia.');
      }
    });
  }

  protected alternarStatus(r: RecurrenceResponse): void {
    this.recurrencesService
      .update(r.id, {
        accountId: r.accountId,
        description: r.description,
        category: r.category,
        transactionType: r.transactionType,
        amount: r.amount,
        dayOfMonth: r.dayOfMonth,
        active: !r.active
      })
      .subscribe({
        next: (atualizada) => {
          this.recorrencias.update((lista) => lista.map((x) => (x.id === atualizada.id ? atualizada : x)));
        },
        error: (error: { error?: { message?: string } }) => {
          this.erro.set(error.error?.message ?? 'Nao foi possivel alterar o status.');
        }
      });
  }

  protected remover(r: RecurrenceResponse): void {
    this.recurrencesService.delete(r.id).subscribe({
      next: () => {
        this.recorrencias.update((lista) => lista.filter((x) => x.id !== r.id));
        this.mensagem.set('Recorrencia removida.');
        setTimeout(() => this.mensagem.set(''), 2500);
      },
      error: (error: { error?: { message?: string } }) => {
        this.erro.set(error.error?.message ?? 'Nao foi possivel remover a recorrencia.');
      }
    });
  }

  private recorrenciaAtual(id: string): RecurrenceResponse | undefined {
    return this.recorrencias().find((r) => r.id === id);
  }
}

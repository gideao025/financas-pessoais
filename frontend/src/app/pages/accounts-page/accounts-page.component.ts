import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import type { AccountResponse, AccountType } from '../../core/models/api.models';
import { AccountsService } from '../../core/services/accounts.service';

const TIPOS: { value: AccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Conta Corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'WALLET', label: 'Carteira' },
  { value: 'INVESTMENT', label: 'Investimento' }
];

@Component({
  selector: 'app-accounts-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe],
  templateUrl: './accounts-page.component.html',
  styleUrl: './accounts-page.component.scss'
})
export class AccountsPageComponent implements OnInit {
  private readonly accountsService = inject(AccountsService);

  protected readonly tipos = TIPOS;

  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly contas = signal<AccountResponse[]>([]);
  protected readonly painelAberto = signal(false);
  protected readonly contaEditando = signal<AccountResponse | null>(null);

  protected readonly formNome = signal('');
  protected readonly formTipo = signal<AccountType>('CHECKING');
  protected readonly formInstituicao = signal('');
  protected readonly formSaldo = signal('0');
  protected readonly formAtiva = signal(true);

  protected readonly saldoTotal = computed(() =>
    this.contas()
      .filter((c) => c.active)
      .reduce((acc, c) => acc + c.balance, 0)
  );
  protected readonly totalAtivas = computed(() => this.contas().filter((c) => c.active).length);

  ngOnInit(): void {
    this.carregarDados();
  }

  protected carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.accountsService.list().subscribe({
      next: (contas) => {
        this.contas.set(contas);
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar as contas.');
      }
    });
  }

  protected labelTipo(tipo: AccountType): string {
    return this.tipos.find((t) => t.value === tipo)?.label ?? tipo;
  }

  protected abrirNova(): void {
    this.contaEditando.set(null);
    this.formNome.set('');
    this.formTipo.set('CHECKING');
    this.formInstituicao.set('');
    this.formSaldo.set('0');
    this.formAtiva.set(true);
    this.erro.set('');
    this.painelAberto.set(true);
  }

  protected abrirEdicao(conta: AccountResponse): void {
    this.contaEditando.set(conta);
    this.formNome.set(conta.name);
    this.formTipo.set(conta.type);
    this.formInstituicao.set(conta.institution);
    this.formSaldo.set(String(conta.balance));
    this.formAtiva.set(conta.active);
    this.erro.set('');
    this.painelAberto.set(true);
  }

  protected fecharPainel(): void {
    this.painelAberto.set(false);
    this.contaEditando.set(null);
    this.erro.set('');
  }

  protected salvar(): void {
    const balance = Number(this.formSaldo().replace(',', '.'));
    if (!this.formNome().trim() || !this.formInstituicao().trim() || Number.isNaN(balance) || balance < 0) {
      this.erro.set('Preencha nome, instituicao e um saldo valido (nao negativo).');
      return;
    }
    this.erro.set('');
    this.salvando.set(true);

    const payload = {
      name: this.formNome().trim(),
      type: this.formTipo(),
      institution: this.formInstituicao().trim(),
      balance,
      active: this.formAtiva()
    };

    const editando = this.contaEditando();
    const requisicao = editando
      ? this.accountsService.update(editando.id, payload)
      : this.accountsService.create(payload);

    requisicao.subscribe({
      next: (conta) => {
        this.salvando.set(false);
        if (editando) {
          this.contas.update((lista) => lista.map((c) => (c.id === conta.id ? conta : c)));
          this.mensagem.set('Conta atualizada com sucesso.');
        } else {
          this.contas.update((lista) => [conta, ...lista]);
          this.mensagem.set('Conta criada com sucesso.');
        }
        this.fecharPainel();
        setTimeout(() => this.mensagem.set(''), 2500);
      },
      error: (error: { error?: { message?: string } }) => {
        this.salvando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel salvar a conta.');
      }
    });
  }

  protected alternarStatus(conta: AccountResponse): void {
    this.accountsService
      .update(conta.id, {
        name: conta.name,
        type: conta.type,
        institution: conta.institution,
        balance: conta.balance,
        active: !conta.active
      })
      .subscribe({
        next: (atualizada) => {
          this.contas.update((lista) => lista.map((c) => (c.id === atualizada.id ? atualizada : c)));
          this.mensagem.set(atualizada.active ? 'Conta ativada.' : 'Conta desativada.');
          setTimeout(() => this.mensagem.set(''), 2500);
        },
        error: (error: { error?: { message?: string } }) => {
          this.erro.set(error.error?.message ?? 'Nao foi possivel alterar o status da conta.');
        }
      });
  }
}

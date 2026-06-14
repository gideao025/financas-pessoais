import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { CardResponse, InvoiceResponse } from '../../core/models/api.models';
import { CardsService } from '../../core/services/cards.service';

@Component({
  selector: 'app-credit-cards-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, DatePipe],
  templateUrl: './credit-cards-page.component.html',
  styleUrl: './credit-cards-page.component.scss'
})
export class CreditCardsPageComponent implements OnInit {
  private readonly cardsService = inject(CardsService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly cartoes = signal<CardResponse[]>([]);
  protected readonly painelAberto = signal(false);
  protected readonly editandoId = signal<string | null>(null);

  protected readonly formNome = signal('');
  protected readonly formBandeira = signal('Mastercard');
  protected readonly formFinal = signal('');
  protected readonly formLimite = signal('');
  protected readonly formVencimento = signal('10');
  protected readonly formFechamento = signal('1');

  // fatura inline
  protected readonly faturaCartaoId = signal<string | null>(null);
  protected readonly faturaCarregando = signal(false);
  protected readonly fatura = signal<InvoiceResponse | null>(null);

  ngOnInit(): void {
    this.carregarDados();
  }

  protected carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.cardsService.list().subscribe({
      next: (lista) => {
        this.cartoes.set(lista);
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar os cartoes.');
      }
    });
  }

  protected novoCartao(): void {
    this.editandoId.set(null);
    this.formNome.set('');
    this.formBandeira.set('Mastercard');
    this.formFinal.set('');
    this.formLimite.set('');
    this.formVencimento.set('10');
    this.formFechamento.set('1');
    this.erro.set('');
    this.painelAberto.set(true);
  }

  protected editarCartao(card: CardResponse): void {
    this.editandoId.set(card.id);
    this.formNome.set(card.name);
    this.formBandeira.set(card.brand);
    this.formFinal.set(card.lastFour);
    this.formLimite.set(String(card.creditLimit));
    this.formVencimento.set(String(card.dueDay));
    this.formFechamento.set(String(card.closingDay));
    this.erro.set('');
    this.painelAberto.set(true);
  }

  protected fecharPainel(): void {
    this.painelAberto.set(false);
    this.editandoId.set(null);
    this.erro.set('');
  }

  protected salvarCartao(): void {
    const limite = Number(this.formLimite().replace(',', '.'));
    const vencimento = Number(this.formVencimento());
    const fechamento = Number(this.formFechamento());
    if (!this.formNome().trim() || !this.formFinal().trim() || !limite || !vencimento || !fechamento) {
      this.erro.set('Preencha todos os campos obrigatorios.');
      return;
    }
    if (!/^\d{4}$/.test(this.formFinal())) {
      this.erro.set('Informe exatamente 4 digitos finais do cartao.');
      return;
    }
    this.erro.set('');

    const payload = {
      accountId: null,
      name: this.formNome().trim(),
      brand: this.formBandeira(),
      lastFour: this.formFinal(),
      creditLimit: limite,
      dueDay: vencimento,
      closingDay: fechamento,
      blocked: false
    };

    const editId = this.editandoId();
    const request$ = editId
      ? this.cardsService.update(editId, payload)
      : this.cardsService.create(payload);

    request$.subscribe({
      next: () => {
        this.fecharPainel();
        this.mensagem.set(editId ? 'Cartao atualizado com sucesso.' : 'Cartao adicionado com sucesso.');
        setTimeout(() => this.mensagem.set(''), 2500);
        this.carregarDados();
      },
      error: (error: { error?: { message?: string } }) => {
        this.erro.set(error.error?.message ?? 'Nao foi possivel salvar o cartao.');
      }
    });
  }

  protected alternarBloqueio(id: string): void {
    this.cardsService.toggleBlock(id).subscribe({
      next: (card) => {
        this.cartoes.update((lista) => lista.map((c) => (c.id === card.id ? card : c)));
      },
      error: (error: { error?: { message?: string } }) => {
        this.erro.set(error.error?.message ?? 'Nao foi possivel alterar o status do cartao.');
      }
    });
  }

  protected verFatura(card: CardResponse): void {
    if (this.faturaCartaoId() === card.id) {
      this.faturaCartaoId.set(null);
      this.fatura.set(null);
      return;
    }
    this.faturaCartaoId.set(card.id);
    this.fatura.set(null);
    this.faturaCarregando.set(true);
    this.cardsService.currentInvoice(card.id).subscribe({
      next: (fatura) => {
        this.fatura.set(fatura);
        this.faturaCarregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.faturaCarregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar a fatura.');
      }
    });
  }

  protected navegarFatura(delta: number): void {
    const atual = this.fatura();
    const cardId = this.faturaCartaoId();
    if (!atual || !cardId) {
      return;
    }
    const [ano, mes] = atual.month.split('-').map(Number);
    const base = new Date(ano, mes - 1 + delta, 1);
    const novoMes = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
    this.faturaCarregando.set(true);
    this.cardsService.invoice(cardId, novoMes).subscribe({
      next: (fatura) => {
        this.fatura.set(fatura);
        this.faturaCarregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.faturaCarregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar a fatura.');
      }
    });
  }
}

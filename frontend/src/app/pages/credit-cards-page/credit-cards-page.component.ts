import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { CardResponse } from '../../core/models/api.models';
import { CardsService } from '../../core/services/cards.service';

@Component({
  selector: 'app-credit-cards-page',
  imports: [NgFor, NgClass, NgIf, CurrencyPipe],
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

  protected readonly formNome = signal('');
  protected readonly formBandeira = signal('Mastercard');
  protected readonly formFinal = signal('');
  protected readonly formLimite = signal('');
  protected readonly formUsado = signal('0');
  protected readonly formVencimento = signal('10');

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

  protected salvarCartao(): void {
    const limite = Number(this.formLimite().replace(',', '.'));
    const usado = Number(this.formUsado().replace(',', '.'));
    const vencimento = Number(this.formVencimento());
    if (!this.formNome().trim() || !this.formFinal().trim() || !limite || !vencimento) {
      this.erro.set('Preencha todos os campos obrigatorios.');
      return;
    }
    if (!/^\d{4}$/.test(this.formFinal())) {
      this.erro.set('Informe exatamente 4 digitos finais do cartao.');
      return;
    }
    this.erro.set('');
    this.cardsService.create({
      accountId: null,
      name: this.formNome().trim(),
      brand: this.formBandeira(),
      lastFour: this.formFinal(),
      creditLimit: limite,
      usedLimit: usado,
      dueDay: vencimento,
      blocked: false
    }).subscribe({
      next: (card) => {
        this.cartoes.update((lista) => [card, ...lista]);
        this.painelAberto.set(false);
        this.formNome.set('');
        this.formFinal.set('');
        this.formLimite.set('');
        this.formUsado.set('0');
        this.formVencimento.set('10');
        this.mensagem.set('Cartao adicionado com sucesso.');
        setTimeout(() => this.mensagem.set(''), 2500);
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
}

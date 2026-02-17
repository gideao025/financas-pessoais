import { CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { Component, signal } from '@angular/core';

import { creditCardsMock, type CreditCard } from '../../mocks/finance.mock';

@Component({
  selector: 'app-credit-cards-page',
  imports: [NgFor, NgClass, CurrencyPipe],
  templateUrl: './credit-cards-page.component.html',
  styleUrl: './credit-cards-page.component.scss'
})
export class CreditCardsPageComponent {
  protected readonly cartoes = signal<CreditCard[]>(creditCardsMock);

  protected adicionarCartaoMock(): void {
    const novo: CreditCard = {
      id: `card-${Date.now()}`,
      nome: 'Santander Unique',
      bandeira: 'Visa',
      final: '3301',
      limite: 15000,
      usado: 1200,
      vencimento: 25,
      bloqueado: false
    };

    this.cartoes.update((lista) => [novo, ...lista]);
  }

  protected alternarBloqueio(id: string): void {
    this.cartoes.update((lista) =>
      lista.map((item) => (item.id === id ? { ...item, bloqueado: !item.bloqueado } : item))
    );
  }
}

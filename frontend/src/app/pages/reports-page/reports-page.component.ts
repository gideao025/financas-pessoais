import { CurrencyPipe, NgClass, NgFor, PercentPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { monthlyDataMock, type MonthlyPoint } from '../../mocks/finance.mock';

@Component({
  selector: 'app-reports-page',
  imports: [NgFor, NgClass, CurrencyPipe, PercentPipe],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss'
})
export class ReportsPageComponent {
  protected readonly periodo = signal<'3m' | '6m' | '12m'>('6m');

  protected readonly serie = computed<MonthlyPoint[]>(() => monthlyDataMock[this.periodo()]);

  protected readonly maiorValor = computed(() => {
    const valores = this.serie().flatMap((ponto) => [ponto.receita, ponto.despesa]);
    return Math.max(...valores, 1);
  });

  protected readonly totalReceitas = computed(() =>
    this.serie().reduce((acc, ponto) => acc + ponto.receita, 0)
  );

  protected readonly totalDespesas = computed(() =>
    this.serie().reduce((acc, ponto) => acc + ponto.despesa, 0)
  );

  protected readonly margem = computed(() => {
    const receita = this.totalReceitas();
    if (!receita) {
      return 0;
    }
    return (receita - this.totalDespesas()) / receita;
  });
}

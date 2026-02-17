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

  protected readonly patrimonioSerie = computed(() => {
    let acumulado = 0;
    return this.serie().map((ponto) => {
      acumulado += ponto.receita - ponto.despesa;
      return { mes: ponto.mes, valor: acumulado };
    });
  });

  protected readonly patrimonioMax = computed(() => {
    const valores = this.patrimonioSerie().map((p) => p.valor);
    return Math.max(...valores, 1);
  });

  protected readonly patrimonioPath = computed(() => {
    const dados = this.patrimonioSerie();
    if (!dados.length) {
      return '';
    }
    const max = this.patrimonioMax();
    const stepX = 100 / Math.max(dados.length - 1, 1);
    const pontos = dados.map((p, index) => {
      const x = index * stepX;
      const y = 38 - (p.valor / max) * 30;
      return `${x},${y}`;
    });
    return `M0,40 L${pontos.join(' L ')} L100,40 Z`;
  });

  protected readonly patrimonioLine = computed(() => {
    const dados = this.patrimonioSerie();
    if (!dados.length) {
      return '';
    }
    const max = this.patrimonioMax();
    const stepX = 100 / Math.max(dados.length - 1, 1);
    return dados
      .map((p, index) => {
        const x = index * stepX;
        const y = 38 - (p.valor / max) * 30;
        return `${x},${y}`;
      })
      .join(' ');
  });
}

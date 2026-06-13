import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import type { GoalResponse } from '../../core/models/api.models';
import { GoalsService } from '../../core/services/goals.service';

@Component({
  selector: 'app-goals-page',
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe],
  templateUrl: './goals-page.component.html',
  styleUrl: './goals-page.component.scss'
})
export class GoalsPageComponent implements OnInit {
  private readonly goalsService = inject(GoalsService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly metas = signal<GoalResponse[]>([]);

  protected readonly metaEditando = signal<GoalResponse | null>(null);
  protected readonly nome = signal('');
  protected readonly descricao = signal('');
  protected readonly alvo = signal(0);
  protected readonly atual = signal(0);
  protected readonly prazo = signal<string>(new Date().toISOString().slice(0, 10));

  protected readonly progressoTotal = computed(() => {
    const lista = this.metas();
    if (!lista.length) return 0;
    const somaAlvo = lista.reduce((acc, meta) => acc + meta.targetAmount, 0);
    const somaAtual = lista.reduce((acc, meta) => acc + meta.currentAmount, 0);
    if (!somaAlvo) return 0;
    return Math.round((somaAtual / somaAlvo) * 100);
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected toNumber(valor: unknown): number {
    const n = Number(valor ?? 0);
    return Number.isNaN(n) ? 0 : n;
  }

  protected iniciarNova(): void {
    this.metaEditando.set(null);
    this.nome.set('');
    this.descricao.set('');
    this.alvo.set(0);
    this.atual.set(0);
    this.prazo.set(new Date().toISOString().slice(0, 10));
    this.erro.set('');
  }

  protected editar(meta: GoalResponse): void {
    this.metaEditando.set(meta);
    this.nome.set(meta.name);
    this.descricao.set(meta.description);
    this.alvo.set(meta.targetAmount);
    this.atual.set(meta.currentAmount);
    this.prazo.set(meta.dueDate);
    this.mensagem.set('');
  }

  protected salvar(): void {
    if (!this.nome().trim() || !this.alvo()) {
      this.erro.set('Informe pelo menos nome e valor alvo da meta.');
      return;
    }

    const currentAmount = Math.min(this.atual(), this.alvo());
    const payload = {
      name: this.nome().trim(),
      description: this.descricao().trim(),
      targetAmount: this.alvo(),
      currentAmount,
      dueDate: this.prazo()
    };

    const existente = this.metaEditando();
    const request = existente
      ? this.goalsService.update(existente.id, payload)
      : this.goalsService.create(payload);

    request.subscribe({
      next: (meta) => {
        if (existente) {
          this.metas.update((lista) => lista.map((item) => (item.id === meta.id ? meta : item)));
          this.mensagem.set('Meta atualizada com sucesso.');
        } else {
          this.metas.update((lista) => [meta, ...lista]);
          this.mensagem.set('Meta criada com sucesso.');
        }
        this.iniciarNova();
      },
      error: (error: { error?: { message?: string } }) => {
        this.erro.set(error.error?.message ?? 'Nao foi possivel salvar a meta.');
      }
    });
  }

  protected concluir(meta: GoalResponse): void {
    this.goalsService.complete(meta.id).subscribe({
      next: (atualizada) => {
        this.metas.update((lista) =>
          lista.map((item) => (item.id === atualizada.id ? atualizada : item))
        );
        this.mensagem.set('Meta concluida com sucesso.');
      },
      error: (error: { error?: { message?: string } }) => {
        this.erro.set(error.error?.message ?? 'Nao foi possivel concluir a meta.');
      }
    });
  }

  protected progresso(meta: GoalResponse): number {
    return meta.progress;
  }

  protected recarregar(): void {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set('');

    this.goalsService.list().subscribe({
      next: (metas) => {
        this.metas.set(metas);
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar as metas.');
      }
    });
  }
}

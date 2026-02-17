import { CurrencyPipe, DatePipe, NgFor } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { goalsSignal, type Goal } from '../../mocks/finance.mock';

@Component({
  selector: 'app-goals-page',
  imports: [NgFor, CurrencyPipe, DatePipe],
  templateUrl: './goals-page.component.html',
  styleUrl: './goals-page.component.scss'
})
export class GoalsPageComponent {
  protected readonly metas = goalsSignal;

  protected readonly metaEditando = signal<Goal | null>(null);
  protected readonly nome = signal('');
  protected readonly descricao = signal('');
  protected readonly alvo = signal(0);
  protected readonly atual = signal(0);
  protected readonly prazo = signal<string>(new Date().toISOString().slice(0, 10));

  protected readonly progressoTotal = computed(() => {
    const lista = this.metas();
    if (!lista.length) return 0;
    const somaAlvo = lista.reduce((acc, meta) => acc + meta.alvo, 0);
    const somaAtual = lista.reduce((acc, meta) => acc + meta.atual, 0);
    if (!somaAlvo) return 0;
    return Math.round((somaAtual / somaAlvo) * 100);
  });

  protected iniciarNova(): void {
    this.metaEditando.set(null);
    this.nome.set('');
    this.descricao.set('');
    this.alvo.set(0);
    this.atual.set(0);
    this.prazo.set(new Date().toISOString().slice(0, 10));
  }

  protected editar(meta: Goal): void {
    this.metaEditando.set(meta);
    this.nome.set(meta.nome);
    this.descricao.set(meta.descricao);
    this.alvo.set(meta.alvo);
    this.atual.set(meta.atual);
    this.prazo.set(meta.prazo);
  }

  protected salvar(): void {
    if (!this.nome().trim() || !this.alvo()) {
      return;
    }
    const atual = this.atual() > this.alvo() ? this.alvo() : this.atual();
    const existente = this.metaEditando();
    if (existente) {
      const atualizada: Goal = {
        ...existente,
        nome: this.nome().trim(),
        descricao: this.descricao().trim(),
        alvo: this.alvo(),
        atual,
        prazo: this.prazo()
      };
      goalsSignal.update((lista) =>
        lista.map((m) => (m.id === existente.id ? atualizada : m))
      );
    } else {
      const nova: Goal = {
        id: `goal-${Date.now()}`,
        nome: this.nome().trim(),
        descricao: this.descricao().trim(),
        alvo: this.alvo(),
        atual,
        prazo: this.prazo()
      };
      goalsSignal.update((lista) => [nova, ...lista]);
    }
    this.iniciarNova();
  }

  protected concluir(meta: Goal): void {
    goalsSignal.update((lista) =>
      lista.map((m) =>
        m.id === meta.id
          ? {
              ...m,
              atual: m.alvo
            }
          : m
      )
    );
  }

  protected progresso(meta: Goal): number {
    if (!meta.alvo) return 0;
    return Math.round((meta.atual / meta.alvo) * 100);
  }
}

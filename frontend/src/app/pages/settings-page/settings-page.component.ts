import { NgClass, NgIf } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { UserProfileResponse } from '../../core/models/api.models';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings-page',
  imports: [NgClass, NgIf],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);

  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly perfil = signal<UserProfileResponse | null>(null);

  protected readonly nome = signal('');
  protected readonly email = signal('');
  protected readonly resumoMensal = signal(false);
  protected readonly alertaSaldo = signal(false);
  protected readonly alertaSeguranca = signal(false);

  ngOnInit(): void {
    this.settingsService.getProfile().subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.nome.set(p.fullName);
        this.email.set(p.email);
        this.resumoMensal.set(p.monthlySummary);
        this.alertaSaldo.set(p.lowBalanceAlert);
        this.alertaSeguranca.set(p.securityAlert);
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar as configuracoes.');
      }
    });
  }

  protected alternarPreferencia(campo: 'resumoMensal' | 'alertaSaldo' | 'alertaSeguranca'): void {
    if (campo === 'resumoMensal') this.resumoMensal.update((v) => !v);
    if (campo === 'alertaSaldo') this.alertaSaldo.update((v) => !v);
    if (campo === 'alertaSeguranca') this.alertaSeguranca.update((v) => !v);
  }

  protected salvar(): void {
    if (!this.nome().trim() || !this.email().trim()) {
      this.erro.set('Nome e e-mail sao obrigatorios.');
      return;
    }
    this.erro.set('');
    this.salvando.set(true);
    this.settingsService.updateProfile({
      fullName: this.nome().trim(),
      email: this.email().trim(),
      monthlySummary: this.resumoMensal(),
      lowBalanceAlert: this.alertaSaldo(),
      securityAlert: this.alertaSeguranca(),
      // App é dark-only por ora; persiste 'dark' para não deixar o valor inconsistente.
      theme: 'dark'
    }).subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.salvando.set(false);
        this.mensagem.set('Alteracoes salvas com sucesso.');
        setTimeout(() => this.mensagem.set(''), 2500);
      },
      error: (error: { error?: { message?: string } }) => {
        this.salvando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel salvar as configuracoes.');
      }
    });
  }
}

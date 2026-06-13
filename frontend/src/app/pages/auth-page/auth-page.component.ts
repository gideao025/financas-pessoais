import { NgClass, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [NgIf, NgClass],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss'
})
export class AuthPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modo = signal<'login' | 'register'>('login');
  protected readonly nome = signal('');
  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly carregando = signal(false);
  protected readonly erro = signal('');

  constructor() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl('/dashboard');
    }
  }

  protected alternarModo(modo: 'login' | 'register'): void {
    this.modo.set(modo);
    this.erro.set('');
  }

  protected enviar(): void {
    const email = this.email().trim().toLowerCase();
    const password = this.senha().trim();

    if (!email || !password || (this.modo() === 'register' && !this.nome().trim())) {
      this.erro.set('Preencha os campos obrigatórios para continuar.');
      return;
    }

    this.carregando.set(true);
    this.erro.set('');

    const request = this.modo() === 'login'
      ? this.authService.login({ email, password })
      : this.authService.register({ fullName: this.nome().trim(), email, password });

    request.subscribe({
      next: () => {
        this.carregando.set(false);
        void this.router.navigateByUrl('/dashboard');
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel autenticar.');
      }
    });
  }
}

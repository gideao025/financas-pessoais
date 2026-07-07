import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
export class ShellLayoutComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly reportsService = inject(ReportsService);

  /** Saldo projetado para o último dia do mês corrente (dado real do cash-flow). */
  protected readonly fimDoMesValor = signal(0);
  protected readonly fimDoMesData = signal(this.ultimoDiaDoMes());

  protected readonly fimDoMesFmt = computed(() =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.fimDoMesValor())
  );
  protected readonly fimDoMesDataFmt = computed(() => {
    const [, m, d] = this.fimDoMesData().split('-');
    return `${d}/${m}`;
  });

  protected readonly iniciais = computed(() => {
    const email = this.authService.session()?.email ?? '';
    const nome = email.split('@')[0].replace(/[._-]/g, ' ').trim();
    const partes = nome.split(/\s+/).filter(Boolean);
    const letras = (partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '');
    return (letras || email[0] || '?').toUpperCase();
  });

  ngOnInit(): void {
    const fim = this.ultimoDiaDoMes();
    this.fimDoMesData.set(fim);
    this.reportsService.cashFlow(35).subscribe({
      next: (fluxo) => {
        const doMes = fluxo.days.filter((d) => d.date <= fim);
        const ultimo = doMes[doMes.length - 1];
        this.fimDoMesValor.set(ultimo ? ultimo.balance : fluxo.startBalance);
      },
      error: () => {
        /* sem dados: mantém 0 */
      }
    });
  }

  private ultimoDiaDoMes(): string {
    const hoje = new Date();
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return ultimo.toISOString().slice(0, 10);
  }

  protected logout(): void {
    this.authService.logout();
  }
}

import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';

import { linkedBanksMock, type LinkedBank } from '../../mocks/finance.mock';

interface Perfil {
  nome: string;
  email: string;
  telefone: string;
}

interface Preferencias {
  resumoMensal: boolean;
  alertaSaldo: boolean;
  alertaSeguranca: boolean;
}

@Component({
  selector: 'app-settings-page',
  imports: [NgFor, NgClass, NgIf],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent {
  protected readonly perfil = signal<Perfil>({
    nome: 'Alex Souza',
    email: 'alex.souza@exemplo.com',
    telefone: '(11) 99999-0000'
  });

  protected readonly preferencias = signal<Preferencias>({
    resumoMensal: true,
    alertaSaldo: false,
    alertaSeguranca: true
  });

  protected readonly bancos = signal<LinkedBank[]>(linkedBanksMock);
  protected readonly mensagem = signal('');

  protected atualizarPerfil(campo: keyof Perfil, valor: string): void {
    this.perfil.update((atual) => ({ ...atual, [campo]: valor }));
  }

  protected alternarPreferencia(campo: keyof Preferencias): void {
    this.preferencias.update((atual) => ({ ...atual, [campo]: !atual[campo] }));
  }

  protected alternarBanco(id: string): void {
    this.bancos.update((lista) =>
      lista.map((item) => (item.id === id ? { ...item, sincronizado: !item.sincronizado } : item))
    );
  }

  protected salvar(): void {
    this.mensagem.set('Alterações salvas com sucesso (mock).');
    setTimeout(() => this.mensagem.set(''), 2500);
  }
}

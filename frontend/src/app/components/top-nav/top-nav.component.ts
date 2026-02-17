import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss'
})
export class TopNavComponent {
  protected readonly busca = signal('');
  protected readonly temaEscuro = signal(false);

  protected alternarTema(): void {
    this.temaEscuro.update((valor) => !valor);
    document.documentElement.classList.toggle('dark', this.temaEscuro());
  }
}

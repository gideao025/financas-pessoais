import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
export class ShellLayoutComponent {
  protected readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }
}

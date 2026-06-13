import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { ShellLayoutComponent } from './layouts/shell-layout/shell-layout.component';
import { AccountsPageComponent } from './pages/accounts-page/accounts-page.component';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { CreditCardsPageComponent } from './pages/credit-cards-page/credit-cards-page.component';
import { DashboardOverviewPageComponent } from './pages/dashboard-overview-page/dashboard-overview-page.component';
import { GoalsPageComponent } from './pages/goals-page/goals-page.component';
import { ReportsPageComponent } from './pages/reports-page/reports-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page.component';

export const routes: Routes = [
  { path: 'auth', component: AuthPageComponent },
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardOverviewPageComponent },
      { path: 'accounts', component: AccountsPageComponent },
      { path: 'transactions', component: TransactionsPageComponent },
      { path: 'reports', component: ReportsPageComponent },
      { path: 'goals', component: GoalsPageComponent },
      { path: 'cards', component: CreditCardsPageComponent },
      { path: 'settings', component: SettingsPageComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

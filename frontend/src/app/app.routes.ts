import { Routes } from '@angular/router';

import { CreditCardsPageComponent } from './pages/credit-cards-page/credit-cards-page.component';
import { DashboardOverviewPageComponent } from './pages/dashboard-overview-page/dashboard-overview-page.component';
import { ReportsPageComponent } from './pages/reports-page/reports-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardOverviewPageComponent },
  { path: 'transactions', component: TransactionsPageComponent },
  { path: 'cards', component: CreditCardsPageComponent },
  { path: 'reports', component: ReportsPageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: '**', redirectTo: 'dashboard' }
];

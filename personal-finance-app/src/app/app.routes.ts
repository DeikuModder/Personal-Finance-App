import { Routes } from '@angular/router';
import { pinGuard } from './core/guards/pin.guard';

export const routes: Routes = [
  {
    path: 'auth/setup',
    loadComponent: () =>
      import('./features/auth/auth-page.component').then((m) => m.AuthPageComponent),
  },
  {
    path: 'auth/unlock',
    loadComponent: () =>
      import('./features/auth/unlock/unlock.component').then((m) => m.UnlockComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [pinGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(
            (m) => m.TransactionsComponent
          ),
      },
      {
        path: 'transactions/:id/edit',
        loadComponent: () =>
          import('./features/transactions/edit-transaction.component').then(
            (m) => m.EditTransactionComponent
          ),
      },
      {
        path: 'add',
        loadComponent: () =>
          import('./features/transactions/add-transaction.component').then(
            (m) => m.AddTransactionComponent
          ),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets.component').then((m) => m.BudgetsComponent),
      },
      {
        path: 'debts',
        loadComponent: () =>
          import('./features/debts/debts.component').then((m) => m.DebtsComponent),
      },
      {
        path: 'investments',
        loadComponent: () =>
          import('./features/investments/investments.component').then(
            (m) => m.InvestmentsComponent
          ),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts.component').then((m) => m.AccountsComponent),
      },
      {
        path: 'challenge',
        loadComponent: () =>
          import('./features/challenge/challenge.component').then(
            (m) => m.ChallengeComponent
          ),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat.component').then((m) => m.ChatComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
];

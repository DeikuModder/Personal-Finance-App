import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { TRANSACTION_REPOSITORY, ACCOUNT_REPOSITORY, BUDGET_REPOSITORY, BUDGET_ITEM_REPOSITORY, CATEGORY_REPOSITORY, INVESTMENT_REPOSITORY } from './core/tokens/tokens';
import { HttpRepository } from './core/repositories/http.repository';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { Transaction } from './core/models/transaction.model';
import { Account } from './core/models/account.model';
import { Budget } from './core/models/budget.model';
import { Investment } from './core/models/investment.model';
import { BudgetItem } from './core/models/budget.model';
import { Category } from './core/models/category.model';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useFactory: (http: HttpClient) => new HttpRepository<Transaction>('/api/transactions', http),
      deps: [HttpClient],
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: (http: HttpClient) => new HttpRepository<Account>('/api/accounts', http),
      deps: [HttpClient],
    },
    {
      provide: BUDGET_REPOSITORY,
      useFactory: (http: HttpClient) => new HttpRepository<Budget>('/api/budgets', http),
      deps: [HttpClient],
    },
    {
      provide: BUDGET_ITEM_REPOSITORY,
      useFactory: (http: HttpClient) => new HttpRepository<BudgetItem>('/api/budget-items', http),
      deps: [HttpClient],
    },
    {
      provide: CATEGORY_REPOSITORY,
      useFactory: (http: HttpClient) => new HttpRepository<Category>('/api/categories', http),
      deps: [HttpClient],
    },
    {
      provide: INVESTMENT_REPOSITORY,
      useFactory: (http: HttpClient) => new HttpRepository<Investment>('/api/investments', http),
      deps: [HttpClient],
    },
  ],
};

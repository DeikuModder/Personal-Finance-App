import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from './services/dashboard.service';
import { Transaction } from '../../core/models/transaction.model';
import { AccountService } from '../accounts/services/account.service';
import { InvestmentService } from '../investments/services/investment.service';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { SpendingByCategoryComponent } from './components/spending-by-category/spending-by-category.component';
import { MonthlyTrendComponent } from './components/monthly-trend/monthly-trend.component';
import { NetWorthCardComponent } from './components/net-worth-card/net-worth-card.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { PrivacyToggleComponent } from '../../shared/components/privacy-toggle/privacy-toggle.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { ListSkeletonComponent } from '../../shared/components/list-skeleton/list-skeleton.component';
import { toErrorMessage } from '../../shared/utils/http-error.util';
import { toLocalDate } from '../../core/utils/date.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    SummaryCardsComponent,
    RecentTransactionsComponent,
    SpendingByCategoryComponent,
    MonthlyTrendComponent,
    NetWorthCardComponent,
    SectionHelpComponent,
    PrivacyToggleComponent,
    ErrorBannerComponent,
    ListSkeletonComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private accountService = inject(AccountService);
  private investmentService = inject(InvestmentService);

  balance = signal(0);
  income = signal(0);
  expenses = signal(0);
  recentTransactions = signal<Transaction[]>([]);
  allTransactions = signal<Transaction[]>([]);
  periodTransactions = signal<Transaction[]>([]);
  accountsTotal = signal(0);
  investmentsValue = signal(0);
  investmentsIncome = signal(0);

  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth());

  private loadErrorDismissed = signal(false);
  readonly loading = computed(
    () =>
      !this.dashboardService.ready() ||
      !this.accountService.ready() ||
      !this.investmentService.ready()
  );
  readonly loadError = computed(() => {
    const err =
      this.dashboardService.loadError() ??
      this.accountService.loadError() ??
      this.investmentService.loadError();
    return !this.loadErrorDismissed() && err ? toErrorMessage(err) : null;
  });

  dismissLoadError(): void {
    this.loadErrorDismissed.set(true);
  }

  ngOnInit(): void {
    this.dashboardService.getAllTransactions().subscribe((transactions) => {
      this.allTransactions.set(transactions);
      this.applyPeriod(transactions);
    });

    this.accountService.getAccounts().subscribe((accounts) => {
      this.accountsTotal.set(this.accountService.getTotalBalance(accounts));
    });

    this.investmentService.getInvestments().subscribe((investments) => {
      this.investmentsValue.set(this.investmentService.getTotalValue(investments));
      this.investmentsIncome.set(this.investmentService.getTotalAnnualIncome(investments));
    });
  }

  applyPeriod(transactions: Transaction[]): void {
    const periodTransactions = transactions.filter((t) => {
      const date = toLocalDate(t.date);
      return (
        date.getFullYear() === this.currentYear() &&
        date.getMonth() === this.currentMonth()
      );
    });

    this.balance.set(this.dashboardService.getBalance(periodTransactions));
    this.income.set(this.dashboardService.getTotalIncome(periodTransactions));
    this.expenses.set(this.dashboardService.getTotalExpenses(periodTransactions));
    this.recentTransactions.set(this.dashboardService.getRecentTransactions(periodTransactions));
    this.periodTransactions.set(periodTransactions);
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentYear.update((y) => y - 1);
      this.currentMonth.set(11);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
    this.applyPeriod(this.allTransactions());
  }

  nextMonth(): void {
    const today = new Date();
    const isAtFuture = this.currentYear() > today.getFullYear() ||
      (this.currentYear() === today.getFullYear() && this.currentMonth() >= today.getMonth());
    if (isAtFuture) return;

    if (this.currentMonth() === 11) {
      this.currentYear.update((y) => y + 1);
      this.currentMonth.set(0);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
    this.applyPeriod(this.allTransactions());
  }

  get periodLabel(): string {
    return new Date(this.currentYear(), this.currentMonth()).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
}

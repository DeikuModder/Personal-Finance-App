import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Transaction } from '../../../core/models/transaction.model';
import { Account } from '../../../core/models/account.model';
import { TransactionService } from '../../../features/transactions/services/transaction.service';
import { AccountService } from '../../../features/accounts/services/account.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);

  getCurrentMonthTransactions(): Observable<Transaction[]> {
    const now = new Date();
    return this.transactionService.getTransactionsByMonth(now.getFullYear(), now.getMonth());
  }

  getAllTransactions(): Observable<Transaction[]> {
    return this.transactionService.getTransactions();
  }

  getAccounts(): Observable<Account[]> {
    return this.accountService.getAccounts();
  }

  getTotalIncome(transactions: Transaction[]): number {
    return this.transactionService.getTotalIncome(transactions);
  }

  getTotalExpenses(transactions: Transaction[]): number {
    return this.transactionService.getTotalExpenses(transactions);
  }

  getBalance(transactions: Transaction[]): number {
    return this.transactionService.getBalance(transactions);
  }

  getRecentTransactions(transactions: Transaction[], count = 5): Transaction[] {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  }
}

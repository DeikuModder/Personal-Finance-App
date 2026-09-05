import { Injectable, inject } from '@angular/core';
import { Observable, map, tap, BehaviorSubject } from 'rxjs';
import { Transaction } from '../../../core/models/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { toLocalDate } from '../../../core/utils/date.util';
import { AccountService } from '../../accounts/services/account.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private repo = inject(TRANSACTION_REPOSITORY) as Repository<Transaction>;
  private accountService = inject(AccountService);
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((server) => {
      const current = this.transactions$.value;
      if (current.length === 0) {
        this.transactions$.next(server);
        return;
      }
      const serverIds = new Set(server.map((t) => t.id));
      const localOnly = current.filter((t) => !serverIds.has(t.id));
      this.transactions$.next([...localOnly, ...server]);
    });
  }

  getTransactions(): Observable<Transaction[]> {
    this.init();
    return this.transactions$.asObservable();
  }

  getTransactionsByMonth(year: number, month: number): Observable<Transaction[]> {
    return this.getTransactions().pipe(
      map((transactions) =>
        transactions.filter((t) => {
          const date = toLocalDate(t.date);
          return date.getFullYear() === year && date.getMonth() === month;
        })
      )
    );
  }

  addTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Observable<Transaction> {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.create(transaction).pipe(
      tap(() => this.accountService.refresh()),
      map((t) => {
        this.transactions$.next([...this.transactions$.value, t]);
        return t;
      })
    );
  }

  updateTransaction(transaction: Transaction): Observable<Transaction> {
    const updated = { ...transaction, updatedAt: new Date().toISOString() };
    return this.repo.update(updated).pipe(
      tap(() => this.accountService.refresh()),
      map((t) => {
        const list = this.transactions$.value.map((item) => (item.id === t.id ? t : item));
        this.transactions$.next(list);
        return t;
      })
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      tap(() => this.accountService.refresh()),
      map(() => {
        this.transactions$.next(this.transactions$.value.filter((t) => t.id !== id));
      })
    );
  }

  getTotalIncome(transactions: Transaction[]): number {
    return transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpenses(transactions: Transaction[]): number {
    return transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }

  getBalance(transactions: Transaction[]): number {
    return this.getTotalIncome(transactions) - this.getTotalExpenses(transactions);
  }
}

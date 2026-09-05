import { Injectable, inject } from '@angular/core';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { Account } from '../../../core/models/account.model';
import { ACCOUNT_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private repo = inject(ACCOUNT_REPOSITORY) as Repository<Account>;
  private accounts$ = new BehaviorSubject<Account[]>([]);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((a) => this.accounts$.next(a));
  }

  getAccounts(): Observable<Account[]> {
    this.init();
    return this.accounts$.asObservable();
  }

  refresh(): void {
    this.repo.getAll().subscribe((a) => this.accounts$.next(a));
  }

  addAccount(data: Omit<Account, 'id' | 'createdAt'>): Observable<Account> {
    const account: Account = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    return this.repo.create(account).pipe(
      map((a) => {
        this.accounts$.next([...this.accounts$.value, a]);
        return a;
      })
    );
  }

  updateAccount(account: Account): Observable<Account> {
    return this.repo.update(account).pipe(
      map((a) => {
        const list = this.accounts$.value.map((item) => (item.id === a.id ? a : item));
        this.accounts$.next(list);
        return a;
      })
    );
  }

  deleteAccount(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      map(() => {
        this.accounts$.next(this.accounts$.value.filter((a) => a.id !== id));
      })
    );
  }

  getTotalBalance(accounts: Account[]): number {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }
}

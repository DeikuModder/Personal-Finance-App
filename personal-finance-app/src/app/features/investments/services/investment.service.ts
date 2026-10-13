import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { Investment } from '../../../core/models/investment.model';
import { INVESTMENT_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private repo = inject(INVESTMENT_REPOSITORY) as Repository<Investment>;
  private investments$ = new BehaviorSubject<Investment[]>([]);
  private initialized = false;
  private readySignal = signal(false);
  private loadErrorSignal = signal<unknown | null>(null);
  readonly ready = this.readySignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe({
      next: (items) => {
        this.investments$.next(items);
        this.readySignal.set(true);
      },
      error: (err) => {
        this.loadErrorSignal.set(err);
        this.readySignal.set(true);
      },
    });
  }

  getInvestments(): Observable<Investment[]> {
    this.init();
    return this.investments$.asObservable();
  }

  addInvestment(data: Omit<Investment, 'id' | 'createdAt'>): Observable<Investment> {
    const investment: Investment = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    return this.repo.create(investment).pipe(
      map((item) => {
        this.investments$.next([...this.investments$.value, item]);
        return item;
      })
    );
  }

  deleteInvestment(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      map(() => {
        this.investments$.next(this.investments$.value.filter((i) => i.id !== id));
      })
    );
  }

  getValue(investment: Investment): number {
    const shares = investment.shares ?? 1;
    return investment.currentPrice * shares;
  }

  getTotalValue(investments: Investment[]): number {
    return investments.reduce((sum, i) => sum + this.getValue(i), 0);
  }

  getAnnualIncome(investment: Investment): number {
    if (!investment.dividendPerShare) return 0;
    const shares = investment.shares ?? 1;
    return investment.dividendPerShare * shares;
  }

  getTotalAnnualIncome(investments: Investment[]): number {
    return investments.reduce((sum, i) => sum + this.getAnnualIncome(i), 0);
  }
}
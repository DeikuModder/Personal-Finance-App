import { Injectable, inject } from '@angular/core';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { Goal } from '../../../core/models/goal.model';
import { Account } from '../../../core/models/account.model';
import { Transaction } from '../../../core/models/transaction.model';
import { GOAL_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { toLocalDate, startOfWeek, dateKey } from '../../../core/utils/date.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private repo = inject(GOAL_REPOSITORY) as Repository<Goal>;
  private goals$ = new BehaviorSubject<Goal[]>([]);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((server) => this.goals$.next(server));
  }

  getGoals(): Observable<Goal[]> {
    this.init();
    return this.goals$.asObservable();
  }

  addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Observable<Goal> {
    const now = new Date().toISOString();
    const goal: Goal = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.create(goal).pipe(
      map((g) => {
        this.goals$.next([...this.goals$.value, g]);
        return g;
      })
    );
  }

  updateGoal(goal: Goal): Observable<Goal> {
    const updated = { ...goal, updatedAt: new Date().toISOString() };
    return this.repo.update(updated).pipe(
      map((g) => {
        const list = this.goals$.value.map((item) => (item.id === g.id ? g : item));
        this.goals$.next(list);
        return g;
      })
    );
  }

  deleteGoal(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      map(() => {
        this.goals$.next(this.goals$.value.filter((g) => g.id !== id));
      })
    );
  }

  markAchieved(goal: Goal): Observable<Goal> {
    const updated: Goal = {
      ...goal,
      status: 'completed',
      achievedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    return this.updateGoal(updated);
  }

  getSavingsPool(accounts: Account[]): number {
    return accounts
      .filter((a) => a.type !== 'credit_card')
      .reduce((sum, a) => sum + (a.balance || 0), 0);
  }

  getMoneyProgress(pool: number, goal: Goal): number {
    if (goal.type !== 'savings' || goal.targetAmount <= 0) return 0;
    return Math.min(1, pool / goal.targetAmount);
  }

  getMoneySaved(pool: number, goal: Goal): number {
    return Math.min(pool, goal.targetAmount);
  }

  computeStreak(goal: Goal, transactions: Transaction[]): number {
    if (goal.type !== 'streak' || !goal.category) return 0;
    if (goal.allowancePeriod === 'week') {
      return this.computeWeeklyStreak(goal, transactions);
    }
    return this.computeDailyStreak(goal, transactions);
  }

  private computeDailyStreak(goal: Goal, transactions: Transaction[]): number {
    const limit = goal.allowance || 0;
    const spending = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense' || t.category !== goal.category) continue;
      const key = dateKey(toLocalDate(t.date));
      spending.set(key, (spending.get(key) || 0) + t.amount);
    }

    let streak = 0;
    let day = startOfDay(new Date());
    for (let i = 0; i < 3650; i++) {
      const spent = spending.get(dateKey(day)) || 0;
      if (spent > limit) break;
      streak++;
      day.setDate(day.getDate() - 1);
    }
    return streak;
  }

  private computeWeeklyStreak(goal: Goal, transactions: Transaction[]): number {
    const limit = goal.allowance || 0;
    const spending = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense' || t.category !== goal.category) continue;
      const key = dateKey(startOfWeek(toLocalDate(t.date)));
      spending.set(key, (spending.get(key) || 0) + t.amount);
    }

    let streak = 0;
    const current = startOfWeek(new Date());
    for (let i = 0; i < 522; i++) {
      const weekStart = new Date(current);
      weekStart.setDate(current.getDate() - i * 7);
      const spent = spending.get(dateKey(weekStart)) || 0;
      if (spent > limit) break;
      streak++;
    }
    return streak;
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
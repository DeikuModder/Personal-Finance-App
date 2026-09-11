import { Component, inject, signal } from '@angular/core';
import { combineLatest } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../shared/pipes/privacy-mask.pipe';
import { PrivacyToggleComponent } from '../../shared/components/privacy-toggle/privacy-toggle.component';
import { Goal } from '../../core/models/goal.model';
import { Account } from '../../core/models/account.model';
import { Transaction } from '../../core/models/transaction.model';
import { AccountService } from '../accounts/services/account.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { EffectsService } from '../challenge/services/effects.service';
import { GoalService } from './services/goal.service';
import { GoalFormComponent } from './components/goal-form/goal-form.component';
import { GoalListComponent } from './components/goal-list/goal-list.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { toErrorMessage } from '../../shared/utils/http-error.util';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CurrencyFormatPipe, PrivacyMaskPipe, PrivacyToggleComponent, GoalFormComponent, GoalListComponent, SectionHelpComponent, ErrorBannerComponent],
  templateUrl: './goals.html',
  styleUrl: './goals.scss',
})
export class GoalsComponent {
  private goalService = inject(GoalService);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private effects = inject(EffectsService);

  goals = signal<Goal[]>([]);
  pool = signal(0);
  streaks = signal<Map<string, number>>(new Map());
  showForm = signal(false);
  editing = signal<Goal | null>(null);
  saveError = signal<string | null>(null);

  private achieving = new Set<string>();

  constructor() {
    combineLatest([
      this.goalService.getGoals(),
      this.accountService.getAccounts(),
      this.transactionService.getTransactions(),
    ]).subscribe(([goals, accounts, transactions]) => {
      const pool = this.goalService.getSavingsPool(accounts);
      const streaks = new Map<string, number>();
      for (const goal of goals) {
        if (goal.type === 'streak') {
          streaks.set(goal.id, this.goalService.computeStreak(goal, transactions));
        }
      }
      this.pool.set(pool);
      this.streaks.set(streaks);
      this.detectAchievements(goals, pool, streaks);
      this.goals.set([...goals].sort((a, b) => Number(!!a.achievedAt) - Number(!!b.achievedAt)));
    });
  }

  private detectAchievements(goals: Goal[], pool: number, streaks: Map<string, number>): void {
    for (const goal of goals) {
      if (goal.achievedAt || goal.status === 'completed') continue;
      if (this.achieving.has(goal.id)) continue;
      let achieved = false;
      if (goal.type === 'savings') {
        achieved = goal.targetAmount > 0 && pool >= goal.targetAmount;
      } else {
        achieved = (goal.streakTarget ?? 0) > 0 && (streaks.get(goal.id) ?? 0) >= goal.streakTarget!;
      }
      if (!achieved) continue;
      this.achieving.add(goal.id);
      this.goalService.markAchieved(goal).subscribe({
        next: () => {
          this.effects.goldBurst();
          setTimeout(() => this.effects.celebrate(), 600);
          this.achieving.delete(goal.id);
        },
        error: () => this.achieving.delete(goal.id),
      });
    }
  }

  getFundedMoneyGoals(): number {
    return this.goals().filter((g) => g.type === 'savings' && g.targetAmount > 0 && this.pool() >= g.targetAmount).length;
  }

  getMoneyGoalCount(): number {
    return this.goals().filter((g) => g.type === 'savings').length;
  }

  startAdd(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }

  startEdit(goal: Goal): void {
    this.editing.set(goal);
    this.showForm.set(true);
  }

  onSaved(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): void {
    const editing = this.editing();
    const done = () => {
      this.showForm.set(false);
      this.editing.set(null);
      this.saveError.set(null);
    };
    const fail = (err: unknown) => this.saveError.set(toErrorMessage(err));
    if (editing) {
      this.goalService.updateGoal({ ...editing, ...data }).subscribe({ next: done, error: fail });
    } else {
      this.goalService.addGoal(data).subscribe({ next: done, error: fail });
    }
  }

  onCancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  onDelete(id: string): void {
    this.goalService.deleteGoal(id).subscribe({
      error: (err) => this.saveError.set(toErrorMessage(err)),
    });
  }
}
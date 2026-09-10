import { Component, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Goal } from '../../../../core/models/goal.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { CategoryService } from '../../../../core/services/category.service';
import { toLocalDate } from '../../../../core/utils/date.util';

@Component({
  selector: 'app-goal-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule, CurrencyFormatPipe],
  templateUrl: './goal-list.html',
  styleUrl: './goal-list.scss',
})
export class GoalListComponent {
  private categoryService = inject(CategoryService);

  goals = input<Goal[]>([]);
  pool = input(0);
  streaks = input<Map<string, number>>(new Map());
  deleted = output<string>();
  edited = output<Goal>();

  getProgress(goal: Goal): number {
    if (goal.type === 'savings') {
      if (goal.targetAmount <= 0) return 0;
      return Math.min(1, this.pool() / goal.targetAmount);
    }
    const target = goal.streakTarget ?? 0;
    if (target <= 0) return 0;
    return Math.min(1, this.getStreak(goal) / target);
  }

  getStreak(goal: Goal): number {
    if (goal.type !== 'streak') return 0;
    return this.streaks().get(goal.id) ?? 0;
  }

  getSaved(goal: Goal): number {
    return Math.min(this.pool(), goal.targetAmount);
  }

  getCategoryLabel(goal: Goal): string {
    return goal.category ? this.categoryService.getLabel(goal.category) : '';
  }

  isFunded(goal: Goal): boolean {
    return goal.type === 'savings' && !goal.achievedAt && goal.targetAmount > 0 && this.pool() >= goal.targetAmount;
  }

  getDaysLeft(goal: Goal): number | null {
    if (!goal.deadline) return null;
    const due = toLocalDate(goal.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  }

  getUnit(goal: Goal): string {
    return goal.allowancePeriod === 'week' ? 'weeks' : 'days';
  }

  getAllowanceLabel(goal: Goal): string {
    return `under $${goal.allowance} / ${goal.allowancePeriod}`;
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleted.emit(id);
  }

  onEdit(goal: Goal, event: Event): void {
    event.stopPropagation();
    this.edited.emit(goal);
  }
}
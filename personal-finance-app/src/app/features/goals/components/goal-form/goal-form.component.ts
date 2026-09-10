import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Goal, GoalType } from '../../../../core/models/goal.model';
import { CategoryOption } from '../../../../core/models/category.model';
import { CUSTOM_CATEGORY_ICONS } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { fileToPicture } from '../../utils/image.util';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './goal-form.html',
  styleUrl: './goal-form.scss',
})
export class GoalFormComponent {
  private categoryService = inject(CategoryService);

  editing = input<Goal | null>(null);
  saved = output<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>();
  cancelled = output<void>();

  type = signal<GoalType>('savings');
  title = signal('');
  icon = signal('flag');
  targetAmount = signal(0);
  deadline = signal<Date | null>(null);
  picture = signal<string | null>(null);
  pictureProcessing = signal(false);
  category = signal('');
  allowance = signal(0);
  allowancePeriod = signal<'day' | 'week'>('day');
  streakTarget = signal<number | null>(null);

  categories = signal<CategoryOption[]>([]);
  readonly customIcons = CUSTOM_CATEGORY_ICONS;

  constructor() {
    this.categoryService.getOptions('expense').subscribe((options) => {
      this.categories.set(options);
    });
    const d = this.editing();
    if (!d) return;
    this.type.set(d.type);
    this.title.set(d.title);
    this.icon.set(d.icon || 'flag');
    this.targetAmount.set(d.targetAmount || 0);
    this.deadline.set(d.deadline ? new Date(d.deadline) : null);
    this.picture.set(d.picture);
    this.category.set(d.category ?? '');
    this.allowance.set(d.allowance || 0);
    this.allowancePeriod.set(d.allowancePeriod || 'day');
    this.streakTarget.set(d.streakTarget);
  }

  setType(next: GoalType): void {
    this.type.set(next);
  }

  get clean(): boolean {
    if (!this.title().trim()) return false;
    if (this.type() === 'savings') {
      return this.targetAmount() > 0;
    }
    return this.category() !== '' && this.allowance() > 0;
  }

  onPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.pictureProcessing.set(true);
    fileToPicture(file).subscribe({
      next: (result) => {
        if (result) {
          this.picture.set(result.dataUrl);
        }
      },
      complete: () => this.pictureProcessing.set(false),
    });
  }

  removePicture(): void {
    this.picture.set(null);
  }

  onSubmit(): void {
    if (!this.clean) return;
    const editing = this.editing();
    const isSavings = this.type() === 'savings';
    this.saved.emit({
      type: this.type(),
      title: this.title().trim(),
      icon: isSavings ? this.icon() : 'flag',
      targetAmount: isSavings ? Number(this.targetAmount()) : 0,
      deadline: isSavings && this.deadline() ? this.deadline()!.toISOString().split('T')[0] : null,
      picture: isSavings ? this.picture() : null,
      category: isSavings ? null : this.category(),
      allowance: isSavings ? 0 : Number(this.allowance()),
      allowancePeriod: isSavings ? 'day' : this.allowancePeriod(),
      streakTarget: isSavings ? null : this.streakTarget() || null,
      status: editing?.status ?? 'active',
      achievedAt: editing?.achievedAt ?? null,
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
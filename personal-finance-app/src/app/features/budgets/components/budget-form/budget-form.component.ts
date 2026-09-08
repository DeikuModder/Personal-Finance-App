import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Budget } from '../../../../core/models/budget.model';
import { CategoryOption, NEW_CATEGORY_VALUE, CUSTOM_CATEGORY_ICONS } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.scss',
})
export class BudgetFormComponent {
  private categoryService = inject(CategoryService);

  saved = output<Omit<Budget, 'id' | 'createdAt'>>();
  cancelled = output<void>();

  categories = signal<CategoryOption[]>([]);
  category = signal<string>('');
  showNewCategory = signal(false);
  newCategoryLabel = signal('');
  newCategoryIcon = signal(CUSTOM_CATEGORY_ICONS[0]);
  addingCategory = signal(false);

  readonly customIcons = CUSTOM_CATEGORY_ICONS;
  readonly newCategoryValue = NEW_CATEGORY_VALUE;

  constructor() {
    this.categoryService.getOptions('expense').subscribe((options) => {
      this.categories.set(options);
    });
  }

  onCategoryChange(value: string): void {
    if (value === NEW_CATEGORY_VALUE) {
      this.showNewCategory.set(true);
      return;
    }
    this.category.set(value);
    this.showNewCategory.set(false);
  }

  addNewCategory(): void {
    const label = this.newCategoryLabel().trim();
    if (!label || this.addingCategory()) return;
    this.addingCategory.set(true);
    this.categoryService
      .create({ label, icon: this.newCategoryIcon(), type: 'expense' })
      .subscribe({
        next: (cat) => {
          this.category.set(cat.id);
          this.showNewCategory.set(false);
          this.newCategoryLabel.set('');
          this.newCategoryIcon.set(CUSTOM_CATEGORY_ICONS[0]);
          this.addingCategory.set(false);
        },
        error: () => {
          this.addingCategory.set(false);
        },
      });
  }

  cancelNewCategory(): void {
    this.showNewCategory.set(false);
    this.newCategoryLabel.set('');
    this.newCategoryIcon.set(CUSTOM_CATEGORY_ICONS[0]);
  }

  onSubmit(): void {
    if (!this.category()) return;
    const now = new Date();
    this.saved.emit({
      category: this.category(),
      amount: 0,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
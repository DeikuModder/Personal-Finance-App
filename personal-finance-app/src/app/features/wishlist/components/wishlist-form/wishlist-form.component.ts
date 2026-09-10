import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WishlistItem } from '../../../../core/models/wishlist.model';
import { fileToPicture } from '../../../../shared/utils/image.util';

@Component({
  selector: 'app-wishlist-form',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './wishlist-form.html',
  styleUrl: './wishlist-form.scss',
})
export class WishlistFormComponent {
  editing = input<WishlistItem | null>(null);
  saved = output<Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>>();
  cancelled = output<void>();

  name = signal('');
  price = signal<number | null>(null);
  picture = signal<string | null>(null);
  pictureProcessing = signal(false);

  constructor() {
    const i = this.editing();
    if (!i) return;
    this.name.set(i.name);
    this.price.set(i.price > 0 ? i.price : null);
    this.picture.set(i.picture);
  }

  get clean(): boolean {
    return this.name().trim() !== '';
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
    this.saved.emit({
      name: this.name().trim(),
      price: this.price() ?? 0,
      picture: this.picture(),
      status: editing?.status ?? 'active',
      achievedAt: editing?.achievedAt ?? null,
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
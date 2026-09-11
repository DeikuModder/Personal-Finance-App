import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WishlistItem } from '../../../../core/models/wishlist.model';
import { fileToPicture, PictureError } from '../../../../shared/utils/image.util';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner.component';

@Component({
  selector: 'app-wishlist-form',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressBarModule, ErrorBannerComponent],
  templateUrl: './wishlist-form.html',
  styleUrl: './wishlist-form.scss',
})
export class WishlistFormComponent {
  editing = input<WishlistItem | null>(null);
  saved = output<Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>>();
  cancelled = output<void>();

  uploading = input(false);
  uploadProgress = input(0);

  name = signal('');
  price = signal<number | null>(null);
  picture = signal<string | null>(null);
  pictureProcessing = signal(false);
  pictureError = signal<string | null>(null);

  busy = computed(() => this.uploading());

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
    this.pictureError.set(null);
    fileToPicture(file).subscribe({
      next: (result) => {
        this.picture.set(result.dataUrl);
      },
      error: (err) => {
        this.pictureError.set(err instanceof PictureError ? err.message : 'Could not read that photo. Please try another one.');
      },
      complete: () => this.pictureProcessing.set(false),
    });
  }

  removePicture(): void {
    this.picture.set(null);
    this.pictureError.set(null);
  }

  onSubmit(): void {
    if (!this.clean || this.uploading()) return;
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
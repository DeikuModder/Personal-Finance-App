import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WishlistItem } from '../../core/models/wishlist.model';
import { EffectsService } from '../challenge/services/effects.service';
import { WishlistService } from './services/wishlist.service';
import { WishlistFormComponent } from './components/wishlist-form/wishlist-form.component';
import { WishlistListComponent } from './components/wishlist-list/wishlist-list.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { toErrorMessage } from '../../shared/utils/http-error.util';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, WishlistFormComponent, WishlistListComponent, SectionHelpComponent, PageHeaderComponent, ErrorBannerComponent],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class WishlistComponent {
  private wishlistService = inject(WishlistService);
  private effects = inject(EffectsService);

  items = signal<WishlistItem[]>([]);
  showForm = signal(false);
  editing = signal<WishlistItem | null>(null);
  saveError = signal<string | null>(null);
  uploading = signal(false);
  uploadProgress = signal(0);

  constructor() {
    this.wishlistService.getItems().subscribe((items) => {
      const sorted = [...items].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
        return a.createdAt.localeCompare(b.createdAt);
      });
      this.items.set(sorted);
    });
  }

  startAdd(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }

  startEdit(item: WishlistItem): void {
    this.editing.set(item);
    this.showForm.set(true);
  }

  onSaved(data: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>): void {
    const editing = this.editing();
    const onProgress = (pct: number) => {
      this.uploading.set(true);
      this.uploadProgress.set(pct);
    };
    const done = () => {
      this.uploading.set(false);
      this.uploadProgress.set(0);
      this.showForm.set(false);
      this.editing.set(null);
      this.saveError.set(null);
    };
    const fail = (err: unknown) => {
      this.uploading.set(false);
      this.uploadProgress.set(0);
      this.saveError.set(toErrorMessage(err));
    };
    this.uploading.set(true);
    this.uploadProgress.set(0);
    if (editing) {
      this.wishlistService.updateItemWithProgress({ ...editing, ...data }, onProgress).subscribe({ next: done, error: fail });
    } else {
      this.wishlistService.addItemWithProgress(data, onProgress).subscribe({ next: done, error: fail });
    }
  }

  onCancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  onDelete(id: string): void {
    this.wishlistService.deleteItem(id).subscribe({
      error: (err) => this.saveError.set(toErrorMessage(err)),
    });
  }

  onAchieved(item: WishlistItem): void {
    this.wishlistService.markAchieved(item).subscribe({
      next: () => {
        this.effects.goldBurst();
        setTimeout(() => this.effects.celebrate(), 600);
      },
      error: (err) => this.saveError.set(toErrorMessage(err)),
    });
  }
}
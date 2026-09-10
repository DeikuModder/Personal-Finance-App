import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WishlistItem } from '../../core/models/wishlist.model';
import { EffectsService } from '../challenge/services/effects.service';
import { WishlistService } from './services/wishlist.service';
import { WishlistFormComponent } from './components/wishlist-form/wishlist-form.component';
import { WishlistListComponent } from './components/wishlist-list/wishlist-list.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, WishlistFormComponent, WishlistListComponent, SectionHelpComponent],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class WishlistComponent {
  private wishlistService = inject(WishlistService);
  private effects = inject(EffectsService);

  items = signal<WishlistItem[]>([]);
  showForm = signal(false);
  editing = signal<WishlistItem | null>(null);

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
    if (editing) {
      this.wishlistService.updateItem({ ...editing, ...data }).subscribe();
    } else {
      this.wishlistService.addItem(data).subscribe();
    }
    this.showForm.set(false);
    this.editing.set(null);
  }

  onCancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  onDelete(id: string): void {
    this.wishlistService.deleteItem(id).subscribe();
  }

  onAchieved(item: WishlistItem): void {
    this.wishlistService.markAchieved(item).subscribe(() => {
      this.effects.goldBurst();
      setTimeout(() => this.effects.celebrate(), 600);
    });
  }
}
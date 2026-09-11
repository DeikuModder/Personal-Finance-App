import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WishlistItem } from '../../../../core/models/wishlist.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ImagePreviewComponent } from '../../../../shared/components/image-preview/image-preview.component';

@Component({
  selector: 'app-wishlist-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CurrencyFormatPipe, ImagePreviewComponent],
  templateUrl: './wishlist-list.html',
  styleUrl: './wishlist-list.scss',
})
export class WishlistListComponent {
  items = input<WishlistItem[]>([]);
  deleted = output<string>();
  edited = output<WishlistItem>();
  achieved = output<WishlistItem>();

  previewImage = signal<string | null>(null);

  showPrice(item: WishlistItem): boolean {
    return item.price > 0;
  }

  openImage(picture: string): void {
    this.previewImage.set(picture);
  }

  onEdit(item: WishlistItem, event: Event): void {
    event.stopPropagation();
    this.edited.emit(item);
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleted.emit(id);
  }

  onAchieved(item: WishlistItem, event: Event): void {
    event.stopPropagation();
    this.achieved.emit(item);
  }
}
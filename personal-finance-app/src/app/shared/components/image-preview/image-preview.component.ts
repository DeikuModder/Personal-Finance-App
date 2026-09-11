import { Component, HostListener, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-preview',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './image-preview.html',
  styleUrl: './image-preview.scss',
})
export class ImagePreviewComponent {
  image = input<string | null>(null);
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.image()) {
      this.closed.emit();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
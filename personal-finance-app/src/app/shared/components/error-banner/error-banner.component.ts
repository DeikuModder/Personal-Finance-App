import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './error-banner.html',
  styleUrl: './error-banner.scss',
})
export class ErrorBannerComponent {
  message = input<string | null>(null);
  dismissed = output<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
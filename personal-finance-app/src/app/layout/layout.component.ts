import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DebtReminderService } from '../features/debts/services/debt-reminder.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent {
  private reminderService = inject(DebtReminderService);

  reminderCount = signal(0);

  constructor() {
    this.reminderService.getBanner().subscribe((banner) => {
      this.reminderCount.set(banner.length);
    });
  }
}
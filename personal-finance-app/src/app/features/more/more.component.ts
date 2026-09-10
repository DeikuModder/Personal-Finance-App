import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MORE_GROUPS, SETTINGS, NavItem } from '../../layout/nav-items';
import { DebtReminderService } from '../debts/services/debt-reminder.service';

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './more.html',
  styleUrl: './more.scss',
})
export class MoreComponent {
  private reminderService = inject(DebtReminderService);

  readonly groups = MORE_GROUPS;
  readonly settings = SETTINGS;
  reminderCount = signal(0);

  constructor() {
    this.reminderService.getBanner().subscribe((banner) => {
      this.reminderCount.set(banner.length);
    });
  }

  isDebts(item: NavItem): boolean {
    return item.route === '/debts';
  }
}
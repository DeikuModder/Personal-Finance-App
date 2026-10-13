import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { MORE_GROUPS, SETTINGS, visibleGroups, NavItem } from '../../layout/nav-items';
import { DebtReminderService } from '../debts/services/debt-reminder.service';

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './more.html',
  styleUrl: './more.scss',
})
export class MoreComponent {
  private auth = inject(AuthService);
  private reminderService = inject(DebtReminderService);

  readonly groups = computed(() =>
    visibleGroups(MORE_GROUPS, this.auth.me()?.role === 'superadmin')
  );
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
import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';
import { DebtReminderService } from '../features/debts/services/debt-reminder.service';
import { TABS, NAV_GROUPS, SETTINGS, visibleGroups, NavItem } from './nav-items';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent {
  private auth = inject(AuthService);
  private reminderService = inject(DebtReminderService);

  reminderCount = signal(0);
  readonly tabs = TABS;
  readonly groups = computed(() =>
    visibleGroups(NAV_GROUPS, this.auth.me()?.role === 'superadmin')
  );
  readonly settings = SETTINGS;

  constructor() {
    this.reminderService.getBanner().subscribe((banner) => {
      this.reminderCount.set(banner.length);
    });
  }

  isDebts(item: NavItem): boolean {
    return item.route === '/debts';
  }
}
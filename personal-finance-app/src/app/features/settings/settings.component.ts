import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PinService } from '../../core/services/pin.service';
import { ApiKeyService } from '../investments/services/api-key.service';
import { AiAssistantService } from '../chat/services/ai-assistant.service';
import { DebtReminderService } from '../debts/services/debt-reminder.service';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { AllowedEmailItem, AuthService } from '../../core/auth/auth.service';
import { toErrorMessage } from '../../shared/utils/http-error.util';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    SectionHelpComponent,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  private pinService = inject(PinService);
  private apiKeyService = inject(ApiKeyService);
  private aiAssistant = inject(AiAssistantService);
  private reminderService = inject(DebtReminderService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly user = this.auth.me;
  isSuperadmin = computed(() => this.user()?.role === 'superadmin');
  roleLabel = computed(() => (this.user()?.role === 'superadmin' ? 'Superadmin' : 'User'));

  allowlist = signal<AllowedEmailItem[]>([]);
  newEmail = signal('');
  allowlistError = signal<string | null>(null);
  allowlistBusy = signal(false);
  private allowlistLoaded = false;

  constructor() {
    effect(() => {
      if (this.isSuperadmin() && !this.allowlistLoaded) {
        this.allowlistLoaded = true;
        this.loadAllowlist();
      }
    });
  }

  pinSet = signal(this.pinService.isPinSet());
  apiKey = signal(this.apiKeyService.getKey());
  apiKeySaved = signal(false);
  aiBaseUrl = signal(this.aiAssistant.getBaseUrl());
  aiStatus = signal<{ ok: boolean; text: string } | null>(null);
  aiTesting = signal(false);
  remindersEnabled = signal(this.reminderService.isEnabled());

  loadAllowlist(): void {
    this.auth.getAllowlist().subscribe({
      next: (items) => this.allowlist.set(items),
      error: () => {},
    });
  }

  addEmail(): void {
    const email = this.newEmail().trim();
    if (!email || this.allowlistBusy()) return;
    this.allowlistBusy.set(true);
    this.allowlistError.set(null);
    this.auth.addAllowlist(email).subscribe({
      next: (item) => {
        this.allowlist.update((list) => [...list, item]);
        this.newEmail.set('');
        this.allowlistBusy.set(false);
      },
      error: (err) => {
        this.allowlistBusy.set(false);
        this.allowlistError.set(toErrorMessage(err));
      },
    });
  }

  removeEmail(email: string): void {
    if (this.allowlistBusy()) return;
    this.allowlistBusy.set(true);
    this.allowlistError.set(null);
    this.auth.removeAllowlist(email).subscribe({
      next: () => {
        this.allowlist.update((list) => list.filter((e) => e.email !== email));
        this.allowlistBusy.set(false);
      },
      error: (err) => {
        this.allowlistBusy.set(false);
        this.allowlistError.set(toErrorMessage(err));
      },
    });
  }

  signOut(): void {
    this.auth.logout().subscribe();
  }

  toggleReminders(enable: boolean): void {
    this.remindersEnabled.set(enable);
    this.reminderService.setEnabled(enable);
  }

  saveApiKey(): void {
    this.apiKeyService.setKey(this.apiKey());
    this.apiKeySaved.set(true);
  }

  saveAiBaseUrl(): void {
    this.aiAssistant.setBaseUrl(this.aiBaseUrl());
    this.aiStatus.set({ ok: true, text: 'Saved.' });
  }

  testAiConnection(): void {
    this.aiTesting.set(true);
    this.aiStatus.set(null);
    this.aiAssistant.health().subscribe({
      next: (h) => {
        this.aiStatus.set({ ok: true, text: `Connected — ${h.status} (${h.timestamp})` });
      },
      error: () => {
        this.aiStatus.set({
          ok: false,
          text: 'Could not reach the assistant. Check that EV is running and allows this origin (CORS).',
        });
      },
      complete: () => this.aiTesting.set(false),
    });
  }

  clearData(): void {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  }

  resetPin(): void {
    this.pinService.removePin();
    this.pinSet.set(false);
    this.router.navigate(['/auth/setup']);
  }

  exportData(): void {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = JSON.parse(localStorage.getItem(key) || 'null');
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Record<string, unknown>;
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
        alert('Import complete. Reloading…');
        window.location.reload();
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }
}
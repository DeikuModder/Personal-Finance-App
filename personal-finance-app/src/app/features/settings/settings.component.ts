import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PinService } from '../../core/services/pin.service';
import { ApiKeyService } from '../investments/services/api-key.service';
import { AiAssistantService } from '../chat/services/ai-assistant.service';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';

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
    SectionHelpComponent,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  private pinService = inject(PinService);
  private apiKeyService = inject(ApiKeyService);
  private aiAssistant = inject(AiAssistantService);
  private router = inject(Router);

  pinSet = signal(this.pinService.isPinSet());
  apiKey = signal(this.apiKeyService.getKey());
  apiKeySaved = signal(false);
  aiBaseUrl = signal(this.aiAssistant.getBaseUrl());
  aiStatus = signal<{ ok: boolean; text: string } | null>(null);
  aiTesting = signal(false);

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
import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PrivacyService } from '../../../core/services/privacy.service';

@Component({
  selector: 'app-privacy-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './privacy-toggle.html',
  styleUrl: './privacy-toggle.scss',
})
export class PrivacyToggleComponent {
  section = input<string | undefined>();
  master = input(false);

  private readonly privacy = inject(PrivacyService);

  active = computed(() => {
    if (this.master()) {
      return this.privacy.masterHidden();
    }
    const section = this.section();
    return section ? this.privacy.isSectionHidden(section) : false;
  });

  label = computed(() => {
    if (this.master()) {
      return 'Privacy mode';
    }
    return this.section() ?? 'amounts';
  });

  tooltip = computed(() =>
    this.active() ? `Show ${this.label()}` : `Hide ${this.label()}`
  );

  onClick(): void {
    if (this.master()) {
      this.privacy.toggleMaster();
    } else if (this.section()) {
      this.privacy.toggleSection(this.section()!);
    }
  }
}
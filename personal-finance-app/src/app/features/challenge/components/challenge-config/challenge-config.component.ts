import { Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChallengeConfig } from '../../../../core/models/challenge.model';

@Component({
  selector: 'app-challenge-config',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './challenge-config.html',
  styleUrl: './challenge-config.scss',
})
export class ChallengeConfigComponent implements OnInit {
  config = input<ChallengeConfig | null>();
  saved = output<{ monthlyIncome: number; weeklyMax: number }>();
  cancelled = output<void>();

  monthlyIncome = signal(0);
  weeklyMax = signal(0);

  ngOnInit(): void {
    const c = this.config();
    if (c) {
      this.monthlyIncome.set(c.monthlyIncome);
      this.weeklyMax.set(c.weeklyMax);
    }
  }

  onSubmit(): void {
    if (this.monthlyIncome() <= 0 || this.weeklyMax() <= 0) return;
    this.saved.emit({
      monthlyIncome: this.monthlyIncome(),
      weeklyMax: this.weeklyMax(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
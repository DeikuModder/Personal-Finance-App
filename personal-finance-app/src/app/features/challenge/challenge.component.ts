import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Transaction } from '../../core/models/transaction.model';
import { ChallengeConfig, DEFAULT_CHALLENGE_CONFIG } from '../../core/models/challenge.model';
import { ChallengeService } from './services/challenge.service';
import { EffectsService } from './services/effects.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { ChallengeConfigComponent } from './components/challenge-config/challenge-config.component';
import { WeekCardComponent } from './components/week-card/week-card.component';
import { MonthResultComponent } from './components/month-result/month-result.component';
import { MonthBarsComponent } from './components/charts/month-bars/month-bars.component';
import { CumulativeLineComponent } from './components/charts/cumulative-line/cumulative-line.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { PrivacyToggleComponent } from '../../shared/components/privacy-toggle/privacy-toggle.component';
import { toLocalDate, dateKey } from '../../core/utils/date.util';

interface Level {
  name: string;
  threshold: number;
}

const LEVELS: Level[] = [
  { name: 'Rookie', threshold: 0 },
  { name: 'Saver', threshold: 100 },
  { name: 'Super Saver', threshold: 500 },
  { name: 'Money Master', threshold: 1500 },
  { name: 'Legend', threshold: 4000 },
];

@Component({
  selector: 'app-challenge',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    ChallengeConfigComponent,
    WeekCardComponent,
    MonthResultComponent,
    MonthBarsComponent,
    CumulativeLineComponent,
    SectionHelpComponent,
    PrivacyToggleComponent,
  ],
  templateUrl: './challenge.html',
  styleUrl: './challenge.scss',
})
export class ChallengeComponent implements OnInit {
  private challengeService = inject(ChallengeService);
  private effects = inject(EffectsService);
  private transactionService = inject(TransactionService);

  config = signal<ChallengeConfig>({ ...DEFAULT_CHALLENGE_CONFIG });
  showSetup = signal(false);
  monthTransactions = signal<Transaction[]>([]);
  startDate = signal<Date | null>(null);

  year = new Date().getFullYear();
  month = new Date().getMonth();
  currentLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  protected weeks = computed(() => {
    if (!this.config().enabled) return [];
    const spent = this.challengeService.getAllSpent(this.monthTransactions(), this.year, this.month);
    return this.challengeService.computeWeeks(this.config(), spent, this.year, this.month);
  });

  protected stats = computed(() => {
    const config = this.config();
    if (!config.enabled) return { totalSpent: 0, savedLost: 0, cumulative: [] };
    const spent = this.challengeService.getAllSpent(this.monthTransactions(), this.year, this.month);
    return this.challengeService.getMonthStats(config, spent);
  });

  ngOnInit(): void {
    this.challengeService.getConfig().subscribe((cfg) => {
      this.config.set(cfg);
      this.detectEffects();
    });
    this.transactionService.getTransactions().subscribe((all) => {
      this.setGameWindow(all);
      this.detectEffects();
    });
  }

  private setGameWindow(all: Transaction[]): void {
    let min: Date | null = null;
    for (const t of all) {
      const d = toLocalDate(t.date);
      if (!min || d.getTime() < min.getTime()) min = d;
    }
    this.startDate.set(min);

    const buckets = this.challengeService.getWeekBuckets(this.year, this.month);
    const startKey = dateKey(buckets[0]?.startDate ?? new Date(this.year, this.month, 1));
    const endKey = dateKey(buckets[buckets.length - 1]?.endDate ?? new Date(this.year, this.month + 1, 0));

    this.monthTransactions.set(
      all.filter((t) => {
        const key = dateKey(toLocalDate(t.date));
        return key >= startKey && key <= endKey;
      })
    );
  }

  private lastSignatures = new Map<number, string>();

  private detectEffects(): void {
    for (const w of this.weeks()) {
      const sig = `${w.bucket.index}:${w.status}`;
      if (!this.lastSignatures.has(w.bucket.index)) {
        this.lastSignatures.set(w.bucket.index, sig);
        continue;
      }
      const prev = this.lastSignatures.get(w.bucket.index);
      if (prev !== sig) {
        if (w.status === 'good') {
          this.effects.celebrate();
        }
        this.lastSignatures.set(w.bucket.index, sig);
      }
    }
  }

  get isConfigured(): boolean {
    return this.config().enabled && this.config().weeklyMax > 0;
  }

  get totalSaved(): number {
    return this.stats().cumulative.reduce((a, b) => a + b, 0);
  }

  get level(): Level {
    let current = LEVELS[0];
    for (const l of LEVELS) {
      if (this.totalSaved >= l.threshold) current = l;
    }
    return current;
  }

  get levelProgress(): number {
    const idx = LEVELS.findIndex((l) => l.name === this.level.name);
    const next = LEVELS[idx + 1];
    if (!next) return 100;
    const base = LEVELS[idx].threshold;
    return Math.min(100, ((this.totalSaved - base) / (next.threshold - base)) * 100);
  }

  get streak(): number {
    let count = 0;
    for (const w of [...this.weeks()].reverse()) {
      if (w.status === 'good') count++;
      else break;
    }
    return count;
  }

  get hearts(): number {
    const over = this.weeks().filter((w) => w.status === 'over').length;
    return Math.max(0, 5 - over);
  }

  get monthComplete(): boolean {
    const lastDay = new Date(this.year, this.month + 1, 0);
    return dateKey(new Date()) > dateKey(lastDay);
  }

  get currentWeekIndex(): number {
    const todayKey = dateKey(new Date());
    for (const w of this.weeks()) {
      if (todayKey >= dateKey(w.bucket.startDate) && todayKey <= dateKey(w.bucket.endDate)) {
        return w.bucket.index;
      }
    }
    return this.weeks()[this.weeks().length - 1]?.bucket.index ?? 0;
  }

  barData = computed(() => {
    return this.weeks().map((w) => ({
      label: w.bucket.label,
      spent: w.spent,
      cap: w.cap,
    }));
  });

  cumLabels = computed(() => {
    return this.weeks().map((w) => w.bucket.label);
  });

  startSetup(): void {
    this.showSetup.set(true);
  }

  onSaved(data: { monthlyIncome: number; weeklyMax: number }): void {
    const cfg: ChallengeConfig = {
      ...this.config(),
      monthlyIncome: data.monthlyIncome,
      weeklyMax: data.weeklyMax,
      enabled: true,
      createdAt: this.config().createdAt || new Date().toISOString(),
    };
    this.challengeService.setConfig(cfg).subscribe(() => {
      this.config.set(cfg);
      this.showSetup.set(false);
    });
  }

  onCancelSetup(): void {
    this.showSetup.set(false);
  }

  onCloseResult(): void {
    this.showSetup.set(true);
  }
}
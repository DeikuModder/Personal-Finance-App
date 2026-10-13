import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PrivacyService } from '../../core/services/privacy.service';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { PrivacyToggleComponent } from '../../shared/components/privacy-toggle/privacy-toggle.component';
import {
  SimulatorService,
  SimulatorStats,
  SimulationResult,
  Scenario,
  OneOff,
  ReportResult,
  InterpretResult,
} from './services/simulator.service';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
]);

const MASK = '\u2022\u2022\u2022\u2022';
const PALETTE = ['#ff6e6e', '#03dac6', '#64b5f6', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292', '#9575cd'];

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [
    NgxEchartsDirective,
    MatIconModule,
    MatButtonModule,
    SectionHelpComponent,
    PrivacyToggleComponent,
    KeyValuePipe,
  ],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simulator.html',
  styleUrl: './simulator.scss',
})
export class SimulatorComponent {
  private sim = inject(SimulatorService);
  private privacy = inject(PrivacyService);

  stats = signal<SimulatorStats | null>(null);
  loadingStats = signal(true);

  /* ------- form state ------- */
  horizon = signal(12);
  startMonth = signal('');
  income = signal(0);
  incomeVolatility = signal(0.2);
  savingsMode = signal<'rate' | 'fixed'>('rate');
  savingsRate = signal(0);
  fixedSavings = signal(0);
  inflationDrift = signal(2);
  multipliers = signal<Record<string, number>>({});
  oneOffs = signal<OneOff[]>([]);
  includeGoals = signal(true);
  includeDebts = signal(true);
  includeWishlist = signal(true);

  /* ------- run state ------- */
  result = signal<SimulationResult | null>(null);
  running = signal(false);

  /* ------- AI state ------- */
  interpretText = signal('');
  interpretLoading = signal(false);
  pendingInterpret = signal<InterpretResult | null>(null);
  report = signal<ReportResult | null>(null);
  reportLoading = signal(false);
  aiError = signal('');

  private runTimer: any = null;

  ngOnInit(): void {
    this.sim.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loadingStats.set(false);
        this.income.set(s.incomeDefault || s.monthlyIncome.mean || 0);
        this.incomeVolatility.set(clamp(s.monthlyIncome.cv || 0.2, 0.05, 0.6));
        this.startMonth.set(nextMonthKey());
        this.scheduleRun();
      },
      error: () => {
        this.loadingStats.set(false);
      },
    });
  }

  /* ------- derived helpers ------- */

  topCategories = computed(() => {
    const c = this.stats()?.categories ?? [];
    return c.slice(0, 6);
  });

  monthsList = computed(() => {
    const h = this.horizon();
    const s = this.startMonth();
    if (!s) return [];
    const [y, m] = s.split('-').map(Number);
    const out: string[] = [];
    for (let i = 0; i < h; i++) {
      const d = new Date(y, m - 1 + i, 1);
      out.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }
    return out;
  });

  wishlistOptions = computed(() => (this.stats()?.wishlist ?? []).map((w) => ({ name: w.name, price: w.price })));

  mask = computed(() => this.privacy.hiddenFor('transactions'));

  usd = (v: number): string => this.mask() ? MASK : this.simFormat(v);

  hasKeys = (obj: any): number => (obj ? Object.keys(obj).length : 0);

  num = (v: any): number => Number(v);

  simFormat = (v: number): string =>
    '$' + (v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  pct = (v: number): string => (v ?? 0).toFixed(1) + '%';

  /* ------- scenario / run ------- */

  buildScenario(): Scenario {
    const sc: Scenario = {
      monthlyIncome: this.income(),
      incomeVolatility: this.incomeVolatility(),
      inflationDrift: this.inflationDrift(),
      categoryMultipliers: this.multipliers(),
      oneOffs: this.oneOffs().filter((o) => o.amount > 0),
      includeGoals: this.includeGoals(),
      includeDebts: this.includeDebts(),
      includeWishlist: this.includeWishlist(),
    };
    if (this.savingsMode() === 'rate') {
      sc.savingsRate = this.savingsRate();
    } else {
      sc.fixedSavings = this.fixedSavings();
    }
    return sc;
  }

  private buildRequest() {
    return {
      horizonMonths: this.horizon(),
      startMonth: this.startMonth(),
      paths: 1000,
      scenario: this.buildScenario(),
    };
  }

  scheduleRun(): void {
    if (this.runTimer) clearTimeout(this.runTimer);
    this.runTimer = setTimeout(() => this.run(), 450);
  }

  run(): void {
    if (!this.stats()) return;
    const req = this.buildRequest();
    this.running.set(true);
    this.report.set(null);
    this.sim.run(req).subscribe({
      next: (r) => {
        this.result.set(r);
        this.running.set(false);
      },
      error: () => this.running.set(false),
    });
  }

  runNow(): void {
    if (this.runTimer) clearTimeout(this.runTimer);
    this.run();
  }

  /* ------- one-off events ------- */

  addOneOff(): void {
    this.oneOffs.update((list) => [...list, { monthOffset: 0, category: '', amount: 0 }]);
    this.scheduleRun();
  }

  removeOneOff(index: number): void {
    this.oneOffs.update((list) => list.filter((_, i) => i !== index));
    this.scheduleRun();
  }

  updateOneOff(index: number, patch: Partial<OneOff>): void {
    this.oneOffs.update((list) => list.map((o, i) => (i === index ? { ...o, ...patch } : o)));
    this.scheduleRun();
  }

  addWishlistOneOff(name: string, price: number): void {
    this.oneOffs.update((list) => [...list, { monthOffset: 0, category: name, amount: price }]);
    this.scheduleRun();
  }

  /* ------- category multipliers ------- */

  multiplierOf(category: string): number {
    return this.multipliers()[category] ?? 1;
  }

  nudgeMultiplier(category: string, delta: number): void {
    this.multipliers.update((m) => {
      const cur = m[category] ?? 1;
      return { ...m, [category]: clamp(Math.round((cur + delta) * 1000) / 1000, 0.3, 3) };
    });
    this.scheduleRun();
  }

  resetMultipliers(): void {
    this.multipliers.set({});
    this.scheduleRun();
  }

  setMultiplier(category: string, event: Event): void {
    const v = parseFloat((event.target as HTMLInputElement).value);
    this.multipliers.update((m) => ({ ...m, [category]: clamp(v, 0.3, 3) }));
    this.scheduleRun();
  }

  /* ------- AI: interpret ------- */

  interpret(): void {
    const text = this.interpretText().trim();
    if (!text) return;
    this.interpretLoading.set(true);
    this.aiError.set('');
    this.sim.interpret({ text, scenario: this.buildScenario() }).subscribe({
      next: (r) => {
        this.pendingInterpret.set(r);
        this.interpretLoading.set(false);
      },
      error: (e) => {
        this.interpretLoading.set(false);
        this.aiError.set(extractError(e));
      },
    });
  }

  applyPending(): void {
    const p = this.pendingInterpret();
    if (!p) return;
    this.applyPatch(p);
    this.pendingInterpret.set(null);
    this.interpretText.set('');
    this.scheduleRun();
  }

  discardPending(): void {
    this.pendingInterpret.set(null);
  }

  private applyPatch(p: InterpretResult): void {
    const stats = this.stats();
    const defaults = {
      monthlyIncome: stats?.incomeDefault || 0,
      incomeVolatility: clamp(stats?.monthlyIncome.cv || 0.2, 0.05, 0.6),
      savingsRate: 0,
      fixedSavings: 0,
      inflationDrift: 2,
      categoryMultipliers: {} as Record<string, number>,
      oneOffs: [] as OneOff[],
    };
    const patch = { ...defaults, ...p.patch };
    for (const key of p.clear) {
      if (key in defaults) (patch as any)[key] = (defaults as any)[key];
    }
    this.income.set(patch.monthlyIncome);
    this.incomeVolatility.set(patch.incomeVolatility);
    this.savingsMode.set(patch.fixedSavings > 0 ? 'fixed' : 'rate');
    this.savingsRate.set(patch.savingsRate);
    this.fixedSavings.set(patch.fixedSavings);
    this.inflationDrift.set(patch.inflationDrift);
    this.multipliers.set(patch.categoryMultipliers ?? {});
    this.oneOffs.set(patch.oneOffs ?? []);
  }

  /* ------- AI: report ------- */

  generateReport(): void {
    this.reportLoading.set(true);
    this.aiError.set('');
    this.sim.report(this.buildRequest()).subscribe({
      next: (r) => {
        this.report.set(r);
        this.reportLoading.set(false);
      },
      error: (e) => {
        this.reportLoading.set(false);
        this.aiError.set(extractError(e));
      },
    });
  }

  /* ------- charts ------- */

  balanceChart = computed<EChartsOption>(() => {
    const r = this.result();
    if (!r) return emptyChart();
    const labels = r.month.map((m) => m.label);
    const p50 = r.month.map((m) => m.balance.p50);
    const lower = r.month.map((m) => m.balance.p5);
    const band = r.month.map((m) => Math.max(0, m.balance.p95 - m.balance.p5));
    const mask = this.mask();
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params?.[params.length - 1]?.dataIndex ?? 0;
          const m = r.month[idx];
          if (!m || mask) return `${labels[idx]}<br/>$${MASK}`;
          let html = `${labels[idx]}<br/>`;
          html += `Balance P50: $${fmt0(m.balance.p50)}<br/>`;
          html += `Range P5-P95: $${fmt0(m.balance.p5)} - $${fmt0(m.balance.p95)}<br/>`;
          html += `Spent: $${fmt0(m.spent.p50)} (P25 $${fmt0(m.spent.p25)} - P75 $${fmt0(m.spent.p75)})`;
          return html;
        },
      },
      grid: { left: 8, right: 8, top: 30, bottom: 0, containLabel: true },
      xAxis: axisCat(labels),
      yAxis: axisVal(),
      series: [
        {
          name: 'P5',
          type: 'line',
          stack: 'band',
          data: lower,
          symbol: 'none',
          lineStyle: { opacity: 0, width: 0, color: 'transparent' },
          itemStyle: { opacity: 0 },
          emphasis: { disabled: true },
          areaStyle: { color: 'rgba(0,0,0,0)' },
        },
        {
          name: 'P95',
          type: 'line',
          stack: 'band',
          data: band,
          symbol: 'none',
          lineStyle: { opacity: 0, width: 0, color: 'transparent' },
          itemStyle: { opacity: 0 },
          emphasis: { disabled: true },
          areaStyle: { color: 'rgba(255,110,110,0.18)' },
        },
        {
          name: 'P50 balance',
          type: 'line',
          data: p50,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#ff6e6e', width: 2 },
          itemStyle: { color: '#ff6e6e' },
        },
      ],
    };
  });

  spendChart = computed<EChartsOption>(() => {
    const r = this.result();
    if (!r) return emptyChart();
    const labels = r.month.map((m) => m.label);
    const spent = r.month.map((m) => m.spent.p50);
    const saved = r.month.map((m) => m.saved.p50);
    const mask = this.mask();
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (mask) return `$${MASK}`;
          let html = '';
          for (const p of params) {
            html += `${p.marker}${p.seriesName}: $${fmt0(p.value)}<br/>`;
          }
          return html;
        },
      },
      legend: { data: ['Spent', 'Saved'], textStyle: { color: '#9e9e9e', fontSize: 11 }, itemWidth: 12, itemHeight: 12, top: 0 },
      grid: { left: 8, right: 8, top: 32, bottom: 0, containLabel: true },
      xAxis: axisCat(labels),
      yAxis: axisVal(),
      series: [
        {
          name: 'Spent',
          type: 'bar',
          data: spent,
          barMaxWidth: 14,
          itemStyle: { color: '#ff6e6e', borderRadius: [4, 4, 0, 0], opacity: 0.85 },
        },
        {
          name: 'Saved',
          type: 'line',
          data: saved,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#03dac6', width: 2 },
          itemStyle: { color: '#03dac6' },
        },
      ],
    };
  });

  categoryChart = computed<EChartsOption>(() => {
    const r = this.result();
    if (!r) return emptyChart();
    const cats = r.categories.filter((c) => c.totalP50 > 0).slice(0, 8);
    const mask = this.mask();
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => {
          if (mask) return `$${MASK}`;
          const c = cats[p.dataIndex];
          return `${p.marker}${c.category}: $${fmt0(c.monthlyP50)}/mo (${p.percent}%)`;
        },
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 4,
        top: 'middle',
        textStyle: { color: '#9e9e9e', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['38%', '50%'],
          itemStyle: { borderColor: '#1e1e1e', borderWidth: 2 },
          label: { show: false },
          data: cats.map((c, i) => ({
            name: c.category,
            value: Math.round(c.totalP50 * 100) / 100,
            itemStyle: { color: PALETTE[i % PALETTE.length] },
          })),
        },
      ],
    };
  });
}

/* ---------- helpers ---------- */

function emptyChart(): EChartsOption {
  return {
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    series: [],
  } as EChartsOption;
}

function axisCat(labels: string[]) {
  return {
    type: 'category' as const,
    data: labels,
    axisLabel: { color: '#9e9e9e', fontSize: 10 },
    axisLine: { lineStyle: { color: '#424242' } },
  };
}

function axisVal() {
  return {
    type: 'value' as const,
    axisLabel: { color: '#9e9e9e', fontSize: 10, formatter: (v: number) => `$${v}` },
    splitLine: { lineStyle: { color: '#2c2c2c' } },
  };
}

function fmt0(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function nextMonthKey(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function extractError(err: any): string {
  const body = err?.error;
  if (typeof body === 'string') return body;
  return body?.message ?? 'Something went wrong.';
}
import { SimulatorStats } from './history.stats';
import { SimulatorRunDto } from './simulator.dto';

export interface Percentiles {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface MonthResult {
  index: number;
  label: string;
  spent: Percentiles;
  saved: Percentiles;
  balance: Percentiles;
}

export interface SimulationResult {
  horizonMonths: number;
  startMonth: string;
  labels: string[];
  month: MonthResult[];
  totals: {
    spentP25: number;
    spentP50: number;
    spentP75: number;
    savedP25: number;
    savedP50: number;
    savedP75: number;
    finalBalanceP50: number;
    minBalanceP50: number;
  };
  goalProbability: number | null;
  negativeBalanceProbability: number;
  categories: { category: string; monthlyP50: number; totalP50: number; share: number }[];
  paths: { balance: number[] }[];
}

interface CategoryInput {
  category: string;
  mean: number;
  std: number;
  multiplier: number;
}

interface OneOffInput {
  monthOffset: number;
  amount: number;
}

interface EngineScenario {
  monthlyIncome: number;
  incomeVolatility: number;
  savingsRate: number;
  fixedSavings: number;
  inflationDrift: number;
  categories: CategoryInput[];
  seasonality: number[];
  oneOffs: OneOffInput[];
  debtMonthly: number;
  goalMonthly: number;
  goalTarget: number;
}

export interface EngineInput {
  horizonMonths: number;
  start: { year: number; month: number };
  pathsCount: number;
  startBalance: number;
  scenario: EngineScenario;
}

export function runSimulation(stats: SimulatorStats, dto: SimulatorRunDto): SimulationResult {
  const horizon = clampInt(dto.horizonMonths, 1, 36);
  const pathsCount = clampInt(dto.paths ?? 1000, 100, 5000);
  const start = resolveStart(dto.startMonth);
  const startMonth = `${start.year}-${pad(start.month + 1)}`;

  const sc = dto.scenario ?? {};
  const income = pick(sc.monthlyIncome, stats.incomeDefault);
  const cv = pick(sc.incomeVolatility, clamp(stats.monthlyIncome.cv || 0.5, 0.05, 0.6));

  const categories: CategoryInput[] = stats.categories.map((c) => ({
    category: c.category,
    mean: c.monthlyMean,
    std: c.monthlyStd,
    multiplier: sc.categoryMultipliers?.[c.category] ?? 1,
  }));

  const oneOffs: OneOffInput[] = (sc.oneOffs ?? []).map((o) => ({
    monthOffset: clampInt(o.monthOffset, 0, horizon - 1),
    amount: Math.max(0, o.amount),
  }));

  const includeGoals = sc.includeGoals !== false;
  const includeDebts = sc.includeDebts !== false;
  const includeWishlist = sc.includeWishlist !== false;

  const goalPlan = includeGoals ? planGoals(stats, start, horizon) : { monthly: 0, target: 0 };
  const debtMonthly = includeDebts
    ? stats.debts.reduce((s, d) => s + (d.minimumPayment > 0 ? d.minimumPayment : d.amountOwed / 12), 0)
    : 0;

  if (includeWishlist) {
    stats.wishlist.forEach((w, i) => {
      const offset = stats.wishlist.length > 0 ? Math.min(horizon - 1, Math.floor((i * horizon) / stats.wishlist.length)) : 0;
      oneOffs.push({ monthOffset: offset, amount: Math.max(0, w.price) });
    });
  }

  const scenario: EngineScenario = {
    monthlyIncome: income,
    incomeVolatility: cv,
    savingsRate: clamp(sc.savingsRate ?? 0, 0, 1),
    fixedSavings: Math.max(0, sc.fixedSavings ?? 0),
    inflationDrift: clamp(sc.inflationDrift ?? 2, -10, 60),
    categories,
    seasonality: stats.seasonality,
    oneOffs,
    debtMonthly,
    goalMonthly: goalPlan.monthly,
    goalTarget: goalPlan.target,
  };

  return monteCarlo({
    horizonMonths: horizon,
    start,
    pathsCount,
    startBalance: stats.balances.total,
    scenario,
  });
}

/* ---------- Monte Carlo core ---------- */

export function monteCarlo(input: EngineInput): SimulationResult {
  const { horizonMonths, pathsCount, startBalance, scenario } = input;
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const rng = mulberry32(seed);

  /* Buffers: per month, list of path values. */
  const spentByMonth: number[][] = new Array(horizonMonths).fill(0).map(() => []);
  const savedByMonth: number[][] = new Array(horizonMonths).fill(0).map(() => []);
  const balanceByMonth: number[][] = new Array(horizonMonths).fill(0).map(() => []);

  const catTotals: Record<string, number[]> = {};
  for (const c of scenario.categories) catTotals[c.category] = [];

  const totspent: number[] = [];
  const totsaved: number[] = [];
  const pathMinBalance: number[] = [];
  let negBalancePaths = 0;
  let goalMetPaths = 0;

  const pathStep = Math.max(1, Math.floor(pathsCount / 50));
  const paths: { balance: number[] }[] = [];

  const oneOffsByMonth: number[][] = new Array(horizonMonths).fill(0).map(() => []);
  for (const o of scenario.oneOffs) oneOffsByMonth[o.monthOffset].push(o.amount);

  for (let p = 0; p < pathsCount; p++) {
    let balance = startBalance;
    let cumSpent = 0;
    let cumSaved = 0;
    let minBalance = startBalance;
    const balanceTrace: number[] = [];

    for (let m = 0; m < horizonMonths; m++) {
      const calMonth = (input.start.month + m) % 12;
      const seasonal = scenario.seasonality[calMonth] ?? 1;
      const d = Math.pow(1 + scenario.inflationDrift / 100 / 12, m);

      const income = sampleIncome(scenario.monthlyIncome, scenario.incomeVolatility, rng);

      let otherSpend = 0;
      for (const c of scenario.categories) {
        const base = sampleCategory(c.mean, c.std, rng, seasonal, c.multiplier) * d;
        otherSpend += base;
        const arr = catTotals[c.category];
        if (arr) arr[p] = (arr[p] ?? 0) + base;
      }
      for (const amt of oneOffsByMonth[m]) {
        otherSpend += amt;
        const arr = catTotals['One-offs'];
        if (arr) arr[p] = (arr[p] ?? 0) + amt;
      }

      const { goalSav, allowOther } = splitSave(
        income,
        scenario.debtMonthly,
        scenario.goalMonthly,
        scenario.savingsRate,
        scenario.fixedSavings
      );

      otherSpend = Math.min(Math.max(otherSpend, 0), Math.max(0, allowOther));

      const spent = otherSpend + scenario.debtMonthly;
      const saved = income - spent - goalSav;
      balance += saved;

      cumSpent += spent;
      cumSaved += saved;
      if (balance < minBalance) minBalance = balance;

      spentByMonth[m].push(spent);
      savedByMonth[m].push(saved);
      balanceByMonth[m].push(balance);
      balanceTrace.push(balance);
    }

    totspent.push(cumSpent);
    totsaved.push(cumSaved);
    pathMinBalance.push(minBalance);
    if (Math.min(...balanceTrace) < 0) negBalancePaths++;
    if (scenario.goalTarget > 0 && cumSaved >= scenario.goalTarget) goalMetPaths++;
    if (p % pathStep === 0) paths.push({ balance: balanceTrace.slice() });
  }

  const labels = monthLabels(input.start.year, input.start.month, horizonMonths);
  const startMonth = `${input.start.year}-${pad(input.start.month + 1)}`;
  const month: MonthResult[] = [];
  for (let m = 0; m < horizonMonths; m++) {
    month.push({
      index: m,
      label: labels[m],
      spent: percentilesOf(spentByMonth[m]),
      saved: percentilesOf(savedByMonth[m]),
      balance: percentilesOf(balanceByMonth[m]),
    });
  }

  const categories = Object.entries(catTotals)
    .map(([category, values]) => {
      const totalP50 = percentile(values, 0.5);
      const monthlyP50 = totalP50 / horizonMonths;
      return { category, monthlyP50: round2(monthlyP50), totalP50: round2(totalP50), share: 0 };
    })
    .filter((c) => c.totalP50 > 0)
    .sort((a, b) => b.totalP50 - a.totalP50);

  const totalCat = categories.reduce((s, c) => s + c.totalP50, 0);
  for (const c of categories) c.share = totalCat > 0 ? round3(c.totalP50 / totalCat) : 0;

  return {
    horizonMonths,
    startMonth,
    labels,
    month,
    totals: {
      spentP25: round2(percentile(totspent, 0.25)),
      spentP50: round2(percentile(totspent, 0.5)),
      spentP75: round2(percentile(totspent, 0.75)),
      savedP25: round2(percentile(totsaved, 0.25)),
      savedP50: round2(percentile(totsaved, 0.5)),
      savedP75: round2(percentile(totsaved, 0.75)),
      finalBalanceP50: round2(percentile(balanceByMonth[horizonMonths - 1], 0.5)),
      minBalanceP50: round2(percentile(pathMinBalance, 0.5)),
    },
    goalProbability:
      scenario.goalTarget > 0 ? Math.round((goalMetPaths / pathsCount) * 1000) / 10 : null,
    negativeBalanceProbability: Math.round((negBalancePaths / pathsCount) * 1000) / 10,
    categories,
    paths,
  };
}

/* ---------- sampling helpers ---------- */

function sampleIncome(mean: number, cv: number, rng: () => number): number {
  if (mean <= 0) return 0;
  if (cv <= 0) return mean;
  const n = gaussian(rng);
  return Math.max(0, mean * (1 + cv * n));
}

function sampleCategory(
  mean: number,
  std: number,
  rng: () => number,
  seasonal: number,
  multiplier: number
): number {
  if (mean <= 0) return 0;
  if (std <= 0) return mean * multiplier * seasonal;
  const ratio = std / mean;
  const sigmaLog = Math.sqrt(Math.log(1 + ratio * ratio + 1e-9));
  const draw = mean * Math.exp(sigmaLog * gaussian(rng) - (sigmaLog * sigmaLog) / 2);
  return Math.max(0, draw) * multiplier * seasonal;
}

/* Splits a month's income into: goal contribution + allowed "other" spend. */
function splitSave(
  income: number,
  debtMonthly: number,
  goalMonthly: number,
  savingsRate: number,
  fixedSavings: number
): { goalSav: number; allowOther: number } {
  const goalSav = Math.max(0, Math.min(goalMonthly, Math.max(0, income - debtMonthly)));
  let allowOther = income - debtMonthly - goalSav;
  if (fixedSavings > 0) {
    allowOther = Math.max(0, income - fixedSavings - debtMonthly - goalSav);
  } else if (savingsRate > 0) {
    const targetSpend = income * (1 - savingsRate);
    allowOther = Math.max(0, Math.min(allowOther, Math.max(0, targetSpend - debtMonthly - goalSav)));
  }
  return { goalSav, allowOther };
}

function planGoals(
  stats: SimulatorStats,
  start: { year: number; month: number },
  horizon: number
): { monthly: number; target: number } {
  let monthly = 0;
  let target = 0;
  const startMonths = start.year * 12 + start.month;
  for (const g of stats.goals) {
    if (!g.targetAmount || g.targetAmount <= 0) continue;
    target += g.targetAmount;
    if (g.allowance && g.allowance > 0) {
      const perMonth = g.allowancePeriod === 'day' ? g.allowance * 30 : g.allowance * (52 / 12);
      monthly += perMonth;
      continue;
    }
    let remaining = horizon;
    if (g.deadline) {
      const dd = g.deadline.split('-').map(Number);
      if (dd.length >= 2 && dd[0] > 1900) {
        const monthsToDeadline = dd[0] * 12 + (dd[1] - 1) - startMonths;
        if (monthsToDeadline > 0) remaining = Math.min(horizon, monthsToDeadline);
      }
    }
    monthly += g.targetAmount / Math.max(1, remaining);
  }
  return { monthly, target };
}

/* ---------- RNG / math ---------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return round2(sorted[lo]);
  return round2(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

function percentilesOf(values: number[]): Percentiles {
  return {
    p5: percentile(values, 0.05),
    p25: percentile(values, 0.25),
    p50: percentile(values, 0.5),
    p75: percentile(values, 0.75),
    p95: percentile(values, 0.95),
  };
}

function monthLabels(startYear: number, startMonth: number, count: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
  }
  return labels;
}

function resolveStart(value?: string): { year: number; month: number } {
  if (value) {
    const parts = value.split('-').map(Number);
    if (parts.length >= 2 && parts[0] > 1900 && parts[1] >= 1 && parts[1] <= 12) {
      return { year: parts[0], month: parts[1] - 1 };
    }
  }
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.round(clamp(v, lo, hi));
}

function pick(a: number | undefined, b: number): number {
  return a !== undefined && !Number.isNaN(a) ? a : b;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
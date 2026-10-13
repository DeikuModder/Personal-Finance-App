import { Transaction } from '../transactions/transaction.entity';
import { Account } from '../accounts/account.entity';
import { ChallengeConfig } from '../challenge/challenge-config.entity';
import { Goal } from '../goals/goal.entity';
import { Debt } from '../debts/debt.entity';
import { WishlistItem } from '../wishlist/wishlist-item.entity';

export interface MonthPoint {
  key: string;
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
}

export interface CategoryStat {
  category: string;
  monthlyMean: number;
  monthlyStd: number;
  share: number;
}

export interface OneOffFlag {
  key: string;
  category: string;
  amount: number;
  zScore: number;
}

export interface SimulatorStats {
  currency: string;
  aiEnabled: boolean;
  aiModel: string;
  monthlyIncome: {
    mean: number;
    std: number;
    cv: number;
    months: { key: string; amount: number }[];
  };
  monthlySpend: { mean: number; std: number; months: MonthPoint[] };
  categories: CategoryStat[];
  seasonality: number[];
  oneOffFlags: OneOffFlag[];
  balances: { total: number; accounts: { id: string; name: string; type: string; balance: number }[] };
  incomeDefault: number;
  goals: Goal[];
  debts: Debt[];
  wishlist: WishlistItem[];
  historyStart: string;
  historyEnd: string;
}

export function computeHistoryStats(params: {
  transactions: Transaction[];
  accounts: Account[];
  challenge: ChallengeConfig | null;
  goals: Goal[];
  debts: Debt[];
  wishlist: WishlistItem[];
}): SimulatorStats {
  const { transactions, accounts, challenge, goals, debts, wishlist } = params;

  const buckets = new Map<string, MonthPoint>();
  let historyStart = '';
  let historyEnd = '';

  for (const tx of transactions) {
    if (tx.type === 'transfer') continue;
    const d = parseLocalDate(tx.date);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    let b = buckets.get(key);
    if (!b) {
      b = { key, label: monthLabel(d), year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 };
      buckets.set(key, b);
    }
    if (tx.type === 'income') b.income += tx.amount;
    else b.expense += tx.amount;
    if (!historyStart || key < historyStart) historyStart = key;
    if (!historyEnd || key > historyEnd) historyEnd = key;
  }

  const months = [...buckets.values()].sort((a, b) => (a.key < b.key ? -1 : 1));

  const incomeMonths = months.filter((m) => m.income > 0).map((m) => ({ key: m.key, amount: m.income }));
  const incomeMean = average(incomeMonths.map((m) => m.amount));
  const incomeStd = stdDev(incomeMonths.map((m) => m.amount));
  const incomeCv = incomeMean > 0 ? incomeStd / incomeMean : 0.5;

  const spendValues = months.map((m) => m.expense);
  const spendMean = average(spendValues);
  const spendStd = stdDev(spendValues);

  /* Per-category monthly means over the trailing 12 months. */
  const winStartKey = trailingKey(historyEnd, 11);
  const categories = computeCategories(
    transactions.filter((t) => t.type === 'expense'),
    months,
    winStartKey
  );

  const seasonality = computeSeasonality(months);
  const oneOffFlags = computeOneOffs(transactions.filter((t) => t.type === 'expense'), months, winStartKey);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const incomeDefault =
    challenge && challenge.enabled && challenge.monthlyIncome > 0 ? challenge.monthlyIncome : incomeMean;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeDebts = debts.filter((d) => d.status === 'active' && d.type === 'payable');
  const activeWishlist = wishlist.filter((w) => w.status === 'active');

  return {
    currency: 'USD',
    aiEnabled: !!(process.env.OPENROUTER_API_KEY || '').trim(),
    aiModel: process.env.SIMULATOR_AI_MODEL || 'openrouter/auto',
    monthlyIncome: { mean: incomeMean, std: incomeStd, cv: incomeCv, months: incomeMonths },
    monthlySpend: { mean: spendMean, std: spendStd, months },
    categories,
    seasonality,
    oneOffFlags,
    balances: {
      total: totalBalance,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
    },
    incomeDefault,
    goals: activeGoals,
    debts: activeDebts,
    wishlist: activeWishlist,
    historyStart,
    historyEnd,
  };
}

/* ---------- helpers ---------- */

function computeCategories(
  expenses: Transaction[],
  months: MonthPoint[],
  winStartKey: string
): CategoryStat[] {
  const byCat = new Map<string, number[]>();
  for (const tx of expenses) {
    const d = parseLocalDate(tx.date);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    if (key < winStartKey) continue;
    const arr = byCat.get(tx.category) || [];
    arr.push(tx.amount);
    byCat.set(tx.category, arr);
  }

  const monthCount = Math.max(1, months.filter((m) => m.key >= winStartKey).length);
  const total = [...byCat.values()].reduce((s, arr) => s + arr.reduce((a, b) => a + b, 0), 0);

  const stats: CategoryStat[] = [...byCat.entries()].map(([category, amounts]) => {
    const mean = amounts.reduce((a, b) => a + b, 0) / monthCount;
    const std = stdDev(amounts);
    const catTotal = mean * monthCount;
    return {
      category,
      monthlyMean: round2(mean),
      monthlyStd: round2(std),
      share: total > 0 ? catTotal / total : 0,
    };
  });

  stats.sort((a, b) => b.monthlyMean - a.monthlyMean);
  return stats.slice(0, 30).map((s) => ({ ...s, share: round3(s.share) }));
}

function computeSeasonality(months: MonthPoint[]): number[] {
  const sums = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
  for (const m of months) {
    sums[m.month] += m.expense;
    counts[m.month] += 1;
  }
  const avgs = sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));
  const overall = average(avgs);
  if (overall <= 0) return new Array(12).fill(1);
  return avgs.map((a) => round3(a / overall));
}

function computeOneOffs(
  expenses: Transaction[],
  months: MonthPoint[],
  winStartKey: string
): OneOffFlag[] {
  const byCat = new Map<string, number[]>();
  for (const tx of expenses) {
    const d = parseLocalDate(tx.date);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    if (key < winStartKey) continue;
    const arr = byCat.get(tx.category) || [];
    arr.push(tx.amount);
    byCat.set(tx.category, arr);
  }

  const flags: OneOffFlag[] = [];
  for (const [category, amounts] of byCat) {
    const mean = average(amounts);
    const std = stdDev(amounts);
    if (std <= 0 || mean <= 0) continue;
    for (const amount of amounts) {
      const z = (amount - mean) / std;
      if (z > 3 && amount > mean * 1.5) {
        flags.push({ key: `${category}:${amount}`, category, amount, zScore: round2(z) });
      }
    }
  }
  flags.sort((a, b) => b.amount - a.amount);
  return flags.slice(0, 8);
}

function trailingKey(endKey: string, backMonths: number): string {
  if (!endKey) return '0000-00';
  const [y, m] = endKey.split('-').map(Number);
  const d = new Date(y, Math.max(m - 1 - backMonths, 0), 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function parseLocalDate(value: string): Date {
  const parts = String(value).split('T')[0].split('-').map(Number);
  if (parts.length >= 3 && parts[0] > 1900) return new Date(parts[0], parts[1] - 1, parts[2]);
  return new Date();
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = average(values);
  return Math.sqrt(values.reduce((s, v) => s + (v - m) * (v - m), 0) / (n - 1));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
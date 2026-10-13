import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface CategoryProjection {
  category: string;
  monthlyP50: number;
  totalP50: number;
  share: number;
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
  categories: CategoryProjection[];
  paths: { balance: number[] }[];
}

export interface StatCategory {
  category: string;
  monthlyMean: number;
  monthlyStd: number;
  share: number;
}

export interface SimulatorStats {
  currency: string;
  aiEnabled: boolean;
  aiModel: string;
  monthlyIncome: { mean: number; std: number; cv: number; months: { key: string; amount: number }[] };
  monthlySpend: { mean: number; std: number; months: { key: string; label: string; income: number; expense: number }[] };
  categories: StatCategory[];
  seasonality: number[];
  oneOffFlags: { key: string; category: string; amount: number; zScore: number }[];
  balances: { total: number; accounts: { id: string; name: string; type: string; balance: number }[] };
  incomeDefault: number;
  goals: any[];
  debts: any[];
  wishlist: any[];
  historyStart: string;
  historyEnd: string;
}

export interface OneOff {
  monthOffset: number;
  category?: string;
  amount: number;
}

export interface Scenario {
  monthlyIncome?: number;
  incomeVolatility?: number;
  savingsRate?: number;
  fixedSavings?: number;
  inflationDrift?: number;
  categoryMultipliers?: Record<string, number>;
  oneOffs?: OneOff[];
  includeGoals?: boolean;
  includeDebts?: boolean;
  includeWishlist?: boolean;
}

export interface RunRequest {
  horizonMonths: number;
  startMonth?: string;
  paths?: number;
  scenario?: Scenario;
}

export interface InterpretRequest {
  text: string;
  scenario?: Scenario;
}

export interface InterpretResult {
  patch: {
    monthlyIncome?: number;
    incomeVolatility?: number;
    savingsRate?: number;
    fixedSavings?: number;
    inflationDrift?: number;
    categoryMultipliers?: Record<string, number>;
    oneOffs?: OneOff[];
  };
  clear: string[];
  message: string;
}

export interface ReportResult {
  summary: string;
  highlights: string[];
  risks: string[];
  topLevers: string[];
}

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private http = inject(HttpClient);
  private readonly base = '/api/simulator';

  stats(): Observable<SimulatorStats> {
    return this.http.get<SimulatorStats>(this.base + '/stats');
  }

  run(req: RunRequest): Observable<SimulationResult> {
    return this.http.post<SimulationResult>(this.base + '/run', req);
  }

  interpret(req: InterpretRequest): Observable<InterpretResult> {
    return this.http.post<InterpretResult>(this.base + '/interpret', req);
  }

  report(req: RunRequest): Observable<ReportResult> {
    return this.http.post<ReportResult>(this.base + '/report', req);
  }
}
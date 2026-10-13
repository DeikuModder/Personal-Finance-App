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
    categories: {
        category: string;
        monthlyP50: number;
        totalP50: number;
        share: number;
    }[];
    paths: {
        balance: number[];
    }[];
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
    start: {
        year: number;
        month: number;
    };
    pathsCount: number;
    startBalance: number;
    scenario: EngineScenario;
}
export declare function runSimulation(stats: SimulatorStats, dto: SimulatorRunDto): SimulationResult;
export declare function monteCarlo(input: EngineInput): SimulationResult;
export declare function percentile(values: number[], p: number): number;
export {};

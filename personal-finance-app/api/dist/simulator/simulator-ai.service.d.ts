import { SimulatorStats } from './history.stats';
import { SimulationResult } from './simulation.engine';
import { SimulatorScenarioDto } from './simulator.dto';
export interface InterpretPatch {
    monthlyIncome?: number;
    incomeVolatility?: number;
    savingsRate?: number;
    fixedSavings?: number;
    inflationDrift?: number;
    categoryMultipliers?: Record<string, number>;
    oneOffs?: {
        monthOffset: number;
        category?: string;
        amount: number;
    }[];
}
export interface InterpretResult {
    patch: InterpretPatch;
    clear: string[];
    message: string;
}
export interface ReportResult {
    summary: string;
    highlights: string[];
    risks: string[];
    topLevers: string[];
}
export declare class SimulatorAiService {
    private readonly logger;
    private readonly apiUrl;
    available(): boolean;
    model(): string;
    interpret(text: string, scenario: SimulatorScenarioDto, stats: SimulatorStats): Promise<InterpretResult>;
    report(stats: SimulatorStats, result: SimulationResult, scenario: SimulatorScenarioDto): Promise<ReportResult>;
    private chat;
    private parse;
    private compactScenario;
    private statsSummary;
}

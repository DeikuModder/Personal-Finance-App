export declare class OneOffDto {
    monthOffset: number;
    category?: string;
    amount: number;
}
export declare class SimulatorScenarioDto {
    monthlyIncome?: number;
    incomeVolatility?: number;
    savingsRate?: number;
    fixedSavings?: number;
    inflationDrift?: number;
    categoryMultipliers?: Record<string, number>;
    oneOffs?: OneOffDto[];
    includeGoals?: boolean;
    includeDebts?: boolean;
    includeWishlist?: boolean;
}
export declare class SimulatorRunDto {
    horizonMonths: number;
    startMonth?: string;
    paths?: number;
    scenario?: SimulatorScenarioDto;
}
export declare class InterpretDto {
    text: string;
    scenario?: SimulatorScenarioDto;
}
export declare class ReportDto {
    horizonMonths: number;
    startMonth?: string;
    paths?: number;
    scenario?: SimulatorScenarioDto;
}

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
        months: {
            key: string;
            amount: number;
        }[];
    };
    monthlySpend: {
        mean: number;
        std: number;
        months: MonthPoint[];
    };
    categories: CategoryStat[];
    seasonality: number[];
    oneOffFlags: OneOffFlag[];
    balances: {
        total: number;
        accounts: {
            id: string;
            name: string;
            type: string;
            balance: number;
        }[];
    };
    incomeDefault: number;
    goals: Goal[];
    debts: Debt[];
    wishlist: WishlistItem[];
    historyStart: string;
    historyEnd: string;
}
export declare function computeHistoryStats(params: {
    transactions: Transaction[];
    accounts: Account[];
    challenge: ChallengeConfig | null;
    goals: Goal[];
    debts: Debt[];
    wishlist: WishlistItem[];
}): SimulatorStats;

import { Transaction } from '../transactions/transaction.entity';
import { Account } from '../accounts/account.entity';
import { Budget } from '../budgets/budget.entity';
import { Investment } from '../investments/investment.entity';
import { ChallengeConfig } from '../challenge/challenge-config.entity';
import { Category } from '../categories/category.entity';
import { BudgetItem } from '../budgets/budget-item.entity';
import { Debt } from '../debts/debt.entity';
import { Goal } from '../goals/goal.entity';
import { WishlistItem } from '../wishlist/wishlist-item.entity';
export declare class User {
    id: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    transactions: Transaction[];
    accounts: Account[];
    budgets: Budget[];
    investments: Investment[];
    challengeConfigs: ChallengeConfig[];
    categories: Category[];
    budgetItems: BudgetItem[];
    debts: Debt[];
    goals: Goal[];
    wishlist: WishlistItem[];
}

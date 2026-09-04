import { Transaction } from '../transactions/transaction.entity';
import { Account } from '../accounts/account.entity';
import { Budget } from '../budgets/budget.entity';
import { Investment } from '../investments/investment.entity';
import { ChallengeConfig } from '../challenge/challenge-config.entity';
export declare class User {
    id: string;
    email: string;
    createdAt: Date;
    transactions: Transaction[];
    accounts: Account[];
    budgets: Budget[];
    investments: Investment[];
    challengeConfigs: ChallengeConfig[];
}

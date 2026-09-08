import { User } from '../users/user.entity';
import { Budget } from './budget.entity';
export declare class BudgetItem {
    id: string;
    userId: string;
    user: User;
    budgetId: string;
    budget: Budget;
    name: string;
    price: number;
    createdAt: string;
}

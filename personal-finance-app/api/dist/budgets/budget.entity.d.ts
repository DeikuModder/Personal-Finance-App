import { User } from '../users/user.entity';
import { BudgetItem } from './budget-item.entity';
export declare class Budget {
    id: string;
    userId: string;
    user: User;
    category: string;
    amount: number;
    month: number;
    year: number;
    createdAt: string;
    items: BudgetItem[];
}

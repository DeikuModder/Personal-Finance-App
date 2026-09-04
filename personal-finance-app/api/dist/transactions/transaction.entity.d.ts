import { User } from '../users/user.entity';
export declare class Transaction {
    id: string;
    userId: string;
    user: User;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
    accountId: string;
    createdAt: string;
    updatedAt: string;
}

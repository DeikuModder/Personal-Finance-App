import { User } from '../users/user.entity';
export declare class Account {
    id: string;
    userId: string;
    user: User;
    name: string;
    type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'other';
    balance: number;
    currency: string;
    color: string;
    icon: string;
    createdAt: string;
}

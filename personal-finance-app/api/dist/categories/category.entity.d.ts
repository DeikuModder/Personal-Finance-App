import { User } from '../users/user.entity';
export declare class Category {
    id: string;
    userId: string;
    user: User;
    label: string;
    icon: string;
    type: 'income' | 'expense';
    createdAt: string;
}

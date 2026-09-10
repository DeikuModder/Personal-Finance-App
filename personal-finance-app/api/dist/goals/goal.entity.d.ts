import { User } from '../users/user.entity';
export declare class Goal {
    id: string;
    userId: string;
    user: User;
    type: 'savings' | 'streak';
    title: string;
    icon: string;
    targetAmount: number;
    deadline: string | null;
    picture: string | null;
    category: string | null;
    allowance: number;
    allowancePeriod: 'day' | 'week';
    streakTarget: number | null;
    status: 'active' | 'completed';
    achievedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

import { User } from '../users/user.entity';
export declare class ChallengeConfig {
    id: string;
    userId: string;
    user: User;
    monthlyIncome: number;
    weeklyMax: number;
    enabled: boolean;
    createdAt: string;
}

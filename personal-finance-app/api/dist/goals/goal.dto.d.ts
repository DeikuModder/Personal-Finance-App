export declare class UpsertGoalDto {
    id: string;
    type: 'savings' | 'streak';
    title: string;
    icon?: string;
    targetAmount?: number;
    deadline?: string;
    picture?: string;
    category?: string;
    allowance?: number;
    allowancePeriod?: 'day' | 'week';
    streakTarget?: number;
    status?: 'active' | 'completed';
    achievedAt?: string;
    createdAt?: string;
}

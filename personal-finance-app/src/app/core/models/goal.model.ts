export type GoalType = 'savings' | 'streak';
export type AllowancePeriod = 'day' | 'week';
export type GoalStatus = 'active' | 'completed';

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  icon: string;
  targetAmount: number;
  deadline: string | null;
  picture: string | null;
  category: string | null;
  allowance: number;
  allowancePeriod: AllowancePeriod;
  streakTarget: number | null;
  status: GoalStatus;
  achievedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
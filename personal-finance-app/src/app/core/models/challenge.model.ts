export interface ChallengeConfig {
  monthlyIncome: number;
  weeklyMax: number;
  enabled: boolean;
  createdAt: string;
}

export const DEFAULT_CHALLENGE_CONFIG: ChallengeConfig = {
  monthlyIncome: 0,
  weeklyMax: 0,
  enabled: false,
  createdAt: '',
};
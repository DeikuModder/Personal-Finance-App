export type BudgetType = 'recurring' | 'one-time';

export const RECURRING_BUDGET: BudgetType = 'recurring';
export const ONE_TIME_BUDGET: BudgetType = 'one-time';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  type: BudgetType;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  name: string;
  price: number;
  createdAt: string;
}

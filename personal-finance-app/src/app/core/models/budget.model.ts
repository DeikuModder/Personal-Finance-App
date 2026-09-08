export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  name: string;
  price: number;
  createdAt: string;
}

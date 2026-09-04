import { TransactionCategory } from './category.model';

export interface Budget {
  id: string;
  category: TransactionCategory;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
}

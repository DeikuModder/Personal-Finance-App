import { TransactionCategory } from './category.model';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

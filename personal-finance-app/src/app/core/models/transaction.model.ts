import { TransactionCategory } from './category.model';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
  accountId: string;
  sourceAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

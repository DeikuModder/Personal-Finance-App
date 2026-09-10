export type DebtStatus = 'active' | 'paid';
export type DebtType = 'payable' | 'receivable';

export interface Debt {
  id: string;
  creditor: string;
  type: DebtType;
  accountId: string | null;
  description: string | null;
  amountOwed: number;
  interestRate: number;
  minimumPayment: number;
  status: DebtStatus;
  dueDate: string | null;
  remindOn: string | null;
  paidAt: string | null;
  createdAt: string;
}
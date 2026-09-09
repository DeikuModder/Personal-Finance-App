export type DebtStatus = 'active' | 'paid';

export interface Debt {
  id: string;
  creditor: string;
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
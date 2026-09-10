import { User } from '../users/user.entity';
export declare class Debt {
    id: string;
    userId: string;
    user: User;
    creditor: string;
    type: 'payable' | 'receivable';
    accountId: string | null;
    description: string | null;
    amountOwed: number;
    interestRate: number;
    minimumPayment: number;
    status: 'active' | 'paid';
    dueDate: string | null;
    remindOn: string | null;
    paidAt: string | null;
    createdAt: string;
}

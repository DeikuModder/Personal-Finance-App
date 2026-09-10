export declare class UpsertDebtDto {
    id: string;
    creditor: string;
    type?: 'payable' | 'receivable';
    accountId?: string | null;
    description?: string;
    amountOwed: number;
    interestRate?: number;
    minimumPayment?: number;
    status?: 'active' | 'paid';
    dueDate?: string;
    remindOn?: string;
    paidAt?: string;
    createdAt?: string;
}

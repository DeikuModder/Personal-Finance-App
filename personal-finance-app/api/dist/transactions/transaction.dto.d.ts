export declare class UpsertTransactionDto {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    category: string;
    description?: string;
    date: string;
    accountId?: string;
    sourceAccountId?: string;
    createdAt?: string;
    updatedAt?: string;
}

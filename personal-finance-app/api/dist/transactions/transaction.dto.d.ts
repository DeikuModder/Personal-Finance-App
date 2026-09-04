export declare class UpsertTransactionDto {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description?: string;
    date: string;
    accountId?: string;
    createdAt?: string;
    updatedAt?: string;
}

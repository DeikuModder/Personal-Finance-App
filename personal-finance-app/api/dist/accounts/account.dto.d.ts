export declare class UpsertAccountDto {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'other';
    balance?: number;
    currency?: string;
    color?: string;
    icon?: string;
    createdAt?: string;
}

export declare class UpsertInvestmentDto {
    id: string;
    name: string;
    type: 'stock' | 'crypto' | 'bond' | 'savings_account' | 'real_estate' | 'other';
    symbol?: string;
    shares?: number;
    purchasePrice: number;
    currentPrice: number;
    dividendPerShare?: number;
    lastUpdated?: string;
    createdAt?: string;
}

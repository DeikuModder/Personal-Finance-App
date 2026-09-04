import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertInvestmentDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsIn(['stock', 'crypto', 'bond', 'savings_account', 'real_estate', 'other'])
  type: 'stock' | 'crypto' | 'bond' | 'savings_account' | 'real_estate' | 'other';

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsNumber()
  purchasePrice: number;

  @IsNumber()
  currentPrice: number;

  @IsOptional()
  @IsNumber()
  dividendPerShare?: number;

  @IsOptional()
  @IsString()
  lastUpdated?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}

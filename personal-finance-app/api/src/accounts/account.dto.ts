import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertAccountDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsIn(['checking', 'savings', 'cash', 'credit_card', 'other'])
  type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'other';

  @IsNumber()
  balance: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}

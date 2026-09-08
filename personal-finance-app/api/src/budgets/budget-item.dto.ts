import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertBudgetItemDto {
  @IsString()
  id: string;

  @IsString()
  budgetId: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  createdAt?: string;
}
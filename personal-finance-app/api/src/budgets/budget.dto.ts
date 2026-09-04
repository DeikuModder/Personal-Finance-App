import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertBudgetDto {
  @IsString()
  id: string;

  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsInt()
  month: number;

  @IsInt()
  year: number;

  @IsOptional()
  @IsString()
  createdAt?: string;
}

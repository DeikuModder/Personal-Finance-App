import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpsertCategoryDto {
  @IsString()
  id: string;

  @IsString()
  label: string;

  @IsString()
  icon: string;

  @IsIn(['income', 'expense'])
  type: 'income' | 'expense';

  @IsOptional()
  @IsString()
  createdAt?: string;
}
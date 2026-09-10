import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertDebtDto {
  @IsString()
  id: string;

  @IsString()
  creditor: string;

  @IsString()
  @IsOptional()
  @IsIn(['payable', 'receivable'])
  type?: 'payable' | 'receivable';

  @IsOptional()
  @IsString()
  accountId?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  amountOwed: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPayment?: number;

  @IsOptional()
  @IsIn(['active', 'paid'])
  status?: 'active' | 'paid';

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  remindOn?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}
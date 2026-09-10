import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertGoalDto {
  @IsString()
  id: string;

  @IsIn(['savings', 'streak'])
  type: 'savings' | 'streak';

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowance?: number;

  @IsOptional()
  @IsIn(['day', 'week'])
  allowancePeriod?: 'day' | 'week';

  @IsOptional()
  @IsInt()
  @Min(1)
  streakTarget?: number;

  @IsOptional()
  @IsIn(['active', 'completed'])
  status?: 'active' | 'completed';

  @IsOptional()
  @IsDateString()
  achievedAt?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}
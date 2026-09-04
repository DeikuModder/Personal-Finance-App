import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class PutChallengeConfigDto {
  @IsNumber()
  monthlyIncome: number;

  @IsNumber()
  weeklyMax: number;

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  createdAt?: string;
}

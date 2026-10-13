import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class OneOffDto {
  @IsInt()
  @Min(0)
  @Max(120)
  monthOffset: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class SimulatorScenarioDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  incomeVolatility?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  savingsRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedSavings?: number;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(60)
  inflationDrift?: number;

  @IsOptional()
  @IsObject()
  categoryMultipliers?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OneOffDto)
  oneOffs?: OneOffDto[];

  @IsOptional()
  @IsBoolean()
  includeGoals?: boolean;

  @IsOptional()
  @IsBoolean()
  includeDebts?: boolean;

  @IsOptional()
  @IsBoolean()
  includeWishlist?: boolean;
}

export class SimulatorRunDto {
  @IsInt()
  @Min(1)
  @Max(36)
  horizonMonths: number;

  @IsOptional()
  @IsString()
  startMonth?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(5000)
  paths?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SimulatorScenarioDto)
  scenario?: SimulatorScenarioDto;
}

export class InterpretDto {
  @IsString()
  text: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SimulatorScenarioDto)
  scenario?: SimulatorScenarioDto;
}

export class ReportDto {
  @IsInt()
  @Min(1)
  @Max(36)
  horizonMonths: number;

  @IsOptional()
  @IsString()
  startMonth?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(5000)
  paths?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SimulatorScenarioDto)
  scenario?: SimulatorScenarioDto;
}
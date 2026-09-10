import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertWishlistItemDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsIn(['active', 'achieved'])
  status?: 'active' | 'achieved';

  @IsOptional()
  @IsDateString()
  achievedAt?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}
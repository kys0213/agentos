import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UsageFilterOptionsDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class GetLogsDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UsageFilterOptionsDto)
  options?: UsageFilterOptionsDto;
}

export class GetStatsDto {
  @IsOptional()
  @IsString()
  clientName?: string;
}

export class HourlyStatsDto {
  @IsISO8601()
  date!: string;

  @IsOptional()
  @IsString()
  clientName?: string;
}

export class LogsInRangeDto {
  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsOptional()
  @IsString()
  clientName?: string;
}

export class ClearDto {
  @IsOptional()
  @IsISO8601()
  olderThan?: string;
}


import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UsageQueryDto {
  @IsOptional()
  @IsString()
  toolId?: string;

  @IsOptional()
  @IsString()
  toolName?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  status?: 'success' | 'error';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsIn(['forward', 'backward'])
  direction?: 'forward' | 'backward';
}

export class GetLogsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UsageQueryDto)
  query?: UsageQueryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CursorPaginationDto)
  pg?: CursorPaginationDto;
}

export class GetStatsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UsageQueryDto)
  query?: UsageQueryDto;
}

// The following DTOs are retained for future TODOs; not implemented in this pass
export class HourlyStatsDto {
  @IsISO8601()
  date!: string;
}

export class LogsInRangeDto {
  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;
}

export class ClearDto {
  @IsOptional()
  @IsISO8601()
  olderThan?: string;
}

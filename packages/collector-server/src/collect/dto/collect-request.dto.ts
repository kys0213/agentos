import { IsObject, IsOptional, IsString } from 'class-validator';

export class CollectRequestDto {
  @IsString()
  batch_id!: string;

  @IsObject()
  journal!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  cursor?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

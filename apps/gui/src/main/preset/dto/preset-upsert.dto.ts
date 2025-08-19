import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { KnowledgeStateDto } from './knowledge-state.dto';

export enum PresetStatusDto {
  active = 'active',
  idle = 'idle',
  inactive = 'inactive',
}

export class PresetUpsertDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  author!: string;

  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;

  @IsString()
  version!: string;

  @IsString()
  systemPrompt!: string;

  @IsOptional()
  @IsArray()
  enabledMcps?: unknown[];

  @IsString()
  llmBridgeName!: string;

  @IsObject()
  llmBridgeConfig!: Record<string, unknown>;

  @IsEnum(PresetStatusDto)
  status!: PresetStatusDto;

  @Min(0)
  usageCount!: number;

  @Min(0)
  knowledgeDocuments!: number;

  @ValidateNested()
  @Type(() => KnowledgeStateDto)
  knowledgeStats!: KnowledgeStateDto;

  @IsArray()
  @IsString({ each: true })
  category!: string[];
}

export class UpdatePresetDto {
  @IsString()
  id!: string;

  @ValidateNested()
  @Type(() => PresetUpsertDto)
  preset!: PresetUpsertDto;
}


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
import type {
  CreatePreset,
  EnabledMcp,
  McpToolDescription,
  Preset,
  PresetStatus,
} from '@agentos/core';

// Define PresetUpsertDto before UpdatePresetDto to avoid TDZ issues in decorators

export class EnabledMcpDto implements EnabledMcp {
  name!: string;
  version?: string;
  enabledTools!: McpToolDescriptionDto[];
  enabledResources!: string[];
  enabledPrompts!: string[];
}

export class McpToolDescriptionDto implements McpToolDescription {
  name!: string;
  title!: string;
  description!: string;
}

export class PresetCreateDto implements CreatePreset {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  author!: string;

  @IsString()
  version!: string;

  @IsString()
  systemPrompt!: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => EnabledMcpDto)
  enabledMcps?: EnabledMcpDto[] | undefined;

  @IsString()
  llmBridgeName!: string;

  @IsObject()
  llmBridgeConfig!: Record<string, any>;

  @IsEnum(['active', 'idle', 'inactive'])
  status!: PresetStatus;

  @IsArray()
  @IsString({ each: true })
  category!: string[];
}

export class PresetUpsertDto implements Preset {
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
  enabledMcps?: EnabledMcpDto[];

  @IsString()
  llmBridgeName!: string;

  @IsObject()
  llmBridgeConfig!: Record<string, unknown>;

  @IsEnum(['active', 'idle', 'inactive'])
  status!: PresetStatus;

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

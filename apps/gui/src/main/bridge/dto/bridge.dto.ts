import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { LlmManifest } from 'llm-bridge-spec';

export class RegisterBridgeDto {
  @ValidateNested()
  @Type(() => Object)
  manifest!: LlmManifest;

  @IsObject()
  config!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  id?: string;
}

export type Ok<T> = { success: true; result: T };
export type Err = { success: false; error: string };
export type Resp<T> = Ok<T> | Err;


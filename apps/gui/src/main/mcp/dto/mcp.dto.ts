import { IsOptional, IsString } from 'class-validator';

export class GetToolDto {
  @IsString()
  name!: string; // fully qualified: <mcp>.<tool>
}

export class InvokeToolDto {
  @IsString()
  name!: string; // fully qualified: <mcp>.<tool>

  @IsOptional()
  input?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  resumptionToken?: string;
}

export type Ok<T> = { success: true; result: T };
export type Err = { success: false; error: string };
export type Resp<T> = Ok<T> | Err;

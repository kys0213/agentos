import type { BuiltinTool } from '@agentos/core';

export interface BuiltinToolProtocol {
  /**
   * 모든 내장 도구 조회
   */
  getAllBuiltinTools(): Promise<BuiltinTool[]>;

  /**
   * 특정 내장 도구 조회
   */
  getBuiltinTool(id: string): Promise<BuiltinTool | null>;

  invokeBuiltinTool<R>(toolName: string, args: Record<string, any>): Promise<R>;
}

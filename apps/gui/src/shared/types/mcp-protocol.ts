import type { McpConfig, McpToolMetadata } from '@agentos/core';
import { ToolExecutionResponse, ResourceListResponse, ResourceResponse } from './ipc-channel';

export interface McpProtocol {
  /**
   * 모든 MCP 클라이언트 조회
   */
  getAllMcp(): Promise<McpConfig[]>;

  /**
   * MCP 클라이언트 연결
   */
  connectMcp(config: McpConfig): Promise<{ success: boolean }>;

  /**
   * MCP 클라이언트 연결 해제
   */
  disconnectMcp(name: string): Promise<{ success: boolean }>;

  /**
   * MCP 도구 실행
   */
  executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolMetadata
  ): Promise<ToolExecutionResponse>;

  /**
   * MCP 리소스 목록 조회
   */
  getMcpResources(clientName: string): Promise<ResourceListResponse>;

  /**
   * MCP 리소스 읽기
   */
  readMcpResource(clientName: string, uri: string): Promise<ResourceResponse>;

  /**
   * MCP 클라이언트 상태 조회
   */
  getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }>;

  /**
   * MCP 도구 메타데이터 조회
   */
  getToolMetadata(clientName: string): Promise<McpToolMetadata>;

  /**
   * 모든 MCP 도구들의 메타데이터 일괄 조회
   */
  getAllToolMetadata(): Promise<McpToolMetadata[]>;
}

import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  BuiltinTool,
  CreateAgentMetadata,
  CreatePreset,
  McpConfig,
  McpToolMetadata,
  McpUsageLog,
  McpUsageStats,
  Preset,
} from '@agentos/core';
import { LlmManifest, UserMessage } from 'llm-bridge-spec';
import type {
  ClearUsageLogsResponse,
  HourlyStatsResponse,
  McpUsageUpdateEvent,
  SetUsageTrackingResponse,
  UsageLogQueryOptions,
} from './mcp-usage-types';
import type {
  ResourceListResponse,
  ResourceResponse,
  ToolExecutionResponse,
} from '../../renderer/types/core-types';

/**
 * 모든 환경별 통신을 추상화하는 단일 인터페이스
 * Electron, Web, Chrome Extension 등 다양한 환경에서 동일한 인터페이스 제공
 */
export interface IpcChannel
  extends AgentProtocol,
    LlmBridgeProtocol,
    BuiltinToolProtocol,
    McpProtocol,
    PresetProtocol,
    McpUsageLogProtocol {}

/**
 * IpcChannel 구현체들이 공통으로 사용할 수 있는 유틸리티 타입들
 */
export namespace IpcChannelTypes {
  export interface BaseResponse {
    success: boolean;
    error?: string;
  }

  export interface ListResponse<T> {
    items: T[];
    total?: number;
    hasMore?: boolean;
    nextCursor?: string;
  }
}

export interface AgentProtocol {
  /**
   * Agent 채팅
   */
  chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult>;

  /**
   * Agent 세션 종료
   */
  endSession(agentId: string, sessionId: string): Promise<void>;

  /**
   * 특정 Agent 조회
   */
  getAgentMetadata(id: string): Promise<AgentMetadata | null>;

  /**
   * 모든 Agent 조회
   */
  getAllAgentMetadatas(): Promise<AgentMetadata[]>;

  /**
   * Agent 업데이트
   */
  updateAgent(agentId: string, agent: Partial<Omit<AgentMetadata, 'id'>>): Promise<AgentMetadata>;

  /**
   * Agent 생성
   */
  createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata>;

  /**
   * Agent 삭제
   */
  deleteAgent(id: string): Promise<AgentMetadata>;
}

export interface LlmBridgeProtocol {
  /**
   * LLM Bridge 등록
   */
  registerBridge(config: LlmManifest): Promise<{ success: boolean }>;

  /**
   * LLM Bridge 등록 해제
   */
  unregisterBridge(id: string): Promise<{ success: boolean }>;

  /**
   * 활성 Bridge 전환
   */
  switchBridge(id: string): Promise<{ success: boolean }>;

  /**
   * 현재 활성 Bridge 정보 조회
   */
  getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null>;

  /**
   * 등록된 모든 Bridge ID 목록 조회
   */
  getBridgeIds(): Promise<string[]>;

  /**
   * 특정 Bridge 설정 조회
   */
  getBridgeConfig(id: string): Promise<LlmManifest | null>;
}

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

export interface PresetProtocol {
  /**
   * 모든 프리셋 조회
   */
  getAllPresets(): Promise<Preset[]>;
}

export interface McpUsageLogProtocol {
  /**
   * 사용량 로그 조회
   */
  getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;

  /**
   * 전체 사용량 로그 조회
   */
  getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;

  /**
   * 사용량 통계 조회
   */
  getUsageStats(clientName?: string): Promise<McpUsageStats>;

  /**
   * 시간별 사용량 통계 조회
   */
  getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse>;

  /**
   * 기간별 사용량 로그 조회
   */
  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]>;

  /**
   * 사용량 로그 정리
   */
  clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse>;

  /**
   * 사용량 추적 활성화/비활성화
   */
  setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse>;

  /**
   * 사용량 변경 이벤트 구독
   */
  subscribeToUsageUpdates(callback: (event: McpUsageUpdateEvent) => void): Promise<() => void>;
}

export interface PresetProtocol {
  /**
   * 모든 프리셋 조회
   */
  getAllPresets(): Promise<Preset[]>;

  /**
   * 프리셋 생성
   */
  createPreset(preset: CreatePreset): Promise<Preset>;

  /**
   * 프리셋 업데이트
   */
  updatePreset(id: string, preset: Partial<Omit<Preset, 'id'>>): Promise<Preset>;

  /**
   * 프리셋 삭제
   */
  deletePreset(id: string): Promise<Preset>;

  /**
   * 특정 프리셋 조회
   */
  getPreset(id: string): Promise<Preset | null>;
}

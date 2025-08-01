import type {
  ChatSessionDescription,
  Preset,
  McpConfig,
  SendMessageResponse,
  ToolExecutionResponse,
  ResourceListResponse,
  ResourceResponse,
  MessageListResponse,
  PaginationOptions,
  LlmBridgeConfig,
  McpToolArgs,
} from '../../types/core-types';

/**
 * 모든 환경별 통신을 추상화하는 단일 인터페이스
 * Electron, Web, Chrome Extension 등 다양한 환경에서 동일한 인터페이스 제공
 */
export interface IpcChannel {
  // ==================== Chat 관련 메서드들 ====================

  /**
   * 새로운 채팅 세션 생성
   */
  createChatSession(options?: { preset?: Preset }): Promise<ChatSessionDescription>;

  /**
   * 모든 채팅 세션 목록 조회
   */
  listChatSessions(): Promise<ChatSessionDescription[]>;

  /**
   * 특정 채팅 세션 로드
   */
  loadChatSession(sessionId: string): Promise<ChatSessionDescription>;

  /**
   * 채팅 메시지 전송
   */
  sendChatMessage(sessionId: string, message: string): Promise<SendMessageResponse>;

  /**
   * 스트리밍 방식으로 채팅 메시지 전송
   */
  streamChatMessage(sessionId: string, message: string): Promise<ReadableStream>;

  /**
   * 채팅 세션의 메시지 목록 조회 (페이지네이션 지원)
   */
  getChatMessages(sessionId: string, options?: PaginationOptions): Promise<MessageListResponse>;

  /**
   * 채팅 세션 삭제
   */
  deleteChatSession(sessionId: string): Promise<{ success: boolean }>;

  /**
   * 채팅 세션 이름 변경
   */
  renameChatSession(sessionId: string, newName: string): Promise<{ success: boolean }>;

  // ==================== Bridge 관련 메서드들 ====================

  /**
   * LLM Bridge 등록
   */
  registerBridge(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }>;

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
  getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null>;

  /**
   * 등록된 모든 Bridge ID 목록 조회
   */
  getBridgeIds(): Promise<string[]>;

  /**
   * 특정 Bridge 설정 조회
   */
  getBridgeConfig(id: string): Promise<LlmBridgeConfig | null>;

  // ==================== MCP 관련 메서드들 ====================

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
    args: McpToolArgs
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

  // ==================== Preset 관련 메서드들 ====================

  /**
   * 모든 프리셋 조회
   */
  getAllPresets(): Promise<Preset[]>;

  /**
   * 프리셋 생성
   */
  createPreset(preset: Preset): Promise<{ success: boolean }>;

  /**
   * 프리셋 업데이트
   */
  updatePreset(preset: Preset): Promise<{ success: boolean }>;

  /**
   * 프리셋 삭제
   */
  deletePreset(id: string): Promise<{ success: boolean }>;

  /**
   * 특정 프리셋 조회
   */
  getPreset(id: string): Promise<Preset | null>;
}

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

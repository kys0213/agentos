/**
 * Core MCP Usage Tracking Types
 * 
 * GUI의 MCPTool/ToolUsageLog 타입을 Core로 통합하여
 * 모든 앱에서 일관된 MCP 사용량 데이터 활용이 가능하도록 합니다.
 */

/**
 * MCP 도구의 메타데이터 정보
 */
export interface McpToolMetadata {
  /** 고유 식별자 */
  id: string;
  /** 도구 이름 */
  name: string;
  /** 도구 설명 */
  description: string;
  /** 도구 버전 */
  version: string;
  /** 도구 카테고리 (옵셔널) */
  category?: string;
  /** 도구 제공자 (옵셔널) */
  provider?: string;
  /** 연결 엔드포인트 (옵셔널) */
  endpoint?: string;
  /** 도구 권한 목록 */
  permissions: string[];
  /** 연결 상태 */
  status: McpConnectionStatus;
  /** 마지막 사용 시간 (옵셔널) */
  lastUsedAt?: Date;
  /** 총 사용 횟수 */
  usageCount: number;
  /** 도구별 설정 (옵셔널) */
  config?: Record<string, any>;
}

/**
 * MCP 도구 사용 로그
 */
export interface McpUsageLog {
  /** 로그 고유 식별자 */
  id: string;
  /** 사용된 도구 ID */
  toolId: string;
  /** 사용된 도구 이름 */
  toolName: string;
  /** 사용한 에이전트 ID (옵셔널) */
  agentId?: string;
  /** 사용한 에이전트 이름 (옵셔널) */
  agentName?: string;
  /** 실행된 액션 */
  action: string;
  /** 사용 시간 */
  timestamp: Date;
  /** 실행 시간 (밀리초) */
  duration: number;
  /** 실행 결과 상태 */
  status: McpUsageStatus;
  /** 입력 파라미터 (옵셔널) */
  parameters?: Record<string, any>;
  /** 에러 메시지 (옵셔널) */
  error?: string;
  /** 실행 결과 (옵셔널) */
  result?: string;
}

/**
 * MCP 연결 상태
 */
export type McpConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

/**
 * MCP 사용 결과 상태
 */
export type McpUsageStatus = 'success' | 'error' | 'timeout';

/**
 * MCP 사용량 추적기 인터페이스
 */
export interface McpUsageTracker {
  /**
   * 사용량 로그 기록
   */
  trackUsage(log: Omit<McpUsageLog, 'id' | 'timestamp'>): void;
  
  /**
   * 사용량 로그 조회
   * @param toolId 특정 도구 ID (옵셔널, 미지정 시 전체 조회)
   */
  getUsageLogs(toolId?: string): McpUsageLog[];
  
  /**
   * 사용량 통계 조회
   * @param toolId 특정 도구 ID (옵셔널, 미지정 시 전체 통계)
   */
  getUsageStats(toolId?: string): McpUsageStats;
  
  /**
   * 오래된 로그 삭제
   * @param olderThan 기준 날짜 (옵셔널, 미지정 시 전체 삭제)
   */
  clearLogs(olderThan?: Date): void;
}

/**
 * MCP 사용량 통계
 */
export interface McpUsageStats {
  /** 총 사용 횟수 */
  totalUsage: number;
  /** 성공률 (0-1) */
  successRate: number;
  /** 평균 실행 시간 (밀리초) */
  averageDuration: number;
  /** 마지막 사용 시간 (옵셔널) */
  lastUsedAt?: Date;
  /** 에러 발생 횟수 */
  errorCount: number;
}
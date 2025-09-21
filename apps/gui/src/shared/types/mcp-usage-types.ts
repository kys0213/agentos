// Core 타입들을 재사용하여 일관성 보장
import type { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';
import { z } from 'zod';
import {
  McpUsageLogSchema as ContractUsageLogSchema,
  McpUsageStatsSchema as ContractUsageStatsSchema,
} from '../rpc/contracts/mcp.contract';

/**
 * 사용량 로그 조회 옵션
 * 페이지네이션, 필터링, 정렬을 위한 옵션들
 */
export interface UsageLogQueryOptions {
  /** 페이지네이션: 시작 인덱스 */
  offset?: number;
  /** 페이지네이션: 최대 항목 수 */
  limit?: number;
  /** 필터: 특정 상태만 조회 */
  status?: 'success' | 'error' | 'timeout';
  /** 필터: 특정 에이전트만 조회 */
  agentId?: string;
  /** 정렬: 시간순 (desc: 최신순, asc: 오래된순) */
  sortOrder?: 'desc' | 'asc';
}

/**
 * 사용량 업데이트 이벤트
 * Main Process에서 Renderer Process로 전송되는 실시간 이벤트
 */
export type McpUsageUpdateEvent = z.infer<typeof McpUsageUpdateEventSchema>;

const BaseEvent = z.object({
  clientName: z.string(),
  timestamp: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
});

const UsageLoggedEvent = BaseEvent.extend({
  type: z.literal('usage-logged'),
  newLog: z.object({
    id: z.string(),
    toolId: z.string().optional(),
    toolName: z.string().optional(),
    timestamp: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
    operation: z.literal('tool.call'),
    status: z.union([z.literal('success'), z.literal('error')]),
    durationMs: z.number().optional(),
    agentId: z.string().optional(),
    sessionId: z.string().optional(),
    errorCode: z.string().optional(),
  }),
});

const MetadataShape = z
  .object({
    toolId: z.string().optional(),
    toolName: z.string().optional(),
    status: z
      .union([
        z.literal('connected'),
        z.literal('disconnected'),
        z.literal('error'),
        z.literal('pending'),
      ])
      .optional(),
    usageCount: z.number().nonnegative().optional(),
    lastUsedAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()).optional(),
  })
  .passthrough();

const MetadataUpdatedEvent = BaseEvent.extend({
  type: z.literal('metadata-updated'),
  metadata: MetadataShape,
});

const ConnectionChangedEvent = BaseEvent.extend({
  type: z.literal('connection-changed'),
  connectionStatus: z.union([
    z.literal('connected'),
    z.literal('disconnected'),
    z.literal('error'),
    z.literal('pending'),
  ]),
});

export const McpUsageUpdateEventSchema = z.discriminatedUnion('type', [
  UsageLoggedEvent,
  MetadataUpdatedEvent,
  ConnectionChangedEvent,
]);

const LegacyUsageLogPayload = ContractUsageLogSchema.extend({
  clientName: z.string().optional(),
});

const LegacyUsageLogEvent = z.object({
  type: z.literal('mcp.usage.log.created'),
  payload: LegacyUsageLogPayload,
  ts: z.number().optional(),
});

const LegacyUsageStatsEvent = z.object({
  type: z.literal('mcp.usage.stats.updated'),
  payload: ContractUsageStatsSchema.extend({
    clientName: z.string().optional(),
  }),
  ts: z.number().optional(),
});

export const LegacyMcpUsageEventSchema = z.union([LegacyUsageLogEvent, LegacyUsageStatsEvent]);
export type LegacyMcpUsageEvent = z.infer<typeof LegacyMcpUsageEventSchema>;

const coerceDate = (value: unknown, fallback?: Date): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return fallback ?? new Date();
};

export function convertLegacyMcpUsageEvent(
  event: LegacyMcpUsageEvent
): McpUsageUpdateEvent | null {
  if (event.type === 'mcp.usage.log.created') {
    const payload = event.payload;
    const timestamp = coerceDate(payload.timestamp, new Date(event.ts ?? Date.now()));
    return {
      type: 'usage-logged',
      clientName: payload.clientName ?? payload.toolName ?? payload.toolId ?? 'unknown-tool',
      timestamp,
      newLog: {
        id: payload.id,
        toolId: payload.toolId,
        toolName: payload.toolName,
        timestamp,
        operation: payload.operation,
        status: payload.status,
        durationMs: payload.durationMs,
        agentId: payload.agentId,
        sessionId: payload.sessionId,
        errorCode: payload.errorCode,
      },
    } satisfies McpUsageUpdateEvent;
  }

  // Stats 이벤트는 전역 정보만 가지고 있으므로 GUI 실시간 업데이트로 변환할 데이터가 없음
  // (대시보드 요청 시 재조회하므로 여기서는 무시)
  return null;
}

/**
 * GUI용 확장 메타데이터
 * Core의 McpToolMetadata를 GUI 요구사항에 맞게 확장
 */
export interface GuiMcpToolMetadata extends McpToolMetadata {
  /** GUI 전용: 표시용 아이콘 이름 (아이콘 라이브러리 키) */
  iconName?: string;
  /** GUI 전용: 도구 카테고리 (예: "file", "network", "ai", "database") */
  category?: string;
  /** GUI 전용: 사용자 정의 별칭 */
  displayName?: string;
  /** GUI 전용: 즐겨찾기 여부 */
  isFavorite?: boolean;
}

/**
 * 사용량 대시보드 데이터
 * GUI에서 사용량 통계를 표시하기 위한 통합 데이터 구조
 */
export interface McpUsageDashboard {
  /** 전체 통계 */
  globalStats: McpUsageStats;
  /** 도구별 통계 */
  toolStats: Array<{
    clientName: string;
    metadata: McpToolMetadata;
    stats: McpUsageStats;
  }>;
  /** 최근 활동 로그 (최신순) */
  recentLogs: McpUsageLog[];
  /** 시간별 사용량 (최근 24시간, 시간(0-23) -> 사용량) */
  hourlyActivity: Map<number, number>;
  /** 에러율 높은 도구들 (상위 5개) */
  problematicTools: Array<{
    clientName: string;
    errorRate: number;
    lastError: string;
  }>;
}

/**
 * 시간별 통계 조회 응답
 * Map을 직렬화할 수 없으므로 RPC 전송용으로 배열 형태로 변환
 */
export interface HourlyStatsResponse {
  /** 시간별 사용량 데이터 [시간, 사용량] 배열 */
  hourlyData: Array<[number, number]>;
}

/**
 * 사용량 로그 정리 응답
 */
export interface ClearUsageLogsResponse {
  success: boolean;
  clearedCount: number;
  error?: string;
}

/**
 * 사용량 추적 설정 응답
 */
export interface SetUsageTrackingResponse {
  success: boolean;
  error?: string;
}

/**
 * RPC 통신용 기본 응답 타입
 */
export interface BaseIpcResponse {
  success: boolean;
  error?: string;
}

/**
 * 날짜 범위 조건
 */
export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

/**
 * 사용량 로그 필터 옵션 (확장된 버전)
 */
export interface ExtendedUsageLogFilter extends UsageLogQueryOptions {
  /** 날짜 범위 필터 */
  dateRange?: DateRangeFilter;
  /** 도구 이름 필터 */
  toolName?: string;
  /** 최소 실행 시간 필터 (밀리초) */
  minDuration?: number;
  /** 최대 실행 시간 필터 (밀리초) */
  maxDuration?: number;
}

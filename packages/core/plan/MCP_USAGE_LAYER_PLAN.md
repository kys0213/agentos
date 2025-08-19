# MCP Usage Layer Plan

## Requirements

### 성공 조건

- [ ] Core에 MCP 사용량 수집/집계 계층(Repository + Service + Events)을 추가한다.
- [ ] Mcp/McpRegistry/McpMetadataRegistry의 책임을 침범하지 않고 독립적인 레이어로 동작한다.
- [ ] 사용량 로그 기록(성공/실패, duration, timestamp, 도구 식별자)이 가능하다.
- [ ] 기간/상태/툴/에이전트/세션 기준의 페이징 조회 API를 제공한다.
- [ ] 전체/툴별 통계 API(totalUsage, successRate, averageDuration, lastUsedAt)를 제공한다.
- [ ] 파일 기반 저장소 구현으로 테스트 및 로컬 개발을 지원한다(추후 다른 저장소로 교체 가능).
- [ ] 민감정보를 저장하지 않는다(입력/출력 원문 금지, 필요한 경우 길이·타입 등 메타만 기록).

### 사용 시나리오

- [ ] GUI가 `McpUsageService`를 통해 최근 호출 로그를 조회하고 대시보드/차트를 렌더링한다.
- [ ] 운영자가 특정 툴(또는 전체)의 성공률/평균 지연/최근 사용 시점을 확인한다.
- [ ] 특정 기간(일/주) 동안 시간대별 호출량 패턴을 확인한다.

### 제약 조건

- [ ] Mcp는 “프로토콜 전용”으로 사용량 로직을 포함하지 않는다.
- [ ] 기록은 `McpService`의 작업 이벤트(operationStarted/Completed) 기반 훅으로 연결한다(후속 단계).
- [ ] 파일 저장은 NDJSON/JSON 기반으로 단순하게 시작하고, 롤업/보존 정책은 옵션으로 둔다.

## Interface Sketch

```ts
// packages/core/src/tool/mcp/usage/types.ts
export type McpUsageStatus = 'success' | 'error';

export interface McpUsageLog {
  id: string; // uuid
  toolId?: string;
  toolName?: string;
  timestamp: Date;
  operation: 'tool.call';
  status: McpUsageStatus;
  durationMs?: number;
  agentId?: string;
  sessionId?: string;
  errorCode?: string;
}

export interface McpUsageStats {
  totalUsage: number;
  successRate: number; // 0..1
  averageDuration: number; // ms
  lastUsedAt?: Date;
  errorCount: number;
}

export interface McpUsageQuery {
  toolId?: string;
  toolName?: string;
  agentId?: string;
  sessionId?: string;
  status?: 'success' | 'error';
  from?: Date;
  to?: Date;
}

// packages/core/src/tool/mcp/usage/repository/mcp-usage-repository.ts
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../../common/pagination/cursor-pagination';
export interface McpUsageRepository {
  append(logs: McpUsageLog | McpUsageLog[]): Promise<void>;
  list(query?: McpUsageQuery, pg?: CursorPagination): Promise<CursorPaginationResult<McpUsageLog>>;
  getStats(query?: McpUsageQuery): Promise<McpUsageStats>;
}

// packages/core/src/tool/mcp/usage/service/mcp-usage-service.ts
export class McpUsageService {
  constructor(private readonly repo: McpUsageRepository) {}
  async recordStart(meta: {
    toolId?: string;
    toolName?: string;
    agentId?: string;
    sessionId?: string;
  }): Promise<string> {}
  async recordEnd(
    id: string,
    result: { status: 'success' | 'error'; durationMs: number; errorCode?: string }
  ): Promise<void> {}
  async list(query?: McpUsageQuery, pg?: CursorPagination) {}
  async getStats(query?: McpUsageQuery) {}
}
```

## Todo

- [ ] 타입 정의(`McpUsageLog/McpUsageStats/McpUsageQuery`)
- [ ] 저장소 인터페이스(`McpUsageRepository`) 정의
- [ ] 파일 기반 저장소 구현(`FileMcpUsageRepository`, append/list/getStats)
- [ ] 서비스 구현(`McpUsageService`, 레코딩/조회/통계)
- [ ] 단위 테스트(레포지토리/서비스)
- [ ] `index.ts` export 정리 + 문서화
- [ ] McpService 훅 연결(작업 시작/완료 시 Usage 기록) — 별도 커밋
- [ ] GUI 컨트롤러를 UsageService로 전환 — 별도 PR

## 작업 순서

1. 타입/인터페이스 정의 커밋 (완료 조건: 컴파일 성공, no-op)
2. 파일 저장소 기본 구현 + 단위 테스트 (완료 조건: append/list/stats 기본 동작)
3. UsageService 구현 + 단위 테스트 (완료 조건: recordStart/End·list·getStats 동작)
4. index export/문서 업데이트 (완료 조건: 패키지 외부에서 타입/서비스 사용 가능)
5. McpService 훅 연결 (완료 조건: invokeTool 경로에서 기록) — 본 PR 말미 or 후속
6. GUI 전환은 후속 PR에서 처리

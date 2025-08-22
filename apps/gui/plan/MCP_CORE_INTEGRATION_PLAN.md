# MCP Core 통합 계획서

## 🎯 요구사항

**성공 조건**:

- GUI의 MCPTool/ToolUsageLog 타입이 Core 표준 타입 기반으로 통합
- Core에서 사용량 통계를 자동 수집하여 GUI에서 실시간 활용
- 기존 Core MCP 기능에 Breaking Change 없이 점진적 확장
- 모든 앱(`cli`, `slack-bot`, `gui`)에서 일관된 MCP 사용량 데이터 활용 가능

**사용 시나리오**:

1. Agent가 MCP Tool 사용 시 Core에서 자동으로 사용량 로그 기록
2. GUI에서 실시간 사용량 통계 및 성능 모니터링 표시
3. Tool별/Agent별 사용 패턴 분석을 통한 최적화 인사이트 제공
4. 다른 앱(CLI, Slack Bot)에서도 동일한 사용량 데이터 활용

## 🏗️ 현재 상태 분석

### GUI의 독립 타입 (변경 대상)

```typescript
// apps/gui/src/renderer/components/management/McpToolManager.tsx
interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: string; // GUI 전용
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  version: string;
  provider: string; // GUI 전용
  lastUsed?: Date; // 사용량 통계
  usageCount: number; // 사용량 통계
  endpoint?: string;
  apiKey?: string;
  permissions: string[];
  icon: React.ReactNode; // GUI 전용
  config?: Record<string, any>;
}

interface ToolUsageLog {
  id: string;
  toolId: string;
  toolName: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: Date;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  parameters?: Record<string, any>;
  result?: string;
}
```

## 🔧 Electron MCP IPC Implementation (Consolidated)

아래 구현 계획은 `ELECTRON_MCP_IPC_IMPLEMENTATION_PLAN.md`의 TODO와 상세 단계를 본 문서로 통합한 것입니다. 세부 IPC 시그니처는 `ELECTRON_MCP_IPC_SPEC.md`를 기준으로 합니다.

### TODO (Phases)

- Phase 2 — 타입/인터페이스 확장
  - [x] Shared Types: `mcp-usage-types.ts` 정의 (GUI 전용 확장 포함)
  - [x] IpcChannel/RPC 인터페이스 확장 (사용량 추적 메서드 추가)
- Phase 3 — Main 구현
  - [x] `mcp.usage.getLogs`/`getStats` 핸들러 구현 (core McpUsageService 연동)
  - [x] `mcp.usage.getHourlyStats` 구현 (UTC 0–23 버킷 집계)
  - [ ] `mcp.usage.clear` (코어 인터페이스 확장 후 연동)
  - [x] 사용량 업데이트 스트림(`mcp.usage.events`) 노출
- Phase 4 — Renderer 구현
  - [x] RPC 서비스 연결 (list/stats/hourly)
  - [x] subscribeToUsageUpdates 구현(stream API 사용)
- Phase 5 — 통합 검증
  - [x] 타입체크/빌드/테스트/린트 통과

### 테스트 전략 요약

- 시나리오: 연결 후 사용량 조회, 도구 실행 시 실시간 업데이트, 대용량 페이지네이션, 구독/해제 누수 점검
- 품질 기준: 타입/빌드/테스트/린트 통과, IPC 타입 안전성 보장

### Core의 현재 구조 (확장 필요)

```typescript
// packages/core/src/tool/mcp/mcp.ts
export class Mcp extends EventEmitter {
  // 사용량 통계 기능 없음
  // 메타데이터 관리 부족
  async invokeTool(tool: Tool, option?: ...): Promise<InvokeToolResult>
}
```

## 🏗️ 인터페이스 설계

### Core에 추가할 타입들

```typescript
// packages/core/src/tool/mcp/mcp-types.ts
export interface McpToolMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category?: string;
  provider?: string;
  endpoint?: string;
  permissions: string[];
  status: McpConnectionStatus;
  lastUsedAt?: Date;
  usageCount: number;
  config?: Record<string, any>;
}

export interface McpUsageLog {
  id: string;
  toolId: string;
  toolName: string;
  agentId?: string;
  agentName?: string;
  action: string;
  timestamp: Date;
  duration: number;
  status: McpUsageStatus;
  parameters?: Record<string, any>;
  error?: string;
  result?: string;
}

export type McpConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type McpUsageStatus = 'success' | 'error' | 'timeout';

export interface McpUsageTracker {
  trackUsage(log: Omit<McpUsageLog, 'id' | 'timestamp'>): void;
  getUsageLogs(toolId?: string): McpUsageLog[];
  getUsageStats(toolId?: string): McpUsageStats;
  clearLogs(olderThan?: Date): void;
}

export interface McpUsageStats {
  totalUsage: number;
  successRate: number;
  averageDuration: number;
  lastUsedAt?: Date;
  errorCount: number;
}
```

### Mcp 클래스 확장

```typescript
// packages/core/src/tool/mcp/mcp.ts (확장)
export class Mcp extends EventEmitter {
  private metadata: McpToolMetadata;
  private usageTracker?: McpUsageTracker;

  constructor(
    // 기존 파라미터들
    private readonly usageTrackingEnabled: boolean = false
  ) {
    // 기존 로직
    if (usageTrackingEnabled) {
      this.usageTracker = new InMemoryUsageTracker();
    }
  }

  // 기존 메서드 확장
  async invokeTool(tool: Tool, option?: ...): Promise<InvokeToolResult> {
    const startTime = Date.now();
    let result: InvokeToolResult;
    let status: McpUsageStatus = 'success';
    let error: string | undefined;

    try {
      // 기존 로직
      result = await this.invokeToolInternal(tool, option);
    } catch (e) {
      status = 'error';
      error = e.message;
      throw e;
    } finally {
      if (this.usageTracker) {
        this.usageTracker.trackUsage({
          toolId: this.metadata.id,
          toolName: tool.name,
          action: 'invoke',
          duration: Date.now() - startTime,
          status,
          parameters: option?.input,
          error,
        });

        // 메타데이터 업데이트
        this.metadata.usageCount++;
        this.metadata.lastUsedAt = new Date();
      }
    }

    return result;
  }

  // 새로운 메서드들
  getMetadata(): McpToolMetadata {
    return { ...this.metadata };
  }

  getUsageLogs(): McpUsageLog[] {
    return this.usageTracker?.getUsageLogs(this.metadata.id) ?? [];
  }

  getUsageStats(): McpUsageStats {
    return this.usageTracker?.getUsageStats(this.metadata.id) ?? {
      totalUsage: 0,
      successRate: 0,
      averageDuration: 0,
      errorCount: 0,
    };
  }
}
```

## 📝 Todo 리스트

### Phase 1: Core 타입 및 기능 추가

- [ ] **[TODO 1/8]** `packages/core/src/tool/mcp/mcp-types.ts` 생성
  - McpToolMetadata, McpUsageLog 인터페이스 정의
  - McpUsageTracker 인터페이스 정의
  - 관련 enum/type 정의

- [ ] **[TODO 2/8]** `packages/core/src/tool/mcp/mcp-usage-tracker.ts` 구현
  - InMemoryUsageTracker 클래스 구현
  - 사용량 로그 저장 및 조회 기능
  - 통계 계산 로직

- [ ] **[TODO 3/8]** `packages/core/src/tool/mcp/mcp.ts` 확장
  - 사용량 추적 기능 추가
  - 메타데이터 관리 기능 추가
  - 기존 API 호환성 유지

- [ ] **[TODO 4/8]** Core 타입 export 및 테스트 작성
  - `packages/core/src/index.ts`에서 새 타입들 export
  - 단위 테스트 작성

### Phase 2: GUI 통합

- [ ] **[TODO 5/8]** GUI 타입 마이그레이션
  - MCPTool → McpToolMetadata + GUI 전용 필드로 분리
  - ToolUsageLog → McpUsageLog 기반으로 변경

- [ ] **[TODO 6/8]** GUI 서비스 레이어 업데이트
  - MCP 서비스에서 Core 사용량 데이터 활용
  - 실시간 데이터 동기화 로직

- [ ] **[TODO 7/8]** GUI 컴포넌트 업데이트
  - McpToolManager 컴포넌트를 Core 데이터 기반으로 수정
  - Mock 데이터를 실제 Core 연동으로 변경

### Phase 3: 검증 및 최종화

- [ ] **[TODO 8/8]** 통합 테스트 및 검증
  - GUI와 Core 간 데이터 흐름 검증
  - 성능 테스트 (사용량 추적 오버헤드 확인)
  - 타입 안전성 검증

## 🔄 작업 순서

**Phase 1 우선 진행**: Core 기능을 먼저 구현하여 안정적인 기반 마련
**Phase 2 점진적 통합**: GUI를 Core 기반으로 단계적 마이그레이션  
**Phase 3 검증**: 전체 시스템 통합 테스트 및 최적화

## 🎨 설계 원칙

1. **하위 호환성**: 기존 Mcp 클래스 사용 코드에 Breaking Change 없음
2. **옵셔널 기능**: 사용량 추적은 설정으로 활성화/비활성화 가능
3. **성능 우선**: 사용량 추적이 Core 기능 성능에 영향주지 않음
4. **타입 안전성**: 모든 인터페이스에 명시적 타입 정의
5. **확장성**: 다른 앱(CLI, Slack Bot)에서도 쉽게 활용 가능한 구조

## 🧪 성공 지표

- [ ] GUI MCPTool Manager가 Core 데이터를 실시간으로 표시
- [ ] 사용량 통계가 정확하게 수집되고 표시됨
- [ ] 기존 MCP 기능의 성능 저하 5% 이하
- [ ] 모든 타입 체크 통과 (`pnpm typecheck`)
- [ ] 단위 테스트 및 통합 테스트 100% 통과

이 계획을 통해 GUI의 MCP 관리 기능이 Core의 표준화된 타입과 기능을 활용하게 되어, 전체 AgentOS 생태계에서 일관된 MCP 도구 관리가 가능해집니다.

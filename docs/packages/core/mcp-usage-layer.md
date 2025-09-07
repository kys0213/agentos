# Core MCP Usage Layer

MCP 도구 호출에 대한 사용량 로그와 통계를 수집하기 위한 레이어입니다. `McpService`와 분리되어 동작하며, 저장소와 서비스로 구성되어 있어 GUI 등 다른 앱에서 재사용할 수 있습니다.

## 개념

- **McpUsageLog**: 도구 호출 한 건을 기록. 도구 ID/이름, 성공·실패 상태, 지연 시간, 에이전트·세션 ID, 에러 코드 등을 포함합니다.
- **McpUsageStats**: 특정 쿼리에 대한 총 호출 수, 성공률, 평균 지연 시간 등의 통계 정보를 제공합니다.
- **McpUsageQuery**: 도구 ID·이름, 에이전트 ID, 기간, 상태 등으로 로그와 통계를 필터링하기 위한 조건입니다.

## 저장소 인터페이스

```ts
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../../../common/pagination/cursor-pagination';

export interface McpUsageRepository {
  append(logs: McpUsageLog | McpUsageLog[]): Promise<void>;
  list(query?: McpUsageQuery, pg?: CursorPagination): Promise<CursorPaginationResult<McpUsageLog>>;
  getStats(query?: McpUsageQuery): Promise<McpUsageStats>;
}
```

파일 기반 구현인 `FileMcpUsageRepository`는 NDJSON/JSON 형식으로 로그와 통계를 저장합니다.

## 서비스

```ts
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

`McpUsageService`는 도구 실행 시작/종료 시점을 기록하여 로그를 생성하고, 조회 및 통계 기능을 제공합니다.

## 퍼시스턴스 레이아웃

```
<baseDir>/mcp-usage/
  usage-logs.jsonl   # (옵션) 각 라인에 하나의 McpUsageLog
  usage-stats.json   # { perTool: { [toolId]: McpUsageStats }, updatedAt }
```

## 사용 예시

```ts
const repo = new FileMcpUsageRepository('/path/to/appdata');
const usage = new McpUsageService(repo);

const id = await usage.recordStart({ toolId: 'echo' });
// ... 도구 실행 ...
await usage.recordEnd(id, { status: 'success', durationMs: 120 });

const stats = await usage.getStats({ toolId: 'echo' });
```

## 참고 사항

- 입력/출력 원문과 같은 민감 정보는 저장하지 않습니다.
- `McpService`의 작업 이벤트 훅을 통해 자동으로 사용량이 기록됩니다.
- GUI에서는 이 서비스를 이용해 최근 호출 로그와 통계 대시보드를 표시할 수 있습니다.

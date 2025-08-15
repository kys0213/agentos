# 작업계획서: LLM Usage Persistence (File-backed)

## Requirements

### 성공 조건
- [ ] In-memory 사용량 트래커의 데이터를 주기적으로 파일에 스냅샷 저장한다.
- [ ] 앱 재시작 후에도 직전 스냅샷을 기반으로 사용량 통계를 복구할 수 있다.
- [ ] 플러시(저장) 정책을 시간/개수 기준으로 설정할 수 있다.
- [ ] API는 기존 `LlmBridgeUsageTracker` 인터페이스와 100% 호환된다.
- [ ] 코어 단위 테스트는 결정적으로 통과하며 외부 I/O는 모두 mocking한다.

### 사용 시나리오
- [ ] GUI 분석 탭이 재시작 이후에도 누적 사용량/최근 사용 시각을 그대로 표시한다.
- [ ] 장시간 실행 중에도 일정 주기로 안전하게 저장되어 데이터 유실을 최소화한다.
- [ ] 종료 훅에서 마지막 플러시를 시도한다(가능한 범위 내).

### 제약 조건
- [ ] 파일 크기/로그 수 제한을 초과하면 롤링 또는 요약 스냅샷만 유지한다.
- [ ] 가격/비용 계산은 범위 외(토큰 통계까지 지원).

## Interface Sketch

```typescript
// 기존 타입 (@agentos/core)
export interface LlmBridgeUsageTracker {
  trackUsage(log: Omit<LlmBridgeUsageLog, 'id' | 'timestamp'>): void;
  getUsageLogs(bridgeId?: string): LlmBridgeUsageLog[];
  getUsageStats(bridgeId?: string): LlmBridgeUsageStats;
  clearLogs(olderThan?: Date): void;
}

// 신규 구현
export interface FileBackedUsageOptions {
  flushIntervalMs?: number;      // e.g., 30_000
  flushEveryNLogs?: number;      // e.g., 100
  persistLogs?: boolean;         // default: false (스냅샷만 저장)
  maxLogs?: number;              // 로그 보존 한도
}

export class FileBackedLlmUsageTracker implements LlmBridgeUsageTracker {
  constructor(baseDir: string, options?: FileBackedUsageOptions) {}
  trackUsage(log: Omit<LlmBridgeUsageLog, 'id' | 'timestamp'>): void {}
  getUsageLogs(bridgeId?: string): LlmBridgeUsageLog[] { return []; }
  getUsageStats(bridgeId?: string): LlmBridgeUsageStats { return { /* aggregated */ } as any }
  clearLogs(olderThan?: Date): void {}
  close(): Promise<void> { return Promise.resolve(); } // 타이머 정리 + 마지막 flush
}
```

## Persistence Layout
```
<baseDir>/llm-usage/
  usage-stats.json     # { perBridge: { [bridgeId]: LlmBridgeUsageStats }, updatedAt }
  usage-logs.jsonl     # (옵션) 1라인=1로그, 보존 개수/용량 제한
```

## Test Plan (docs/TESTING.md 준수)
- [ ] FS mocking: `@agentos/lang`의 `FileUtils`/`JsonFileHandler`를 jest.mock으로 대체
- [ ] Fake timers: `jest.useFakeTimers()`로 인터벌/임계치 플러시 테스트
- [ ] 결정적 시나리오: track → flush 조건 충족 → 파일로 스냅샷 확인 → 재생성(load) 후 통계 일치
- [ ] 경계 케이스: maxLogs 초과 시 롤링, clearLogs 동작, persistLogs=false일 때 로그 미저장

## Todo
- [ ] 파일 백업 트래커 설계 확정(`FileBackedUsageOptions` 포함)
- [ ] 스냅샷 저장/로드 구현(요약 우선, 로그는 옵션)
- [ ] 플러시 정책(시간/개수) 구현 + 종료 훅 처리(메서드 제공)
- [ ] 단위 테스트 작성(모킹 FS + fake timers)
- [ ] 문서 추가(`packages/core/docs/CORE_LLM_USAGE_PERSISTENCE.md`)

## 작업 순서
1. 옵션/파일 레이아웃 최종 정의 → 인터페이스 고정
2. 스냅샷 저장/로드(요약) 구현 → 기본 테스트 통과
3. 플러시 정책/close 구현 → 타이머 기반 테스트 통과
4. (옵션) 로그 보존 구현 + 테스트
5. 문서화 및 예시 코드 추가

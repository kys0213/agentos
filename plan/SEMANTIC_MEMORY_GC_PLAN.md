# Semantic Memory GC & Sleep-cycle Consolidation Plan

## Requirements

### 성공 조건

- [x] GraphStore 기반의 세션/에이전트 그래프에서 "수면 주기" 정리 루틴이 동작하여 중복 노드 통합, 요약, 가중치 재조정을 수행한다.
- [x] LRU/랭크 기반 삭제가 발생하기 전에 의미적 통합 절차가 선행되어, 저장 한도를 초과할 때도 핵심 노드가 보존된다.
- [x] 온디바이스 LLM 요약 결과가 canonical text/메타데이터와 안전하게 동기화되며, 중복 탐지 품질이 저하되지 않는다.
- [x] 정리 루틴의 효과(삭제된 노드 수, 통합된 클러스터 수, 랭크 향상 등)를 관찰할 수 있는 메트릭/로그가 추가된다.

### 사용 시나리오

- [x] 세션 종료 시 MemoryOrchestrator가 기존 승격 흐름과 함께 정리 루틴을 호출하여 장기 기억으로 옮기기 전 노드를 재구성한다.
- [ ] 주기적인 백그라운드 작업(예: N회 상호작용 후 또는 시간 기반 트리거)으로 세션/에이전트 그래프에 대해 의미 통합을 실행한다. *(후속 작업으로 분리 예정)*
- [x] 저장 한도 초과로 `evictIfNeeded`가 호출될 때, 제거 대신 통합 후보를 선별하여 요약/병합을 우선 시도한다.

### 제약 조건

- [x] 온디바이스 LLM 호출 횟수와 지연을 제어하기 위한 배치 처리·예산 관리가 필요하다.
- [x] GraphStore의 canonical key 규칙과 코사인 유사도 기반 중복 감지를 유지해야 한다.
- [x] 인메모리 구조 유지: 새 데이터 구조는 기존 직렬화/스냅샷 경로를 깨지 않아야 한다.
- [x] 테스트 범위: 단위 테스트(그래프 정리 로직), 통합 테스트(세션 종료/에이전트 승격 흐름)로 증거 확보.

## Interface Sketch

```typescript
// 의미 통합을 총괄하는 엔트리 포인트
interface SleepCycleOptions {
  maxBatches: number;
  similarityThreshold: number;
  summaryLength: number;
  maxIterations: number;
  trigger: 'session-finalize' | 'eviction' | 'interval';
}

class MemorySleepCycle {
  constructor(private readonly store: GraphStore, private readonly llm: OnDeviceLLM) {}

  async run(options: SleepCycleOptions): Promise<SleepCycleReport>;

  private selectCandidates(): NodeCluster[]; // 랭크/차수 기반 후보 선정
  private async consolidateCluster(cluster: NodeCluster): Promise<ConsolidationResult>;
  private mergeWeights(result: ConsolidationResult): void;
  private emitMetrics(report: SleepCycleReport): void;
}

interface ConsolidationResult {
  canonicalText: string;
  mergedNodeId: string;
  mergedEdges: EdgeUpdate[];
  removedNodeIds: string[];
  logs: string[];
}

// GraphStore 확장 포인트 예시
class GraphStore {
  async runSleepCycle(options: SleepCycleOptions): Promise<SleepCycleReport>;
  protected prepareEvictionContext(): EvictionContext; // 기존 evictIfNeeded 경로와 연동
}

interface MemoryOrchestrator {
  finalizeSession(sessionId: string, opts?: { runSleepCycle?: boolean }): Promise<void>;
  scheduleSleepCycle(trigger: SleepCycleTrigger): void;
}
```

## Integration Pseudocode

```typescript
// GraphStore 내부: 기존 upsert, eviction 경로에 sleep-cycle 삽입
class GraphStore {
  private sleepCycle?: MemorySleepCycle;

  configureSleepCycle(deps: { llm: OnDeviceLLM; options: SleepCycleOptions }): void {
    this.sleepCycle = new MemorySleepCycle(this, deps.llm, deps.options);
  }

  async upsertQuery(payload: QueryPayload): Promise<QueryNode> {
    const node = await this.doUpsert(payload);
    if (this.shouldTriggerSleepCycle('interval')) {
      await this.sleepCycle?.run({ trigger: 'interval' });
    }
    return node;
  }

  protected async evictIfNeeded(): Promise<void> {
    const overLimit = this.isOverCapacity();
    if (!overLimit) return;

    const consolidation = await this.sleepCycle?.run({ trigger: 'eviction' });
    if (!consolidation?.freedCapacity) {
      await this.performEviction(); // 기존 LRU/랭크 기반 제거
    }
  }
}

// MemorySleepCycle 내부: 후보 선정 → LLM 요약 → 병합
class MemorySleepCycle {
  constructor(
    private readonly store: GraphStore,
    private readonly llm: OnDeviceLLM,
    private readonly defaults: SleepCycleOptions,
  ) {}

  async run(partial: Partial<SleepCycleOptions>): Promise<SleepCycleReport> {
    const options = { ...this.defaults, ...partial };
    const candidates = this.selectCandidates(options);
    const report: SleepCycleReport = { clusters: [], freedCapacity: 0 };

    for (const cluster of candidates.slice(0, options.maxBatches)) {
      const summary = await this.llm.summarize(cluster.nodes, options.summaryLength);
      const result = await this.consolidateCluster(cluster, summary, options);
      this.mergeWeights(result);
      this.store.replaceNodes(result);
      report.clusters.push(result);
      report.freedCapacity += result.removedNodeIds.length;
    }

    this.emitMetrics(report, options.trigger);
    return report;
  }
}

// MemoryOrchestrator: 세션 종료 시 sleep-cycle 실행
class MemoryOrchestrator {
  constructor(private readonly store: GraphStore) {}

  async finalizeSession(sessionId: string, opts?: { runSleepCycle?: boolean }): Promise<void> {
    await this.promoteTopQueries(sessionId);
    if (opts?.runSleepCycle ?? true) {
      await this.store.runSleepCycle({ trigger: 'session-finalize' });
    }
  }

  scheduleSleepCycle(trigger: SleepCycleTrigger): void {
    queueMicrotask(() => this.store.runSleepCycle({ trigger }));
  }
}
```

## Todo

- [ ] 요구사항 상세화 및 계획서 리뷰(본 문서 공유 및 피드백 수렴)
- [x] GraphStore 후보 선정 로직 정의(랭크, 차수, 유사도 기반 클러스터링)
- [x] 온디바이스 LLM 요약/정규화 파이프라인 설계 및 인터페이스 확정
- [x] 통합 결과에 따른 가중치/엣지 재분배 규칙 설계
- [x] SleepCycle 실행 경로 구현(세션 종료, 주기적, 강제 실행)
- [x] 메트릭/로그 및 관찰 가능성 추가
- [x] 단위 테스트 작성(GraphStore 정리 로직, LLM 호출 mocking)
- [x] 통합 테스트 작성(MemoryOrchestrator와의 연동, eviction 경로)
- [x] 문서 업데이트(사용자 가이드, 아키텍처 문서) — `docs/packages/core/memory-api.md`, `docs/packages/core/memory-personalized.md`

## 작업 순서

1. **1단계**: 요구사항 명세 구체화 및 후보 선정 알고리즘 설계 (완료 조건: 리뷰 통과한 설계 명세)
2. **2단계**: LLM 요약 파이프라인·통합 규칙 정의 및 인터페이스 고정 (완료 조건: 타입/시그니처 확정, 목 객체 테스트)
3. **3단계**: SleepCycle 실행 경로 구현 및 메트릭/로그 추가 (완료 조건: 핵심 로직 단위 테스트 통과)
4. **4단계**: MemoryOrchestrator 연동, eviction 후순위 통합 적용, 통합 테스트 작성 (완료 조건: 통합 테스트 통과)
5. **5단계**: 문서화 및 관찰 가능성 검증(대시보드/로그 샘플), 최종 리뷰 (완료 조건: 문서 및 로그 샘플 배포)

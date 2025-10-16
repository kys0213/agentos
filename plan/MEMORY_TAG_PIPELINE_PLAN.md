# 작업계획서: 메모리 태깅 및 승격 개선

## Requirements

### 성공 조건

- [x] 세션 그래프에서 일정 개수의 연속된 질의를 묶어 태그 엔터티를 자동 생성한다.
- [x] 생성된 태그 엔터티가 해당 질의들과 `refers_to_entity` 엣지로 연결된다.
- [x] 세션 승격 시 프로모션 대상 질의와 연결된 태그가 에이전트 그래프로 이전(또는 병합)되어 연결이 유지된다.
- [x] 태그 생성 및 승격 동작이 단위 테스트로 검증된다.

### 사용 시나리오

- [x] 에이전트가 세션 중 5개의 발화를 입력하면, LLM을 호출해 JSON 배열 형태의 태그를 생성한다.
- [x] 세션 종료 시 승격된 핵심 질의는 관련 태그와 함께 장기 기억(에이전트 그래프)에 보존된다.
- [x] 동일한 태그 문자열이 재사용되면 중복 노드 대신 가중치가 누적된다.

### 제약 조건

- [x] 태그 생성은 LLM 브릿지를 통해 수행하며, 호출 실패 시에도 시스템이 안전하게 동작해야 한다.
- [x] 기존 그래프 스토어 API와 호환되도록 타입 변경을 최소화한다.
- [x] 태그 처리는 구성 옵션을 통해 비활성화할 수 있어야 한다.

## Interface Sketch

```typescript
export interface TagExtractor {
  extract(input: { texts: string[]; existing: string[]; maxTags: number }): Promise<string[]>;
}

export interface OrchestratorCfg {
  tagging?: {
    window: number;
    maxTagsPerBatch?: number;
  };
}

class GraphStore {
  upsertTag(tag: string, opts?: { generation?: NodeGeneration; carryWeights?: boolean }): string;
  linkTagToQuery(tagId: string, queryId: string, weight?: number): void;
  getEdges(filter: { from?: string; to?: string; type?: EdgeType }): Edge[];
}
```

## Todo

- [x] `GraphStore`에 태그 업서트, 태그-질의 엣지 조회/생성 API 추가
- [x] 간단한 키워드 기반 `TagExtractor` 구현 및 설정 추가
- [x] `MemoryOrchestrator`에 태깅 버퍼/프로세스 통합
- [x] 승격 시 태그 이전 로직 구현
- [x] 테스트 작성 (단위 테스트)
- [x] 문서 업데이트 (필요 시)

## 작업 순서

1. **1단계**: `GraphStore` API 확장 (태그 업서트, 엣지 조회) – 완료 조건: 새로운 메서드와 기본 테스트 추가
2. **2단계**: 태그 추출기와 오케스트레이터 버퍼 로직 구현 – 완료 조건: 태그가 세션 그래프에 생성되고 연결됨
3. **3단계**: 승격 시 태그 이전 및 테스트/문서 갱신 – 완료 조건: 테스트 통과 및 필요한 문서 업데이트

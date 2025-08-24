# 작업 계획서

# 1. 배경

- AgentOS는 **세션 단기 메모리**와 **에이전트 장기 메모리**를 분리해 운영한다.
- 메모리는 **자연어 질의 → 그래프 노드(쿼리/피드백/엔터티) → 연결/가중치 학습**의 루프를 돈다.
- MVP 목표:
    1. **인메모리 LRU 그래프**(세션/에이전트)
    2. **정확 중복(canonicalKey) + 의미 유사(n‑gram 임베딩)** 업서트/검색
    3. **피드백 학습 + 전파(감쇠)**
    4. **세션 종료 시 승격(promotion)** & **체크포인트 스냅샷**(직렬화 계층 포함)
    5. **하이브리드 검색(세션→에이전트)** de‑dupe(텍스트키) 및 재랭킹

---

# 2. 목표 (Deliverables & Acceptance Criteria)

## D1. GraphStore (인메모리 그래프)

- 노드/엣지 타입: `query | answer | feedback | entity` / `similar_to | responded_with | has_feedback | refers_to_entity`
- 기능:
    - `upsertQuery(text)` 정확 중복은 `canonicalKey`(정규화+해시)로, 의미 유사는 임베딩(`tauDup`, `tauSim`)으로 판정
    - `recordFeedback(qId, label)` + `adjustWeights(qId, { feedbackDelta?, repeatDelta? })`
    - **에지 키 고정**(`from::type::to`)과 누적 weight
    - **가치 기반 LRU**(recency + repeat + feedback)
    - `searchSimilarQueries(text, k)` + 하이브리드 de‑dupe(동일 canonicalKey 우선)
    - **스냅샷/퍼시스턴스**: 임베딩 `Map`은 `[[i,v],...]`로 직렬화/역직렬화
    - **역색인 옵션**: `enableInvertedIndex`일 때 n‑gram/토큰 기반 후보 생성

**AC**

- 초기 스케일 1k 노드/4k 엣지에서 안정 동작(RSS 예산 내)
- `tauDup`로 동일 질의 합쳐지고, `tauSim`로 유사 간선 생성
- 스냅샷 저장→로드 후 검색 결과 일치
 - 동일 canonicalKey는 세션/에이전트 간에도 중복 저장되지 않음(업서트 병합)

## D2. EmbeddingProvider (한국어 패러프레이즈 견고성 + 드리프트 해결)

- 기본: **문자 n‑gram 해시 트릭(고정 차원)** + L2 정규화 + 코사인
  - 예: n=3~5, dim=16384, seed 고정, xxhash3‑128 → 모듈러 매핑
- 대안(옵션): 희소 BoW + cosineSparse
- 임베더 설정/상태(`ngramRange`, `dim`, `seed`, `hashAlgo`, `normVersion`)를 스냅샷에 저장/복구

**AC**

- 동일 텍스트 임베딩 재현성 100%
- 설정이 달라도(버전 차이) 스냅샷 import 시 과거 벡터와 비교 정상(메타 기반 호환)

## D3. MemoryOrchestrator (세션/에이전트 이중 그래프)

- 공통 임베더 공유
- 에이전트 그래프는 agentId 단위의 공유 지식(유저 구분 없음)
- `upsertQuery`, `recordFeedback` → **세션 그래프 우선** 기록
- `search()` → 세션/에이전트 하이브리드, **canonicalKey 기반 1차 de‑dupe + 유사도 재랭킹**
- `finalizeSession({promote, checkpoint})`
    - **승격**: minRank/minDegree/개수 제한으로 세션 핫스팟을 에이전트 그래프로 업서트(동일 canonicalKey 병합)
    - **가중치 이관**(선택): `adjustWeights`로 feedback/repeat 누적 반영
    - **체크포인트 JSON** 생성(임베더 상태/정규화·해시 버전 포함)

**AC**

- 승격 후 에이전트 검색 품질 상승(동일 쿼리의 score ≥ 이전)
- 체크포인트 파일 재로드 시 세션 주요 노드/엣지 재현
- canonicalKey/버전 메타가 포함되어 재현성 확보

## D4. CLI/테스트/문서

- `pnpm test`로 단위·통합 테스트
- `pnpm dev` 샘플 스크립트(세션 열기→질의/피드백→검색→종료)
- README에 환경변수/설정값 가이드

**AC**

- 커버리지 기본 60%+, 핵심 경로(업서트/승격/스냅샷) 포함
- README만 보고 로컬 실행 가능

---

# 3. 인터페이스 스케치

## 패키지 구조

```
packages/core/memory/
  src/
    graph-store.ts
    embedding/
      simple-embedding.ts   // 기본: n‑gram 해시 트릭
    utils/
      canonical-key.ts      // normalize + hash + meta
      serialize-sparse.ts   // [[i,v]] 직렬화/역직렬화
    memory-orchestrator.ts
    types.ts
  test/
    graph-store.spec.ts
    orchestrator.spec.ts
  README.md

```

## 주요 타입 (요약)

```tsx
// types.ts
export type NodeType = 'query'|'answer'|'feedback'|'entity';
export type EdgeType = 'similar_to'|'responded_with'|'has_feedback'|'refers_to_entity';

export interface BaseNode {
  id: string; type: NodeType; text?: string;
  canonicalKey?: string; // 정규화+해시 키(정확 중복 병합)
  embedding?: number[] | Map<number, number>;
  createdAt: number; lastAccess: number;
  weights: { repeat: number; feedback: number; };
  degree: number; pinned?: boolean;
}

export interface Edge {
  id: string; from: string; to: string; type: EdgeType;
  weight: number; createdAt: number; lastAccess: number;
}

export interface GraphConfig {
  maxNodes: number; maxEdges: number; halfLifeMin: number;
  tauDup: number; tauSim: number; protectMinDegree: number;
  enableInvertedIndex?: boolean; // 후보 생성 가속화
}

export interface EmbeddingProvider {
  embed(text: string): number[] | Map<number, number>;
  exportState?(): any; importState?(s: any): void;
}

```

## GraphStore (핵심 API)

```tsx
class GraphStore {
  constructor(cfg: GraphConfig, embedder: EmbeddingProvider) {}

  upsertQuery(text: string): string;
  recordFeedback(qId: string, label: 'up'|'down'|'retry', note?: string): string;
  adjustWeights(id: string, deltas: { feedbackDelta?: number; repeatDelta?: number }): void;
  searchSimilarQueries(text: string, k?: number): Array<{id:string; score:number; sim:number; text?:string; canonicalKey?: string}>;

  link(from: string, to: string, type: EdgeType, weight: number): void;

  toSnapshot(): GraphSnapshot;
  fromSnapshot(s: GraphSnapshot): void;
  saveToFile(file: string, opts?: { onlyIfDirty?: boolean }): Promise<void>;
  static loadFromFile(file: string, store: GraphStore): Promise<void>;

  stats(): { nodes: number; edges: number };
}

```

## MemoryOrchestrator (핵심 API)

```tsx
type Scope = 'agent'|'session';
interface OrchestratorCfg { /* (사용자 제공 코드와 동일 구조) */ }

class MemoryOrchestrator {
  constructor(agentId: string, cfg: OrchestratorCfg) {}

  getSessionStore(sessionId: string): GraphStore;
  getAgentStore(): GraphStore;

  upsertQuery(sessionId: string, text: string): string;
  recordFeedback(sessionId: string, qId: string, label: 'up'|'down'|'retry', note?: string): string;

  search(sessionId: string, text: string, k?: number): Array<{id:string; score:number; from:'session'|'agent'; text?:string; canonicalKey?: string}>;

  finalizeSession(sessionId: string, opts?: { promote?: boolean; checkpoint?: boolean; checkpointName?: string }): Promise<void>;

  // 품질/운영 유틸
  gcSessions(olderThanMs: number): void;
  getActiveSessions(): string[];
}

```

---

# 4. 구체적인 인메모리 기반 그래프 구현체

## 4.1 그래프 핵심 로직

- **에지 키 고정**: `key = ${from}::${type}::${to}`
    - 존재 시 `weight += Δ`, `lastAccess = now`만 갱신 (중복 억제)
- **랭크**:
    
    `rank = 0.5*recency + 0.3*tanh(repeat/5) + 0.2*tanh(feedback/5)`
    
    - recency = `exp(-ln2 * ageMin/halfLifeMin)`
- **에빅션**:
    - 노드: `pinned`/`degree >= protectMinDegree` 제외 후 **낮은 rank**부터 제거
    - 엣지: `weight` 낮고 `lastAccess` 오래된 순 제거
- **시간 감쇠**: 계산 시 적용(간단). 필요 시 정기 감쇠 태스크로 실제 weight 감소.

## 4.2 임베딩

- 기본: **문자 n‑gram 해시 트릭**(dim=16k, seed 고정) + L2 정규화 + 코사인
  - 한국어 패러프레이즈(띄어쓰기/조사/어순 변화)에 견고
- 대안: 희소 BoW + cosineSparse
- 스냅샷에는 임베더 설정/버전 메타 포함

## 4.3 검색 속도

- 초기: 선형 스캔(MVP OK)
- 다음: **역색인(n‑gram→nodeIds)**로 후보 블로킹 후 코사인 계산(`enableInvertedIndex`)
- 이후: `sqlite-vec`/HNSWlib로 ANN 전환

## 4.4 승격/체크포인트

- 승격 기준: `rank >= minRank && degree >= minDegree` 상위 `maxPromotions`
- 승격 시:
    - 동일/유사 쿼리 탐색 → 없으면 생성, 있으면 **weights/degree 누적**(옵션)
- 체크포인트 JSON:
    - `version, agentId, sessionId, createdAt, topQueries[], edges[], embedderState, canonicalMeta{normVersion,hashAlgo,seed}`
    - 임베딩은 `[[i,v],...]`로 직렬화, 로드 시 역직렬화

## 4.5 동시성/일관성

- 단일 프로세스 내에서 `writeQueue` + 경량 `Mutex`로 save/snapshot/promotion 보호
- 파일 I/O는 디바운스/배치로 write‑amp 감소

---

# 5. TODO 항목 (codex CLI 지시문 포함)

아래는 **작업 순서**와 codex CLI에 붙일 수 있는 **명령 프롬프트 예시**야.

## T0. 초기 설정

- [ ]  워크스페이스 스캐폴딩
    - `pnpm init -w` / `tsconfig.json` / `jest` 세팅
- [ ]  패키지 생성: `packages/core/memory`

**codex 지시문 예시**

```
Create a pnpm monorepo package `packages/core/memory`. Setup TypeScript, jest, eslint. Provide scripts:
- "build", "test", "demo".

```

## T1. 타입/임베딩

- [ ]  `types.ts` 정의(BaseNode.canonicalKey, GraphConfig.enableInvertedIndex)
- [ ]  `embedding/simple-embedding.ts` 문자 n‑gram 해시 임베딩 + 설정 `exportState/importState`
- [ ]  `utils/cosineSparse.ts`, `utils/canonical-key.ts`, `utils/serialize-sparse.ts`

**codex**

```
Implement n‑gram hashing embedding with normalize(text) and cosineSparse(Map,Map).
Add canonicalKey generation with versioned meta and sparse serialize/deserialize utils.

```

## T2. GraphStore v1

- [ ]  노드/엣지 Map, byCanonicalKey 인덱스(+옵션: inverted index)
- [ ]  `upsertQuery`, `recordFeedback`, `adjustWeights`, `link`(고정 키), `searchSimilarQueries`
- [ ]  LRU 에빅션, rank 계산
- [ ]  스냅샷/퍼시스턴스 API

**codex**

```
Implement GraphStore with:
- upsertQuery(text) using canonicalKey for exact-dup and tauDup/tauSim for embedding merge.
- recordFeedback(qId,label) updating weights; provide adjustWeights for carry-over.
- link() that merges edges by key `${from}::${type}::${to}`.
- rank() and eviction by lowest rank.
- toSnapshot/fromSnapshot/saveToFile/loadFromFile including embedder state and serialized sparse vectors.
Add unit tests covering duplicate merge, serialization round-trip, and eviction.

```

## T3. Orchestrator v1

- [ ]  `MemoryOrchestrator` 생성자/세션 관리
- [ ]  `search()` 하이브리드 + **canonicalKey dedupe + 재랭크**
- [ ]  `finalizeSession()` 승격 + 체크포인트(임베더/정규화·해시 메타 포함)

**codex**

```
Implement MemoryOrchestrator:
- getSessionStore, upsertQuery, recordFeedback
- search(): merge session/agent results, dedupe by canonicalKey, add session-first bias.
- finalizeSession(): promote hotspots by rank/degree, upsert to agent store with canonicalKey merge; apply adjustWeights if carryWeights; write checkpoint JSON with embedder state + canonical meta.

```

## T4. 샘플 스크립트/테스트

- [ ]  `examples/demo.ts`
    - 세션 시작→질의 5개→유사 질의→피드백 up/down→검색→종료(finalize)
- [ ]  통합 테스트: 승격 전후 검색 점수 비교

**codex**

```
Create examples/demo.ts that simulates a session with queries/feedback, prints search results before and after finalizeSession, and writes a checkpoint to .agentos/checkpoints.

```

## T5. 품질 보강

- [ ]  역색인 추가(n‑gram→nodeIds)
- [ ]  세션 GC(`gcSessions(olderThanMs)`)
- [ ]  README 작성(설정값 가이드/AC)

**codex**

```
Add a simple inverted index to GraphStore for candidate blocking in searchSimilarQueries.
Implement gcSessions(olderThanMs).
Write README with configuration examples and acceptance criteria.

```

## T6. 선택 과제(다음 스프린트)

- [ ]  엔터티 업서트(`upsertEntity`) + `refers_to_entity` 자동 후보 링크
- [ ]  가중치 실제 감쇠(주기 태스크)
- [ ]  해시 트릭 임베더 추가 옵션
- [ ]  SQLite 퍼시스턴스/ANN 인덱스 플러그인 포인트

**codex**

```
Design upsertEntity(userId, canonicalId, text?, aliases?) and auto-link refers_to_entity for new queries via rule-based matching; add tests.

```

---

## 참고 설정값(초기 추천)

```tsx
const cfg: OrchestratorCfg = {
  sessionGraph: { maxNodes: 1_000, maxEdges: 4_000, halfLifeMin: 240, tauDup: 0.96, tauSim: 0.75, protectMinDegree: 3, enableInvertedIndex: false },
  agentGraph:   { maxNodes: 1_000, maxEdges: 12_000, halfLifeMin: 1440, tauDup: 0.96, tauSim: 0.78, protectMinDegree: 4, enableInvertedIndex: true },
  promotion:    { minRank: 0.55, maxPromotions: 20, minDegree: 2 },
  checkpoint:   { outDir: './.agentos/checkpoints', topK: 30, pretty: true },
  searchBiasSessionFirst: 0.05,
};

```

---

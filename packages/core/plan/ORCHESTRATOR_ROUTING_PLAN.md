# Core Orchestrator Routing Plan

## Requirements

### 성공 조건

- [ ] 플랫폼 비의존 라우팅 추상화를 제공한다(`AgentRouter`, `RouterQuery`).
- [ ] Preset/Agent 메타를 직접 활용하는 라우팅(별도 Profile/Builder 불필요). 간단한 `doc` 유틸 제공(선택).
- [ ] BM25 + 휴리스틱 기반 기본 라우터 구현을 제공한다(mention/hints/keywords/tools/fileType 가중치).
- [ ] 토크나이저 플러그형 구조를 제공한다(기본: `EnglishSimpleTokenizer`, 선택: `LlmKeywordTokenizer`).
- [ ] 타입 안전성 보장(`any` 금지), `@agentos/core` 내에서 재사용 가능.
- [ ] `index.d.ts`를 통해 공개 API로 노출한다.

### 사용 시나리오

- [ ] Slack 앱: 앱 계층 `OrchestratorService`가 `AgentRouter`를 주입받아 후보 중 1개를 선택.
- [ ] GUI/CLI: 동일 `RouterQuery` 입력으로 라우팅 재사용.
- [ ] 향후: Top-K 후보를 UI로 노출해 사용자가 선택하도록 확장 가능.

### 제약 조건

- [ ] 코어는 `channelId/threadId/userId` 등 플랫폼 식별자를 알지 않는다.
- [ ] 외부 의존성 최소화. BM25는 코어의 경량 인메모리 구현 사용.
- [ ] 성능: 후보 수십~수백 규모에서 ms 단위 라우팅.

## Interface Sketch

```ts
import type { Agent } from '../agent/agent';
import type { ReadonlyAgentMetadata } from '../agent/agent-metadata';
import type { CoreContent } from '../chat/content';
import type { Preset, ReadonlyPreset } from '../preset/preset';
import type { Tokenizer } from '../knowledge/tokenizer';

// 플랫폼 비의존 라우팅 입력(최소 신호 + 선택적 파생 피처)
// - text/content만으로도 동작해야 하며, tags/hints/locale/meta는 Orchestrator 계층에서
//   LLM/휴리스틱으로 파생한 값(선택)입니다.
export interface RouterQuery {
  text?: string;
  content?: CoreContent[]; // 파일/이미지 등 멀티모달 입력
  // 선택적 파생 피처(Orchestrator 계층에서 파생/주입 가능)
  tags?: string[];         // 예: "translate", "summarize"
  hints?: string[];        // 예: 멘션/커맨드에서 추출된 힌트
  locale?: string;         // 예: 입력 언어/로캘 힌트
  meta?: Record<string, unknown>; // 앱 전용 부가정보
}

// 라우터 출력(정렬된 후보 목록 + 선택적 점수 메타데이터)
export interface RouterOutput {
  agents: Agent[]; // score 내림차순
  scores?: Array<{ agentId: string; score: number; metadata?: Record<string, unknown> }>;
}

// 단일 계약: 옵션으로 topK 지정 (기본 1)
export interface AgentRouter {
  route(
    query: RouterQuery,
    agents: Agent[],
    options?: { topK?: number; includeScores?: boolean }
  ): Promise<RouterOutput>;
}

// Note: 별도의 RoutingProfile 컨버전 계층 없이, 전략은 ReadonlyAgentMetadata를 직접 사용한다.
// 필요 시 각 전략 내부에서 preset/metadata를 바탕으로 도큐먼트 문자열(doc)이나 토큰을 생성한다.
// 공용 유틸(선택): 아래 DocBuilder는 선택적 도우미로만 제공 가능.

export interface DocBuilderOptions {
  promptLimit?: number; // 기본 512자
}

export type BuildDocFn = (
  meta: ReadonlyAgentMetadata,
  options?: DocBuilderOptions
) => string; // name+desc+cats+promptSnippet+enabledMcpToolTokens(+keywords)

// 전략 점수 결과(전략 내부 가중/정규화 포함)
export interface ScoreResult {
  score: number;
  metadata?: Record<string, unknown>; // 전략별 디버그/설명용 메타데이터
}

// 가중치 정책
// 외부 가중치 맵은 두지 않는다. 각 전략이 내부적으로 스케일/가중을 포함한 최종 점수를 반환하여
// 합성 라우터는 단순 합산으로 결합한다(필요 시 전략 내부에서 정규화 권장).

// 프로필 빌더는 사용하지 않는다. 필요 시 BuildDocFn 유틸로 대체한다.

// 전략 함수(단순화): 메타 배열과 쿼리를 받아 agentId→ScoreResult 맵 반환
export type RoutingStrategyFn = (args: {
  query: RouterQuery;
  metas: ReadonlyAgentMetadata[];
  helpers: { tokenize: (text: string) => Promise<string[]>; buildDoc?: BuildDocFn };
}) => Promise<Map<string, ScoreResult>>;

// 합성 라우터: 여러 전략 점수를 단순 합산으로 결합
export class CompositeAgentRouter implements AgentRouter {
  constructor(
    private readonly strategies: RoutingStrategyFn[],
    private readonly helpers: { tokenize: Tokenizer; buildDoc?: BuildDocFn }
  ) {}
  // 구현 개요(간소화):
  // - agents → getMetadata() 병렬 수집 → metas 배열
  // - Promise.all(strategies.map(fn => fn({ query, metas, helpers }))) 실행
  // - agentId별 ScoreResult.score 합산 → 내림차순 정렬 → topK 반환
  // - includeScores면 score/metadata 포함한 RouterOutput 반환
  route(
    query: RouterQuery,
    agents: Agent[],
    options?: { topK?: number; includeScores?: boolean }
  ): Promise<RouterOutput>;
}

// 앱 계층 확장(참고): Enrichment/Telemetry/Adapter는 앱에서 구현. 코어는 관여하지 않는다.

## Cross‑Channel Considerations (GUI/Slack/CLI)

- Assist vs Auto:
  - GUI는 보조(assist) 모드에서 `topK>1` + `includeScores=true`로 후보와 근거를 표시하고 사용자가 선택할 수 있어야 함.
  - Auto 모드에서는 `topK=1`만 사용하여 즉시 실행.
- Explainability(추천 근거):
  - `ScoreResult.metadata`에 전략별 간단 근거를 권장(예: `{ strategyScores: { bm25: 0.62, mention: 1 }, matchedTerms: string[], toolHits: string[], fileTypes?: string[] }`).
  - 민감 정보는 포함하지 않으며, 토큰/키워드/카테고리 등 비식별 정보 위주.
- Determinism(안정 정렬):
  - 동점 시 결정적 타이브레이커 적용: `score desc → status rank(active > idle > inactive > error) → lastUsed desc → usageCount desc → name asc → id asc`로 UI 깜빡임 최소화.
- Performance(실시간 UX):
  - 100명 후보 기준 라우팅 < 25ms(권장). 라이브 타이핑 시 최소 길이/디바운스 적용은 앱에서 처리.
  - 라우터 구현에서 문서 생성/토큰화 결과를 후보별 캐시(agentId+version 키)로 재사용.
- i18n/Tokenizer:
  - 토크나이저를 DI로 제공하고, GUI에서 `locale` 힌트를 RouterQuery에 주입해 전략이 선택 사용 가능.
  - v1은 `EnglishSimpleTokenizer` 기본 + 선택적 `LlmKeywordTokenizer` 지원, v1.1에서 한국어/CJK 대응(문자 바이그램 등) 확장 고려.
- Failure/Timeouts:
  - 라우팅 실패 시 최근 사용 에이전트 폴백은 앱 정책. 코어는 단순히 빈 결과 또는 기본값 1개를 반환.
- Privacy:
  - `metadata`는 사용자 입력 원문을 넣지 말고, 하이라이트 가능한 토큰/키만 제공.

## Design Refinements(보완 사항)

- 입력 정규화: `query.text`를 우선 사용, 없으면 `query.content`에서 텍스트만 추출해 단일 질의 문자열을 생성하는 유틸을 제공한다(모든 전략이 동일 기준 문자열을 사용).
- 상태 게이팅: 기본 후보는 `active`만 포함, `idle`은 멘션·힌트가 있을 때 포함, `inactive`/`error`는 명시 타깃일 때만 허용(기본 제외).
- 캐싱: 후보별 doc/토큰 캐시를 `agentId + metadata.version` 키로 관리한다(버전 미지정 시 보수적 TTL).
- 안전한 DocBuilder: 프롬프트 원문(`systemPrompt`)은 노출하지 않고, 최대 256~512자 스니펫과 `name/description/keywords/category/toolNames` 중심으로 doc을 구성한다.
- 전략 출력 규약: 모든 전략은 [0,1] 범위 점수와 간단한 설명 메타데이터(`matchedTerms`, `strategyScores`)만을 반환한다(사용자 입력 원문 금지).
- 결정적 정렬: 상기 타이브레이커 규칙을 합성 라우터 결과 정렬에 일관 적용한다.

## Strategy Set(v1 제안)

- MentionStrategy: 멘션/정확 이름/ID 매칭 시 1.0, 그 외 0.
- BM25TextStrategy: 안전 DocBuilder로 생성한 문서 vs 정규화 쿼리로 BM25 점수 계산, 결과군 내 min-max 정규화로 [0,1].
- KeywordBoostStrategy: 쿼리 토큰 ∩ `metadata.keywords`/`preset.category` 교집합 수에 따라 +0.1~0.2 가산(상한 캡).
- ToolHintStrategy: 힌트가 MCP 툴 제목/이름과 매칭되면 소폭 가산.
- FileTypeStrategy: 입력에 `image|audio|video|file` 존재 시 멀티모달 적합 에이전트에 가산.

각 전략은 내부에서 자체 정규화·가중을 포함하고, 합성 라우터는 단순 합산 후 결정적 정렬을 수행한다.

## Todo

- [x] `RouterQuery`/`AgentRouter`/`ScoreResult` 타입 정의
- [x] 입력 정규화 유틸: `RouterQuery`에서 표준 질의 문자열 생성
- [x] BuildDocFn 유틸(선택): Preset/메타 기반 안전 doc 생성 + snippet 길이 제한(256~512자)
- [x] 기본 전략 구현(v1): Mention, BM25Text, KeywordBoost, ToolHint, FileType
- [x] 상태 게이팅 적용: active 기본, idle 조건부 포함
- [x] 캐시 계층: `agentId+version` 키 기반 doc/토큰 캐시(라우팅 호출 단위 캐시 구현)
- [x] `CompositeAgentRouter` 구현(전략 병렬 실행→합산→결정적 정렬 Top-K)
- [x] 토크나이저 DI 및 기본값 설정, LLM 키워드 토크나이저 옵션화(선택)
- [x] 단위 테스트: mention 우선/BM25 매칭/동률 타이브레이커
- [x] 퍼포먼스 스모크 테스트(100 agents, 평균 라우팅 시간 측정)
- [x] 문서: `docs/INTERFACE_SPEC.md`에 코어 라우팅 API 섹션 추가
- [x] 패키지 export: `packages/core/src/index.ts`에 공개

## 작업 순서

1. 타입 정의: RouterQuery/AgentRouter/ScoreResult/DocBuilder (완료)
2. 입력 정규화/안전 DocBuilder/캐시 인터페이스 확정(캐시는 보류)
3. 전략 설계: 함수형 전략 시그니처 합의(0..1 정규화), 상태 게이팅 규칙 포함
4. Composite 라우터: 점수 합산→결정적 정렬 + 테스트(일부 테스트 완료)
5. DI/Export: 토크나이저 주입, `src/index.ts` export 추가(완료)
6. 문서화: 인터페이스/사용 예시 + Explainability 가이드

## 경계/아키텍처 원칙

- 코어는 플랫폼 ID/세션 개념을 노출하지 않는다.
- 코어는 “선택”만 담당한다. 실행/세션/캐시는 앱 계층.
- 프로필은 Preset/Agent 메타만 사용한다.
- 앱 계층은 `SessionKeyStrategy`로 `(contextId, agentId)` 키를 구성하여 세션을 관리한다.

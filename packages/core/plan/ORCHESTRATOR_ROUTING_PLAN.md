# Core Orchestrator Routing Plan

## Requirements

### 성공 조건

- [ ] 플랫폼 비의존 라우팅 추상화를 제공한다(`AgentRouter`, `RouterQuery`).
- [ ] Preset/Agent 메타를 직접 활용하는 라우팅(별도 Profile/Builder 불필요). 간단한 `doc` 유틸 제공(선택).
- [ ] BM25 + 휴리스틱 기반 기본 라우터 구현을 제공한다(mention/hints/keywords/tools/fileType 가중치).
- [ ] 토크나이저 플러그형 구조를 제공한다(기본: `EnglishSimpleTokenizer`, 선택: `LlmKeywordTokenizer`).
- [ ] 타입 안전성 보장(`any` 금지), `@agentos/core` 내에서 재사용 가능.
- [ ] `index.d.ts`를 통해 공개 API로 노출한다.
- [ ] LLM 보조 라우팅을 구조적으로 지원한다(키워드 추출/의도 라벨/Top‑N 재정렬). LLM 실패 시 규칙 기반으로 폴백.

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

### Builder 중심 컨텍스트 생성

- RouterContextBuilder: 라우팅 1회 요청마다 표준 컨텍스트를 생성한다.
  - 입력: `tokenizer`, `buildDocFn`, `llmKeyword?`(옵션 정책)
  - `build(query)` → `RoutingContext`(토큰/도큐먼트 캐시 내장, 로캘/정책 적용)
- RoutingContext(전략 주입 객체):
  - `tokenizeQuery(text)`, `tokenizeDoc(text)`, `buildDoc(meta)`, `getQueryText(query)`
  - 내부 캐시 키: `mode(base|llm)+text`, `doc: agentId+version`
- 합성 라우터는 Builder로 컨텍스트를 만들고, 모든 전략에 동일 객체를 주입한다(정책/캐시 일관성 보장).

## LLM‑Assisted Routing (핵심 구조)

목표: 규칙/통계 기반(mention+BM25+휴리스틱)을 기본으로 하되, 불확실성이 높거나 한국어/CJK 등 토큰화 한계가 있는 상황에서 LLM을 보조 신호로 활용한다. 코어는 구조/DI/정책/캐시를 제공하고, 실행 여부는 앱 정책으로 제어한다.

- Keyword Extraction(저비용):
  - `knowledge/LlmBridgeKeywordExtractor` + `LlmKeywordTokenizer`를 사용해 질의의 핵심 키워드를 추출한다.
  - 사용 조건: (a) 쿼리 길이 짧고 애매한 경우, (b) 로캘이 ko/ja/zh 등 CJK, (c) BM25 스코어 상위권 동점이 많을 때.
  - 파라미터: `maxKeywords(≤16)`, `timeoutMs`, `temperature=0`(결정성), 응답은 토큰 세트로 정규화.
  - 실패/타임아웃: 기본 토크나이저로 폴백.

- LLM Rerank(선택 고비용):
  - 규칙 기반 상위 N(예: 5~8)을 후보로 추린 뒤, `preset/metadata`로 만든 안전 doc와 질의를 함께 LLM에 제공하여 최종 재정렬한다.
  - 프롬프트(단일, 언어 불가지 기본 템플릿):n    - ROLE: 라우팅 어시스턴트. QUERY와 CANDIDATES를 바탕으로 적합도 산정.n    - INSTRUCTIONS: 신호(의도/키워드/로캘/카테고리/툴/멀티모달/hints) 반영, 0..1 점수, 동점 최소화, JSON 배열만 출력(설명 금지).n    - CONTEXT: LOCALE(없으면 unknown), QUERY(텍스트), HINTS(tags+hints, 선택), CANDIDATES(“#i id=..\n doc”)n    - OUTPUT: 오직 JSON 배열 문자열만.
  - 가드: temperature=0, max_tokens 제한, 민감 원문 비노출(스니펫만), 시간/비용 상한 초과 시 미실행.
  - 실패 시: 기존 규칙 기반 정렬 유지.

- Intent Classifier(경량):
  - LLM으로 intent 라벨(translate/summarize/code/vision 등)을 추출해 `query.tags`에 주입, KeywordBoost에서 가산.
  - 캐시: 동일 텍스트 해시 단위로 TTL 캐싱.

- Explainability/Privacy:
  - `ScoreResult.metadata`에는 LLM 이유 문구 대신 간단한 라벨/스코어만 기록(예: `{ rerank: 0.6, reason: 'tags:vision' }`).
  - 사용자 원문은 저장/전송하지 않고 스니펫/키워드/라벨만 사용.

- Budget/Policy:
  - 앱 계층에서 라우팅 예산(호출수/시간/비용)과 모드(assist/auto)에 따라 LLM 사용 정책을 주입.
  - 코어는 전략/토크나이저 DI와 옵션만 제공.

### Interface Sketch (LLM DI/정책)

```ts
// 라우터 옵션에 LLM 정책/구현을 주입
export interface LlmRoutingPolicy {
  enableKeyword: boolean;            // 질의 토큰화에 LLM 키워드 사용
  enableIntent?: boolean;            // intent 라벨 추출→tags 주입
  enableRerank?: boolean;            // Top‑N 재정렬 활성화
  topN?: number;                     // 재정렬 후보 수(기본 5~8)
  timeoutMs?: number;                // 전체 예산(라운드트립)
  localeMode?: 'always' | 'cjk' | 'never';
  budget?: { calls?: number; tokens?: number };
}

// 단순화를 위해 코어는 'LLM 주입'만 받되, 기본 Reranker는 코어가 내장 프롬프트로 제공
// (앱은 LLM만 전달하면 되고, 프롬프트/포맷은 코어가 관리)
export interface LlmReranker {
  rerank(args: {
    query: RouterQuery;
    candidates: Array<{ agentId: string; doc: string }>;
    helper: RouterHelper;
    policy: LlmRoutingPolicy;
  }): Promise<Array<{ agentId: string; score: number }>>;
}

export interface CompositeAgentRouterOptions {
  tokenizer?: Tokenizer;
  buildDoc?: BuildDocFn;
  llm?: {
    policy: LlmRoutingPolicy;           // 호출 예산/모드/locale 등
    keywordExtractor?: KeywordExtractor; // (선택) LLM 키워드 경로 사용 시
    reranker?: LlmReranker;              // 미제공 시 코어 기본 Reranker(내장 프롬프트) 사용 권장
  };
}
```

### Pipeline (확장 가능한 단계)

1) Normalize: `getQueryText()`로 질의 문자열 표준화, 상태 게이팅.
2) Enrich (opt): `enableKeyword/enableIntent`에 따라 LLM로 키워드/라벨 추출 → `query.tags/hints` 보강(캐시, 타임아웃, 예산 가드).
3) Score: 규칙/BM25/휴리스틱 전략 병렬 수행 → [0,1] 점수 합성.
4) Rerank (opt): 상위 N과 안전 doc를 LLM에 전달→재정렬/보정(블렌딩 또는 순위 교체) + 폴백.
5) Rank: 결정적 타이브레이커 적용.

블렌딩 예시: `final = α * ruleScore + (1-α) * rerankScore` (α=0.6 권장).

### Caching/Observability/Privacy

- Cache: `doc: agentId+version`, `tokens: (mode: base|llm)+text`, `intent/keywords: hash(model+text)`.
- Metrics: LLM 호출 수/지연/타임아웃/폴백 비율 수집(옵션 훅 제공).
- Privacy: 프롬프트에는 스니펫/라벨/키워드만, 원문 저장 금지.

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

### LLM‑Assisted (v1 / v1.1)

- [x] LLM KeywordTokenizer 경로 활성화(로캘/불확실성 조건부 실행 + 캐시)
- [ ] LLM Rerank Strategy(Top‑N 후보 재정렬, 예산/지연 상한, 실패 폴백) — v1.1 구현, 인터페이스는 v1에서 확정
- [ ] Intent Classifier → `query.tags` 주입 경량 전략 — v1.1
- [ ] 테스트: 결정성(temperature=0), 실패 폴백, 비용/지연 가드 — v1.1
- [ ] 정책 훅: 앱 계층 예산/모드 입력으로 LLM 사용 여부 제어 — v1.1

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

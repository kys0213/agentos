# Core Orchestrator Routing

Note: This document is promoted from the original plan after implementation and testing. Remaining v1.1 items are tracked as future work.

## Requirements

### 성공 조건

- [x] 플랫폼 비의존 라우팅 추상화를 제공한다(`AgentRouter`, `RouterQuery`).
- [x] Preset/Agent 메타를 직접 활용하는 라우팅(별도 Profile/Builder 불필요). 간단한 `doc` 유틸 제공(선택).
- [x] BM25 + 휴리스틱 기반 기본 라우터 구현을 제공한다(mention/hints/keywords/tools/fileType 가중치).
- [x] 토크나이저 플러그형 구조를 제공한다(기본: `EnglishSimpleTokenizer`, 선택: `LlmKeywordTokenizer`).
- [x] 타입 안전성 보장(`any` 금지), `@agentos/core` 내에서 재사용 가능.
- [x] `index.d.ts`를 통해 공개 API로 노출한다.
- [x] LLM 보조 라우팅을 구조적으로 지원(키워드 추출/의도 라벨/Top‑N 재정렬). 실패 시 규칙 기반 폴백.

### 사용 시나리오

- [x] Slack/GUI/CLI에서 동일 `RouterQuery`로 재사용 가능.
- [x] Top‑K 후보를 UI에 노출하여 사용자가 선택 가능(assist 모드).

### 제약 조건

- [x] 코어는 플랫폼 식별자를 알지 않는다.
- [x] 외부 의존성 최소화, 경량 인메모리 BM25 사용.
- [x] 성능: 후보 수십~수백 규모에서 ms 단위 라우팅.

## Interface Sketch

```ts
// ... 내용은 계획서와 동일 (타입/전략/Composite 요약)
```

## Cross‑Channel Considerations (GUI/Slack/CLI)

- Explainability/Determinism/Performance/i18n/Failure/Privacy 원칙을 구현에 반영.

## Design Refinements(보완 사항)

- 입력 정규화, 상태 게이팅, 캐싱, 안전 DocBuilder, 결정적 정렬 규칙.

### Builder 중심 컨텍스트 생성

- RouterContextBuilder로 요청 단위 컨텍스트를 생성해 전략에 주입.

## LLM‑Assisted Routing (핵심 구조)

- Keyword Extraction(저비용): CJK/애매 질의 시 LLM 키워드 추출 → 토크나이즈 사용.
- LLM Rerank(선택 고비용): Top‑N 후보 재정렬, 실패 시 규칙 기반 유지.
- Intent Classifier(경량): 라벨 추출 → `query.tags` 주입.

## Strategy Set(v1 구현)

- Mention, BM25Text, KeywordBoost, ToolHint, FileType.

## Status & Future Work

- [x] 타입/유틸 정의, Composite 라우터, 전략, 캐시, 결정적 정렬, 퍼포먼스 스모크 테스트
- [x] LLM 키워드 토크나이저(CJK 조건) 연동, Rerank 인터페이스 + 기본 구현
- [ ] Intent Classifier 전략(v1.1)
- [ ] 실패 폴백/예산/지연 가드에 대한 CI 가이드(v1.1)

## 경계/아키텍처 원칙

- 코어는 선택만 담당(실행/세션/캐시는 앱 계층). 플랫폼 ID 비노출.


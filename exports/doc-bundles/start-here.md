# AgentOS Docs — Start Here Bundle

> Generated on 2025-10-17T01:05:07.333Z


---

## Source Directory: docs/00-start-here

### File: docs/00-start-here/AGENTOS_KNOWLEDGE_SUMMARY.md

<!-- Source: docs/00-start-here/AGENTOS_KNOWLEDGE_SUMMARY.md -->

# AgentOS Knowledge Summary

> Canonical briefing for AI agents (GPT/Claude/etc.) contributing to this repository. Keep this document in sync with the sources referenced below.

## Mission & Philosophy

- **Goal**: build an open-source, modular Agent Operating System that is model-agnostic, composable, and production-ready for AI Ops.
- **Guiding principles**: model agnostic (`llm-bridge-spec` abstraction), local-first with optional centralized services, knowledge/memory-first for reproducibility, flywheel/backprop readiness, composable modules, and B2B-friendly operations ([README.md](https://github.com/kys0213/agentos/blob/main/README.md)).
- **Problem-solving**: favor the simplest viable solution; escalate to divide-and-conquer only when complexity criteria trip ([docs/30-developer-guides/complexity-guide.md](https://github.com/kys0213/agentos/blob/main/docs/30-developer-guides/complexity-guide.md)).
- **Process mantra**: plan first, then code. Every task starts with a plan document using the shared template and gains approval before implementation.
- **Type safety**: `any` is banned. Use `unknown`, generics, unions, and runtime guards as needed ([docs/30-developer-guides/typescript-typing-guidelines.md](https://github.com/kys0213/agentos/blob/main/docs/30-developer-guides/typescript-typing-guidelines.md)).
- **Naming/consistency**: prefer widely understood terms, keep docs/code in sync, and avoid ambiguous names like `index` unless scoped ([docs/30-developer-guides/code-style.md](https://github.com/kys0213/agentos/blob/main/docs/30-developer-guides/code-style.md)).

## Workspace Snapshot

- **Layout**: pnpm monorepo with `apps/` (GUI, CLI, Slack bot) and `packages/` (core/lang). Shared docs live under `docs/`.
- **Runtime flow** ([README.md](https://github.com/kys0213/agentos/blob/main/README.md)):
  1. User interaction (GUI/CLI/Bot) handled locally by default.
  2. Core normalizes context via Memory/Knowledge, then Orchestrator selects strategies/policies and routes agents.
  3. Optional collector uploads normalized telemetry to a central service for aggregation/backprop.
  4. Feedback loops update presets/policies to close the quality flywheel.
  5. Remote control (RACP) lets a leader agent or human orchestrate subordinate agents (spec drafting underway).
- **Environment**: Node ≥ 20, pnpm ≥ 10. Core commands: `pnpm install`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm format`.

## Core Modules (packages/core)

- **Agent architecture**: session-first design with `Agent`, `AgentSession`, `AgentMetadataRepository`, `AgentFactory`, optional `SessionService`, and facade `AgentService`. Agents emit typed events for status/session changes to keep GUI/state synchronized ([docs/packages/core/agent-architecture.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/agent-architecture.md)).
- **Orchestrator routing** (implemented v1): deterministic composite router combining BM25 text scoring, mentions, keyword boosts, tool/file hints, and optional LLM-assisted rerank. Tokenizers are pluggable; privacy guards ensure only normalized artifacts leave the core ([docs/packages/core/orchestrator-routing.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/orchestrator-routing.md)).
- **Memory subsystem**: layered session vs agent graphs with canonical key dedupe, n-gram embeddings, promotion, feedback weighting, and checkpointing ([docs/packages/core/memory-api.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/memory-api.md), [memory-personalized.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/memory-personalized.md)).
- **Knowledge system** (directional draft): parser + BM25 + optional vector index with hybrid ranking, breadcrumb metadata, and preset partitioning. Interfaces defined; implementation tracked separately ([docs/packages/core/knowledge-design.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/knowledge-design.md)).
- **MCP service stack**: pure protocol client → registry → metadata repository → business facade, backed by file-based storage and event propagation. Usage layer logs per-tool metrics to NDJSON for dashboards ([docs/packages/core/mcp-service-architecture.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/mcp-service-architecture.md), [mcp-usage-layer.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/mcp-usage-layer.md)).
- **Content standardization**: core messages align 1:1 with `llm-bridge-spec` `MultiModalContent[]`, enforced utilities keep adapters thin ([docs/packages/core/content-standardization.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/content-standardization.md)).
- **LLM bridge registry**: file-backed manifest/active-id store, decoupled from runtime bridge instances ([docs/packages/core/core-llm-bridge-registry.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/core-llm-bridge-registry.md)).

## Specifications & Directional Workstreams (docs/20-specs)

- **LLM capability schema**: declarative JSON describing context limits, supported modes (chat/tool/embed), pricing, latency, and feature flags to drive policy-based routing (directional draft) ([docs/20-specs/llm-capability.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/llm-capability.md)).
- **Storage abstraction**: cursor-based interfaces for sessions, memory, knowledge, usage, and events with file/SQLite/HTTP adapters in scope ([docs/20-specs/storage-abstraction.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/storage-abstraction.md)).
- **Batch collection pipeline**: local journal → redaction → batched HTTPS upload with idempotent ACKs, configurable sidecar/child/batch runners ([docs/20-specs/batch-collection.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/batch-collection.md)).
- **Collector ingest API**: outlines authenticated `/v1/collect` endpoint, payload structure, and retry semantics ([docs/20-specs/collector-ingest-api.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/collector-ingest-api.md)).
- **Privacy & security policy**: opt-in consent scopes (`meta_only`, `anonymized`, `full_denied`), YAML redaction rules, retention limits, encryption expectations, MCP tool RBAC, and prompt injection defenses ([docs/20-specs/privacy-security.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/privacy-security.md)).
- **RACP (Remote Agent Command Protocol)**: execute/pause/cancel commands with approvals, status streams, audit logs, and error taxonomy (directional) ([docs/20-specs/racp-spec.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/racp-spec.md)).
- **IPC event spec**: standard Electron main ↔ renderer channels for agent/session lifecycle and prompt/consent flows ([docs/20-specs/ipc-event-spec.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/ipc-event-spec.md)).
- **Observability & SLOs**: core metrics (requests, tokens, latency, costs, rerank usage, cache hits), tracing tags, dashboard layout, and sample SLO/alert thresholds ([docs/20-specs/observability-slo.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/observability-slo.md)).

## GUI (apps/gui) Architecture & Roadmap

- **Patterns**: strict container vs presentational split, React Query key registry, IPC/service access only in containers, consistent loading/error/empty props, and zero `any` tolerated. Hooks normalize contracts and invalidate minimal caches ([docs/apps/gui/frontend/patterns.md](https://github.com/kys0213/agentos/blob/main/docs/apps/gui/frontend/patterns.md)).
- **Testing & tooling**: Playwright E2E for GUI, unit tests prefer deterministic mocks, devtools gated via `VITE_DEVTOOLS=true`. Reference instructions in [docs/apps/gui/frontend/testing.md](https://github.com/kys0213/agentos/blob/main/docs/apps/gui/frontend/testing.md).
- **Roadmap status**: Week-N mock alignment ticked off for typography, sidebar, cards, chips, transcripts, composer, and devtools toggling. Upcoming polish covers spacing, accessibility, and visual QA ([docs/apps/gui/frontend/roadmap.md](https://github.com/kys0213/agentos/blob/main/docs/apps/gui/frontend/roadmap.md)).
- **Delivery phases**: Type safety → preset data normalization → chat flow restoration → controllers → legacy/doc cleanup → quality (stream cancel tests, pipeline hardening).

## Development Workflow & Quality Gates

- **Git workflow**: always branch from fresh `main`, use `feature/`, `fix/`, `perf/`, `refactor/` prefixes, commit per TODO, never merge locally, and submit PRs with the shared template. Pre-push hook enforces `pnpm format`, `lint`, `typecheck`, `build`, with tests strongly encouraged ([docs/40-process-policy/git-workflow.md](https://github.com/kys0213/agentos/blob/main/docs/40-process-policy/git-workflow.md)).
- **Plan discipline**: every task needs a plan (`docs/90-templates/PLAN_TEMPLATE.md`) capturing requirements, interface sketches, todos (test items included), and execution order. Plans live under `plan/` until todos are checked, then are promoted or removed per policy.
- **Documentation SSOT**: update existing docs before adding new ones, promote plan → docs in the same PR, and avoid deprecated directories ([docs/40-process-policy/docs-policy.md](https://github.com/kys0213/agentos/blob/main/docs/40-process-policy/docs-policy.md), [documentation-standards.md](https://github.com/kys0213/agentos/blob/main/docs/40-process-policy/documentation-standards.md), [plan-promotion.md](https://github.com/kys0213/agentos/blob/main/docs/40-process-policy/plan-promotion.md)).
- **Testing expectations**: core utilities target ~100% coverage, domain modules get black-box tests with mocks, app layers rely on integration/E2E. Favor deterministic tests; mock external IO/time ([docs/30-developer-guides/testing.md](https://github.com/kys0213/agentos/blob/main/docs/30-developer-guides/testing.md)).
- **AI collaboration**: agents must clarify scope, assess complexity, draft plans, seek approval, implement with checkpoints, and surface changes transparently ([docs/30-developer-guides/ai-collaboration.md](https://github.com/kys0213/agentos/blob/main/docs/30-developer-guides/ai-collaboration.md), [CLAUDE.md](https://github.com/kys0213/agentos/blob/main/CLAUDE.md), [GEMINI.md](https://github.com/kys0213/agentos/blob/main/GEMINI.md)).

## Privacy, Security, and Ops

- **Consent-first telemetry** with configurable redaction before upload; network transport must use TLS and idempotent keys.
- **Tool governance**: MCP tools go through metadata registry, usage tracking, and optional approval gates; risky tools may require RACP approval flows.
- **Observability targets**: maintain latency/error/cost budgets, trace key spans (`agentos.router`, `agentos.llm.call`, etc.), and monitor rerank/cache behavior.
- **Resilience**: batch collectors handle offline buffering, checksum validation, exponential backoff, and conflict handling.

## Roadmap Highlights

- **Short term (1–2 months)**: finalize LLM capability schema, define central collection schema, deliver storage abstraction (file/SQLite adapters), add capability-aware routing, complete GUI preset→memory flow, and ship evaluation harness ([docs/00-start-here/ROADMAP.md](https://github.com/kys0213/agentos/blob/main/docs/00-start-here/ROADMAP.md)).
- **Mid term (3–6 months)**: collector backend PoC with auth/multitenancy, RACP MVP with audit logging, preset registry beta, and strengthened MCP security ([docs/00-start-here/PROJECT_DIRECTION_REVIEW.md](https://github.com/kys0213/agentos/blob/main/docs/00-start-here/PROJECT_DIRECTION_REVIEW.md)).
- **Risks & mitigations**: bundle format drift (enforce ESM & lint rules), latency/cost variance (capability routing + benchmarking), data privacy (opt-in defaults, masking, air-gap support).

## Quick Reference Checklist

- Create a branch, draft a plan, get approval, implement per TODO, update docs, run `pnpm lint && pnpm typecheck && pnpm build && pnpm test` before commits.
- Honor container/presentational boundaries in GUI work and keep adapters spec-aligned.
- Update this knowledge summary whenever core philosophy, specs, or workflows change; list the source doc you touched.
- Escalate if you encounter unexpected repo changes you did not author.

## Source Index

| Theme                  | Primary Docs                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Philosophy & Direction | [README.md](https://github.com/kys0213/agentos/blob/main/README.md), [docs/00-start-here/PROJECT_DIRECTION_REVIEW.md](https://github.com/kys0213/agentos/blob/main/docs/00-start-here/PROJECT_DIRECTION_REVIEW.md), [docs/00-start-here/ROADMAP.md](https://github.com/kys0213/agentos/blob/main/docs/00-start-here/ROADMAP.md)                               |
| Core Architecture      | [docs/packages/core/index.md](https://github.com/kys0213/agentos/blob/main/docs/packages/core/index.md), linked module docs                                                                                                               |
| Specs                  | [docs/20-specs/README.md](https://github.com/kys0213/agentos/blob/main/docs/20-specs/README.md)                                                                                                                                           |
| Workflow & Policy      | [AGENTS.md](https://github.com/kys0213/agentos/blob/main/AGENTS.md), [docs/40-process-policy/git-workflow.md](https://github.com/kys0213/agentos/blob/main/docs/40-process-policy/git-workflow.md), [docs/40-process-policy/docs-policy.md](https://github.com/kys0213/agentos/blob/main/docs/40-process-policy/docs-policy.md) |
| GUI                    | [docs/apps/gui/README.md](https://github.com/kys0213/agentos/blob/main/docs/apps/gui/README.md), [docs/apps/gui/frontend/README.md](https://github.com/kys0213/agentos/blob/main/docs/apps/gui/frontend/README.md)                                                       |
| Templates              | [docs/90-templates/PLAN_TEMPLATE.md](https://github.com/kys0213/agentos/blob/main/docs/90-templates/PLAN_TEMPLATE.md)                                                                                                                     |

Maintain this table when adding or relocating source material.

### File: docs/00-start-here/PROJECT_DIRECTION_REVIEW.md

<!-- Source: docs/00-start-here/PROJECT_DIRECTION_REVIEW.md -->

# AgentOS 방향성 리뷰 (의견 제안)

본 문서는 현재 레포 구조와 구현을 검토한 뒤, 강점/보완점/우선순위 제안과 함께 중단기 로드맵 아이디어를 제시합니다. 목표는 “모델 아그노스틱, 로컬 퍼스트, 중앙 집계와 역전파로 성장하는 오픈소스 Agent OS”의 실현 가능성을 높이는 것입니다.

## 잘하고 있는 점

- 모델 아그노스틱 추상화: `llm-bridge-spec` + loader 조합으로 LLM 교체 내성 확보. 에이전트/프리셋 재사용성이 높음.
- 모듈 경계와 응집도: `agent/memory/knowledge/orchestrator/chat/preset/mcp`로 도메인 분리가 명확. 스프링/리액트식 조립 가능 구조.
- 로컬 퍼스트 철학: GUI가 로컬 상호작용을 1급 시민으로 취급. 파일/인메모리 저장으로 진입장벽 낮음.
- 오케스트레이션 전략: 규칙 기반 + LLM 기반 전략/리랭크의 조합이 확장성 있는 설계.
- 테스트 기반: core 전반의 테스트가 풍부해 리팩터링/교체 비용을 줄일 토대 보유.

## 보완이 필요한 점 (핵심)

- 브리지 계약의 기능 모델: 단순 타입 정의를 넘어 “지원 기능/한계(토큰화/함수호출/스트리밍/비용/지연)”를 선언적으로 노출하는 Capability 메타데이터 필요. 라우팅/프리셋 선택에 직접 활용.
- 데이터 계층 추상화: 파일/메모리 외에도 경량 영속 저장(SQLite/Level/SQLite-WASM) 어댑터를 표준화해 규모 확장, 동시성 제어, 부분 동기화를 용이하게.
- 중앙 수집/동기화 설계: 수집 스키마(메시지/메타/사용량/에러), 익명화/옵트인 정책, 충돌해결(merkle/clock 기반)과 증분 동기 프로토콜 정의 필요.
- 프리셋/정책 버저닝: 재현성과 롤백을 위해 Preset/Policy/Model 버전 동기(semver + 사인된 manifest)와 마켓/레지스트리 설계.
- 평가/관측 가능성: 자동 평가(정확성/비용/지연/안정성) 파이프라인과 오케스트레이터/브리지 수준의 트레이싱, 메트릭, 이벤트 로깅.
- 보안/격리: MCP/플러그인 실행 격리(권한/샌드박스/요청 필터링), Secret 관리, 프롬프트 주입 방어 가이드 강화.

## 아키텍처 제안

- Capability-Driven Routing
  - LLM 브리지의 Capability(예: max_tokens, tools, stream, cost_profile)를 선언적 JSON으로 노출 → Orchestrator가 정책/비용/지연 기반 다목적 라우팅.
- Storage Abstraction
  - `Storage` 인터페이스(세션/기억/지식/사용량) + File/SQLite/HTTP 동기 어댑터. 트랜잭션/락/배치/TTL/인덱싱 표준화.
- Sync & Backprop
  - 이벤트 소싱(append-only) + CRDT/lamport clock 기반 충돌해결. 백엔드에선 수집→정규화→특징화→정책 갱신→배포 파이프라인 자동화.
- RACP(제어면) 스펙 초안
  - 명령(Execute/Cancel/Pause)·승인(ACL/서명)·상태(Heartbeat/Progress)·감사(Audit) 최소 스키마. 멱등키와 재시도 규칙 명시.
- Preset Registry
  - 서명/무결성 검증, 의존 브리지/도구 최소 버전, 호환성 매트릭스. 로컬 캐시 + 원격 레지스트리 양자 지원.

## 단기 로드맵 (1–2개월)

- 스펙/문서
  - LLM Capability JSON 스키마 확정 및 브리지 샘플 1–2개 반영.
  - 중앙 수집 스키마 초안(PII 정책, 익명화, 옵트인) + 동기 프로토콜 설계 문서화.
- 구현
  - core Storage 인터페이스 + File/SQLite 어댑터 제공.
  - Orchestrator에 Capability/비용/지연 기반 라우팅 옵션 추가.
  - GUI: 프리셋 선택→세션→기억 반영→재사용 End-to-End 사용자 흐름 완성.
- 품질
  - 평가 하니스(샘플 데이터셋) + 비용/지연/성공률 대시보드 초안.

## 중기 로드맵 (3–6개월)

- 백엔드 수집 서버 PoC(인증/멀티테넌시/액세스 로그) + 동기 모듈 SDK.
- RACP MVP: 리더 Agent/사람이 원격으로 워크플로 지휘(명령/상태/취소/감사).
- Preset Registry 베타: 서명/버전/호환성 검증 + GUI 배포/업데이트 UX.
- 보안 강화: MCP 권한 모델, Secret Vault 연동, 플러그인 샌드박스.

## 리스크와 우회로

- ESM/CJS/번들링 편차: 워크스페이스 전반 ESM 일관성 유지, Vitest/Vite 설정 통일, 절대 경로 임포트 금지(ESLint)로 재발 방지.
- 비용/속도 불확실성: Capability 라우팅 + 평가 하니스로 가시화. 사전/사후 캐시, 임베딩/검색 파이프라인 튜닝.
- 데이터/프라이버시: 옵트인·익명화 디폴트, 민감필드 마스킹, 온프레미스/에어갭 지원.

## 총평

현 방향은 “모델 아그노스틱 + 로컬 퍼스트 + 중앙 수집/역전파”의 균형이 좋아, 현업/커뮤니티 모두에 실용적입니다. 특히 모듈 경계가 뚜렷해 제품/연구 양쪽 확장이 용이합니다. 다음 단계는 “계약의 명확화(브리지 Capability/수집 스키마/RACP)”와 “데이터 계층/동기화 표준화”입니다. 이를 통해 플라이휠을 안전하게 닫고, B2B 운영 신뢰성을 확보할 수 있습니다.

### File: docs/00-start-here/README.md

<!-- Source: docs/00-start-here/README.md -->

# Start Here

- Repository Overview: `../../README.md`
- Roadmap: `./ROADMAP.md`
- Direction Review: `./PROJECT_DIRECTION_REVIEW.md`

이 섹션은 최상위 진입점입니다. 로드맵/방향성/철학 관련 문서를 한 곳에서 찾을 수 있도록 정비합니다.

### File: docs/00-start-here/ROADMAP.md

<!-- Source: docs/00-start-here/ROADMAP.md -->

# AgentOS Roadmap (Draft)

본 문서는 중단기 로드맵을 요약합니다. 세부 스펙은 각 문서(예: 20-specs/batch-collection.md) 참조.

## 원칙

- 모델 아그노스틱, 로컬 퍼스트, 동의 기반 배치 수집
- 계약 우선(스펙 → 구현), 보안/프라이버시 기본값 강화

## 워크스트림

- LLM Capability 스키마 확정 및 라우팅 정책 반영
- Storage 추상화(File/SQLite/HTTP Sync)
- 배치 수집기: @agentos/collector (Sidecar/Child/Batch)
- RACP 제어면 MVP
- Preset Registry(서명/호환성) 초안
- Observability/가드레일(지표/필터/회로차단/레이트리밋)

## 마일스톤 (예시)

- M1 (주 2)
  - BATCH_COLLECTION_SPEC 초안 확정
  - core: JSONL 저널 라이터(옵션) 제공
  - collector: batch runner PoC (파일→전송, 멱등/백오프)
- M2 (주 4)
  - collector: sidecar/child runners, 구성 파일/암호화/ACK
  - GUI: 수집 설정/옵트인 화면, 로그 미리보기·마스킹 시뮬
- M3 (주 6)
  - Capability 라우팅 옵션(비용/지연/기능) + 평가 하니스 v1
  - Storage: SQLite 어댑터 + 증분 동기 스켈레톤
- M4 (주 8)
  - RACP MVP + 감사 로그 + 멱등/재시도 규칙
  - Registry 초안 + 프리셋 배포 UX(기초)

## 수용 기준(샘플)

- 수집기: 24h 오프라인 후 복구·재시도·중복 방지·손상 파일 스킵 가능
- 프라이버시: meta_only 수집 시 본문/민감필드 부재 보증
- 라우팅: 동일 요청 1k 케이스에서 비용 대비 성능 향상 통계 제공
- 테스트: 워크스페이스 통합 테스트 green, 커버리지 유지/상승

---

이 문서는 지속적으로 갱신됩니다. 변경 시 CHANGELOG나 PR 설명에 링크를 남깁니다.

_Included files: 4_

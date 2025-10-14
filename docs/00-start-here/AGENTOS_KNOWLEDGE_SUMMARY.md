# AgentOS Knowledge Summary

> Canonical briefing for AI agents (GPT/Claude/etc.) contributing to this repository. Keep this document in sync with the sources referenced below.

## Mission & Philosophy

- **Goal**: build an open-source, modular Agent Operating System that is model-agnostic, composable, and production-ready for AI Ops.
- **Guiding principles**: model agnostic (`llm-bridge-spec` abstraction), local-first with optional centralized services, knowledge/memory-first for reproducibility, flywheel/backprop readiness, composable modules, and B2B-friendly operations ([README.md](../../README.md)).
- **Problem-solving**: favor the simplest viable solution; escalate to divide-and-conquer only when complexity criteria trip ([docs/30-developer-guides/complexity-guide.md](../30-developer-guides/complexity-guide.md)).
- **Process mantra**: plan first, then code. Every task starts with a plan document using the shared template and gains approval before implementation.
- **Type safety**: `any` is banned. Use `unknown`, generics, unions, and runtime guards as needed ([docs/30-developer-guides/typescript-typing-guidelines.md](../30-developer-guides/typescript-typing-guidelines.md)).
- **Naming/consistency**: prefer widely understood terms, keep docs/code in sync, and avoid ambiguous names like `index` unless scoped ([docs/30-developer-guides/code-style.md](../30-developer-guides/code-style.md)).

## Workspace Snapshot

- **Layout**: pnpm monorepo with `apps/` (GUI, CLI, Slack bot) and `packages/` (core/lang). Shared docs live under `docs/`.
- **Runtime flow** ([README.md](../../README.md)):
  1. User interaction (GUI/CLI/Bot) handled locally by default.
  2. Core normalizes context via Memory/Knowledge, then Orchestrator selects strategies/policies and routes agents.
  3. Optional collector uploads normalized telemetry to a central service for aggregation/backprop.
  4. Feedback loops update presets/policies to close the quality flywheel.
  5. Remote control (RACP) lets a leader agent or human orchestrate subordinate agents (spec drafting underway).
- **Environment**: Node ≥ 20, pnpm ≥ 10. Core commands: `pnpm install`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm format`.

## Core Modules (packages/core)

- **Agent architecture**: session-first design with `Agent`, `AgentSession`, `AgentMetadataRepository`, `AgentFactory`, optional `SessionService`, and facade `AgentService`. Agents emit typed events for status/session changes to keep GUI/state synchronized ([docs/packages/core/agent-architecture.md](../packages/core/agent-architecture.md)).
- **Orchestrator routing** (implemented v1): deterministic composite router combining BM25 text scoring, mentions, keyword boosts, tool/file hints, and optional LLM-assisted rerank. Tokenizers are pluggable; privacy guards ensure only normalized artifacts leave the core ([docs/packages/core/orchestrator-routing.md](../packages/core/orchestrator-routing.md)).
- **Memory subsystem**: layered session vs agent graphs with canonical key dedupe, n-gram embeddings, promotion, feedback weighting, and checkpointing ([docs/packages/core/memory-api.md](../packages/core/memory-api.md), [memory-personalized.md](../packages/core/memory-personalized.md)).
- **Knowledge system** (directional draft): parser + BM25 + optional vector index with hybrid ranking, breadcrumb metadata, and preset partitioning. Interfaces defined; implementation tracked separately ([docs/packages/core/knowledge-design.md](../packages/core/knowledge-design.md)).
- **MCP service stack**: pure protocol client → registry → metadata repository → business facade, backed by file-based storage and event propagation. Usage layer logs per-tool metrics to NDJSON for dashboards ([docs/packages/core/mcp-service-architecture.md](../packages/core/mcp-service-architecture.md), [mcp-usage-layer.md](../packages/core/mcp-usage-layer.md)).
- **Content standardization**: core messages align 1:1 with `llm-bridge-spec` `MultiModalContent[]`, enforced utilities keep adapters thin ([docs/packages/core/content-standardization.md](../packages/core/content-standardization.md)).
- **LLM bridge registry**: file-backed manifest/active-id store, decoupled from runtime bridge instances ([docs/packages/core/core-llm-bridge-registry.md](../packages/core/core-llm-bridge-registry.md)).

## Specifications & Directional Workstreams (docs/20-specs)

- **LLM capability schema**: declarative JSON describing context limits, supported modes (chat/tool/embed), pricing, latency, and feature flags to drive policy-based routing (directional draft) ([docs/20-specs/llm-capability.md](../20-specs/llm-capability.md)).
- **Storage abstraction**: cursor-based interfaces for sessions, memory, knowledge, usage, and events with file/SQLite/HTTP adapters in scope ([docs/20-specs/storage-abstraction.md](../20-specs/storage-abstraction.md)).
- **Batch collection pipeline**: local journal → redaction → batched HTTPS upload with idempotent ACKs, configurable sidecar/child/batch runners ([docs/20-specs/batch-collection.md](../20-specs/batch-collection.md)).
- **Collector ingest API**: outlines authenticated `/v1/collect` endpoint, payload structure, and retry semantics ([docs/20-specs/collector-ingest-api.md](../20-specs/collector-ingest-api.md)).
- **Privacy & security policy**: opt-in consent scopes (`meta_only`, `anonymized`, `full_denied`), YAML redaction rules, retention limits, encryption expectations, MCP tool RBAC, and prompt injection defenses ([docs/20-specs/privacy-security.md](../20-specs/privacy-security.md)).
- **RACP (Remote Agent Command Protocol)**: execute/pause/cancel commands with approvals, status streams, audit logs, and error taxonomy (directional) ([docs/20-specs/racp-spec.md](../20-specs/racp-spec.md)).
- **IPC event spec**: standard Electron main ↔ renderer channels for agent/session lifecycle and prompt/consent flows ([docs/20-specs/ipc-event-spec.md](../20-specs/ipc-event-spec.md)).
- **Observability & SLOs**: core metrics (requests, tokens, latency, costs, rerank usage, cache hits), tracing tags, dashboard layout, and sample SLO/alert thresholds ([docs/20-specs/observability-slo.md](../20-specs/observability-slo.md)).

## GUI (apps/gui) Architecture & Roadmap

- **Patterns**: strict container vs presentational split, React Query key registry, IPC/service access only in containers, consistent loading/error/empty props, and zero `any` tolerated. Hooks normalize contracts and invalidate minimal caches ([apps/gui/docs/frontend/patterns.md](../../apps/gui/docs/frontend/patterns.md)).
- **Testing & tooling**: Playwright E2E for GUI, unit tests prefer deterministic mocks, devtools gated via `VITE_DEVTOOLS=true`. Reference instructions in [apps/gui/docs/frontend/testing.md](../../apps/gui/docs/frontend/testing.md).
- **Roadmap status**: Week-N mock alignment ticked off for typography, sidebar, cards, chips, transcripts, composer, and devtools toggling. Upcoming polish covers spacing, accessibility, and visual QA ([apps/gui/docs/frontend/roadmap.md](../../apps/gui/docs/frontend/roadmap.md)).
- **Delivery phases**: Type safety → preset data normalization → chat flow restoration → controllers → legacy/doc cleanup → quality (stream cancel tests, pipeline hardening).

## Development Workflow & Quality Gates

- **Git workflow**: always branch from fresh `main`, use `feature/`, `fix/`, `perf/`, `refactor/` prefixes, commit per TODO, never merge locally, and submit PRs with the shared template. Pre-push hook enforces `pnpm format`, `lint`, `typecheck`, `build`, with tests strongly encouraged ([docs/40-process-policy/git-workflow.md](../40-process-policy/git-workflow.md)).
- **Plan discipline**: every task needs a plan (`docs/90-templates/PLAN_TEMPLATE.md`) capturing requirements, interface sketches, todos (test items included), and execution order. Plans live under `plan/` until todos are checked, then are promoted or removed per policy.
- **Documentation SSOT**: update existing docs before adding new ones, promote plan → docs in the same PR, and avoid deprecated directories ([docs/40-process-policy/docs-policy.md](../40-process-policy/docs-policy.md), [documentation-standards.md](../40-process-policy/documentation-standards.md), [plan-promotion.md](../40-process-policy/plan-promotion.md)).
- **Testing expectations**: core utilities target ~100% coverage, domain modules get black-box tests with mocks, app layers rely on integration/E2E. Favor deterministic tests; mock external IO/time ([docs/30-developer-guides/testing.md](../30-developer-guides/testing.md)).
- **AI collaboration**: agents must clarify scope, assess complexity, draft plans, seek approval, implement with checkpoints, and surface changes transparently ([docs/30-developer-guides/ai-collaboration.md](../30-developer-guides/ai-collaboration.md), [CLAUDE.md](../../CLAUDE.md), [GEMINI.md](../../GEMINI.md)).

## Privacy, Security, and Ops

- **Consent-first telemetry** with configurable redaction before upload; network transport must use TLS and idempotent keys.
- **Tool governance**: MCP tools go through metadata registry, usage tracking, and optional approval gates; risky tools may require RACP approval flows.
- **Observability targets**: maintain latency/error/cost budgets, trace key spans (`agentos.router`, `agentos.llm.call`, etc.), and monitor rerank/cache behavior.
- **Resilience**: batch collectors handle offline buffering, checksum validation, exponential backoff, and conflict handling.

## Roadmap Highlights

- **Short term (1–2 months)**: finalize LLM capability schema, define central collection schema, deliver storage abstraction (file/SQLite adapters), add capability-aware routing, complete GUI preset→memory flow, and ship evaluation harness ([docs/00-start-here/ROADMAP.md](./ROADMAP.md)).
- **Mid term (3–6 months)**: collector backend PoC with auth/multitenancy, RACP MVP with audit logging, preset registry beta, and strengthened MCP security ([docs/00-start-here/PROJECT_DIRECTION_REVIEW.md](./PROJECT_DIRECTION_REVIEW.md)).
- **Risks & mitigations**: bundle format drift (enforce ESM & lint rules), latency/cost variance (capability routing + benchmarking), data privacy (opt-in defaults, masking, air-gap support).

## Quick Reference Checklist

- Create a branch, draft a plan, get approval, implement per TODO, update docs, run `pnpm lint && pnpm typecheck && pnpm build && pnpm test` before commits.
- Honor container/presentational boundaries in GUI work and keep adapters spec-aligned.
- Update this knowledge summary whenever core philosophy, specs, or workflows change; list the source doc you touched.
- Escalate if you encounter unexpected repo changes you did not author.

## Source Index

| Theme                  | Primary Docs                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Philosophy & Direction | [README.md](../../README.md), [docs/00-start-here/PROJECT_DIRECTION_REVIEW.md](./PROJECT_DIRECTION_REVIEW.md), [docs/00-start-here/ROADMAP.md](./ROADMAP.md)                               |
| Core Architecture      | [docs/packages/core/index.md](../packages/core/index.md), linked module docs                                                                                                               |
| Specs                  | [docs/20-specs/README.md](../20-specs/README.md)                                                                                                                                           |
| Workflow & Policy      | [AGENTS.md](../../AGENTS.md), [docs/40-process-policy/git-workflow.md](../40-process-policy/git-workflow.md), [docs/40-process-policy/docs-policy.md](../40-process-policy/docs-policy.md) |
| GUI                    | [apps/gui/docs/README.md](../../apps/gui/docs/README.md), [apps/gui/docs/frontend/README.md](../../apps/gui/docs/frontend/README.md)                                                       |
| Templates              | [docs/90-templates/PLAN_TEMPLATE.md](../90-templates/PLAN_TEMPLATE.md)                                                                                                                     |

Maintain this table when adding or relocating source material.

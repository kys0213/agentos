# Core Agent/Session Refactor Plan

## Goal
- Establish session-centric DX via `AgentSession` with strong typing and events
- Let `DefaultAgentSession` orchestrate LLM/Tools directly
- Unify content format to llm-bridge-spec `MultiModalContent`
- Keep GUI/CLI thin by consuming Core spec as-is

## Scope
- Core (primary): Agent/AgentSession/ChatManager/File-based storage
- GUI/CLI (secondary): Boundary normalization and session usage

## Phases and TODOs

### Phase 1 — Content Standardization (Core)
- [x] Define `CoreContent/CoreMessage` and normalizers (`toCoreContentArray`, `normalizeToCoreContentArray`)
- [x] Handle `Buffer`/`Readable` inputs in normalizer
- [x] Tests: single/array/string/number/circular/multimodal/buffer/readable
- [x] Usage audit doc with impact checklist (`packages/core/docs/CORE_CONTENT_USAGE_AUDIT.md`)

### Phase 2 — Agent/Session (Core)
- [x] Define `AgentSession` interface + event map (status/message/terminated/interaction stubs)
- [x] Implement `DefaultAgentSession` (direct LLM/Tool orchestration)
- [x] Integrate `SimpleAgent.createSession()` with `DefaultAgentSession`
- [ ] Implement interaction events (prompt/consent/sensitive input) and `provide*` handlers
- [ ] Abort/timeout/error branches tests
- [ ] ChatManager cohesion tests with file-based storage (incremental history)

### Phase 3 — File-based Session/Storage (Core)
- [x] Persist tool messages (array content) end-to-end
- [ ] Ensure array content retained on save/load with pagination
- [ ] Compression/checkpoint scenarios expanded tests

### Phase 4 — GUI/CLI Boundaries
- [x] Parser supports array/legacy/text content
- [ ] Normalize to array at boundaries; migrate hooks/services to session-centric flow
- [ ] Minimal E2E path using session

## Events (AgentSession)
- status: `running | idle | waiting-input | terminated | error`
- message: emits for each new `MessageHistory`
- terminated: `{ by: 'user' | 'timeout' | 'agent' }`
- promptRequest / consentRequest / sensitiveInputRequest (stubs → implement in Phase 2)

## Quality Targets
- Core coverage ≥ 95%
- Strong typing (no `any` in public APIs)
- Clear adapters only at boundaries

## References
- `packages/core/docs/CORE_CONTENT_STANDARDIZATION_PLAN.md`
- `packages/core/docs/CORE_CONTENT_USAGE_AUDIT.md`
- `apps/gui/docs/CHAT_AGENTID_SESSION_REFACTOR_PLAN.md`

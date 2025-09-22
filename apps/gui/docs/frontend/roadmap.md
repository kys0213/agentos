# Frontend Implementation Roadmap — GUI

Canonical location. Index: `apps/gui/docs/frontend/README.md`

This roadmap tracks the design alignment work for the GUI against the Figma mock.

## Phase: Mock Alignment (Week N)

- [x] Typography tokens: base 14px, h1/h2, h5, controls
- [x] Sidebar structure: Archived pill, Pinned/Older sections
- [x] Conversation cards: avatar/title/menu/preview/unread/timestamp
- [x] Header chips: active agents as chips, fallback when none
- [x] Available Agents: rows + status pills + count
- [x] Transcript bubbles + timestamp alignment
- [x] Composer polish: mention button size, disabled state
- [x] Devtools gating via `VITE_DEVTOOLS=true`
- [x] UI tests: ChatHistory (Archived + empty), ChatView header chips
- Spacing/radius/elevation audit and polish across components (planned)
- Accessibility pass (roles, labels for controls) (planned)
- Visual QA sweep vs mock (spacing, radii, shadows) (planned)

## Notes

- Devtools are hidden by default; enable with `VITE_DEVTOOLS=true` in dev.
- Further polish will be done alongside data wiring for pinned/archived.

---

## Consolidated Delivery Phases (A–F)

Outcome-focused summary of the GUI consolidation (see RPC/Frontend docs for details).

- Phase A — Type Safety
  - Adapters/hooks any 0, Zod parse at boundaries, ESLint as-any ban.
- Phase B — Preset Template Data
  - React Query single source, UI-only fields removed from adapters, standard loading/error/empty. (UI에서는 템플릿을 내부 상태로 사용)
- Phase C — Chat Flow
  - Agent-create → chat entry restored, empty-state fixed, container pattern streamlined (ChatView props reduced; ChatHistory memoized).
- Phase D — Controllers
  - `.gen.new.ts` generation promoted and wired into Nest modules; ZodValidationPipe enforced.
- Phase E — Legacy/Docs
  - Legacy IPC refs removed/renamed to RPC; docs path consolidation with SSOT links.
- Phase F — Quality
  - Stream cancel/unsubscribe tests and recipes; pipelines green.

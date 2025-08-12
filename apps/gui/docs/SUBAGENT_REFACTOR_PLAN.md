# Sub-Agent Integration & Refactor Plan

Owner: GUI
Status: Completed
Target Branch: `feature/subagent-refactor-integration`

## Goals

- Integrate sub-agent flows with real services via `ServiceContainer` and React Query.
- Align UX with design AgentCreate (non-modal, multi-step wizard like PresetCreate).
- Fix: Show actual created presets in sub-agent create flow preset step.
- Establish container/component structure mirroring `PresetManagerContainer` and reduce duplication via reusable components.

## Requirements

1. Data correctness

- After creating presets, the sub-agent create wizard must list them for selection.
- Uses `@agentos/core` types (`CreateAgentMetadata`, `ReadonlyAgentMetadata`, `Preset`).
- No `any`; use precise types and type guards when needed.

2. UX parity

- Use the same step-based layout as `apps/gui/design/components/AgentCreate.tsx` (Overview → Category → Preset → Settings).
- Render as a full page (not a modal), like `PresetCreate`.

3. Architecture

- Mirror `PresetManagerContainer` pattern:
  - Container uses React Query (`useQuery`, `useMutation`) to fetch/update agents.
  - Presentational component handles UI only.
- Fetch preset list via shared fetcher `fetchPresets()` to avoid prop-staleness.
- Extract reusable components to remove duplication.

## Approach

- Add `SubAgentCreateContainer` that:
  - `useQuery(['presets'], fetchPresets)` to provide live preset list.
  - `useMutation(createAgent)` to create agent via `ServiceContainer.getOrThrow('agent')`.
  - Navigates back to sub-agent list or chat on success.
- Refactor `SubAgentCreate` to new-UX, relying on container-provided data and callbacks.
- Ensure `SubAgentManagerContainer` uses React Query consistently for list and mutations.
- Reuse or add reusable components:
  - `components/preset/PresetPicker.tsx`:
    - New, shadcn/Radix-based picker for selecting a preset (list + search + category filters).
  - Reuse `PresetStatsChips`, `PresetCard` display patterns where helpful.
  - If needed, add `components/common/StepHeader.tsx` and `components/common/WizardProgress.tsx`.

## Data Flow

- Presets: `fetchPresets()` (existing) → React Query cache `['presets']` (shared with presets view).
- Agents: add `createAgent` fetcher using `ServiceContainer.getOrThrow('agent').createAgent`.
- State: local-only for wizard inputs; no global stores for create flow.

## Interface Drafts

- `SubAgentCreateContainer.tsx`
  - Props: `{ onBack: () => void; onCreated?: (agentId: string) => void }`
  - Internals:
    - `const { data: presets } = useQuery({ queryKey: ['presets'], queryFn: fetchPresets });`
    - `const createMutation = useMutation({ mutationFn: createAgent, onSuccess: ... })`
  - Renders `<SubAgentCreate presets={presets ?? []} onCreate={...} onBack={...} />`

- `createAgent(newAgent: CreateAgentMetadata): Promise<ReadonlyAgentMetadata>` (fetcher)

- `PresetPicker.tsx`
  - Props: `{ presets: ReadonlyPreset[]; value?: string; onChange: (id: string) => void }`
  - Radix/command menu or list selectable cards, with search and basic category filters.

## TODOs

1. [x] Add fetcher: `createAgent` (+ deleteAgent) under `renderer/services/fetchers/subagents.ts`.
2. [x] Add container: `SubAgentCreateContainer.tsx` using React Query for presets + create mutation.
3. [x] Refactor UI: Update `SubAgentCreate.tsx` to use a picker UI in the Preset step.
4. [x] Add `PresetPicker.tsx` (new UI) and reuse `PresetStatsChips`.
5. [x] Update `ManagementView` routing to use new container when `creatingAgent`.
6. [x] Verify end-to-end with Playwright: create preset → create agent → agent appears.
7. [x] Documentation: Update this doc with decisions and follow-ups.

## Progress Notes

- Implemented `createAgent` and `deleteAgent` fetchers using `ServiceContainer.getOrThrow('agent')`.
- Added `SubAgentCreateContainer` with React Query integration: `['presets']` query and create mutation that invalidates `['agents']` on success.
- Wired `ManagementView` to render `SubAgentCreateContainer` during agent creation mode and pass `onCreateAgent` into `SubAgentManagerContainer`.
- Introduced `PresetPicker` with search + selection using shadcn/radix `RadioGroup`; displays basic preset stats via `PresetStatsChips`.
- Ensured type safety (no `any` in new code) and `pnpm -C apps/gui typecheck` passes.

## Validation

- E2E: Playwright test for agent create funnel passes without console errors.
- Agents list reflects newly created agent; preset step shows newly created presets.
- No `any` in new code; ESLint/typecheck passes.

## Risks / Mitigations

- React Query stale data: ensure `invalidateQueries(['agents'])` on create/update/delete; share `['presets']` with presets view.
- IPC assumptions: rely on existing `MockIpcChannel` in web; electron path remains unaffected.
- UI divergence: copy layout patterns from `design/AgentCreate.tsx` but keep code minimal and reusable.

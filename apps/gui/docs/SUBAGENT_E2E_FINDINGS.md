# Sub-Agent Create E2E Findings (Playwright)

Date: 2025-08-11
Scope: apps/gui – Sub-Agent create flow verification for plan item 6

## Scenario

- Create Preset via Presets → Create Project wizard.
- Create Agent via Sub Agents → Create Agent wizard (Overview → Category → Preset → Settings).
- Expectation: After creation, Sub Agents list shows the newly created agent.

## Observed Result

- Preset creation succeeds and appears in the Presets list immediately.
- Agent creation wizard completes successfully.
- After returning to Sub Agents, the view still shows "No Agents Yet" (list not updated).

## Root Cause Analysis

- Listing view gating is controlled by `currentAgents` from `useAppData` in `ManagementView.tsx`:
  - When `currentAgents.length === 0 && !showEmptyState`, an empty state is rendered instead of the React Query–based `SubAgentManagerContainer`.
- The agent is created through `SubAgentCreateContainer` using the service + React Query path (with `invalidateQueries(['agents'])`).
- However, `useAppData.currentAgents` is not updated by this creation path (it is a separate local state), so the gating condition remains true and prevents `SubAgentManagerContainer` from mounting.

## Fix Plan (Minimal, Safe)

1) ManagementView: Pass `onCreated` to `SubAgentCreateContainer` and, on success, set `showEmptyState` to `true` so that `SubAgentManagerContainer` mounts. React Query then fetches and renders the newly created agent (since `invalidateQueries(['agents'])` is already in place).

2) Follow-up (nice-to-have): Remove/relax gating based on `currentAgents` and let `SubAgentManagerContainer` handle its own empty state using query data to avoid dual sources of truth.

## TODOs

- [ ] Wire `onCreated` in `ManagementView` to toggle `showEmptyState` to `true` after creation.
- [ ] Verify with Playwright that the created agent appears in the Sub Agents list.
- [ ] (Optional) Refactor gating to rely on React Query only and consolidate agent state.

## Notes

- Query invalidation on creation (`invalidateQueries(['agents'])`) already exists in `SubAgentCreateContainer`.
- MockIpcChannel persists created agents in-memory, and `fetchAgentMetadatas()` reads from the same source.


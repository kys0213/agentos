# [ARCHIVED] Preset Funnel Debug Notes (Playwright)

Archived: 2025-08-12
Reason: Debug notes superseded by stable E2E flow and PLAYWRIGHT_MCP_GUIDE. Retained for historical context.

This document tracks errors found while reproducing the Preset creation/edit funnel in the web GUI via Playwright, along with likely root causes and fix ideas.

## Repro Steps

- Launch dev server: `pnpm --dir apps/gui run dev:web` (served at `http://localhost:5173`).
- Navigate to Home → Explore Features → Sidebar → Presets.
- Click "Create Project" to open the creation wizard dialog.
- Fill minimal fields and complete steps to "Create Preset".

## Observed Issues

1. Uncontrolled → controlled input warning

- Symptom: Console warning when opening the Create Project dialog.
- Message: `Warning: A component is changing an uncontrolled input to be controlled.`
- Context: Step 1 inputs in `PrestForm` use `value={formData.name}` / `value={formData.description}` when `formData` is initially `undefined` for those fields.
- Likely root cause: Using `undefined` for controlled inputs. Should default to empty string.
- Scope: `apps/gui/src/renderer/components/preset/PresetForm.tsx`

2. Hard crash after "Create Preset"

- Symptom: After completing the wizard and clicking "Create Preset", the page crashes.
- Console error (multiple times): `TypeError: Cannot read properties of undefined (reading 'includes')`
- Where: Inside `PresetManager` when computing category filters/counters and when filtering by `selectedCategory`.
- Likely root cause: Newly created preset can have `category === undefined` if the user doesn’t explicitly select a category during the wizard. Code assumes `preset.category` is a string[] and calls `.includes(...)`.
- Affected code: `apps/gui/src/renderer/components/preset/PresetManager.tsx`
  - Category counters like `p.category.includes('research')`.
  - Filtering logic:
    ```ts
    const matchesCategory =
      selectedCategory === 'all' || preset.category.includes(selectedCategory);
    ```

3. Additional safety gaps (not yet thrown but risky)

- In filtering: `preset.description.toLowerCase()` will throw if `description` is undefined.
- In rendering: `preset.category` is used directly for display in multiple places (e.g., card subtitle) and may render as `undefined` or throw when used as array.

## Quick Root Cause Summary

- Create wizard (`PrestForm`) initializes `formData` from `preset` (which is `null` on create), leaving many fields `undefined`.
- UI assumes required shape: strings are strings and `category` is a string array.
- Result: a warning during form entry and a runtime TypeError after creation when the list view re-renders with the newly created preset containing missing fields.

## Proposed Fixes (minimal, safe)

- In `PrestForm` (create mode), default undefined fields to safe values:
  - `name: ''`, `description: ''`, `systemPrompt: ''`, `category: ['research']`, `llmBridgeConfig: {}`.
  - Ensure input `value` props use `?? ''` so they are always controlled.
- In `PresetManager` (list/counters/filter): make logic null-safe:
  - Use `(Array.isArray(p.category) ? p.category : [])` before `.includes(...)`.
  - Use `(preset.description ?? '').toLowerCase()`.
  - Provide safe fallbacks when rendering category/name-derived text.

## Playwright Session Summary

- Navigated to `http://localhost:5173`.
- Console during load confirms bootstrap with `MockIpcChannel` in web mode and services registered.
- Warning on open of Create dialog: uncontrolled → controlled input.
- After creating without setting category, list refresh triggers `TypeError` from `.includes` on `undefined` category.

## Next Steps

- Implement the minimal fixes above and re-test the funnel via Playwright.
- Optionally, validate category selection as required in the wizard UI to prevent undefined (UX hardening).

---

## Fixes Implemented and Verified

- PrestForm defaults added for create mode: `name`, `description`, `systemPrompt`, `category=['research']`, `llmBridgeConfig={}`, `status='active'`.
- Controlled inputs fixed with `?? ''` to avoid uncontrolled→controlled warnings.
- PresetManager made null-safe for `category` and `description` in counters and filters.
- PresetCard now renders category and model with safe fallbacks.
- PresetStatusBadge now tolerates `undefined` status by defaulting to `idle`.
- Stats computation defaults `knowledgeDocuments` to `0` to avoid NaN.

Re-test result: Preset creation flow completes without runtime errors; Presets list renders the new item and counters update. Minor accessibility console warning remains for `DialogContent` description (non-blocking).

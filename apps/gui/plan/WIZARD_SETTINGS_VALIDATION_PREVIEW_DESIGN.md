# Wizard Settings — Validation & Preview UX (Clipboard/Input-first)

Status: Draft (Phase-ready)

## Goals

- Keep UX simple and consistent with current GUI styling (Radix/shadcn UI).
- Make errors visible early and show exactly what will change before applying.
- Align Export/Import with clipboard/input flow (no file dialogs for now).

## Scope (This phase)

- Settings tab only (Agent create wizard):
  - Status select, System Prompt textarea, MCP tools checklist (existing)
  - Export/Import card with clipboard + input textarea
  - Summary (diff) + Validation (health) cards on the right

## Information Architecture

- Left column (Inputs)
  - Agent Settings (Status select)
  - System Prompt (Textarea)
  - MCP Tools (Checkbox grid)
  - Export / Import (Textarea + buttons)

- Right column (Read-only)
  - Summary card: Changed fields + quick metrics
  - Validation card: Health (OK/Warning/Error) list

## Interactions

- Inline validation on change (required/type/length) → small message under field
- Validate button (on Settings or Export/Import card) → compute full schema result
- Apply (Import) → parse/validate → update formData + Summary diff highlight
- Create Agent → final validation; if fails, show top banner in card and focus first error

## Validation Rules (initial)

- Status: one of active|idle|inactive
- System Prompt: length <= 10,000 chars; normalize control chars
- MCP Tools: only installed IDs; unknown → Warning (not a blocker)
- Import JSON: supports Agent export; preset-only JSON auto-wrapped into Agent with defaults
- Size limits: pasted JSON <= 2 MB; show friendly error otherwise

## Diff / Summary

- Show changed fields with badges: Added (blue), Updated (yellow), Removed (gray)
- Metrics: prompt length (e.g., 1234 chars), enabled MCP count, status label
- Truncate long values in summary (e.g., prompt preview first 120 chars)

## Export/Import (Clipboard/Input-first)

- Export: Generate JSON → preview (Textarea) → Copy to clipboard
  - pretty-print (2 spaces), include schemaVersion: 1
- Import: Paste JSON → Validate/Apply
  - On failure: show Invalid JSON / field-level schema errors (human-readable)
  - On success: update formData + Summary diff

## Accessibility

- All messages as role="alert" when appropriate
- Tabs/buttons/selects/checkboxes focusable; focus first error on failure

## Testing Plan

- Unit: schema validation (valid/invalid/missing fields), MCP unknown tool warning
- UI (Testing Library):
  - Invalid JSON → error message
  - Valid JSON → Apply updates prompt and summary diff
  - Create failure → banner + focus first error

## Phased Implementation

1. Add Summary/Validation cards (skeleton using existing Card/Badge components)
2. Diff computation (shallow over name/status/preset.systemPrompt/enabledMcps)
3. Inline validation + Validation card integration
4. Hook Import Apply → compute diff + update formData + summary
5. Final validation on Create Agent → banner + focus behavior
6. Tests for import/validation/diff essentials

## Future Enhancements (later phase)

- File open/save dialogs (IPC), version migration helpers
- Rich diff highlighting (character-level), field-wise revert toggles
- Preset templates and formatting tools (beautify toggle)

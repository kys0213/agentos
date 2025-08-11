# Playwright MCP Guide

This guide explains how to verify GUI UX flows using Playwright MCP (Model Context Protocol tool).

## Goals

- Launch the dev web server and drive the browser via Playwright MCP.
- Verify critical flows without manual clicking, and capture console errors.

## Prerequisites

- Dev server: `pnpm install` at repo root, then `cd apps/gui`.
- Ensure the app boots in web mode: `pnpm dev:web` exposes `http://localhost:5173`.

## Stable Selectors

Use the following `data-testid` selectors for reliable interactions:

- Sidebar navigation
  - `nav-presets` → Presets section
  - `nav-subagents` → Sub Agents section
- Presets
  - `btn-create-project` → Open Create Preset wizard/page
  - `btn-create-preset` → Finalize preset creation
- Sub Agents
  - `btn-create-agent` → Start create agent wizard
  - `btn-final-create-agent` → Finalize agent creation

Other form elements use accessible labels (e.g., “Agent Name”, “Description”).

## Typical MCP Script Flow

1. Start dev server in one terminal:
   - `cd apps/gui`
   - `pnpm dev:web`

2. In MCP tool, open the browser to `http://localhost:5173`.

3. Preset → Agent creation flow:
   - Click `nav-presets`
   - Click `btn-create-project`
   - Fill “Preset Name” and “Description” (placeholders as in UI)
   - Proceed steps; click `btn-create-preset`
   - Click `nav-subagents`
   - Click `btn-create-agent`
   - Fill “Agent Name”, “Description”, select the newly created preset, finalize via `btn-final-create-agent`

4. Console error capture:
   - Collect `console.error` and React warnings; any error or uncaught exception fails the flow.

## E2E Tests (Reference)

- `apps/gui/e2e/web-gui-basic.e2e.test.ts`
- `apps/gui/e2e/subagent-create-flow.e2e.test.ts`

These tests mirror the MCP flow using the same selectors. They should not be executed in CI unless explicitly allowed; use them as living documentation for MCP scenarios.

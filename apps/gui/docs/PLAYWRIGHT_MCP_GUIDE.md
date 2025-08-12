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

## Policy: No GUI E2E tests

- GUI 기능 검증은 dev 서버(`pnpm dev:web`) + Playwright MCP 디버깅으로 진행합니다.
- 새로운 GUI E2E 테스트 파일을 추가하지 않습니다. 기존 참고용 E2E는 문서적 참고로만 유지합니다.
- MCP 스크립트/플레이북을 통해 동일 시나리오를 재현하고, 셀렉터는 본 문서의 data-testid를 사용하세요.

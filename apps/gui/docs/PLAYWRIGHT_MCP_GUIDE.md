# Playwright MCP Guide

This guide explains how to verify GUI UX flows using Playwright MCP (Model Context Protocol tool).

Scenario: Agent creation → enter chat → send message → receive response

## Goals

- Launch the dev web server and drive the browser via Playwright MCP.
- Verify critical flows without manual clicking, and capture console errors.

## Prerequisites

- Dev server: `pnpm install` at repo root, then `cd apps/gui`.
- Ensure the app boots in web mode: `pnpm dev:web` exposes `http://localhost:5173`.

## Stable Selectors

Use the following `data-testid` selectors for reliable interactions:

- Sidebar navigation
  - `nav-subagents` → Sub Agents section
- Sub Agents
  - `btn-create-agent` → Start create agent wizard
  - `btn-final-create-agent` → Finalize agent creation

Other form elements use accessible labels (e.g., “Agent Name”, “Description”).

## Typical MCP Script Flow

1. Start dev server in one terminal:
   - `cd apps/gui`
   - `pnpm dev:web`

2. In MCP tool, open the browser to `http://localhost:5173`.
   - Alternatively, run a script (pseudo):

     ```ts
     // Pseudo-only. Keep as documentation; don't commit runnable tests per policy.
     import { chromium } from '@playwright/test';

     async function run() {
       const browser = await chromium.launch();
       const page = await browser.newPage();
       await page.goto('http://localhost:5173');
       await page.getByTestId('nav-subagents').click();
       await page.getByTestId('btn-create-agent').click();
       await page.getByLabel('Agent Name').fill('Test Agent');
       await page.getByRole('button', { name: 'Next: Category' }).click();
       await page.getByRole('button', { name: /Development.*software engineering/i }).click();
       await page.getByRole('button', { name: 'Next: AI Config' }).click();
       await page.getByRole('button', { name: 'Next: Agent Settings' }).click();
       await page.getByRole('button', { name: 'Create Agent' }).click();
       // Send a message
       await page.getByPlaceholder('Type a message').fill('Hello');
       await page.keyboard.press('Enter');
       // Expect a response bubble
       await page.getByTestId('chat-assistant-bubble').first().waitFor();
       await browser.close();
     }
     run();
     ```

3. Agent creation flow:
   - Click `nav-subagents`
   - Click `btn-create-agent`
   - Fill “Agent Name”, “Description”, then advance through Category → AI Config → Settings
   - Ensure AI Config reveals MCP Tools
   - Finalize via `btn-final-create-agent`

4. Console error capture:
   - Collect `console.error` and React warnings; any error or uncaught exception fails the flow.

## Playwright Running Tips

- Use console reporters to avoid HTML report/UIs:
  - `pnpm --filter @agentos/apps-gui test:e2e:line`
  - `pnpm --filter @agentos/apps-gui test:e2e:json`
- Config defaults to `reporter: line`; override with `PW_REPORTER` if needed.
- Tests reuse an existing dev server at `http://localhost:5173` when present; otherwise they launch via `webServer`.

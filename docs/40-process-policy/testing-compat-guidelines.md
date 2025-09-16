# Testing/Tooling Compatibility Guidelines

> Purpose: Prevent regressions when introducing or upgrading testing libraries and runtime tooling. Changes MUST be compatible with existing suites or provide a safe migration strategy.

## When adding/changing libraries

- Analyze impact across these layers before the first commit:
  - Runner & environment: node, jsdom, electron, playwright.
  - Global setup: `expect` extensions, globals, polyfills.
  - Module resolution & formats: CJS/ESM, tsconfig `moduleResolution`, bundler settings.
  - Lint & TS rules: test-only relaxations, type boundaries.
- Produce a brief “compat report” in the PR description:
  - What’s added/changed, default behaviors, and expected side-effects.
  - Discovery of conflicts (e.g., `@testing-library/jest-dom` extending global `expect`).
  - Scoping strategy (opt-in patterns or separate configs) and rollback plan.

## Mandatory scoping & safety

- Scope new env/setup to the minimal surface:
  - Use a package-local Vitest config (e.g., `apps/gui/vitest.config.ts`).
  - Keep `setupFiles` as small as possible. Prefer `@testing-library/jest-dom/vitest` over the global entry.
  - Do NOT modify workspace-wide test runner behavior without a migration.
- Split suites by type where needed:
  - `unit` (node / jsdom), `e2e` (playwright), `legacy` (node-only). Provide separate scripts.
  - Start with opt-in inclusion patterns; expand once green.

## Rollback protocol

- If compatibility fixes exceed the time budget, roll back the library change and keep tests green.
- Alternatives:
  - Keep existing runner and add a targeted helper (e.g., `react-test-renderer`) for UI spots.
  - Gate new framework usage behind an opt-in script.

## PR checklist (must-have)

- [ ] Impacted packages and suites enumerated
- [ ] Env/setup scoping described (config file, include patterns)
- [ ] Fallback/rollback steps documented
- [ ] Local run evidence: `lint`, `typecheck`, `test` (with suite names), `build`

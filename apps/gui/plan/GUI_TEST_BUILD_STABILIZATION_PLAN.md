# GUI Test/Build Stabilization Plan (Strict + Compatible)

Status: Draft
Last Updated: 2025-09-21

Status: Draft – Work-in-Progress on branch `feature/gui-core-rpc-integration`
Owner: GUI team

> Node 22.19.0 / pnpm 10.17.0 환경에서 `pnpm lint`, `pnpm typecheck`, `pnpm test --filter renderer -- --runInBand --project main` 전부 통과함. main 테스트 hang 문제는 MCP usage publisher `setInterval().unref()`로 해결됨. 남은 TODO는 Slack bot 패키지의 type 정리와 lint 경고 제거입니다.

## Goals

- Make apps/gui pass lint, typecheck, test, and build consistently.
- Preserve legacy test suites (backward compatibility), while enabling modern unit/UI tests.
- Establish a safe path so future features ship with tests by default.

## Constraints & Risks

- Strict ESLint/TS rules (no `any/unknown` casting, curly, etc.).
- Mixed test styles (legacy node/electron tests + newer jsdom/UI tests).
- Module resolution differences between workspace packages (CJS/ESM, bundler).

## High-Level Strategy

1. Document compatibility guidelines (Added)
   - See `docs/40-process-policy/testing-compat-guidelines.md`.
2. Prefer compatibility fixes before rollback
   - Scope jsdom/jest-dom to Vitest only, avoid global expect pollution.
   - Split test runners/patterns if needed (unit vs legacy).
3. Typecheck-first remediation (source of truth)
   - Fix imports/types to remove casts and unknowns.
   - Normalize dates, API payload/returns matching contracts.
4. Lint remediation
   - Remove `as any/unknown`, fix style, keep tests type-safe.
5. Green legacy tests
   - Adjust environment or mocks where necessary, without changing behaviors.
6. CI order: unit → legacy → (optional) e2e
   - Catch regressions early with fast suites.

## Work Breakdown (Detailed)

A. Test Environment & Scope

- A1. Keep Vitest jsdom setup local to apps/gui (Already done):
  - apps/gui/src/test/vitest.setup.ts uses `@testing-library/jest-dom/vitest`.
- A2. Split execution targets:
  - Add `test:unit` (runs only new unit/UI tests under a dedicated pattern, e.g. `__tests__/unit|ui`).
  - Keep `test:legacy` (runs existing suites that assume node/electron env).
  - Update root `test` to run both in sequence.

B. Typecheck Fixes (apps/gui)

- B1. knowledge.service
  - Replace deep imports with public exports or stable paths.
  - Remove `any/unknown` casts; use explicit types; convert `updatedAt` to Date where needed.
- B2. knowledge.adapter
  - Remove `as any`; infer from contract clients (`z.infer<...>`).
- B3. use-dashboard
  - Remove `null as const`; return plain `null` values; keep guards.
- B4. use-mcp (tools hook)
  - Ensure adapter method exists (`listTools`) or adapt call site to supported API.
- B5. agent-export utils
  - Fix status type (narrow to 'active'|'idle'|'inactive'); avoid assigning readonly arrays.
- B6. SubAgentManager
  - Ensure constants import path valid; type of filter key matches constants.
- B7. McpToolManager
  - Avoid using variables before declaration (`handleRefresh`).
- B8. mcp-usage.eventing.service
  - Correct import (e.g., `FileMcpUsageRepository` vs non-existent types).

C. Lint Fixes

- C1. Remove unsafe casts in prod code; prefer contract types or helpers.
- C2. In tests, define minimal test-only interfaces instead of `any`.
- C3. Minor style (`curly`, etc.).

D. Legacy Tests – Compatibility

- D1. Identify failing suites & causes (env/mocks/global setup).
- D2. For jsdom conflicts, keep node env and avoid jsdom setup load path.
- D3. Provide local mocks where global side-effects happen.
- D4. Mark truly obsolete cases for later refactor (but keep green now).

E. CI & Scripts

- E1. Add scripts:
  - `test:unit` (apps/gui, vitest, jsdom, new patterns)
  - `test:legacy` (apps/gui, legacy patterns, node/electron env)
  - Root `test` runs unit → legacy → (optional) e2e
- E2. Enforce `pnpm -w lint`, `-w typecheck`, `-w build` on PRs.

## Acceptance Criteria

- Lint: zero errors.
- Typecheck: zero errors.
- Test: unit & legacy suites green locally; CI shows both.
- Build: `pnpm -w build` passes.

## Execution Checklist (This branch)

- [x] A2: Split test scope & scripts; restrict new jsdom tests to unit-only pattern. (vitest 멀티 프로젝트 + `test:renderer`/`test:main` 스크립트 반영)
- [ ] B1–B8: Fix typecheck errors in listed files.
- [ ] C1–C3: Fix ESLint violations in adapters/services/utils/tests.
- [ ] D1–D3: Make legacy suites green (map failures → fixes).
- [ ] E1–E2: Update scripts & CI docs.

## Notes / Current Status

- jest-dom scoping adjusted to Vitest environment.
- Compatibility guidelines added.
- Renderer 테스트 보강: Knowledge 검색/미리보기/본문 로드, MCP usage 이벤트/대시보드 갱신, DashboardCard, MCP Manager 빈/에러 경로
- E2E 스모크: Playwright MCP 스모크(`apps/gui/e2e/mcp-verify.e2e.test.ts`)
- Next actionable step: begin typecheck remediation (B1–B8) & ESLint fixes (C1–C3).

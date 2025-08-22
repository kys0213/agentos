# Code Style Guide

This project uses **TypeScript** with ESLint and Prettier to keep the codebase consistent.

- Run `pnpm lint` to check lint errors.
- Run `pnpm format` to automatically format files.
- Follow the rules defined in `.eslintrc.json` and `.prettierrc`.
- Use arrow function parentheses and avoid unused variables unless prefixed with `_`.

## Additional Guidelines

1. **SOLID Principles** — design modules and classes to obey SOLID principles for maintainability.
2. **Clean Architecture** — aim for a clear dependency flow and avoid circular references.
3. **Test-Driven Development** — write tests first when adding new behavior.
4. **Type Safety** — favor generics and avoid `any`. If you must accept unknown input, use `unknown` and guard types before use.

## Control Flow & Readability

- **Always use braces**: All control statements (if/else/for/while/try-catch) must use braces.
- **No single-line blocks**: Even for short conditions, write blocks on multiple lines.
  - Bad: `if (ready) { start(); }`
  - Good:
    ```ts
    if (ready) {
      start();
    }
    ```
- **Ternary usage**: Avoid nested ternaries; prefer multiline formatting for readability.

## Frontend Architecture

- **Container/Presentation Split**
  - Presentation components: consume synchronous props only. No server/IPC access inside. Reusable, dumb.
  - Container components: use React Query to load/mutate server state via IPC fetchers, then inject data/handlers into presentation.
  - Query keys standard: lists `['presets']`, item `['preset', id]`, agents `['agents']`.

- **IPC Fetchers (Renderer)**
  - Fetchers call `ServiceContainer.resolve('<service>')` and the corresponding Protocol methods.
  - Map Core/loose types to app DTOs at the boundary; never pass loose types to presentation.
  - Handle domain mismatches (e.g., status variants) explicitly in adapters.

- **Shared UI Extraction**
  - Repeated input groups (e.g., preset basic fields, model settings) must be extracted into shared components.
  - Options (categories, model lists) should be injected via props for testability/i18n.

## Dead Code and Console

- Remove unused code and exports before PR. Use:
  - `npx ts-prune` for dead exports
  - ESLint `import/no-unused-modules` to catch unused modules
- Avoid `console.*` in committed code; keep only `console.warn`/`console.error` for critical paths.

## Pre‑push Quality Checks

```bash
pnpm -r typecheck
pnpm -r lint -- --max-warnings=0
npx ts-prune
```

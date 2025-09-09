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
5. **One Class per File** — 한 파일에는 하나의 클래스만 선언합니다. 유지보수성과 검색성, 순환 의존성 방지에 유리합니다. (ESLint `max-classes-per-file: ["error", 1]` 적용)

### One Class per File 규칙 예외

- 테스트 파일(`**/__tests__/**`, `*.test.ts`, `*.spec.ts`)은 작은 mock/helper 클래스를 함께 둘 수 있도록 최대 2개까지 경고 수준으로 허용합니다. 파일이 커지면 분리하세요.
- `index.ts`(barrel 파일)는 클래스를 직접 선언하지 말고 재-export만 수행합니다.
- 인터페이스/타입/enum은 이 규칙의 대상이 아니지만, 클래스와 섞여 과도하게 커질 경우 파일을 분리하는 것을 권장합니다.

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

## Naming Conventions

- **Conventional first**: 보편적으로 통용되는 이름을 우선합니다. 특별한 설명 없이도 이해 가능한 용어를 선택하세요.
- **Avoid internal jargon**: 팀 내부 은어/메타포 대신, 외부 기여자가 이해할 수 있는 일반 용어를 사용합니다.
- **Disambiguate "index"**: 디렉터리 이름으로 `index`를 지양합니다. 검색/색인 맥락은 `indexing` 또는 `search-index` 같은 명확한 용어를 사용합니다.
- **No clever abbreviations**: 축약/암호화된 네이밍을 피하고, 의미가 드러나는 전체 단어를 사용합니다.
- **Consistency across code/docs**: 코드와 문서에서 동일한 용어를 사용합니다. 명칭 변경 시 코드/문서/ToC를 함께 갱신합니다.
- **English identifiers**: 코드 식별자는 영어를 사용합니다. 필요 시 주석에 한글 병기 가능합니다.

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

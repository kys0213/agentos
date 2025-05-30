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

# Testing Guide

Unit tests use **Jest** with `ts-jest`. Test files live under `__tests__` directories.

Run all tests from the repository root:

```bash
pnpm test
```

For watch mode during development:

```bash
pnpm dev
```

## Unit Test Guidelines

1. Test files must end with `.test.ts`.
2. If you need spies, consider refactoring so that mock objects can be injected.
3. Write deterministic unit tests using these mocks.
4. When repetitive patterns occur, prefer parameterized tests.

## e2e Test Guidelines

1. End-to-end test files must end with `.e2e.test.ts`.

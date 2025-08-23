# GUI Code Style — Curly Blocks & Ternary Guidelines

Purpose: keep TS/TSX readable and consistent, and avoid Prettier×ESLint conflicts seen in GUI code.

## Principles

- Prefer simple, explicit control flow over clever one‑liners.
- Use guard clauses to flatten nesting.
- Extract small helpers for readability when branches get verbose.

## Required Rules (GUI)

- Curly blocks: always use braces for single‑line `if/else/for/while` in TS/TSX.
- No nested ternaries: replace with guard clauses or helpers.
- Multiline ternary: avoid except for very short JSX fragments; otherwise refactor.
- Type safety: avoid `any`; prefer `unknown` + guards or concrete types. `as any` is banned.

## Patterns

1) Guard clauses instead of deep if/else nesting

Before
```tsx
if (a) doA(); else if (b) doB(); else doC();
```

After
```tsx
if (a) {
  doA();
  return;
}
if (b) {
  doB();
  return;
}
doC();
```

2) Replace nested ternaries in JSX

Before
```tsx
{status === 'ok' ? <Ok/> : hasWarn ? <Warn/> : <Err/>}
```

After
```tsx
{status === 'ok' && <Ok/>}
{status !== 'ok' && hasWarn && <Warn/>}
{status !== 'ok' && !hasWarn && <Err/>}
```
or lift logic above render:
```ts
const body = status === 'ok' ? <Ok/> : hasWarn ? <Warn/> : <Err/>; // small only
```

3) Extract helper for repeated branch styles

Before
```tsx
<span className={`dot ${s === 'success' ? 'g' : s === 'error' ? 'r' : 'y'}`}/>
```

After
```ts
function dotClass(s: string) {
  if (s === 'success') return 'g';
  if (s === 'error') return 'r';
  return 'y';
}
```
```tsx
<span className={`dot ${dotClass(status)}`}/>
```

4) Curly blocks for one‑liners

Before
```ts
if (!id) return null;
```
After
```ts
if (!id) {
  return null;
}
```

## ESLint/Prettier

- Enforced: `curly`, `no-nested-ternary`, `multiline-ternary` (GUI stricter).
- Ensure code passes `pnpm -C apps/gui lint` and `pnpm format` before commit.

## PR Checklist (GUI)

- [ ] No nested ternaries remain in changed files.
- [ ] Single‑line branches use curly braces.
- [ ] Complex JSX conditions are lifted or split into guarded blocks.
- [ ] No `any` added; no `as any` present.
- [ ] `pnpm -r typecheck`, `pnpm -C apps/gui lint`, and `pnpm format` succeed.


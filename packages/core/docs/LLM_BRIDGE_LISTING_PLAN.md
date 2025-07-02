# LLM Bridge Listing Utility Plan

## Requirements
- Provide a function in core to list installed LLM Bridge packages.
- Read `package.json` dependencies and return names starting with `@llm-bridge/`.
- Allow Slack bot and other packages to reuse this utility.

## Interface Sketch
```ts
// packages/core/src/common/utils/list-installed-llm-bridges.ts
export function listInstalledLlmBridges(baseDir?: string): string[];
```

## Todo
- [ ] implement utility and unit test in core
- [ ] export function from `core` index
- [ ] remove Slack bot copy and update imports
- [ ] update docs referencing old path
- [ ] run `pnpm lint`, `pnpm build`, `pnpm test`

## 작업 순서
1. Create utility and test in core
2. Update Slack bot to use new function and remove old file
3. Adjust documentation
4. Run lint, build, and test

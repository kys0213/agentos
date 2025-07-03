# MCP Listing Utility Plan

## Requirements
- Provide a utility to list the names of MCPs currently registered in an `McpRegistry` instance.
- Allow other packages such as the Slack bot to display the installed MCP list.

## Interface Sketch
```ts
// packages/core/src/mcp/list-installed-mcps.ts
export function listInstalledMcps(registry: McpRegistry): Promise<string[]>;
```

## Todo
- [ ] implement `listInstalledMcps` using `McpRegistry.getAll`
- [ ] export the function from `core` index
- [ ] add a unit test under `__test__`
- [ ] run `pnpm lint`, `pnpm build`, and `pnpm test`

## 작업 순서
1. Create utility and test files
2. Update index export
3. Run lint, build and test

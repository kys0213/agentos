# GUI MCP Settings Plan

## 요구사항

- GUI에서 MCP 연결 정보를 편집할 수 있는 화면을 제공한다.
- `@agentos/core`의 `McpConfig` 타입을 이용하여 입력 필드를 구성한다.
- MCP 설정을 저장하면 앱을 다시 실행했을 때 즉시 불러와 연결할 수 있어야 한다.
- MCP 종류(`stdio`, `streamableHttp`, `websocket`, `sse`)에 따라 필요한 필드가 동적으로 나타나야 한다.

## 인터페이스 초안

```ts
// packages/gui/src/renderer/mcp-config-store.ts
export class McpConfigStore {
  get(): McpConfig | undefined;
  set(config: McpConfig): void;
}

// packages/gui/src/renderer/McpSettings.tsx
interface McpSettingsProps {
  initial?: McpConfig;
  onSave(config: McpConfig): void;
}
```

## Todo

- [ ] `McpConfigStore` 구현하여 `electron-store`로 설정 저장/로드
- [ ] 저장된 설정을 이용해 `Mcp.create()`로 MCP 인스턴스를 반환하는 헬퍼 작성
- [ ] `McpSettings` 컴포넌트에서 MCP 유형별 입력 폼 작성
- [ ] `ChatApp`에 설정 화면을 열 수 있는 버튼 추가
- [ ] 기본 테스트 작성 및 `pnpm lint` `pnpm test` 실행

## 작업 순서

1. `McpConfigStore`와 MCP 로딩 헬퍼 구현
2. `McpSettings` UI 작성 (단순한 입력 폼으로 시작)
3. `ChatApp`에 버튼을 추가하여 설정 화면을 토글
4. 테스트 추가 후 린트와 테스트 실행

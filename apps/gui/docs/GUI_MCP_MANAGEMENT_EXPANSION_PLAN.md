# GUI MCP Management Expansion Plan

## Requirements

### 성공 조건
- [ ] Multiple MCP configurations can be stored and selected.
- [ ] Users can delete unused MCP settings.
- [ ] Selected MCP is applied when starting a new session.

### 사용 시나리오
- [ ] User opens MCP list and adds several configurations.
- [ ] User selects one as active and starts a new chat session.
- [ ] User removes obsolete configurations from the list.

### 제약 조건
- [ ] Settings persist using `electron-store`.
- [ ] Backward compatibility with existing single MCP setup.

## Interface Sketch
```typescript
export interface McpConfigStore {
  list(): McpConfig[];
  save(config: McpConfig): void;
  delete(id: string): void;
  setActive(id: string): void;
  getActive(): McpConfig | undefined;
}
```

## Todo
- [ ] Refactor `McpConfigStore` to handle an array of configs
- [ ] Expand `McpList` component with select and delete actions
- [ ] Allow ChatApp to pick the active MCP when creating sessions
- [ ] Unit tests for store operations and selection logic
- [ ] Update documentation describing new management UI

## 작업 순서
1. **스토어 개편**: 배열 기반 저장 로직 구현 (완료 조건: 여러 설정 저장 가능)
2. **UI 확장**: `McpList`에 선택/삭제 기능 추가 (완료 조건: 목록에서 조작 가능)
3. **세션 연동**: 새 세션 생성 시 활성 MCP 적용 (완료 조건: 선택된 MCP로 시작)
4. **테스트/문서**: 기능 검증 후 문서 업데이트 (완료 조건: lint/test 통과)

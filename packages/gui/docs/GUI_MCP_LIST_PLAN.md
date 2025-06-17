# GUI MCP List Plan

## 요구사항
- GUI에서 사용자가 저장한 MCP 목록을 보여 주는 화면을 제공한다.
- 왼쪽 사이드바 메뉴에서 해당 화면을 열 수 있어야 한다.
- 각 항목은 MCP 이름과 타입을 기본 정보로 표시한다.
- 향후 편집 기능 확장을 고려해 단순한 구조로 구현한다.

## 인터페이스 초안
```ts
// packages/gui/src/renderer/McpList.tsx
interface McpListProps {
  mcps: McpConfig[];
  onClose(): void;
}
```
사이드바에 "MCPs" 메뉴를 추가하여 목록 화면을 열도록 변경할 예정이다.

## Todo
- [ ] `McpList` 컴포넌트 작성
- [ ] `ChatSidebar`에 "MCPs" 메뉴 항목 추가
- [ ] `ChatApp`에 `showMcpList` 상태를 도입해 화면 전환
- [ ] 기본 렌더 테스트 포함 후 `pnpm lint`와 `pnpm test` 실행

## 작업 순서
1. `McpList` 작성 후 단위 테스트 추가
2. `ChatSidebar`와 `ChatApp`을 수정하여 목록 화면을 열고 닫는 기능 구현
3. 린트와 테스트 실행 후 커밋

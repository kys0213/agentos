# GUI Multi-Tab & MCP List Plan

## 요구사항
- 여러 대화 세션을 탭 형태로 동시에 열어 관리할 수 있어야 한다.
- 사이드바와 탭 상태는 항상 동기화되어 현재 활성 세션을 명확히 보여 준다.
- 사이드바 메뉴에서 MCP 목록 화면을 열어 사용자가 저장한 MCP 설정을 확인할 수 있다.

## 인터페이스 초안
```ts
// packages/gui/src/renderer/ChatTabs.tsx
interface ChatTab {
  id: string;
  title: string;
}
interface ChatTabsProps {
  tabs: ChatTab[];
  activeTabId?: string;
  onSelect(id: string): void;
}

// packages/gui/src/renderer/McpList.tsx
interface McpListProps {
  mcps: McpConfig[];
  onClose(): void;
}
```

## Todo
- [x] `ChatTabs` 컴포넌트 작성
- [x] `ChatApp`에서 탭 목록과 활성 탭 상태 관리
- [x] 세션 로드 또는 생성 시 탭에 추가하고 활성화
- [x] 사이드바의 세션 선택과 탭 상태 동기화
- [x] `McpList` 컴포넌트 작성 및 기본 렌더 테스트
- [x] 사이드바에 "MCPs" 메뉴 추가하여 목록 화면을 토글
- [x] `pnpm lint` 와 `pnpm test` 실행

## 작업 순서
1. `ChatTabs`와 `McpList` UI 컴포넌트 구현
2. `ChatApp` 상태 로직 수정하여 탭과 MCP 목록 화면 제어
3. 사이드바 동작을 업데이트해 탭/목록 화면이 정상 연동되는지 확인
4. 단위 테스트 추가 후 린트와 테스트를 실행하여 커밋

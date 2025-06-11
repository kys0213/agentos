# GUI Previous Session Selection Plan

## 요구사항
- 사용자는 사이드바에서 이전 대화 세션 목록을 확인할 수 있다.
- 세션을 선택하면 해당 대화 기록이 메인 채팅창에 로드되고, 이후 대화를 이어 나갈 수 있다.

## 인터페이스 초안
```ts
// packages/gui/src/renderer/ChatSidebar.tsx
interface ChatSidebarProps {
  sessions: ChatSessionDescription[];
  currentSessionId?: string;
  onNew: () => void;
  onOpen: (id: string) => void;
}
```

## Todo
- [x] `ChatApp` 에 세션을 로드하고 상태를 관리하는 로직 구현
- [x] `ChatSidebar` 컴포넌트에서 세션 리스트 표시 및 선택 기능 제공
- [x] 세션 선택 시 `ChatSession.getHistories` 로 메시지를 불러오기
- [x] 새 세션 생성 기능 추가
- [x] `pnpm lint` 와 `pnpm test` 실행

## 작업 순서
1. `ChatSidebar` UI 작성 및 props 정의 ✅
2. `ChatApp` 에서 `ChatManager` 로 세션 목록을 불러오고 상태 관리 ✅
3. 세션 로드 함수 구현 후 메시지 히스토리를 메인 뷰에 출력 ✅
4. 테스트 및 린트 실행 후 커밋 ✅

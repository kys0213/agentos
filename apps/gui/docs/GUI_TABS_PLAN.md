# GUI Chat Tabs Plan

## 요구사항

- 브라우저처럼 여러 탭을 열어 동시에 여러 대화 세션을 사용할 수 있어야 한다.
- 사이드바는 항상 보이고, 활성화된 탭과 일치하는 대화 세션 항목이 강조 표시되어야 한다.
- 새 세션을 열거나 사이드바에서 세션을 선택하면 해당 세션이 탭으로 추가되고 활성화된다.

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
  onSelect: (id: string) => void;
}
```

## Todo

- [x] `ChatTabs` 컴포넌트 추가
- [x] `ChatApp` 상태에 열린 탭 목록과 활성 탭 id 관리
- [x] 세션 로드/생성 시 탭에 추가하고 활성화
- [x] 사이드바의 `currentSessionId` 가 활성 탭과 동기화되도록 수정
- [x] `pnpm lint` 와 `pnpm test` 실행

## 작업 순서

1. `ChatTabs` 컴포넌트 구현
2. `ChatApp` 에 탭 상태 로직 추가 및 기존 세션 로딩 로직 수정
3. 사이드바와 탭 동기화 후 동작 확인
4. 테스트와 린트 실행 후 커밋

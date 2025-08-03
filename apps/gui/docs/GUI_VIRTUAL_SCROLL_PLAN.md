# GUI 레이아웃 및 성능 개선 계획서 (가상 스크롤 도입)

## 1. 문제 재분석 (Problem Re-analysis)

이전 수정 작업이 피상적이어서 근본적인 문제를 해결하지 못함.

1.  **성능 저하 위험**: 채팅 목록이 길어질 경우, 모든 아이템을 렌더링하여 DOM이 무거워지고 앱 성능(시작, 스크롤)이 저하될 위험이 존재.
2.  **레이아웃 불안정성**:
    - `Quick Access` 메뉴가 창 크기에 따라 가려지는 오버플로우 문제가 여전히 발생.
    - 컴포넌트 간 경계선이 디자인 시스템과 맞지 않게 투박하게 남아있음.

## 2. 개선 전략 (Improvement Strategy)

`frontend-architect`와 `designer-ux`의 관점을 통합하여 근본적인 해결책을 적용.

- **전략 1: 가상 스크롤 도입 (Virtual Scrolling)**
  - `react-window` 라이브러리를 사용하여 채팅 목록을 가상화.
  - 현재 화면에 보이는 아이템만 렌더링하여 수백, 수천 개의 채팅 기록이 있어도 일정한 성능을 보장.
- **전략 2: 견고한 레이아웃 재구성 (Robust Layout Restructuring)**
  - `ChatHistory.tsx`의 레이아웃을 Flexbox를 사용하여 명확하게 '스크롤 영역'과 '고정 영역'으로 분리.
- **전략 3: 시맨틱 스타일링 적용 (Semantic Styling)**
  - 하드코딩된 `border` 클래스를 완전히 제거.
  - `tailwind.config.js`에 정의된 `bg-muted`, `bg-background` 등 시맨틱 색상을 사용하여 시각적 계층을 구현.

## 3. 세부 실행 계획 (Detailed Action Plan)

### A. `ChatHistory.tsx` 리팩토링 (가상 스크롤 및 레이아웃 수정)

1.  **의존성 확인**: `pnpm list react-window`를 통해 `react-window` 라이브러리가 설치되어 있는지 확인. 없다면 `pnpm add react-window @types/react-window`로 설치.
2.  **컴포넌트 구조 변경**:
    - `ChatHistory.tsx`의 루트 `div`를 `flex flex-col h-full`로 설정.
    - 상단(Header, Search)은 고정.
    - 중앙의 채팅 목록 영역을 `flex-1 overflow-y-auto`로 만들고, 이 안에 `react-window`의 `FixedSizeList` 컴포넌트를 적용.
    - 하단의 `Quick Access` 메뉴를 스크롤 영역 밖으로 빼내어 하단에 고정.
3.  **가상 리스트 구현**:
    - `FixedSizeList`를 사용하여 `Pinned`와 `Recent` 목록을 함께 렌더링.
    - 각 아이템(채팅 세션)을 렌더링하는 `Row` 컴포넌트를 생성.
    - `itemSize`와 `itemCount`를 동적으로 계산하여 전달.

### B. 전역 스타일 재검토 및 수정

1.  **대상 파일**: `ChatView.tsx`, `ChatHistory.tsx`, `ManagementView.tsx` 등
2.  **작업 내용**:
    - 모든 `border-l`, `border-r`, `border-x` 등 경계선 관련 클래스를 제거.
    - `ChatHistory.tsx`와 `Agent Selection Panel`의 루트 `div`에 `bg-muted`를 적용.
    - 메인 `ChatView`의 중앙 컨텐츠 영역은 `bg-background`를 유지하여 자연스러운 색상 대비로 영역을 구분.

## 4. 예상 결과 (Expected Outcome)

1.  수백 개의 채팅 기록이 있어도 매우 빠르고 부드러운 스크롤 성능을 제공.
2.  `Quick Access` 메뉴가 항상 하단에 고정되어 안정적인 UX를 제공.
3.  앱 전체적으로 경계선이 사라지고, `shadcn/ui` 디자인 시스템에 맞는 세련되고 통일된 UI가 완성됨.

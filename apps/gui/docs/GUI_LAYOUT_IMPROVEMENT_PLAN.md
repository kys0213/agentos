# GUI 레이아웃 개선 계획서

## 1. 문제 분석 (Problem Analysis)

1.  **강한 경계선 문제**: 현재 UI(`current/image.png`)는 각 레이아웃 영역(사이드바, 메인 뷰) 사이에 굵은 검은색 선(`border`)이 있어 시각적으로 분리되고 투박해 보입니다. 목표 디자인(`chat.png`)은 경계선 없이 미묘한 배경색 차이와 그림자로 영역을 구분하여 더 세련되고 통합된 느낌을 줍니다.
2.  **하단 메뉴 오버플로우**: 왼쪽 사이드바의 `Quick Access` 메뉴가 창 크기가 작아지면 화면 밖으로 밀려나가 접근할 수 없습니다. 이는 사이드바의 레이아웃 구조가 콘텐츠 길이에 따라 유연하게 반응하지 못하기 때문입니다. 목표 디자인에서는 이 메뉴가 사이드바 하단에 고정되어 있고, 상단의 채팅 목록만 스크롤됩니다.

## 2. 개선 전략 (Improvement Strategy)

`frontend-architect.md`의 원칙에 따라, **shadcn/ui**와 **Tailwind CSS**를 적극적으로 활용하여 문제를 해결합니다. 기존 구조를 최대한 존중하며, 점진적이고 실용적인 방식으로 수정합니다.

*   **전략 1: 스타일링 개선 (Styling Improvement)**
    *   하드코딩된 `border` 클래스를 제거합니다.
    *   대신, `tailwind.config.js`에 정의된 시맨틱 색상(`background`, `muted`, `border`)을 사용하여 각 영역의 배경색을 미묘하게 다르게 설정하여 자연스러운 구분을 유도합니다.
*   **전략 2: 레이아웃 구조 개편 (Layout Restructuring)**
    *   Flexbox 레이아웃을 사용하여 사이드바(`ChatHistory.tsx`) 구조를 재조정합니다.
    *   채팅 목록 영역은 스크롤이 가능하도록 만들고, `Quick Access` 메뉴는 하단에 항상 보이도록 고정합니다.

## 3. 세부 실행 계획 (Detailed Action Plan)

**A. 레이아웃 경계선 제거 및 배경색 적용**

*   **대상 파일**: `apps/gui/src/renderer/components/chat/ChatView.tsx`
*   **작업 내용**: `ChatView.tsx`의 메인 `div`와 각 자식 `div`에 적용된 `border` 관련 클래스를 제거하고, 대신 `bg-background`, `bg-muted` 등의 Tailwind CSS 유틸리티를 사용하여 영역을 구분합니다.

**B. 하단 메뉴 오버플로우 해결**

*   **대상 파일**: `apps/gui/src/renderer/components/chat/ChatHistory.tsx`
*   **작업 내용**: `ChatHistory.tsx`의 루트 `div`를 `flex flex-col`로 만들고, 채팅 목록은 `flex-1 overflow-y-auto`로 설정하여 스크롤되게 합니다. `Quick Access` 메뉴는 그 아래에 배치하여 하단에 고정시킵니다.

## 4. 예상 결과 (Expected Outcome)

*   UI에서 거친 검은색 경계선이 사라지고, 목표 디자인(`chat.png`)처럼 부드러운 배경색 차이로 각 영역이 구분됩니다.
*   왼쪽 사이드바의 `Quick Access` 메뉴는 창 크기와 상관없이 항상 하단에 표시되며, 채팅 목록이 길어지면 목록 부분만 독립적으로 스크롤됩니다.
*   전체적으로 더 깔끔하고 현대적인 `shadcn/ui` 스타일의 UI가 완성됩니다.

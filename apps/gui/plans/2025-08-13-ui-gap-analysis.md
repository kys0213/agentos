# AgentOS GUI — Mock vs Dev Gap Analysis & Execution Plan

Source mock: https://party-mind-53553550.figma.site/
Dev URL: http://localhost:5173/

## Differences Summary

- Typography: body 14px (mock) vs 16px (dev); h1/h2 ~15.75px vs 18px; inputs/buttons ~12.25px vs 14px; mock uses OKLCH tokens; dev renders RGB defaults.
- Left sidebar structure: missing "Archived (0)" filter; missing "📌 Pinned" and "Older" groups; no conversation cards; dev shows generic empty state only.
- Conversation card (mocked): avatar, title, overflow menu, preview line, agent badge, unread count, timestamp — not implemented in dev.
- Agent status panel: counts/icons exist but typography and spacing differ (driven by base 16px); verify icon sizes and gaps.
- Thread header: mock shows active agent chips (e.g., "Research Assistant, Code Assistant"); dev shows plain "No active agents" text.
- Available Agents: mock shows list rows with avatar + status pill; dev shows only "0 mentionable".
- Transcript styling: mock has message bubbles with avatar, role label, timestamp; dev shows none (empty).
- Composer: sizing/spacing differ due to base font; verify placeholder text, mention button icon size, disabled "Send" state.
- Debug UI: dev includes TanStack Query DevTools floating button; not present in mock — hide in production mode.
- Spacing/radius/elevation: mock appears to use tighter 8px grid, subtle borders, consistent radii; dev likely defaults differ.

---

## Requirements

### 성공 조건

- [ ] Base typography matches mock tokens: body 14px; h1/h2 ~15.75px/600; inputs/buttons ~12.25px/500; colors via design OKLCH tokens.
- [ ] Left sidebar includes: "Archived (n)" filter, "📌 Pinned" and "Older" sections, search with leading icon and correct spacing.
- [ ] Conversation card implemented with: avatar, title, overflow button, last message preview, agent badge, unread count, timestamp; hover + active states.
- [ ] Thread header shows active agent chips (token-style) when agents active; empty state text matches mock.
- [ ] Available Agents renders list rows with avatar, name, status pill (Active/Idle/Off), count label ("n mentionable").
- [ ] Transcript bubble styles match: avatar, role label, timestamp alignment, spacing between messages.
- [ ] Composer matches: placeholder text, mention button with icon, disabled "Send" style, spacing.
- [ ] Debug UI (TanStack Query DevTools button) hidden by default (non-dev builds); dev-only behind env flag.
- [ ] Spacing/radius/elevation follow mock: 8px grid, surface borders, consistent radii on cards/inputs.
- [ ] All new code passes `pnpm test` and `pnpm format`.

### 사용 시나리오

- [ ] 사용자는 사이드바의 검색/필터(Archived)를 활용해 대화를 탐색하고, Pinned/Older 그룹에서 대화를 선택한다.
- [ ] 스레드 헤더에서 활성 에이전트 칩을 확인하고, 필요 시 "Manage Agents"로 이동한다.
- [ ] 에이전트 리스트에서 상태를 확인(Active/Idle/Off)하고 @멘션을 통해 대화에 참여시킨다.
- [ ] 메시지 타임라인은 역할/아바타/타임스탬프가 명확히 보이며, 입력창/버튼은 디자인과 동일한 마감으로 표시된다.

### 제약 조건

- [ ] 타입 안전성: any 금지, 구체 타입/제네릭/타입가드 사용.
- [ ] Frontend Architect 가이드 및 ROADMAP 정렬; 기존 설계 우선.
- [ ] 데이터가 비어 있어도 디자인 일치하는 Empty state 제공(목업 데이터는 스토리/fixture로 제한).
- [ ] 환경 분리: dev 전용 UI/도구는 프로덕션 빌드에서 숨김.

## Interface Sketch

```typescript
// Design tokens (theme)
export type TypographyScale = {
  body: { size: 14; line: 20 };
  h2: { size: 15.75; line: 24.5; weight: 600 };
  h5: { size: 10.5; line: 14; weight: 500 };
  control: { size: 12.25; line: 17.5; weight: 500 };
};

export type ConversationId = string;

export interface ConversationListItem {
  id: ConversationId;
  title: string;
  lastMessage: string;
  agentLabel: string; // e.g., "Code Assistant"
  unreadCount: number;
  timestamp: string; // localized short time
  pinned: boolean;
}

export interface AgentMeta {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'off';
  avatarUrl?: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'agent';
  agentName?: string;
  content: string;
  timestamp: string;
}

// UI state for filters
export interface SidebarState {
  search: string;
  showArchived: boolean;
}
```

## Todo

- [x] Typography/base tokens: set body 14px, h2/h5/control sizes; adopt OKLCH color tokens.
- [ ] Input/button sizing: align line-heights, paddings, radii to mock.
- [x] Sidebar: add "Archived (n)" filter pill; section headers (📌 Pinned, Older).
- [x] Conversation cards: implement cell layout (avatar/title/menu/preview/badges/timestamp) + hover/active.
- [ ] Empty states: design-matching placeholders for no conversations/agents.
- [x] Thread header: render active agent chips; fallback text for none.
- [ ] Available Agents: list rows with status pill + count summary.
- [ ] Transcript bubbles: avatar, role label, timestamp alignment and spacing.
- [ ] Composer: mention button/icon size, disabled Send state style.
- [x] Debug UI gating: hide TanStack button unless `VITE_DEVTOOLS=true`.
- [ ] Tests: visual contract via component tests (DOM structure, classnames), unit tests for state (pinned/grouping/archived).
- [ ] Docs: update apps/gui/docs/FRONTEND_IMPLEMENTATION_ROADMAP.md with checkboxes.

## 작업 순서

1. Design tokens 적용: base font-size 14px, heading/control scales, color tokens (완료 조건: global CSS/tailwind config 반영, 주요 헤더/버튼 크기 일치).
2. Sidebar 구조 구현: Archived 필터, Pinned/Older 섹션, Empty state (완료 조건: DOM 구조/접근성 역할/텍스트 매칭).
3. Conversation card 컴포넌트: 레이아웃/상태/인터랙션 (완료 조건: 목록 렌더링/hover/active/뱃지 표시).
4. Thread header & Agents: 활성 에이전트 칩, Available Agents 리스트/상태 pill (완료 조건: 칩/리스트 렌더링 및 비활성 시 대체 텍스트).
5. Transcript & Composer 마감: 버블/아바타/타임스탬프/입력창/버튼 상태 (완료 조건: 스타일/간격/비활성 스타일 일치).
6. Debug gating/테스트/문서: 환경 플래그로 devtools 숨김, 테스트 통과, 로드맵 업데이트 (완료 조건: `pnpm test`/`pnpm format` 성공).

## Notes

- 실데이터가 없는 상태를 고려해 Story/fixture로 시각 검증(로컬)합니다. 실제 데이터 연동은 별도 PR에서 진행합니다.
- 코드 변경은 TODO 단위로 커밋하고, PR로 리뷰/머지합니다.

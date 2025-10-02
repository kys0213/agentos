# Frontend Architecture Notes (2025-10)

## Updated Hooks

- `useAppData`: React Query 기반으로 에이전트 목록을 `['agents']` 캐시에 저장합니다.
  - `mentionableAgents`/`activeAgents` 파생 데이터가 함께 제공되며, SubAgent/Chat/Dashboard가 동일한 데이터를 공유합니다.
  - 에이전트 상태 변경이나 신규 생성 후에는 `invalidateAgentQueries()`를 통해 `['agents']`, `['chat','mentionableAgents']`, `['chat','activeAgents']`가 모두 새로고침됩니다.

- `useChatState` + `ChatViewContainer`:
  - mentionable/active 목록은 `useAppData` 캐시와 동일한 값을 사용하여 멘션 목록이 즉시 반영됩니다.
  - 세션 ID는 `sessionIdMapRef`로 관리하며, 멘션 포함 메시지를 보낼 때 `mentionedAgentIds`를 전달합니다.

## Dashboard UI

- `AgentActivityCard`는 mentionable/active 데이터를 사용해 상태 배지, idle/inactive 카운트를 시각화합니다.
- Quick Actions는 첫 번째 active agent를 우선으로 선택하며, 빈 상태에서는 대시보드/Agent Manager로 이동하도록 안내합니다.

## QA Checklist (Playwright E2E)

- `apps/gui/e2e/`에 `dashboard`, `chat`, `mcp-verify`, `subagent-create-flow` 등 핵심 시나리오가 정리돼 있으며, 디자인과의 UI 드리프트를 캡처합니다.
- 실행 예시:
  ```bash
  pnpm --filter @agentos/apps-gui test:e2e --reporter=list
  ```
- 주요 비교 포인트:
  - Dashboard 메트릭 + Agent Activity 카드 구성
  - Chat 멘션 가능한 에이전트 목록 및 메시지 플로우
  - SubAgent/MCP/Tool Builder EmptyState 문구 및 스타일

이 문서는 디자인/샌드박스와 실제 renderer가 일치하는지 빠르게 교차 검증하기 위한 안내입니다.

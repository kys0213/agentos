# GUI Design V2 Alignment Plan

Status: In Progress
Last Updated: 2025-09-23

## Context

- 최신 디자인 시안(Figma: https://party-mind-53553550.figma.site/)과 디자인 샌드박스(`design/` 디렉터리)가 `apps/gui/src/renderer` 구현과 일부 괴리를 보이고 있다.
- `design/` 프로젝트는 새로운 Sidebar/Chat/Dashboard/Manager 흐름을 mock 데이터로 완성해 두었고, 기존 renderer는 일부만 반영하거나 ServiceContainer 연동이 빠져 있다.
- 목표: Figma → `design/` → 실제 GUI renderer 간 인터랙션·레이아웃·상태 흐름을 일치시키고, 문서/QA까지 마무리한다.

## Requirements (Success Criteria)

- [ ] http://localhost:5173 의 주요 화면(Dashboard, Chat, Agent/Model/Tool Managers, Settings)이 Figma 시안과 시각/UX적으로 일치한다.
- [ ] Navigator/Sidebar/Creation 플로우가 디자인 앱(`design/App.tsx`)과 동일하게 동작한다 (chat ↔ management 뷰 전환, 생성 모드, EmptyState 등).
- [ ] Chat 인터페이스가 디자인 UI의 상태 관리(최소화, 채팅창 전환, Mentionable/Active agents 표시)를 유지하면서 실제 ServiceContainer 데이터를 사용한다.
- [ ] Dashboard 요약 카드, Recent Activity, Quick Actions, System Health 섹션이 디자인 기준과 동일한 정보 구조·스타일로 제공된다.
- [ ] 다크 모드와 상태 배지/토큰이 디자인 토큰(`design/styles/index.css`)과 renderer `globals.css` 간에 완전히 동기화된다.
- [ ] 주요 상호작용(E2E 흐름: 에이전트 생성/모델 전환/툴 생성)과 문서(`docs/frontend/` 하위)가 새 UX를 반영한다.

## Observations (Design vs Renderer)

- **앱 전환 플로우**: 디자인 `useAppNavigation`은 MCP/Agent/Custom Tool 생성 시작/종료 핸들러를 모두 제공하지만, renderer 버전은 `handleStartCreateMCPTool`이 누락되어 있고 detail view 전환 사용성도 다소 다르다.
- **Dashboard**: 디자인 버전은 stats + recent activity + quick actions + system state 카드를 통합하며, renderer도 동일 섹션 구조/테마 토큰을 적용했다. Quick Actions는 ServiceContainer 기반으로 동작하고 최근 활동 섹션은 에이전트/프리셋/MCP 로그를 집계하도록 개선되었다. **Core agent/preset 이벤트 스트림을 renderer에 노출하여 대시보드 통계·활동 쿼리가 실시간 무효화되도록 정비 완료.**
- **Chat 경험**: 디자인은 `ChatInterface` 오버레이 + minimized chat 리스트 + typing indicator 등을 구현했고, renderer는 ServiceContainer 연동만 되어 있을 뿐 UI/Copy가 Figma 최신안보다 단순하다.
- **SubAgent Empty State**: 디자인은 최초 에이전트가 없을 때 EmptyState 카드로 onboarding을 안내한다. renderer는 `showEmptyState` flag는 있으나 UX copy/CTA가 다르고 빈 상태 진입 경로도 상이하다.
- **Theme/토큰**: 대부분 반영됐지만, 디자인 기준의 status 색/quick action 색상 등 일부 토큰이 renderer에 빠져 있다. Chakra UI 잔존 컴포넌트가 아직 있어서 완전한 토큰 통일이 필요하다.
- **Misc. hooks**: 디자인 `useAppData`는 preset 생성/삭제, mock analytics 등을 포함하지만 renderer는 preset 관련 훅을 React Query로 넘겨둔 상태여서 대시보드/quick action과 연결이 끊겨 있다.

## TODO

### 1. 레이아웃 & 네비게이션 동기화

- [ ] `apps/gui/src/renderer/App`/`ManagementView`를 `design/App.tsx` 최신 흐름과 diff → 에이전트/툴 생성 진입·복귀 핸들러 반영 _(WIP — MCP 툴 생성 플로우 반영 완료, 대시보드/세부 QA 잔여)_
- [x] `useAppNavigation`에 `handleStartCreateMCPTool` 등 누락된 액션 추가, detail view 판별 로직 정리
- [ ] Sidebar 메뉴/아이콘/토글 UX가 Figma & 디자인 버전과 일치하도록 QA

### 2. Dashboard 리뉴얼

- [x] 디자인 `Dashboard` 구성(stats/quick actions/system status) → renderer `Dashboard` 계층 구조로 이식 _(metric/theme 토큰 반영, 카드/액션/상태 섹션 정렬)_
- [x] ServiceContainer(agents, mcp, preset) 데이터와 Quick Actions 연결 (ex. 새 채팅/Agent 생성/Tool Manager 바로가기) _(Dashboard가 실제 preset 목록/로드 상태를 사용하도록 갱신 — 퀵 액션 CTA와 이벤트가 실데이터 기준으로 동작)_
- [x] Recent activity/metrics는 당장 mock 데이터를 사용하되, Core 이벤트 연동 위한 인터페이스 설계 _(Agent/Preset/MCP usage 로그 기반 초깃값 집계 완료 — **Core metadata/preset 스트림으로 대시보드 쿼리 실시간 무효화 연동 완료**)_
- [x] MCP Tool/usage 업데이트도 Core 스트림 기반으로 통합하여 `emitMcpToolsRefresh` 등 renderer 전용 이벤트를 제거하고 대시보드/툴 매니저 무효화 흐름을 일원화

### 3. Chat 경험 업그레이드

- [x] 디자인 `ChatInterface` UX(typing indicator, copy/good/bad feedback, minimized chats)와 renderer `ChatInterface` diff 분석 후 반영
- [x] Mentionable/Active agent 캐러셀 및 status 배지 표현을 최신 시안과 맞춤
- [x] EmptyState copy/CTA를 디자인 버전으로 업데이트하고, 첫 에이전트 생성에서 SubAgentManager로 자연스럽게 전환

### 4. Manager 뷰 정렬

- [ ] SubAgentManager/ModelManager/MCPToolsManager UI 컴포넌트가 디자인 버전과 같이 카드형 정보/상태 퍼널을 보여주도록 수정
- [ ] 디자인의 AgentPresets/MCP Tool 생성 폼 UX를 renderer의 ServiceContainer 연동과 병합 _(agents/tools/tool builder 생성 버튼은 현재 통일된 모달/패널 UX로 동작함 — 상세 콘텐츠만 리뉴얼 필요)_
- [ ] `design/components/StepperTabs.tsx`를 renderer 공용 컴포넌트로 이식하고 API 문서화 (완료 시 useAppNavigation 등과 연동 테스트)
- [ ] SubAgent 생성 플로우 StepperTabs 전환
  - [ ] StepperTabs/StepperTabContent 도입 및 단계별 검증 hooks 정리
  - [ ] SubAgentManager 카운터/카드 레이아웃을 디자인과 맞춤
  - [ ] `useAppNavigation` 연동 및 생성 플로우 QA 업데이트
- [ ] MCP Tool 생성 플로우 StepperTabs 전환
  - [ ] MCPToolCreate 레이아웃/검증 StepperTabs화
  - [ ] MCPToolsManager 카드/통계 레이아웃 맞춤
- [ ] Custom Tool Builder StepperTabs 전환
  - [ ] ToolBuilderCreate 스텝퍼 반영, 테스트 업데이트
  - [ ] ToolBuilder 메인 EmptyState/카드 정리
- [x] MCP Tool Manager가 Core RPC 이벤트(툴 등록/삭제/상태 변경)에 직접 반응하도록 리팩터링하고, 관련 테스트를 async stream 기반으로 갱신
- [ ] Settings/RACP/ToolBuilder 섹션 차이점 파악 후 적용 (design/components/\* 참고)

### 5. Theme & 토큰 정리

- [ ] 디자인 `styles/index.css`와 renderer `styles/globals.css` 비교해 빠진 토큰(status-subtle, quick action 색 등) 보완
- [ ] Chakra UI 잔존 파일(`theme.ts`, 테스트 전용 ChakraProvider) 제거 플랜 수립 및 대체 테스트 작성

### 6. 데이터/상태 연동

- [ ] 디자인 `useAppData`의 preset/agent mock 로직을 기반으로, 실제 ServiceContainer/Federated API에 맞는 어댑터 설계 (preset creation, quick analytics 등)
- [ ] Multi-agent coordinator 결과(mentionable/active)와 대시보드/Chat summary 연결

### 7. QA & 문서화

- [ ] Playwright MCP 시나리오 업데이트: 디자인 Figma 플로우 기준(대시보드 → Chat → Agent 생성 → Tool 관리)
- [ ] `docs/frontend/` 문서(패턴/테스트/roadmap)에 새 UX & Hook 사용법 반영
- [ ] Phase 3/4 계획서에 완료 항목 체크 및 잔여 TODO 이전
- [ ] 린트 경고(중첩 삼항, Select 미사용 import 등)를 정리하고 컴포넌트 구조 개선 가이드 문서화 _(주요 미사용 import·제너릭 경고 제거 완료, ternary/curly 정리는 후속 작업)_

### Branching Strategy

- Epic 브랜치: `epic/gui-design-v2-alignment` (본 계획의 SSOT)
- 각 대단위 Phase(레이아웃/채팅/Manager 정렬/테마·QA 등)는 별도 feature 브랜치에서 작업 후 epic으로 머지
- 하위 작업 시에는 epic 브랜치를 주기적으로 리베이스하여 충돌을 최소화하고, 완료된 Phase마다 계획서 TODO 체크 업데이트

## Work Order (Draft)

1. **분석 & 스펙 정리**: `design/` vs renderer diff 비교, Figma 캡처 스냅샷 수집 → 상세 스펙 문서화 (이 계획서를 기반으로 세부 작업 티켓 분할)
2. **레이아웃 & Navigation**: Sidebar/ManagementView/EmptyState를 먼저 맞춰 전체 UX 뼈대를 통일
3. **Dashboard & Chat**: 핵심 화면부터 디자인화 → Quick Actions & Chat overlay로 사용자 이득
4. **Managers & Settings**: SubAgent/Model/MCP 툴 섹션 리뉴얼
5. **Theme/토큰/QA**: 스타일 잔여 작업, 테스트, 문서화, 최종 플로우 검증

## Verification

- `pnpm --filter @agentos/apps-gui dev` + `pnpm --filter @agentos/apps-gui test -- --runInBand --project {renderer|main}`
- Playwright MCP 시나리오 확장: Dashboard quick actions, multi-agent mention, tool creation 등
- Figma 대비 시각/UX 검토(디자인 팀 리뷰) + 문서/계획서 갱신

## Notes

- `design/` 디렉터리는 UI 레퍼런스이자 컴포넌트/훅 코드 예시로 유지한다. 실제 renderer 반영 시 ServiceContainer/React Query/Hooks와 충돌 없는지 확인 필요.
- 브릿지/멀티 에이전트/대시보드 향상 작업과 병행되므로, 작은 기능 단위 브랜치로 쪼개어 PR 진행할 것.

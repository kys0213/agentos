# Frontend Docs Index

GUI 프런트엔드 문서의 단일 인덱스입니다. 각 문서는 역할 중심으로 유지합니다.

- Code Style: `docs/apps/gui/frontend/code-style.md`
  - 네이밍/구조/포맷 규칙(개발자 가이드)
- Patterns: `docs/apps/gui/frontend/patterns.md`
  - 컨테이너/프리젠테이셔널, React Query 키/무효화, 타입 안전성, Chat 컨테이너 정리 결과
- Testing: `docs/apps/gui/frontend/testing.md`
  - IPC 경계 테스트 전략, Mock 채널, Playwright E2E 시나리오
- Stepper Tabs: `docs/apps/gui/frontend/STEPPER_TABS.md`
  - 생성 플로우에서 공용 StepperTabs/StepperTabContent 컴포넌트 사용하는 방법과 통합 주의사항
- MCP Usage Stream: `docs/apps/gui/frontend/mcp-usage-stream.md`
  - MCP Tools Manager 실시간 스트림 처리, 레거시 이벤트 호환성, 테스트 전략 요약
- Roadmap: `docs/apps/gui/frontend/roadmap.md`
- Architecture Notes: `docs/apps/gui/frontend/architecture-notes.md`
  - 이행 단계(Consolidated Phases A–F) 요약과 남은 작업

## 문서 표준화 추적: `apps/gui/plan/DOCS_AND_PLANS_STANDARDIZATION_PLAN.md`

## Change Checklist (keep docs in sync)

- Does the change affect container/presentational boundaries or props? Update `patterns.md`.
- Did you modify chat flow or data sources? Reflect in `patterns.md` (Chat) and `roadmap.md` (phase status).
- New/changed test approach? Add or adjust guidance in `testing.md` (and recipes if code snippets help).
- Introduced/removed public UI patterns? Ensure `code-style.md` or `patterns.md` captures the rule.

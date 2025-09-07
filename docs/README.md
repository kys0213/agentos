# AgentOS Docs Index

이 문서는 레포 전반의 문서를 한눈에 찾을 수 있도록 구조화한 인덱스입니다. 새 문서를 추가하기 전에 이 인덱스에서 적절한 섹션이 있는지 확인하고, 관련 문서와 교차 링크를 추가하세요.

## Start Here

- README: 레포 철학/방향/구조 요약 (루트 `README.md`)
- Project Direction Review: `docs/00-start-here/PROJECT_DIRECTION_REVIEW.md`
- Roadmap (Draft): `docs/00-start-here/ROADMAP.md`

## Architecture & Specs

- Core Architecture: `docs/packages/core/agent-architecture.md`
- Orchestrator Routing: `docs/packages/core/orchestrator-routing.md`
- Knowledge & Memory: `docs/packages/core/knowledge-design.md`, `docs/packages/core/memory-api.md`, `docs/packages/core/memory-personalized.md`
- MCP Service & Usage: `docs/packages/core/mcp-service-architecture.md`, `docs/packages/core/mcp-usage-layer.md`
- Content Standardization: `docs/packages/core/content-standardization.md`
- LLM Bridge Registry: `docs/packages/core/core-llm-bridge-registry.md`
- IPC/Event Spec: `docs/20-specs/ipc-event-spec.md`
- Tree Shaking Refactor: `docs/packages/core/tree-shaking-refactor.md`

## Collection & Privacy

- Batch Collection Spec (Sidecar/Child/Batch): `docs/20-specs/batch-collection.md`
- 수집 정책/보안/프라이버시(초안 제안): `docs/20-specs/privacy-security.md`

## Developer Guides

- Testing: `docs/30-developer-guides/testing.md`
- TypeScript Typing: `docs/30-developer-guides/typescript-typing-guidelines.md`
- Code Style: `docs/30-developer-guides/code-style.md`
- Complexity Guide: `docs/30-developer-guides/complexity-guide.md`
- Interface Spec: `docs/30-developer-guides/interface-spec.md`
- AI Collaboration Guide: `docs/30-developer-guides/ai-collaboration.md`

## Policies & Process

- Docs & Plan Policy (SSOT/Promotion): `docs/40-process-policy/docs-policy.md`
- Documentation Standards: `docs/40-process-policy/documentation-standards.md`
- Git Workflow: `docs/40-process-policy/git-workflow.md`
- Plan Promotion Guide: `docs/40-process-policy/plan-promotion.md`

## Packages & Apps

- Packages overview: `docs/PACKAGES_INDEX.md`
- Apps
  - GUI: Electron + React (로컬 퍼스트)
  - CLI: 커맨드라인 인터페이스
  - Slack Bot: 서버형 봇
- Packages
  - core: 에이전트/오케스트레이션/메모리/지식 등 핵심 모듈
  - lang: 언어 유틸/타입/도우미

## Templates

- Plan Template: `docs/90-templates/PLAN_TEMPLATE.md`

Notes

- 문서의 단일 출처는 `docs/` 입니다(SSOT). 구현 후에는 `plan/` 문서를 정리하여 `docs/`로 승격하세요.
- 기존 문서를 업데이트하고 교차 링크를 추가해 중복과 스프롤을 최소화하세요.

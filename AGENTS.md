# AGENTS Guide

Welcome to the AgentOS repository. This file summarizes key resources and commands.

## 🔒 Git Workflow — Mandatory

- Always follow the [Git Workflow Guide](docs/40-process-policy/git-workflow.md).
- Create a feature branch before changes: `git checkout main && git pull && git checkout -b feature/<task>`.
- Make TODO-scoped commits with clear messages; no squashing unrelated changes.
- Never merge locally; open a Pull Request and wait for review/merge on GitHub.
- Keep your branch updated via rebase: `git fetch origin && git rebase origin/main`.
- Keep the branch until the PR is merged; do not delete early.

## Table of Contents

1. [Code Style Guide](docs/30-developer-guides/code-style.md)
2. [Interface Specifications](docs/30-developer-guides/interface-spec.md)
3. [Testing Guide](docs/30-developer-guides/testing.md)
4. [Documentation Standards](docs/40-process-policy/documentation-standards.md)
5. [TypeScript Typing Guidelines](docs/30-developer-guides/typescript-typing-guidelines.md)
6. **[Frontend Architect Guide](.claude/agents/frontend-architect.md)** ⭐ **프론트엔드 작업 필수**
7. [AI Collaboration Guide](docs/30-developer-guides/ai-collaboration.md)
8. **[Git Workflow Guide](docs/40-process-policy/git-workflow.md)** - 브랜치 전략 및 TODO별 커밋 필수
9. [Docs & Plan Policy](docs/40-process-policy/docs-policy.md) - 문서/계획서 구조·운영 원칙(SSOT)

## Quick Commands

- Install dependencies: `pnpm install`
- Build all packages: `pnpm build`
- Run tests: `pnpm test`
- Format and fix lint: `pnpm format` (run before committing)
- **GUI 앱 개발**: `cd apps/gui && pnpm run dev` ⭐

Root-level `docs/` contains shared conventions, 철학, 테스트 가이드, Git 워크플로우 등을 관리합니다.

각 패키지(`<apps|packages>/<name>`)는 다음과 같은 문서 구조를 가질 수 있습니다:

- `docs/`: 패키지의 목적, 주요 기능, 사용법을 정리합니다.
- `plan/`: 작업 전에 요구사항을 분석하고 TODO를 정리하는 계획서를 둡니다.
  - 모든 TODO가 완료되면 내용을 정리하여 `docs/`로 이동하고 `plan/`의 해당 파일을 삭제합니다.
  - 새 파일을 추가하기 전에 기존 문서를 검토하여 관련 내용과 잘 통합합니다.

## 🎯 **프론트엔드 작업 가이드라인**

**모든 GUI/프론트엔드 관련 작업 시에는:**

1. **[Frontend Architect](.claude/agents/frontend-architect.md) 에이전트 사용 필수**
2. **[Frontend Implementation Roadmap](apps/gui/docs/FRONTEND_IMPLEMENTATION_ROADMAP.md)** - 전체 계획 및 진행상황 확인
3. **Week 1에서 구축된 현대적 아키텍처 기반으로 점진적 개선**

## 문제 해결 원칙 (Problem-Solving Principles)

1. **단순함 우선(Simple is best)**
   항상 가장 단순한 해결 방안을 먼저 검토합니다.
2. **복잡하면 분할정복**
   복잡도가 높은 문제라면 작업을 세분화하여 해결합니다.

   > 📋 구체적인 판단 기준은 [복잡도 판단 가이드라인](docs/30-developer-guides/complexity-guide.md)을 참고하세요.

3. **계획서 작성 후 코드 작성**
   위 원칙을 토대로 계획서를 먼저 작성한 뒤 컨펌을 받은 다음에 코드를 작성합니다.
4. **Git 브랜치 생성 및 TODO별 커밋 필수**
   - 작업 시작 전 적절한 브랜치 생성 (`feature/ux-command-palette` 등)
   - 각 TODO 완료 시마다 의미있는 커밋 메시지로 커밋
   - 상세 가이드: [Git Workflow Guide](docs/40-process-policy/git-workflow.md)
5. **계획서 필수 항목**
   [템플릿](docs/90-templates/PLAN_TEMPLATE.md)을 참고하여 작성해주세요.
   - **요구사항**: 각 기능이 달성해야 하는 성공 조건과 사용 시나리오까지 명시합니다.
   - **인터페이스 초안**: 주요 타입, 메서드 시그니처 등의 예시를 간략히 적어 둡니다.
   - **Todo 리스트**: 테스트 작성 포함하여 작업을 순서대로 정리합니다. (테스트 규칙은 `docs/30-developer-guides/testing.md` 참고)
   - **작업 순서**: Todo 리스트를 기반으로 단계별 진행 순서를 정리합니다.

## 타입 안전성 원칙 (Type Safety Principles)

코드 작성 시 타입 안전성을 보장하기 위해 다음 원칙을 준수합니다:

1. **any 타입 사용 절대 금지**
   - `any` 대신 `unknown`, 제네릭, Union 타입 사용
   - 타입 가드를 통한 안전한 타입 변환
2. **구체적 타입 정의**
   - 모든 인터페이스와 함수에 명확한 타입 정의
   - API 응답, IPC 통신 등에 구체적 타입 사용
3. **타입 검증**
   - ESLint 규칙으로 any 사용 방지 자동화
   - 코드 리뷰에서 타입 안전성 확인

> 📋 자세한 내용은 [TypeScript 타이핑 지침](docs/30-developer-guides/typescript-typing-guidelines.md)을 참고하세요. 5. **리뷰**
> 작성한 계획서와 진행 상황은 작업 요청마다 리뷰하여 지속적으로 피드백을 반영합니다.

> 🤝 AI 에이전트와의 협력 시에는 [AI 에이전트 협력 가이드라인](docs/30-developer-guides/ai-collaboration.md)을 따라주세요.

4. **작업계획서 Todo 체크**
   작업계획서의 Todo 항목을 하나씩 처리하고 완료된 항목은 체크 표시합니다.

5. **Todo 완료 후 종료**
   모든 Todo가 완료되면 작업을 종료합니다.

## 네이밍 원칙 (Naming Principles)

- **보편적 네이밍 우선**: OSS 기여자가 별도 맥락 없이도 이해 가능한 일반 용어를 사용합니다.
- **모호성 최소화**: 혼동 소지가 있는 명칭은 더 구체적인 용어로 대체합니다. 예) `index` → `indexing`(색인), `search-index`.
- **코드/문서 일관성**: 코드와 문서, 커밋 메시지에서 동일한 용어를 사용하고, 변경 시 즉시 동기화합니다.

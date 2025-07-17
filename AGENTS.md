# AGENTS Guide

Welcome to the AgentOS repository. This file summarizes key resources and commands.

## Table of Contents

1. [Code Style Guide](docs/CODE_STYLE.md)
2. [Interface Specifications](docs/INTERFACE_SPEC.md)
3. [Testing Guide](docs/TESTING.md)
4. [Documentation Standards](docs/DOCUMENTATION_STANDARDS.md)

## Quick Commands

- Install dependencies: `pnpm install`
- Build all packages: `pnpm build`
- Run tests: `pnpm test`

Additional design documents for each package live under `<apps|packages>/<name>/docs`.

## 문제 해결 원칙 (Problem-Solving Principles)

1. **단순함 우선(Simple is best)**
   항상 가장 단순한 해결 방안을 먼저 검토합니다.
2. **복잡하면 분할정복**
   복잡도가 높은 문제라면 작업을 세분화하여 해결합니다.

   > 📋 구체적인 판단 기준은 [복잡도 판단 가이드라인](docs/COMPLEXITY_GUIDE.md)을 참고하세요.

3. **계획서 작성 후 코드 작성**
   위 원칙을 토대로 계획서를 먼저 작성한 뒤 컨펌을 받은 다음에 코드를 작성합니다.
4. **계획서 필수 항목**
   [템플릿](./docs/template/TASK_PLAN_TEMPLATE.md)을 참고하여 작성해주세요.
   - **요구사항**: 각 기능이 달성해야 하는 성공 조건과 사용 시나리오까지 명시합니다.
   - **인터페이스 초안**: 주요 타입, 메서드 시그니처 등의 예시를 간략히 적어 둡니다.
   - **Todo 리스트**: 테스트 작성 포함하여 작업을 순서대로 정리합니다. (테스트 규칙은 `docs/TESTING.md` 참고)
   - **작업 순서**: Todo 리스트를 기반으로 단계별 진행 순서를 정리합니다.
5. **리뷰**
   작성한 계획서와 진행 상황은 작업 요청마다 리뷰하여 지속적으로 피드백을 반영합니다.

   > 🤝 AI 에이전트와의 협력 시에는 [AI 에이전트 협력 가이드라인](docs/AI_COLLABORATION_GUIDE.md)을 따라주세요.

6. **작업계획서 Todo 체크**
   작업계획서의 Todo 항목을 하나씩 처리하고 완료된 항목은 체크 표시합니다.

7. **Todo 완료 후 종료**
   모든 Todo가 완료되면 작업을 종료합니다.

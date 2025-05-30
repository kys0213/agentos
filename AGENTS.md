# AGENTS Guide

Welcome to the AgentOS repository. This file summarizes key resources and commands.

## Table of Contents

1. [Code Style Guide](docs/CODE_STYLE.md)
2. [Interface Specifications](docs/INTERFACE_SPEC.md)
3. [Testing Guide](docs/TESTING.md)

## Quick Commands

- Install dependencies: `pnpm install`
- Build all packages: `pnpm build`
- Run tests: `pnpm test`

## 문제 해결 원칙 (Problem-Solving Principles)

1. **단순함 우선(Simple is best)**  
   항상 가장 단순한 해결 방안을 먼저 검토합니다.
2. **복잡하면 분할정복**  
   복잡도가 높은 문제라면 작업을 세분화하여 해결합니다.
3. **계획서 작성 후 코드 작성**  
   위 원칙을 토대로 계획서를 먼저 작성한 뒤 컨펌을 받은 다음에 코드를 작성합니다.
4. **계획서 필수 항목**
   - **요구사항**: 각 기능이 달성해야 하는 성공 조건과 사용 시나리오까지 명시합니다.
   - **인터페이스 초안**: 주요 타입, 메서드 시그니처 등의 예시를 간략히 적어 둡니다.
   - **Todo 리스트**: 테스트 작성 포함하여 작업을 순서대로 정리합니다. (테스트 규칙은 `docs/TESTING.md` 참고)
   - **작업 순서**: Todo 리스트를 기반으로 단계별 진행 순서를 정리합니다.
5. **정기 리뷰**  
   작성한 계획서와 진행 상황을 일정 주기(예: 매주/격주)로 리뷰하여 지속적으로 피드백을 반영합니다.

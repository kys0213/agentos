# Testing Guide

AgentOS 프로젝트의 테스트 작성 가이드입니다.

## 📚 테스트 타입별 가이드

프로젝트는 계층별로 차별화된 테스트 전략을 적용합니다:

### [Unit Test](./unit-test.md)
- **대상**: `packages/core/src/`, `packages/lang/src/`
- **특징**: 순수함수 테스트, Mock 활용, 100% 커버리지 (코어 모듈)
- **도구**: Vitest, vitest-mock-extended

### [E2E Test](./e2e-test.md)
- **대상**: `apps/gui/e2e/`
- **특징**: Playwright 웹 E2E, 사용자 시나리오 기반
- **도구**: Playwright

### [Electron E2E Test](./electron-e2e-test.md)
- **대상**: `apps/gui/electron-e2e/`
- **특징**: Electron 앱 전용, Main + Renderer + IPC 통합 테스트
- **도구**: Playwright + Electron Harness

### [Fixture & Mock Guide](./fixture-mock.md)
- **대상**: 모든 테스트
- **특징**: Repository Fixture, Service Mock 작성 가이드
- **도구**: vitest-mock-extended, Custom Fixtures

## 🚀 Quick Start

### 테스트 실행

```bash
# 전체 테스트
pnpm test

# 특정 패키지
pnpm --filter @agentos/core test

# 워치 모드
pnpm --filter <package> test -- --watch

# 커버리지
pnpm test --coverage
```

### 테스트 타입 선택

코드 위치에 따라 적절한 테스트 타입을 선택하세요:

| 코드 위치 | 테스트 타입 | 가이드 링크 |
|----------|------------|-----------|
| `packages/core/src/common/*` | Unit (순수함수) | [Unit Test](./unit-test.md) |
| `packages/core/src/*` | Unit (Mock) | [Unit Test](./unit-test.md) |
| `packages/lang/src/*` | Unit | [Unit Test](./unit-test.md) |
| `apps/gui/e2e/*` | Playwright E2E | [E2E Test](./e2e-test.md) |
| `apps/gui/electron-e2e/*` | Electron E2E | [Electron E2E](./electron-e2e-test.md) |
| `apps/*/src/*` | Integration | [Unit Test](./unit-test.md) |

## 📖 관련 문서

- [TypeScript Typing Guidelines](../typescript-typing-guidelines.md)
- [Code Style](../code-style.md)

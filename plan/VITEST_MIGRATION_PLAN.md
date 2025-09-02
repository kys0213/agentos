# Vitest 전환 계획서 (Root Plan)

본 문서는 Jest(ts-jest) 기반 테스트 환경을 Vitest로 전환하기 위한 루트 계획서입니다. 패키지별 설정, CI, 커버리지, 문서 반영까지의 전환 범위와 절차를 정의합니다.

## Requirements

### 성공 조건
- [ ] 모든 패키지(core, lang, cli, gui, agent-slack-bot)의 유닛 테스트가 Vitest에서 통과한다.
- [ ] GUI 테스트는 jsdom(렌더러)와 node(메인) 환경을 파일 경로로 분리하여 동시에 실행 가능하다.
- [ ] 커버리지(text, lcov)가 Vitest(v8)로 생성되고 CI에서 수집된다.
- [ ] Jest/ts-jest 의존성과 jest.config.* 파일을 제거한다(최종 단계).
- [ ] `pnpm -r test`가 Vitest 기반으로 동작한다.

### 사용 시나리오
- [ ] 개발자는 `pnpm -r test`(일회 실행)와 `pnpm -r test:watch`(워치)로 테스트를 실행한다.
- [ ] GUI는 `environmentMatchGlobs`로 `src/renderer/**`는 jsdom, `src/main/**`는 node로 실행된다.
- [ ] 기존 jest.* 호출은 셋업에서 jest→vi 셰임으로 1차 호환, 점진적으로 vi.*로 치환한다.

### 제약 조건
- 타입 안전성/ESLint 규칙 유지(no-explicit-any, no-restricted-syntax 등).
- 테스트 타입체킹 포함(tsconfig에서 __tests__ 제외 금지). 빌드(tsconfig.cjs/es m)는 테스트 제외 유지.
- 대규모 테스트 리라이트 지양. 초기에는 jest-compat 셰임으로 마찰 최소화.

## Interface Sketch

```ts
// 루트 vitest.setup.ts (예시)
import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Jest 호환 최소 셰임
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
};

afterEach(() => {
  vi.clearAllMocks();
});
```

```ts
// apps/gui/vitest.config.ts (예시)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['../../vitest.setup.ts'],
    environment: 'node',
    environmentMatchGlobs: [
      ['src/renderer/**', 'jsdom'],
      ['src/main/**', 'node'],
    ],
    include: [
      'src/**/__tests__/**/*.{test,spec}.ts',
      'src/**/__tests__/**/*.{test,spec}.tsx',
    ],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
});
```

## Todo

- [ ] 루트 devDependencies 추가: `vitest`, `@vitest/coverage-v8`, `@testing-library/jest-dom` (필요 시 `happy-dom`)
- [ ] 루트에 `vitest.setup.ts` 생성(jest→vi 셰임 및 RTL 매처)
- [ ] 패키지별 `vitest.config.ts` 추가
  - [ ] packages/core, packages/lang, apps/cli, apps/agent-slack-bot: node 환경 + 커버리지
  - [ ] apps/gui: jsdom/node 분기 + 커버리지
- [ ] `package.json` 스크립트 병행 추가: `test:vitest`, `test:watch`
- [ ] CI에서 `pnpm -r test:vitest` 검증 후 기본 `test`를 Vitest로 전환
- [ ] Jest/ts-jest, @types/jest 제거 및 `jest.config.*` 삭제(최종 단계)
- [ ] docs/TESTING.md 최종 반영 확인 및 마이그레이션 요약 PR 설명서 보강

## 작업 순서

1. 준비: 루트 셋업/의존성 추가, 패키지별 vitest.config.ts 스캐폴딩
2. 병행: `test:vitest` 스크립트 추가 후 `pnpm -r test:vitest`로 전 패키지 검증
3. 전환: 기본 `test`를 Vitest로 교체, CI 커버리지 업로드 경로 갱신
4. 청소: Jest 관련 의존성/설정 제거, 문서 최종화

## 백아웃 플랜
- 병행 단계에서 `test:jest` 스크립트를 유지하여 문제 시 즉시 롤백 가능
- 패키지 단위 전환이 어려운 경우, 문제가 되는 패키지만 임시 Jest 유지


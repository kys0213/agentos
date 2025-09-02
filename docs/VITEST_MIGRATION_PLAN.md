# Vitest 전환 계획서

본 문서는 모노레포(AgentOS)에서 Jest(ts-jest) 기반 테스트 환경을 Vitest로 전환하기 위한 계획을 정리합니다. 전환은 단계적으로 진행하며, CI/커버리지/환경 차이를 고려한 최소 침습 접근을 원칙으로 합니다.

## Requirements

### 성공 조건
- [ ] 모든 워크스페이스 패키지(core, lang, cli, gui, agent-slack-bot) 유닛 테스트가 Vitest에서 통과한다.
- [ ] GUI 패키지에서 jsdom(렌더러)과 node(메인) 테스트가 공존 가능하다(파일 경로 매칭으로 환경 분리).
- [ ] 커버리지 리포트(text, lcov)가 Vitest(v8)로 생성되고 CI에서 수집된다.
- [ ] ts-jest, jest 의존성을 제거하거나 비활성화한다(최종 단계).
- [ ] 테스트 실행 스크립트(`pnpm -r test`)가 Vitest 기반으로 동작한다.

### 사용 시나리오
- [ ] 로컬 개발자가 `pnpm -r test` 또는 패키지별 `pnpm test`로 Vitest를 실행한다.
- [ ] GUI: `src/renderer/**`는 jsdom, `src/main/**`는 node 환경에서 테스트된다.
- [ ] 기존 Jest API(jest.fn, jest.mock 등) 사용 테스트는 마이그레이션 기간 동안 셋업 파일에서 `jest -> vi` 셰임(shim)으로 호환된다.
- [ ] CI에서 모든 패키지 테스트가 Vitest로 실행되고 커버리지가 업로드된다.

### 제약 조건
- TypeScript 엄격 모드 및 현행 ESLint 규칙(특히 no-explicit-any, no-restricted-syntax)을 유지한다.
- 테스트 타입체킹(테스트 파일 포함)은 유지한다(tsconfig에서 __tests__ 제외 금지).
- 광범위한 테스트 코드 리라이트를 피하고, 우선 jest-compat 셰임으로 전환 마찰을 최소화한다.

## Interface Sketch

```ts
// vitest.setup.ts (루트 예시): Jest 호환 셋업
import { vi, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Jest 전역 API 호환 (최소 셋)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  // 필요 시 확장 가능
};

afterEach(() => {
  vi.clearAllMocks();
});
```

```ts
// packages/core/vitest.config.ts (node 환경)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['../..//vitest.setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
```

```ts
// apps/gui/vitest.config.ts (파일 경로별 환경 분기)
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
```

## Todo

- [ ] 루트 devDependencies: `vitest`, `@vitest/coverage-v8`, `@testing-library/jest-dom`, (필요시) `happy-dom` 또는 jsdom 유지
- [ ] 루트 `vitest.setup.ts` 추가(jest-compat 셰임, RTL 매처 활성화)
- [ ] 각 패키지에 `vitest.config.ts` 생성
  - [ ] packages/core: node 환경, 커버리지 설정
  - [ ] packages/lang: node 환경, 커버리지 설정
  - [ ] apps/cli: node 환경, 커버리지 설정
  - [ ] apps/gui: `environmentMatchGlobs`로 jsdom/node 분기, 커버리지 설정
  - [ ] apps/agent-slack-bot: node 환경, 커버리지 설정
- [ ] package.json 스크립트 변경: `test: vitest --run`, `test:watch: vitest`
- [ ] CI 스크립트 변경: `pnpm -r test`가 Vitest 기반으로 실행되게 수정, 커버리지 수집 경로 업데이트
- [ ] Jest 의존성 제거(ts-jest, jest, @types/jest 등) 및 `jest.config.*` 삭제(마지막 단계)
- [ ] 문서 업데이트: docs/TESTING.md에 Vitest 사용법, 환경 분기 및 jest-compat 셋업 안내 추가

## 작업 순서

1. 준비 단계
   - 루트에 Vitest 의존성 추가 및 `vitest.setup.ts` 작성 (jest-compat 포함)
   - 각 패키지에 `vitest.config.ts` 추가(위 스케치 참고)
2. 병행 실행 단계
   - 패키지별 `package.json`에 `test:vitest` 스크립트 추가
   - 로컬에서 `pnpm -r test:vitest`로 전체 스위트 동작 확인(스냅샷/모킹/타이머 차이점 점검)
   - GUI에서 `environmentMatchGlobs`로 jsdom/node 테스트 동시 검증
3. 전환 단계
   - `package.json`의 기본 `test`를 Vitest로 교체, CI에서 Vitest로 커버리지 업로드
   - 잔여 `jest.*` 직접 호출부를 `vi.*`로 점진 대체(필요 시), Electron/Nest 모킹은 `vi.mock`로 확인
4. 청소 단계
   - ts-jest, jest, @types/jest 제거 및 `jest.config.js` 제거
   - docs/TESTING.md 갱신 및 전환 완료 보고

## 위험 요소 및 대응
- Jest API 차이(jest.mock/spyOn 등): 셋업에서 `globalThis.jest = vi`로 1차 호환, 장기적으로 `vi.*`로 치환
- 타이머·가상 시간: Vitest의 `vi.useFakeTimers`/`vi.setSystemTime` 사용(사용처 점검 필요)
- ESM/CJS 상호 운용: 현행 빌드/경로는 유지, 테스트 실행은 esbuild 변환을 사용하므로 ts-jest 제거 가능
- 스냅샷 경로/포맷: 호환되나, 일부 경로 차이 발생 시 스냅샷 업데이트 필요

## 검증 기준
- `pnpm -r test` 전 패키지 통과(Vitest)
- 커버리지 리포트(text, lcov) 산출 및 CI 수집 성공
- tsconfig 테스트 포함 원칙 유지 및 타입 오류 무(빌드/린트 녹색)

## 백아웃 플랜
- 긴급 시 `test: jest` 스크립트로 롤백 가능(병행 단계에서 유지)
- 문제가 되는 패키지만 임시 Jest 유지 후 점진 전환


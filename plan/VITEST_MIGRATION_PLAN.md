# Vitest 전환 계획서 (Root Plan)

본 문서는 Jest(ts-jest) 기반 테스트 환경을 Vitest로 전환하기 위한 루트 계획서입니다. 패키지별 설정, CI, 커버리지, 문서 반영까지의 전환 범위와 절차를 정의합니다.

## Requirements

### 성공 조건

- [ ] 모든 패키지(core, lang, cli, gui, agent-slack-bot)의 유닛 테스트가 Vitest에서 통과한다.
- [x] GUI 테스트는 jsdom(렌더러)와 node(메인) 환경을 파일 경로로 분리하여 동시에 실행 가능하다.
- [ ] 커버리지(text, lcov)가 Vitest(v8)로 생성되고 CI에서 수집된다.
- [ ] Jest/ts-jest 의존성과 jest.config.\* 파일을 제거한다(최종 단계).
- [ ] `pnpm -r test`가 Vitest 기반으로 동작한다.

### 사용 시나리오

- [x] 개발자는 `pnpm -r test:vitest`로 일회 실행(Non-watch)으로만 테스트를 실행한다. 워치 모드는 금지한다.
- [x] GUI는 `environmentMatchGlobs`로 `src/renderer/**`는 jsdom, `src/main/**`는 node로 실행된다.
- [x] 기존 jest.* 호출은 셋업에서 jest→vi 셰임으로 1차 호환(타이머 포함), 점진적으로 vi.*로 치환한다.

### 제약 조건

- 타입 안전성/ESLint 규칙 유지(no-explicit-any, no-restricted-syntax 등).
- 테스트 타입체킹 포함(tsconfig에서 **tests** 제외 금지). 빌드(tsconfig.cjs/es m)는 테스트 제외 유지.
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
    // 테스트 파일은 *.test.ts(x)만 사용 (spec 금지)
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
});
```

## Todo

- [x] 루트 devDependencies 추가: `vitest`, `@vitest/coverage-v8`, `@testing-library/jest-dom`, `reflect-metadata`
- [x] 루트에 `vitest.setup.ts` 생성(jest→vi 셰임 및 RTL 매처, 타이머 셰임 포함)
- [x] 패키지별 `vitest.config.ts` 추가 및 타임아웃 설정
  - [x] packages/core, packages/lang, apps/cli, apps/agent-slack-bot: node 환경 + 커버리지 + 타임아웃
  - [x] apps/gui: jsdom/node 분기 + 커버리지 + 타임아웃
- [x] `package.json` 스크립트 추가: `test:vitest`(Non-watch). `test:watch` 전면 제거
- [x] CI에 Vitest 잡 추가(`.github/workflows/test-vitest.yml`): `pnpm -r test:vitest` (Non-watch)
- [x] docs/TESTING.md Vitest 기준 업데이트(vi.fn/mock/timers, vitest-mock-extended 권장)
- [x] GUI 패키지 Vitest 호환 수정(vi.mock/vi.fn, DI 주입, reflect-metadata)
- [ ] core 스냅샷 obsolete 정리(`vitest -u`) 및 검증
- [ ] 기본 `test`를 Vitest로 전환 및 Jest/ts-jest, @types/jest 제거 + `jest.config.*` 삭제
- [ ] 커버리지 수집/업로드(텍스트/LCOV) CI 반영

## 작업 순서

1. 준비: 루트 셋업/의존성 추가, 패키지별 vitest.config.ts 스캐폴딩 (완료)
2. 병행: `test:vitest` 스크립트로 전 패키지 Non-watch 검증 + CI 구성 (완료)
3. 스냅샷/호환성 정리: core 스냅샷 업데이트 및 잔여 jest API 치환 (진행)
4. 전환: 기본 `test`를 Vitest로 교체, Jest 관련 의존성/설정 제거, 커버리지 업로드 경로 갱신 (대기)

## 백아웃 플랜

- 병행 단계에서 `test:jest` 스크립트를 유지하여 문제 시 즉시 롤백 가능
- 패키지 단위 전환이 어려운 경우, 문제가 되는 패키지만 임시 Jest 유지

## 현재 상태 요약

- GUI: Vitest 전환 후 전체 녹색(일부 파일은 테스트 없음 허용). Electron/Nest/RPC 테스트 호환성 확보.
- core: 테스트 자체는 대부분 통과하나, 스냅샷 9개 obsolete 표시. 일부 파일은 0 tests로 수집(의도된 skip/케이스 확인 필요).
- CLI/LANG/Slack-bot: Vitest 통과.
- Watch 금지: 모든 스크립트에서 watch 제거. CI는 Non-watch만 실행.

## 다음 작업

1. packages/core 스냅샷 업데이트(`vitest -u`) 및 변경 검토/커밋
2. 기본 `test` 스크립트를 Vitest로 전환 후 Jest 제거(PR 분리 권장)
3. 커버리지(텍스트/LCOV) 업로드를 CI에 연동

# Electron E2E Automation Migration Plan

Status: In Progress
Last Updated: 2025-10-03

## Requirements

### 성공 조건

- [x] Playwright `_electron` API를 사용해 Electron 런타임을 직접 구동하는 E2E 테스트 러너가 준비된다.
- [x] 대표 사용자 플로우(대시보드 진입, Agent/MCP/Tool 생성, Chat 인터랙션)가 **NestJS/MCP 백엔드와 연동된 실제 Electron 앱**에서 자동으로 검증된다.
  - `chat-ux`는 Chat 뷰 진입과 empty state 검증까지 커버하며, 다중 에이전트 세션이 준비되면 Echo 응답 검증으로 확장한다.
- [ ] 관련 문서와 가이드가 Electron 중심 QA 전략으로 갱신된다.

### 사용 시나리오

- [x] 개발자가 `pnpm --filter @agentos/apps-gui test:e2e` 명령으로 **백엔드 서비스 + Electron 앱**을 함께 구동하고 시나리오를 검증한다.
- [x] 실패 시 Playwright 기본 아티팩트(`test-results` 하위 스크린샷/로그)와 콘솔 출력으로 회귀 원인을 추적한다.
- [ ] 자동 테스트 실패 시 MCP 수동 도구를 사용해 동일 플로우를 재현한다.

### 제약 조건

- [ ] 기존 Playwright 브라우저 스위트를 제거하기 전까지 커버리지 공백이 없어야 한다.
- [ ] Electron 기반 테스트는 OS별 차이를 고려해 크로스 플랫폼(맥/윈도우/리눅스)에서 동작해야 한다.
- [ ] 테스트 프레임워크 변경이 다른 패키지의 빌드/테스트 파이프라인을 깨지 않도록 한다.

## Interface Sketch

```typescript
// apps/gui/electron-e2e/runner/electronHarness.ts
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'node:path';

export interface ElectronHarness {
  app: ElectronApplication;
  window: Page;
}

export async function launchElectronHarness(): Promise<ElectronHarness> {
  const app = await electron.launch({
    args: [path.resolve(__dirname, '../../dist/main/main.js')],
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'test',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      ELECTRON_TEST_PROFILE: process.env.ELECTRON_TEST_PROFILE,
    },
    timeout: 60_000,
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  await window.waitForFunction(() => document.body.dataset.appReady === 'true');

  return { app, window };
}

// apps/gui/electron-e2e/tests/dashboard.smoke.e2e.spec.ts
import { afterAll, beforeAll, expect, test } from '@playwright/test';
import { launchElectronHarness, ElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

let harness: ElectronHarness;

test.describe('Electron Dashboard Smoke', () => {
  test.beforeAll(async () => {
    harness = await launchElectronHarness();
  });

  test.afterAll(async () => {
    await harness.app.close();
  });

  test('대시보드 네비게이션이 노출된다', async () => {
    await openManagementView(harness.window);
    await expect(harness.window.getByTestId('nav-dashboard')).toBeVisible();
  });
});
```

> `electronHarness`는 Playwright `_electron` API로 앱을 기동하고, `document.body.dataset.appReady` 마커를 통해 렌더러 초기화 완료를 기다린 뒤 테스트 페이지 객체를 노출한다.

## Current Coverage Snapshot

- 기존 Playwright 자산: `web-gui-basic`, `chat-ux`, `subagent-create-flow`, `mcp-verify` 4개 플로우 + `utils/navigation.ts` 공용 헬퍼.
- 공통 패턴: `page.goto('/')` → CTA 탐색 → 대시보드/서브 에이전트/채팅 탭 전환 → 폼 입력.
- Electron 환경 전환 시 요구되는 추가 고려 사항:
  - 개발 서버가 아닌 빌드 산출물(`dist/main/main.js`, `dist/renderer/index.html`)을 사용해야 하므로 테스트 전 빌드 단계가 필요하다.
  - 창 생성이 비동기로 이뤄져 초기 로딩 시그널 확보가 필수다.
  - 테스트 중 생성되는 설정/스토리지 파일을 격리하여 반복 실행 시 상태 누적을 방지해야 한다.
  - 1차 마이그레이션 범위는 macOS 개발 환경 기준으로 검증하고, 타 OS 지원은 후속 Todo로 분리한다.

- [x] **실행기 선택 및 기록**: Electron 공식 가이드에 소개된 WebDriver, Playwright, 커스텀 드라이버 옵션을 비교 표로 정리하고 `apps/gui/docs/e2e-electron-decision.md`에 결정 및 리스크를 기록.
- [x] **Playwright Electron 환경 구성**: `_electron` 런처 유틸, `playwright.config.ts`, `electronHarness`, `openManagementView` 등 공용 유틸을 정비하고 샘플 테스트를 통과시켰다.
- [x] **번들 준비/프로필 관리 스크립트**: `scripts/run-electron-e2e.mjs`로 `tsc` → `vite build` → `scripts/seed-backend.mjs` → Playwright 실행 순서를 자동화하고 `ELECTRON_TEST_PROFILE` temp 디렉터리를 종료 시 정리한다 (`PRESERVE_E2E_PROFILE=true` 시 보존).
- [x] **백엔드 오케스트레이션/시드**: `scripts/seed-backend.mjs`에서 LLM 브릿지, MCP 툴, 기본 프리셋, 기본 에이전트를 파일 기반 레지스트리에 시드한다.
- [x] **기존 시나리오 포팅**: `web-gui-basic`, `chat-ux`, `subagent-create-flow`, `mcp-verify`를 Electron 환경으로 이전하고 반복 실행 안정화를 위한 data-testid/헬퍼를 정리했다.
- [ ] **Chat Echo 확장**: 에이전트 세션/브릿지 준비가 완료되면 `chat-ux`에 실제 Echo 응답 검증을 추가한다.
- [ ] **문서 업데이트**: `apps/gui/docs/frontend/testing.md`, 본 계획서, `FRONTEND_IMPLEMENTATION_ROADMAP` 등 문서를 Electron 러너 기준으로 마무리한다.
- [ ] **Windows/Linux 호환성**: Playwright `_electron` 스택의 타 OS 검증 및 CI 전략을 정의한다.

> 모든 Todo 완료 시 기존 `apps/gui/e2e` 디렉터리는 Electron 버전으로 대체하거나 보관 목적의 README와 함께 deprecated 상태로 명시한다.

## 작업 순서

1. **프레임워크 조사 & 결정**: 실행기 비교 문서 작성, Playwright 채택 근거 정리.
2. **런타임 부트스트랩 구축**: macOS 빌드/프로필 스크립트와 Playwright `_electron` 런처 유틸을 마련해 샘플 테스트 1건 성공.
3. **공용 유틸 이식**: Playwright 기반 `openManagementView` 등 공유 헬퍼 포팅 및 반복 실행 안정성 확보.
4. **시나리오 포팅**: web-gui-basic, chat-ux, subagent-create, mcp-verify 플로우를 Playwright Electron 환경으로 재작성.
5. **백엔드 오케스트레이션**: NestJS/MCP 서비스를 자동 기동/종료하고 테스트 데이터 시딩을 포함한 전체 스택 실행 흐름을 확립.
6. **아티팩트 & 스크립트 정비**: Playwright 스크린샷/로그 수집 경로 설정, `pnpm test:e2e`/`test:ci` 스크립트 개편, 브라우저 모드 임시 명령 커뮤니케이션.
7. **테스트 환경 가드 & 문서화**: Playwright 구성 정리, `process.env.CI` 가드 적용, 관련 문서/로드맵 업데이트.

## Notes

- 디자인 시안(Figma)과 `apps/gui/design/` 샌드박스는 UI/UX의 단일 SSOT로 유지하며, Electron E2E 시나리오도 해당 참조에 맞춰 검증 항목을 정의한다.
- Electron 공식 문서([Automated Testing](https://www.electronjs.org/docs/latest/tutorial/automated-testing))는 WebDriver 계열, Playwright, 커스텀 드라이버 3축으로 E2E 전략을 제시한다. 본 계획은 Playwright의 `_electron` 지원을 주 실행기로 채택하되, 실험적 표기와 장기 지원 리스크를 비교 문서에 기록하고 보조 실행기(예: WebDriver) 검토 내역을 남긴다.
- Playwright Electron 실행은 앱 번들 경로 지정이 중요하므로, `electron-builder` 산출물을 직접 지정할지 혹은 개발 번들을 쓰는지 결정 후 macOS 개발 환경 기준 경로부터 확정하고, 타 OS 경로는 후속 스프린트에서 확장한다.
- 기본 `pnpm test:e2e` 명령이 Electron Playwright를 실행하도록 전환하되, 브라우저 기반 Playwright 명령(`test:e2e:browser`)은 비교/백업 용도로 한시 유지하고 제거 일정을 QA/문서에 명시한다.
- 실행기 결정 및 리스크/백업 전략은 `apps/gui/docs/e2e-electron-decision.md`에서 SSOT로 관리한다.
- 백엔드 서비스 기동/종료, 시드 데이터 로딩이 E2E의 필수 구성 요소이며, Mock 모드는 UI-only 진단용 보조 경로로 문서화한다.

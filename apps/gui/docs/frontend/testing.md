# GUI Testing Guide (IPC + Mock)

Canonical location. Index: `apps/gui/docs/frontend/README.md`

본 문서는 GUI 테스트에서 IPC 경계를 다루고, MockIpcChannel을 통해 결정적 테스트를 구성하는 방법을 안내합니다.

## IpcChannel 주입

렌더러 계층은 `IpcChannel` 인터페이스로 환경과 독립적으로 동작합니다. 테스트에서는 `MockIpcChannel`을 주입하여 외부 의존성 없이 시나리오를 구성합니다.

```ts
import { MockIpcChannel } from '@/renderer/services/ipc/MockIpcChannel';
import { bootstrap } from '@/renderer/bootstrap';

const channel = new MockIpcChannel();
const services = bootstrap(channel);
```

## 시드 유틸리티

간단한 시뮬레이션을 돕기 위해 최소 시드 유틸이 제공됩니다.

```ts
import { MockIpcChannel, MockIpcUtils } from '@/renderer/services/ipc/MockIpcChannel';

const channel = new MockIpcChannel();
await MockIpcUtils.addBridge(channel, { name: 'mock-bridge' } as any);
```

추가적인 시드/조회 유틸은 후속 작업에서 보강될 예정입니다.

## 서비스 계층 테스트

서비스는 모두 동일한 `IpcChannel`을 주입받으므로, Mock을 통한 결정적 테스트가 가능합니다.

```ts
import { Services } from '@/renderer/bootstrap';

const agents = await Services.getAgent().getAllAgents();
await Services.getMcp().connectMcp({ name: 'mcp-x', type: 'streamableHttp' } as any);
const usageLogs = await Services.getMcpUsageLog().getAllUsageLogs();
```

## 타입 체크 및 실행

```bash
pnpm -r typecheck
# 필요 시 특정 앱만
pnpm --filter @agentos/apps-gui typecheck
```

테스트 프레임워크(Jest/Vitest)를 사용하는 경우, 각 테스트에서 `bootstrap(new MockIpcChannel())`으로 독립 컨테이너를 구성하세요.

## Renderer 커버리지 가이드라인

- **커버리지 목표**
  - Line ≥ 70%, Branch ≥ 55% (`pnpm --filter @agentos/apps-gui test -- --coverage`로 측정)
  - 이벤트 기반 UI(스트림/소켓 등)는 Line 80% 이상을 권장
- **필수 시나리오**
  1. 데이터 요청 흐름: Dashboard, Agent Wizard 등 주요 패널의 로딩/성공/에러 상태
  2. 이벤트 스트림: MCP Tools Manager `usage.events`, SubAgent 실시간 상태 반영
  3. IPC 오류 처리: ServiceContainer 의존성이 비어 있을 때의 폴백 UI
  4. 사용성 검증: 등록/생성 다이얼로그가 유효성 검사와 캐시 무효화를 수행하는지 확인
- **운영 원칙**
  - 새 UI 도입 시 위 4개 축 가운데 최소 1개 이상을 커버하는 테스트를 작성합니다.
  - `MockRpcTransport`/`McpUsageRpcService` 등 공용 목 더블을 재사용해 결정적 시나리오를 구성합니다.
  - 커버리지 리포트는 CI에서 참조하되, 로컬에서는 변경된 워크스페이스에 집중합니다 (`pnpm test --filter renderer -- --runInBand --coverage`).

---

## Playwright 기반 Electron E2E

- 위치: `apps/gui/electron-e2e/`
- 런처: Playwright `_electron` API (`runner/electronHarness.ts`)
- 역할: 시각적 회귀와 핵심 사용자 플로우(대시보드, Chat, Agent/MCP/Tool 생성)를 Electron 런타임에서 자동 검증
- 결정 근거: `apps/gui/docs/e2e-electron-decision.md` 참고 (Playwright 인터페이스 재사용, UI 시나리오 이식 용이성)
- 실행 명령
  - 로컬 기본: `pnpm --filter @agentos/apps-gui test:e2e`
    - 내부적으로 `scripts/run-electron-e2e.mjs`가 실행되어 `tsc` → `vite build` → `dist/main/__tests__/seed-backend.cli.js`(TS 원본: `src/main/__tests__/seed-backend.cli.ts`) → Playwright `_electron` 테스트를 순차 수행한다.
    - `src/main/__tests__/seed-backend.ts`는 시드 로직을 제공하며, CLI 래퍼(`seed-backend.cli.ts`)가 테스트용 사용자 데이터 디렉터리에 다음 자산을 시드한다.
      - LLM 브릿지: `e2e-llm-bridge` (manifest 등록 + 활성화)
      - MCP 툴: `mcp_e2e_search_tool`
      - 프리셋: `preset-e2e-default.json` (브릿지/툴 선선택, 시스템 프롬프트 기본값 포함)
      - 에이전트 메타데이터: `agent-e2e-default.json` (Active 상태) — Chat 뷰에서 “No agents available” 시나리오 대신 기본 상담 에이전트를 제공
    - 실행 완료 후 `ELECTRON_TEST_PROFILE` 임시 디렉터리는 기본적으로 삭제된다. 디버깅을 위해 `PRESERVE_E2E_PROFILE=true` 환경 변수를 설정하면 시드된 데이터를 유지할 수 있다.
  - 브라우저 비교용 임시 명령: `pnpm --filter @agentos/apps-gui test:e2e:browser`
- 테스트 구조
  - `tests/*.e2e.spec.ts` 또는 `tests/*.e2e.test.ts`: Playwright `test(...)` 기반 시나리오 (권장 파일명 규칙: `*.e2e.spec.ts`)
  - `support/`: `openManagementView` 등 공용 유틸과 콘솔/로그 캡처 도우미
  - `runner/electronHarness.ts`: Electron 앱 생성, 첫 윈도우 확보, `document.body.dataset.appReady` 체크
- 요구 환경
  - macOS 기준으로 `pnpm --filter @agentos/apps-gui run build:dev` 단계가 `run-electron-e2e.mjs`에서 자동 호출된다. 개별 빌드를 미리 수행할 필요는 없다.
  - 테스트 실행 시 `ELECTRON_TEST_PROFILE`이 임시 디렉터리로 설정되어 사용자 데이터가 격리된다.
  - 백엔드 NestJS/MCP 서비스는 Electron 메인 프로세스 초기화(`bootstrapIpcMainProcess`) 과정에서 자동 기동된다. 추가 Mock 모드는 UI-only 진단용으로 유지한다.
- 실패 아티팩트
  - 스크린샷: `electron-e2e/artifacts/screenshots`
  - 콘솔 로그/트레이스: `electron-e2e/artifacts/logs`
- CI 모드(`process.env.CI === 'true'`)에서는 `*.e2e.spec.ts`/`*.e2e.test.ts` 파일이 자동 제외되며, `pnpm --filter @agentos/apps-gui test:ci` 명령으로 Vitest 스위트만 실행합니다.
- 새 시나리오 작성 절차
  1. `electron-e2e/tests/`에 `{feature}.e2e.spec.ts` 파일 생성
  2. `launchElectronHarness()`로 앱 기동 → `openManagementView` 등 support 유틸 사용
  3. 필요한 경우 `harness.window.on('console', ...)`으로 오류 수집
  4. 테스트 종료 시 `harness.app.close()` 호출
  5. 반복 실행 안정성(랜덤 이름 등)을 위해 헬퍼/시드 유틸을 재사용

## Playwright MCP 도구 (Manual QA)

- Model Context Protocol 기반 도구로, 브라우저를 직접 제어하며 수동 QA/디버깅에 활용합니다.
- 실행 예시:
  ```bash
  npx -y @playwright/mcp@latest
  ```
- 제공 기능: `browser_click`, `browser_close`, `browser_console_messages`, `browser_drag`, `browser_evaluate`,
  `browser_file_upload`, `browser_fill_form`, `browser_handle_dialog`, `browser_hover`, `browser_install`,
  `browser_navigate`, `browser_navigate_back`, `browser_network_requests`, `browser_press_key`,
  `browser_resize`, `browser_select_option`, `browser_snapshot`, `browser_tabs`, `browser_take_screenshot`,
  `browser_type`, `browser_wait_for`
- Electron Playwright E2E 테스트가 통과한 뒤 시각적 점검이나 상호작용 재현이 필요할 때 선택적으로 사용합니다.

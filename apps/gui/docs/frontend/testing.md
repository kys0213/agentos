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

## Playwright E2E 시나리오

- 위치: `apps/gui/e2e/`
- 대표 흐름:
  - `mcp-verify.e2e.test.ts`: 대시보드 → Tools → Agent Create → AI Config
  - `chat-ux.e2e.test.ts`: 채팅 인터랙션과 상태 보존
  - `subagent-create-flow.e2e.test.ts`: SubAgent 생성 마법사 단계별 검증
- 실행: `pnpm --filter @agentos/apps-gui test:e2e`
- 새 시나리오는 기존 테스트 구조와 `utils/` 헬퍼를 재사용해 추가합니다.

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
- Playwright E2E 테스트가 통과한 뒤 시각적 점검이나 상호작용 재현이 필요할 때 선택적으로 사용합니다.

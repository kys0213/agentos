# GUI Testing Guide (IPC + Mock)

> 이동 안내: 본 문서는 `apps/gui/docs/frontend/testing.md`로 이동 예정입니다. 인덱스: `apps/gui/docs/frontend/README.md`

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

const presets = await Services.getPreset().getAllPresets();
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

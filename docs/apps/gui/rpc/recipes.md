# RPC Recipes

실전 예제를 간결히 모읍니다. 자세한 개념/정책은 GUIDE/SPEC를 참조하세요.

## 스트림 구독/취소 (AsyncGenerator)

```ts
const it = mcp.usage_eventsStream();
try {
  for await (const ev of it) {
    render(ev);
    if (shouldStop()) break; // 조기 종료
  }
} finally {
  await it.return?.(); // can 프레임 전송 → 서버 구독 해제
}
```

## 스트림 구독/취소 (On/Close)

```ts
const close = mcp.usage_eventsOn((ev) => render(ev));
// ...
await close(); // can 프레임 전송 → 서버 구독 해제
```

## 서비스 레이어에서의 안전한 구독/취소

```ts
import { McpUsageRpcService } from '@/renderer/rpc/services/mcp-usage.service';
import { createRpcTransport } from '@/renderer/rpc/rpc-channel.factory';

const rpc = createRpcTransport();
const usage = new McpUsageRpcService(rpc);

const close = await usage.subscribeToUsageUpdates((ev) => {
  console.log('usage event', ev);
});

// ... 작업 후 반드시 해제
await close();
```

## z.input / z.output 타입 추론

```ts
import { McpContract as C } from '@/shared/rpc/contracts/mcp.contract';

// payload 타입: z.input
await mcp.invokeTool({
  name: 'web.search',
  input: { q: 'hello' },
});

// 결과 타입: z.output
const stats = await mcp.usage_getStats({});
//   ^? z.output<typeof C.methods['usage.getStats']['response']>
```

## dot → underscore 메서드 네이밍

```txt
mcp.usage.getStats  → usage_getStats()
mcp.usage.events    → usage_eventsStream() / usage_eventsOn()
```

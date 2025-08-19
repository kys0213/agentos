# Electron Reactive RPC 아키텍처 문서 (v0.2)

> 공용 용어/채널 정의: `apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`

이 문서는 **Electron(Main: NestJS Microservice + RxJS / Renderer: React + RxJS)** 기반 앱에서 **postMessage 스타일 공통 RPC 레이어**로 단발/RPC와 스트림을 일관 처리하는 스펙을 정의합니다. Electron/Web(Service Worker)/Chrome Extension 등으로 **Transport 교체만으로 재사용** 가능하도록 설계되었습니다. 본 v0.2는 packages/core의 타입/이벤트 스펙에 맞춰 구체 타입과 에러 정책, 이벤트 연계를 강화하며, 전송계층과 서비스 계층을 분리한 **채널 기반 Transport + 타입 안전 서비스 레이어**를 권장합니다.

---

## 1. 목표

- **런타임 독립**: Renderer는 Electron/웹/익스텐션 의존 없이 동일 API 사용
- **일관된 통신 모델**: 단발(RPC) + 스트림(Observable/AsyncGenerator) + 취소/타임아웃
- **리액티브 상태 전파**: Main 허브 상태를 세션/탭 별로 선택적으로 구독
- **간단한 보일러**: 어댑터만 교체해 다양한 실행환경 지원

---

## 2. 전체 아키텍처

- **Main (Electron)**
  - NestJS Microservice + **CustomTransportStrategy** (EventPattern-only)
  - RxJS **Hub(State)**: `BehaviorSubject` 중심의 상태 허브
  - IPC Bridge: `bridge:post`(수신) / `bridge:frame`(송신)

- **Renderer**
  - React + RxJS
  - 공통 **RpcEndpoint**(엔진) + **Transport 어댑터**(electron/web/extension)

- **공통 RPC 스펙**
  - `req/res/err/nxt/end/can` 프레임
  - correlation id(`cid`) 기반 상관관계
  - 코어 타입 정합: payload/result는 코어 타입을 우선 사용

---

## 3. 디렉터리 레이아웃 (권장)

```
apps/
  gui/
    src/
      main/
        app.module.ts
        bootstrapIpcMainProcess.ts
        transport/electron-event-transport.ts
      renderer/
        rpc/
          types.ts
          rpc-endpoint.ts
        ipc/
          ipc-channel.factory.ts
        state/
          hub.stream.ts
        app/App.tsx
      preload.ts
```

---

## 4. RPC 프레임 규격 (Core 타입/에러 정합)

```ts
// rpc/types.ts
export type Cid = string;

export type RpcFrame =
  | {
      kind: 'req';
      cid: Cid;
      method: string;
      payload?: unknown;
      meta?: { senderId?: number; rpcSpecVersion?: string; ts?: number };
    }
  | { kind: 'res'; cid: Cid; ok: true; result?: unknown } // 단발 완료
  | {
      kind: 'err';
      cid: Cid;
      ok: false;
      message: string;
      code: import('@agentos/core').ErrorCode;
      domain: import('@agentos/core').ErrorDomain;
      details?: Record<string, unknown>;
    }
  | { kind: 'nxt'; cid: Cid; data: unknown; seq?: number } // 스트림 next
  | { kind: 'end'; cid: Cid } // 스트림 complete
  | { kind: 'can'; cid: Cid }; // 소비 측 취소
```

### 동작 원칙

- **단발(RPC)**: `req → res` 또는 `req → err`
- **스트림**: `req → nxt* → end` (중간 `err` 가능)
- **취소**: 소비 측에서 `can` 송신 → 생산 측 구독 해지
- **메타/보안**: `meta`에 `senderId`, 권한 토큰 등 포함 가능
  - **타임스탬프**: 왕복 추적을 위해 `meta.ts`(epoch ms) 권장

### 4.1 서비스 레이어(권장)와 메서드-타입 매핑

Transport는 채널 문자열과 payload만 다루고, 타입 안전성은 서비스 레이어에서 보장합니다.

권장 패턴(채널 기반 RpcClient + 타입 안전 서비스):

```ts
// Transport 인터페이스 (송수신 계층 전용)
export interface RpcClient {
  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes>;
  stream?<T = unknown>(channel: string, payload?: unknown): AsyncGenerator<T, void, unknown>;
}

// 서비스 예시 (Agent)
export class AgentRpcService {
  constructor(private readonly transport: RpcClient) {}
  chat(agentId: string, messages: UserMessage[], options?: AgentExecuteOptions) {
    return this.transport.request<AgentChatResult>('agent.chat', { agentId, messages, options });
  }
  getAgentMetadata(id: string) {
    return this.transport.request<AgentMetadata | null>('agent.getMetadata', id);
  }
}
```

참고: 메서드별 타입 매핑(RpcMethodMap)은 서비스 내부 유틸로 유지할 수 있습니다(Transport와 분리).

```ts
export interface RpcClient {
  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes>;
  stream?<T = unknown>(channel: string, payload?: unknown): AsyncGenerator<T, void, unknown>;
}
```

---

## 5. RpcEndpoint (엔진)

### 역할

- 프레임 송수신을 **Transport**에 위임
- `request()`(단발), `stream()`(AsyncGenerator) API 제공
- 타임아웃/취소/에러 처리 일원화
- 서버측 핸들러 등록(`register(method, handler)`)

### 인터페이스 요약

```ts
// rpc/engine.ts (요약)
export class RpcEndpoint {
  constructor(transport: FrameTransport, opts?: { timeoutMs?: number; onLog?: (f: any) => void });

  start(): void;
  stop(): void;

  register(method: string, handler: (payload: any, meta?: any) => any): void;

  request<T = any>(method: string, payload?: any, meta?: any, timeoutMs?: number): Promise<T>;

  stream<T = any>(method: string, payload?: any, meta?: any): AsyncGenerator<T>;
}
```

> 핸들러 반환 타입: `Promise | any | AsyncGenerator | Observable-like({ subscribe })`

추가 권장 사항

- 제네릭 메서드 서명: 4.1의 `RpcMethodMap`을 활용해 `request/stream`을 타입 안전하게 사용
- 에러 매핑: 서버 예외를 `CoreError` 필드로 `err` 프레임 통일

---

## 6. Transport 어댑터

### 6.1 Electron (Renderer 측)

```ts
// preload.ts (현재 구현)
contextBridge.exposeInMainWorld('electronBridge', {
  start: (onFrame) => {
    ipcRenderer.on('bridge:frame', (_e, f) => onFrame(f));
  },
  post: (frame) => {
    ipcRenderer.send('bridge:post', frame);
  },
});

// 권장 확장(차기): 안전 구독 + 채널 기반 invoke
// contextBridge.exposeInMainWorld('electronBridge', {
//   on: (channel: string, handler: (payload: unknown) => void) => {
//     const wrapped = (_e: unknown, payload: unknown) => handler(payload);
//     ipcRenderer.on(channel, wrapped);
//     return () => ipcRenderer.off(channel, wrapped);
//   },
// });
// contextBridge.exposeInMainWorld('rpc', {
//   request: (channel: string, payload?: unknown) => ipcRenderer.invoke(channel, payload),
// });
```

```ts
// renderer: frame bridge + endpoint 구성(요약)
const bridge = (window as any).electronBridge;
const frameTransport = {
  start: (onFrame: (f: RpcFrame) => void) => bridge.start(onFrame),
  post: (frame: RpcFrame) => bridge.post(frame),
  stop: () => bridge.stop?.(),
};
const endpoint = new RpcEndpoint(frameTransport);
endpoint.start();
// RpcClient로 endpoint를 그대로 사용
```

### 6.2 Web(Service Worker)

```ts
export class ServiceWorkerTransport implements RpcTransport {
  start(onFrame) {
    navigator.serviceWorker.addEventListener('message', (e) => onFrame(e.data));
  }
  post(frame) {
    const ctrl = navigator.serviceWorker.controller;
    if (!ctrl) throw new Error('SW not ready');
    ctrl.postMessage(frame);
  }
}
```

### 6.3 Chrome Extension (Port)

```ts
export class ChromeExtensionPortTransport implements RpcTransport {
  private port: chrome.runtime.Port | null = null;
  start(onFrame) {
    this.port = chrome.runtime.connect({ name: 'rpc' });
    this.port.onMessage.addListener((m) => onFrame(m));
  }
  post(frame) {
    this.port?.postMessage(frame);
  }
  stop() {
    this.port?.disconnect();
  }
}
```

> 고빈도 스트림은 `MessageChannelMain` 포트를 추가 어댑터로 제공 가능.

---

## 7. Main: NestJS 커스텀 트랜스포트

### 7.1 Nest Microservice 부팅 + 프레임 브리지(현재)

```ts
// apps/gui/src/main/bootstrapIpcMainProcess.ts
export async function bootstrapIpcMainProcess(ipcMain: IpcMain, mainWindow: BrowserWindow) {
  const appFrame = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronEventTransport(ipcMain, mainWindow),
  });
  await appFrame.listen();
  return { close: async () => appFrame.close() };
}
```

### 7.2 Transport 구현 (EventPattern 전용)

```ts
export class ElectronEventTransport extends Server implements CustomTransportStrategy {
  listen(cb: () => void) {
    this.ipcMain.on('bridge:post', async (e, frame) => {
      const senderId = e.sender.id;
      if (frame?.kind !== 'req') return;
      const handler = this.messageHandlers.get(frame.method);
      if (!handler)
        return this.sendTo(senderId, {
          kind: 'err',
          cid: frame.cid,
          ok: false,
          message: 'NO_HANDLER',
          code: 'NOT_FOUND',
          domain: 'common',
        });

      try {
        const out = await handler(frame.payload, { senderId }); // Promise | Observable | AsyncGen | any
        if (isObservable(out)) {
          const sub = (out as Observable<any>).subscribe({
            next: (v) => this.sendTo(senderId, { kind: 'nxt', cid: frame.cid, data: v }),
            error: (e) =>
              this.sendTo(senderId, { kind: 'err', cid: frame.cid, ok: false, message: String(e) }),
            complete: () => this.sendTo(senderId, { kind: 'end', cid: frame.cid }),
          });
          // cancel 프레임 수신 시 sub.unsubscribe() 처리 (구현됨)
          return;
        }
        if (out && typeof out[Symbol.asyncIterator] === 'function') {
          for await (const chunk of out)
            sendTo(senderId, { kind: 'nxt', cid: frame.cid, data: chunk });
          return sendTo(senderId, { kind: 'end', cid: frame.cid });
        }
        return this.sendTo(senderId, { kind: 'res', cid: frame.cid, ok: true, result: out });
      } catch (e: any) {
        // CoreError 매핑 시도
        const asCore = e as import('@agentos/core').CoreError;
        return this.sendTo(senderId, {
          kind: 'err',
          cid: frame.cid,
          ok: false,
          message: String(e?.message ?? e),
          code: (asCore as any)?.code ?? 'INTERNAL',
          domain: (asCore as any)?.domain ?? 'common',
          details: (asCore as any)?.details,
        });
      }
    });
    cb();
  }
  close() {}
}
```

> Nest 핸들러는 **전부 `@EventPattern('method')`** 로 등록.
> 단발/스트림은 Transport가 프레임으로 변환.

---

## 8. Hub(State) 패턴 (Main)

```ts
export type GlobalAgentConfig = { defaultModel: string; temperature: number; maxTokens: number };
export type SessionState = { sessionId: string; title?: string };

export type AgentHubState = {
  global: GlobalAgentConfig;
  sessions: Record<string, SessionState>;
  version: number;
};

export const hub$ = new BehaviorSubject<AgentHubState>({
  global: { defaultModel: 'gpt-4o-mini', temperature: 0.7, maxTokens: 8000 },
  sessions: {},
  version: 1,
});

export const applyGlobal = (patch: Partial<GlobalAgentConfig>) =>
  hub$.next({ ...hub$.value, global: { ...hub$.value.global, ...patch } });
```

```ts
@Controller()
export class HubHandlers {
  @EventPattern('hub.getSnapshot')
  getSnapshot() {
    return hub$.value;
  }
  @EventPattern('hub.watchGlobal')
  watchGlobal() {
    return hub$.pipe(map((s) => s.global));
  }
  @EventPattern('hub.updateGlobal')
  updateGlobal(@Payload() patch: Partial<GlobalAgentConfig>) {
    applyGlobal(patch);
    return { ok: true };
  }
}
```

---

## 9. Renderer 통합

### 9.1 권장: 채널 기반 Transport + 서비스 레이어

```ts
import { ElectronIpcTransport } from '@/renderer/rpc/transports/electronIpc';
import { AgentRpcService } from '@/renderer/rpc/services/agent.service';

const transport = new ElectronIpcTransport();
const agent = new AgentRpcService(transport);

const result = await agent.chat('agent-id', [
  { role: 'user', content: { type: 'text', text: 'Hello' } },
]);
```

### 9.2 RxJS로 스냅샷 + 스트림 머지 (프레임 기반 스트림 도입 시)

```ts
const snap$ = from(rpc.request('hub.getSnapshot')).pipe(map((s: any) => s.global));
const global$ = new Observable<any>((sub) => {
  (async () => {
    try {
      for await (const g of rpc.stream('hub.watchGlobal')) sub.next(g);
      sub.complete();
    } catch (e) {
      sub.error(e);
    }
  })();
});
export const mergedGlobal$ = merge(snap$, global$);
```

---

## 10. 에러/취소/타임아웃 정책

- **단발**: `request()`에 `timeoutMs` 적용 → `err` 프레임 또는 타임아웃 예외
- **스트림**: 소비자 쪽 `for await` 탈출/해지 시 `can` 프레임 전송 → 서버 구독 해지
- **전역 예외**: Transport가 `err`로 변환, 메시지·코드 포함
- **로깅**: `onLog(f)` 훅으로 모든 프레임 로깅 가능
- **CoreError 매핑**: 서버 예외는 `ErrorCode`/`ErrorDomain` 포함하여 전달

---

## 11. 보안 가이드

- **Preload 최소 API**만 노출 (`start`, `post`) — 차기에는 `electronBridge.on`, `rpc.request`로 확장 (자세한 용어/채널: `apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`)
- **메시지 검증**: `method`/`payload` zod 스키마 검증
- **권한**: `meta`에 토큰/역할 포함, 서버에서 검증
- **대용량 전송**: Transferable(ArrayBuffer) 사용 권장
- **멀티 윈도우 라우팅**: `meta.senderId` 활용
- **직렬화 표준화**: `Date`는 ISO 문자열, 바이너리는 ArrayBuffer 권장

---

## 12. 퍼포먼스 팁

- 대량 이벤트는 **MessageChannelMain** 포트 어댑터 고려
- `auditTime(16~33ms)` 배칭으로 IPC 부하 완화
- 패치 전파(부분 업데이트) 권장: `{type, patch}` 구조
- 스트림 `seq` 번호로 누락/재정렬 감지

---

## 13. 네이밍 & 컨벤션

- 메서드: `domain.action` (`hub.getSnapshot`, `hub.watchGlobal`, `ai.streamChat`)
- 프레임 속성: `kind/cid/method/payload/meta` 고정
- 에러코드: `NO_HANDLER`, `INVALID_PAYLOAD`, `UNAUTHORIZED`, `RPC_TIMEOUT` 등 합의
- 버전: `rpcSpecVersion: 0.2`를 `meta`에 포함해 호환성 체크 가능

---

## 14. 테스트 전략

- **단위**: 핸들러(입력→출력), 엔진(request/stream 타임아웃, 취소)
- **계약**: 프레임 왕복(mock Transport) 스냅샷 테스트
- **E2E**: Renderer↔Main 시나리오(스냅샷/스트림/취소/에러) 자동화

---

## 15. 로드맵

- [x] `cancel` 프레임 처리(서버 측 구독 관리) 기본 구현
- [ ] MessagePort transport 추가(고빈도 최적화)
- [ ] zod 기반 메서드별 payload 스키마
- [ ] 추적(Tracing): `cid` 기반 latency/bytes 메트릭
- [ ] 멀티 Transport 동시 접속(예: Electron + SW 백업 채널)

---

## 16. 빠른 스타터(권장 초기 작업 순서)

1. **preload**에 API 노출 → (현재 `start/post`만) 차기: `electronBridge.on`, `rpc.request` 추가
2. **Main**에서 `ElectronEventTransport` 연결 (완료) + 기존 `ipcMain.handle` 경로 단계적 유지
3. **HubHandlers**에 `getSnapshot/watchGlobal/updateGlobal` 등록(예시)
4. **Renderer**에서 채널 기반 `ElectronIpcTransport` 생성 + 도메인 서비스(예: AgentRpcService) 연결
5. 스트림이 필요한 경로는 프레임 기반으로 도입 후 `snapshot + stream` 병합

---

### 17. 코어 IPC 이벤트 연동

packages/core/docs/IPC_EVENT_SPEC.md의 채널/가드를 그대로 사용합니다.

- 메인: `AgentEventBridge` + `FunctionPublisher`로 `agentos:<channel>` 브로드캐스트
- 프리로드: (차기) `electronBridge.on(channel, handler)`로 구독 통로 노출
- 렌더러: `FunctionSubscriber` + `subscribeJson(sub, channel, guard, handler)`로 타입 안전 수신

예시(렌더러):

```ts
import { FunctionSubscriber, subscribeJson, isSessionMessagePayload } from '@agentos/core';
const sub = new FunctionSubscriber((ch, handler) =>
  (window as any).electronBridge.on(`agentos:${ch}`, handler)
);
subscribeJson(sub, 'agent/session/123/message', isSessionMessagePayload, (p) => {
  /* update UI */
});

---

## 18. OutboundChannel 패턴 (권장)

- Main은 단일 `OutboundChannel`(Subject 기반)을 통해 도메인 이벤트를 방출합니다.
- 서비스는 생성자 주입으로 `OutboundChannel`을 받아 `emit({ type, payload, ts })`를 호출합니다.
- 컨트롤러는 `@EventPattern('agent.events')` 같은 스트림 엔드포인트로 `OutboundChannel.ofType('agent.')`를 그대로 반환합니다.
- Transport는 스트림 nxt 프레임에 `method`를 포함해 전송하므로, 렌더러는 단일 `frames$`에서 `method`로 demux 가능합니다.

타입 안전 예시:

```ts
// main/common/event/events.ts
export const AgentOutboundEvent = z.union([
  z.object({ type: z.literal('agent.session.message'), payload: z.object({ sessionId: z.string(), data: z.unknown() }) }),
  z.object({ type: z.literal('agent.session.ended'), payload: z.object({ sessionId: z.string() }) }),
]);

// renderer
const frames$ = fromBridge$(electronBridge);
wireAgentEvents(frames$, {
  onMessage: (p) => {/* update UI */},
  onEnded: (p) => {/* cleanup */},
});
```

---

## 19. 현 상태 vs 스펙 정합성(8/16 기준)

- Preload: `start/post`만 노출됨. `electronBridge.on`/`rpc.request`는 미노출(권장 확장 대상).
- Main: `ElectronEventTransport`가 Nest Microservice로 연결되고 `can`(취소) 및 `CoreError` 매핑 동작.
- Renderer: 프레임 기반 `RpcEndpoint` + `ElectronIpcTransport` 사용 가능. 채널 기반 `invoke` 경로는 미도입.
```

### 18. 현재 브랜치 작업 메모(Phase 1)

- Renderer에 호환 어댑터 도입: `ElectronInvokeTransport`가 기존 `window.electronAPI` 호출을 `RpcEndpoint.request()`로 래핑
- 파일 위치:
  - `apps/gui/src/renderer/rpc/types.ts`
  - `apps/gui/src/renderer/rpc/engine.ts`
  - `apps/gui/src/renderer/rpc/transports/electronInvoke.ts`
- Preload에 안전 구독 API 추가: `window.electronBridge.on(channel, handler)`
- 다음 단계: Main 프레임 기반 `ElectronEventTransport` 프로토타입 및 cancel 처리

# Electron RPC/이벤트 수렴 계획서 (v0.2)

## Requirements

### 성공 조건

- [ ] apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md v0.2 스펙과 실제 구현이 일치한다.
- [ ] 메인-렌더러 간 RPC는 `req/res/err/nxt/end/can` 프레임으로 동작하며 `CoreError` 매핑을 유지한다.
- [ ] 이벤트 채널은 core 스펙(`agent/status`, `agent/session/<sid>/message` 등)과 가드로 타입 안전하게 구독된다.
- [ ] 고빈도 스트림(토큰/usage)은 취소(`can`)와 배치/샘플링 정책을 적용한다.
- [ ] 기존 `electronAPI` 기반 IPC 호출은 호환 어댑터(`RpcTransport`) 뒤로 캡슐화된다.

### 사용 시나리오

- [ ] 사용자 브릿지/에이전트/프리셋/MCP UI가 RPC를 통해 질의/명령을 수행하고, 코어 이벤트로 실시간 상태를 반영한다.
- [ ] 세션 메시지/상태/에러 이벤트를 구독하여 채팅 화면이 즉시 갱신된다.
- [ ] MCP 사용량 업데이트는 이벤트 스트림으로 수신되며, 취소 시 리소스가 해제된다.

### 제약 조건

- [ ] `any` 사용 금지, 코어 타입/가드 적극 사용.
- [ ] `contextIsolation: true` 유지. `window.require` 사용 금지 → preload에서 안전 API 노출.
- [ ] 대용량은 ArrayBuffer/Transferable 사용, `Date`는 ISO 문자열 직렬화.

## Interface Sketch

```ts
// 프레임
export type RpcFrame =
  | {
      kind: 'req';
      cid: string;
      method: string;
      payload?: unknown;
      meta?: { senderId?: number; rpcSpecVersion?: string; ts?: number };
    }
  | { kind: 'res'; cid: string; ok: true; result?: unknown }
  | {
      kind: 'err';
      cid: string;
      ok: false;
      message: string;
      code: ErrorCode;
      domain: ErrorDomain;
      details?: Record<string, unknown>;
    }
  | { kind: 'nxt'; cid: string; data: unknown; seq?: number }
  | { kind: 'end'; cid: string }
  | { kind: 'can'; cid: string };

// 엔드포인트
export interface RpcTransport {
  // Sends a single-shot request over a channel and resolves with the result
  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes>;

  // Subscribes to a channel as a stream; resolves to an unsubscribe function
  // The consumer can wrap this into an AsyncGenerator if desired
  stream?<T = unknown>(channel: string, handler: (data: T) => void): Promise<() => void>;
}

// 이벤트 구독(렌더러)
const sub = new FunctionSubscriber((channel, handler) =>
  electronBridge.on(`agentos:${channel}`, handler)
);
subscribeJson(sub, 'agent/session/123/message', isSessionMessagePayload, (p) => {
  /* update UI */
});
```

## Todo

- [ ] Preload에 이벤트 구독 API 추가: `electronBridge.on(channel, handler): () => void`
- [ ] Preload에 generic invoke 추가: `rpc.request(channel, payload)`
- [x] Renderer에 프레임 기반 `ElectronIpcTransport` 구현(순수 전송)
- [x] Agent 서비스 스캐폴드(`AgentRpcService`) 추가 및 타입 import 정리
- [x] Bridge/Preset 서비스 추가: `BridgeRpcService`, `PresetRpcService`
- [x] MCP/MCPUsage 서비스 추가: `McpRpcService`, `McpUsageRpcService`
- [x] Conversation 서비스 추가: `ConversationRpcService`
- [x] Bootstrap에 RPC 서비스 등록(기존 경로와 병행/대체)
- [x] 문서 업데이트: 스펙/가이드 최신화
- [x] 폴백 경로에서 세션 메시지 이벤트 브로드캐스트(초기)
- [ ] 기존 renderer 훅/컨테이너 호출부를 RPC 서비스로 점진 이관 및 정리
- [x] Main에 프레임 기반 `ElectronEventTransport` 연결(Nest Microservice)
- [x] ElectronEventTransport에 cancel 처리(subscriptions by cid) 기본 구현
- [ ] `AgentEventBridge` 도입: core 이벤트 `agentos:` 접두사 브로드캐스트
- [ ] MCP 사용량 업데이트 경로 이벤트화 점검(샘플링/취소 포함)
- [ ] 메서드별 zod 스키마 초안(최소 입력 검증) 추가
- [ ] 계약 테스트: mock Transport로 `req/res/err/nxt/end/can` 스냅샷
- [ ] E2E: snapshot+watch 시나리오, 취소/타임아웃, CoreError 전파 확인
- [x] 데모 스트림 경로 연결: `demo.streamTicks` (Frame-level prototype)

## 작업 순서

1. [완료] **Preload 확장**: `electronBridge.on` + `rpc.request` 추가
2. [완료] **Renderer 전송**: 채널 기반 `ElectronIpcTransport` 구현
3. [완료] **서비스 추가 1차**: Agent/Bridge/Preset/MCP/MCPUsage/Conversation RPC 서비스 추가 및 등록
4. [진행] **호출부 이관**: 기존 훅/컨테이너를 RPC 서비스로 점진 이관
5. [완료] **Main 트랜스포트**: `ElectronEventTransport` 연결 및 cancel 처리
   - [완료] cancel 처리 구현
   - [완료] Nest Microservice 전략으로 실제 라우팅 연결
6. **코어 이벤트 연동**: `AgentEventBridge` 브로드캐스트, 렌더러 `subscribeJson` 수신
7. **검증/테스트**: 계약/통합/E2E 추가, 회귀 방지
8. **문서/정리**: 스펙 반영 최종 점검, 로드맵 체크박스 갱신

## 비고

- 안전한 점진 도입을 위해 기존 `ipcMain.handle` 경로는 유지하면서 내부를 `RpcEndpoint` 호출로 이행하는 호환 레이어를 추천합니다.
- MessagePort 최적화는 2차(퍼포먼스) 작업으로 분리합니다.

## 현 상태 요약 (8/16 기준)

- Preload는 현재 `start/post`만 노출되어 있으며, `electronBridge.on`/`rpc.request`는 미노출 상태입니다.
- Main은 `ElectronEventTransport`로 Nest Microservice가 구동되며, `can` 취소 프레임과 `CoreError` 매핑이 반영되어 있습니다.
- Renderer는 프레임 기반 `RpcEndpoint` + `ElectronIpcTransport`로 스트림/단발을 처리할 수 있는 구조가 준비되어 있습니다.

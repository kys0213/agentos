# Moved

This plan is archived at `apps/gui/docs/archive/RPC_MIGRATION_PLAN.md`.
Latest tracking: `apps/gui/plan/RPC_AND_STREAMING_CONSOLIDATED_PLAN.md` (Phases 2–4).
Index: `apps/gui/docs/rpc/README.md`.

## Requirements (v0.3 업데이트)

### 성공 조건

- [ ] apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md v0.2 스펙과 실제 구현이 일치한다.
- [ ] 메인-렌더러 간 RPC는 `req/res/err/nxt/end/can` 프레임으로 동작하며 `CoreError` 매핑을 유지한다.
- [ ] 이벤트 채널은 core 스펙(`agent/status`, `agent/session/<sid>/message` 등)과 가드로 타입 안전하게 구독된다.
- [ ] 고빈도 스트림(토큰/usage)은 취소(`can`)와 배치/샘플링 정책을 적용한다.
- [ ] 기존 `electronAPI` 기반 IPC 호출은 호환 어댑터(`RpcTransport`) 뒤로 캡슐화된다.
- [ ] 렌더러 서비스 레이어는 `shared/types/ipc-channel.ts`의 `IpcChannel` 의존을 제거하고, `renderer/rpc/rpc-endpoint.ts`(RpcEndpoint/RpcClient) 기반으로 동작한다.
- [ ] 컨트롤러 채널 네이밍은 도트 표기(`agent.chat`, `bridge.register`, `preset.list` 등)로 일관화하고, 렌더러 서비스에서 이를 호출한다.

### 사용 시나리오

- [ ] 사용자 브릿지/에이전트/프리셋/MCP UI가 RPC를 통해 질의/명령을 수행하고, 코어 이벤트로 실시간 상태를 반영한다.
- [ ] 세션 메시지/상태/에러 이벤트를 구독하여 채팅 화면이 즉시 갱신된다.
- [ ] MCP 사용량 업데이트는 이벤트 스트림으로 수신되며, 취소 시 리소스가 해제된다.

### 제약 조건

- [ ] `any` 사용 금지, 코어 타입/가드 적극 사용.
- [ ] `contextIsolation: true` 유지. `window.require` 사용 금지 → preload에서 안전 API 노출.
- [ ] 대용량은 ArrayBuffer/Transferable 사용, `Date`는 ISO 문자열 직렬화.

## 채널/용어

공용 문서 참조: `apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`

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

## Todo (업데이트: 08/24)

- [x] Preload에 이벤트 구독 API 추가: `electronBridge.on(channel, handler): () => void`
- [x] Preload에 generic invoke 추가: `rpc.request(channel, payload)`
- [x] Renderer에 프레임 기반 `ElectronIpcTransport` 구현(순수 전송)
- [x] Agent 서비스 스캐폴드(`AgentRpcService`) 추가 및 타입 import 정리
- [x] Bridge/Preset 서비스 추가: `BridgeRpcService`, `PresetRpcService`
- [x] MCP/MCPUsage 서비스 추가: `McpRpcService`, `McpUsageRpcService`
- [x] Conversation 서비스 추가: `ConversationRpcService`
- [x] Bootstrap에 RPC 서비스 등록(기존 경로와 병행/대체)
- [x] 문서 업데이트: 스펙/가이드 최신화
- [x] 폴백 경로에서 세션 메시지 이벤트 브로드캐스트(초기)
- [ ] 기존 renderer 훅/컨테이너 호출부를 RPC 서비스로 점진 이관 및 정리
  - (진행) Chat/Preset 관련 호출 정리 및 서비스 의존도 명확화
  - (보류) mock IPC 경로/테스트 유틸 정리 및 any 제거
- [x] Main에 프레임 기반 `ElectronEventTransport` 연결(Nest Microservice)
- [x] ElectronEventTransport에 cancel 처리(subscriptions by cid) 기본 구현
- [x] `AgentEventBridge` 도입: core 이벤트 `agentos:` 접두사 브ロード캐스트
  - apps/gui/src/main/agent/events/agent-event-bridge.ts 기반 브릿지 구성
- [ ] MCP 사용량 업데이트 경로 이벤트화 점검(샘플링/취소 포함)
- [x] 메서드별 DTO/class-validator 스키마(메인) 및 zod 가드(렌더러) 초안 추가
  - (완료) preset/mcp-usage DTO 초안, 렌더러 zod 가드 샘플 반영
  - (보완) 전 채널로 확대 적용 필요
- [x] 전송 계층 계약 테스트: mock/real Transport로 `req/res/err/nxt/end/can` 왕복 확인
- [ ] E2E: snapshot+watch 시나리오, 취소/타임아웃, CoreError 전파 확인
- [x] 데모 스트림 경로 연결: `demo.streamTicks` (Frame-level prototype)

### 신규 이관 작업(렌더러 서비스 → RpcEndpoint)

- [ ] 렌더러 서비스의 채널 네이밍 colon → dot 전환(컨트롤러와 1:1 매핑)
  - [x] `renderer/rpc/services/agent.service.ts`: 생성 클라이언트로 대체(도트 채널)
  - [x] `renderer/rpc/services/bridge.service.ts`: 생성 클라이언트로 대체(도트 채널)
  - [x] `renderer/rpc/services/preset.service.ts`: 생성 클라이언트로 대체(도트 채널)
  - [x] `renderer/rpc/services/mcp.service.ts`: 생성 클라이언트로 대체(도트 채널)
  - [x] `renderer/rpc/services/conversation.service.ts`: Chat 생성 클라이언트로 대체
- [ ] `renderer/services/*` 레거시 경로에서 `IpcChannel` 의존 제거
  - [ ] `ipc-agent.ts` 제거 또는 Rpc 서비스 대체
  - [ ] `fetchers/*` 임시 호출부를 Rpc 서비스로 교체
- [ ] 훅/컨테이너 이관: 기존 호출부를 Rpc 서비스로 교체
  - [ ] Chat 관련 훅 우선 이관(전달 타입 가드 적용)
  - [ ] Preset 관련 훅/컨테이너 이관, `ServiceContainer` 등록/해제 확인
- [ ] 통합 테스트: 요청/응답 및 스트림(cancel 포함) 경로 점검
- [ ] 문서/가이드: 채널 표기 전환/사용 예시/마이그레이션 노트 반영

## 작업 순서 (실행 계획)

1. [완료] **Preload 확장**: `electronBridge.on` + `rpc.request` 추가
2. [완료] **Renderer 전송**: 채널 기반 `ElectronIpcTransport` 구현
3. [완료] **서비스 추가 1차**: Agent/Bridge/Preset/MCP/MCPUsage/Conversation RPC 서비스 추가 및 등록
4. **채널 표기 정리**: 렌더러 Rpc 서비스 colon → dot 전환, 컨트롤러와 매핑 테이블 확정
5. **호출부 이관**: 기존 훅/컨테이너를 Rpc 서비스로 점진 이관(Chat/Preset 우선)
6. **레거시 제거**: `IpcChannel` 의존 및 mock 경로 제거
7. **코어 이벤트 연동**: `AgentEventBridge` 브로드캐스트 수신 훅 구현
8. **검증/테스트**: 계약/통합/E2E 보강, 회귀 방지
9. **문서/정리**: 스펙 반영 최종 점검, 로드맵 체크박스 갱신

## 비고

- 안전한 점진 도입을 위해 기존 `ipcMain.handle` 경로는 유지하면서 내부를 `RpcEndpoint` 호출로 이행하는 호환 레이어를 추천합니다.
- MessagePort 최적화는 2차(퍼포먼스) 작업으로 분리합니다.

## 현 상태 요약 (08/24 기준)

- Preload: `electronBridge.on`/`rpc.request` 노출.
- Main: `ElectronEventTransport` + Nest Microservice 연결, `can` 취소 프레임/에러 매핑 동작.
- Renderer: `RpcEndpoint` 사용, request/stream 처리 및 타입 정합 보강. 스트림 취소 테스트 통과.
- 채널: 컨트롤러 도트 표기 정착(Agent 전환 완료), 렌더러 서비스 전환 필요.
- 이벤트: `AgentEventBridge` 브로드캐스트 수신 훅 준비.
- Lint/스타일: 오류 0(경고 일부), 후속 패스에서 any/no-unused 정리 예정.
- 문서: `apps/gui/docs/GUI_CODE_STYLE.md` 추가(가드 블록/삼항 분리 가이드, PR 체크리스트 포함).

## Lint/Style 하드닝 (추가 섹션)

- 목표: Prettier×ESLint 충돌 제거, 일관된 제어 흐름, 타입 안전성 강화.
- 적용 규칙: curly(항상), no-nested-ternary, multiline-ternary(엄격), any 금지/`as any` 금지.
- 현황: 타입체크/린트 오류 0; 경고는 IPC mock/type-safety 후속 작업으로 분리.

# GUI Electron RPC 공용 용어/채널 정의

본 문서는 GUI 메인↔렌더러 간 RPC/이벤트 스트림의 공통 용어와 채널 네임스페이스를 정의합니다. 계획서/가이드는 본 문서를 참조해 중복을 줄입니다.

## 용어 정리

- RpcFrame: 프레임 기반 메시지. 종류: `req | res | err | nxt | end | can`.
- FrameTransport(렌더러): `electronBridge.start/post/stop` 래퍼.
- RpcClient(렌더러): `RpcEndpoint`가 구현(프레임 브리지 위에서 동작).
- Event Transport(메인): `ElectronEventTransport` (Nest Microservice 전략).
- Preload API: `rpc.request(channel, payload?)`, `electronBridge.on(channel, handler) -> unsubscribe`.
- Validation: 메인 컨트롤러는 `ValidationPipe + class-validator`; 렌더러 경계는 `zod` 가드 권장.
- 직렬화: `Date`는 ISO 문자열, 대용량은 `ArrayBuffer/Transferable` 권장.
- 에러: 코어의 `CoreError`를 `err` 프레임으로 매핑하여 전달.
- 취소: 구독/스트림은 `can` 프레임로 취소, 리소스 해제 보장.

## 채널 네임스페이스

- preset.\*: `preset.list`, `preset.get`, `preset.create`, `preset.update`, `preset.delete`
- mcp.\*: `mcp.getTool`(payload: `{ name: string }`), `mcp.invokeTool`(payload: `{ name: string; input?: object; resumptionToken?: string }`)
- mcp.usage.\*: `mcp.usage.getLogs`, `mcp.usage.getStats`, `mcp.usage.getHourlyStats`, `mcp.usage.clear`
- chat.\*: `chat.list-sessions`, `chat.get-messages`, `chat.delete-session`
- conversation.\*: (TBD) 컨트롤러 네임스페이스 확정 시 정리

## 메시지 콘텐츠 규칙

- llm-bridge-spec에 따라 모든 메시지의 `content`는 `MultiModalContent[]` 배열로 전송/수신한다.
- 단일 문자열/오브젝트 사용 금지. 예: `{ role: 'user', content: [{ contentType: 'text', value: 'hello' }] }`.
- bridge.\*: `bridge.register`, `bridge.unregister`, `bridge.switch`, `bridge.get-current`, `bridge.list`
- builtin.\*: `builtin.install`, `builtin.list`, `builtin.invoke`, `builtin.remove`

## 이벤트 스트림 채널

- agent.events: 코어 에이전트 이벤트를 브로드캐스트. `nxt` 프레임의 `data` 내 `method` 필드로 디먹스.
- mcp.usage.events: MCP 사용량 업데이트 이벤트. 샘플링/배치 정책 적용 가능, `can` 취소 지원.

## 구독 예시(렌더러)

```ts
const unsubscribe = await transport.stream('mcp.usage.events', (e) => {
  // handle usage update event
});
// later
unsubscribe();
```

## 렌더러 부트스트랩 패턴 (권장)

- Transport/Endpoint 분리: 프레임 브리지(electronBridge.start/post)를 얇게 감싼 전송층과, 이를 사용하는 `RpcEndpoint`를 분리합니다.
- 의존성 주입: 앱 부트스트랩은 `RpcClient`를 인자로 받아 서비스 컨테이너를 구성합니다. 전송 구현을 내부에서 숨기지 않습니다.
- 준비 대기: 부트스트랩 전에 `waitForRpcReady()`를 호출해 preload 주입(`electronBridge`, `rpc.request`) 준비를 명시적으로 보장합니다.
- 순환 참조 회피: 전송 구현이 `RpcEndpoint`를 생성하거나 참조하지 않도록 합니다. 필요 시 별도 클라이언트(EndpointClient)로 `request/stream`만 노출해 사용합니다.

예시(요지):

```ts
// wait
await waitForRpcReady();

// frame bridge (electronBridge wrapper)
const frameBridge = new ElectronFrameBridge();

// endpoint and client
const endpoint = new RpcEndpoint(frameBridge);
endpoint.start();
const transport /*: RpcClient*/ = endpoint;

// inject transport to services
await bootstrap(transport);
```

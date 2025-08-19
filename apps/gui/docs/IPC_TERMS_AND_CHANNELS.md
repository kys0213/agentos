# GUI Electron RPC 공용 용어/채널 정의

본 문서는 GUI 메인↔렌더러 간 RPC/이벤트 스트림의 공통 용어와 채널 네임스페이스를 정의합니다. 계획서/가이드는 본 문서를 참조해 중복을 줄입니다.

## 용어 정리

- RpcFrame: 프레임 기반 메시지. 종류: `req | res | err | nxt | end | can`.
- RpcTransport(렌더러): `ElectronIpcTransport` 구현 사용.
- Event Transport(메인): `ElectronEventTransport` (Nest Microservice 전략).
- Preload API: `rpc.request(channel, payload?)`, `electronBridge.on(channel, handler) -> unsubscribe`.
- Validation: 메인 컨트롤러는 `ValidationPipe + class-validator`; 렌더러 경계는 `zod` 가드 권장.
- 직렬화: `Date`는 ISO 문자열, 대용량은 `ArrayBuffer/Transferable` 권장.
- 에러: 코어의 `CoreError`를 `err` 프레임으로 매핑하여 전달.
- 취소: 구독/스트림은 `can` 프레임로 취소, 리소스 해제 보장.

## 채널 네임스페이스

- preset.*: `preset.list`, `preset.get`, `preset.create`, `preset.update`, `preset.delete`
- mcp.*: `mcp.register`, `mcp.unregister`, `mcp.getTool`, `mcp.invokeTool`
- mcp.usage.*: `mcp.usage.getLogs`, `mcp.usage.getStats`, `mcp.usage.getHourlyStats`, `mcp.usage.clear`
- chat.*: `chat.listSessions`, `chat.getSession`, `chat.removeSession`
- conversation.*: `conversation.list`, `conversation.get`
- bridge.*: `bridge.register`, `bridge.unregister`, `bridge.switch`, `bridge.get-current`, `bridge.list`
- builtin.*: `builtin.install`, `builtin.list`, `builtin.invoke`, `builtin.remove`

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


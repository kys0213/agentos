# GUI Chat Interface Alignment Plan

## Requirements

### 성공 조건

- [ ] Chat UI sends messages via core `Agent.chat()` and maps responses to `MessageHistory` correctly.
- [ ] Content handling uses MultiModalContent arrays (`{ contentType, value }[]`) consistently.
- [ ] Session ID from `AgentChatResult.sessionId` is respected for subsequent turns.
- [ ] Mock IPC chat returns compatible message content for local web/dev and tests.
- [ ] E2E test (Playwright) covers: create preset → create agent → open chat → send message → see assistant reply.

### 사용 시나리오

- 사용자는 브라우저(dev:web)에서 앱을 열고 프리셋/에이전트를 생성한 뒤 채팅 화면에서 메시지를 입력/전송한다. 응답 메시지가 정상 렌더링되고 채팅 히스토리에 누적된다.

### 제약 조건

- Electron 없이 `vite dev` 환경에서 동작해야 하므로 `MockIpcChannel` 경유가 기본.
- 기존 E2E 시나리오(웰컴 화면, 프리셋/에이전트 생성 흐름)를 깨지지 않도록 변경은 비파괴적으로 적용.

## Interface Sketch

```ts
// core interface in use
interface Agent {
  chat(
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<{
    messages: Message[];
    sessionId: string;
  }>;
}

// GUI mapping
// - Outbound: text → UserMessage
// - Inbound: Message (content: MultiModalContent | MultiModalContent[]) → MessageHistory[]
```

## Todo

- [ ] Align MockIpcChannel.chat to return MultiModalContent shape
- [ ] Verify and adjust `useSendChatMessage` mapping (array normalization)
- [ ] Ensure ChatViewContainer session handling uses returned `sessionId`
- [ ] Validate via dev server + Playwright MCP (no GUI E2E tests)
- [ ] Run unit tests, fix regressions
- [ ] Update docs (this plan + GUI testing policy)

## 작업 순서

1. Mock fix: return `{ contentType, value }[]` (완료 조건: normalize passes; UI shows text)
2. Verify hooks/container integration and minimally adjust (완료 조건: types OK)
3. Validate flows using Playwright MCP scripts against dev:web (완료 조건: manual MCP run passes)
4. Run unit tests, polish (완료 조건: local checks pass)

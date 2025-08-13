# IPC Event Spec (Electron/Main ↔ Renderer)

본 문서는 Agent/Session 관련 표준 이벤트 채널과 페이로드 스펙을 정의합니다. 코어는 Electron에 직접 의존하지 않으며, 퍼블리셔 인터페이스를 통해 이벤트를 전달합니다.

## 채널 네임스페이스
- `agent/status` — 에이전트 상태 변경
- `agent/change` — 에이전트 메타데이터 갱신(diff/patch)
- `agent/session/created` — 세션 생성됨
- `agent/session/ended` — 세션 종료됨
- `agent/session/<sessionId>/status` — 세션 상태 변경(idle/running/waiting-input/terminated/error)
- `agent/session/<sessionId>/message` — 세션 메시지 추가(user/assistant/tool)
- `agent/session/<sessionId>/error` — 세션 에러
- `agent/session/<sessionId>/promptRequest` — 사용자 프롬프트 입력 요청
- `agent/session/<sessionId>/consentRequest` — 사용자 동의 요청
- `agent/session/<sessionId>/sensitiveInputRequest` — 민감정보 입력 요청

각 채널은 `agentId`를 포함한 페이로드를 전달합니다.

## 페이로드 스키마 개요
- `agent/status`
  - `{ agentId: string; status: 'active'|'idle'|'inactive'|'error' }`
- `agent/change`
  - `{ agentId: string; patch: Partial<AgentMetadata> }`
- `agent/session/created`
  - `{ agentId: string; sessionId: string }`
- `agent/session/ended`
  - `{ agentId: string; sessionId: string; reason?: string }`
- `agent/session/<sid>/status`
  - `{ agentId: string; sessionId: string; state: 'idle'|'running'|'waiting-input'|'terminated'|'error'; detail?: string }`
- `agent/session/<sid>/message`
  - `{ agentId: string; sessionId: string; message: MessageHistory }`
- `agent/session/<sid>/error`
  - `{ agentId: string; sessionId: string; error: { message: string; code?: string; domain?: string } }`
- `agent/session/<sid>/promptRequest`
  - `{ agentId: string; sessionId: string; id: string; message: string; schema?: unknown }`
- `agent/session/<sid>/consentRequest`
  - `{ agentId: string; sessionId: string; id: string; reason: string; data?: unknown }`
- `agent/session/<sid>/sensitiveInputRequest`
  - `{ agentId: string; sessionId: string; id: string; fields: Array<{ key: string; label: string; secret?: boolean }>} `

참고 타입: `AgentMetadata`, `MessageHistory`는 `@agentos/core`에서 export 됩니다.

## 동작 가이드
- 메인 프로세스는 코어의 브리지(이벤트 브로드캐스터)를 사용해 이벤트를 퍼블리시하고, 렌더러는 IPC로 구독합니다.
- 토큰 스트리밍 등 고빈도 이벤트는 배치/샘플링 적용을 권장합니다.
- 에러 페이로드는 `CoreError`의 `code/domain/message`를 반영할 수 있습니다(선택).

## 어댑터 예시 (Electron Main 등)
```ts
import { AgentEventBridge, FunctionPublisher } from '@agentos/core';

// 예시: Electron webContents에 연결 (core는 electron에 의존하지 않습니다)
function wireAgentBridge(agentManager, webContents) {
  const publisher = new FunctionPublisher((channel, payload) => webContents.send(channel, payload), {
    channelPrefix: 'agentos:',
  });
  const bridge = new AgentEventBridge(agentManager, publisher);
  bridge.attachAll();
  return bridge;
}

// 여러 대상에 브로드캐스트
import { CompositePublisher } from '@agentos/core';
function wireBroadcast(agentManager, windows /* () => BrowserWindow[] */) {
  const pubs = windows().map(w => new FunctionPublisher((ch, data) => w.webContents.send(ch, data), { channelPrefix: 'agentos:' }));
  const bridge = new AgentEventBridge(agentManager, new CompositePublisher(pubs));
  bridge.attachAll();
  return bridge;
}
```

## 렌더러 구독 예시 (범용)
```ts
import {
  FunctionSubscriber,
  subscribeJson,
  isAgentStatusPayload,
  isAgentChangePayload,
  isSessionStatusPayload,
  isSessionMessagePayload,
} from '@agentos/core';

// Electron의 ipcRenderer.on을 감싼 예시(앱 레이어에서 구현)
const subscriber = new FunctionSubscriber((channel, handler) => {
  const off = (event, payload) => handler(payload);
  ipcRenderer.on(`agentos:${channel}`, off);
  return () => ipcRenderer.off(`agentos:${channel}`, off);
});

subscribeJson(subscriber, 'agent/status', isAgentStatusPayload, (p) => {
  // update UI store with p.agentId and p.status
});

subscribeJson(subscriber, 'agent/change', isAgentChangePayload, (p) => {
  // apply metadata patch
});

subscribeJson(subscriber, 'agent/session/123/status', isSessionStatusPayload, (p) => {
  // reflect session status
});

subscribeJson(subscriber, 'agent/session/123/message', isSessionMessagePayload, (p) => {
  // append message
});
```

# GUI IPC & Services Guide

본 문서는 Electron 메인/프리로드/렌더러 간 IPC 구조와 렌더러 서비스 사용법을 정리합니다. 최신 스펙은 `apps/gui/src/shared/types/agentos-api.ts`, `apps/gui/src/shared/types/ipc-channel.ts`를 기준으로 합니다.

## 구조 개요

- Preload: `contextBridge.exposeInMainWorld('electronAPI', AgentOsAPI)`
- Renderer: `ElectronIpcChannel` → Service 계층(Bridge/MCP/Preset/Agent/BuiltinTool/McpUsageLog)
- Main: 도메인별 IPC 핸들러 등록(`agent`, `builtinTool`, `mcp`, `preset`, `mcpUsageLog`, `bridge`)

## 네임스페이스

- `agent`: `chat`, `endSession`, `getAgentMetadata`, `getAllAgentMetadatas`, `updateAgent`, `createAgent`, `deleteAgent`
- `bridge`: `registerBridge`, `unregisterBridge`, `switchBridge`, `getCurrentBridge`, `getBridgeIds`, `getBridgeConfig`
- `builtinTool`: `getAllBuiltinTools`, `getBuiltinTool`, `invokeBuiltinTool`
- `mcp`: `getAllMcp`, `connectMcp`, `disconnectMcp`, `executeMcpTool`, `getMcpResources`, `readMcpResource`, `getMcpStatus`, `getToolMetadata`, `getAllToolMetadata`
- `preset`: `getAllPresets`, `createPreset`, `updatePreset`, `deletePreset`, `getPreset`
- `mcpUsageLog`: `getUsageLogs`, `getAllUsageLogs`, `getUsageStats`, `getHourlyStats`, `getUsageLogsInRange`, `clearUsageLogs`, `setUsageTracking`, `subscribeToUsageUpdates`

## IPC 채널명 예시

- Agent: `agent:chat`, `agent:end-session`, `agent:get-metadata`, `agent:get-all-metadatas`, `agent:update`, `agent:create`, `agent:delete`
- Bridge: `bridge:register-bridge`, `bridge:unregister-bridge`, `bridge:switch`, `bridge:get-current`, `bridge:get-ids`, `bridge:get-config`
- MCP Usage: `mcpUsageLog:*` 접두사로 모두 분리

## Preload 노출

```ts
// apps/gui/src/main/preload.ts 발췌
contextBridge.exposeInMainWorld('electronAPI', electronAPI as AgentOsAPI);
```

## Renderer 사용

### IpcChannel 생성

```ts
import { createIpcChannel } from '@/renderer/services/ipc/IpcChannelFactory';
const channel = createIpcChannel();
```

### 서비스 접근 (DI 컨테이너)

```ts
import { Services } from '@/renderer/bootstrap';
const bridge = Services.getBridge();
const mcp = Services.getMcp();
const preset = Services.getPreset();
const agent = Services.getAgent();
const builtinTool = Services.getBuiltinTool();
const usage = Services.getMcpUsageLog();
```

### 서비스 호출 예시

```ts
// Bridge
await bridge.registerBridge({
  name: 'my-bridge',
  schemaVersion: '1.0.0',
  language: 'typescript',
  entry: 'index.ts',
  capabilities: {
    modalities: [],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  configSchema: { type: 'object', properties: {} },
  description: '',
});
const ids = await bridge.getBridgeIds();

// MCP
await mcp.connectMcp({
  name: 'mcp-x',
  type: 'streamableHttp',
  version: '1.0.0',
  url: 'https://example.com/mcp',
} as any);
const status = await mcp.getMcpStatus('mcp-x');

// Preset
const presets = await preset.getAllPresets();

// Agent
const result = await agent.chat(
  'agent-id',
  [{ role: 'user', content: { type: 'text', text: 'Hello' } }],
  { maxTurnCount: 1 }
);

// Usage Log
const logs = await usage.getAllUsageLogs();
```

## Main 구현 메모

- Agent 런타임: 활성 Bridge + `McpRegistry` + `FileBasedChatManager`를 이용해 `SimpleAgent` 연결
- 브릿지 부재 시 `agent:chat`은 에코 응답으로 폴백(개발 편의)
- 사용량 로그 라우트는 `mcpUsageLog:*`로 분리하여 유지/확장 용이

## 마이그레이션 주의사항

- 과거 `bridge.register`, `mcp.connect` 등은 제거됨. 새 이름(`registerBridge`, `connectMcp`) 사용
- 사용량 관련 메서드는 `mcp` → `mcpUsageLog` 네임스페이스로 이동
- 렌더러에서 반드시 `Services`를 통해 서비스에 접근하여 의존성 일관성 유지

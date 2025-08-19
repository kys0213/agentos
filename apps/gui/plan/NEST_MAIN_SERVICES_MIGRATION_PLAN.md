# GUI Main Services → NestJS 모듈/컨트롤러 이관 계획서 (v1)

> 공용 용어/채널 정의: `apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`

본 문서는 `apps/gui/src/main/services/*`에 존재하는 IPC 핸들러 로직을 NestJS 모듈/컨트롤러 구조로 점진 이관하기 위한 상세 계획입니다. 커밋 `e959ef03d6d7c5a814d3e43548b6487317701237`에서 정리된 LLM 브릿지 레지스트리 초기화와, 현재 추가된 모듈(PresetModule, McpUsageModule, AgentCoreModule 등)을 기반으로 진행합니다.

## Requirements

### 성공 조건

- [ ] 기존 `ipcMain.handle` 기반 서비스 호출이 NestJS `@EventPattern` 기반 컨트롤러로 대체된다.
- [ ] 각 도메인별 모듈이 `@agentos/core`의 리포지토리/서비스/레지스트리를 안전하게 DI 주입한다.
- [ ] 프레임 기반 통신(req/res/err/nxt/end/can)에서 채널/메서드 네이밍이 문서와 일치한다.
- [ ] 기존 렌더러 호출부는 새로운 채널로 무중단 전환(폴백 제거 전 병행 가능)된다.
- [ ] 테스트(Nest 단위/통합, 전송 계층 유닛)가 통과한다.

### 사용 시나리오

- [ ] 렌더러는 `rpc.request('preset.list')` 또는 프레임 스트림으로 컨트롤러에 접근한다.
- [ ] MCP 사용량 조회/초기화는 `mcp.usage.*` 채널로 노출된다.
- [ ] 채팅/세션 목록/관리 API는 `chat.*`/`conversation.*` 채널로 접근한다.
- [ ] 브릿지/툴 등 관리 작업은 각각 `bridge.*`/`builtin.*` 채널로 통합된다.

### 제약 조건

- [ ] any 금지, 컨트롤러는 ValidationPipe + class-validator 사용(메인), 렌더러 경계는 zod 가드 적용 가능
- [ ] contextIsolation 유지, preload에서 최소 API만 노출(start/post → `rpc.request`, `electronBridge.on`로 확장 예정)
- [ ] 파일 기반 저장 구조 유지(userData 하위 경로), 날짜는 ISO 직렬화

## Current State

- [x] LlmBridgeModule: `FileBasedLlmBridgeRegistry` 제공 (bridges/, `DependencyBridgeLoader`)
- [x] McpRegistryModule: `McpRegistry` 제공
- [x] AgentCoreModule: `SimpleAgentService` + `FileAgentMetadataRepository` + `FileBasedChatManager`
- [x] AgentSessionModule: `@EventPattern('agent:*' | 'agent.events')` 제공
- [x] PresetModule: `FileBasedPresetRepository` 제공
- [x] McpUsageModule: `InMemoryUsageTracker` 제공
- [x] PresetController, McpUsageController 구현 및 일부 테스트 추가
- [ ] McpController, Chat/ConversationController, BuiltinToolController, BridgeController 미구현
- [ ] 기존 services/\* 호출부 미이관(점진 제거 예정)

## Interface Sketch

- 토큰(이미 존재/추가):
  - `LLM_BRIDGE_REGISTRY_TOKEN` → `FileBasedLlmBridgeRegistry`
  - `AGENT_METADATA_REPOSITORY_TOKEN` → `FileAgentMetadataRepository`
  - `CHAT_MANAGER_TOKEN` → `FileBasedChatManager`
  - `AGENT_SERVICE_TOKEN` → `SimpleAgentService`
  - `PRESET_REPOSITORY_TOKEN` → `FileBasedPresetRepository`
  - `MCP_USAGE_TRACKER_TOKEN` → `InMemoryUsageTracker`

- 컨트롤러 채널(초안):
  - Preset: `preset.list`, `preset.get`, `preset.create`, `preset.update`, `preset.delete`
  - MCP Registry: `mcp.register`, `mcp.unregister`, `mcp.getTool`, `mcp.invokeTool`
  - MCP Usage: `mcp.usage.getLogs`, `mcp.usage.getStats`, `mcp.usage.clear`, `mcp.usage.getHourlyStats`
  - Chat/Conversation: `chat.listSessions`, `chat.getSession`, `chat.removeSession`, `conversation.list`, `conversation.get`
  - Builtin Tool: `builtin.install`, `builtin.list`, `builtin.invoke`, `builtin.remove`
  - Bridge: `bridge.register`, `bridge.unregister`, `bridge.switch`, `bridge.get-current`, `bridge.list`

## Migration Mapping (services → modules/controllers)

- services/agent-ipc-handlers.ts → [완료] AgentSessionModule + AgentSessionController
- services/preset-ipc-handlers.ts → PresetModule + PresetController
- services/mcp-ipc-handlers.ts → McpRegistryModule + McpController
- services/mcp-usage-log-ipc-handlers.ts → McpUsageModule + McpUsageController
- services/chat-ipc-handlers.ts → ChatModule(또는 ConversationModule) + Chat/ConversationController
- services/builtin-tool-ipc-handlers.ts → BuiltinToolModule + BuiltinToolController
- services/bridge-ipc-handlers.ts → BridgeModule + BridgeController

## Todo

- [x] 모듈 토대: LlmBridgeModule, McpRegistryModule, AgentCoreModule
- [x] 모듈 토대(추가): PresetModule, McpUsageModule
- [x] PresetController 추가(@EventPattern 채널/DTO), 기존 preset 서비스 이관
- [x] McpUsageController 추가, 기존 mcp-usage 서비스 이관
- [ ] McpController 추가, 기존 mcp 서비스 이관
- [ ] Chat/ConversationController 추가, 기존 chat 서비스 이관
- [ ] BuiltinToolModule/Controller 추가, 기존 builtin-tool 이관
- [ ] BridgeModule/Controller 추가, 기존 bridge 이관
- [ ] 문서 갱신: GUI_IPC_AND_SERVICES.md, ELECTRON_MCP_IPC_SPEC.md 채널/스키마 반영
- [ ] 테스트: 컨트롤러 단위/통합 + 전송 계층 유닛(프레임 왕복/취소/에러)
- [ ] services/\* 점진 제거 및 호출부 정리

## 작업 순서(Phase)

1. **Preset/MCP Usage (빠른 수확)**
   - PresetController, McpUsageController 구현 → 렌더러 경로 1차 이관
2. **MCP Registry/Bridge**
   - McpController, BridgeController 구현 → 브릿지/툴 경로 준비
3. **Chat/Conversation**
   - Chat/ConversationController 구현 → 세션/대화 경로 이관
4. **정리/검증**
   - 문서/테스트 보강, 기존 services 제거, 채널 네임스페이스 일관화

## 테스트 전략

- 단위: 컨트롤러 메서드(리포/레지스트리 mock) 입력→출력 검증
- 통합: Nest TestingModule + ElectronEventTransport mock으로 req/res/err/nxt/end/can 흐름 검증
- E2E(선택): 렌더러에서 프레임 전송으로 주요 채널 호출 smoke 테스트

## 네이밍/버저닝

- 채널/용어는 공용 문서 참조: `apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`
- 프레임 메서드: nxt 프레임에 `method` 포함(렌더러 RxJS demux 용)
- 스펙 버전: rpcSpecVersion 0.2 (문서 반영)

## 리스크/완화

- 병행 기간 중 두 경로 혼재 → 채널 충돌 방지(네임스페이스 분리), 점진 스위치
- 파일 기반 I/O 에러 → CoreError 매핑 통일, 상세 메시지/코드 유지
- 퍼포먼스: 고빈도 이벤트(MessagePort 최적화)는 후속 작업으로 분리

## 산출물

- 모듈/컨트롤러 소스(도메인별)
- 채널/DTO 스키마(class-validator/ValidationPipe on main, zod 가드 on renderer) 및 문서 업데이트
- Jest 테스트(단위/통합)
- 서비스 제거 커밋 및 릴리즈 노트

---

작성자: GUI Main 아키텍처 팀

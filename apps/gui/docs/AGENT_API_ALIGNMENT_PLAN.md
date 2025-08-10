# 작업계획서: GUI Agent API 정합화 및 리팩토링

## Requirements

### 성공 조건

- [x] Electron main ↔ preload ↔ renderer 간 통신 인터페이스가 `apps/gui/src/shared/types/agentos-api.ts`, `ipc-channel.ts` 스펙과 1:1 일치한다.
- [x] 도메인별 IPC 핸들러가 main 프로세스에 분리/등록되어 있다(`agent`, `builtinTool`, `mcp`, `preset`, `mcpUsageLog`, `bridge`).
- [x] renderer의 IpcChannel(ElectronIpcChannel)과 서비스 계층이 스펙에 맞춰 호출명/시그니처가 정렬되어 있다.
- [x] 기존 컴포넌트/훅은 호환 어댑터(alias/임시 ChatService)로 컴파일이 유지된다.
- [x] 전체 리포지토리 타입체크 통과(`pnpm -r typecheck`).
- [x] agent:chat/endSession IPC가 최소 mock 응답으로 동작한다.

### 사용 시나리오

- GUI가 Electron 환경에서 실행될 때 renderer는 `window.electronAPI`를 통해 스펙과 동일한 네임스페이스로 main과 통신한다.
- MCP 툴/사용량, 프리셋, 브리지, 에이전트(메타/채팅)가 서비스 계층을 통해 일관된 메서드명으로 호출된다.
- 개발자는 MockIpcChannel로 테스트 환경에서도 동일한 인터페이스를 사용할 수 있다.

### 제약 조건

- 실제 LLM/Agent 연동은 후속 단계에서 진행. 현재는 최소 mock 응답으로 agent:chat 구현.
- 기존 코드와의 호환을 위해 일시적으로 alias/어댑터를 유지한다(후속 제거 예정).

## Interface Sketch

```typescript
// apps/gui/src/shared/types/ipc-channel.ts 핵심 일부
export interface AgentProtocol {
  chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult>;
  endSession(agentId: string, sessionId: string): Promise<void>;
  getAgentMetadata(id: string): Promise<AgentMetadata | null>;
  getAllAgentMetadatas(): Promise<AgentMetadata[]>;
  updateAgent(agentId: string, agent: Partial<Omit<AgentMetadata, 'id'>>): Promise<AgentMetadata>;
  createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata>;
  deleteAgent(id: string): Promise<AgentMetadata>;
}

export interface LlmBridgeProtocol {
  registerBridge(config: LlmManifest): Promise<{ success: boolean }>;
  unregisterBridge(id: string): Promise<{ success: boolean }>;
  switchBridge(id: string): Promise<{ success: boolean }>;
  getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null>;
  getBridgeIds(): Promise<string[]>;
  getBridgeConfig(id: string): Promise<LlmManifest | null>;
}

export interface McpUsageLogProtocol {
  getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;
  getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;
  getUsageStats(clientName?: string): Promise<McpUsageStats>;
  getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse>;
  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]>;
  clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse>;
  setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse>;
  subscribeToUsageUpdates(callback: (event: McpUsageUpdateEvent) => void): Promise<() => void>;
}
```

## Todo

- [x] 계획서 작성 및 커밋
- [x] preload를 AgentOsAPI 스펙 구조로 재작성
- [x] main IPC 핸들러 도메인 분리(`agent`, `builtinTool`, `mcpUsageLog`, `bridge` 정합화)
- [x] renderer IpcChannel(ElectronIpcChannel) 스펙 정렬
- [x] 서비스 계층 정리 + 호환 alias 제공(`BridgeService`, `McpService`, `PresetService`)
- [x] BuiltinToolService 추가, McpUsageLogService 사용
- [x] MockIpcChannel을 스펙에 맞게 전면 교체
- [x] 컴포넌트/훅 호출 정리(MCP 사용량, 프리셋, 타입 보완)
- [x] agent:chat/endSession 임시 동작 구현(main)
- [x] 타입체크 통과 확인(`pnpm -r typecheck`)
- [x] 호환 alias 제거 및 호출부 일괄 전환(services/컴포넌트/훅/스토어)
- [ ] 실제 Agent/Bridge/ChatManager 연동 (main):
  - [ ] 현재 활성 LLM Bridge 주입(getBridgeManager)
  - [ ] `McpRegistry` 싱글톤 초기화
  - [ ] `FileBasedChatManager`(userData/sessions) + `NoopCompressor` 초기화
  - [ ] `SimpleAgent` 생성 및 `agent:chat/end-session` 연동
  - [ ] 브릿지 없음 시 우아한 폴백(에코)
- [ ] Mock 채널 보강(테스트 데이터 주입/조회 유틸):
  - [ ] 브릿지/프리셋/에이전트 시드 유틸 추가 및 사용 예시
  - [ ] 간단한 시나리오용 메시지 모의 응답
- [ ] 문서 업데이트(개발 가이드/테스트 가이드 보강)

## 작업 순서

1. 계획 수립 및 문서화(본 문서) → 성공 조건/범위 명확화
2. preload/API 정합화 → renderer 노출 구조 일치
3. main IPC 도메인 분리 및 브리지 네이밍/시그니처 정합화
4. renderer IpcChannel/서비스 계층 정렬 + 호환 alias 제공
5. 컴포넌트/훅 최소 수정으로 빌드 유지, Mock 채널 스펙화
6. agent:chat/endSession 최소 구현(에코 응답)으로 Agent API 경로 검증
7. 타입체크·동작 점검 및 후속 과제(실연동/alias제거) 티업

```bash
# 검증 명령어
pnpm -r typecheck
```

# Agent Architecture (SSOT + Session-first)

본 문서는 AgentOS 코어의 에이전트/세션 아키텍처를 정리하고, 실제 코드에서 바로 참고 가능한 인터페이스 초안을 제시합니다. 목표는 각 Agent를 SSOT(Single Source of Truth)로 두고, 세션 중심 DX를 강화하면서도 저장소/정책/오케스트레이션을 느슨하게 결합하는 것입니다.

## 목표
- 단일 책임: 메타 영속화와 런타임 오케스트레이션을 분리
- 세션 우선: 대화/툴호출/입력요청/취소/타임아웃은 세션의 일급 책임
- SSOT: Agent(Runtime)가 상태의 단일 출처, 모든 변경은 이벤트로 반응적 전파
- 포트-어댑터: LLM/MCP/Storage는 인터페이스 뒤로 캡슐화하여 교체 용이
- 호환성: 기존 `AgentManager`/`SimpleAgentManager`는 유지하되 내부 위임으로 점진 전환

## 구성요소 개요
- Agent(Runtime): 실행 정책/의존성/상태 전이/세션 생성, 변경 이벤트 소스(SSOT)
- AgentSession: 개별 세션 상태기계. 대화/툴호출/동의/입력요청/취소/타임아웃 관리
- AgentMetadataRepository: 에이전트 메타데이터의 영속화/검색 추상화
- AgentFactory: 메타데이터(+프리셋)로 런타임 Agent 조립
- SessionService: 세션 수명주기/조회/교차-에이전트 인덱싱(선택, 앱 레벨)
- AgentService(Facade): 외부 API 표면. Repository/Factory/Session 조합을 묶어 제공
- EventBus(옵션): 중앙 이벤트 브로드캐스트. Electron IPC/GUI용으로 활용

아래 인터페이스들은 `packages/core/src` 내 기존 타입들과 호환되도록 설계되었습니다. 필요 시 점진적으로 확장 가능합니다.

---

## 핵심 인터페이스 초안

> 참고: 아래 타입들은 이미 존재하는 코어 타입을 사용합니다.
> - `Agent`, `AgentSession`, `AgentStatus`, `AgentExecuteOptions`, `AgentChatResult`, `ReadonlyAgentMetadata`, `AgentMetadata`, `CreateAgentMetadata`
> - `CursorPagination`, `CursorPaginationResult`
> - `UserMessage`

### AgentMetadataRepository (영속화 전용)
```ts
import type { AgentMetadata, CreateAgentMetadata } from '../agent/agent-metadata';
import type { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';
import type { AgentStatus } from '../agent/agent';

export interface AgentSearchQuery {
  keywords?: string[];
  status?: AgentStatus;
  name?: string;
  description?: string;
}

export type Unsubscribe = () => void;

export interface AgentMetadataRepository {
  get(id: string): Promise<AgentMetadata | null>;
  list(pagination?: CursorPagination): Promise<CursorPaginationResult<AgentMetadata>>;
  search(query: AgentSearchQuery, pagination?: CursorPagination): Promise<CursorPaginationResult<AgentMetadata>>;
  create(meta: CreateAgentMetadata): Promise<AgentMetadata>;
  update(
    id: string,
    patch: Partial<AgentMetadata>,
    options?: { etag?: string; expectedVersion?: string }
  ): Promise<AgentMetadata>;
  delete(id: string): Promise<void>;

  // 선택: 변경 이벤트를 노출하여 GUI 인덱스/캐시 갱신에 활용
  on?(event: 'changed' | 'deleted', handler: (p: { id: string; version?: string }) => void): Unsubscribe;
}
```

구현 예시: `FileAgentMetadataRepository`, `SqliteAgentMetadataRepository`, `HttpAgentMetadataRepository`, `CompositeAgentMetadataRepository(remote-first/local-first/dual-write)`

참고: `AgentMetadata`는 `version`(string, optional)을 포함합니다. 저장소는 `create` 시 초기값을 설정하고, `update` 성공 시 새로운 `version`을 반환하여 런타임 SSOT가 최신 버전을 보유하도록 합니다. `expectedVersion` 불일치 시 저장소는 충돌 오류를 발생시켜 클라이언트가 재시도/병합 전략을 선택할 수 있게 합니다. 버전 문자열은 ETag와 유사한 opaque 토큰으로 취급하며, 정렬/비교는 동등성(equality) 기반을 권장합니다.

### AgentFactory (런타임 조립)
```ts
import type { Agent } from '../agent/agent';
import type { ReadonlyAgentMetadata } from '../agent/agent-metadata';

export interface AgentFactory {
  build(meta: ReadonlyAgentMetadata): Promise<Agent>;
}
```

- 내부에서 LLM Bridge, MCP Registry, ChatManager를 주입받아 `SimpleAgent` 또는 향후 커스텀 Agent 구현을 생성합니다.

### SessionService (선택: 앱 레벨 세션 매니저)
```ts
import type { AgentSession } from '../agent/agent-session';
import type { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';
import type { MessageHistory } from '../chat/chat-session';
import type { UserMessage } from 'llm-bridge-spec';

export interface SessionListItem {
  id: string; // sessionId
  agentId: string;
  updatedAt: Date;
  title?: string;
  status?: 'idle' | 'running' | 'waiting-input' | 'terminated' | 'error';
}

export interface SessionService {
  create(agentId: string, options?: { sessionId?: string; presetId?: string }): Promise<AgentSession>;
  get(sessionId: string): Promise<AgentSession>;
  list(options?: { agentId?: string; pagination?: CursorPagination }): Promise<CursorPaginationResult<SessionListItem>>;
  chat(
    sessionId: string,
    input: UserMessage | UserMessage[],
    options?: { abortSignal?: AbortSignal; timeout?: number }
  ): Promise<Readonly<MessageHistory>[]>;
  terminate(sessionId: string): Promise<void>;
}
```

- 내부적으로 `Agent.createSession()`을 사용하여 세션을 생성/캐시합니다.
- 교차-에이전트 세션 인덱싱/동시성 제어/브로드캐스트가 필요 없으면 생략해도 됩니다.

### AgentService (Facade, 외부 표면)
```ts
import type { Agent } from '../agent/agent';
import type { AgentSession } from '../agent/agent-session';
import type { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';
import type { AgentExecuteOptions, AgentChatResult } from '../agent/agent';
import type { UserMessage } from 'llm-bridge-spec';
import type { AgentSearchQuery } from './AGENT_ARCHITECTURE';

export interface AgentService {
  // 조회/검색
  getAgent(agentId: string): Promise<Agent | null>;
  listAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>>;
  searchAgents(query: AgentSearchQuery, pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>>;

  // 세션 중심 DX
  createSession(agentId: string, options?: { sessionId?: string; presetId?: string }): Promise<AgentSession>;
  execute(agentId: string, messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentChatResult>; // 편의 함수
}
```

- 구현은 내부적으로 `AgentMetadataRepository + AgentFactory (+ SessionService)`를 조합합니다.
- 기존 `AgentManager`와 유사하나, 세션 중심 메서드에 초점. 구식 API는 AgentService 내부 위임으로 계속 지원 가능합니다.

### Agent 이벤트(SSOT 반응성)
```ts
import type { AgentStatus, Agent } from '../agent/agent';
import type { AgentMetadata } from '../agent/agent-metadata';

export type AgentEvent =
  | { type: 'statusChanged'; agentId: string; status: AgentStatus }
  | { type: 'metadataUpdated'; agentId: string; patch: Partial<AgentMetadata> }
  | { type: 'sessionCreated'; agentId: string; sessionId: string }
  | { type: 'sessionEnded'; agentId: string; sessionId: string; reason?: string }
  | { type: 'error'; agentId: string; error: Error };

export type Unsubscribe = () => void;

export interface AgentEventSource {
  on(handler: (event: AgentEvent) => void): Unsubscribe;
}

// 향후(선택) Agent 런타임에 이벤트 소스 믹스인
export type EventfulAgent = Agent & AgentEventSource;
```

- Electron 메인 프로세스에서 에이전트 이벤트를 구독 → 중앙 EventBus → IPC로 렌더러에 브로드캐스트하는 패턴을 권장합니다.

---

## 적용 가이드

### v1 (점진 도입)
- `AgentMetadataRepository` 인터페이스 도입 및 파일/HTTP 스텁 구현
- `AgentService` 스켈레톤 추가, 기존 `AgentManager`는 내부 위임으로 유지
- `SimpleAgentManager` 버그 수선
  - 비동기 필터에 `await` 적용 (`getAvailableAgents`, `getActiveAgents`)
  - `endAgentSession`에서 `as any` 제거
  - `Agent` 인터페이스의 `isIdle()` 중복 선언 정리

### v2 (세션 중심 강화)
- `SessionService` 도입(필요 시), 교차-에이전트 세션 인덱싱/동시성 제어
- `Agent` 이벤트(SSOT) 추가 및 `SimpleAgent`에서 상태 전이/세션 생성/종료 이벤트 발행

### v3 (정리)
- 레포 전역을 `AgentService`/세션 중심 호출로 전환
- 구식 API(`AgentManager`)를 deprecated 처리 후 제거

---

## Electron/React 통합 팁
- 메인: `Map<agentId, Agent>` 보관, Agent 이벤트를 중앙 EventBus로 수집 후 IPC 채널(`agent/change`, `agent/<id>/session/<sid>/message`)로 브로드캐스트
- 렌더러: IPC 구독 → 상태 라이브러리(Zustand/Jotai/RxJS) 반영. 액션은 IPC로 메인에 의도 전달
- 스트리밍/백프레셔: 토큰 스트림은 샘플링/배치 전송, 중요 이벤트는 즉시 보장

---

## 비고
- 본 문서의 인터페이스는 “설계 기준선”입니다. 실제 구현 시 현재 코드(`SimpleAgent`, `DefaultAgentSession`, `ChatManager`, `McpRegistry`, `PresetRepository`)와의 접점을 유지하면서 점진적으로 적용하세요.
- 타입 안전성 원칙(Any 금지, 구체 타입/가드 활용)을 준수하고, 변경 시 테스트(`packages/core/src/**/__tests__`)를 우선 보강하는 것을 권장합니다.

# Agent Manager 계층 제거 및 Service 통합 계획서 (v1)

## Requirements

### 성공 조건

- [ ] `packages/core/src/agent/agent-manager.ts`, `simple-agent-manager.ts` 제거 및 빌드/테스트 통과
- [ ] `AgentService`가 매니저 없이 생성/조회/검색/세션/실행을 모두 제공
- [ ] 기존 호출부(CLI/GUI/main)가 `AgentManager` 참조 없이 `AgentService`만 사용
- [ ] 단위/통합 테스트가 서비스 중심으로 통과 (매니저 의존 테스트 제거/갱신)

### 사용 시나리오

- [ ] GUI/CLI가 `AgentService.createAgent/getAgent/listAgents/createSession/execute`만으로 에이전트를 관리/호출
- [ ] 세션 중심 DX: `createSession()` 후 세션 객체 사용, 혹은 `execute()` 단발 호출

### 제약 조건

- [ ] 타입 안전성 유지(any 금지), zod/구체 타입/가드 적극 사용
- [ ] 파일 기반 저장소(AgentMetadataRepository, ChatManager 등)와 레지스트리(McpRegistry, LlmBridgeRegistry) 연동 유지
- [ ] 퍼포먼스: 대량 목록 조회 시 페이징/캐시 고려

## Interface Sketch

```ts
// packages/core/src/agent/agent.service.ts
export interface AgentService {
  createAgent(agent: CreateAgentMetadata): Promise<Agent>;
  getAgent(agentId: string): Promise<Agent | null>;
  listAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>>;
  searchAgents(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Agent>>;
  createSession(
    agentId: string,
    options?: { sessionId?: string; presetId?: string }
  ): Promise<AgentSession>;
  execute(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult>;
}

// 최종 구현: AgentManager 제거 후, 레포/레지스트리/채팅 관리자를 직접 사용
export class SimpleAgentService implements AgentService {
  /* 매니저 제거 후 구현 */
}

// 에이전트 팩토리(선택): 목록/검색 시 Agent 인스턴스 생성 일관성 보장
export interface AgentFactory {
  make(id: string): Promise<Agent>;
}
```

## 리팩토링 방향 (커밋 5eb60ce3 기준 분석)

- 5eb60ce3에서 `AgentService` 인터페이스가 도입되었고, `SimpleAgentService`는 아직 `AgentManager`에 위임하고 있음
- 목표: `SimpleAgentService`가 `AgentManager` 없이 다음을 직접 수행
  - Agent 인스턴스 생성: `SimpleAgent`와 레포지토리/레지스트리 주입으로 완결
  - 목록/검색: `AgentMetadataRepository`를 통해 ID/메타 조회 → `AgentFactory`로 Agent 인스턴스화 → 페이징/필터링
  - 세션/실행: `SimpleAgent`의 `createSession/chat` 호출로 일원화

## Todo

- [ ] AgentFactory 도입(또는 SimpleAgentService 내부 프라이빗 생성자)로 Agent 인스턴스 생성 일원화
- [ ] SimpleAgentService에서 `AgentManager` 의존성 제거 및 레포/레지스트리/ChatManager 직접 사용
- [ ] list/search 구현을 `AgentMetadataRepository` 기반으로 재작성(페이징 + in-memory 필터 보완)
- [ ] execute 구현을 `getAgent().chat()` 호출로 통일(옵션 전달 포함)
- [ ] createSession 구현을 `getAgent().createSession()` 호출로 통일
- [ ] 패키지 내 `agent-manager.ts`, `simple-agent-manager.ts` 제거 및 export 정리
- [ ] 영향 범위 호출부(CLI/GUI)에서 `AgentManager` import 제거, `AgentService`로 대체
- [ ] 테스트 갱신: 매니저 기반 테스트 제거 → 서비스/에이전트 조합 테스트로 교체
- [ ] 문서 업데이트: 매니저 계층 제거 및 서비스 중심 아키텍처 명시

## 작업 순서

1. **서비스 핵심 구현**: SimpleAgentService에서 매니저 의존 제거, 팩토리/헬퍼로 Agent 생성 일원화
2. **목록/검색 경로**: Repository 기반 list/search 구현, 페이징/필터 로직 보강
3. **세션/실행 통합**: execute/createSession를 Agent 메서드 호출로 단순화
4. **호출부 이관**: CLI/GUI에서 AgentManager import 제거, AgentService 주입 사용
5. **삭제/정리**: agent-manager.ts, simple-agent-manager.ts 제거, barrel/export 수정
6. **테스트/문서**: 단위/통합/E2E 갱신, 아키텍처 문서 업데이트

## 추가 고려사항

- 캐시 전략: `getAgent(id)` 시 인스턴스 캐시(Map) 유지, 메타 변경 이벤트 시 무효화
- 에러 정책: CoreError로 통일(도메인/코드 포함)
- DI 구성: 서비스/레포/레지스트리/ChatManager를 명시 주입하여 순환참조 방지
- 성능: search 기본은 in-memory 필터이나, 메타데이터 레포에 인덱스/쿼리 추가 여지 남김

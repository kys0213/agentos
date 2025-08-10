# Chat → Agent API Refactor Plan

## Requirements

### 성공 조건

- [ ] `ChatService` 및 관련 export 제거(`bootstrap`, `services/index`, hooks) 및 빌드 오류 없음
- [ ] `bootstrap.ts`에서 `ChatService` 생성·등록 제거, `AgentService` 기반 구성 유지
- [ ] 채팅 플로우가 `AgentService.chat`/`IpcAgent`를 통해 동작하도록 교체
- [ ] 세션 생성/로드/삭제, 메시지 조회·송신이 Agent API(+필요한 IPC 확장)로 대체
- [ ] any 사용 금지, 기존 타입(`@agentos/core`의 Agent/MessageHistory 등) 활용
- [ ] React Query 훅(`use-chat-sessions.ts`, `useChatSession.ts`)을 Agent 기반으로 대체/통합
- [ ] 문서·주요 컴포넌트(ChatView/ChatHistory)에서 참조하는 인터페이스 불일치 없음

### 사용 시나리오

- 사용자: 새 대화를 시작 → 기본(또는 선택) 에이전트로 세션 생성 → 메시지 전송 → 응답 표시
- 사용자: 기존 세션 목록 조회 → 세션 선택 → 히스토리 로딩 → 이어서 대화
- 사용자: 세션 삭제 → 목록/히스토리 갱신
- 멘션: 입력 중 특정 에이전트 멘션 시 해당 에이전트로 `chat` 호출; 멘션 없으면 기본/활성 에이전트 사용

### 제약 조건

- UI 구조/스타일 변경 최소화 (기능 대체가 목적)
- `any` 금지, 구체 타입 사용(타이핑 지침 준수)
- 기존 Agent IPC 스펙에 없는 세션/히스토리 기능은 안전하게 확장(하위호환 유지)
- PR 병합 전 직접 merge 금지(가이드 준수), TODO별 커밋

## Interface Sketch

현재 Renderer는 임시 `ChatService`에 의존하고 있으나, Agent 중심 구조로 전환 필요.

1. IPC 확장(메인 프로세스 노출 필요): `AgentProtocol` 또는 별도 `ConversationProtocol`

```ts
// apps/gui/src/shared/types/ipc-channel.ts (확장 초안)
export interface ConversationProtocol {
  // 세션
  listSessions(pagination?: CursorPagination): Promise<CursorPaginationResult<ChatSessionMetadata>>;
  getSessionMetadata(sessionId: string): Promise<ChatSessionMetadata | null>;
  deleteSession(sessionId: string): Promise<{ success: boolean }>;

  // 메시지
  getMessages(
    sessionId: string,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>>;
}

export interface IpcChannel extends AgentProtocol, /* ... */, ConversationProtocol {}
```

2. Renderer 서비스: `AgentService`만 사용. 필요한 경우 얇은 어댑터 추가

```ts
// 새 어댑터(필요시): AgentConversationService
export class AgentConversationService {
  constructor(
    private readonly ipc: IpcChannel,
    private readonly agentService: AgentService
  ) {}

  async createOrLoadSession(agentId: string, sessionId?: string) {
    // sessionId 없으면 첫 chat 호출로 세션 생성
    const seed: UserMessage[] = [];
    const result = await this.agentService.chat(agentId, seed, { sessionId });
    return result.sessionId;
  }

  async send(agentId: string, sessionId: string, messages: UserMessage[]) {
    return await this.agentService.chat(agentId, messages, { sessionId });
  }

  async listSessions() {
    return this.ipc.listSessions();
  }

  async getMessages(sessionId: string) {
    return this.ipc.getMessages(sessionId);
  }

  async deleteSession(sessionId: string) {
    return this.ipc.deleteSession(sessionId);
  }
}
```

3. 훅 교체/수정

```ts
// use-chat-sessions.ts 대체 초안
export const useAgentSessions = () => {
  const svc = Services.getAgent();
  // 필요시 AgentConversationService 인스턴스 구성
  // return useQuery({ queryKey: ['sessions'], queryFn: () => conversation.listSessions() })
};

// useChatSession.ts 대체 초안
export interface UseAgentChat {
  sessionId: string | null;
  messages: Readonly<MessageHistory>[];
  start(agentId: string, presetId?: string): Promise<string>;
  send(agentId: string, text: string, mentions?: string[]): Promise<void>;
  isLoading: boolean;
}
```

## Todo

- [ ] 코드 참조점 정리: `ChatService` 사용처 모두 식별 및 대체 전략 확정
- [ ] IPC 스펙 확장 설계: 세션/메시지 조회·삭제 API 정의 (메인 구현 포인트 명시)
- [ ] `bootstrap.ts`에서 `ChatService` 생성·등록 제거 및 반환 타입 정리
- [ ] `services/index.ts`에서 `ChatService` export 제거 및 대체 서비스 노출
- [ ] 새 어댑터 `AgentConversationService`(필요시) 추가, `AgentService`와 결합
- [ ] 훅 마이그레이션: `use-chat-sessions.ts`, `useChatSession.ts` → Agent 기반 훅으로 교체
- [ ] 컴포넌트 점검: `ChatView`, `ChatHistory`에서 새 훅/서비스 사용하도록 연결
- [ ] 타입 정리: any 제거, 인터페이스/타입 구체화, IPC 타입 보강
- [ ] 문서 업데이트: AGENTS 가이드/로직 흐름도와 일치하도록 docs 보완
- [ ] 테스트: 최소 단위(서비스/훅) + 통합(간단 상호작용 경로) 작성

## 작업 순서

1. 설계 고도화 및 승인: IPC 확장 범위·어댑터 여부 최종 확정(완료 조건: 본 문서 리뷰 승인)
2. Bootstrap/Export 정리: `ChatService` 제거, 빌드 통과(완료 조건: 빌드 성공, 죽은 참조 없음)
3. IPC 확장 구현: 메인/프리로드/타입 정의 연결(완료 조건: 세션/메시지 API 통신 OK)
4. 서비스/어댑터 구현: `AgentConversationService` 도입 및 단위 테스트(완료 조건: send/list 동작)
5. 훅 마이그레이션: 새 훅으로 교체, 기존 훅 제거(완료 조건: 컴파일 성공, 기본 경로 작동)
6. 컴포넌트 연결: `ChatView`/`ChatHistory` 데이터 연동(완료 조건: 조회/전송/갱신 작동)
7. 리팩 마감: 문서/테스트/타입 검증 정리(완료 조건: lint/typecheck/test/build 통과)

## Affected Files (초안)

- apps/gui/src/renderer/bootstrap.ts
- apps/gui/src/renderer/services/index.ts
- apps/gui/src/renderer/services/agent.service.ts
- apps/gui/src/renderer/services/ipc-agent.ts
- apps/gui/src/renderer/hooks/queries/use-chat-sessions.ts (대체/제거)
- apps/gui/src/renderer/hooks/useChatSession.ts (대체/제거)
- apps/gui/src/renderer/components/chat/ChatView.tsx
- apps/gui/src/renderer/components/chat/ChatHistory.tsx
- apps/gui/src/shared/types/ipc-channel.ts (IPC 확장)

## Note

- 초기 단계에서는 `AgentConversationService`를 도입해 UI 수정 최소화하고, 추후 `AgentService` API에 세션 관련 고수준 메서드 통합을 고려합니다.
- 멘션 처리/다중 에이전트 라우팅은 후속 과제로 분리 가능(본 PR 범위는 ChatService 제거 및 Agent 기반 치환까지).

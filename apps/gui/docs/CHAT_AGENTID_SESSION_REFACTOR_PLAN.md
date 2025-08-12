# Chat React Query + Container 리팩터링 계획서 (agentId = sessionId)

## 목표

- Chat 도메인에 `React Query + Container` 패턴 적용
- `sessionId`는 별도 저장소 없이 `agentId`로 동일시하여 단일 스레드 = 단일 에이전트 구조 구현
- `ChatService` 사용 금지. 대신 `AgentService.chat`을 직접 사용하거나 얇은 어댑터/훅에서 래핑
- 멘션은 선택적(있는 경우 멘션된 에이전트로 라우팅). 기본은 현재 선택된 `agentId` 사용

## 성공 조건

- 좌측 히스토리: 에이전트 목록 기반으로 스레드 선택(`selectedAgentId`)
- 본문: `selectedAgentId`의 메시지 리스트가 React Query 캐시에서 렌더
- 전송: `AgentService.chat` 호출, 성공 시 캐시에 사용자/응답 메시지 append
- 문서, 타입, 린트, 빌드 오류 0개

## 인터페이스 설계 (요약)

```ts
// hooks/queries/use-chat.ts (신규)
export const CHAT_QUERY_KEYS = {
  mentionableAgents: ['chat', 'mentionableAgents'] as const,
  activeAgents: ['chat', 'activeAgents'] as const,
  history: (agentId: string) => ['chat', 'history', agentId] as const,
};

export function useMentionableAgents();
export function useActiveAgents();
export function useChatHistory(agentId: string);
export function useSendChatMessage(agentId: string);
```

```tsx
// components/chat/ChatViewContainer.tsx (신규)
// - selectedAgentId 상태 관리
// - useMentionableAgents/useActiveAgents/useChatHistory/useSendChatMessage 결합
// - ChatView에 데이터/콜백 전달
```

```diff
// components/chat/ChatView.tsx (리팩터)
- 내부 mock messages/state 제거
- props: { messages, mentionableAgents, activeAgents, selectedAgentId, onSelectAgent, onSendMessage }
```

## 구현 원칙

- 세션 = 에이전트: `sessionId` 대신 `agentId`를 키로 사용해 캐시/렌더 통일
- 서비스 접근은 `ServiceContainer.getOrThrow('agent')` 경유
- `ChatService` 및 관련 참조 제거(사용 금지)
- 타입 안전: `@agentos/core`의 타입만 사용, any 금지

## 작업 항목 (TODO)

### Phase 1: 서비스/훅 기반 구축

1. hooks 생성: `use-chat.ts`

- mentionable/active agents 쿼리 추가
- history 쿼리(초기 빈 배열), send 뮤테이션(캐시 append) 추가

2. fetchers 보완: `services/fetchers/chat.ts`

- `sendMessage(agentId, text, mentions?)`에서 `AgentService.chat` 호출
- `fetchMentionableAgents`/`fetchActiveAgents`는 현 구조 유지(필터 확정)

3. 불용 파일 제거: `services/chat.service.ts`

### Phase 2: 컨테이너 생성 및 연결

4. `ChatViewContainer.tsx` 신설: 상태(selectedAgentId) + 훅 결합 + `ChatView`에 전달

5. `ChatView.tsx` 리팩터: mock 제거, props 기반 렌더

6. (옵션) `ChatInterfaceContainer.tsx` 추가 및 `ChatInterface.tsx` 경량화

### Phase 3: 정리 및 테스트

7. 타입/린트/빌드 통과, 간단 상호작용 테스트 작성/수정

## 커밋 계획 (GIT_WORKFLOW_GUIDE 준수)

- ✅ [TODO 1/7] 계획서 추가 및 기준 합의 반영 (본 커밋)
- ✅ [TODO 2/7] 불필요한 `chat.service.ts` 제거 및 참조 정리
- ✅ [TODO 3/7] `use-chat.ts` 훅 뼈대 구현(쿼리키/인터페이스 포함)
- ✅ [TODO 4/7] `ChatViewContainer.tsx` 생성 및 기본 연결
- ✅ [TODO 5/7] `ChatView.tsx`를 컨테이너 주입형으로 리팩터(목 데이터 제거)
- ✅ [TODO 6/7] `fetchers/chat.ts`에서 `AgentService.chat` 연동
- ✅ [TODO 7/7] 품질 검증(lint/typecheck/build/test)

## 참고 문서

- `apps/gui/docs/CHAT_REACTQUERY_CONTAINER_PLAN.md`
- `apps/gui/docs/CHAT_TO_AGENT_REFACTOR_PLAN.md`
- `apps/gui/docs/GUI_IPC_AND_SERVICES.md`
- `docs/GIT_WORKFLOW_GUIDE.md`

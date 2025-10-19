# Agent Chat Result 구조 개편 계획서

> **Epic Branch:** `feature/bundled-llm-bridges-plan`
> **Working Branch:** `feature/agent-chat-result-restructure`

## 요구사항

- [ ] `AgentChatResult`가 사용자 입력 메시지를 포함하지 않고, LLM이 생성한 새 메시지만 반환한다.
- [ ] 코어(`SimpleAgent`, `ChatSession` 등)가 `output`(신규 메시지)과 `history`(세션 기록)를 명확히 분리한다.
- [ ] GUI/CLI 등 상위 모듈은 사용자 메시지를 중복 렌더링하지 않고, 새 응답만 반영한다.

## 배경 / 문제

- 현재 `AgentChatResult.messages`에는 호출 시 전달된 사용자 메시지가 그대로 포함돼, 프런트에서 optimistic update로 추가한 사용자 메시지가 중복 표시된다.
- 서버도 사용자 메시지를 다시 append하지 않도록 필터링을 추가로 해 줘야 한다.
- “생성된 응답”과 “히스토리”를 분리하면 UI/백엔드 모두 로직이 단순해지고, 향후 히스토리 페이징 등 확장도 수월하다.

## 인터페이스 초안

```ts
export interface AgentChatResult {
  output: Message[];              // 이번 호출에서 새로 생성된 assistant/tool 메시지
  sessionId: string;
  history?: MessageHistory[];     // 필요 시 현재 히스토리 스냅샷
}
```

### 변경 영향

- 코어: `AgentChatResult` 타입 정의, `SimpleAgent.chat`, `ChatSession`, `AgentService`
- GUI 서버: `AgentSessionService`, `ChatService`, 멀티 에이전트 조정 로직
- 클라이언트: `useSendChatMessage`, 채팅 UI, CLI 소비자
- 테스트 및 E2E 흐름

## TODO

- [ ] 코어 공통 타입 정리  
  - [ ] `AgentChatResult`를 `output`/`history` 구조로 변경 (breaking change 명시)  
  - [ ] 관련 Zod 스키마/contract 업데이트
- [ ] 코어 구현 리팩터링  
  - [ ] `SimpleAgent.chat` / `SimpleAgentSession`이 `output`만 반환하도록 수정  
  - [ ] `ChatSession.appendMessage` 호출 루틴 점검 및 필요한 경우 보강  
  - [ ] 단위 테스트 보강 (`packages/core` 내 agent/chat 관련 테스트)
- [ ] GUI/Nest 연동 수정  
  - [ ] `AgentSessionService`가 `output`만 aggregate하도록 업데이트  
  - [ ] `ChatService` 저장 방식 검증 (중복 저장 제거)  
  - [ ] 관련 E2E/통합 테스트 시나리오 갱신
- [ ] 클라이언트 적용  
  - [ ] `useSendChatMessage` 및 대화 UI에서 새 contract 소비  
  - [ ] CLI 명령/기타 소비자 재검증  
  - [ ] 회귀 테스트 및 QA 체크리스트

## 작업 순서 초안

1. **Contract 준비**: 코어 타입/스키마/생성자 시그니처 변경, 컴파일/테스트 통과 확인  
2. **코어 구현**: SimpleAgent & ChatSession 리팩터링, 단위 테스트 추가  
3. **GUI 백엔드**: AgentSessionService/ChatService 정리, 저장/이벤트 로직 검증  
4. **프런트/CLI**: 훅, 컴포넌트, CLI 명령 등 소비자 업데이트  
5. **검증**: 단위/통합/E2E 테스트, 문서 갱신, 마이그레이션 노트 작성

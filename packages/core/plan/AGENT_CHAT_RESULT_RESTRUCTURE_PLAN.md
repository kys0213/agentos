# Agent Chat Result 구조 개편 계획서

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

- [ ] `AgentChatResult` 타입 변경 및 코어 구현 리팩터링
- [ ] `SimpleAgent`가 LLM 응답만 `output`에 담고, 히스토리는 내부 저장으로 한정
- [ ] `AgentSessionService`와 연동 서비스가 `output`만 UI/세션에 전달하도록 조정
- [ ] GUI/CLI/테스트 업데이트 및 회귀 검증

## 작업 순서 초안

1. 코어에서 `output`/`history` 구조 도입 및 관련 로직 정리
2. GUI 서버(`AgentSessionService`, `ChatService`)가 새 구조를 사용하도록 수정
3. 프런트 훅/스토어가 `output`만 append하도록 리팩터링
4. CLI, 테스트, 문서 업데이트 후 전체 테스트

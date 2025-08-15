# 채팅 컴포넌트 ReactQuery + Container 패턴 개선 계획서

## 🚨 **중요 이슈: Agent 생성 후 동기화 문제**

**현재 상황:** Agent를 생성해도 실제 채팅에 접근할 수 없는 심각한 문제

- `useAppData.ts:57` - Agent 데이터를 항상 빈 배열(`[]`)로 설정
- `App.tsx:43` - `currentAgents.length === 0` 조건으로 인해 항상 Empty State 표시
- Agent 생성 완료 후에도 실제 데이터가 반영되지 않음

## 🎯 **개선 목표**

### **Priority 1: Agent 동기화 문제 해결**

- Agent 생성 → 채팅 접근 플로우 완전 복구
- `useAppData`와 `services/fetchers/subagents.ts` 데이터 동기화
- Empty State 조건 수정

### **Priority 2: 일관된 아키텍처 적용**

- sub-agent와 동일한 ReactQuery + Container 패턴 적용
- ServiceContainer를 통한 실제 채팅 서비스 연동
- Core 타입 기반 타입 안전성 확보
- Container와 Component 분리로 재사용성 확보

## 📐 **인터페이스 설계**

### **Chat Services (새로 생성)**

```typescript
// services/fetchers/chat.ts
export async function fetchChatSessions(): Promise<ChatSessionMetadata[]>;
export async function createChatSession(agentIds: string[]): Promise<ChatSessionMetadata>;
export async function sendMessage(
  sessionId: string,
  content: string,
  mentionedAgents?: string[]
): Promise<MessageHistory>;
export async function fetchChatHistory(sessionId: string): Promise<MessageHistory[]>;
```

## 🔗 Consolidated Decisions

본 문서는 다음 계획서의 핵심 결정을 통합 반영합니다.

- Chat AgentId = SessionId 전략: 별도 세션 스토어 없이 `agentId`를 세션 식별자로 사용하여 플로우 단순화.
- ChatService 제거: 채팅 흐름은 `AgentService.chat` 또는 얇은 어댑터를 통해 수행하며, React Query 훅으로 캡슐화.
- IPC 확장 필요 시 Agent API 정합화 문서(AGENT_API_ALIGNMENT_PLAN.md)에 따라 대화 목록/히스토리 조회용 메서드를 정의하고 구현.

### **Container Components (새로 생성)**

```typescript
// ChatViewContainer.tsx - ChatView의 데이터 레이어
// ChatHistoryContainer.tsx - ChatHistory의 데이터 레이어
// ChatInterfaceContainer.tsx - ChatInterface의 데이터 레이어
```

## 📝 **Todo 리스트**

### **🚨 Phase 0: Agent 동기화 문제 해결 (최우선)**

- [ ] TODO 1: `useAppData.ts`에서 실제 Agent 데이터 로딩 구현
- [ ] TODO 2: `services/fetchers/subagents.ts`와 `useAppData.ts` 간의 데이터 동기화
- [ ] TODO 3: Agent 생성 후 `currentAgents` 상태 즉시 업데이트
- [ ] TODO 4: Empty State 조건 수정 및 Agent 생성→채팅 접근 플로우 테스트

### **Phase 1: 서비스 레이어 구축**

- [ ] TODO 5: `services/fetchers/chat.ts` 생성 - 채팅 관련 fetcher 함수들
- [ ] TODO 6: ChatService 인터페이스 정의 및 ServiceContainer 연동
- [ ] TODO 7: 채팅 관련 ReactQuery 키 및 설정 정의

### **Phase 2: Container 컴포넌트 생성**

- [ ] TODO 8: `ChatViewContainer.tsx` - ReactQuery로 agents, sessions 관리
- [ ] TODO 9: `ChatHistoryContainer.tsx` - 채팅 세션 목록 데이터 관리
- [ ] TODO 10: `ChatInterfaceContainer.tsx` - 단일 채팅 메시지 데이터 관리

### **Phase 3: 기존 컴포넌트 리팩토링**

- [ ] TODO 11: `ChatView.tsx` - Container에서 Props 받도록 변경 (Mock 데이터 제거)
- [ ] TODO 12: `ChatHistory.tsx` - Container에서 Props 받도록 변경
- [ ] TODO 13: `ChatInterface.tsx` - Container에서 Props 받도록 변경

### **Phase 4: 통합 및 테스트**

- [ ] TODO 14: Agent 생성→채팅 진입 플로우 완전 동작 확인
- [ ] TODO 15: 모든 컴포넌트 통합 테스트
- [ ] TODO 16: 타입 체크 및 린트 검사
- [ ] TODO 17: 기존 기능 보존 검증 (리팩토링 원칙 준수)

## 🔧 **작업 순서**

1. **🚨 Agent 동기화 문제 최우선 해결** (Phase 0)
2. **서비스 레이어부터 구축** (Phase 1 - Bottom-up 접근)
3. **Container 컴포넌트 생성** (Phase 2 - 데이터 로직 분리)
4. **기존 컴포넌트 점진적 개선** (Phase 3 - 기능 보존 우선)
5. **통합 테스트 및 검증** (Phase 4 - 품질 보장)

## ⚠️ **리팩토링 원칙 준수**

- **기능 보존 필수**: 기존 UI/UX는 완전히 유지
- **점진적 개선**: 한 번에 모든 것을 바꾸지 않음
- **타입 안전성**: Core 타입 우선 사용, any 금지
- **Git 워크플로우**: TODO별 의미있는 커밋 필수

## 🎯 **성공 조건**

### **Phase 0 성공 조건**

- Agent 생성 완료 후 즉시 채팅 화면 접근 가능
- `currentAgents.length > 0`일 때 올바른 ChatView 렌더링
- Empty State가 올바른 조건에서만 표시

### **전체 완료 성공 조건**

- 모든 채팅 컴포넌트가 ReactQuery + Container 패턴 적용
- ServiceContainer를 통한 실제 데이터 연동 완료
- 기존 채팅 기능 100% 보존
- 타입 안전성 확보 (any 타입 0개)
- 린트, 타입체크, 빌드 오류 0개

## 📋 **관련 파일**

### **수정 대상**

- `apps/gui/src/renderer/hooks/useAppData.ts` (Agent 데이터 로딩)
- `apps/gui/src/renderer/components/chat/ChatView.tsx`
- `apps/gui/src/renderer/components/chat/ChatHistory.tsx`
- `apps/gui/src/renderer/components/chat/ChatInterface.tsx`

### **신규 생성**

- `apps/gui/src/renderer/services/fetchers/chat.ts`
- `apps/gui/src/renderer/components/chat/ChatViewContainer.tsx`
- `apps/gui/src/renderer/components/chat/ChatHistoryContainer.tsx`
- `apps/gui/src/renderer/components/chat/ChatInterfaceContainer.tsx`

## 🚨 **주의사항**

이 계획서는 현재 사용자가 Agent를 생성해도 채팅에 접근할 수 없는 심각한 문제를 먼저 해결한 후,
체계적인 아키텍처 개선을 진행하는 순서로 구성되었습니다.

**절대 준수:** Git Workflow Guide의 TODO별 커밋 전략과 Pull Request 정책 준수 필수

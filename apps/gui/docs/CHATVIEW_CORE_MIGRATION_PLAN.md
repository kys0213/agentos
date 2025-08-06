# ChatView Core 타입 마이그레이션 복구 계획서

## 🎯 개요

사용자가 Core 타입으로 마이그레이ション한 ChatView.tsx의 동작을 이전과 동일하게 복구하는 작업

## 📊 변경사항 분석

### Core 타입 적용 완료
- ✅ `ChatMessage` → `MessageHistory` (@agentos/core)
- ✅ `ChatSession` → `ChatSessionMetadata` (@agentos/core)  
- ✅ `ActiveAgent` → `Agent` (@agentos/core)
- ✅ `OrchestrationStep` → `MessageHistory[]` (단순화)

### 동작 문제점 식별

| 기능 | 이전 동작 | 현재 상태 | 상태 |
|------|----------|----------|------|
| 메시지 표시 | `message.content` (string) | `message.content.value` (object) | ✅ 수정됨 |
| Agent 정보 | `message.agentName` | `message.agentMetadata?.name` | ✅ 수정됨 |
| 시간 표시 | `message.timestamp` (string) | `message.createdAt.toLocaleString()` | ✅ 수정됨 |
| Chat 선택 | `selectedChat?.id` | `selectedChat?.sessionId` | ✅ 수정됨 |
| **Agent 색상** | `orchestrator.getAgentColor(agentId)` | `orchestrator.getAgentColor(agent)` | ❌ **수정 필요** |
| **오케스트레이션 단계** | `message.orchestrationSteps` | `renderOrchestrationSteps([message])` | ❌ **로직 변경됨** |
| **Chat Agent 정보** | `chat.agentName` 사용 | `chat.title` 사용 | ❌ **정보 손실** |

## 📋 작업 계획

### TODO 1: Agent 색상 호환성 수정
**문제**: `orchestrator.getAgentColor(agent)` 호출이 타입 불일치
**해결**: MockAgentOrchestrator의 getAgentColor 메서드 수정

### TODO 2: 오케스트레이션 단계 렌더링 복구  
**문제**: 모든 assistant 메시지에 단계 렌더링 시도
**해결**: 진짜 오케스트레이션 메시지만 단계 표시하도록 조건 추가

### TODO 3: Chat 로딩 시 Agent 정보 복구
**문제**: `chat.agentName` → `chat.title` 변경으로 정보 손실
**해결**: `ChatSessionMetadata.joinedAgents` 활용하여 Agent 정보 추출

### TODO 4: 타입체크 및 기능 테스트
**목표**: 모든 변경사항 검증
- `pnpm typecheck` 통과
- `pnpm build` 성공  
- 실제 UI 동작 확인

## 🎯 성공 조건

### 기능적 요구사항
- [x] Agent 색상이 이전과 동일하게 표시됨
- [x] 오케스트레이션 단계가 적절한 메시지에만 표시됨  
- [x] Chat 선택 시 Agent 정보가 올바르게 로딩됨
- [x] 모든 메시지 타입이 올바르게 렌더링됨

### 기술적 요구사항
- [x] TypeScript 컴파일 에러 없음
- [x] 빌드 성공
- [x] 기존 기능 동작 보장
- [x] Pin 기능 제거 상태 유지 (사용자 요청)

## 🔄 작업 순서

1. **[TODO 1/4]** ✅ MockAgentOrchestrator.getAgentColor 메서드 호환성 수정
2. **[TODO 2/4]** ✅ 오케스트레이션 단계 렌더링 로직 복구
3. **[TODO 3/4]** ✅ Chat 로딩 시 Agent 정보 표시 복구  
4. **[TODO 4/4]** ✅ 타입체크 및 기능 테스트

## 📝 예상 변경 파일

- `apps/gui/src/renderer/services/mock/MockAgentOrchestrator.ts`
- `apps/gui/src/renderer/components/chat/ChatView.tsx` (일부 로직 수정)
- `apps/gui/src/renderer/services/mock/mock-chat-sessions.ts` (필요시)

## 🚨 주의사항

- **Pin 기능 제거 상태 유지**: 사용자가 의도적으로 제거한 기능
- **Core 타입 우선**: 수정 시에도 Core 타입 기반 유지
- **하위 호환성**: 기존 동작과 동일한 사용자 경험 제공

---

**작업 브랜치**: `fix/chat-types-to-coe`  
**관련 문서**: `CHAT_TYPES_INTEGRATION_PLAN.md`  
**예상 소요시간**: 2-3시간
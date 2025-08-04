# Chat Types 단계적 통합 계획서

## 🎯 목표
`apps/gui/src/renderer/types/chat-types.ts`의 타입들을 packages/core 및 llm-bridge-spec과 단계적으로 통합하여 안전하고 점진적인 마이그레이션 수행

## 📊 현재 상황 분석

### **영향도 분석 결과**
- **총 22개 파일**에서 chat-types.ts 사용
- **160개 인스턴스**에서 타입 참조
- **주요 영향 영역**: UI 컴포넌트, Mock 서비스, IPC 채널, Hook

### **타입별 사용 빈도 및 영향도**

| 타입 | 사용 파일 수 | 영향도 | 마이그레이션 우선순위 |
|------|-------------|--------|---------------------|
| `ChatMessage` | 15개 | 🔴 High | Phase 3 (복잡) |
| `ChatSession` | 8개 | 🟡 Medium | Phase 2 (중간) |
| `AvailableAgent` | 4개 | 🟢 Low | Phase 1 (안전) |
| `ActiveAgent` | 3개 | 🟢 Low | Phase 1 (안전) |
| `OrchestrationStep` | 6개 | 🟡 Medium | Phase 4 (GUI 전용) |
| `QuickAction` | 2개 | 🟢 Low | Phase 1 (안전) |
| `AppModeState` | 3개 | 🟢 Low | Phase 1 (안전) |

## 🏗️ 단계적 마이그레이션 전략

### **Phase 1: 저위험 타입 마이그레이션 (1주)**
**대상**: `QuickAction`, `AppModeState`, `AvailableAgent`, `ActiveAgent`

#### **1.1 QuickAction & AppModeState**
- **영향**: UI 상태 관리만 (2-3개 파일)
- **작업**: 타입 정의 개선 및 any 제거
- **위험도**: 🟢 매우 낮음

```typescript
// Before: any 타입 사용
export interface QuickAction {
  icon: React.ReactNode; // any 포함 가능성
}

// After: 구체적 타입 정의
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: 'chat' | 'management' | 'settings';
}
```

#### **1.2 Agent 타입 표준화**
- **영향**: Mock 서비스 및 Agent 관리 UI (4-5개 파일)
- **작업**: Core의 Preset과 연동
- **위험도**: 🟢 낮음

```typescript
import type { Preset } from '@agentos/core';

export interface AvailableAgent {
  id: string;
  name: string;
  preset: Preset; // Core 타입 활용
  status: 'active' | 'idle' | 'error';
  description: string;
  icon: string;
  keywords: string[];
}
```

### **Phase 2: 중위험 타입 마이그레이션 (1-2주)**
**대상**: `ChatSession`

#### **2.1 ChatSession 점진적 마이그레이션**
- **영향**: 8개 파일 (Hook, 컴포넌트, Mock 서비스)
- **전략**: 기존 타입 유지하면서 Core 타입과 호환성 추가

```typescript
import type { ChatSessionMetadata } from '@agentos/core';

// Step 1: 호환성 인터페이스 생성
export interface ChatSessionCompat {
  // 기존 GUI 필드 유지
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
  
  // Core 호환성을 위한 추가 필드 (optional)
  sessionId?: string;
  totalMessages?: number;
  agentName?: string;
  agentPreset?: string;
}

// Step 2: 점진적 전환
export type ChatSession = ChatSessionCompat;

// Step 3: 최종 Core 기반 타입으로 전환 (향후)
// export interface UiChatSession extends ChatSessionMetadata { ... }
```

#### **2.2 마이그레이션 단계**
1. **Week 1**: 호환성 타입 도입 및 Mock 데이터 업데이트
2. **Week 2**: Hook 및 컴포넌트 점진적 업데이트
3. **Week 3**: Core 타입 기반으로 최종 전환

### **Phase 3: 고위험 타입 마이그레이션 (2-3주)**
**대상**: `ChatMessage`

#### **3.1 ChatMessage 복합 전략**
- **영향**: 15개 파일 (가장 광범위한 사용)
- **전략**: 단계적 타입 분리 및 마이그레이션

```typescript
import type { Message } from 'llm-bridge-spec';
import type { MessageHistory } from '@agentos/core';

// Step 1: GUI 전용 확장 분리
export interface UiMessageExtension {
  type: 'user' | 'assistant' | 'system' | 'orchestration';
  agentName?: string;
  agentPreset?: string;
  agentId?: string;
  orchestrationSteps?: OrchestrationStep[];
}

// Step 2: 점진적 통합 타입
export interface ChatMessageV2 extends MessageHistory {
  // GUI 전용 확장
  type: UiMessageExtension['type'];
  agentName?: string;
  agentPreset?: string;
  agentId?: string;
  orchestrationSteps?: OrchestrationStep[];
}

// Step 3: 기존 타입과 새 타입 병행 사용
export type ChatMessage = ChatMessageV1 | ChatMessageV2;
```

#### **3.2 점진적 전환 전략**
1. **Week 1**: V2 타입 도입 및 Utility 함수 작성
2. **Week 2**: Mock 서비스 및 데이터 레이어 전환
3. **Week 3**: UI 컴포넌트 단계별 전환 (가장 영향 적은 것부터)
4. **Week 4**: 핵심 채팅 컴포넌트 전환 및 테스트

### **Phase 4: GUI 전용 타입 최적화 (1주)**
**대상**: `OrchestrationStep`

#### **4.1 GUI 특화 타입 개선**
- **목표**: any 타입 제거 및 타입 안전성 확보
- **영향**: 6개 파일 (오케스트레이션 관련)

```typescript
// Before: any 타입 사용
export interface OrchestrationStep {
  data?: any; // 위험한 any 타입
}

// After: 구체적 Union 타입
export interface OrchestrationStep {
  id: string;
  type: 'analysis' | 'keyword-matching' | 'agent-selection' | 'conclusion';
  title: string;
  content: string;
  data?: AnalysisData | KeywordData | AgentSelectionData | ConclusionData;
  isCompleted: boolean;
}

export interface AnalysisData {
  confidence: number;
  factors: string[];
}

export interface KeywordData {
  matchedKeywords: string[];
  score: number;
}

export interface AgentSelectionData {
  selectedAgents: string[];
  reasoning: string;
}

export interface ConclusionData {
  summary: string;
  nextSteps?: string[];
}
```

## 🛡️ 안전한 마이그레이션 원칙

### **1. 하위 호환성 유지**
- 기존 API 시그니처 변경 최소화
- 점진적 타입 전환으로 breaking change 방지
- Type Guard 및 Utility 함수 활용

### **2. 단계별 검증**
```typescript
// 각 단계마다 검증 함수 작성
export function isChatMessageV1(msg: ChatMessage): msg is ChatMessageV1 {
  return typeof (msg as ChatMessageV1).id === 'number';
}

export function isChatMessageV2(msg: ChatMessage): msg is ChatMessageV2 {
  return typeof (msg as ChatMessageV2).messageId === 'string';
}
```

### **3. 실시간 모니터링**
- 각 Phase 완료 후 타입 체크 및 빌드 테스트
- 기능 테스트를 통한 회귀 검증
- Lint 규칙으로 any 사용 방지

## 📅 마이그레이션 일정

| Phase | 기간 | 주요 작업 | 완료 조건 |
|-------|------|----------|----------|
| **Phase 1** | 1주 | 저위험 타입 마이그레이션 | 빌드 성공 + 기능 테스트 통과 |
| **Phase 2** | 1-2주 | ChatSession 점진적 전환 | 세션 관리 기능 정상 동작 |
| **Phase 3** | 2-3주 | ChatMessage 복합 마이그레이션 | 채팅 기능 완전 정상 동작 |
| **Phase 4** | 1주 | GUI 전용 타입 최적화 | any 타입 완전 제거 |
| **총 기간** | **5-7주** | **점진적 완전 통합** | **타입 안전성 100% 확보** |

## 🚨 위험 요소 및 대응 방안

### **High Risk: ChatMessage 마이그레이션**
- **위험**: 채팅 기능 전체 영향 가능성
- **대응**: 
  - Feature Flag를 통한 점진적 전환
  - 기존 타입과 신규 타입 병행 지원
  - 충분한 테스트 케이스 작성

### **Medium Risk: 타입 호환성 문제**
- **위험**: llm-bridge-spec과 GUI 타입 간 불일치
- **대응**:
  - Adapter 패턴으로 타입 변환
  - Utility 함수로 안전한 타입 변환 제공

### **Low Risk: 성능 영향**
- **위험**: 타입 변환으로 인한 성능 저하
- **대응**:
  - 타입 변환 최소화
  - Memoization 활용

## ✅ 성공 지표

1. **타입 안전성**: any 타입 100% 제거
2. **코드 품질**: TypeScript strict mode 통과
3. **성능**: 기존 대비 성능 저하 없음
4. **기능성**: 모든 기존 기능 정상 동작
5. **개발 경험**: 타입 추론 및 IntelliSense 개선

---

**다음 단계**: Phase 1 작업 시작 승인 후 `feature/chat-types-phase1` 브랜치에서 작업 진행
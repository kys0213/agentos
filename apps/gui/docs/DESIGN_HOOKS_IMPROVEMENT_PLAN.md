# Design 폴더 상태 관리 Hooks 개선 계획서

## Requirements

### 성공 조건

- [ ] Design 폴더의 hooks가 기존 ServiceContainer 기반 아키텍처와 통합되어야 함
- [ ] Mock 데이터 의존성을 제거하고 @agentos/core 서비스와 연동되어야 함
- [ ] 기존 Core 타입을 활용하여 타입 안전성을 보장해야 함
- [ ] React의 선언적 상태 관리 패턴을 유지해야 함
- [ ] UI 상태와 비즈니스 로직의 관심사 분리가 명확해야 함

### 사용 시나리오

- [ ] **Navigation State**: 앱 섹션 간 전환, 모달/디테일 뷰 상태 관리
- [ ] **Chat State**: 채팅 세션 활성화/최소화, 멀티 채팅 관리 
- [ ] **Data State**: Core 서비스를 통한 Preset, Agent, Tool 데이터 조회/변경
- [ ] **Service Integration**: ServiceContainer를 통한 의존성 주입 및 IPC 통신
- [ ] **Type Safety**: @agentos/core 타입 시스템과의 완전한 호환성

### 제약 조건

- [ ] **절대 보존**: ServiceContainer, 모든 Core 서비스 클래스
- [ ] **절대 보존**: 기존 IPC 통신 및 타입 시스템
- [ ] **점진적 개선**: 기존 기능을 유지하면서 단계별 개선
- [ ] **Core 우선**: 모든 데이터 조작은 @agentos/core를 통해 처리

## Interface Sketch

```typescript
// Core 타입 직접 활용
import { 
  Preset, 
  AgentMetadata, 
  ChatSessionMetadata, 
  MessageHistory 
} from '@agentos/core';

// UI 전용 확장 타입들
interface GuiPreset extends Preset {
  // GUI 전용 필드만 추가
  knowledgeStats?: {
    indexed: number;
    vectorized: number;
    totalSize: number;
  };
}

interface GuiAgentMetadata extends AgentMetadata {
  // GUI 전용 UI 상태
  avatar?: string;
  tags?: string[];
  lastUsed?: Date;
  usageCount: number;
}

// 개선된 Hook 구조
interface UseAppNavigationReturn {
  // UI 상태만 관리
  activeSection: AppSection;
  selectedPreset: Preset | null;
  creatingPreset: boolean;
  isInDetailView: () => boolean;
  
  // 액션들
  setActiveSection: (section: AppSection) => void;
  handleBackToChat: () => void;
  handleSelectPreset: (preset: Preset) => void;
}

interface UseAppDataReturn {
  // Core 서비스 연동 데이터
  presets: Preset[];
  agents: AgentMetadata[];
  
  // 서비스 액션들
  createPreset: (preset: Omit<Preset, 'id'>) => Promise<Preset>;
  updatePreset: (preset: Preset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  
  // 로딩 상태
  isLoading: boolean;
  error: Error | null;
}

interface UseChatStateReturn {
  // 채팅 UI 상태만
  activeChatAgent: ChatAgent | null;
  minimizedChats: ChatAgent[];
  
  // 채팅 UI 액션들
  openChat: (agentId: string) => void;
  closeChat: () => void;
  minimizeChat: () => void;
  restoreChat: (chat: ChatAgent) => void;
}
```

## Todo

### Phase 1: Core 타입 통합 (1일)

- [x] **[TODO 1/8]** Design 타입들을 @agentos/core 타입으로 마이그레이션
- [ ] **[TODO 2/8]** Mock 데이터 의존성 제거 및 Core 서비스 연동 준비

### Phase 2: 데이터 레이어 분리 (1일) 

- [ ] **[TODO 3/8]** useAppData를 ServiceContainer 기반으로 재작성
- [ ] **[TODO 4/8]** 비즈니스 로직을 Service 레이어로 이동

### Phase 3: UI 상태 관리 최적화 (1일)

- [ ] **[TODO 5/8]** useAppNavigation을 순수 UI 상태 관리로 개선
- [ ] **[TODO 6/8]** useChatState를 채팅 UI 상태 전용으로 개선

### Phase 4: 통합 및 검증 (0.5일)

- [ ] **[TODO 7/8]** 모든 hooks의 타입 안전성 및 서비스 연동 검증
- [ ] **[TODO 8/8]** 빌드, 타입체크, 린트 검사 및 최종 검증

## 작업 순서

### 1단계: Core 타입 통합 (TODO 1-2)

**완료 조건**: Design 폴더의 모든 타입이 @agentos/core 타입과 호환되고, Mock 의존성이 제거됨

- Design 폴더의 커스텀 타입들을 Core 타입으로 교체
- Mock 데이터 의존성 제거 및 서비스 준비
- 타입 호환성 검증

### 2단계: 데이터 레이어 분리 (TODO 3-4)

**완료 조건**: 모든 데이터 조작이 Core 서비스를 통해 처리되고, UI hooks에서 비즈니스 로직이 제거됨

- useAppData를 ServiceContainer 기반으로 재작성
- CRUD 로직을 적절한 Service 클래스로 이동
- React Query나 SWR 패턴 도입 검토

### 3단계: UI 상태 관리 최적화 (TODO 5-6)

**완료 조건**: Navigation과 Chat hooks가 순수 UI 상태만 관리하고, 명확한 책임 분리가 이루어짐

- useAppNavigation을 네비게이션 상태 전용으로 정리
- useChatState를 채팅 UI 상태 전용으로 정리
- 불필요한 상태 중복 제거

### 4단계: 통합 및 검증 (TODO 7-8)

**완료 조건**: 모든 hooks가 올바르게 통합되고, 코드 품질 기준을 만족함

- 전체 hooks 통합 테스트
- 타입 안전성 및 서비스 연동 검증
- 품질 보증 (`pnpm typecheck`, `pnpm lint`, `pnpm build`)

## 개선 원칙

### 🎯 레이어 분리 원칙

```typescript
// ✅ UI 상태 Hook (순수 UI 로직만)
export function useAppNavigation() {
  const [activeSection, setActiveSection] = useState<AppSection>('chat');
  // 네비게이션 UI 상태만 관리
}

// ✅ 데이터 Hook (Core 서비스 연동)
export function useAppData() {
  const presetService = ServiceContainer.get<PresetService>('preset');
  // Core 서비스를 통한 데이터 조작
}

// ❌ 혼재된 Hook (개선 대상)
export function useAppData() {
  const [data, setData] = useState(mockData); // Mock 의존성
  const handleCreate = (item) => { /* 비즈니스 로직 */ }; // UI Hook에서 처리
}
```

### 🔧 ServiceContainer 활용

```typescript
// ✅ 권장: ServiceContainer를 통한 의존성 주입
export function usePresetData() {
  const presetService = ServiceContainer.get<PresetService>('preset');
  const bridgeService = ServiceContainer.get<BridgeService>('bridge');
  
  return useQuery('presets', () => presetService.getAll());
}

// ❌ 지양: 직접 인스턴스 생성 또는 Mock 의존
export function usePresetData() {
  const [presets, setPresets] = useState(mockPresets); // Mock 의존성
}
```

### 📊 타입 안전성 보장

```typescript
// ✅ Core 타입 직접 사용
import { Preset, AgentMetadata } from '@agentos/core';

export function useAppData() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
}

// ❌ 커스텀 타입 중복 정의
interface CustomPreset { /* ... */ } // Core와 중복
```

## 검증 체크리스트

### 기능 검증

- [ ] 모든 데이터 조작이 Core 서비스를 통해 처리되는가?
- [ ] ServiceContainer를 통한 의존성 주입이 올바르게 작동하는가?
- [ ] Mock 데이터 의존성이 완전히 제거되었는가?
- [ ] UI 상태와 비즈니스 로직이 명확히 분리되었는가?

### 코드 품질 검증

- [ ] `pnpm typecheck` 통과하는가?
- [ ] `pnpm lint` 통과하는가?
- [ ] `pnpm build` 성공하는가?
- [ ] 모든 타입이 @agentos/core와 호환되는가?

### 아키텍처 검증

- [ ] React의 선언적 상태 관리 패턴을 유지하는가?
- [ ] 각 Hook이 명확한 단일 책임을 가지는가?
- [ ] 기존 ServiceContainer 아키텍처와 조화를 이루는가?
- [ ] IPC 통신 및 Core 서비스 연동이 올바른가?

## 마이그레이션 전략

### 🔒 절대 보존 영역

- ServiceContainer 및 모든 Core 서비스
- IPC 통신 레이어 및 채널 구현
- @agentos/core 타입 시스템
- 기존 서비스 인터페이스

### 🔄 개선 대상 영역

- Design 폴더의 상태 관리 hooks
- Mock 데이터 의존성
- 커스텀 타입 정의 (Core 타입으로 통합)
- UI Hook 내 비즈니스 로직

### ⚠️ 주의사항

- **점진적 개선**: 모든 것을 한번에 바꾸지 않고 단계별 진행
- **기능 보존**: 기존 UI 동작은 모두 유지
- **타입 호환성**: Core 타입과의 완전한 호환성 보장
- **서비스 레이어 활용**: 기존 아키텍처 패턴 준수
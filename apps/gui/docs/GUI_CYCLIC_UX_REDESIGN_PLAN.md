# AgentOS GUI 순환적 UX 재설계 계획서

## Requirements

### 성공 조건

- [ ] 채팅 영역이 절대적으로 고정되어 다른 UI 요소에 의해 침범되지 않음
- [ ] 설정 변경 시 컨텍스트 단절 없이 즉시 결과 확인 가능
- [ ] 사용자가 채팅 ⟷ 설정 ⟷ 히스토리 간 자유롭게 순환 이동 가능
- [ ] Command Palette(Cmd/Ctrl+K)로 모든 주요 기능에 빠른 접근 가능
- [ ] AI 기반 예측적 UI로 사용자 설정 부담 50% 이상 감소
- [ ] MCP/LLM Bridge/Preset 설정이 통합된 하나의 설정 시스템으로 관리됨
- [ ] 빈 채팅 상태에서도 사용자에게 명확한 가이드 제공

### 사용 시나리오

**시나리오 1: MCP 최적화 워크플로우**
- 사용자가 채팅 중 MCP 응답이 느림을 감지
- 우측에 MCP 설정 패널이 자동으로 나타남 (예측적 UI)
- 타임아웃 설정을 실시간으로 조정하며 채팅에서 즉시 테스트
- 만족할 때까지 설정 ⟷ 테스트 순환 반복

**시나리오 2: Preset 개선 과정**
- 채팅 답변이 아쉬워서 "개선하기" 버튼 클릭
- Preset 편집기가 오버레이로 나타남
- 프롬프트를 수정하며 같은 질문으로 실시간 비교 테스트
- 개선된 결과에 만족하면 채택하고 계속 채팅

**시나리오 3: 새 사용자 온보딩**
- 첫 실행 시 빈 채팅 화면에 Task-oriented 퀵 액션 표시
- "코드 리뷰", "디버깅", "학습" 등 목적별 시작점 제공
- 선택한 작업에 최적화된 MCP/Preset이 자동 구성됨

### 제약 조건

- 기존 Chakra UI 컴포넌트 시스템 유지
- Electron 환경과 웹 환경 모두 지원
- 현재의 IPC 통신 구조 호환성 유지
- TypeScript strict 모드 준수
- 기존 데이터 구조 마이그레이션 없이 점진적 개선

## Interface Sketch

### 메인 레이아웃 구조
```typescript
interface AppLayout {
  header: {
    logo: string;
    commandPalette: CommandPaletteButton;
    userMenu: UserMenuButton;
  };
  
  mainContent: {
    leftSidebar: CollapsibleSidebar;
    chatArea: FixedChatArea;
    rightSidebar: ContextualSidebar;
  };
  
  fab: FloatingActionCluster;
}

interface CyclicWorkflow {
  // 순환 가능한 워크플로우 상태
  currentContext: 'chat' | 'settings' | 'history';
  availableTransitions: WorkflowTransition[];
  contextPreservation: ContextState;
}

interface PredictiveUI {
  userIntent: DetectedIntent;
  suggestedActions: SmartAction[];
  autoConfigurations: AutoConfig[];
}
```

### Command Palette 시스템
```typescript
interface CommandPaletteAction {
  id: string;
  title: string;
  description?: string;
  category: 'chat' | 'mcp' | 'settings' | 'navigation';
  keywords: string[];
  execute: () => Promise<void>;
  condition?: () => boolean;
}

// 예시 명령어들
const commands: CommandPaletteAction[] = [
  {
    id: 'change-llm-bridge',
    title: 'Change LLM Bridge to Claude',
    category: 'settings',
    keywords: ['llm', 'claude', 'change', 'switch'],
    execute: () => switchLLMBridge('claude')
  },
  {
    id: 'add-mcp-server',
    title: 'Add MCP Server',
    category: 'mcp',
    keywords: ['mcp', 'server', 'add', 'new'],
    execute: () => openMCPServerDialog()
  }
];
```

### 순환적 컨텍스트 관리
```typescript
interface ContextBridge {
  from: UIContext;
  to: UIContext;
  preservedData: ContextData;
  transitionAction: string;
  backAction: string;
}

interface SmartSidebar {
  mode: 'chat-history' | 'settings' | 'mcp-status' | 'contextual';
  content: React.ComponentType;
  triggers: SidebarTrigger[];
  contextualActions: ContextualAction[];
}
```

## Todo

### Phase 1: 핵심 인프라 (1주)
- [ ] Command Palette 컴포넌트 구현
- [ ] FAB(Floating Action Button) 시스템 구현
- [ ] 고정 3-Panel 레이아웃 구조 변경
- [ ] 설정 시스템을 모달에서 사이드 패널로 이전
- [ ] 채팅 영역 절대 고정 보장 (CSS Grid 활용)

### Phase 2: 순환적 워크플로우 (2주)
- [ ] 컨텍스트 보존 시스템 구현
- [ ] Contextual Bridge 패턴 적용
- [ ] 설정 ⟷ 채팅 간 실시간 연동 구현
- [ ] 히스토리 ⟷ 채팅 간 자연스러운 전환
- [ ] 예측적 UI 기반 시스템 구현

### Phase 3: 스마트 기능 (2주)
- [ ] AI 기반 사용 패턴 학습 시스템
- [ ] Task-oriented 인터페이스 구현
- [ ] Progressive Disclosure 적용
- [ ] 빈 상태 디자인 및 온보딩 플로우
- [ ] Zero-Configuration 자동 설정 로직

### Phase 4: 고도화 (1주)
- [ ] Orbital UI 패턴 적용
- [ ] Elastic Interface 동적 조정
- [ ] 접근성(A11y) 개선
- [ ] 성능 최적화 (Virtual Scrolling, Code Splitting)
- [ ] 반응형 디자인 적용

### 테스트 및 검증
- [ ] Playwright를 활용한 UX 플로우 자동 테스트
- [ ] 순환 워크플로우 시나리오 테스트
- [ ] Command Palette 기능 테스트
- [ ] 컨텍스트 보존 검증 테스트
- [ ] 예측적 UI 정확도 테스트

### 문서화
- [ ] 새로운 UX 패턴 가이드 작성
- [ ] 개발자를 위한 순환적 UI 구현 가이드
- [ ] 사용자를 위한 기능 소개 문서
- [ ] Designer UX Sub-Agent 활용 가이드

## 작업 순서

### 1단계: 기반 구조 재설계 (1주)
**목표**: 안정적인 고정 레이아웃과 빠른 접근 시스템 구축
- Command Palette 및 FAB 시스템 구현
- 3-Panel 고정 레이아웃 적용
- 설정 시스템 사이드 패널화
**완료 조건**: 채팅 영역이 절대 침범되지 않고, Cmd+K로 모든 기능 접근 가능

### 2단계: 순환 워크플로우 구현 (2주)  
**목표**: 자연스러운 컨텍스트 전환과 실시간 연동 시스템
- 컨텍스트 보존 및 브릿지 시스템 구현
- 설정 변경 시 즉시 채팅 테스트 가능한 구조
- 히스토리와 채팅 간 매끄러운 전환
**완료 조건**: 사용자가 채팅↔설정↔히스토리 간 자유롭게 이동하며 작업 가능

### 3단계: 예측적 스마트 기능 (2주)
**목표**: AI 기반 사용자 지원 및 설정 자동화
- 사용 패턴 학습 및 예측적 UI 구현
- Task-oriented 인터페이스 적용
- Zero-Configuration 자동 설정 로직
**완료 조건**: 사용자 설정 부담이 현저히 줄어들고, 상황별 최적 옵션 자동 제안

### 4단계: 사용자 경험 완성 (1주)
**목표**: 접근성, 성능, 반응형 등 완성도 높은 UX 제공
- 고급 UI 패턴 적용 및 성능 최적화
- 포괄적 접근성 개선
- 다양한 화면 크기 대응
**완료 조건**: 모든 사용자가 편리하고 빠르게 사용할 수 있는 완성된 인터페이스

---

## 🎯 핵심 성공 지표

- **컨텍스트 보존율**: 화면 전환 시 사용자 작업 맥락 유지 95% 이상
- **설정 간소화**: 사용자 직접 설정 빈도 50% 감소  
- **워크플로우 효율성**: 주요 작업 완료 시간 30% 단축
- **사용자 만족도**: 순환적 워크플로우에 대한 긍정적 피드백 80% 이상

이 계획서는 "사용자는 탐색지향적이다"라는 핵심 인사이트를 바탕으로 AgentOS GUI를 근본적으로 개선하여, 더 자연스럽고 효율적인 사용자 경험을 제공하는 것을 목표로 합니다.
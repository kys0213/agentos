# 새 디자인 코드 마이그레이션 계획서

## Requirements

### 성공 조건

- [ ] 기존 Core 패키지와 IPC 통신은 완전히 보존되어야 함
- [ ] 새로운 UI/UX 디자인이 기존 renderer 구조에 완전히 적용되어야 함
- [ ] 애플리케이션의 모든 기능이 정상 동작해야 함
- [ ] 타입 안전성이 보장되어야 함 (any 타입 사용 금지)
- [ ] 빌드 및 테스트가 성공적으로 통과해야 함

### 사용 시나리오

- [ ] **Chat Mode**: 사용자가 채팅 인터페이스에서 에이전트들과 대화
- [ ] **Management Mode**: 사이드바를 통해 대시보드, 프리셋, 에이전트, 도구 등을 관리
- [ ] **모드 전환**: Chat ↔ Management 간 자연스러운 전환
- [ ] **Core 서비스 연동**: 모든 데이터 조작이 @agentos/core를 통해 처리
- [ ] **IPC 통신**: 메인 프로세스와 원활한 데이터 교환

### 제약 조건

- [ ] **절대 보존**: packages/core 패키지 및 IPC 관련 코드
- [ ] **절대 보존**: ServiceContainer, IpcChannel, 모든 Service 클래스들
- [ ] **절대 보존**: 기존 타입 시스템 (core-types.ts 기반)
- [ ] **덮어쓰기 가능**: UI 컴포넌트, hooks, 스타일링 관련 코드

## Interface Sketch

```typescript
// 새로운 디자인의 핵심 타입들이 기존 Core 타입과 호환되도록 매핑

// 기존 Core 타입 (보존 필수)
import type { ChatSessionMetadata, MessageHistory, Preset, McpConfig } from '@agentos/core';

// 새 디자인 타입을 Core 타입으로 매핑
interface DesignPreset extends Preset {
  // 새 디자인의 추가 UI 필드들 (옵셔널)
  knowledgeStats?: {
    indexed: number;
    vectorized: number;
    totalSize: number;
  };
}

interface DesignAgent {
  id: string;
  name: string;
  description: string;
  preset: string; // Preset ID 참조
  status: 'active' | 'idle' | 'inactive';
  // UI 전용 필드들
  avatar?: string;
  tags?: string[];
  lastUsed?: Date;
  usageCount: number;
}

// 앱 섹션 타입 확장
type AppSection =
  | 'dashboard'
  | 'chat'
  | 'subagents'
  | 'presets'
  | 'models'
  | 'tools'
  | 'toolbuilder'
  | 'racp'
  | 'settings';

// 네비게이션 상태 관리
interface NavigationState {
  activeSection: AppSection;
  selectedPreset: DesignPreset | null;
  creatingPreset: boolean;
  creatingMCPTool: boolean;
  creatingAgent: boolean;
  creatingCustomTool: boolean;
  isInDetailView: () => boolean;
}
```

## Todo

### Phase 1: 기반 구조 마이그레이션 (1-2일)

- [ ] **[TODO 1/12]** 새 디자인의 UI 컴포넌트 라이브러리를 기존 renderer/components/ui/에 통합
- [ ] **[TODO 2/12]** 새 디자인의 타입 정의를 기존 Core 타입과 호환되도록 수정
- [ ] **[TODO 3/12]** 새 디자인의 hooks를 기존 ServiceContainer 기반으로 재작성
- [ ] **[TODO 4/12]** 기존 AppLayout을 새 디자인의 App.tsx 구조로 대체

### Phase 2: 핵심 컴포넌트 마이그레이션 (2-3일)

- [ ] **[TODO 5/12]** Sidebar 컴포넌트 - 기존 management/Sidebar.tsx를 새 디자인으로 교체
- [ ] **[TODO 6/12]** ChatView 컴포넌트 - 새 디자인의 채팅 인터페이스 적용
- [ ] **[TODO 7/12]** Dashboard 컴포넌트 - 새 디자인의 대시보드 기능 구현
- [ ] **[TODO 8/12]** PresetManager 관련 컴포넌트들 (List, Detail, Create) 마이그레이션

### Phase 3: 관리 기능 컴포넌트 마이그레이션 (2-3일)

- [ ] **[TODO 9/12]** SubAgentManager, ModelManager, MCPToolsManager 컴포넌트 마이그레이션
- [ ] **[TODO 10/12]** SettingsManager, ToolBuilder 컴포넌트 마이그레이션
- [ ] **[TODO 11/12]** 모든 컴포넌트가 ServiceContainer를 통해 Core 서비스와 연동되도록 보장

### Phase 4: 통합 테스트 및 마무리 (1일)

- [ ] **[TODO 12/12]** 전체 기능 테스트, 타입 체크, 린트 검사 및 최종 검증

## 작업 순서

### 1단계: 호환성 검증 및 기반 작업 (TODO 1-4)

**완료 조건**: 새 디자인 코드가 기존 Core/IPC 시스템과 충돌 없이 빌드되고 기본 네비게이션이 작동함

- 기존 타입 시스템 분석 및 새 디자인 타입과의 매핑 정의
- UI 컴포넌트 라이브러리 통합 (shadcn/ui 기반)
- hooks 시스템을 ServiceContainer 기반으로 재구성
- 메인 App 컴포넌트 교체 및 듀얼 모드 (Chat ↔ Management) 구조 구현

### 2단계: 핵심 UI 컴포넌트 교체 (TODO 5-8)

**완료 조건**: 사이드바, 채팅 인터페이스, 대시보드, 프리셋 관리가 새 디자인으로 완전히 동작함

- Sidebar와 네비게이션 시스템 교체
- ChatView 및 채팅 관련 컴포넌트 교체
- Dashboard 컴포넌트 새 디자인으로 구현
- Preset 관리 (목록, 상세, 생성) 컴포넌트 교체

### 3단계: 관리 기능 완성 (TODO 9-11)

**완료 조건**: 에이전트, 모델, MCP 도구, 설정 등 모든 관리 기능이 새 디자인으로 동작함

- SubAgent, Model, MCP Tools 관리 컴포넌트 교체
- Settings 및 Tool Builder 컴포넌트 교체
- 모든 데이터 조작이 Core 서비스를 통해 처리되는지 검증

### 4단계: 품질 보장 및 마무리 (TODO 12)

**완료 조건**: 모든 기능이 정상 작동하고 코드 품질 기준을 만족함

- 전체 애플리케이션 기능 테스트
- 타입 안전성 검증 (`pnpm typecheck`)
- 코드 품질 검사 (`pnpm lint`)
- 빌드 검증 (`pnpm build`)

## 마이그레이션 전략

### 🔒 절대 보존 영역

```
apps/gui/src/renderer/
├── services/              # 모든 서비스 및 ServiceContainer
├── services/ipc/          # 모든 IPC 채널 구현
├── types/core-types.ts    # Core 타입 정의
├── hooks/queries/         # Core 서비스 연동 쿼리 hooks
├── bootstrap.ts           # 서비스 초기화
└── main-*.ts             # 엔트리 포인트들
```

### 🔄 교체 대상 영역

```
apps/gui/src/renderer/
├── components/            # 모든 UI 컴포넌트 → 새 디자인으로 교체
├── components/ui/         # UI 라이브러리 → shadcn/ui로 확장
├── hooks/                 # UI 상태 관리 hooks → 새 디자인 hooks로 교체
├── stores/                # 클라이언트 상태 → 새 디자인 패턴으로 재구성
└── styles/               # 스타일링 → 새 디자인 스타일로 교체
```

### 🎯 마이그레이션 핵심 원칙

1. **Core 우선**: 모든 데이터 조작은 @agentos/core를 통해
2. **ServiceContainer 중심**: 모든 서비스 의존성은 컨테이너를 통해 주입
3. **타입 안전성**: 기존 Core 타입을 확장하되 호환성 보장
4. **점진적 교체**: 한 번에 모든 것을 바꾸지 않고 단계별로 교체
5. **기능 보존**: 기존 기능은 모두 유지하며 UI/UX만 개선

### ⚠️ 주의사항

- **Breaking Changes 절대 금지**: 기존 Core 인터페이스 시그니처 변경 불가
- **Mock 데이터 지양**: 새 디자인의 mockData.ts는 개발/테스트 용도로만 사용
- **IPC 통신 보존**: Main 프로세스와의 통신 로직은 절대 변경하지 않음
- **서비스 레이어 보존**: ChatService, BridgeService, McpService 등 모든 서비스 보존

## 검증 체크리스트

### 기능 검증

- [ ] 채팅 세션 생성/로드/메시지 전송이 정상 동작하는가?
- [ ] 프리셋 CRUD 작업이 Core를 통해 처리되는가?
- [ ] MCP 도구 연결/실행이 기존과 동일하게 작동하는가?
- [ ] 브릿지 설정 및 전환이 정상 작동하는가?

### 코드 품질 검증

- [ ] `pnpm typecheck` 통과하는가?
- [ ] `pnpm lint` 통과하는가?
- [ ] `pnpm build` 성공하는가?
- [ ] `pnpm test` 통과하는가?

### 아키텍처 검증

- [ ] Core 패키지 의존성이 올바르게 유지되는가?
- [ ] ServiceContainer를 통한 의존성 주입이 제대로 작동하는가?
- [ ] IPC 통신이 기존과 동일하게 작동하는가?
- [ ] 타입 안전성이 보장되는가? (any 타입 사용 없음)

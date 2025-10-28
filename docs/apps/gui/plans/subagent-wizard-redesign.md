# 작업계획서: SubAgent 마법사 구조 재설계

## Requirements

### 성공 조건
- [ ] SubAgentCreate 단일 컴포넌트를 단계별 컴포넌트/훅으로 분리하여 파일 길이를 300줄 이하로 유지한다.
- [ ] 상태 관리(현재 14개 useState)를 `WizardState` 형태로 통합하고, 각 단계의 validator를 별도 모듈로 분리한다.
- [ ] `presetTemplate` 의존 없이도 에이전트 생성이 가능하며, 필요한 프리셋 직렬화는 내부적으로 생성된다.
- [ ] 기존 기능(카테고리, 브리지, MCP, 태그, Preview 등)이 회귀 없이 동작한다.
- [ ] 모든 기존/신규 테스트가 통과한다.

### 사용 시나리오
- 사용자가 단계별로 정보를 입력하면서 이전/다음 단계 이동 시 상태가 유지되고, 최종 미리보기/생성이 매끄럽게 진행된다.
- Export/Import는 별도 위치(Export/Import 이동 작업 결과)를 사용한다.

### 제약 조건
- 대규모 변경이므로 이전 단계 작업(Export/Import 이동, Bridge 버그 수정)이 완료된 상태를 전제로 한다.
- 타입 안전성과 ServiceContainer 의존성은 유지한다.

## Interface Sketch
```typescript
interface WizardState {
  overview: {
    name: string;
    description: string;
    icon?: string;
    keywords: string[];
  };
  category?: GuiAgentCategory;
  aiConfig: {
    systemPrompt: string;
    bridge: {
      id: string;
      model: string;
      config: Record<string, unknown>;
    };
    enabledMcps: string[];
  };
  settings: {
    status: 'active' | 'idle' | 'inactive';
    autoParticipate: boolean;
  };
}

interface WizardStepProps {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  errors: Record<StepKey, string | null>;
}
```

## Todo
- [ ] `WizardState` 및 reducer/훅 도입 (`useSubAgentWizardState`)
- [ ] 단계별 컴포넌트 분리 (OverviewStep, CategoryStep, AiConfigStep, SettingsStep, PreviewPane)
- [ ] validator/serializer 모듈화 (`buildAgentPayload`, `validators` 분리)
- [ ] 기존 `SubAgentCreateContainer`와 연동 재구성 (`onCreate`, `onBack`, `currentStepId` 대응)
- [ ] 기존 테스트 업데이트 및 신규 테스트 작성
- [ ] 문서/스토리북 업데이트

## 작업 순서
1. 상태 관리/validator 추출 → `WizardState` 기반 구조 마련
2. 단계별 컴포넌트 분리 및 UI/로직 이관
3. 통합 테스트/문서 정리

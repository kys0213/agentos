# Agent Wizard Completion Plan

Status: Completed
Last Updated: 2025-09-16

## Requirements

### 성공 조건

- [x] Agent 생성 마법사가 Core 계약과 정합되도록 LLM Bridge/모델/파라미터 구성 및 MCP 선택을 실제 데이터와 동기화한다.
- [x] 단계별 진행(Overview → Category → AI Config → Settings)에서 필수 입력 검증을 통과하지 못하면 다음 단계 및 최종 생성이 불가능하고, 사용자에게 명확한 오류 메시지를 제공한다.
- [x] 최종 `CreateAgentMetadata` 요청에 시스템 프롬프트, 브릿지 구성, MCP 선택, 태그 등의 오버라이드 값이 정확히 반영되고, 요약/Export 기능에서도 동일한 정보가 노출된다.
- [x] 프리셋 메뉴 없이도 에이전트만으로 Export/Import가 가능하며, Export JSON은 기존 프리셋 스펙을 그대로 유지한다.

### 사용 시나리오

- [x] 사용자가 Overview와 Category를 입력하고, AI Config에서 브릿지를 `gpt-4` 모델로 변경한 뒤 Settings에서 요약을 확인하고 생성하면 해당 에이전트가 등록된다.
- [x] 사용자가 Settings 탭에서 Export로 프리셋 JSON을 생성하고, 일부 값을 수정한 뒤 Import(Validate → Apply)를 수행하면 변경 사항이 마법사에 반영된다.
- [x] 필수 필드를 비워 두거나 잘못된 JSON을 Import하려 할 경우 단계 이동 또는 적용 시도가 차단되고, 구체적인 오류 메시지가 표시된다.

### 제약 조건

- [x] `CreateAgentMetadata` 타입(= `AgentMetadata`에서 id/version 제거)과 ServiceContainer 어댑터 시그니처를 유지한다.
- [x] 브릿지/모델 목록은 `BridgeModelSettings` + `useInstalledBridges` 기반으로 동작하며, 추가 API 호출 없이 Renderer 레이어에서 해결한다.
- [x] MCP 선택 시 Core가 기대하는 `Preset.enabledMcps` 구조(`name`, `enabledTools`, `enabledResources`, `enabledPrompts`)를 만족해야 한다.
- [x] 기존 Export/Import 포맷(serializeAgent/tryParseAgentExport)은 유지하되 필요한 필드를 확장하는 경우 역호환성을 보장한다.
- [x] UI에는 프리셋 용어/네비게이션이 노출되지 않아야 하며, Export/Import 시에만 프리셋 JSON 형식이 드러난다.

## Interface Sketch

```ts
// 단계별 입력값을 분리하여 검증과 Merge 로직을 명확화
interface AgentWizardState {
  overview: {
    name: string;
    description: string;
    icon?: string;
    keywords: string[];
  };
  category?: {
    id: GuiAgentCategory;
    autoKeywords: string[];
  };
  aiConfig: {
    systemPrompt: string;
    llmBridge: {
      bridgeId: string;
      model: string;
      params: Record<string, unknown>;
    };
    enabledMcpIds: string[];
  };
  status: 'active' | 'idle' | 'inactive';
  // 프리셋은 UI에는 노출되지 않지만 내부적으로 직렬화를 위해 유지
  presetTemplate: ReadonlyPreset;
}

const AgentWizardSchema = z.object({
  overview: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().optional(),
    keywords: z.array(z.string()).default([]),
  }),
  category: z.object({ id: z.string(), autoKeywords: z.array(z.string()) }).optional(),
  aiConfig: z.object({
    systemPrompt: z.string().min(1),
    llmBridge: z.object({
      bridgeId: z.string().min(1),
      model: z.string().min(1),
      params: z.record(z.unknown()).default({}),
    }),
    enabledMcpIds: z.array(z.string()).default([]),
  }),
  status: z.enum(['active', 'idle', 'inactive']),
  presetTemplate: presetSchema,
});

function buildCreatePayload(state: AgentWizardState): CreateAgentMetadata {
  const enabledMcps = state.aiConfig.enabledMcpIds.map((id) => materializeMcpFromCache(id));
  const llmBridgeName = state.aiConfig.llmBridge.bridgeId;
  const basePreset = state.presetTemplate;
  const llmBridgeConfig = {
    ...basePreset.llmBridgeConfig,
    ...state.aiConfig.llmBridge.params,
    model: state.aiConfig.llmBridge.model,
    bridgeId: llmBridgeName,
  };

  return {
    name: state.overview.name,
    description: state.overview.description,
    icon: state.overview.icon ?? '',
    keywords: state.overview.keywords,
    status: state.status,
    preset: {
      ...basePreset,
      llmBridgeName,
      llmBridgeConfig,
      systemPrompt: state.aiConfig.systemPrompt,
      enabledMcps,
    },
  };
}
```

## Todo

- [x] **프리셋 UI 제거**: 사이드바 및 라우트에서 Preset 관련 항목을 삭제하고, Agent 중심 내비게이션으로 정리한다.
- [x] **단계/검증 재정의**: 단계별 state를 `overview/category/aiConfig/status` 기반으로 다시 구성하고, Zod 검증과 단계 이동 게이트를 업데이트한다.
- [x] **AI Config 리팩터링**: 프리셋 선택 로직 없이도 BridgeModelSettings와 MCP 도구 선택이 동작하도록 상태·훅을 정리하고, Mock RPC에서 필요한 브릿지/도구 데이터를 노출한다.
- [x] **Settings Export/Import 정비**: Export JSON을 프리셋 스펙으로 유지하면서 UI에서는 에이전트 용어만 사용하도록 사본 텍스트/라벨을 교체하고, Import 밸리데이션 경로를 최신 state에 맞춘다.
- [x] **데이터 동기화**: 에이전트 생성/Import 후 React Query 캐시가 즉시 업데이트되어 목록·대시보드에 반영되도록 보강한다.
- [x] **테스트 보강**: 단계 전환/검증, 브릿지 로딩 실패/성공 케이스, MCP 직렬화, Export/Import 성공·실패, 캐시 업데이트 등을 Vitest + Testing Library로 추가한다.
- [x] **E2E 검증**: Playwright MCP 환경을 활용해 `http://localhost:5173/` 웹 UI에서 간소화된 4단계 흐름과 Export/Import를 점검한다. (필요 시 `apps/gui/src/renderer/rpc/mock-rpc-transport.ts`에 모의 데이터를 확장)
- [x] **문서 업데이트**: `GUI_CORE_INTEGRATION_GAPS_PLAN.md`와 관련 디자인 문서에 프리셋 UI 제거 및 Export/Import 정책 변경 내용을 반영한다.

## 작업 순서

1. **프리셋 UI 제거 및 라우팅 정리**: 사이드바·라우트를 정리하고 에이전트 전용 화면으로 전환한다.
2. **마법사 단계/상태 리팩터링**: 4단계 플로우(Overview → Category → AI Config → Settings)에 맞춰 상태·검증 로직을 재구성한다.
3. **AI Config & Export/Import 정비**: 브릿지/MCP 로딩, 요약 카드, Export/Import UX를 새로운 state와 Mock 데이터에 맞게 업데이트한다.
4. **데이터 동기화 및 테스트**: 생성/Import 후 데이터 반영을 보장하고, 단위·E2E 테스트 및 관련 문서를 갱신한다.

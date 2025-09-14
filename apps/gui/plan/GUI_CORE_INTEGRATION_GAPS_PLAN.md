# GUI ↔ Core Integration Gaps Plan

본 문서는 현 GUI 기능 중 Core 스펙/계약과 불일치하거나 목/로컬 저장소로 대체된 부분을 식별하고, 통합 방향과 TODO를 정의합니다. 목적은 SSOT(계약/문서) 우선으로 빈틈을 메우고, UX 흐름이 실제 데이터와 일치하도록 하는 것입니다.

**최종 업데이트**:

- Core Knowledge 인덱싱 아키텍처 구현 반영 (commit `01d411e`)
- GUI 컴포넌트 전체 분석 완료 (2025-01-09)
- UX 리뷰 피드백 반영 (2025-01-09)
- Figma 디자인 분석 및 반영 (2025-01-09)
- RPC 기반 구조 및 Core 통합 구현 완료 (2025-01-11)
  - ChatService 구현 (commit `d325735`, `ef67672`)
  - useChatHistory Core API 연동 (commit `c87c0c9`)
  - AI Config 하드코딩 제거 및 동적 Bridge 설정 (commit `681fe96`)
  
 2025-09-14 진행 현황 추가:
 - GUI monorepo 그린 베이스라인 확보: typecheck/build/lint/test 모두 통과 (commit `0df4a4a`)
 - Vitest 멀티 프로젝트 구성 검증 및 스크립트 정리(렌더러 jsdom, 메인 node)
 - Knowledge 계약/메인 서비스/렌더러 어댑터 스켈레톤 연결 및 테스트 보강
 - KnowledgeBaseManager 일부 RPC 연동 착수: 목록/통계는 RPC 기반으로 조회
 - MCP Tool Manager 폴백 데이터 제거 및 빈 상태/에러 처리 UX 반영
 - Dashboard 통계 훅(useDashboardStats) 구현 및 테스트 추가, 초기 UI 연동 완료(하드코딩 제거 진행 중)

## Requirements

### 성공 조건

- [x] GUI의 주요 기능들이 Core 계약(contracts)과 1:1로 매핑되고, 목/로컬 저장소 의존이 제거된다. (부분 완료)
- [x] 에이전트 생성 시 LLM Bridge 선택/설정이 llm-bridge-spec 기준으로 노출/저장된다. ✅
- [x] MCP 도구 관리/연결이 Core MCP 레지스트리/메타데이터와 연동된다.
- [x] 지식베이스(문서) 관리가 로컬스토리지 대신 Core API로 CRUD/인덱싱 상태를 반영한다.
- [x] 채팅 히스토리/세션이 Core 세션/메시지 API와 정합되며, 훅/스토어가 계약 타입으로 동작한다. ✅
- [x] GUI 전용 기능(pin/archive, 카테고리)은 GUI 레이어에서 관리되고 Core와 분리된다. ✅
- [ ] 멀티 에이전트 협업 기능이 Core 오케스트레이션과 연동된다.
- [ ] 시스템 통계와 메트릭이 실시간으로 수집/표시된다.

## 테스트 환경 분리/전략 (보강)

### 목표

- GUI 테스트를 `renderer(jsdom)`와 `main(node)`로 분리하여 각 레이어 특성에 맞는 환경에서 검증한다.
- CI에서는 `pnpm test`로 두 프로젝트가 모두 수행되도록 구성한다.

### 구성

- 러너: Vitest Workspace(`vitest.config.ts`)
  - 프로젝트 `renderer`
    - 환경: `jsdom`
    - setup: `src/test/vitest.setup.ts` (`@testing-library/jest-dom/vitest`)
    - 포함: `src/renderer/**/__tests__/**/*.(test|spec).ts(x)`
  - 프로젝트 `main`
    - 환경: `node`
    - 포함: `src/main/**/__tests__/**/*.(test|spec).ts(x)`
- 스크립트(`apps/gui/package.json`)
  - `test` → 워크스페이스 전체 실행(두 프로젝트 모두)
  - `test:renderer` → `--project renderer`
  - `test:main` → `--project main`

### 운영 원칙

- `vitest.config.ts`는 Vitest `defineWorkspace` 기반으로 유지하며, 별도 단일용 설정 파일은 두지 않는다(혼선 방지).
- renderer 테스트는 DOM 상호작용 중심의 단위/통합 테스트를 포함하고, main 테스트는 Electron/Nest 로직 및 IPC/이벤트 브리지 단위 테스트를 포함한다.
- e2e는 Playwright로 별도 디렉터리(`apps/gui/e2e`)에서 운영한다.

### TODO

- [x] Vitest 멀티 프로젝트 구성 (renderer/main)
- [x] CI에서 `pnpm test`로 두 프로젝트 동시 실행 보장
- [ ] main 레이어에서 Electron 의존 모듈은 필요한 곳에 한해 mock 또는 경계 어댑터로 대체
- [ ] renderer 테스트 커버리지 기준 수립 및 주요 시나리오(프리셋 임포트, MCP 사용량 스트림, 대시보드) 보장

### 사용 시나리오

- 사용자는 4단계 마법사를 통해 에이전트를 생성한다 (Overview → Category → AI Config → Settings).
- 사용자는 Category 단계에서 6개 카테고리 중 선택하면 자동으로 관련 키워드가 설정된다.
- 사용자는 AI Config 단계에서 LLM 모델, 시스템 프롬프트, 파라미터, MCP 도구를 설정한다.
- 사용자는 에이전트를 export할 때 Preset 형식으로 내보내고, import할 때 Preset을 파싱하여 에이전트를 생성한다.
- 사용자는 MCP 도구 목록을 확인하고(메타데이터), 연결/해제/설정을 관리한다. 사용량/이벤트 스트림이 대시보드에 반영된다.
- 사용자는 에이전트별 지식 문서를 업로드/편집하고, 인덱싱/벡터화 진행 상황과 통계를 확인한다.
- 사용자는 채팅 히스토리에서 Pinned/Older 섹션으로 구분된 대화 목록을 확인한다.
- 사용자는 GUI에서 채팅을 고정(pin)하거나 보관(archive)할 수 있다 (로컬 상태로 관리).
- 사용자는 채팅에서 @멘션으로 여러 에이전트를 호출하고 협업 응답을 받을 수 있다.
- 사용자는 대시보드에서 실시간 시스템 통계와 사용 현황을 확인한다.

### 제약 조건

- Electron 메인은 CJS 유지(현 구조), ESM 전용 의존성은 타입 전용 혹은 동적 import로 사용.
- 생성물(gen) 파일은 계약 변경 후 코드젠으로만 업데이트; 수기 수정 금지.
- 하위 호환성 유지: 기존 API는 deprecated 처리 후 점진적 제거

## Knowledge 구현 상태 및 통합 전략

### Core에서 이미 구현된 부분

- ✅ `KnowledgeRepository`, `Knowledge`, `DocStore`, `SearchIndex` 인터페이스
- ✅ `FileDocStore`: 파일 기반 문서 저장소
- ✅ `Bm25SearchIndex`: BM25 검색 어댑터
- ✅ `KnowledgeImpl`, `KnowledgeRepositoryImpl`: 애그리게이트 구현
- ✅ agentId와 knowledgeId 분리 아키텍처

### 파사드 매핑 전략

```ts
class KnowledgeFacade {
  private agentKnowledgeMap = new Map<string, KnowledgeId>();
  private knowledgeRepo: KnowledgeRepository;

  // agentId → knowledgeId 매핑 관리
  async ensureKnowledge(agentId: string): Promise<Knowledge> {
    let knowledgeId = this.agentKnowledgeMap.get(agentId);
    if (!knowledgeId) {
      // 새 knowledge 생성 및 매핑
      const kb = await this.knowledgeRepo.create({
        name: `Agent ${agentId} Knowledge`,
      });
      knowledgeId = kb.id;
      this.agentKnowledgeMap.set(agentId, knowledgeId);
      // 영속화 필요
    }
    return await this.knowledgeRepo.get(knowledgeId);
  }

  // 모든 메서드는 agentId를 받아 내부적으로 매핑
  async createDoc(agentId: string, input: CreateDocInput) {
    const kb = await this.ensureKnowledge(agentId);
    return await kb.addDoc(input);
  }
}
```

## Interface Sketch

```ts
// 1) MCP Registry contracts (추가 제안)
export const McpRegistryContract = defineContract({
  namespace: 'mcp-reg',
  methods: {
    listTools: {
      channel: 'mcp.reg.list-tools',
      response: z.array(z.record(z.string(), z.unknown())),
    },
    connect: {
      channel: 'mcp.reg.connect',
      payload: McpConfigSchema,
      response: z.object({ success: z.boolean(), error: z.string().optional() }),
    },
    disconnect: {
      channel: 'mcp.reg.disconnect',
      payload: z.string(),
      response: z.object({ success: z.boolean(), error: z.string().optional() }),
    },
  },
});

// 2) Knowledge contracts (Core 타입과 정렬)
export const KnowledgeDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()).optional(),
  source: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), text: z.string() }),
    z.object({ kind: z.literal('fileRef'), path: z.string() }),
  ]),
  createdAt: z.string(),
  updatedAt: z.string(),
  indexedAt: z.string().optional(),
  status: z.enum(['draft', 'ready', 'indexing', 'indexed', 'failed']),
});

export const SearchHitSchema = z.object({
  docId: z.string(),
  score: z.number(),
  highlights: z.array(z.string()).optional(),
  indexName: z.string(),
});

export const IndexStatsSchema = z.object({
  docCount: z.number(),
  lastBuiltAt: z.string().optional(),
});

export const KnowledgeContract = defineContract({
  namespace: 'kb',
  methods: {
    createDoc: {
      channel: 'kb.create-doc',
      payload: z.object({
        agentId: z.string(),
        title: z.string(),
        source: KnowledgeDocSchema.shape.source,
        tags: z.array(z.string()).optional(),
      }),
      response: KnowledgeDocSchema,
    },
    listDocs: {
      channel: 'kb.list-docs',
      payload: z.object({
        agentId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().optional(),
      }),
      response: z.object({
        items: z.array(KnowledgeDocSchema),
        nextCursor: z.string().optional(),
      }),
    },
    deleteDoc: {
      channel: 'kb.delete-doc',
      payload: z.object({ agentId: z.string(), docId: z.string() }),
      response: z.object({ success: z.boolean() }),
    },
    reindex: {
      channel: 'kb.reindex',
      payload: z.object({
        agentId: z.string(),
        indexes: z.union([z.string(), z.array(z.string())]).optional(),
      }),
      response: z.object({ success: z.boolean() }),
    },
    stats: {
      channel: 'kb.stats',
      payload: z.object({ agentId: z.string() }),
      response: z.record(z.string(), IndexStatsSchema), // index name → stats
    },
    search: {
      channel: 'kb.search',
      payload: z.object({
        agentIds: z.array(z.string()),
        query: z.string(),
        topK: z.number().optional().default(10),
      }),
      response: z.array(SearchHitSchema),
    },
    // 인덱싱 상태 스트림 (선택적)
    'indexing.events': {
      channel: 'kb.indexing.events',
      streamResponse: z.object({
        type: z.enum([
          'indexing.started',
          'indexing.progress',
          'indexing.completed',
          'indexing.failed',
        ]),
        agentId: z.string(),
        docId: z.string().optional(),
        progress: z.number().optional(), // 0-100
        error: z.string().optional(),
      }),
    },
  },
});

// 3) GUI 전용 Chat 상태 (Core와 분리)
export interface GuiChatState {
  sessionId: string;
  isPinned: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  displayOrder?: number;
}

// GUI에서 로컬 상태로 관리 (localStorage 또는 Electron Store)
export const GuiChatStateSchema = z.object({
  sessionId: z.string(),
  isPinned: z.boolean(),
  isArchived: z.boolean(),
  archivedAt: z.date().optional(),
  displayOrder: z.number().optional(),
});

// 4) System Stats Contract
export const SystemStatsContract = defineContract({
  namespace: 'stats',
  methods: {
    getOverview: {
      channel: 'stats.overview',
      response: z.object({
        activeChats: z.number(),
        totalAgents: z.number(),
        activeAgents: z.number(),
        connectedModels: z.number(),
        totalPresets: z.number(),
        activePresets: z.number(),
      }),
    },
    getUsageMetrics: {
      channel: 'stats.usage',
      payload: z.object({
        period: z.enum(['hour', 'day', 'week', 'month']).optional(),
      }),
      response: z.object({
        totalMessages: z.number(),
        totalTokens: z.number(),
        byAgent: z.record(z.string(), z.number()),
        byModel: z.record(z.string(), z.number()),
      }),
    },
  },
});

// 5) GUI 전용 카테고리 매핑 (Application 레이어)
// Core는 keywords만 사용하고, GUI에서 카테고리 → keywords 매핑 관리
// Figma 디자인 기반: 6가지 카테고리
export const GuiAgentCategories = [
  'general', // General Purpose
  'research', // Research
  'development', // Development
  'creative', // Creative
  'analytics', // Analytics
  'customer_support', // Customer Support
] as const;

export type GuiAgentCategory = (typeof GuiAgentCategories)[number];

// GUI에서 카테고리 선택 시 자동으로 설정될 keywords
export const GuiCategoryKeywordsMap: Record<GuiAgentCategory, string[]> = {
  general: ['general', 'assistant', 'help', 'versatile'],
  research: ['research', 'search', 'academic', 'papers', 'fact-checking', 'analysis'],
  development: ['coding', 'programming', 'developer', 'git', 'debug', 'software'],
  creative: ['creative', 'writing', 'design', 'art', 'content', 'copywriting'],
  analytics: ['analytics', 'data', 'analysis', 'visualization', 'insights', 'reports'],
  customer_support: ['support', 'customer', 'service', 'help', 'faq', 'engagement'],
};

// 6) LLM Bridge 동적 설정 인터페이스 (추가)
// AI Config 단계에서 Bridge 기반 동적 UI 생성
interface BridgeBasedAIConfig {
  // 1. Bridge 선택
  selectedBridge: string;

  // 2. 선택된 Bridge의 manifest 기반 모델 목록
  availableModels: string[]; // manifest.models 또는 manifest.supportedModels

  // 3. Bridge별 config schema 기반 동적 파라미터
  bridgeConfig: Record<string, unknown>; // manifest.configSchema 기반

  // 4. 공통 파라미터 (Bridge가 지원하는 경우만 표시)
  commonParams?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

// Bridge manifest 예시
interface BridgeManifest {
  id: string;
  name: string;
  models?: string[];
  supportedModels?: string[];
  configSchema?: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  supportedParameters?: string[]; // ['temperature', 'maxTokens', 'topP']
}
```

## 작업 항목

### 작업 상태 범례

- ✅ **완료**: 구현 완료
- 🟡 **진행 가능**: Core 기능 존재, GUI 작업만 필요
- 🚧 **차단됨**: Core 의존성으로 인해 진행 불가
- 🤔 **결정 필요**: 아키텍처/설계 결정 필요
- ❓ **불명확**: 요구사항 자체가 불명확

### 테스트 방침

- 단위/훅/어댑터 테스트를 우선 추가하고, 통합(E2E)은 핵심 플로우 중심으로 추후 보강
- ServiceContainer 기반 훅은 스텁 어댑터로 검증(useDashboardStats, useMcpUsageStream 등)
- 어댑터는 호출 플로우(ensure→list/add 등) 단위 테스트로 회귀 방지
- UI는 최소 스냅샷/상태 전이(필수) + 핵심 상호작용(재시도/적용) 위주로 추가

### 작업 요약

| 작업                      | 상태        | 난이도 | 차단 사유 / 비고                                    |
| ------------------------- | ----------- | ------ | --------------------------------------------------- |
| 작업 1: RPC 구조          | ✅ 완료     | -      | -                                                   |
| 작업 2: Agent 생성 마법사 | 🟡 부분완료 | 중간   | 5단계 마법사 진행, AI Config/카테고리 부분완료      |
| 작업 3: MCP 도구 관리     | ✅ 완료     | 중간   | 스트리밍/폴백 제거 포함 완료                        |
| 작업 4: Knowledge Base    | 🟡 부분완료 | 중상   | Core 연동/GUI 마이그레이션 완료, 성능/추가기능 후속 |
| 작업 5: Chat History      | ✅ 완료     | -      | -                                                   |
| 작업 6: 카테고리/키워드   | 🟡 진행가능 | 낮음   | GUI 전용 작업                                       |
| 작업 7: Bridge 등록 UI    | 🟡 진행가능 | 중간   | GUI 작업                                            |
| 작업 8: Dashboard 통계    | 🟡 진행가능 | 중간   | 기존 API 조합 가능                                  |
| 작업 9: Multi-Agent       | 🟡 진행가능 | 높음   | Orchestrator 활용 가능                              |
| 작업 10: Tool Builder     | 🟡 진행가능 | 중간   | Built-in Tools로 전환                               |
| 작업 11: RACP             | 🗑️ 제거     | -      | 향후 재검토                                         |

### 작업 1: RPC 기반 구조 구축 ✅ **완료**

**현황**:

- ~~Main-Renderer 간 RPC Contract만 정의됨~~
- ~~실제 Core 서비스 연동 구현 누락~~
- ~~Controller stub 파일들만 존재~~

**완료된 내용** (2025-01-11):

- [x] Core 서비스 래퍼 구현 (ChatService 완료, KnowledgeService, McpService 대기)
- [x] ChatController stub → 실제 구현으로 교체
- [x] ChatService에서 FileBasedChatManager 활용한 Core 통합
- [x] 메시지 영속성을 위한 AgentService 연동
- [x] 타입 안전성 및 에러 처리 구현

### 작업 2: Agent 생성 5단계 마법사

**현황**:

- 실제 구현은 5단계: Overview → Category → Preset → AI Config → Settings (`SubAgentCreate.tsx`)
- AI Config의 하드코딩 제거 및 동적 브릿지/모델 연동은 진행됨
- 설치된 브릿지는 `bridge.list`(ID) + `bridge.get-config` 조합으로 로드하여 모델을 표시함

**디자인 분석 (Figma)**:

- Overview: 이름, 설명, 아바타 URL, 태그 입력
- Category: 6가지 카테고리 중 선택 (Research, Development, Creative, Analytics, Customer Support, General Purpose)
- AI Config: Bridge 선택 → 모델 선택, 시스템 프롬프트, Temperature/Max Tokens/Top P 설정, 도구 선택
- Settings: 초기 상태 설정 (Active/Idle/Inactive)

**작업 내용**:

- [ ] AgentCreate 5단계 마법사 UI 정합성 확인(Overview/Category/Preset/AI Config/Settings)
- [ ] Overview 탭: 기본 정보 입력 폼(검증 포함)
- [ ] Category 탭: 카테고리 카드 선택 UI (6개 카테고리)
- [ ] Preset 탭: 프리셋 선택/미리보기(현재 유지, 추후 제거 여부 결정)
- [x] AI Config 탭: ✅ **부분 완료**
  - [x] 하드코딩된 모델 목록 제거 ✅
  - [x] 브릿지/모델 동적 로딩: `useInstalledBridges`(ID 목록 + 개별 config) 훅 기반 ✅
  - [x] Bridge 선택/모델 선택 UI ✅
  - [x] Bridge별 동적 파라미터 UI(현재 공통 파라미터) ✅
  - [x] 시스템 프롬프트 텍스트에어리어(프리셋 systemPrompt 오버라이드) ✅
  - [x] MCP 도구 선택 카드 동적 로딩(선택 결과 preset.enabledMcps 반영) ✅
- [ ] Settings 탭: 상태 선택 드롭다운
- [x] Export/Import 기능(텍스트 기반) 구현

**테스트**

- [x] Export/Import 유틸 직렬화/파싱/적용 단위 테스트 추가
- [ ] SubAgentCreate 단계 전이/검증 최소 UI 테스트
- [ ] Import 실패(잘못된 JSON) 에러 표시 테스트

**UX/구현 방침(심플 버전 — Clipboard/입력창 기반)**
[상세 설계 문서 참조: Wizard Settings Validation & Preview UX](./WIZARD_SETTINGS_VALIDATION_PREVIEW_DESIGN.md)

- Export: “Generate JSON” → 미리보기(TextArea) → “Copy to Clipboard”만 지원(파일 저장은 보류)
  - JSON은 pretty-print(2 spaces) + `schemaVersion: 1` 포함
  - 성공/실패 Toast 제공
- Import: 파일 선택 대신 입력창(TextArea) 중심
  - 붙여넣기 → “Validate”/“Apply” 버튼
  - 검증 실패 시: Invalid JSON/스키마 위배 항목을 사람이 읽기 쉬운 메시지로 표출
  - 성공 시: 현재 값 vs 적용될 값 간단 비교(이름/상태/브릿지/enabledMcps 등) 후 Apply
- 스키마/검증
  - Agent: name/description/status, preset.name 필수. 선택 필드는 기본값 대입
  - Preset-only JSON도 수용(자동으로 Agent 껍데기에 감싸는 보정 로직 — 기본 name/description 적용)
- 제한/보안
  - 입력 길이/크기 제한(예: 1–2MB), XSS 방지를 위한 안전한 렌더링
  - Clipboard 실패 시 안내(권한/브라우저 정책)

**향후 확장(후속)**

- 파일 업/다운로드(대화상자/IPC) 추가, 스키마 버전 마이그레이션, 포맷팅/샘플 템플릿 제공 등

참고:

- 기존 문서의 “BridgeModelSettings” 컴포넌트 언급은 현재 소스에 존재하지 않으며, 훅 기반(`hooks/queries/use-bridge.ts`) + `ModelManager*` 조합으로 대체됨. 문서 용어를 훅 기반 접근으로 정정함.
- `useAIConfigurations.ts`는 `BridgeServiceAdapter.listInstalled()`를 가정하나 실제 어댑터에는 없음. `use-bridge` 훅으로 교체 또는 훅 시그니처 수정 필요(TODO 추가).

### 작업 3: MCP 도구 관리/연결 🟡 **부분 완료** (Core/어댑터 구현)

**현황**:

- ✅ Core MCP Registry/Service/Repository/Usage 레이어 완비 (`packages/core/src/tool/mcp/*`)
- ✅ Main 프로세스 API: `apps/gui/src/main/mcp/{mcp.controller.ts,mcp.api.module.ts,mcp.service.ts}`
- ✅ Renderer 어댑터: `apps/gui/src/renderer/rpc/adapters/mcp.adapter.ts`에 목록/등록/해제/연결/호출/사용량 구현
- 🟡 이벤트 스트림(`usage.events`)은 컨트롤러에서 미구현(TODO)
- 🟡 GUI 매니저 컴포넌트는 `McpToolManager.tsx`(단수 명칭)로 존재하며, 실패 시 샘플 데이터 폴백 로직 유지

**발견된 Core 기능**:

- ✅ `McpRegistry`: MCP 연결 관리 (register/unregister/get/getTool)
- ✅ `McpMetadataRegistry`: 메타데이터와 실제 MCP 통합 관리
- ✅ `McpToolRepository`: 도구 메타데이터 영속화
- ✅ `McpService`: MCP 서비스 계층
- ✅ 사용량 추적: `McpUsageService`, `McpUsageRepository`
- ✅ 이벤트 기반 아키텍처 완비

**구현 가능 여부**: ✅ 즉시 가능(스트림/폴백 제거 등 남음)

**작업 내용**:

- [x] 계약: `McpContract` 정의/사용(목록/등록/해제/연결/호출/사용량)
- [x] Main 바인딩: `McpApiModule` 통해 서비스/컨트롤러 연결
- [x] 컨트롤러 구현: Registry/Service 래핑 완료
- [x] 어댑터: `McpServiceAdapter` 메서드 구현 완료(list/register/unregister/connect/disconnect/invoke/usage)
- [x] GUI: `McpToolManager` 폴백 샘플 데이터 제거(Empty state 처리). 어댑터 연동 유지
- [x] 이벤트: `usage.events` 스트리밍(Observable/Emitter) 구현 및 렌더러 구독 훅 연결
  - 메인: OutboundChannel 기반 스트림 노출(`mcp.usage.events`) — stats.updated 이벤트 우선 구현
  - 렌더러: `useMcpUsageStream` 훅 추가(최신 이벤트 구독)
  - 주: 개별 log.created 페이로드는 추후 Core hook 노출 시 확장
- [x] 사용량: `renderer/rpc/services/mcp-usage.service.ts` 제공(렌더러) — 화면 반영은 추가 필요

**예상 난이도**: 중상 (Core 기능은 완비, 통합 작업만 필요)

**테스트**

- [x] `useMcpUsageStream` 이벤트 수신 시 lastEvent 업데이트 단위 테스트
- [ ] MCP 매니저 UI: 빈 상태/에러/재시도 경로(후속)

### 작업 4: Knowledge Base(문서) — 로컬스토리지 → Core API 🤔 **설계 결정 필요**

**현황**:

- `KnowledgeBaseManager`는 localStorage 기반
- Core Knowledge 인덱싱 아키텍처 구현 완료
- agentId → knowledgeId 매핑 필요

**리뷰 피드백 반영**:

- 🔍 **"agent별 knowledge 매핑은 GUI가 아닌 Core의 agent가 지원해야 맞는 것 같다"**
- ✅ 타당한 지적: Agent와 Knowledge의 관계는 Core 레벨에서 관리되어야 함
- 현재 Core의 Agent 인터페이스에는 Knowledge 연결이 없음

**필요한 Core 변경사항**:

1. Agent 메타데이터에 `knowledgeId` 필드 추가
2. AgentService에서 Agent 생성 시 Knowledge 자동 생성
3. Agent API에 Knowledge 접근 메서드 추가

**구현 방향**:

- **Option A**: Core Agent 변경을 기다림 (권장)
- **Option B**: GUI에서 임시 매핑 관리 (기술 부채)

**작업 내용**:

- [x] 계약: `KnowledgeContract` 정의 (스켈레톤: `apps/gui/src/shared/rpc/contracts/knowledge.contract.ts`)
- [x] API 스캐폴딩: 메인 모듈/컨트롤러/서비스 추가(파일 기반 저장 + 에이전트 매핑) ✅
- [x] 렌더러 어댑터/클라이언트 추가 및 bootstrap 등록 ✅
- [x] GUI 컴포넌트: `KnowledgeBaseManager` Core 어댑터로 전환(목 제거) ✅
- [ ] 마이그레이션: localStorage → FileDocStore 헬퍼 구현
- [ ] 성능 최적화: `allDocs({ chunkSize })` 활용
- [ ] 에러 핸들링: 인덱싱 실패 시 retry 정책
- [ ] LLM 통합: 자동 태그 생성, 문서 요약

**예상 난이도**: 중상 (복잡한 매핑 로직)

**테스트**

- [x] knowledge.adapter: `ensure→list/add` 콜 플로우 단위 테스트
- [ ] KnowledgeBaseManager: 검색/미리보기 연동 UI 테스트(후속)
- [ ] 인덱싱 진행률 스트림(events) 구독 훅/표시 테스트(후속)

### 작업 5: 채팅 히스토리/세션 연동 ✅ **완료**

**현황**:

- ~~`useChatHistory` 없음, `useChatState`만 존재~~
- ~~ChatHistory 컴포넌트에 pin/archive UI는 있으나 기능 없음~~

**완료된 내용** (2025-01-11 업데이트 반영):

- [x] 새로운 `useChatHistory` 훅 생성 (Core API 연동) ✅
- [x] `use-chat-sessions` 훅 추가 (세션 목록, 삭제 기능) ✅
- [x] GUI 전용 상태 관리: GuiChatState (localStorage) ✅
- [x] Pin/Archive 로직은 GUI 레이어에서만 관리 ✅
- [x] Core 세션 데이터와 GUI 상태 동기화 구조 설계 ✅
- [x] ChatHistory UI를 세션 기반 컴포넌트로 업데이트
  - `SessionBasedChatHistory.tsx`, `SessionBasedChatView*.tsx` 적용

### 작업 6: 에이전트 생성 — 카테고리/키워드 정합

**현황**:

- GUI는 카테고리 UI가 있으나 실제로는 keywords로 필터링
- 일관성 없는 매핑

**작업 내용**:

- [x] GUI 전용 카테고리 상수 정의 (GuiAgentCategories)
- [x] 카테고리 → keywords 매핑 테이블 구현 (GuiCategoryKeywordsMap)
- [x] SubAgentCreate: 카테고리 선택 시 keywords 자동 설정
- [ ] SubAgentManager: 카테고리 기반 필터링 (keywords 활용)

**테스트**

- [ ] SubAgentManager: 카테고리 선택 시 필터링 결과가 매핑대로 적용되는지 단위 테스트

### 작업 7: Bridge 등록 UI

**현황**:

- `ModelManager`의 "Add Model" 버튼 동작 없음

**작업 내용**:

- [x] 등록 다이얼로그: manifest JSON 입력(파일 업로드는 후속) ✅
- [x] `BridgeServiceAdapter.registerBridge` 연동(훅 기반) ✅
- [x] `useInstalledBridges` 재검증 및 등록 후 캐시 무효화 처리 ✅
- [x] 에러 처리/검증(간단한 JSON 검사 및 메시지 표시) ✅

**테스트**

- [ ] 등록 다이얼로그: 유효/무효 JSON 입력 시 동작(등록/에러 메시지) 테스트
- [ ] 등록 성공 후 캐시 무효화 호출 여부 검증 테스트

### 작업 8: Dashboard 통계 — 실시간 데이터 🟡 **진행 가능** (기존 API 활용)

**현황**:

- Active Chats: '3', Models: '5' 등 하드코딩
- 실시간 통계 API 없음

**리뷰 피드백 반영**:

- 🔍 **"이미 등록된 상태 정보들을 보여주는 거니까 꼭 core에 필요한가?"**
- ✅ 타당한 지적: 각 기능별 조회 API를 조합하면 충분
- Core에 별도 메트릭 서비스를 만드는 것은 성급할 수 있음

**활용 가능한 기존 API**:

- AgentService: 에이전트 수, 상태별 카운트
- BridgeService: 설치된 Bridge/Model 수
- ConversationService: 활성 채팅 수
- PresetService: Preset 통계
- MCP 관련: 연결된 도구 수 (McpMetadataRegistry)

**구현 가능 여부**: ✅ 즉시 가능

**작업 내용**:

- [ ] 각 서비스 어댑터 조합으로 통계 구성(agents/bridges/models/sessions/presets/mcp usage)
- [x] `Dashboard.tsx`의 하드코딩 지표 제거(Active Chats/Models 등 부분 제거)
- [x] 질의 훅 작성 및 캐싱 정책 설정 (`use-dashboard.ts` 추가)
- [x] 1차 적용: `Dashboard.tsx`에 Active Chats/Models 실데이터 반영
- [ ] Dashboard에서 여러 API 조합하여 통계 표시
- [ ] 주기적 업데이트 (폴링 방식)
- [ ] 캐싱 전략으로 성능 최적화

**예상 난이도**: 중간

**테스트**

- [x] useDashboardStats 훅: 지표 집계 및 MCP 24h 합계 단위 테스트
- [ ] Dashboard 카드: 에러 표시/Retry 상호작용(컴포넌트 테스트)

### 작업 9: Message Mentions — Multi-Agent 협업 🟡 **진행 가능** (Orchestrator 활용)

**현황**:

- `MessageInputWithMentions`에서 멘션 UI는 있으나
- 멘션된 에이전트들에게 메시지 전달 로직 없음

**리뷰 피드백 반영**:

- 🔍 **"packages/src/orchestrator를 활용하는 agent만 구현하면 될 듯한데"**
- ✅ **Core에 Orchestrator 존재 확인** (`packages/core/src/orchestrator/router/`)

**발견된 Core 기능**:

- ✅ `RouterEngine`: Agent 라우팅 및 순위 결정
- ✅ 전략 패턴: BM25, Mention, Keyword 등 다양한 전략
- ✅ `aggregateResults`: 여러 전략 점수 집계
- ✅ `rankCandidates`: Agent 우선순위 결정

**구현 방향**:

- Orchestrator를 활용하는 "Multi-Agent Coordinator" Agent 생성
- 멘션된 에이전트들을 RouterEngine으로 처리
- 응답 병합은 Coordinator Agent가 담당

**작업 내용**:

- [ ] UX 설계: 멘션 시 에이전트 응답 순서/표시 방법
- [ ] ChatContract에 mentionedAgents 필드 추가
- [ ] Core에 멀티 에이전트 라우팅
- [ ] 응답 병합 전략 (순차/병렬)
- [ ] UI: 멀티 에이전트 응답 구분 표시

**예상 난이도**: 높음 (Orchestrator 활용으로 단순화)

### 작업 10: Tool Builder — Built-in Tools 관리 🟡 **진행 가능**

**현황**:

- `ToolBuilder`는 커스텀 도구 개념
- MCP와 별개로 존재

**리뷰 피드백 반영**:

- 🔍 **"MCP와 유사하지만 내부에서 제공하는 일종의 built-in tool"**
- ✅ **명확한 차별화**: 실행환경에 따른 고유한 내부 도구
- 예시: Electron webview 검색, 파일 시스템 접근 등
- 장기 계획: GraphRAG, 대화 분석 기반 도구 자동 생성

**Core에 발견된 기능**:

- ✅ `BuiltinTool` 인터페이스 (`packages/core/src/tool/builtin/`)
- ✅ `BuiltinToolManager` 클래스

**구현 방향**:

- Tool Builder를 Built-in Tool 생성/관리 UI로 전환
- Electron 환경 특화 도구 구현
- MCP와 명확히 구분되는 UI/UX 제공

**작업 내용**:

- [ ] BuiltinTool Contract 정의
- [ ] Electron 특화 도구 구현 (webview 검색 등)
- [ ] Tool Builder UI를 Built-in Tool 관리로 개편
- [ ] 도구 생성/편집/테스트 워크플로우

**예상 난이도**: 중간

**테스트**

- [x] useDashboardStats 훅: 지표 집계 및 MCP 24h 합계 단위 테스트
- [ ] Dashboard 카드: 에러 표시/Retry 상호작용(컴포넌트 테스트)

### 작업 11: RACP Manager 🗑️ **제거 권장**

**현황**:

- 로드맵만 표시하는 placeholder
- RACP(Remote Agent Communication Protocol) 정의 없음

**리뷰 피드백 반영**:

- 🔍 **"당장은 제거해도 좋을 것 같다"**
- **RACP 개념 설명**: 고비용 GPU 리소스 없을 때 스케일아웃 용도
- 관리자가 여러 노트북을 연결하여 병렬 작업 처리
- 원격 질의 및 결과 전달 아키텍처

**향후 방향**:

- 현재는 제거하고 향후 요구사항이 명확해지면 재검토
- 분산 처리가 필요한 시점에 아키텍처 설계

**작업 내용**:

- [x] RACPManager 컴포넌트 제거
- [x] 메뉴에서 RACP 항목 제거

**예상 난이도**: 없음 (제거만 필요)

## 구현 계획

### 단계 1: 기반 구축 (1주) ✅ **완료**

**우선 구현해야 할 기반 작업**:

- [x] 작업 1: RPC 기반 구조 구축 ✅
- [x] 작업 6 일부: GUI 전용 카테고리 상수 정의 (계획서에 반영) ✅
- [x] 작업 8 일부: 하드코딩 제거 (모델 목록 완료, Dashboard 통계 대기) ✅

### 단계 2: Agent 생성 및 관리 (1주) **진행 중**

**Agent 관련 기능 구현**:

- [ ] 작업 2: Agent 생성 4단계 마법사 (AI Config 부분 완료)
- [ ] 작업 7: Bridge 등록 UI
- [ ] 작업 6: 카테고리/키워드 정합

### 단계 3: 데이터 저장소 통합 (1주) **부분 완료**

**Core API 연동**:

- [ ] 작업 4: Knowledge Base 통합
- [x] 작업 5: 채팅 히스토리/세션 연동 ✅

### 단계 4: 고급 기능 (1주)

**실시간 및 협업 기능**:

- [ ] 작업 3: MCP 도구 관리
- [ ] 작업 8: Dashboard 실시간 통계
- [ ] 작업 9: Multi-Agent 멘션

### 단계 5: 정리 및 최적화 (3-5일)

**기술 부채 정리**:

- [ ] 작업 10: Tool Builder 정리
- [ ] 작업 11: RACP Manager 정리
- [ ] 전체 타입 안전성 검증
- [ ] 테스트 및 문서화

## 기술 부채 정리

1. **하드코딩 제거**
   - 모델 목록
   - 대시보드 통계
   - 샘플 데이터

2. **UI/UX 일관성**
   - 카테고리 vs 키워드
   - Status 표시
   - Empty state

3. **타입 안전성**
   - any 타입 제거
   - Core 타입 재사용
   - Props 타입 강화

4. **테스트 커버리지**
   - 통합 테스트
   - 마이그레이션 테스트
   - 성능 테스트

## 용어 정리

- **knowledgeId**: 지식베이스 단위 식별자 (내부)
- **agentId**: 에이전트 식별자 (외부 공개)
- **Index-first**: BM25/Vector 등이 1급 구성요소
- **파사드**: agentId → knowledgeId 매핑 계층
- **RACP**: Remote Agent Communication Protocol
- **MCP**: Model Context Protocol

## 성공 지표

1. **기능 완성도**
   - 모든 GUI 기능이 실제 Core API 사용
   - 목/샘플 데이터 완전 제거
   - GUI 전용 기능과 Core 기능의 명확한 분리

2. **성능**
   - Knowledge 검색 < 100ms
   - 대시보드 업데이트 < 1초

3. **안정성**
   - 마이그레이션 데이터 손실 0
   - 타입 에러 0

4. **사용성**
   - Agent 생성 시 통합된 설정 UI
   - 직관적인 카테고리/키워드 매핑
   - 매끄러운 멀티 에이전트 멘션 UX

## 리뷰 반영 주요 발견사항 (2025-01-11)

### Core 기능 재발견

1. **MCP 완전 구현 존재**
   - `McpRegistry`, `McpMetadataRegistry`, `McpService` 등 완전한 구조
   - 사용량 추적, 이벤트 기반 아키텍처 포함
   - GUI 통합만 필요한 상태

2. **Orchestrator 존재**
   - Multi-Agent 협업을 위한 Router/Engine 구현
   - 다양한 전략 패턴 지원
   - GUI에서 활용만 하면 됨

3. **Built-in Tools 지원**
   - MCP와 별개의 내부 도구 시스템
   - Electron 환경 특화 가능

### 아키텍처 개선 사항

1. **Knowledge ↔ Agent 연결**
   - Core Agent 레벨에서 관리되어야 함
   - GUI 매핑은 임시방편일 뿐

2. **Dashboard 통계**
   - 별도 메트릭 서비스 불필요
   - 기존 API 조합으로 충분

3. **RACP 개념 정리**
   - GPU 리소스 없을 때 스케일아웃
   - 당장 제거, 향후 재검토

## 구현 완료 내역 (2025-01-11)

### 1. ChatService 및 RPC 구조 구현

- Core의 `FileBasedChatManager`를 활용한 ChatService 구현
- ChatController를 실제 구현으로 교체 (stub 제거)
- 메시지 영속성을 위한 AgentService 연동
- Message → MessageHistory 타입 변환 처리

### 2. Chat History Core API 연동

- `useChatHistory` 훅 생성 - Core API와 연동
- `use-chat-sessions` 훅 추가 - 세션 목록, 삭제 기능
- ConversationServiceAdapter 활용한 페이지네이션 처리
- GUI 전용 상태(pin/archive) localStorage 관리 구조

### 3. AI Config 동적 Bridge 설정

- 훅 기반 설계로 전환: `hooks/queries/use-bridge.ts` 활용
- 하드코딩된 모델 목록 완전 제거 (gpt-4o, gpt-4o-mini, claude-3-5-sonnet)
- BridgeServiceAdapter를 통한 동적 Bridge/Manifest 로딩(`getBridgeIds` + `getBridgeConfig`)
- Bridge manifest 기반 모델 선택 UI 구현
- 모델/브릿지 관리는 `ModelManager*.tsx` 중심으로 구성

## 레포 구조 매핑 (Source of Truth)

- Core Chat: `packages/core/src/chat/file/file-based-chat.manager.ts`
- Core MCP: `packages/core/src/tool/mcp/{mcp.ts,mcp.registery.ts,mcp-service.ts,...}`
- Core Orchestrator: `packages/core/src/orchestrator/router/*`
- GUI Main(API): `apps/gui/src/main/{chat,bridge,mcp}/*`
- GUI Contracts: `apps/gui/src/shared/rpc/contracts/{chat,agent,bridge,mcp}.contract.ts`
- GUI RPC 어댑터: `apps/gui/src/renderer/rpc/adapters/{conversation,agent,bridge,mcp}.adapter.ts`
- GUI MCP 매니저: `apps/gui/src/renderer/components/mcp/McpToolManager.tsx`
- GUI 대시보드: `apps/gui/src/renderer/components/dashboard/Dashboard.tsx`
- GUI 지식베이스(현행): `apps/gui/src/renderer/components/preset/KnowledgeBaseManager.tsx`(localStorage 기반)

주의: Core MCP 레지스트리 파일명은 `mcp.registery.ts`로 표기되어 있으며 철자에 유의 필요.

## 추가 TODO 정리

- [x] Knowledge 계약/모듈/어댑터 추가: `knowledge.contract.ts` → Main API → Renderer 어댑터/훅 → GUI 마이그레이션
- [x] `McpToolManager` 폴백 샘플 데이터 제거 및 어댑터 연동 완성
- [ ] 대시보드 지표 실데이터화(어댑터 조합) 및 하드코딩 제거 — 훅/테스트 완료, UI 잔여 치환 진행
- [ ] `useAIConfigurations.ts`를 `use-bridge` 훅 기반으로 교체 또는 시그니처 수정

### 품질 게이트(현재 상태)

- [x] typecheck 통과 (apps/*, packages/*)
- [x] build 통과 (GUI 포함)
- [x] lint 오류 0 (경고는 잔존, 추후 리팩터링)
- [x] test 통과 (renderer/main 분리 실행)

---

## 실행 계획 상세 (Dashboard/Knowledge/MCP)

### A. Dashboard 지표 수집 훅 (하드코딩 제거)

목표:

- `Dashboard.tsx`의 하드코딩 지표(Active Chats/Models 등)를 실데이터로 전환.

파일/구조:

- 새 훅: `apps/gui/src/renderer/hooks/queries/use-dashboard.ts`
  - `useDashboardStats()`
    - 데이터 소스 조합:
      - Agents: `AgentServiceAdapter.getAllAgentMetadatas()`
      - Bridges/Models: `BridgeServiceAdapter.getBridgeIds()` + `getBridgeConfig(id)`
      - Chats: `ConversationServiceAdapter.listSessions(pagination?)`
      - Presets: `PresetServiceAdapter.getAllPresets()`
      - MCP Usage: `McpUsageRpcService.getUsageStats()`
    - 쿼리 키: `['dashboard','stats']`, `staleTime: 10_000 ~ 60_000ms`
    - 반환 타입 예시:
      - `{ activeChats: number; agents: { total: number; active: number }; bridges: { total: number; models: number }; presets: { total: number; inUse: number }; mcp?: { requests?: number; tokens?: number } }`
  - `useDashboardActivity()` (초기 버전 간단 구현)
    - 최근 활동: 에이전트/프리셋 기반 메시지 생성 → 추후 실제 이벤트 연동

적용:

- `apps/gui/src/renderer/components/dashboard/Dashboard.tsx`에 훅 연동 시작 — 하드코딩 지표 점진 제거 중

수용 기준:

- 로딩/성공/에러 상태 구분 렌더링
- 최소 4개 지표(Active Chats/Agents/Models/Presets) 실데이터 표시(진행 중)
- 새 훅 유닛 테스트: 빈 상태/에러 상태 처리(완료)

비고:

- 정확한 세션 수 집계를 위해 필요 시 `chat.countSessions` API를 별도 PR로 제안(선택)

### B. Knowledge 계약 스켈레톤 (localStorage → Core API)

목표:

- `KnowledgeBaseManager.tsx`의 localStorage 의존 제거를 위한 RPC 골격 추가. 초기엔 임시 매핑(knowledgeId = agentId)로 운영.

계약/메인/어댑터/훅:

- 계약(신규): `apps/gui/src/shared/rpc/contracts/knowledge.contract.ts`
  - 메서드(초안):
    - `createForAgent`: `{ agentId } → { knowledgeId }`
    - `getByAgent`: `{ agentId } → { knowledgeId|null }`
    - `addDocument`: `{ knowledgeId, doc: { title, content, tags[] } } → { docId }`
    - `removeDocument`: `{ knowledgeId, docId } → { success }`
    - `listDocuments`: `{ knowledgeId, cursor?, limit? } → { items, nextCursor?, hasMore }`
    - `indexAll`: `{ knowledgeId } → { success }`
    - `search`: `{ knowledgeId, query, limit? } → { items }`
    - `getStats`: `{ knowledgeId } → { totalDocuments, totalChunks, lastUpdated, storageSize }`
- 메인(API):
  - `apps/gui/src/main/knowledge/knowledge.api.module.ts`
  - `apps/gui/src/main/knowledge/knowledge.controller.ts`
  - `apps/gui/src/main/knowledge/knowledge.service.ts`
  - Core의 `packages/core/src/knowledge/indexing/*` 사용, 임시 매핑: `knowledgeId = agentId`
- 렌더러:
  - 어댑터: `apps/gui/src/renderer/rpc/adapters/knowledge.adapter.ts`
  - 훅: `apps/gui/src/renderer/hooks/queries/use-knowledge.ts`
    - `useKnowledge(agentId)`/`useKnowledgeDocuments(knowledgeId, pg?)`
    - `useAddKnowledgeDocument`/`useRemoveKnowledgeDocument`/`useIndexAll`/`useKnowledgeStats`/`useKnowledgeSearch`

마이그레이션 단계:

1. 훅 주입(병행 모드) — localStorage + RPC 선택 가능
2. CRUD/인덱싱/검색을 RPC로 대체
3. localStorage 코드 제거 및 데이터 마이그레이션 검증

수용 기준:

- 계약 스키마(Zod) 유효성 검증
- 기본 CRUD/인덱싱/검색/통계 happy path 동작(메인/어댑터 기준 완료)
- `KnowledgeBaseManager`가 훅/어댑터를 통해 문서 목록/통계를 조회(업로드/삭제/검색 단계적 전환 예정)

### C. McpToolManager 폴백 제거 (샘플 데이터 삭제)

목표:

- `McpToolManager.tsx`에서 샘플 데이터 폴백을 제거하고 실제 어댑터만 사용.

대상/변경:

- 대상 파일: `apps/gui/src/renderer/components/mcp/McpToolManager.tsx`
- 목록 로딩: `McpServiceAdapter.listTools()`/`getAllToolMetadata()` 실패 시 폴백 대신 Empty state + 에러 메시지/재시도 버튼 표시
- 연결/해제: `connectTool(id)`/`disconnectTool(id)`로 통일
- 등록 플로우: 등록 다이얼로그 → `registerTool(payload)` → 성공 시 `connectTool(registered.id)` → 목록 invalidate
- 사용량 표기: `McpUsageRpcService.getAllUsageLogs()`/`getUsageStats()` 적용(없으면 “No usage yet”)
- ID/Name 정합성: 계약 스키마 기준, ID 없는 항목은 비활성 또는 제외
- 이벤트: `usage.events` 구현 전까지는 수동 새로고침, 구현 후 구독 훅으로 전환

수용 기준:

- 폴백 데이터 제거됨(완료)
- 에러/빈 상태 UI 정상 동작
- 등록/연결/해제/새로고침 플로우 검증

## 주요 결정사항 (리뷰 반영)

1. **Preset 메뉴 제거**
   - Agent 생성 시 모든 설정 통합 입력
   - Export/Import 시에만 Preset 형식 사용

2. **GUI/Core 분리 원칙**
   - Pin/Archive: GUI 전용 (localStorage)
   - 카테고리: GUI 전용 (keywords로 매핑)
   - Core는 최소한의 공통 기능만 보유

3. **UX 우선 접근**
   - 멀티 에이전트 멘션 UX 설계 선행
   - 사용자 흐름에 맞는 통합 UI 구성

4. **디자인 기반 구현**
   - 4단계 Agent 생성 마법사 (Overview → Category → AI Config → Settings)
   - 6개 카테고리 체계 (General Purpose, Research, Development, Creative, Analytics, Customer Support)
   - Chat History의 Pinned/Older 섹션 구분

## 다음 단계 작업 목록

### 🟢 즉시 진행 가능 (Core 의존성 없음)

#### 1. **Agent 생성 4단계 마법사 완성** (작업 2) - 우선순위: 높음

- Overview, Category, Settings 탭 구현
- Export/Import 기능 구현
- **예상 소요 시간**: 3-4일

#### 2. **카테고리/키워드 정합** (작업 6) - 우선순위: 높음

- GUI 전용 카테고리 상수 구현
- SubAgentCreate에 카테고리 선택 UI
- **예상 소요 시간**: 1-2일

#### 3. **ChatHistory UI 업데이트** - 우선순위: 중간

- Agent 기반 → Session 기반으로 변경
- Pin/Archive 기능 실제 동작
- **예상 소요 시간**: 2-3일

### 🟡 진행 가능하나 복잡도 높음

#### 4. **Knowledge Base Core API 통합** (작업 4) - 우선순위: 높음

- KnowledgeContract 정의 및 구현
- agentId → knowledgeId 매핑 파사드
  // review: agent 별 knowledge 의 매핑은 gui 에서 할게 아니라 core 의 agent 가 지원해야 맞는거 같아.
- localStorage 마이그레이션(목록/통계는 전환됨, 업로드/삭제/검색 단계 전환 필요)
- **예상 소요 시간**: 1주

#### 5. **Bridge 등록 UI** (작업 7) - 우선순위: 중간

- Bridge manifest 입력 다이얼로그
- 검증 및 에러 처리
- **예상 소요 시간**: 2-3일

### 🟡 진행 가능하나 복잡도 높음 (추가 발견)

#### 6. **MCP 도구 관리** (작업 3) - 우선순위: 높음

- Core에 완전한 MCP 기능 존재 확인
- McpService/Registry 통합 작업 필요
- **예상 소요 시간**: 4-5일

#### 7. **Dashboard 통계** (작업 8) - 우선순위: 중간

- 기존 API 조합으로 구현 가능 — 훅/테스트는 완료, UI 치환/상태 처리 마무리
- 별도 메트릭 서비스 불필요
- **예상 소요 시간**: 2-3일

---

### 이번 스프린트 권장 우선순위(요약)

- [ ] Dashboard UI의 하드코딩 지표 전량 치환 및 로딩/에러 상태 마감
- [ ] KnowledgeBaseManager 업로드/삭제/검색을 RPC 경로로 전환 (단계적 플래그 → 완전 이행)
- [ ] MCP `usage.events` 실시간 스트림 메인 구현 및 훅 구독 전환
- [ ] Electron 의존 경계 mock 정리(main 테스트 안정화)

#### 8. **Multi-Agent 협업** (작업 9) - 우선순위: 높음

- Core Orchestrator 활용 가능
- Multi-Agent Coordinator 구현
- **예상 소요 시간**: 5-7일

#### 9. **Tool Builder** (작업 10) - 우선순위: 낮음

- Built-in Tools로 재정의
- Electron 환경 특화 도구
- **예상 소요 시간**: 3-4일

### 🤔 Core 변경 대기

#### 10. **Knowledge Base** (작업 4) - Core Agent 변경 필요

- Agent ↔ Knowledge 연결은 Core 레벨 설계
- GUI에서 임시 매핑은 기술 부채
- **권장**: Core 변경 대기

### 🗑️ 제거 완료

#### 11. **RACP Manager** (작업 11)

- 향후 요구사항 명확화 시 재검토
- 스케일아웃 필요 시점에 재설계

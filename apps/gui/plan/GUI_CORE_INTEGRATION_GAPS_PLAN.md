# GUI ↔ Core Integration Gaps Plan

본 문서는 현 GUI 기능 중 Core 스펙/계약과 불일치하거나 목/로컬 저장소로 대체된 부분을 식별하고, 통합 방향과 TODO를 정의합니다. 목적은 SSOT(계약/문서) 우선으로 빈틈을 메우고, UX 흐름이 실제 데이터와 일치하도록 하는 것입니다.

**최종 업데이트**:

- Core Knowledge 인덱싱 아키텍처 구현 반영 (commit `01d411e`)
- GUI 컴포넌트 전체 분석 완료 (2025-01-09)
- UX 리뷰 피드백 반영 (2025-01-09)
- Figma 디자인 분석 및 반영 (2025-01-09)

## Requirements

### 성공 조건

- [ ] GUI의 주요 기능들이 Core 계약(contracts)과 1:1로 매핑되고, 목/로컬 저장소 의존이 제거된다.
- [ ] 에이전트 생성 시 LLM Bridge 선택/설정이 llm-bridge-spec 기준으로 노출/저장된다.
- [ ] MCP 도구 관리/연결이 Core MCP 레지스트리/메타데이터와 연동된다.
- [ ] 지식베이스(문서) 관리가 로컬스토리지 대신 Core API로 CRUD/인덱싱 상태를 반영한다.
- [ ] 채팅 히스토리/세션이 Core 세션/메시지 API와 정합되며, 훅/스토어가 계약 타입으로 동작한다.
- [ ] GUI 전용 기능(pin/archive, 카테고리)은 GUI 레이어에서 관리되고 Core와 분리된다.
- [ ] 멀티 에이전트 협업 기능이 Core 오케스트레이션과 연동된다.
- [ ] 시스템 통계와 메트릭이 실시간으로 수집/표시된다.

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

### 작업 1: RPC 기반 구조 구축

**현황**:

- Main-Renderer 간 RPC Contract만 정의됨
- 실제 Core 서비스 연동 구현 누락
- Controller stub 파일들만 존재

**작업 내용**:

- [ ] Core 서비스 래퍼 구현 (ChatService, KnowledgeService, McpService)
- [ ] Controller 자동 생성 스크립트 작성
- [ ] stub 파일들을 실제 구현으로 교체
- [ ] Renderer 어댑터 실제 RPC 호출 구현
- [ ] 에러 처리 및 재시도 로직 표준화

### 작업 2: Agent 생성 4단계 마법사

**현황**:

- Preset 메뉴가 제거되고 Agent 생성이 4단계 프로세스로 변경됨
- Agent 생성 단계: Overview → Category → AI Config → Settings
- AI Config 단계에서 모델 선택이 하드코딩됨
- 실제 설치 브릿지/manifest를 노출하지 않음

**디자인 분석 (Figma)**:

- Overview: 이름, 설명, 아바타 URL, 태그 입력
- Category: 6가지 카테고리 중 선택 (Research, Development, Creative, Analytics, Customer Support, General Purpose)
- AI Config: Bridge 선택 → 모델 선택, 시스템 프롬프트, Temperature/Max Tokens/Top P 설정, 도구 선택
- Settings: 초기 상태 설정 (Active/Idle/Inactive)

**작업 내용**:

- [ ] AgentCreate 4단계 마법사 UI 구현
- [ ] Overview 탭: 기본 정보 입력 폼
- [ ] Category 탭: 카테고리 카드 선택 UI (6개 카테고리)
- [ ] AI Config 탭:
  - [ ] **하드코딩된 모델 목록 제거** (현재: gpt-4o, gpt-4o-mini, claude-3-5-sonnet)
  - [ ] BridgeContract.list() 호출하여 설치된 Bridge 목록 조회
  - [ ] Bridge 선택 드롭다운 추가
  - [ ] 선택된 Bridge의 manifest.models 또는 manifest.supportedModels 표시
  - [ ] Bridge별 config schema에 맞는 동적 파라미터 UI 생성
  - [ ] PresetModelSettings 컴포넌트를 동적 Bridge 기반으로 리팩토링
  - [ ] 시스템 프롬프트 텍스트에어리어
  - [ ] 공통 파라미터 슬라이더 (Temperature, Max Tokens, Top P)
  - [ ] MCP 도구 선택 카드 동적 로딩
- [ ] Settings 탭: 상태 선택 드롭다운
- [ ] Export/Import 기능 구현

### 작업 3: MCP 도구 관리/연결

**현황**:

- `McpServiceAdapter` 대부분 placeholder(`getAllMcp/connectMcp/disconnectMcp` 미구현)
- `MCPToolsManager`는 실패 시 샘플 데이터로 폴백

**작업 내용**:

- [ ] 계약: `McpRegistryContract` 추가(도구 목록/연결/해제)
- [ ] 서버: main/mcp 모듈에 Registry service 바인딩 및 컨트롤러 추가
- [ ] 어댑터: `McpServiceAdapter`에 list/connect/disconnect 메서드 구현
- [ ] GUI: `MCPToolsManager` 데이터 로딩을 실제 계약으로 교체
- [ ] 사용량: `setUsageTracking` 채널 불일치 수정

### 작업 4: Knowledge Base(문서) — 로컬스토리지 → Core API

**현황**:

- `KnowledgeBaseManager`는 localStorage 기반
- Core Knowledge 인덱싱 아키텍처 구현 완료

**작업 내용**:

- [ ] 계약: `KnowledgeContract` 정의 (Core 타입 재사용)
- [ ] 파사드: `KnowledgeFacade` 구현 (agentId → knowledgeId 매핑)
- [ ] 마이그레이션: localStorage → FileDocStore 헬퍼 구현
- [ ] GUI 컴포넌트: `KnowledgeBaseManager` 전면 개편
- [ ] 성능 최적화: `allDocs({ chunkSize })` 활용
- [ ] 에러 핸들링: 인덱싱 실패 시 retry 정책
- [ ] LLM 통합: 자동 태그 생성, 문서 요약

### 작업 5: 채팅 히스토리/세션 연동

**현황**:

- `useChatHistory` 없음, `useChatState`만 존재
- ChatHistory 컴포넌트에 pin/archive UI는 있으나 기능 없음

**작업 내용**:

- [ ] 새로운 `useChatHistory` 훅 생성 (Core API 연동)
- [ ] GUI 전용 상태 관리: GuiChatState (localStorage/Electron Store)
- [ ] Pin/Archive 로직은 GUI 레이어에서만 관리
- [ ] Core 세션 데이터와 GUI 상태 동기화

### 작업 6: 에이전트 생성 — 카테고리/키워드 정합

**현황**:

- GUI는 카테고리 UI가 있으나 실제로는 keywords로 필터링
- 일관성 없는 매핑

**작업 내용**:

- [ ] GUI 전용 카테고리 상수 정의 (GuiAgentCategories)
- [ ] 카테고리 → keywords 매핑 테이블 구현 (GuiCategoryKeywordsMap)
- [ ] SubAgentCreate: 카테고리 선택 시 keywords 자동 설정
- [ ] SubAgentManager: 카테고리 기반 필터링 (keywords 활용)

### 작업 7: Bridge 등록 UI

**현황**:

- `ModelManager`의 "Add Model" 버튼 동작 없음

**작업 내용**:

- [ ] 등록 다이얼로그: manifest 입력(JSON/file)
- [ ] `useRegisterBridge` 호출 연동
- [ ] 에러 처리/검증

### 작업 8: Dashboard 통계 — 실시간 데이터

**현황**:

- Active Chats: '3', Models: '5' 등 하드코딩
- 실시간 통계 API 없음

**작업 내용**:

- [ ] SystemStatsContract 정의
- [ ] 메트릭 수집 서비스 구현
- [ ] Dashboard 실시간 업데이트

### 작업 9: Message Mentions — Multi-Agent 협업

**현황**:

- `MessageInputWithMentions`에서 멘션 UI는 있으나
- 멘션된 에이전트들에게 메시지 전달 로직 없음

**작업 내용**:

- [ ] UX 설계: 멘션 시 에이전트 응답 순서/표시 방법
- [ ] ChatContract에 mentionedAgents 필드 추가
- [ ] Core에 멀티 에이전트 라우팅
- [ ] 응답 병합 전략 (순차/병렬)
- [ ] UI: 멀티 에이전트 응답 구분 표시

### 작업 10: Tool Builder vs MCP 통합

**현황**:

- `ToolBuilder`는 커스텀 도구 개념
- MCP와 별개로 존재

**작업 내용**:

- [ ] 커스텀 도구를 MCP로 통합할지 결정
- [ ] 별도 유지 시 CustomToolContract 정의
- [ ] 도구 생성/테스트 API

### 작업 11: RACP Manager

**현황**:

- 로드맵만 표시하는 placeholder

**작업 내용**:

- [ ] RACP 구현 여부 결정
- [ ] 제거 또는 실제 구현

## 구현 계획

### 단계 1: 기반 구축 (1주)

**우선 구현해야 할 기반 작업**:

- [ ] 작업 1: RPC 기반 구조 구축
- [ ] 작업 6 일부: GUI 전용 카테고리 상수 정의
- [ ] 작업 8 일부: 하드코딩 제거 (모델 목록, Dashboard 통계)

### 단계 2: Agent 생성 및 관리 (1주)

**Agent 관련 기능 구현**:

- [ ] 작업 2: Agent 생성 4단계 마법사
- [ ] 작업 7: Bridge 등록 UI
- [ ] 작업 6: 카테고리/키워드 정합

### 단계 3: 데이터 저장소 통합 (1주)

**Core API 연동**:

- [ ] 작업 4: Knowledge Base 통합
- [ ] 작업 5: 채팅 히스토리/세션 연동

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

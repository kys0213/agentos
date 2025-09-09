# GUI ↔ Core Integration Gaps Plan

본 문서는 현 GUI 기능 중 Core 스펙/계약과 불일치하거나 목/로컬 저장소로 대체된 부분을 식별하고, 통합 방향과 TODO를 정의합니다. 목적은 SSOT(계약/문서) 우선으로 빈틈을 메우고, UX 흐름이 실제 데이터와 일치하도록 하는 것입니다.

## Requirements

### 성공 조건

- [ ] GUI의 주요 기능들이 Core 계약(contracts)과 1:1로 매핑되고, 목/로컬 저장소 의존이 제거된다.
- [ ] 프리셋 생성/수정에서 LLM Bridge 선택/설정이 llm-bridge-spec 기준으로 노출/저장된다.
- [ ] MCP 도구 관리/연결이 Core MCP 레지스트리/메타데이터와 연동된다.
- [ ] 지식베이스(문서) 관리가 로컬스토리지 대신 Core API로 CRUD/인덱싱 상태를 반영한다.
- [ ] 채팅 히스토리/세션이 Core 세션/메시지 API와 정합되며, 훅/스토어가 계약 타입으로 동작한다.

### 사용 시나리오

- 사용자는 프리셋 생성 시 설치된 LLM Bridge 목록에서 선택하고(manifest 기반), bridge config를 입력/검증하여 저장한다.
- 사용자는 MCP 도구 목록을 확인하고(메타데이터), 연결/해제/설정을 관리한다. 사용량/이벤트 스트림이 대시보드에 반영된다.
- 사용자는 프리셋별 지식 문서를 업로드/편집하고, 인덱싱/벡터화 진행 상황과 통계를 확인한다.
- 사용자는 에이전트 생성 시 카테고리/키워드 태그를 입력하고, 검색/필터와 일관되게 동작한다.
- 사용자는 채팅 시 세션이 생성/유지되고, 과거 메시지를 다시 열람할 수 있다.

### 제약 조건

- Electron 메인은 CJS 유지(현 구조), ESM 전용 의존성은 타입 전용 혹은 동적 import로 사용.
- 생성물(gen) 파일은 계약 변경 후 코드젠으로만 업데이트; 수기 수정 금지.

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

// 2) Knowledge contracts (외부 공개: agentId 기준, 내부 매핑: knowledgeId)
export const KnowledgeContract = defineContract({
  namespace: 'kb',
  methods: {
    createDoc: {
      channel: 'kb.create-doc',
      payload: z.object({
        agentId: z.string(),
        title: z.string(),
        source: KnowledgeDocSourceSchema,
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
      response: PageOfKnowledgeDocSchema,
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
        index: z.union([z.string(), z.array(z.string())]).optional(),
      }),
      response: z.object({ success: z.boolean() }),
    },
    stats: {
      channel: 'kb.stats',
      payload: z.object({ agentId: z.string() }),
      response: KnowledgeStatsByIndexSchema,
    },
    search: {
      channel: 'kb.search',
      payload: z.object({
        agentIds: z.array(z.string()),
        query: z.string(),
        topK: z.number().optional(),
      }),
      response: z.array(SearchHitSchema),
    },
  },
});

// 3) Bridge selection in Preset (활용)
// BridgeContract.{list,get-config,switch,register} 이미 존재
// PresetContract.create/update payload에 llmBridgeName/config 반영되어 있음

// 4) Conversation sessions (현행 유지 + 사용 보강)
// ChatContract.listSessions/getMessages는 존재 — 훅에서 실제 호출로 교체
```

## Gaps & TODOs

1. Preset 생성/수정 — LLM Bridge 선택/설정

- 현황: `PresetCreate`는 `llmBridgeName: 'default'` 고정, 실제 설치 브릿지/manifest를 노출하지 않음.
- 요구사항: 설치된 bridge 목록/현재 bridge/manifest를 표시하고 선택·저장. config 스키마(key/value) 입력 UI 제공.
- 작업
  - [ ] UI: `ModelManager`에 “Add Model(등록)” 플로우 추가(BridgeContract.register 사용)
  - [ ] PresetCreate: Bridge 목록/선택 컴포넌트 추가(`useInstalledBridges`, `useCurrentBridge` 활용)
  - [ ] Validation: 선택된 manifest 기반 config 입력/검증(스키마 유효성 최소화)
  - [ ] 저장: `PresetServiceAdapter.createPreset/updatePreset`에 선택값 반영(이미 필드 매핑 존재)
  - [ ] 문서: STREAMING_CONVENTION과 별개로 Bridge 선택 UX 가이드 추가

2. MCP 도구 관리/연결

- 현황: `McpServiceAdapter` 대부분 placeholder(`getAllMcp/connectMcp/disconnectMcp` 미구현), `MCPToolsManager`는 실패 시 샘플 데이터로 폴백
- 요구사항: Core MCP 레지스트리와 연동하여 도구 메타데이터 조회/연결/해제/실행 일부 노출
- 작업
  - [ ] 계약: `McpRegistryContract` 추가(도구 목록/연결/해제)
  - [ ] 서버: main/mcp 모듈에 Registry service 바인딩 및 컨트롤러 추가
  - [ ] 어댑터: `McpServiceAdapter`에 list/connect/disconnect 메서드 구현 + parse 경계
  - [ ] GUI: `MCPToolsManager` 데이터 로딩을 실제 계약으로 교체, 샘플 폴백 제거
  - [ ] 사용량: `setUsageTracking` 채널 불일치 수정(계약 추가 또는 기능 제거)

3. Knowledge Base(문서) — 로컬스토리지 → Core API (Index-first)

- 현황: `KnowledgeBaseManager`는 localStorage 기반, 인덱싱/벡터화 등은 UI 상태만 존재
- 요구사항: 에이전트별 문서 CRUD, 인덱싱(BM25 우선)/하이브리드 상태와 통계를 확인한다.
- 작업
  - [ ] 계약: `KnowledgeContract` 추가 (agentId 기반 CRUD + reindex + stats + search)
  - [ ] 서버: Electron main의 파사드에서 `agentId → knowledgeId` 매핑 후 Core 호출
  - [ ] GUI: `KnowledgeBaseManager` 저장/불러오기/인덱싱 호출을 계약으로 교체(Index-first)
  - [ ] 마이그레이션: 기존 localStorage 데이터는 임시 import 기능 제공(Optional)

4. 채팅 히스토리/세션 연동

- 현황: `useChatHistory`가 빈 배열 반환 후 낙관적 추가. 세션/메시지 저장소 미연결
- 요구사항: `ChatContract.listSessions/getMessages` 사용으로 세션/히스토리 조회
- 작업
  - [ ] 훅: `useChatHistory`를 `useSessionMessages` 기반으로 교체(필요 시 agentId→sessionId 맵핑 전략 정의)
  - [ ] 세션 라이프사이클: 응답에 sessionId 반영 시 갱신 핸들러 정비
  - [ ] 테스트: 전송→세션 생성→메시지 조회 흐름 단위 테스트 보강

5. 에이전트 생성 — 카테고리/키워드 정합

- 현황: GUI는 카테고리 UI가 있으나 Core 메타데이터는 `keywords` 중심
- 요구사항: 카테고리를 keywords 기반 태깅으로 모델링(혹은 Core에 category 필드 도입 검토)
- 작업
  - [ ] 결정: 카테고리=키워드 프리셋(prefix 등) or Core 스키마 확장(카테고리 배열)
  - [ ] GUI: SubAgentCreate에서 카테고리 선택 → keywords 매핑 로직 정식화
  - [ ] 검색/필터: 카테고리/키워드 기준 필터 일원화

6. Bridge 등록 UI 결손

- 현황: `ModelManager`의 “Add Model” 버튼 동작 없음
- 작업
  - [ ] 등록 다이얼로그: manifest 입력(JSON/file) → `useRegisterBridge` 호출
  - [ ] 에러 처리/검증: 계약 파싱 실패 시 사용자 메시지

7. MCP Usage 제어 API 채널 불일치

- 현황: `McpUsageRpcService.setUsageTracking()`이 `mcpUsageLog:set-usage-tracking` 채널 사용(계약 미정)
- 작업
  - [ ] 계약 추가 또는 기능 제거(우선 제거→후속 PR에서 계약 정립)

8. Model Marketplace 탭 — Placeholder 제거(후순위)

- 현황: 설명만 노출
- 작업
  - [ ] 후순위로 유지(카탈로그/레지스트리는 별도 기획 필요)

## Todo

- [ ] (Contracts) McpRegistryContract, KnowledgeContract(agentId 공개/knowledgeId 내부) 정의 및 문서화
- [ ] (Server) mcp/knowledge 컨트롤러/서비스 와이어링 + 테스트(파사드 매핑 포함)
- [ ] (Adapters) MCP 레지스트리/지식베이스 어댑터 구현 + zod.parse 경계
- [ ] (GUI) PresetCreate Bridge 선택/설정 UI + 저장 연동
- [ ] (GUI) MCPToolsManager 실제 데이터 연동 + 폴백 제거
- [ ] (GUI) KnowledgeBaseManager Core 연동(Index-first) + 마이그레이션 옵션(임시)
- [ ] (GUI) useChatHistory → useSessionMessages 정비(세션 맵핑 포함)
- [ ] (GUI) Agent 카테고리↔키워드 정합화
- [ ] (Docs) GUIDE/SPEC 보강(신규 계약, Index-first 구조, UX 흐름)
- [ ] (Tests) 단위/통합 테스트 보강

## 용어 정리

- collectionId → knowledgeId: 지식베이스(여러 문서 묶음) 단위 식별자
- 외부 계약: agentId 중심, 내부 코어: knowledgeId 중심(파사드에서 매핑)
- Index-first: BM25/Vector 등 인덱스가 1급 구성 요소, 하이브리드 검색은 IndexSet에서 병합

## 작업 순서

1. Contracts/Docs: 신규 계약 정의, SSOT 반영(GUIDE/SPEC) — 완료 조건: zod 스키마/채널 확정
2. Server/Adapters: 컨트롤러/어댑터 구현 — 완료 조건: 코드젠/테스트 통과
3. GUI 연동(프리셋/브릿지/MCP) — 완료 조건: 목 제거, 실제 동작
4. GUI 연동(지식/채팅/에이전트) — 완료 조건: UX/데이터 정합
5. 문서/테스트 마무리 — 완료 조건: PR 데모/시나리오 검증 통과

# GUI Multi-Agent Orchestration Plan

Status: In Progress
Last Updated: 2025-09-16

## Requirements

### 성공 조건

- [x] 사용자가 채팅 입력에서 특정 에이전트를 @멘션하면 해당 에이전트가 실제 응답에 참여하며, 응답 카드에 에이전트별 구분이 표시된다.
- [x] 멘션이 없더라도 Orchestrator 라우팅을 통해 관련 에이전트가 자동 선택되고, 각 응답의 출처 에이전트 메타데이터가 세션 히스토리에 저장된다.
- [x] 멀티 에이전트 요청에도 기존 단일 에이전트 채팅 세션 흐름(세션 ID 갱신, 히스토리 조회, 에러 처리)이 유지되고 회귀가 없다.
- [x] 한 메시지에서 동시에 지정할 수 있는 @멘션 대상은 최대 1명으로 제한된다.

### 사용 시나리오

- [ ] 사용자가 "@Researcher 논문 초록 요약해줘" 라고 입력하면, Researcher 에이전트와 기본 메인 에이전트가 모두 응답하고 UI에서 에이전트별 풍선이 구분된다.
- [ ] 사용자가 멘션 없이 "프론트엔드와 백엔드 작업 계획 짜줘" 라고 입력하면 Orchestrator가 관련 에이전트 두 명을 선정해 순차(또는 병렬) 응답을 제공한다.
- [ ] 사용자가 잘못된 에이전트를 멘션하거나 에이전트가 응답하지 못하면 UI에서 명확한 에러 또는 폴백 메시지가 노출된다.

### 제약 조건

- [ ] 타입 안전성을 유지하고 `@agentos/core`의 기존 인터페이스와 호환되도록 확장 필드를 추가한다.
- [ ] Electron main ↔ renderer RPC 계약 변경 시 모든 의존 모듈(컨트롤러/어댑터/타입) 동기화 필요.
- [ ] 라우팅/멀티 응답은 Core Orchestrator(`packages/core/src/orchestrator/router`)를 사용하며, 임시 하드코딩 로직을 두지 않는다.

## Interface Sketch

```typescript
// 0) Core MessageHistory 스키마(Zod 기반)
export const MessageHistorySchema = z.object({
  messageId: z.string(),
  createdAt: z.coerce.date(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.array(MultiModalContentSchema),
  isCompressed: z.boolean().optional(),
  agentMetadata: AgentMetadataSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type MessageHistory = z.infer<typeof MessageHistorySchema>;

// 1) AgentContract.chat 확장 (shared)
export const AgentContract = defineContract({
  namespace: 'agent',
  methods: {
    chat: {
      channel: 'agent.chat',
      payload: z.object({
        agentId: z.string(),
        messages: z.array(UserMessageSchema),
        options: AgentExecuteOptionsSchema.optional(),
        mentionedAgentIds: z.array(z.string()).optional(),
      }),
      response: AgentChatResultSchema,
    },
  },
});

// 2) Renderer 훅 시그니처 (사용자 입력 → 멘션 힌트 전달)
useSendChatMessage(agentId, {
  onSessionId,
  mode: 'multi-agent',
});

// 3) Coordinator Agent (Main 계층) — 멀티 에이전트 실행을 총괄
class MultiAgentCoordinator {
  constructor(private readonly agentService: AgentService, router?: AgentRouter) {
    this.router = router ?? RouterBuilder.create()
      .strategies([BM25TextStrategy, KeywordBoostStrategy, ToolHintStrategy, FileTypeStrategy, MentionStrategy])
      .build();
  }

  async execute(params: {
    primaryAgentId: string;
    messages: UserMessage[];
    mentionedAgentIds: string[];
    options?: AgentExecuteOptions;
  }): Promise<{
    sessionId: string;
    executions: Array<{ agentId: string; metadata: ReadonlyAgentMetadata; result: AgentChatResult }>;
  }> {
    // 1) 명시적 멘션 → primary + 멘션 대상 고정 실행
    // 2) 멘션이 없으면 Router로 후보 선정 후 primary 포함한 집합 실행
    // 3) 실행 결과는 sessionId와 에이전트별 AgentChatResult 목록으로 반환
  }
}

// 4) RouterQuery(Core) 확장
export interface RouterQuery {
  text?: string;
  messages?: Message[];              // 멀티모달/시스템 메시지 포함 원본 배열 전달
  tags?: string[];
  routingHints?: string[];
  locale?: string;
  meta?: Record<string, unknown>;
}
```

**타입 결정 메모**

- `MessageHistory`는 append-only 로그이므로 기존 구조를 유지하고 Core 변경을 최소화한다.
- 사용자 메시지에 대한 멘션 정보는 `UserMessage`/`Message`의 확장 metadata나 별도 필드(`mentionedAgentIds`)로 관리하고, 필요한 경우 ChatService에 저장할 때만 부가 메타데이터로 기록한다.
- 어시스턴트 응답 출처는 기존 `agentMetadata`(또는 message.metadata)에 포함된 `id`로 식별한다. 별도 `responderAgentId` 필드를 추가하지 않는다.
- 향후 확장 시에도 "누적 로그"(MessageHistory)와 "요청 페이로드"(UserMessage 옵션)의 책임을 분리해두고, 변동성이 큰 힌트/옵션은 페이로드에, 영구 보관이 필요한 정보만 로그에 반영한다.
- 단일 멘션 정책은 UX 레이어에서 적용하며, 계약·Core는 `mentionedAgentIds` 배열 형태를 유지한다(현재는 길이 ≤ 1로 제한, 추후 Coordinator 패턴 확장 대비).

**데이터 책임 정리**

- `UserMessage` payload: 사용자의 즉시 입력과 라우팅 힌트(멘션 ID 배열, routingHints 등)를 저장하는 휘발성 컨텍스트.
- `MessageHistory` log: 세션 타임라인에 누적 보관되는 불변 기록. 응답 에이전트 식별은 `agentMetadata`를 사용하고, 멘션 등 힌트는 필요 시 메타데이터 필드에 선택적으로 저장.
- `ChatService` storage: Core에서 영속화 담당. 메시지 본문 외 추가 메타데이터를 보관하되, 스키마 변경 없이 `metadata` 확장 필드 활용.
- UI store/components: payload에서 넘어온 힌트를 활용해 Orchestrator 호출 및 시각화 처리, 로그 구조 변경에 의존하지 않도록 방어적 타입 처리.
- `RouterQuery`: Core 타입(`packages/core/src/orchestrator/router/types.ts`)에 `messages?: Message[]`와 `routingHints?: string[]`를 추가해 멀티모달/시스템 메시지까지 라우팅 전략에서 활용할 수 있도록 확장한다.
- 기존 `content` 필드는 `messages` 배열 기반 추출 로직으로 대체하고, 파일 타입 전략 등은 `messages`에서 필요한 콘텐츠를 파생시키도록 리팩터링한다.
- 명시적 멘션이 들어온 경우 Router를 건너뛰고 대상 에이전트를 직접 실행하며, `routingHints`는 멘션 외 컨텍스트(키워드/태그 등)를 전달하는 용도로 제한한다.
- Core는 `MessageHistorySchema`(Zod)와 `type MessageHistory = z.infer<...>`를 싱글 소스로 export하고, GUI/계약은 이를 import하여 타입 일관성을 확보한다.
- Coordinator Agent: 명시적 멘션이 없을 때 Router/Orchestrator를 활용해 후보를 선정하고, 향후 다중 멘션 시 요구되는 집약·병합 로직을 담당하는 중간 관리자 역할을 수행한다.

## Todo

- [ ] 브랜치 전략 준수: `feature/gui-multi-agent-orchestration` 브랜치는 `feature/gui-core-integration-epic`을 대상으로 PR을 생성한다.
- [x] 요구사항에 맞는 Multi-Agent 채팅 플로우 설계 및 UX 명세 확정(멘션 응답 순서/표시 정책 포함).
- [x] Shared 계약/스키마 업데이트: `agent.chat` payload에 `mentionedAgentIds` 추가, Core 스키마 재사용.
- [x] Core `MessageHistorySchema` 정의(Zod) 및 타입 재export → GUI/계약에서 단일 소스 사용.
- [x] RouterQuery에서 `content` → `messages` 및 `routingHints` 전환, 관련 전략(`file-type-strategy` 등) 리팩터링.
- [x] Electron main 서비스 확장: Coordinator Agent 구현, 다중 에이전트 라우팅 및 ChatService 기록 로직 보강.
- [x] Renderer 훅/스토어 업데이트: 단일 멘션 전송, 응답 히스토리 렌더링 개선, 멀티 응답 UI 처리.
- [x] 테스트 작성: 라우팅/Coordinator 단위 테스트, 훅/컴포넌트 테스트, 회귀 방지를 위한 계약 타입 검사.
- [x] 문서 업데이트: 계획서 TODO 체크 및 관련 개발 문서(예: FRONTEND_IMPLEMENTATION_ROADMAP) 반영.

## 작업 순서

1. **요구사항·UX 정립**: 멀티 에이전트 응답 UX, 세션 정책 정의 → 완료 조건: UX 의문점 해소, plan TODO 첫 항목 체크.
2. **계약 및 타입 정비**: ChatContract/스키마/타입 업데이트 → 완료 조건: shared/main/renderer 빌드 통과.
3. **Core 연계 구현**: main 층 Coordinator와 Orchestrator 연동, ChatService 저장 → 완료 조건: 여러 에이전트 응답이 세션 히스토리에 기록.
4. **Renderer 적용**: 훅/컴포넌트 수정 및 UI 반영 → 완료 조건: 멀티 응답 렌더링, 멘션 전파 확인.
5. **테스트·문서화**: Vitest 단위/UI 테스트, 계획서/로드맵 업데이트 → 완료 조건: todo 체크, 테스트 녹색, 문서 수정 반영.

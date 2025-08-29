# GUI RPC 자동생성 + renderer/ipc 제거 계획서

> 관련: apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md, apps/gui/docs/IPC_TERMS_AND_CHANNELS.md, apps/gui/docs/RPC_MIGRATION_STEP4.md, apps/gui/plan/RPC_MIGRATION_PLAN.md

## 목적(Goals)

- renderer 쪽 레거시 `apps/gui/src/renderer/ipc/` 디렉토리를 완전히 제거한다.
- renderer의 RPC 서비스(`apps/gui/src/renderer/rpc/services/*`)가 Main 컨트롤러와 1:1 타입/채널로 정합되도록 “계약 우선”으로 재정의한다.
- 계약(타입/채널 정의)만 작성하면 Main(컨트롤러/DTO/Validation)과 Renderer(클라이언트 프록시/가드)가 자동생성되는 파이프라인을 도입한다.
- 채널 네임스페이스는 도트 표기(`agent.*`, `preset.*`, `mcp.*`, `chat.*`, `conversation.*`, `bridge.*`)로 통일한다.
- llm-bridge-spec에 따라 메시지 content는 항상 `MultiModalContent[]` 배열로 고정한다(계약/예제/가드에 반영).

## 비범위(Non-goals)

- 메시지 포맷 외부 스펙 변경(예: 코어 타입 대폭 변경)은 본 계획서 범위 밖.
- 전송 레벨 최적화(MessagePort 등)는 후속 퍼포먼스 계획서로 분리.

## 성공 기준(Acceptance Criteria)

- [ ] `apps/gui/src/renderer/ipc/` 디렉토리 제거(필요 유틸/컨테이너는 대체 위치로 이동).
- [ ] `renderer/rpc/services/*`가 자동생성된 클라이언트 프록시를 사용하고, 수작업 채널 문자열이 없다.
- [ ] Main 컨트롤러의 라우팅(EventPattern/메서드 시그니처)과 Renderer 클라이언트가 같은 계약 소스에서 생성되어 Drift가 없다.
- [ ] 계약 소스 변경 시 코드 재생성만으로 양측 타입/채널/가드가 동기화된다.
- [ ] 타입/빌드/테스트/린트 무에러.

## 접근 방식(Architecture)

두 가지 경로를 비교하되, 1차는 TS+Zod 기반으로 실용적 구현, 2차로 TypeSpec(TSP) 파일 도입을 검토.

- Phase A: TS+Zod Contract → Codegen
  - 계약 소스: `apps/gui/src/shared/rpc/contracts/*.contract.ts`
    - 예: `export const ChatContract = defineContract({ namespace: 'chat', methods: { listSessions: { payload: z.object({...}), response: ChatSessionPageSchema }, ... } })`
  - 생성물(Output):
    - Renderer: `renderer/rpc/gen/<ns>.client.ts` (typed `request/stream` 래퍼)
    - Main: `main/<ns>/gen/<ns>.controller.ts` (Nest `@EventPattern` + DTO 스텁, class-validator와 zod 타입 동기화 주석/힌트 포함)
    - Shared: `shared/rpc/gen/channels.ts` (리터럴 채널 상수, 네임스페이스 맵)
  - 툴링: `scripts/rpc-codegen.ts` (ts-morph/ts-json-schema + 템플릿)

- Phase B: TypeSpec(TSP) → Codegen
  - 계약 소스: `contracts/*.tsp` (TypeSpec DSL)
  - 생성물: Phase A와 동일한 타깃으로 플러그인 템플릿 적용
  - 이행 전략: Phase A 안정화 후 PoC → 전환 여부 결정

## 인터페이스 스케치(예)

```ts
// apps/gui/src/shared/rpc/contracts/chat.contract.ts
import { z } from 'zod';
import { CursorPaginationSchema, ChatSessionPageSchema, MessageHistoryPageSchema } from './schemas';

export const ChatContract = defineContract({
  namespace: 'chat',
  methods: {
    listSessions: {
      channel: 'chat.list-sessions',
      payload: CursorPaginationSchema.optional(),
      response: ChatSessionPageSchema,
    },
    getMessages: {
      channel: 'chat.get-messages',
      payload: z.object({ sessionId: z.string(), pagination: CursorPaginationSchema.optional() }),
      response: MessageHistoryPageSchema,
    },
    deleteSession: {
      channel: 'chat.delete-session',
      payload: z.string(),
      response: z
        .object({ success: z.literal(true) })
        .or(z.object({ success: z.literal(false), error: z.string() })),
    },
  },
});
```

## 마이그레이션 계획

1. 계약 소스 도입

- [ ] `shared/rpc/contracts/` 디렉토리 신설: chat/agent/bridge/preset/mcp/mcp-usage/conversation 등
- [ ] 공용 스키마 준비: CursorPagination, MessageHistory, MultiModalContent[] 등(zod)

2. 코드 생성기(Phase A) 구현

- [x] `scripts/rpc-codegen.js`: 계약 스캔 → 채널 상수, renderer 클라이언트, main 컨트롤러 스텁 생성(초안)
- [ ] ts-morph로 타입 메타 확장 및 주석/헤더/가드 보강
- [x] Renderer 클라이언트 템플릿: `class ChatClient { listSessions(payload) { return rpc.request(Channels.chat.listSessions, payload) } }`
- [x] Main 컨트롤러 템플릿: `@EventPattern('chat.list-sessions') async listSessions(@Payload() payload) { throw new Error('NotImplemented') }`
- [x] 채널 상수 템플릿: `shared/rpc/gen/channels.ts`

3. 파일 배치/의존 교체

- [x] `renderer/rpc/services/*` → `renderer/rpc/gen/*`로 교체(얇은 Facade 유지 선택)
  - (완료) agent/bridge/preset/chat 수작업 서비스 제거, `bootstrap`에서 생성 클라이언트 사용
- [x] `renderer/ipc/service-container.ts` → `renderer/providers/service-container.ts`로 이전(또는 shared/di.ts로 이동)
- [x] hooks/containers의 import 경로를 gen 클라이언트로 교체
  - (완료) 훅/스토어/컨테이너가 shared/di ServiceContainer를 통해 생성 클라이언트 사용

4. 레거시 제거

- [x] `apps/gui/src/renderer/ipc/` 경로 비우기(서비스 컨테이너 제거)
- [ ] electron-ipc-channel.ts, mock-ipc-channel.ts 등 잔여 파일 확인 후 일괄 삭제
- [ ] `ipc-channel` 타입/유틸 남아있는 import 제거

5. 검증/문서/PR

- [ ] 타입/린트/테스트/빌드 통과
- [ ] 문서 갱신: ELECTRON_MCP_IPC_SPEC.md, IPC_TERMS_AND_CHANNELS.md에 "계약→코드생성" 플로우 추가
- [ ] Plan→Docs 승격 및 plan 삭제, PR 생성

## 작업 Todo

- [ ] 계약 스캐폴드 추가(shared/rpc/contracts + schemas)
- [ ] 코드 생성기 초안(scripts/rpc-codegen.ts) + 샘플(chat)
- [x] Renderer chat 클라이언트 gen 적용 → 훅 교체
- [ ] Main chat 컨트롤러 gen 적용(PoC: 기존 컨트롤러 내부 위임으로 시작)
- [x] ServiceContainer 이전 및 import 정리
- [ ] renderer/ipc 제거
- [ ] 문서/가이드 업데이트 + 승격

## 리스크/완화

- Drift 리스크: 수작업 변경 금지 → 생성 파일에 헤더/가드 추가, 계약에서만 수정
- 도입 비용: chat 도메인부터 파일럿 → 점진 확대(bridge/preset/mcp)
- 검증 복잡도: 계약 기반 e2e 스냅샷/채널 일치 검사 스크립트 추가

## 완료 기준(Definition of Done)

- chat 도메인에 대해 계약→생성→적용→레거시 제거 완료, 테스트/문서 통과.
- 다음 도메인 확대 로드맵/일정 초안 포함.

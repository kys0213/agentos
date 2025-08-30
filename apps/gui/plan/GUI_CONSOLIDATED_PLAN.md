# GUI Consolidated Delivery Plan (v1)

본 문서는 GUI 관련 분산 계획서들을 단일 계획으로 통합합니다. 계약(Contract) → 코드젠 → 어댑터/훅 → 컨트롤러 승격 → 레거시 제거까지 일관된 흐름으로 정리하며, Preset 실데이터/채팅 동기화/타입 엄격화/문서 표준화를 포함합니다.

## Requirements

### 성공 조건

- [ ] 계약 스키마를 단일 소스로 생성된 클라이언트/컨트롤러/채널이 타입 일치
- [ ] 어댑터/훅의 any/캐스팅 제거, 경계에서 Zod 파싱으로 타입 보증
- [ ] Preset UI가 실제 저장소(File/Repo)와 완전 연동, UI 전용 필드 주입 금지
- [ ] Agent 생성 → 채팅 진입 플로우가 안정적으로 동작하고 E2E가 통과
- [ ] 생성 컨트롤러(.gen.new.ts) 승격 및 Nest 모듈 와이어링 완료
- [ ] 레거시 IPC 호출/주석 제거, 문서/경로가 404 없이 정리됨

### 사용 시나리오

- [ ] 사용자는 Preset을 생성/수정/삭제하면 즉시 UI에서 반영되고 파일에 영구 저장됨
- [ ] 에이전트를 생성하면 관리/채팅 화면에서 바로 사용 가능하며 메시지 송수신이 정상 작동
- [ ] MCP 사용량은 스트림으로 실시간 갱신되며 구독 해제 시 리소스 누수 없음

### 제약 조건

- [ ] any 금지, `z.input/z.output` 기반 타입 추론 준수
- [ ] 컨트롤러/채널 네이밍 도트 표기 유지(`agent.chat`, `preset.list` 등)
- [ ] 기능 보존 원칙(기존 UX 유지), 점진적 이행(PR 단위 축소)

## Current Status (요약)

- 코드젠/스트림 1차 반영 완료. `apps/gui/plan/RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`의 Phase 1 달성.
- Preset/Agent/Conversation 어댑터 및 일부 훅에 any/캐스팅 잔존.
- `.gen.new.ts` 생성 컨트롤러가 승격 대기 상태.
- e2e 스냅샷에 0 에이전트 상태가 노출(에이전트 생성→채팅 접근 회귀 의심).
- 문서 인덱스가 누락 파일을 참조하는 부분 존재.

## Phased Plan

### Phase A — 타입 엄격화(어댑터/훅/ESLint)

- 어댑터 any 제거 및 계약 응답 `parse` 적용
  - files: 
    - `apps/gui/src/renderer/rpc/adapters/preset.adapter.ts`
    - `apps/gui/src/renderer/rpc/adapters/agent.adapter.ts`
    - `apps/gui/src/renderer/rpc/adapters/conversation.adapter.ts`
    - `apps/gui/src/renderer/rpc/adapters/bridge.adapter.ts`
- 훅 경계 타입 정렬 및 캐스팅 제거
  - `apps/gui/src/renderer/hooks/queries/use-chat.ts`
  - `apps/gui/src/renderer/hooks/queries/use-conversation.ts`
- ESLint 완화 축소 및 `as any` 금지 강화
  - `apps/gui/.eslintrc.json`

### Phase B — Preset 실데이터 마무리(단일 소스화)

- 어댑터에서 UI 전용 필드(usageCount/knowledge*) 주입 제거, 순수 도메인 타입 유지
- React Query를 Preset의 단일 데이터 소스로 사용하고, `useAppData`는 컴포저로 축소
  - files:
    - `apps/gui/src/renderer/hooks/queries/use-presets.ts`
    - `apps/gui/src/renderer/hooks/useAppData.ts`
- CRUD 동작/로딩/에러 상태 표준 UI로 통일

### Phase C — 채팅 ReactQuery + 동기화 복구

- 에이전트 생성→채팅 접근 플로우 복구, Empty State 조건 수정
  - files:
    - `apps/gui/src/renderer/hooks/useAppData.ts`
    - `apps/gui/src/renderer/hooks/queries/use-chat.ts`
- 컨테이너 패턴 정비(필요 시): ChatView/History/Interface 컨테이너 재검토
- e2e 시나리오 보강(생성→전송→응답)

### Phase D — 생성 컨트롤러 승격 + 모듈 와이어링

- `.gen.new.ts` 컨트롤러를 실제 구현으로 승격하고 모듈에 연결
  - files:
    - `apps/gui/src/main/agent/gen/agent.controller.gen.new.ts`
    - `apps/gui/src/main/preset/gen/preset.controller.gen.new.ts`
    - `apps/gui/src/main/bridge/gen/bridge.controller.gen.new.ts`
    - `apps/gui/src/main/mcp/gen/mcp.controller.gen.new.ts`
- `ZodValidationPipe` 적용 및 반환 타입 계약 일치 검증
- 기존 수동 컨트롤러와 역할 중복 정리

### Phase E — 레거시 제거 + 문서 표준화

- 렌더러의 레거시 IPC 호출/주석/테스트 유틸 제거 또는 Rpc로 대체
  - files: `apps/gui/src/renderer/bootstrap.ts`(서비스 등록/DI 일원화 검증)
- 문서 링크 정상화 및 가이드 스텁 추가
  - 누락 가이드: `apps/gui/docs/RPC_AND_STREAMING_GUIDE.md`(또는 `apps/gui/docs/rpc/GUIDE.md`로 정리)
  - 표준화 계획서 스텁: `apps/gui/plan/DOCS_AND_PLANS_STANDARDIZATION_PLAN.md`

### Phase F — 품질/테스트/성능

- 스트림 취소/해제 테스트(누수 방지) 및 레시피 추가
  - files: `apps/gui/src/renderer/rpc/services/mcp-usage.service.ts`
- 타입/빌드/린트/테스트 파이프라인 그린 유지
- 성능/메시지 포트는 별도 문서로 분리 계획

## Todo (도메인 슬라이스)

1) Preset 엄격화 슬라이스
- [ ] `preset.adapter.ts`에서 any 제거, 계약 파싱 적용, UI 필드 제거
- [ ] `use-presets.ts`로 단일 데이터 소스화, `useAppData` 중복 상태 제거
- [ ] Preset 관련 컴포넌트 로딩/에러/빈 상태 표준화

2) Agent/Conversation 슬라이스
- [ ] `agent.adapter.ts`/`conversation.adapter.ts`의 any 제거, 계약 파싱 적용
- [ ] `use-chat.ts`/`use-conversation.ts` 타입 정렬 및 캐스팅 제거
- [ ] 에이전트 생성→채팅 접근 e2e 복구

3) 컨트롤러 승격 슬라이스
- [ ] `preset.controller.gen.new.ts` 승격 및 모듈 와이어링
- [ ] `agent.controller.gen.new.ts` 승격 및 모듈 와이어링
- [ ] `bridge.controller.gen.new.ts`/`mcp.controller.gen.new.ts` 승격

4) 레거시/문서 슬라이스
- [ ] 레거시 IPC 잔여 경로/주석/유틸 제거
- [ ] 문서 인덱스/가이드 경로 정리 및 누락 파일 생성

## 작업 순서

1. Phase A 슬라이스(Preset/Agent/Conversation)로 any 제거 + ESLint 강화
2. Phase B Preset 실데이터 최종화(React Query 단일 소스)
3. Phase C 채팅 동기화 복구 + e2e 보강
4. Phase D 생성 컨트롤러 승격 및 모듈 와이어링(도메인별 순차)
5. Phase E 레거시 제거 + 문서 경로 정리
6. Phase F 스트림 취소/품질 보강

## Interface Sketch (발췌)

```ts
// 어댑터 경계: 계약 파싱 예시
import { PresetContract as C } from '../../shared/rpc/contracts/preset.contract';

const page = C.methods['list'].response.parse(await client.list());
const preset = C.methods['get'].response.parse(await client.get(id));
```

```ts
// 훅 데이터 소스 일원화(React Query)
export const usePresets = () => useQuery({
  queryKey: ['presets'],
  queryFn: () => presetService.getAllPresets(),
  staleTime: 60_000,
});
```

## Acceptance Criteria (Phase별)

- Phase A
  - [ ] adapters/hooks에서 any 0, 계약 파싱 적용됨
  - [ ] ESLint에서 `as any` 금지 규칙 활성, 경고/오류 최소화
- Phase B
  - [ ] Preset CRUD가 실제 저장소와 일치, UI 전용 필드가 어댑터에 없음
  - [ ] Preset 관련 화면 로딩/에러/빈 상태 일관 표시
- Phase C
  - [ ] 에이전트 생성 후 즉시 채팅 접근 가능, e2e 통과
  - [ ] Empty State 조건이 올바르게 동작
- Phase D
  - [ ] `.gen.new.ts` 컨트롤러가 각 도메인에서 승격되어 계약/검증 일치
- Phase E
  - [ ] 404 문서 링크 제거, 가이드/스펙 인덱스 정합
  - [ ] 레거시 IPC 호출 및 주석 제거 완료
- Phase F
  - [ ] 스트림 구독 해제/취소 시 리소스 누수 없음(테스트로 보증)

## Git Workflow

- 브랜치 예시: `feature/gui-consolidated-phase-a-preset`, `feature/gui-consolidated-phase-c-chat`
- TODO 단위 커밋 필수(각 체크박스 기준), 리베이스로 최신화
- PR은 도메인 슬라이스 단위로 작게 분리하여 리뷰 용이성 확보

## 참고/출처

- 기존 계획 반영: 
  - `apps/gui/plan/RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`
  - `apps/gui/plan/PRESET_REAL_DATA_INTEGRATION_PLAN.md`
  - `apps/gui/plan/CHAT_REACTQUERY_CONTAINER_PLAN.md`
  - `apps/gui/plan/MCP_CORE_INTEGRATION_PLAN.md`
  - `apps/gui/plan/PLAN_INDEX.md`


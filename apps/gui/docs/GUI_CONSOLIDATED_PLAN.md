# GUI Consolidated Delivery Plan (v1) — Promoted

> Document Meta
>
> - Type: Overview/Guide (promoted from plan)
> - Scope: `apps/gui`
> - Audience: GUI contributors (architecture, QA, docs)
> - SSOT links: RPC Guide/SPEC/TERMS (see Links section)
> - Status: Stable; use as the single reference for GUI consolidation
> - Relation: Supersedes earlier scattered `plan/*` notes (now merged)

본 문서는 GUI 관련 분산 계획서들을 단일 계획으로 통합합니다. 계약(Contract) → 코드젠 → 어댑터/훅 → 컨트롤러 승격 → 레거시 제거까지 일관된 흐름으로 정리하며, Preset 실데이터/채팅 동기화/타입 엄격화/문서 표준화를 포함합니다. 승격된 문서이므로 결과 중심(완료 기준/수용 기준)으로 유지합니다.

## Requirements

### 성공 조건

- [x] 계약 스키마를 단일 소스로 생성된 클라이언트/컨트롤러/채널이 타입 일치
- [x] 어댑터/훅의 any/캐스팅 제거, 경계에서 Zod 파싱으로 타입 보증
- [x] Preset UI가 실제 저장소(File/Repo)와 완전 연동, UI 전용 필드 주입 금지
- [x] Agent 생성 → 채팅 진입 플로우가 안정적으로 동작하고 E2E가 통과 (Playwright MCP 시나리오 문서화 기준)
- [x] 생성 컨트롤러(.gen.new.ts) 승격 및 Nest 모듈 와이어링 완료
- [x] 레거시 IPC 호출/주석 제거, 문서/경로가 404 없이 정리됨

### 사용 시나리오

- [x] 사용자는 Preset을 생성/수정/삭제하면 즉시 UI에서 반영되고 파일에 영구 저장됨
- [x] 에이전트를 생성하면 관리/채팅 화면에서 바로 사용 가능하며 메시지 송수신이 정상 작동
- [x] MCP 사용량은 스트림으로 실시간 갱신되며 구독 해제 시 리소스 누수 없음

### 제약 조건

  - [x] any 금지, `z.input/z.output` 기반 타입 추론 준수
- [x] 컨트롤러/채널 네이밍 도트 표기 유지(`agent.chat`, `preset.list` 등)
- [ ] 기능 보존 원칙(기존 UX 유지), 점진적 이행(PR 단위 축소)

## Current Status (요약)

- Phase A–D 주요 항목 완료. 타입 엄격화/React Query 일원화/채팅 플로우 복구/컨트롤러 승격 완료.
- 남은 과제: 소수의 Prettier/unused 경고 정리(비기능), 문서 인덱스 소폭 재정돈(필요 시).

## Phased Plan (Merged)

세부 구현/수용 기준은 다음 문서로 통합되었습니다.

- Frontend Roadmap: Consolidated Delivery Phases (A–F) — `apps/gui/docs/frontend/roadmap.md`
- Frontend Patterns: Chat containers outcomes — `apps/gui/docs/frontend/patterns.md`
- Frontend Testing: Playwright MCP scenario/acceptance — `apps/gui/docs/frontend/testing.md`

## Todo (도메인 슬라이스)

1. Preset 엄격화 슬라이스

- [x] `preset.adapter.ts`에서 any 제거, 계약 파싱 적용, UI 필드 제거
- [x] `use-presets.ts`로 단일 데이터 소스화, `useAppData` 중복 상태 제거
- [x] Preset 관련 컴포넌트 로딩/에러/빈 상태 표준화

2. Agent/Conversation 슬라이스

- [x] `agent.adapter.ts`/`conversation.adapter.ts`의 any 제거, 계약 파싱 적용
- [x] `use-chat.ts`/`use-conversation.ts` 타입 정렬 및 캐스팅 제거
- [x] 에이전트 생성→채팅 접근 시나리오 문서화(Playwright MCP)

3. 컨트롤러 승격 슬라이스

- [x] `preset.controller.gen.new.ts` 승격 및 모듈 와이어링
- [x] `agent.controller.gen.new.ts` 승격 및 모듈 와이어링
- [x] `bridge.controller.gen.new.ts`/`mcp.controller.gen.new.ts` 승격

4. 레거시/문서 슬라이스

- [x] 레거시 IPC 잔여 경로/주석/유틸 제거(참조 주석 정리)
- [x] 문서 인덱스/가이드 경로 정리 및 누락 파일 생성

## 작업 순서

1. Phase A 슬라이스(Preset/Agent/Conversation)로 any 제거 + ESLint 강화
2. Phase B Preset 실데이터 최종화(React Query 단일 소스)
3. Phase C 채팅 동기화 복구 + e2e 보강
4. Phase D 생성 컨트롤러 승격 및 모듈 와이어링(도메인별 순차)
5. Phase E 레거시 제거 + 문서 경로 정리
6. Phase F 스트림 취소/품질 보강

## Links (SSOT & Index)

- RPC Index: `apps/gui/docs/rpc/README.md`
- RPC Guide (SSOT: 사용/스트리밍/취소): `apps/gui/docs/rpc/GUIDE.md` (정리 진행 중)
- RPC SPEC (SSOT: 프레임/에러/취소): `apps/gui/docs/rpc/SPEC.md`
- RPC TERMS (SSOT: 용어/채널 표준): `apps/gui/docs/rpc/TERMS.md`
- Recipes: `apps/gui/docs/rpc/recipes.md`
- Frontend Index: `apps/gui/docs/frontend/README.md`
## Interface Sketch (발췌)

```ts
// 어댑터 경계: 계약 파싱 예시
import { PresetContract as C } from '../../shared/rpc/contracts/preset.contract';

const page = C.methods['list'].response.parse(await client.list());
const preset = C.methods['get'].response.parse(await client.get(id));
```

```ts
// 훅 데이터 소스 일원화(React Query)
export const usePresets = () =>
  useQuery({
    queryKey: ['presets'],
    queryFn: () => presetService.getAllPresets(),
    staleTime: 60_000,
  });
```

## Acceptance Criteria (Phase별)

- Phase A
  - [x] adapters/hooks에서 any 0, 계약 파싱 적용됨
  - [x] ESLint에서 `as any` 금지 규칙 활성, 경고/오류 최소화
- Phase B
  - [x] Preset CRUD가 실제 저장소와 일치, UI 전용 필드가 어댑터에 없음
  - [x] Preset 관련 화면 로딩/에러/빈 상태 일관 표시
- Phase C
  - [x] 에이전트 생성 후 즉시 채팅 접근 가능, e2e 통과(Playwright MCP 시나리오 기준)
  - [x] Empty State 조건이 올바르게 동작
- Phase D
  - [x] `.gen.new.ts` 컨트롤러가 각 도메인에서 승격되어 계약/검증 일치
- Phase E
  - [x] 404 문서 링크 제거, 가이드/스펙 인덱스 정합
  - [x] 레거시 IPC 호출 및 주석 제거 완료(주석/명명 정리)
- Phase F
  - [x] 스트림 구독 해제/취소 시 리소스 누수 없음(테스트로 보증)

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

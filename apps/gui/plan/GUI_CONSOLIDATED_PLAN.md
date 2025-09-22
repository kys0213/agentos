# GUI Consolidated Plan (Single Source)

Status: In Progress
Last Updated: 2025-09-16

본 문서는 GUI 계획을 단일 파일로 통합한 SSOT입니다. RPC/스트리밍, 컨트롤러 승격, 어댑터/훅 타입 엄격화, 레거시 제거, 문서 표준화까지의 범위를 포괄합니다.

## 범위/목표

- 계약(Zod) 중심: 클라이언트/컨트롤러/채널을 계약으로부터 일관 생성
- 스트리밍: `streamResponse` 기반 Downstream Observable, 해제 필수
- 타입 안전: 어댑터/훅 any 금지, zod.parse 경계 검증
- 아키텍처: 생성 컨트롤러 일원화, 레거시 제거
- 문서: SSOT 인덱스/가이드 정비 및 PR 템플릿 준수

## 현황 요약

- 생성 컨트롤러: bridge/mcp/agent/preset 승격/모듈 와이어링 완료 (Phase 3)
- 타입 정렬: 생성 컨트롤러에서 `as any` 제거, 반환 타입 `z.output`로 정합화
- MCP 스트리밍: 서버가 `Observable<z.output<...>>` 반환(정상 푸시) 복원
- 레거시 제거: 수기 컨트롤러 제거(bridge/mcp/preset/agent)로 생성 체계 일원화
- 문서: RPC/Frontend 인덱스 존재, RPC 가이드 SSOT는 `apps/gui/docs/rpc/GUIDE.md`

## 체크리스트(Phase)

### Phase 1 — 계약/코드젠/스트리밍

- [x] 계약 스키마 표준화(`z.record(z.string(), z.unknown())`)
- [x] 생성 클라이언트 `z.input/z.output` 추론 적용
- [x] 스트림 메서드 제공: `<name>Stream()` + `<name>On(handler)`
- [x] McpUsage 구독: transport.on → generated On/Stream 전환

### Phase 2 — 타입 엄격화(어댑터/훅/ESLint)

- [x] 어댑터 any 제거 + 경계 zod.parse 적용
  - [x] agent.adapter.ts — payload/result 계약 타입 적용 (ref: 675c389)
  - [x] conversation.adapter.ts — CursorPagination 스키마 적용 (ref: 735baeb)
  - [x] preset.adapter.ts — Core Preset 매핑 엄격화(기본값 보강 제거)
  - [x] bridge.adapter.ts — 반환 타입 계약 일치 (ref: d991d31)
- [x] 훅 타입 정리 및 캐스팅 제거
  - [x] use-chat.ts
  - [x] use-conversation.ts
  - [x] useAppData.ts
- [ ] ESLint 경고 축소(파일 단위 점진 적용)

### Phase 3 — 컨트롤러 승격

- [x] `apps/gui/src/main/**/gen/*.controller.gen.new.ts` 승격/와이어링
- [x] DTO/ValidationPipe 적용 및 반환 타입 계약 일치

### Phase 4 — 레거시/문서

- [x] 레거시 컨트롤러 제거(bridge/mcp/preset/agent)
- [x] renderer IPC 잔여물/주석 제거
- [x] ELECTRON_MCP_IPC_SPEC: Stream/On 사용 가이드 + 취소/해제 예시 추가
- [x] 계획서 정리: 본 통합 계획만 유지, 구 문서는 Superseded 표기 유지

### Docs & 표준화

- [x] 스텁/인덱스 정비: `apps/gui/docs/RPC_AND_STREAMING_GUIDE.md`, `apps/gui/docs/README.md`, `apps/gui/docs/rpc/README.md`
- [x] `apps/gui/plan/*` 내 404 링크 점검 및 수정
- [x] Plan→Docs 승격 체크리스트 작성(기여자 가이드 반영)

### 스트리밍 컨벤션(계약/코드젠)

- [x] `usage.events.streamResponse` 구체 스키마 채택(McpUsageUpdateEventSchema) 검토/적용
- [x] 코드젠: streamResponse 존재 시 서버 컨트롤러 스텁을 동기 + `Observable<z.output<...>>`로 생성 규칙 반영
- [x] GUIDE/SPEC에 서버 스트리밍 컨벤션(요소 스키마, 해제, Promise 금지) 명문화

## 산출물/정책

- 생성물 헤더 유지 및 안전 덮어쓰기 정책 준수(수기 수정 금지)
- 계약이 소스 오브 트루스(Single Source of Truth), 런타임 경계 zod 검증 필수
- 스트리밍은 Downstream Observable 노출, 구독 해제 필수(메모리/리소스 관리)

## PR 전략(작게 나누기)

1. Phase 2 — Agent: 어댑터/훅 정리 + ESLint 경고 제거
2. Phase 2 — Conversation: 페이지네이션/히스토리 타입 정렬
3. Phase 2 — Preset: 매핑 기본값 제거 + 계약 타입 정합
4. Phase 4 — 문서: ELECTRON_MCP_IPC_SPEC 추가 + GUIDE/SPEC 보강
5. 스트리밍 컨벤션/코드젠: 규칙 반영 및 계약 스키마 강화

## 참고/링크

- RPC 가이드(SSOT): `apps/gui/docs/rpc/GUIDE.md`
- 스트리밍 컨벤션 상세: `apps/gui/docs/rpc/STREAMING_CONVENTION.md`
- Plan→Docs 승격 체크리스트: `apps/gui/docs/PLAN_TO_DOCS_CHECKLIST.md`

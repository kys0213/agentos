# [Superseded] GUI RPC & Streaming Consolidated Plan (v1)

이 문서는 `GUI_CONSOLIDATED_PLAN.md`로 통합되었습니다. 최신 정보와 체크리스트는 단일 통합 문서를 참조하세요.

본 계획서는 GUI의 RPC 아키텍처를 계약→코드젠→어댑터→스트리밍까지 일관되게 정리하고, 기존 분산 문서의 중복 항목을 통합합니다.

## 목표

- 계약(Zod) 기반 단일 소스에서 클라이언트/컨트롤러/채널을 생성
- 스트림 엔드포인트(`streamResponse`)는 Promise가 아닌 Stream/On API로 노출
- 렌더러 어댑터/훅은 생성 타입(z.input/z.output 추론)으로 엄격하게 정렬
- 레거시 IPC 호출/프로토콜 의존 제거 및 Nest 모듈/컨트롤러로 이관 완료

## 현황(요약)

- 코드젠: 계약→클라이언트(typed) + 컨트롤러 스텁 + 채널 상수 생성
- 스트림: `mcp.usage.events`를 `usage_eventsStream/usage_eventsOn`으로 전환
- zod 추론: 생성 클라이언트가 `z.input/z.output`으로 타입 지정
- CI: Green(유지), 일부 any/ESLint 완화는 후속 복원 필요
- 서버 컨트롤러: 생성 컨트롤러(bridge/mcp/agent)에서 `as any` 제거 및 반환 타입 엄격화 완료
- MCP 스트리밍: 서버가 `Observable<z.output<...>>` 반환 패턴으로 복원(스트림 정상 푸시)
- 참고: 서버 스트리밍 컨벤션 상세는 `apps/gui/plan/RPC_STREAMING_SERVER_CONVENTION_PLAN.md` 참조
- 레거시 컨트롤러: 수기 컨트롤러(bridge/mcp/preset/agent) 제거로 생성 컨트롤러 체계로 일원화

## 단계별 계획

### Phase 1 — 계약/코드젠/스트림(완료)

- [x] 계약 스키마 정비: `z.record(z.string(), z.unknown())`로 시그니처 통일
- [x] 클라이언트 타입: `z.input/z.output` 기반 추론
- [x] 스트림 메서드 생성: `<name>Stream()` + `<name>On(handler)`
- [x] McpUsage 서비스 구독 교체(transport.on → generated On)

### Phase 2 — 타입 엄격화 복원(어댑터/훅)

- [ ] 어댑터 any 제거 및 zod parse로 경계 검증(도메인 단위 PR)
  - [ ] agent.adapter.ts — payload/result 계약 타입 적용
  - [ ] conversation.adapter.ts — CursorPagination 스키마 적용
  - [ ] preset.adapter.ts — Core Preset 매핑 엄격화(기본값 보강 제거)
  - [ ] bridge.adapter.ts — 반환 타입 계약 일치
- [ ] 훅 경계 타입 복원 및 캐스팅 제거
  - [ ] use-chat.ts / use-conversation.ts / useAppData.ts 정리
- [ ] ESLint 완화 축소 및 경고 제거(파일 단위 점진 적용)

### Phase 3 — Nest 컨트롤러 승격

- [x] `apps/gui/src/main/**/gen/*.controller.gen.new.ts` 승격/모듈 와이어링
- [x] DTO/ValidationPipe 적용 및 반환 타입 계약 일치
- [ ] 기존 services/\* 경로 이관/정리

### Phase 4 — 레거시 제거/문서

- [ ] renderer IPC 잔여물 제거(참조/주석 포함)
- [ ] ELECTRON_MCP_IPC_SPEC: Stream/On 사용 가이드 + 취소/해제 예시 추가
- [ ] 계획서 정리(본 통합 계획만 유지, 구 문서는 Archived 유지)

### Phase 5 — 품질/옵션

- [ ] 스트림 취소/타임아웃 샘플 + 테스트 보강
- [ ] 성능(메시지 포트) 및 청크 정책 별도 계획서로 분리

## 산출물/정책

- 생성물 파일 헤더 유지: 수동 수정 방지, 안전 덮어쓰기 정책 준수
- 타입 일관성: 생성 클라이언트/컨트롤러는 계약 스키마가 소스 오브 트루스
- 스트림 규칙: Promise 금지, AsyncGenerator/구독 API 제공, 해제 필수

## PR 전략(작게 나누기)

1. Phase 2—Agent: 어댑터/훅 엄격화 + ESLint 경고 제거
2. Phase 2—Conversation: 페이지네이션/히스토리 타입 정렬
3. Phase 2—Preset: 매핑 기본값 제거 + 계약 타입 정합
4. Phase 3—Controllers: 도메인 순으로 승격 및 모듈 연결
5. Phase 4—문서/레거시: 가이드 업데이트 + 잔여 제거

---

### Superseded 문서

- RPC_MIGRATION_PLAN.md, RPC_CODEGEN_AND_IPC_REMOVAL_PLAN.md, NEST_MAIN_SERVICES_MIGRATION_PLAN.md, AGENT_API_ALIGNMENT_PLAN.md

위 문서의 잔여 TODO는 본 계획서 Phase 2~4에 반영됩니다.

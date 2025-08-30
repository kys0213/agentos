# GUI Plans — Consolidated Index (Aug 2025)

본 문서는 기존 `apps/gui/plan/*` 계획서들의 최신 상태를 한눈에 정리하고, 중복/분산된 항목을 통합 계획으로 압축합니다. 개별 문서는 필요 시 보존하되, "Superseded" 표기가 있는 문서는 본 인덱스 및 통합 계획을 우선 참조하세요.

## 상태 요약

- Active (진행/참조 우선)
  - `RPC_AND_STREAMING_CONSOLIDATED_PLAN.md` — 계약→코드젠→어댑터→스트리밍 일원화(최신)
  - Docs: `../docs/RPC_AND_STREAMING_GUIDE.md` — 생성 클라이언트/스트림/취소 가이드(안정)
  - `DOCS_AND_PLANS_STANDARDIZATION_PLAN.md` — 문서/계획서 표준화 강화(구조/이동/아카이브)

 - Superseded (통합 문서로 흡수, docs/archive로 이동)
   - `apps/gui/docs/archive/RPC_MIGRATION_PLAN.md` — 통합 문서로 대체(스트림/취소/프레임 포함)
   - `apps/gui/docs/archive/RPC_CODEGEN_AND_IPC_REMOVAL_PLAN.md` — 통합 문서로 대체(코드젠 정책/안전 덮어쓰기 포함)
   - `apps/gui/docs/archive/NEST_MAIN_SERVICES_MIGRATION_PLAN.md` — 통합 문서 Phase 3로 이관(모듈/컨트롤러 승격)
   - `apps/gui/docs/archive/AGENT_API_ALIGNMENT_PLAN.md` — 통합 문서 Phase 2(어댑터 정합/타입 강화)로 이관

- Completed/Archived (완료 또는 참조용 보관)
  - `DESIGN_MIGRATION_PLAN.md` — 현재 범위와 직접 연동 낮음(보관)
  - `MCP_CORE_INTEGRATION_PLAN.md` — 1차 통합 반영 완료, 세부 과제는 통합 문서 참조
  - `PRESET_REAL_DATA_INTEGRATION_PLAN.md` — 1차 반영 완료, 잔여 타입 엄격화는 통합 문서 Phase 2
  - `CHAT_REACTQUERY_CONTAINER_PLAN.md` — 훅 구조 반영 완료(경고 정리 잔여)
  - `BACKLOG_SubAgentManager_Enhancements.md` — 별도 백로그 유지

## 다음 액션(요약)

1) 통합 계획 Phase 2: 타입 엄격화 복원(어댑터/훅 any 제거, ESLint 원복)
2) 통합 계획 Phase 3: 생성 컨트롤러 승격 + Nest 모듈 와이어링
3) 통합 계획 Phase 4: 레거시 IPC 잔여물 제거, 문서/샘플 업데이트

상세한 단계별 TODO/마일스톤은 `RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`를 참조하세요.

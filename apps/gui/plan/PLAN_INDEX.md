# GUI Plans — Consolidated Index (Aug 2025)

본 문서는 기존 `apps/gui/plan/*` 계획서들의 최신 상태를 한눈에 정리하고, 중복/분산된 항목을 통합 계획으로 압축합니다. 개별 문서는 필요 시 보존하되, "Superseded" 표기가 있는 문서는 본 인덱스 및 통합 계획을 우선 참조하세요.

## 상태 요약

- Active (진행/참조 우선)
  - `GUI_CONSOLIDATED_PLAN.md` — GUI 전반 단일 계획(타입/프리셋/채팅/컨트롤러/레거시/문서)
  - Docs: `../docs/RPC_AND_STREAMING_GUIDE.md` — 생성 클라이언트/스트림/취소 가이드(안정)

 - Superseded (통합 문서로 흡수 — 파일 제거됨)
   - RPC_MIGRATION_PLAN → 통합 문서로 대체(스트림/취소/프레임 포함)
   - RPC_CODEGEN_AND_IPC_REMOVAL_PLAN → 통합 문서로 대체(코드젠 정책/안전 덮어쓰기 포함)
   - NEST_MAIN_SERVICES_MIGRATION_PLAN → 통합 문서 Phase 3로 이관(모듈/컨트롤러 승격)
   - AGENT_API_ALIGNMENT_PLAN → 통합 문서 Phase 2(어댑터 정합/타입 강화)로 이관

- Completed/Archived (완료 또는 참조용 보관)
  - (삭제됨) Preset/Chat/MCP 개별 계획 — `GUI_CONSOLIDATED_PLAN.md`로 통합

## 다음 액션(요약)

1) 통합 계획 Phase 2: 타입 엄격화 복원(어댑터/훅 any 제거, ESLint 원복)
2) 통합 계획 Phase 3: 생성 컨트롤러 승격 + Nest 모듈 와이어링
3) 통합 계획 Phase 4: 레거시 IPC 잔여물 제거, 문서/샘플 업데이트

상세한 단계별 TODO/마일스톤은 `RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`를 참조하세요.

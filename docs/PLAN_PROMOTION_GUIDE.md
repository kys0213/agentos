# Plan → Docs 승격 가이드

> 이 문서는 plan/ 문서를 작업 완료 시 docs/로 승격(Promote)하는 표준 절차입니다. Git 워크플로우와 문서 표준을 함께 따릅니다.

## 원칙
- 단순함 우선: 완료된 TODO가 반영된 최소 충분 문서만 승격합니다.
- Interface-first: 최종 문서는 인터페이스/계약/시나리오 중심으로 정리합니다. 내부 구현 세부는 과도하게 담지 않습니다.
- 일관성: 문서 위치/링크/명명 규칙을 기존 docs/와 일치시킵니다.

## 언제 승격하나요?
- 계획서의 TODO가 모두 완료되고 테스트/타입체크/빌드가 통과할 때
- PR 생성 전에 승격을 완료해야 합니다.(PR 본문에는 승격된 Docs 경로를 기재)
- 변경된 인터페이스가 기존 문서와 충돌하지 않도록 조정이 끝났을 때

## 표준 절차
1) 최종 점검
- plan 문서의 요구사항, 인터페이스, 성공 기준(AC), TODO 체크 상태를 다시 검토합니다.
- 테스트 결과(`pnpm -r test`), 타입체크(`pnpm -r typecheck`), 빌드(`pnpm -r build`)를 확인합니다.

2) 문서 구조 결정
- 공통 지침/철학/가이드: 루트 `docs/` 아래에 배치합니다.
- 특정 패키지 기능 설명/사용자 가이드: 해당 패키지 `packages/<name>/docs/` 아래에 배치합니다.

3) 승격(프로모션)
- 문서명을 최종 사용자 관점으로 재정의합니다. (예: `GRAPH_RAG_PLAN.md` → `Personalized_Memory_Guide.md`)
- 계획서의 작업 내역/실험로그 등은 요약하여 “결과/결론” 위주로 재구성합니다.
- 인터페이스/타입/메서드 시그니처, 설정 예시, 사용 시나리오, AC 검증 방법을 포함합니다.
- 기존 관련 문서가 있으면 병합/확장하고, 중복은 제거합니다.

4) 파일 이동 및 정리
- `git mv packages/<scope>/plan/<file>.md <docs-target>/<NewName>.md`
- 계획서의 TODO/실험 섹션은 필요 시 별도 `notes/`로 분리하거나 PR 본문에만 남깁니다.
- 승격 후 plan 파일은 삭제합니다.

5) 커밋/PR 생성
- 커밋 메시지 예시:
  - `✅ [Plan→Docs] Promote GRAPH_RAG plan to docs with finalized interfaces`
- PR 본문은 아래를 포함해야 합니다.
  - Plan 링크와 요약, Scope
  - 승격된 Docs 경로(필수): `docs/...` 또는 `packages/<name>/docs/...`
  - 성공 조건(AC) 충족 근거 요약(3–5줄)
  - TODO 상태 체크(완료/보류)
  - 변경 사항 요약(3–7개 불릿)
  - 검증: `pnpm -r typecheck | test | build` 결과
  - Docs 업데이트 경로 및 기존 유사 문서 처리 방식

## 체크리스트
- [ ] TODO 전부 완료했는가?
- [ ] 인터페이스/타입/설정 값이 최신 코드와 일치하는가?
- [ ] 예제/가이드가 실제로 실행 가능한가?
- [ ] 기존 문서와 중복/충돌이 없는가?
- [ ] PII/내부 정보 노출이 없는가?

## 예시(경로/명명)
- Plan: `packages/core/plan/GRAPH_RAG_PLAN.md`
- Docs(공유 가이드): `docs/personalized-memory.md`
- Docs(패키지 가이드): `packages/core/docs/memory.md`

## 관련 문서
- Git Workflow: `docs/GIT_WORKFLOW_GUIDE.md`
- 문서 표준: `docs/DOCUMENTATION_STANDARDS.md`
- 테스트: `docs/TESTING.md`
- 타입 지침: `docs/TYPESCRIPT_TYPING_GUIDELINES.md`

## 주의
- 직접 병합 금지. 반드시 PR로 리뷰/승인 후 머지합니다.
- Plan→Docs 승격은 PR 생성 전 완료되어야 하며, PR 검토 항목에 포함됩니다.
- 승격 과정에서 Plan과 Docs의 내용이 불일치하지 않도록 마지막에 상호 참조를 제거하고, Docs만 단일 진실 소스로 남깁니다.

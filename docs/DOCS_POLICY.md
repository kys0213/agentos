# Docs & Plan Policy (Single Source)

본 문서는 리포지토리 전반에서 문서를 일관되게 운영하기 위한 정책의 단일 출처입니다. 문서 디렉토리 구조, 역할 구분, 통합/승격/정리 원칙, PR 요건을 정의합니다.

## 범위

- 루트 `docs/`: 공통 철학/가이드/워크플로우/정책(본 문서)
- 각 패키지 `apps/<name>/docs`: 패키지 사용자·개발자 가이드(개념/의도/기준 중심)
- 각 패키지 `apps/<name>/plan`: 요구사항/인터페이스 초안/TODO/작업 순서(진행 추적)

## 디렉토리 구조 원칙

- 도메인별 하위 폴더로 응집
  - 예: `apps/gui/docs/rpc/`(GUIDE/SPEC/TERMS/recipes), `apps/gui/docs/frontend/`(code-style/patterns/testing/roadmap)
- Deprecated 디렉토리 금지. 오래된 문서는 즉시 대체/삭제하며, 필요시 단기 스텁만 유지
- Archive 정책: 장기 보관을 지양. 필요 시 PR 본문/릴리스 노트로 이관 후 파일은 제거

## 문서 유형(역할)

- Spec: 계약/프로토콜/프레임/에러/취소 등 변경의 기준(Interface-first). SSOT(단일 출처).
- Guide: 개념/의도/사용 시나리오 중심. 구현 세부는 과도하게 담지 않음.
- Recipes: 실전 예제 모음(취소 패턴, 타입 추론, 네이밍 예시 등)
- Terms: 용어/채널/토픽 표준(SSOT). 모든 문서가 이를 참조.
- Plan: 요구사항/인터페이스 초안/TODO/작업 순서(완료 시 Docs로 승격 후 삭제)

## SSOT & 통합

- 같은 주제를 여러 문서가 기술하지 않도록 SSOT 선정(Spec/Terms 우선)
- 새 내용 추가 시 기존 문서 확장/병합을 우선. 새 문서를 만들 경우 기존 문서에 요약+링크 추가
- 중복/오래된 문서는 제거. 스텁은 단기(한두 스프린트)만 허용

## Plan → Docs 승격(요약)

- 시점: TODO 전부 완료 + 타입/테스트/빌드 통과 + 인터페이스 충돌 없음
- 승격: Plan 내용을 가이드/스펙으로 재구성(결과 중심). `plan/` 파일은 같은 PR에서 삭제
- PR 본문(필수): Plan 링크, AC 요약(3–5줄), TODO 상태, 변경 요약(3–7개), 검증 결과, 최종 Docs 경로, 기존 문서 병합/대체 내역

## 네이밍·링크 규칙

- 파일명은 사용자 관점으로 간결하게: 예) `rpc/GUIDE.md`, `rpc/SPEC.md`, `frontend/patterns.md`
- 인덱스: 도메인 폴더에 `README.md`로 내비게이션 제공
- 단일 출처 링크: Spec/Terms는 반드시 한 곳으로 수렴하고 모든 가이드/레시피가 이를 참조

## Git 워크플로우 연계

- 브랜치: 문서/구조 변경도 기능 브랜치(`feature/docs-...`)로
- 커밋: TODO·작업 단위(이동/승격/링크/인덱스 분리 권장)
- PR: 템플릿 필수(.github/pull_request_template.md). Plan 중심·검증 포함

## CI/Danger 권장

- FEATURE/Docs 변경 PR에서 `plan/` 잔존 또는 같은 주제 Plan/Docs 중복 시 실패
- 내부 링크 검증(ToC/상대 경로 깨짐 감지)

## 예시(앱: GUI)

- RPC: `apps/gui/docs/rpc/{GUIDE.md,SPEC.md,TERMS.md,recipes.md}`
- Frontend: `apps/gui/docs/frontend/{code-style.md,patterns.md,testing.md,roadmap.md}`
- Plan 통합: `apps/gui/plan/RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`

보조 문서

- 코드 문서 스타일·주석 규칙: `docs/DOCUMENTATION_STANDARDS.md`
- 승격 상세 절차/체크리스트(참고용): `docs/PLAN_PROMOTION_GUIDE.md`

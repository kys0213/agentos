# Docs & Plan Management Guide

본 문서는 리포지토리 전반에서 `docs/`와 `plan/`을 일관되게 운영하기 위한 표준입니다. 문서 구조, 역할 구분, 승격 절차, 통합/아카이브 정책을 정의합니다.

## 범위(Scope)

- 리포지토리 루트 `docs/`: 공통 철학/가이드/워크플로우
- 각 패키지 `apps/<name>/docs`, `packages/<name>/docs`: 패키지별 사용자/개발자 가이드
- 각 패키지 `apps/<name>/plan`, `packages/<name>/plan`: 요구사항/인터페이스/할일(TODO) 정의

## 디렉토리 규칙

- 패키지 문서가 많아질 경우 하위 디렉토리로 응집
  - 예: `apps/gui/docs/rpc/`(GUIDE/SPEC/TERMS/recipes), `apps/gui/docs/frontend/`(code-style/patterns/testing/roadmap)
  - 기록/히스토리 문서는 `apps/gui/docs/archive/`로 이동
- Deprecated 디렉토리 금지. 이동/대체 시 상단 배너로 안내 후 기존 파일은 삭제하거나 링크 스텁만 유지(단기)

## 문서 유형(역할 구분)

- Spec: 계약/프로토콜/프레임/에러/취소 등 변경의 기준이 되는 규약(Interface-first)
- Guide: 개념/의도/사용 시나리오 중심 가이드(코드 스니펫은 보조)
- Recipes: 실전 예제(취소 패턴, 타입 추론, 네이밍 예시 등)
- Terms: 용어/채널/토픽 표준(단일 출처)
- Archive: 마이그레이션 기록/과거 계획서 요약(3–5줄 배경 + 새 문서 링크)
- Plan: 요구사항/인터페이스 초안/TODO/작업 순서(완료 시 Docs로 승격 후 삭제)

## Plan → Docs 승격(요약)

- 시점: TODO 전부 완료 + 타입/테스트/빌드 통과 + 인터페이스 충돌 없음
- 방법: 내용 정리 → 기존 docs와 병합/확장 → `plan/` 삭제(SSOT)
- PR: 템플릿 기반(Plan 링크, AC 요약, TODO 상태, Changes, Verification, Docs 경로 필수)
- 상세: `docs/PLAN_PROMOTION_GUIDE.md` 참고

## 통합/아카이브 정책

- 같은 주제 중복 문서 금지. 기존 문서가 있으면 병합/확장(섹션 추가)으로 해결
- Superseded 문서는 `docs/archive/`로 이동하고 상단에 최신 단일 출처 링크 배너 추가
- 큰 변경으로 파일을 분리할 때는 인덱스 문서(`README.md`)를 추가하여 내비게이션 보장

## 네이밍/링크 규칙

- 파일명은 사용자 관점: 예) `RPC_AND_STREAMING_GUIDE.md` → `rpc/GUIDE.md`
- 인덱스: 도메인 폴더에 `README.md` 배치(목록/역할/링크)
- 단일 출처 링크: Spec/Terms는 반드시 한 곳으로 수렴하여 모든 가이드/레시피가 이를 참조
- 도메인별 규칙(예: GUI RPC dot→underscore 메서드 네이밍)은 Spec에 명문화하고 Guide/Recipes에서는 요약/예시만 제공

## 체크리스트(문서 정리/리팩토링)

- [ ] 대상 문서의 역할 판별(Guide/Spec/Recipes/Terms/Archive/Plan)
- [ ] 기존 유사 문서 조사 및 병합/확장 여부 결정
- [ ] 도메인 폴더 생성 및 `README.md` 인덱스 작성
- [ ] 이동/이관: `git mv` + 상단 배너(이동 안내) 추가 → 링크 경로 갱신
- [ ] Archive 이관: Superseded/STEP 문서 이동 + 배너 추가(최신 문서 링크)
- [ ] PR 본문: 계획서/Docs 경로/변경 요약/검증 결과/링크 갱신 포함

## 예시(앱: GUI)

- RPC 문서 응집
  - Guide: `apps/gui/docs/rpc/GUIDE.md` (현재: `apps/gui/docs/RPC_AND_STREAMING_GUIDE.md`)
  - Spec: `apps/gui/docs/rpc/SPEC.md` (현재: `apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md`)
  - Terms: `apps/gui/docs/rpc/TERMS.md` (현재: `apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`)
  - Recipes: `apps/gui/docs/rpc/recipes.md`
- Frontend 문서 응집
  - `apps/gui/docs/frontend/` 하위에 code-style/patterns/testing/roadmap
- Archive
  - 마이그레이션 단계/과거 계획서는 `apps/gui/docs/archive/`로 이동 후 상단 배너로 최신 문서 링크

## Git 워크플로우 연계

- 브랜치: 문서/구조 변경도 기능 단위 브랜치로 진행(`feature/docs-...`)
- 커밋: TODO/작업 단위. 승격/이관/배너/인덱스/링크 갱신을 논리적으로 분리 가능
- PR: 템플릿 필수. 문서 리팩터링도 동일 엄격도(Plan 중심, 검증/링크 갱신 여부 명시)
- 참고: `docs/GIT_WORKFLOW_GUIDE.md`, `.github/pull_request_template.md`

## CI/Danger 권장 가드(옵션)

- FEATURE/Docs 변경 PR에서 `plan/` 파일 잔존 또는 동일 주제의 Plan/Docs 중복 기술 시 실패
- 링크 유효성 체크(깨진 내부 링크 탐지), ToC 자동 검증

---

관련 문서: `docs/DOCUMENTATION_STANDARDS.md`, `docs/PLAN_PROMOTION_GUIDE.md`, `docs/GIT_WORKFLOW_GUIDE.md`


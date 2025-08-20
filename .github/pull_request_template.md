# Pull Request

## Context
- Plan: <!-- plan/<file>.md 또는 docs/<file>.md (승격 후) 링크 -->
- Scope: <!-- 예: packages/core, apps/gui 등 -->

## Requirements (from Plan)
<!-- 계획서의 성공 조건/요구사항 요약 3~5줄 -->

## TODO Status (from Plan)
<!-- 계획서의 TODO를 그대로 붙여넣고 완료 항목 체크 표시 -->
```
- [ ] TODO 1: ...
- [ ] TODO 2: ...
```

## Changes
<!-- 핵심 변경 사항 3~7개 불릿 -->
- ...

## Verification
<!-- 실행/검증 결과 요약: 명령어와 핵심 결과만 작성 -->
- `pnpm -r typecheck`: pass
- `pnpm -r test`: pass
- Build/manual checks: ...

## Docs
<!-- 계획서 승격/병합 여부와 경로. PR 유형별 원칙 적용: Feature/Fix는 문서 필수 갱신, Refactor/Perf/Chore는 외부 인터페이스 불변 시 생략 가능 -->
- Plan → Docs: <!-- yes/no, 경로 기입 -->
- Merged/Extended: <!-- 관련 docs 경로들 -->
- PR Type Rule: <!-- feature/fix require docs update | refactor no external change -->

## Risks / Notes
<!-- 브레이킹 변경, 마이그레이션, 알려진 제한, 추후 작업 -->
- Breaking: <!-- yes/no + 간단 설명 -->
- Notes: ...

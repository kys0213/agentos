# Summary

문서 트리를 인덱스 중심에서 섹션 기반 IA로 리팩토링했습니다. Start-Here/Architecture/Specs/Developer-Guides/Process-Policy/Templates 및 packages 허브를 추가하고, 모든 문서를 새 트리로 물리 이동했습니다. 링크 무결성 CI도 추가했습니다.

# Motivation & Context

가시성과 탐색성을 높이고(3-클릭 원칙), SSOT 원칙에 맞춰 중복/파편화를 줄이기 위함입니다. 패키지 문서를 전역 문서와 분리해 탐색 동선을 명확히 했습니다.

# Changes

- 새 섹션 스캐폴드: 00-start-here, 10-architecture, 20-specs, 30-developer-guides, 40-process-policy, 90-templates, packages/core|lang
- Start-Here: 로드맵/방향성 이동, 허브 추가
- Specs: batch-collection, ipc-event-spec 이관 + capability/RACP/storage/privacy/observability 스텁 추가
- Core: packages/core/docs/_ → docs/packages/core/_ (git mv), 아키텍처 허브 링크 교정
- Guides: TESTING/Typing/Code-Style/Complexity/Interface/AI-협업 이동
- Process-Policy: Docs/Standards/Git/Plan-Promotion 이동
- Templates: Plan Template 이동
- 루트/앱/패키지 문서 교차 링크 전면 교정
- CI: 문서 링크 무결성 검사 추가(.github/workflows/docs-link-check.yml)

# Screenshots / Links

- 새 허브: `docs/README.md`, `docs/packages/core/index.md`
- PR 비교: See GitHub PR

# Checklist

- [x] 단일 PR, TODO별 커밋 분리 (Git Workflow 준수)
- [x] 내부 링크 무결성 검사 CI 추가 및 통과
- [x] 기존 경로 → 새 경로로 교차 링크 교정
- [x] Start-Here/Architecture/Specs 허브에서 3클릭 내 주요 문서 도달 가능
- [x] 문서 이동 로그(현재 섹션)와 상세 변경 내역 요약

# Breaking Changes

문서 경로가 변경되었습니다. 외부 링크를 사용하는 문서/이슈는 새 경로로 갱신이 필요할 수 있습니다.

# Follow-ups

- [ ] 스펙 스텁 본문 보강(LLM Capability/RACP/Storage/Privacy/Observability)
- [ ] batch-collection.md 원문 복원 여부 확정 후 반영

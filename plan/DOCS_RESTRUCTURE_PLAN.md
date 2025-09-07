# 문서 구조 리팩토링 계획서 (Docs Restructure Plan)

## Requirements

### 성공 조건

- [ ] 핵심 문서(철학/로드맵/아키텍처/스펙/가이드)에 3클릭 이하로 도달 가능(인덱스 → 섹션 → 문서)
- [ ] 깨진 내부 링크 0건(링크 체커 CI 추가로 자동 검증)
- [ ] 새 폴더 구조가 명확한 정보 설계(섹션명만 보고도 문서 위치를 유추 가능)
- [ ] 패키지 전용 문서와 레포 전역 문서의 경계가 명확(패키지별 섹션 또는 프리픽스)
- [ ] Docs SSOT 원칙 유지(중복/양치기 문서 제거, Plan→Docs 승격 흐름 유지)

### 사용 시나리오

- [ ] 신규 기여자가 5분 내 다음을 파악: 철학/로드맵/핵심 아키텍처/기여 가이드 위치
- [ ] 제품/운영 담당자가 10분 내 다음을 파악: 수집/프라이버시/가드레일/관측 정책과 스펙
- [ ] 엔지니어가 1클릭으로 패키지별 설계/스펙에 도달하고, 2클릭으로 관련 가이드까지 이동

### 제약 조건

- [ ] 기존 PR/이슈에서 참조하던 문서 링크가 크게 깨지지 않도록 리다이렉트(링크 안내 파일) 또는 명확한 변경 로그 제공
- [ ] 문서 이동은 대규모 변경이므로, 1회 일괄 적용 + 링크 자동 교정 스크립트로 처리(수작업 최소화)

## Interface Sketch

```typescript
// (선택) docs/sidebar.manifest.ts (정적 사이트/사이드바를 고려한 선언적 구조)
export interface DocEntry {
  id: string; // stable id (e.g., architecture/orchestrator)
  title: string; // 문서명
  path: string; // 실제 파일 경로 (상대)
  tags?: string[]; // 검색/필터 태그
  children?: DocEntry[]; // 트리 구조
}

export const DOCS_SIDEBAR: DocEntry[] = [
  { id: 'start', title: 'Start Here', path: 'docs/README.md' },
  { id: 'roadmap', title: 'Roadmap', path: 'docs/ROADMAP.md' },
  // ...
];
```

```bash
# (선택) 링크 체커 CI 예시
pnpm dlx markdown-link-check "**/*.md" -q
```

## Todo

- [ ] 콘텐츠 인벤토리 작성(현 문서 목록/중복/노후 문서 식별)
- [ ] 새 트리 설계(섹션명/경로 컨벤션/패키지 문서 배치 원칙)
- [ ] 이동 계획 매핑(current → target) 테이블 확정
- [ ] 대량 이동 스크립트 작성(파일 이동 + 내부 링크 경로 치환)
- [ ] 최상위 인덱스(README.md, docs/README.md) 재작성 및 교차 링크 정리
- [ ] 링크 체커/정적 분석 CI 추가(markdown-link-check 등)
- [ ] 팀 합의 후 일괄 적용(한 PR) + 변경 로그에 이동표 첨부
- [ ] 후속 어댑테이션: 패키지 내 README/인덱스, gui/cli 전용 docs 인덱스 정리

## 작업 순서

1. **인벤토리 작성**: 현 `docs/` 및 `packages/*/docs` 문서 전체 목록과 사용처(중요도/연결 관계) 산출
2. **IA(Information Architecture) 설계**: 아래 제안 트리를 바탕으로 명칭/분류 확정(팀 합의)
3. **이동 매핑 테이블 고정**: current path → new path 일람표와 리다이렉트 안내파일(변경 전 경로에 짧은 안내) 정책 결정
4. **스크립트 적용**: 파일 이동 + `](/old/path` → `](/new/path` 링크 자동 교정; 링크 체커로 1차 검증
5. **인덱스/크로스링크 정리**: 루트 README, docs/README, 패키지 인덱스 업데이트
6. **CI 추가**: markdown-link-check 워크플로 등록, PR마다 링크 무결성 검사
7. **최종 검수/머지**: 리뷰어 체크리스트(도달성 3클릭, 링크 0에러) 충족 시 병합

---

## 제안: 새 문서 트리(초안)

> 목표: “읽는 사람 기준” 섹션명과 경로. 레포 전역과 패키지 전용을 분명히 구분.

```
/docs
  /00-start-here
    README.md                 # 전체 인덱스(입구), 철학/방향 링크 포함
    ROADMAP.md                # 로드맵(요약)
    PROJECT_DIRECTION_REVIEW.md

  /10-architecture            # 아키텍처/설계 개요(전역 관점)
    overview.md               # 전체 구조/흐름(데이터/제어면)
    orchestrator.md           # (기존 ORCHESTRATOR_ROUTING.md)
    agent-architecture.md     # (AGENT_ARCHITECTURE.md)
    memory-knowledge.md       # (CORE_KNOWLEDGE_DESIGN.md + memory-api.md 요약 진입)
    content-standard.md       # (CORE_CONTENT_STANDARDIZATION_PLAN.md 요약)

  /20-specs                   # 스펙/계약(정책/프로토콜/스키마)
    llm-capability.md         # (신규) 브리지 Capability 스펙
    racp-spec.md              # (신규) RACP 제어면 스펙
    batch-collection.md       # (BATCH_COLLECTION_SPEC.md)
    storage-abstraction.md    # (신규) 저장소 추상화 스펙
    privacy-security.md       # (신규) 수집/프라이버시/가드레일 정책
    observability-slo.md      # (신규) 지표/SLO/트레이싱 가이드
    ipc-event-spec.md         # (IPC_EVENT_SPEC.md)

  /30-developer-guides        # 개발자 가이드(실무 팁/규약)
    testing.md                # (TESTING.md)
    typescript-typing.md      # (TYPESCRIPT_TYPING_GUIDELINES.md)
    code-style.md             # (CODE_STYLE.md)
    complexity-guide.md       # (COMPLEXITY_GUIDE.md)
    ai-collaboration.md       # (AI_COLLABORATION_GUIDE.md)

  /40-process-policy          # 프로세스/정책(SSOT/기여 흐름)
    docs-policy.md            # (DOCS_POLICY.md)
    documentation-standards.md# (DOCUMENTATION_STANDARDS.md)
    git-workflow.md           # (GIT_WORKFLOW_GUIDE.md)
    plan-promotion.md         # (PLAN_PROMOTION_GUIDE.md)

  /90-templates
    PLAN_TEMPLATE.md

  /packages                   # 패키지 전용 문서(전역 문서와 분리)
    /core
      index.md                # core 패키지 인덱스(연결 허브)
      agent-architecture.md   # 패키지 관점 세부(원문 유지, 상단에 상위 문서 링크)
      orchestrator-routing.md
      knowledge-design.md
      memory-api.md
      memory-personalized.md
      mcp-service-architecture.md
      core-llm-bridge-registry.md
      tree-shaking-refactor.md
    /lang
      index.md                # lang 인덱스(유틸/타입 요약)
```

- 상위(00/10/20/30/40)는 “레포 전역 관점” 문서만 배치
- `/packages/*` 하위에 각 패키지의 상세/내부 문서를 보관(현재 위치 유지 가능하나, 인덱스 허브를 `/docs/packages`에 둬 탐색성 향상)

## 이동 매핑(대표 예시)

- `docs/PROJECT_DIRECTION_REVIEW.md` → `docs/00-start-here/PROJECT_DIRECTION_REVIEW.md`
- `docs/ROADMAP.md` → `docs/00-start-here/ROADMAP.md`
- `packages/core/docs/AGENT_ARCHITECTURE.md` → `docs/packages/core/agent-architecture.md`
- `packages/core/docs/ORCHESTRATOR_ROUTING.md` → `docs/packages/core/orchestrator-routing.md`
- `docs/BATCH_COLLECTION_SPEC.md` → `docs/20-specs/batch-collection.md`
- `docs/DOCS_POLICY.md` → `docs/40-process-policy/docs-policy.md`
- (나머지 전부 동일 패턴으로 일람표 제공)

## 추가 가이드라인

- 네이밍 컨벤션: 소문자-케밥케이스 파일명, 섹션 번호 접두(정렬/인지 강화)
- 문서 상단에 ‘상위/관련 문서’ 링크 블록을 필수로 배치(탐색성 향상)
- 중복/파편화 금지: 동일 주제는 전역 섹션 1곳만 SSOT, 패키지 문서는 해당 패키지 관점의 보완 자료로 링크
- 변경 로그: 대규모 이동 PR에는 current→new 매핑표 첨부, docs/README에 “변경 요약” 섹션 추가

## 리스크 및 완화

- 대량 링크 깨짐 → 이동 스크립트 + 링크 체커 CI + 안내 파일(간단 리다이렉션 문구)로 완화
- 팀 인지 부재 → 변경 전/후 트리 스냅샷 공유, “3클릭 규칙” 데모 영상 첨부
- 장기 운영 → 정적 사이트화(mkdocs/docusaurus) 도입 시 이번 트리를 그대로 사이드바로 사용 가능

---

본 계획은 “정보 설계(IA) → 일괄 이동(자동화) → 링크 검증(CI) → 인덱스 강화” 순서로 리스크를 최소화합니다. 팀 합의가 끝나면 1PR로 일괄 적용하는 것을 권장합니다.

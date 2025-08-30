# Docs & Plans Standardization Plan (GUI)

## Requirements

### 성공 조건

- [ ] GUI 문서 링크 404 제거 및 단일 인덱스 정비(`apps/gui/docs/README.md`, `apps/gui/docs/rpc/README.md`).
- [ ] RPC/Streaming 가이드의 단일 경로 확보(`apps/gui/docs/RPC_AND_STREAMING_GUIDE.md` → `apps/gui/docs/rpc/GUIDE.md` 연결).
- [ ] Plan→Docs 승격 원칙 준수: 완료된 계획서는 `docs/`로 이동하고 `plan/` 원본 제거.

### 사용 시나리오

- [ ] 신규/기존 기여자가 문서 인덱스에서 필요한 가이드를 일관된 경로로 접근.
- [ ] PR 본문이 Plan 링크를 기준으로 변경 범위를 설명하고, 승격 완료 여부를 명확히 기재.

### 제약 조건

- [ ] 외부 공개 경로 변경 최소화(기존 링크를 스텁/리다이렉트 문서로 보완).
- [ ] TypeScript/ESLint 정책과 충돌 없는 범위 내에서 문서만 변경.

## Interface Sketch

```ts
// 문서 경로 표준
// apps/gui/docs/README.md            : GUI 문서 인덱스(Single Source)
// apps/gui/docs/rpc/README.md        : RPC 하위 문서 인덱스
// apps/gui/docs/rpc/GUIDE.md         : RPC & Streaming 가이드(정본)
// apps/gui/docs/RPC_AND_STREAMING_GUIDE.md : 기존 경로 스텁(정본으로 연결)
```

## Todo

- [ ] 누락 가이드 스텁 생성: `apps/gui/docs/RPC_AND_STREAMING_GUIDE.md`
- [ ] 문서 인덱스 점검: `apps/gui/docs/README.md`, `apps/gui/docs/rpc/README.md`
- [ ] 계획서 링크 점검/수정: `apps/gui/plan/*` 내 404 제거
- [ ] Plan→Docs 승격 체크리스트 작성(기여자 가이드 반영)

## 작업 순서

1. 스텁 파일 추가 및 404 제거(가이드 경로 통일)
2. 인덱스/링크 점검 및 필요한 경우 경로 수정
3. 차기 PR에서 완료된 계획서의 Docs 승격 진행 및 원본 제거


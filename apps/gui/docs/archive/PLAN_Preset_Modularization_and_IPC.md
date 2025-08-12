# [ARCHIVED] Preset 컴포넌트 모듈화 및 IPC 연동 설계서

Archived: 2025-08-12
Reason: Implemented — PresetManagerContainer and presets fetchers exist; React Query + ServiceContainer wiring is in place.

## 목표

- 중복 UI를 프레젠테이션 컴포넌트로 분리하여 재사용성 확보
- 서버 상태는 React Query + IPC(ServiceContainer) 경유로 조회/수정
- 프레젠테이션은 동기 props만 소비, 컨테이너는 비동기/뮤테이션 담당

## 범위

- 대상: `apps/gui/src/renderer/components/preset/*`
- 최소 구현: 목록 조회 컨테이너, 프레젠테이션 props화, fetchers 추가
- 비대상: 지극히 세부적인 UI 리뉴얼, e2e, 전면 리팩토링(추가 PR로 분리)

## 컴포넌트 분리(프레젠테이션)

- `PresetStatusBadge.tsx`(기존): 상태 뱃지
- `PresetCard.tsx`(신규): 개별 Preset 카드 렌더(이름/카테고리/상태/간단 통계)
- `PresetListFilters.tsx`(신규): 검색/카테고리 필터
- `PresetStatsChips.tsx`(신규): knowledge 통계 칩 모음
- `PresetManager.tsx`: 프레젠테이션으로 유지하되, 아래 props를 받아 dual-mode 지원
  - `presets?: Preset[]`, `isLoading?: boolean`
  - `onDeletePreset?`, `onDuplicatePreset?`, `onEditPreset?`

## 컨테이너/Fetcher

- 컨테이너: `PresetManagerContainer.tsx`
  - `useQuery(['presets'], fetchPresets)`로 목록 로드
  - `useMutation`으로 생성/수정/삭제 → 성공 시 `invalidateQueries(['presets'])`
  - 프레젠테이션에 props로 주입
- fetchers: `services/fetchers/presets.ts`
  - `fetchPresets`, `createPreset`, `updatePreset`, `deletePreset`, `fetchPresetById`
  - 구현은 `ServiceContainer.resolve('preset')`의 `PresetProtocol`에 위임

## Interface Sketch

```ts
// Container
function PresetManagerContainer() {
  const { data: presets = [], status } = useQuery({ queryKey: ['presets'], queryFn: fetchPresets });
  const del = useMutation({ mutationFn: deletePreset, onSuccess: () => invalidate(['presets']) });
  return (
    <PresetManager
      presets={presets}
      isLoading={status === 'pending'}
      onDeletePreset={(id) => del.mutate(id)}
    />
  );
}

// Presentation (dual-mode)
export function PresetManager({ presets, isLoading, onDeletePreset }: Props) {
  const [localPresets, setLocalPresets] = useState<Preset[]>([]);
  const source = presets ?? localPresets;
  const loading = isLoading ?? localLoading;
  // ...
}
```

## Todo

- [ ] fetchers 추가: presets.ts (IPC 연동)
- [ ] PresetManagerContainer 추가: 목록/삭제 연동
- [ ] PresetManager dual-mode props 도입, 내부 상태와 병행 지원
- [ ] (후속) PresetCard/Filters/StatsChips 추출로 중복 제거
- [ ] (후속) 생성/수정/중복 뮤테이션 연동

## 작업 순서

1. fetchers 작성 → 2) 컨테이너 추가 → 3) PresetManager props 리팩터 → 4) 라우팅에 컨테이너 연결(옵션) → 5) 후속 UI 분리 PR

## 성공 조건

- Preset 목록이 IPC를 통해 로드되고, 로딩/오류가 컨테이너에서 처리됨
- PresetManager가 props를 수용하고 내부 상태 없이도 동작함
- 타입 안전성(any 금지) 및 기존 동작 보존

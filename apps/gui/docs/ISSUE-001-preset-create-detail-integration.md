# ISSUE-001: PresetManager onCreatePresetAsync 타입/스코프 오류

- 발생 시점: apps/gui typecheck 실행 중 (`pnpm -C apps/gui run typecheck`)
- 에러 메시지:
  - `TS2552: Cannot find name 'onCreatePresetAsync'. Did you mean 'onCreatePreset'?`
- 원인: `PresetManager` 컴포넌트의 props 인터페이스에는 `onCreatePresetAsync`를 추가했으나, 함수 파라미터 구조분해에서 `onCreatePresetAsync`를 누락해 스코프에서 찾지 못함.

## 영향 범위

- `PresetCreate` 모달의 onCreate 핸들러에서 `onCreatePresetAsync` 접근 시 컴파일 실패.

## 조치 내역

- 파일: `apps/gui/src/renderer/components/preset/PresetManager.tsx`
- 변경: 함수 인자 구조분해에 `onCreatePresetAsync` 추가.
  ```diff
  export function PresetManager({
    presets: injectedPresets,
    isLoading: injectedLoading,
    onDeletePreset,
    onDuplicatePreset,
    onCreatePreset,
    onUpdatePreset,
  + onCreatePresetAsync,
  }: PresetManagerProps) {
  ```
- 결과: `pnpm -C apps/gui run typecheck` 통과 확인.

## 재현 및 검증

1. 변경 전 `pnpm -C apps/gui run typecheck` 실행 → TS2552 발생.
2. 위 수정 적용 후 동일 명령 실행 → 정상 통과.

## 후속 작업

- 런타임 동작 검증: 프리셋 생성 플로우가 정상적으로 모달 닫힘/목록 갱신되는지 UI에서 확인 필요.
- 이후 발견되는 이슈는 `ISSUE-00N-*.md`로 개별 기록.

# Core Preset Repository Plan

## Requirements
- 저장된 프리셋을 관리하는 저장소 인터페이스를 제공한다.
- 커서 기반 페이징으로 프리셋 목록을 조회할 수 있어야 한다.
- 프리셋 상세 조회 기능을 제공한다.
- 프리셋을 생성, 수정, 삭제할 수 있어야 한다.
- 프리셋 엔티티는 사용자 입력으로 지정되는 `name` 외에 내부적으로 고유 `id`를 가진다.

## Interface Sketch
```ts
// packages/core/src/preset/preset.repository.ts
export interface PresetSummary {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
}

export interface PresetRepository {
  list(options?: CursorPagination): Promise<CursorPaginationResult<PresetSummary>>;
  get(id: string): Promise<Preset | null>;
  create(preset: Preset): Promise<void>;
  update(id: string, preset: Preset): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## Todo
- [x] `PresetSummary` 타입 정의
- [x] `PresetRepository` 인터페이스 정의
- [x] `index.ts`에서 새 인터페이스 내보내기
- [x] `pnpm lint` 와 `pnpm test` 실행 (테스트는 네트워크 차단으로 실패)

## 작업 순서
1. `preset.repository.ts` 파일에 인터페이스 정의
2. `index.ts` 내보내기 추가
3. 린트와 테스트 실행

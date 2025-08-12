# 작업계획서: PresetManager 생성/상세 통합

## Requirements

### 성공 조건

- [ ] Preset 생성 버튼 클릭 시 모달이 `PresetCreate` 컴포넌트로 표시된다.
- [ ] `PresetCreate`에서 생성 완료 시 목록이 새로고침되고 모달이 닫힌다.
- [ ] 프리셋 목록 카드 영역 클릭 시 `PresetDetail` 화면으로 전환되어 상세 정보를 열람/수정할 수 있다.
- [ ] `PresetDetail`에서 저장 시 상위의 `onUpdatePreset`이 호출되어 반영되고, 삭제 시 `onDeletePreset` 수행 후 목록으로 복귀한다.
- [ ] 타입 안전성 준수: `any` 사용 금지, 기존 컨테이너(`PresetManagerContainer`)와 인터페이스 불일치 없음.

### 사용 시나리오

- 사용자는 Preset Manager 화면에서 “Create Preset” 버튼을 눌러 생성 모달을 연다.
- 생성 모달은 단계형 UI(`PresetCreate`)를 통해 기본정보/설정/툴/지식베이스 순으로 입력한다.
- “Create Preset” 클릭 시 서버에 생성 요청이 성공하면 모달을 닫고 목록에 새 항목이 보인다.
- 목록에서 특정 프리셋 카드를 클릭하면 상세 화면(`PresetDetail`)로 이동한다.
- 상세 화면에서 기본정보/모델설정/시스템프롬프트 등을 수정하고 저장한다.
- 상세 화면에서 삭제를 선택하면 확인 후 삭제되고 목록으로 돌아간다.

### 제약 조건

- 기존 컨테이너(`PresetManagerContainer`)는 React Query mutation을 사용 중이므로, 생성은 비동기 프로미스 인터페이스를 보존해야 한다.
- UI 구조는 `PresetManager` 내부 탭 레이아웃을 유지하되, 상세 보기 모드 진입 시 탭 대신 `PresetDetail` 단일 화면을 표시한다.
- 기존 편집 폼(`PrestForm`) 기반 생성/수정 플로우는 제거/대체하되, 유지되는 편집 버튼(카드 하단 Edit)은 탭의 Edit 섹션으로 이동하도록 유지 가능.

## Interface Sketch

```typescript
// apps/gui/src/renderer/components/preset/PresetManager.tsx
export interface PresetManagerProps {
  presets?: Preset[];
  isLoading?: boolean;
  onDeletePreset?: (presetId: string) => void;
  onDuplicatePreset?: (preset: Preset) => void;
  onCreatePreset?: (data: Partial<Preset>) => void; // 기존 유지 (하위호환)
  // 신규: PresetCreate의 onCreate 시그니처에 맞춘 비동기 콜백 (권장)
  onCreatePresetAsync?: (data: CreatePreset) => Promise<Preset>;
  onUpdatePreset?: (id: string, data: Partial<Preset>) => void;
}

// 생성 모달 교체
// 기존: <PrestForm ... isCreateMode />
// 변경: <PresetCreate onBack={...} onCreate={...} />
//  - onCreate는 onCreatePresetAsync 우선 사용, 없으면 래퍼로 onCreatePreset 호출 후 목록 리프레시만 수행

// 상세 보기 전환
type ViewMode = 'list' | 'detail' | 'edit';
const [viewMode, setViewMode] = useState<ViewMode>('list');
const [detailPreset, setDetailPreset] = useState<Preset | null>(null);

// 카드 클릭 핸들러
const handleOpenDetail = (preset: Preset) => {
  setDetailPreset(preset);
  setViewMode('detail');
};

// PresetDetail 바인딩
<PresetDetail
  preset={detailPreset}
  onBack={() => setViewMode('list')}
  onUpdate={(p) => onUpdatePreset?.(p.id, p)}
  onDelete={(id) => { onDeletePreset?.(id); setViewMode('list'); }}
/>

// apps/gui/src/renderer/components/preset/PresetCard.tsx
export interface PresetCardProps {
  preset: Preset;
  onOpenDetail?: (preset: Preset) => void; // 신규
  onEdit?: (preset: Preset) => void;       // 기존 유지
  onDuplicate?: (preset: Preset) => void;
  onDelete?: (id: string) => void;
}

// 카드 전체를 클릭 시 상세 열기, 하단 버튼은 stopPropagation 처리
<Card onClick={() => onOpenDetail?.(preset)}>
  ...
  <Button onClick={(e) => { e.stopPropagation(); onEdit?.(preset); }} />
  <Button onClick={(e) => { e.stopPropagation(); onDuplicate?.(preset); }} />
  <Button onClick={(e) => { e.stopPropagation(); onDelete?.(preset.id); }} />
</Card>

// apps/gui/src/renderer/components/preset/PresetManagerContainer.tsx
// createMutation.mutateAsync를 사용해 onCreatePresetAsync 전달
<PresetManager
  ...
  onCreatePresetAsync={(data) => createMutation.mutateAsync(data)}
/>
```

## Todo

- [ ] `PresetManager` 생성 모달을 `PresetCreate`로 교체 (상태/콜백 연동)
- [ ] `PresetManager`에 상세 보기 모드(state) 추가 및 렌더링 분기
- [ ] `PresetCard` 카드 클릭 시 상세 열기 지원(`onOpenDetail`) 및 버튼 `stopPropagation` 처리
- [ ] `PresetDetail`과 삭제/업데이트/뒤로가기 핸들러 연동
- [ ] `PresetManagerContainer`에서 `onCreatePresetAsync` 전달 (가능 시)
- [ ] 타입 정리: `CreatePreset`/`Preset` 정확한 시그니처 적용, `any` 제거
- [ ] 문서 업데이트 및 사용 방법 가이드
- [ ] 통합 테스트 시나리오 정리 (수동/반자동 체크리스트)

## 작업 순서

1. 카드 클릭 → 상세 진입 구조 설계 및 `PresetCard`/`PresetManager` 인터페이스 정리 (완료 조건: 타입 오류 없음, 빌드 통과)
2. 생성 모달 교체: `PresetCreate` 삽입 및 컨테이너/콜백 연결 (완료 조건: 생성 후 목록 리프레시/모달 닫힘)
3. 상세 화면 연동: 업데이트/삭제/뒤로가기 핸들러 연결 (완료 조건: 저장/삭제 동작 후 목록으로 복귀, 상태 일관성)
4. 사용성 마감: 버튼 전파 차단, 탭/상세 전환 UX 확인 (완료 조건: 클릭 경합 없이 기대 동작)
5. 문서/테스트: 동작 시나리오 체크리스트, 추후 E2E 커버리지 포인트 명시 (완료 조건: 문서 반영)

## 테스트 체크리스트 (통합)

- [ ] “Create Preset” 클릭 시 `PresetCreate` 모달 표출
- [ ] 필수값 입력 전까지 생성 버튼 비활성
- [ ] 생성 성공 시 모달 닫힘 및 목록에 항목 추가
- [ ] 카드 바디 클릭 시 상세 화면으로 전환
- [ ] 상세에서 값 수정 → 저장 시 목록/상세 재진입시 변경 반영
- [ ] 상세에서 삭제 → 확인 → 목록으로 복귀 및 항목 미노출
- [ ] 카드 하단 Edit/Copy/Delete 버튼 클릭 시 상세 진입이 아닌 해당 기능만 수행

## 리스크 및 대응

- 컨테이너의 `onCreatePreset`(void)와 `PresetCreate.onCreate(Promise)` 시그니처 차이 → `onCreatePresetAsync`를 신규 도입하여 해결, 하위호환 유지.
- 상세 화면 진입 시 기존 탭 구조와의 충돌 → `viewMode` 분기로 탭과 상세를 상호배타적으로 렌더링.
- 이벤트 버블링으로 잘못된 네비게이션 발생 → 카드 내부 버튼 `stopPropagation` 처리.

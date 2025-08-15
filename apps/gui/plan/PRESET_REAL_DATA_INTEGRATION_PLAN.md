# Preset 실제 데이터 연동 계획서

## Requirements

### 성공 조건

- [ ] Preset 관련 모든 UI가 Mock 데이터 대신 실제 Core 서비스 데이터를 표시해야 함
- [ ] Preset CRUD 작업이 FileBasedPresetRepository를 통해 파일 시스템에 영구 저장되어야 함
- [ ] 기존 UI/UX가 완전히 보존되면서 데이터 소스만 교체되어야 함
- [ ] 에러 처리 및 로딩 상태가 실제 비동기 작업에 맞게 구현되어야 함
- [ ] 타입 안전성이 @agentos/core 타입과 완전히 호환되어야 함

### 사용 시나리오

- [ ] **Preset 목록 조회**: 앱 시작 시 실제 저장된 Preset들이 표시됨
- [ ] **Preset 생성**: 새 Preset 생성 시 파일 시스템에 영구 저장되고 즉시 UI에 반영됨
- [ ] **Preset 수정**: 기존 Preset 수정 시 변경사항이 파일에 저장되고 UI가 업데이트됨
- [ ] **Preset 삭제**: Preset 삭제 시 파일에서 제거되고 UI에서 사라짐
- [ ] **에러 처리**: 파일 시스템 오류 시 사용자에게 명확한 피드백 제공
- [ ] **실시간 동기화**: 여러 UI 컴포넌트가 동일한 Preset 데이터를 공유하고 동기화됨

### 제약 조건

- [ ] **기존 UI 100% 보존**: 사용자가 느끼는 모든 기능과 UX가 동일해야 함
- [ ] **기존 아키텍처 준수**: ServiceContainer, IpcChannel 패턴 유지
- [ ] **점진적 전환**: 다른 영역(Chat, MCP)에 영향 없이 Preset만 독립적 전환
- [ ] **Core 우선**: 모든 데이터 조작은 @agentos/core 인터페이스 준수

## Interface Sketch

```typescript
// 기존 Mock 의존성 제거
// AS-IS: Mock 데이터 의존
const mockPresets = [
  { id: '1', name: 'Default', ... }
];

// TO-BE: Core 서비스 직접 연동
import { Preset } from '@agentos/core';

interface UsePresetDataReturn {
  // Core 타입 직접 사용
  presets: Preset[];

  // 실제 비동기 작업
  isLoading: boolean;
  error: Error | null;

  // Core 서비스 연동 액션들
  createPreset: (preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePreset: (preset: Preset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  refreshPresets: () => Promise<void>;
}

// 실제 ServiceContainer 연동 구조
export function usePresetData(): UsePresetDataReturn {
  const presetService = ServiceContainer.get<PresetService>('preset');

  // React Query 또는 직접 state 관리로 비동기 데이터 처리
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 실제 Core 서비스 호출
  const refreshPresets = async () => {
    try {
      setIsLoading(true);
      const result = await presetService.getAll();
      setPresets(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    presets,
    isLoading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    refreshPresets
  };
}
```

## Todo

### Phase 1: 브랜치 생성 및 기반 준비 (0.5일)

- [ ] **[TODO 1/8]** feature/preset-real-data-integration 브랜치 생성
- [ ] **[TODO 2/8]** 현재 Preset Mock 데이터 사용 지점들 파악 및 분석

### Phase 2: Hook 레이어 실제 서비스 연동 (1일)

- [ ] **[TODO 3/8]** useAppData의 Preset 관련 로직을 실제 PresetService 연동으로 교체
- [ ] **[TODO 4/8]** 비동기 데이터 처리 및 에러 핸들링 구현

### Phase 3: UI 컴포넌트 연동 검증 (0.5일)

- [ ] **[TODO 5/8]** PresetManager 컴포넌트의 실제 데이터 연동 확인
- [ ] **[TODO 6/8]** 기타 Preset 사용 컴포넌트들의 동작 확인

### Phase 4: 통합 테스트 및 검증 (0.5일)

- [ ] **[TODO 7/8]** 전체 Preset 기능 동작 확인 및 에러 케이스 테스트
- [ ] **[TODO 8/8]** 타입체크, 빌드, 린트 검사 및 PR 생성

## 작업 순서

### 1단계: 브랜치 생성 및 분석 (TODO 1-2)

**완료 조건**: 작업 브랜치가 생성되고, 현재 Mock 데이터 의존성이 명확히 파악됨

- Git 워크플로우 가이드에 따른 브랜치 생성: `feature/preset-real-data-integration`
- 현재 코드베이스에서 Mock Preset 데이터 사용 위치 전수 조사
- 변경이 필요한 파일들과 영향 범위 분석

### 2단계: Hook 레이어 서비스 연동 (TODO 3-4)

**완료 조건**: useAppData Hook이 Mock 데이터 대신 실제 PresetService를 통해 데이터를 조회하고, 모든 CRUD 작업이 Core 서비스와 연동됨

- useAppData의 Preset 관련 상태와 액션들을 PresetService 기반으로 재작성
- 비동기 데이터 로딩, 에러 처리, 상태 관리 구현
- React의 선언적 패턴을 유지하면서 실제 서비스 호출 구조로 전환

### 3단계: UI 컴포넌트 검증 (TODO 5-6)

**완료 조건**: 모든 Preset 관련 UI 컴포넌트가 실제 데이터로 정상 동작하고, 사용자 경험이 기존과 동일함

- PresetManager와 관련 컴포넌트들의 실제 데이터 연동 동작 확인
- 로딩 상태, 에러 상태 UI 동작 검증
- CRUD 작업 후 UI 업데이트 확인

### 4단계: 통합 검증 및 완료 (TODO 7-8)

**완료 조건**: 모든 품질 기준을 통과하고 Pull Request가 생성됨

- 전체 Preset 기능의 end-to-end 테스트
- 코드 품질 검사 통과
- Git 워크플로우 가이드에 따른 PR 생성

## 개선 전략

### 🔒 절대 보존 영역

- 기존 UI/UX 동작 및 사용자 경험
- ServiceContainer 기반 아키텍처
- IpcChannel 통신 레이어
- @agentos/core 타입 시스템

### 🔄 전환 대상 영역

- Mock Preset 데이터 → FileBasedPresetRepository 연동
- 동기적 데이터 조작 → 비동기 서비스 호출
- 정적 상태 관리 → 동적 에러/로딩 상태 처리

### ⚠️ 주의사항

- **기능 보존**: Mock에서 Real로 전환하되 사용자가 느끼는 기능은 100% 동일해야 함
- **점진적 전환**: Preset 영역만 독립적으로 전환하여 다른 기능에 영향 없음
- **타입 안전성**: Core 타입과의 완전한 호환성 보장
- **에러 처리**: 실제 파일 시스템 작업의 에러 상황 고려

## 검증 체크리스트

### 기능 검증

- [ ] Preset 목록이 실제 저장된 파일에서 로드되는가?
- [ ] 새 Preset 생성 시 파일 시스템에 저장되는가?
- [ ] Preset 수정 시 변경사항이 파일에 반영되는가?
- [ ] Preset 삭제 시 파일에서 제거되는가?
- [ ] 에러 상황에서 적절한 피드백이 제공되는가?

### UI/UX 검증

- [ ] 기존과 동일한 사용자 경험을 제공하는가?
- [ ] 로딩 상태가 적절히 표시되는가?
- [ ] 에러 상태가 명확히 표시되는가?
- [ ] 모든 UI 컴포넌트가 새 데이터 구조와 호환되는가?

### 코드 품질 검증

- [ ] `pnpm typecheck` 통과하는가?
- [ ] `pnpm lint` 통과하는가?
- [ ] `pnpm build` 성공하는가?
- [ ] Git 워크플로우 가이드를 준수했는가?

### 아키텍처 검증

- [ ] ServiceContainer 패턴이 올바르게 사용되었는가?
- [ ] IpcChannel을 통한 통신이 정상 작동하는가?
- [ ] Core 서비스와의 연동이 올바른가?
- [ ] 다른 영역(Chat, MCP)에 영향을 주지 않는가?

## Git 워크플로우 적용

### 브랜치 전략

```bash
# 브랜치 생성
git checkout -b feature/preset-real-data-integration

# 각 TODO 완료 시마다 커밋
git commit -m "✅ [TODO 1/8] Create branch and analyze Mock data dependencies"
git commit -m "✅ [TODO 2/8] Identify all Preset Mock usage points"
# ... 각 TODO별 커밋 진행
```

### PR 생성 예시

```bash
gh pr create --title "Integrate real Preset data with Core services" --body "$(cat <<'EOF'
## Summary
- Replace Mock Preset data with FileBasedPresetRepository integration
- Implement async data handling and error states
- Preserve all existing UI/UX functionality
- Full Core service integration through ServiceContainer

## TODO Completed
✅ [TODO 1/8] Create branch and analyze Mock data dependencies
✅ [TODO 2/8] Identify all Preset Mock usage points
✅ [TODO 3/8] Convert useAppData to real PresetService integration
✅ [TODO 4/8] Implement async data handling and error management
✅ [TODO 5/8] Verify PresetManager component integration
✅ [TODO 6/8] Verify other Preset-related components
✅ [TODO 7/8] End-to-end integration testing
✅ [TODO 8/8] Quality checks and PR creation

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

## 예상 결과

이 계획서 완료 후:

- Preset 데이터가 실제 파일 시스템에 영구 저장됨
- 모든 Preset UI가 실제 Core 서비스와 연동됨
- 사용자 경험은 기존과 100% 동일하게 유지됨
- 다른 영역(Chat, MCP)의 실제 데이터 연동을 위한 검증된 패턴 제공

## Create/Detail Flow Integration (Consolidated)

다음 항목은 `PLAN_preset-manager-create-detail-integration.md`의 UI 통합 계획을 본 문서로 흡수한 것입니다.

### Acceptance

- [ ] Preset 생성은 `PresetCreate` 모달로 처리되며 완료 시 목록 갱신/모달 닫힘
- [ ] 카드 클릭으로 `PresetDetail` 진입, 저장/삭제 후 목록으로 복귀
- [ ] 컨테이너는 `onCreatePresetAsync`(mutateAsync) 등 비동기 콜백을 주입
- [ ] `any` 금지, `CreatePreset`/`Preset` 시그니처 준수

### Sketch

```ts
// PresetManager(P)
<PresetManager
  onCreatePresetAsync={(data) => createMutation.mutateAsync(data)}
/>

// 상세 전환
const [viewMode, setViewMode] = useState<'list'|'detail'|'edit'>('list');
const [detailPreset, setDetailPreset] = useState<Preset|null>(null);

<PresetDetail
  preset={detailPreset}
  onBack={() => setViewMode('list')}
  onUpdate={(p) => onUpdatePreset?.(p.id, p)}
  onDelete={(id) => { onDeletePreset?.(id); setViewMode('list'); }}
/>
```

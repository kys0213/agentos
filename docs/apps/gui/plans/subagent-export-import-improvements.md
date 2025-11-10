# 작업계획서: SubAgent Export/Import 개선

## Requirements

### 성공 조건
- [x] 타입 안정성: SubAgentManagerContainer의 타입 캐스팅 검증 로직 추가
- [x] 테스트 커버리지: SubAgentManager export/import 다이얼로그 단위 테스트 작성
- [x] 에러 메시지 표준화: 모든 export/import 에러 메시지 통일
- [x] 접근성 개선: Import 다이얼로그에 aria-label 추가
- [ ] UX 개선: window.alert() 대신 토스트 알림 시스템 사용 (선택사항)

### 사용 시나리오
- 사용자가 에이전트 매니저에서 export 버튼을 클릭하면 올바른 JSON이 복사되거나 프롬프트로 표시된다.
- 사용자가 import 다이얼로그에서 유효하지 않은 JSON을 붙여넣으면 명확한 에러 메시지가 표시된다.
- 스크린 리더 사용자가 import 다이얼로그의 agent명을 인식할 수 있다.

### 제약 조건
- 기존 export/import 기능의 동작은 변하지 않아야 한다.
- 타입 변경으로 인한 breaking changes 없음
- E2E 테스트의 안정성 향상

## 주요 문제점

### 1. 타입 안정성 문제
**위치**: `SubAgentManagerContainer.tsx:45-46, 67`
```typescript
// 현재: 검증 없는 타입 캐스팅
preset: agent.preset as ReadonlyPreset,
```

**개선안**:
- Agent.preset이 실제로 ReadonlyPreset인지 검증
- 타입 가드 추가

### 2. 테스트 커버리지 부족
**위치**: `SubAgentCreate.import.test.tsx`

**현재 상황**:
- SubAgentCreate의 import 테스트만 존재
- SubAgentManager의 export/import 다이얼로그 UI 테스트 없음
- 실패 시나리오 테스트 부족 (잘못된 JSON, 네트워크 오류 등)

### 3. 에러 메시지 일관성
**위치**: 여러 파일

**현재 상황**:
- `SubAgentCreate`: "Invalid JSON format. Please check the contents and try again."
- `SubAgentManagerContainer`: "Invalid agent JSON format. Please verify the contents and try again."

### 4. 접근성 부족
**위치**: `SubAgentManager.tsx:713-721`

**현재 상황**:
```typescript
<DialogDescription>
  Paste the JSON exported from another agent. This will overwrite the current
  configuration for <span className="font-medium">{importAgentName}</span>.
</DialogDescription>
```
- 스크린 리더가 agent명을 제대로 인식할 수 없을 수 있음

### 5. UX: Alert 사용 (선택사항)
**위치**: `SubAgentManagerContainer.tsx:58, 67`

**현재**:
```typescript
window.alert('Agent configuration copied to clipboard.');
window.alert('Agent configuration imported successfully.');
```

**개선안**: 토스트 시스템 사용으로 UX 개선

## Interface Sketch

### 타입 검증 함수
```typescript
// utils/type-guards.ts
export function isValidReadonlyPreset(value: unknown): value is ReadonlyPreset {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string'
  );
}
```

### 에러 메시지 상수
```typescript
// constants/export-import-messages.ts
export const EXPORT_IMPORT_MESSAGES = {
  INVALID_JSON: 'Invalid agent JSON format. Please verify the contents and try again.',
  EXPORT_ERROR: 'Failed to export agent configuration.',
  IMPORT_ERROR: 'Failed to import agent configuration.',
  CLIPBOARD_ERROR: 'Copy agent JSON',
  IMPORT_SUCCESS: 'Agent configuration imported successfully.',
  EXPORT_SUCCESS: 'Agent configuration copied to clipboard.',
} as const;
```

## Todo

### Phase 1: 타입 안정성
- [x] `utils/type-guards.ts` 추가 또는 `utils/agent-export.ts` 확장
- [x] `SubAgentManagerContainer.tsx`에 타입 검증 로직 추가
- [x] 타입 검증 테스트 작성

### Phase 2: 테스트 강화
- [x] `SubAgentManager.export.test.tsx` 작성 (export 다이얼로그 UI 테스트)
- [x] `SubAgentManager.import.test.tsx` 작성 (import 다이얼로그 UI 테스트)
- [x] 실패 시나리오 테스트 추가 (invalid JSON, mutation errors)
- [x] 기존 `SubAgentCreate.import.test.tsx` 업데이트 (필요시)

### Phase 3: 에러 메시지 표준화
- [x] `constants/export-import-messages.ts` 생성
- [x] `SubAgentManagerContainer.tsx` 메시지 교체
- [x] 모든 관련 파일에서 상수 사용으로 통일

### Phase 4: 접근성 개선
- [x] `SubAgentManager.tsx`의 DialogDescription에 aria-label 추가
- [x] Import 버튼에 aria-label 추가
- [x] 접근성 테스트 추가 (선택사항)

### Phase 5: UX 개선 (선택사항)
- [x] Toast 컴포넌트 확인 및 설계
- [x] `SubAgentManagerContainer.tsx`의 alert() 호출 토스트로 변경
- [x] Toast 타이밍 최적화

### Phase 6: E2E 테스트 안정성
- [ ] `openManagementView.ts`의 waitFor 로직 일관성 확인
- [ ] 요소 선택자 최적화

## 작업 순서 (권장)

1. **Phase 1 (타입 안정성)**: 기초 안정성 확보
2. **Phase 2 (테스트)**: 기능 검증 커버리지 확대
3. **Phase 3 (메시지)**: 사용자 경험 일관성
4. **Phase 4 (접근성)**: 포용적 설계
5. **Phase 5 & 6 (선택)**: 추가 개선

## 예상 영향도
- **타입 안정성**: 높음 (런타임 에러 방지)
- **테스트 커버리지**: 중간 (기존 기능 안정화)
- **메시지 표준화**: 낮음 (UX 개선)
- **접근성**: 중간 (포용성 향상)
- **UX 개선**: 낮음 (선택사항)

## 참고
- PR #198 리뷰: "feat(gui): move subagent export import to manager"
- 기존 계획서: `subagent-export-import-move.md`

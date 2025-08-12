# ISSUE-002: PresetDetail updatedAt toLocaleDateString() 런타임 크래시

- 재현 절차:
  1. Presets → Create Preset → 필수값 입력 후 생성
  2. 생성된 카드 본문 클릭하여 상세 화면 진입
  3. 즉시 런타임 에러 발생
- 브라우저 콘솔 에러:
  - `TypeError: Cannot read properties of undefined (reading 'toLocaleDateString') at PresetDetail`
- 원인:
  - 웹(MockIpcChannel) 환경에서 생성된 Preset 객체에 `updatedAt` 필드가 설정되지 않음
  - `PresetDetail`에서 `editedPreset.updatedAt.toLocaleDateString()`를 직접 호출해 `undefined.toLocaleDateString` 접근으로 크래시

## 영향

- 카드 클릭 시 상세 화면 진입 불가 → 프리셋 상세 편집 플로우 전체 차단

## 조치 제안

- `PresetDetail`에서 `updatedAt`가 `Date|string|undefined` 모두 안전 처리
  - 유효하지 않으면 `'-'` 표시

## 상태

- [x] 원인 분석
- [ ] 코드 수정(PR 포함)
- [ ] 브라우저 재검증

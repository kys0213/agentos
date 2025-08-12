# ISSUE-003: PresetCreate 모달 레이아웃 깨짐 및 퍼널 전환 요구사항 미반영

- 증상: PresetCreate를 Dialog 모달 내부에 렌더링하면서 콘텐츠가 과밀/깨짐. 접근성 경고(aria-describedby)도 발생.
- 요구사항: CreateAgent와 동일하게 모달이 아닌 전체 화면 퍼널 전환으로 구현 필요.
- 원인: `PresetManager`에서 생성 UI를 `Dialog`로 유지.

## 조치 계획
- `PresetManager`에 viewMode에 `create` 추가하여 전체 화면 전환.
- 상단 "Create Preset" 버튼 → `viewMode = 'create'`로 전환.
- 기존 Create Dialog 제거.
- `PresetCreate`의 `onBack` → `viewMode = 'list'` 복귀, `onCreate` 완료 후 리스트로 복귀.

## 상태
- [ ] 코드 수정
- [ ] 타입체크 및 UI 확인
- [ ] 리그레션 위험 포인트: 알림/무효화 타이밍, 상세/리스트 전환 일관성


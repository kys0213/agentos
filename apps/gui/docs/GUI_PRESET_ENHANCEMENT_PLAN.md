# GUI Preset Enhancement Plan

## Requirements

### 성공 조건
- [ ] Presets include description, system prompt and default bridge fields.
- [ ] Changing a preset while chatting applies immediately to the session.

### 사용 시나리오
- [ ] User edits a preset, specifying description and system prompt.
- [ ] During a chat, user selects another preset and the conversation continues with new parameters.

### 제약 조건
- [ ] Existing presets remain compatible.
- [ ] Changes must not interrupt ongoing sessions.

## Interface Sketch
```typescript
interface Preset {
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  defaultBridge?: string;
}
```

## Todo
- [ ] Extend preset editor with extra fields
- [ ] Update `ChatApp` logic to reapply presets in real time
- [ ] Migrate stored presets to new structure
- [ ] Unit tests for preset switching
- [ ] Documentation update

## 작업 순서
1. **폼 확장**: 프리셋 편집 UI에 새로운 필드 추가 (완료 조건: 저장 가능)
2. **로직 수정**: 세션 진행 중 프리셋 변경 시 즉시 적용 (완료 조건: 새 설정 반영)
3. **데이터 마이그레이션**: 기존 프리셋을 새 구조로 업데이트 (완료 조건: 로드 문제 없음)
4. **테스트/문서**: 기능 테스트 및 문서 보완 (완료 조건: lint/test 통과)

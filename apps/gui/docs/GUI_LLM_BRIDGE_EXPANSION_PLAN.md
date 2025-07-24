# GUI LLM Bridge Expansion Plan

## Requirements

### 성공 조건
- [ ] Support multiple bridge types such as OpenAI and Anthropic.
- [ ] Bridge settings allow API keys and model names per type.
- [ ] Selected bridge metadata is displayed in the UI.

### 사용 시나리오
- [ ] User chooses "OpenAI" and enters API key and model.
- [ ] Metadata like context window and version appears for the selected bridge.
- [ ] Bridge becomes available for chat sessions.

### 제약 조건
- [ ] New bridges integrate with existing `BridgeManager` API.
- [ ] Sensitive keys stored securely with `electron-store`.

## Interface Sketch
```typescript
class OpenAiBridge implements LlmBridge {
  constructor(opts: { apiKey: string; model: string });
}

class BridgeManager {
  register(id: string, bridge: LlmBridge): void;
  getMetadata(id: string): BridgeMetadata;
}
```

## Todo
- [ ] Add bridge types for OpenAI and Anthropic
- [ ] Implement dynamic form to enter settings for each type
- [ ] Display metadata returned by `getMetadata`
- [ ] Unit tests for new bridge classes
- [ ] Update user docs for bridge configuration

## 작업 순서
1. **브리지 구현**: OpenAI 등 실제 API 호출 클래스 작성 (완료 조건: 빌드 성공)
2. **폼 개선**: 타입별 입력 필드와 검증 추가 (완료 조건: 올바른 값 저장)
3. **메타데이터 표시**: UI에서 정보 조회 후 렌더링 (완료 조건: 화면에 노출)
4. **테스트/문서**: 새 브리지 테스트 및 문서 업데이트 (완료 조건: lint/test 통과)

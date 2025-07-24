# GUI Message UI Plan

## Requirements

### 성공 조건
- [ ] Messages display the sent time.
- [ ] User and agent messages are visually separated with bubble styles.
- [ ] Loading indicator appears while the agent is generating a reply.

### 사용 시나리오
- [ ] User sends a message and immediately sees it on the right with timestamp.
- [ ] Agent reply appears on the left with its timestamp.
- [ ] While waiting, a spinner or "답변 생성 중..." informs the user of progress.

### 제약 조건
- [ ] Existing message flow must remain intact.
- [ ] Styling uses Chakra UI components.

## Interface Sketch
```typescript
export interface Message {
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

function send(text: string): Promise<void>; // records timestamp
```

## Todo
- [ ] Extend `Message` type with `timestamp` field
- [ ] Update `send` in `useChatSession` to add the current time
- [ ] Style `ChatMessageList` bubbles with alignment and colors
- [ ] Show a spinner while awaiting agent response
- [ ] Unit test timestamp and loading logic
- [ ] Update docs with new UI behavior

## 작업 순서
1. **타입 확장**: `Message` 인터페이스에 `timestamp` 추가 (완료 조건: 빌드 성공)
2. **기능 구현**: `send` 함수 수정 후 로딩 표시 적용 (완료 조건: UI에서 확인)
3. **테스트/문서**: 테스트 작성 후 결과 반영하고 문서 업데이트 (완료 조건: lint/test 통과)

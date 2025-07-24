# GUI Message Search and Filter Plan

## Requirements

### 성공 조건

- [x] Users can filter messages by keyword in real time.

### 사용 시나리오

- [x] User enters text in a search box and only matching messages remain visible.

### 제약 조건

- [x] Filtering should not noticeably delay UI updates even with long histories.

## Interface Sketch

```typescript
function useMessageSearch(messages: Message[], term: string): Message[];
```

## Todo

- [x] Add search input field above `ChatMessageList`
- [x] Filter messages as user types
- [x] Unit tests for filtering hook
- [x] Documentation update

## 작업 순서

1. **UI 추가**: 검색 입력창 배치 (완료 조건: 키 입력 가능)
2. **필터 로직**: hook 작성 후 리스트에 적용 (완료 조건: 실시간 필터링 동작)
3. **테스트/문서**: 테스트 작성 후 문서 보완 (완료 조건: lint/test 통과)

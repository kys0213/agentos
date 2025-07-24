# GUI Session Rename and Delete Plan

## Requirements

### 성공 조건
- [ ] Sessions can be renamed from the sidebar.
- [ ] Users can delete unwanted sessions.
- [ ] Session list reflects changes immediately.

### 사용 시나리오
- [ ] User clicks a pencil icon next to a session title and edits the name.
- [ ] User removes a session with a trash icon and it disappears from the list.

### 제약 조건
- [ ] Persist updates through `ChatManager` so sessions reopen with new titles.
- [ ] Deletion must remove related files from disk.

## Interface Sketch
```typescript
class ChatManager {
  renameSession(id: string, title: string): Promise<void>;
  deleteSession(id: string): Promise<void>;
}
```

## Todo
- [ ] Add edit and delete icons to `ChatSidebar`
- [ ] Implement `renameSession` and `deleteSession` in `ChatManager`
- [ ] Refresh session list after operations
- [ ] Unit and integration tests for rename/delete flows
- [ ] Update documentation for session management

## 작업 순서
1. **UI 추가**: 사이드바에 아이콘 배치 (완료 조건: 편집창 표시)
2. **로직 구현**: `ChatManager` 메서드 작성 후 세션 갱신 (완료 조건: 이름 변경/삭제 동작)
3. **테스트/문서**: 기능 테스트 후 문서 수정 (완료 조건: lint/test 통과)

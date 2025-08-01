# GUI Chat History Export/Import Plan

## Requirements

### 성공 조건

- [ ] Current session messages can be exported to JSON or Markdown.
- [ ] Users can import a previous session from a file.

### 사용 시나리오

- [ ] User clicks an Export button and saves messages as a file.
- [ ] Later the user imports the file to review or continue the conversation.

### 제약 조건

- [ ] Utilize Electron's `dialog` and file system APIs for cross-platform support.
- [ ] Handle invalid files gracefully during import.

## Interface Sketch

```typescript
function exportSession(sessionId: string, format: 'json' | 'md'): Promise<void>;
function importSession(filePath: string): Promise<ChatSession>;
```

## Todo

- [ ] Add Export button with format selection
- [ ] Implement file save via Electron dialog
- [ ] Implement import logic and load messages
- [ ] Tests covering export and import functions
- [ ] Update user guide with instructions

## 작업 순서

1. **Export 구현**: 세션 데이터를 파일로 저장 (완료 조건: JSON/MD 파일 생성)
2. **Import 구현**: 외부 파일을 열어 세션 로드 (완료 조건: 기록이 화면에 표시)
3. **테스트/문서**: 기능 테스트 후 가이드 작성 (완료 조건: lint/test 통과)

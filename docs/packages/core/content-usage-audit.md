# Core Content Usage Audit

본 문서는 Core의 메시지/콘텐츠 처리 경로에서 `CoreContent[]` 표준 적용 영향 범위를 점검하기 위한 체크리스트입니다.

## 현 상태 요약

- 표준 타입/유틸: `CoreContent`, `CoreMessage`, `toCoreContentArray`, `normalizeToCoreContentArray` 추가 완료
- 기존 코드는 `llm-bridge-spec`의 `Message`/`ChatMessage`를 사용하며 `content`가 단일 객체인 경우 존재
- GUI 파서(`message-parser.ts`)는 배열/단일/문자열 모두 처리하도록 보강 완료

## 영향 범위 (파일/지점)

- chat-session
  - `packages/core/src/chat/chat-session.ts`
    - `MessageHistory = Message & { messageId, createdAt, ... }` (Message는 Bridge 타입)
    - getHistories/appendMessage 등에서 `content`는 단일 또는 배열(툴 메시지) 혼재
- file-based session 구현
  - `packages/core/src/chat/file/file-based-chat-session.ts`
  - `packages/core/src/chat/file/file-based-chat-session-message-history-file.ts`
  - `packages/core/src/chat/file/file-based-session-storage.ts`
    - 파일 저장/로드 시 `content` 직렬화 포맷 확인 필요(배열/단일 모두 안전하도록)

## 표준화 적용 원칙

- 내부 표준: `CoreContent[]`
- 경계부(입출력/직렬화)에서만 정규화 적용
  - 입력 시: `normalizeToCoreContentArray`
  - 내부 처리/저장: 항상 배열 표준 유지
  - 출력 시: 소비자 요구가 단일이면 어댑터에서 변환(가급적 배열 유지 권장)

## TODO 체크리스트

- [ ] chat-session: `appendMessage`, `getHistories` 경계에서 `normalizeToCoreContentArray` 적용 여부 검토
- [ ] file-based 저장소: 저장/로드 시 `content`가 배열 표준으로 유지되는지 테스트 추가
- [ ] compression 관련(`CompressStrategy`): `content` 배열 가정하에 동작하는지 확인
- [ ] 테스트: 배열/단일/툴 메시지(`role: 'tool', content: CoreContent[]`) 혼합 히스토리 시나리오 추가
- [ ] 문서: 파일 포맷(직렬화) 표준 예시 추가(배열 형태로 기록)

## 권장 테스트 시나리오

- 세션에 순서대로 메시지 추가: user(text 단일) → assistant(text 단일) → tool(file/image 등 배열)
- 저장 후 로드하여 `content`가 배열 표준으로 유지되는지 검증
- `getHistories`로 페이지네이션 시 `content` 형식 유지 확인

## 비고

- GUI/CLI는 이미 배열 표준을 수용하도록 파서/유틸 보강됨
- Core에서는 기존 Bridge 타입과의 호환성을 깨지 않도록 경계 어댑터에서만 정규화 적용을 권장

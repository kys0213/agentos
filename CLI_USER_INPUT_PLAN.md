# CLI User Input Plan

## 요구사항
- `browseSessions`와 `browseHistory`에서 페이징 탐색을 위한 입력 처리에 `UserInputStreamBuilder`를 사용한다.
- `(n)ext`, `(p)rev`, `(q)uit` 및 번호 선택 명령을 정규식으로 처리한다.
- 함수 시그니처는 유지하되 내부 구현을 단순화한다.

## 인터페이스 초안
```ts
// packages/cli/src/sessions.ts
export async function browseSessions(manager: ChatManager): Promise<void>;

// packages/cli/src/history.ts
export async function browseHistory(manager: ChatManager, sessionId: string): Promise<void>;
```

## Todo 리스트
- [ ] `browseSessions`에서 `UserInputStreamBuilder`를 이용해 입력 루프를 재작성
- [ ] `browseHistory`에서 동일하게 적용
- [ ] `pnpm lint`와 `pnpm test` 실행

## 작업 순서
1. `packages/cli/src/utils/user-input-stream.ts` 사용 예시를 참고하여 두 함수에서 입력 스트림을 생성한다.
2. 각 명령에 대한 콜백에서 페이지 이동 및 출력 로직을 수행한다.
3. 기존 `readline` 구현을 제거한다.
4. 프로젝트 루트에서 `pnpm lint`와 `pnpm test`를 실행한다.

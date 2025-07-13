# CLI Session Browsing Plan

## 요구사항
- `agentos sessions` 명령을 통해 과거 세션 목록을 페이지 단위로 보여준다.
- 목록은 5개씩 보여주고 사용자는 (n)ext, (p)rev, (q)uit 또는 번호 입력으로 세션을 선택할 수 있다.
- 세션을 선택하면 해당 세션의 메시지 이력을 페이지 단위로 볼 수 있다.
- 메시지 페이지에서도 (n)ext, (p)rev, (q)uit 동작을 지원한다.

## 인터페이스 초안
```ts
// packages/cli/src/browse.ts
export async function browseSessions(): Promise<void>;
export async function browseHistory(sessionId: string): Promise<void>;
```
- 내부에서 `createManager()` 로 `ChatManager` 를 생성한다.
- `browseSessions` 는 `ChatManager.list()` 를 사용해 세션 목록을 페이징한다.
- `browseHistory` 는 `ChatSession.getHistories()` 로 메시지를 페이징한다.

## Todo 리스트
- [ ] 페이징 유틸리티 `paginate` 구현
- [ ] `browseSessions` 구현
- [ ] `browseHistory` 구현
- [ ] CLI 명령 `agentos sessions` 및 `agentos history <id>` 연결
- [ ] README 업데이트
- [ ] 간단한 단위 테스트 (필요 시)

## 작업 순서
1. `packages/cli/src/utils/paginate.ts` 생성 후 제너릭 페이징 도우미 구현
2. `packages/cli/src/browse.ts` 파일에 두 브라우저 함수 작성
3. `packages/cli/src/index.ts` 에 두 커맨드 추가
4. 기존 `history.ts` 제거 또는 대체
5. README 의 CLI 섹션 갱신
6. `pnpm lint` 와 `pnpm test` 실행

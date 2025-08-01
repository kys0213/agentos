# CLI History Plan

## 요구사항

- `agentos` CLI 에서 특정 세션의 대화 이력을 확인하는 명령을 추가한다.
- 명령 형식: `agentos history <sessionId>`
- 세션의 메시지 히스토리를 시간 순서대로 출력한다.
- 세션이 존재하지 않을 경우 오류 메시지를 표시한다.

## 인터페이스 초안

```ts
// packages/cli/src/history.ts
export async function showHistory(sessionId: string): Promise<void>;
```

- 내부에서 `createManager()` 로 `ChatManager` 를 생성하여 세션을 로드한다.
- `ChatSession.getHistories()` 를 이용해 모든 메시지를 가져오고, `console.log` 로 `[시간] 역할: 내용` 형태로 출력한다.

## Todo 리스트

- [ ] `showHistory` 함수 구현
- [ ] `agentos history` 커맨드 추가
- [ ] README 업데이트 (새 커맨드 설명 추가)
- [ ] 필요한 경우 단위 테스트 작성 (`history.ts`)

## 작업 순서

1. `packages/cli/src/history.ts` 파일 생성 후 `showHistory` 구현
2. `packages/cli/src/index.ts` 에 history 커맨드를 추가
3. 간단한 Jest 테스트 작성 (세션 로드와 history 호출 확인)
4. README 의 CLI 설명 업데이트
5. `pnpm lint` 및 `pnpm test` 실행

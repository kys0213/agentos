# CLI LRU Caching Plan

## 요구사항
- `browseSessions`와 `browseHistory` 명령에서 모든 페이지를 배열로 누적하지 말고, 최근 N페이지만 유지한다.
- 페이지 데이터를 다시 로드할 수 있도록 각 페이지의 시작 cursor를 기억한다.
- 기본 동작(앞/뒤 이동, 번호 선택)은 그대로 유지한다.

## 인터페이스 초안
```ts
// packages/cli/src/page-cache.ts
export class PageCache<T> {
  constructor(maxPages: number);
  get(page: number): T | undefined;
  set(page: number, data: T, cursor: string | undefined): void;
  getCursor(page: number): string | undefined;
}
```

```ts
// packages/cli/src/browse.ts
export async function browseSessions(manager: ChatManager): Promise<void>;
export async function browseHistory(manager: ChatManager, sessionId: string): Promise<void>;
```

## Todo 리스트
- [ ] `PageCache` 유틸리티 구현 (LRU 기반)
- [ ] `paginate` 함수에 페이지 시작 cursor 반환 기능 추가
- [ ] `browseSessions`와 `browseHistory`를 `PageCache`를 사용하도록 수정
- [ ] README 업데이트 (메모리 제한 옵션 문서화)
- [ ] `pnpm lint`와 `pnpm test` 실행

## 작업 순서
1. `packages/cli/src/page-cache.ts` 파일 생성 후 LRU 캐시 구현
2. `paginate`와 두 브라우저 함수에서 캐시 사용 로직 적용
3. CLI 명령 동작을 수동 테스트하여 이전/다음 이동이 잘 동작하는지 확인
4. 문서 업데이트 후 린트와 테스트 실행

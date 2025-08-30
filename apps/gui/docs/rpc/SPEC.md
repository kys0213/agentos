# RPC Spec (Single Source of Truth)

See also: `GUIDE.md`, `TERMS.md`, `recipes.md`.

본 문서는 GUI RPC의 규약(프레임/에러/취소/네이밍)을 단일 출처로 요약합니다. 자세한 배경과 예시는 기존 스펙 문서를 참조하세요.

- 상세 스펙(배경/예시 포함): `apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md`
- 인덱스: `apps/gui/docs/rpc/README.md`

## 프레임 규격

- kind: `req | res | err | nxt | end | can`
- 상관관계: `cid`
- 에러: CoreError 매핑(`code`, `domain`, `message`, `details?`)
- 취소: 소비자 → `can` 프레임 전송(AsyncGenerator `return()` 또는 `close()` 호출)

## 클라이언트 메서드 네이밍 규칙

- 점 표기 채널은 클라이언트 메서드에서 언더스코어로 변환합니다.
  - 예: `mcp.usage.getStats` → `usage_getStats()`
  - 스트림: `mcp.usage.events` → `usage_eventsStream()` / `usage_eventsOn()`

## 타입 규칙(zod)

- 요청 payload 타입: `z.input<typeof Contract.methods['name']['payload']>`
- 응답/스트림 타입: `z.output<typeof ...>`

## 취소/해제 규칙

- AsyncGenerator: `for await...` 탈출 후 `await it.return?.()` 호출
- 구독형(On): `const close = ...On(handler); await close()`

> 구현/배경 세부: `apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md`

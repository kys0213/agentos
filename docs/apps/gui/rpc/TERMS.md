# RPC Terms & Channels (Single Source)

See also: `GUIDE.md`, `SPEC.md`, `recipes.md`.

본 문서는 용어 정의와 채널 네임스페이스 표준을 단일 출처로 제공합니다. 세부 항목과 예시는 기존 문서를 참조하세요.

- 상세 문서(현행): `docs/apps/gui/rpc/TERMS_FULL.md`
- 인덱스: `docs/apps/gui/rpc/README.md`

## 용어 요약

- RpcFrame: `req | res | err | nxt | end | can`
- FrameTransport: 브릿지 프레임 전송 계층(Electron `start/post/stop`)
- RpcClient: `request/stream/on` API 제공 엔드포인트
- 취소: 소비자 측 `can` 전송(Generator `return()`/`close()`)

## 채널 네임스페이스 요약

- `agent.*`, `bridge.*`, `builtin.*`
- `mcp.*`, `mcp.usage.* (events 포함)`
- `preset.*`
- `chat.*`, `conversation.*`

> 자세한 목록: `docs/apps/gui/rpc/TERMS_FULL.md`

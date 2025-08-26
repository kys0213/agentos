# GUI RPC Migration — Step 4: Renderer channel naming + migration

## Requirements

### 성공 조건

- [ ] 렌더러 RPC 서비스 채널 네이밍을 콜론에서 도트 표기로 전환(컨트롤러와 1:1 매핑: `agent.*`, `preset.*`, `mcp.*`, `conversation.*`).
- [ ] 렌더러 서비스 레이어가 `IpcChannel` 의존을 제거하고 `RpcEndpoint/RpcClient` 기반으로 동작.
- [ ] 이벤트/스트림 구독 경로에서 취소(`can`)와 가드 기반 타입 안전성 유지.
- [ ] 고빈도 스트림(MCP usage 등)에서 샘플링/취소 정책이 보존됨.
- [ ] 변경 후 타입체크/빌드/테스트/린트 무에러 통과.

### 사용 시나리오

- [ ] 채팅/프리셋/MCP UI가 도트 표기의 RPC 채널로 요청/스트림을 수행하고, 에러/취소/이벤트를 정상 처리한다.

### 제약 조건

- [ ] `any`/`as any` 금지. 미정형 입력은 `unknown` + 타입 가드(zod) 사용.
- [ ] 외부 인터페이스/문서와 일치: `apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md` 및 `IPC_TERMS_AND_CHANNELS.md`.

## Interface Sketch

```ts
// Renderer RPC service channel examples (dot-notation)
// Before: 'agent:chat', 'mcp:usage:getHourlyStats'
// After:  'agent.chat', 'mcp.usage.getHourlyStats'

export interface RpcTransport {
  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes>;
  stream?<T = unknown>(channel: string, handler: (data: T) => void): Promise<() => void>;
}

// Example guard usage
import { z } from 'zod';
const SessionMessage = z.object({ sid: z.string(), role: z.string(), content: z.string() });
type SessionMessage = z.infer<typeof SessionMessage>;

rpc.stream<unknown>('agent.session.messages', (raw) => {
  const parsed = SessionMessage.parse(raw); // throws on invalid
  // update UI with parsed
});
```

## Todo

- [ ] 채널 표기 전환(콜론→도트):
  - [ ] `apps/gui/src/renderer/rpc/services/agent.service.ts`
  - [ ] `apps/gui/src/renderer/rpc/services/bridge.service.ts`
  - [ ] `apps/gui/src/renderer/rpc/services/preset.service.ts`
  - [ ] `apps/gui/src/renderer/rpc/services/mcp.service.ts`
  - [x] `apps/gui/src/renderer/rpc/services/conversation.service.ts`
- [ ] 레거시 제거/치환:
  - [ ] `apps/gui/src/renderer/services/ipc-agent.ts` 제거 또는 RPC 대체
  - [ ] `apps/gui/src/renderer/services/fetchers/*`를 RPC 서비스 호출로 교체
- [ ] 훅/컨테이너 이관:
  - [x] Chat 관련 훅 우선 이관(타입 가드 적용)
  - [ ] Preset 관련 훅/컨테이너 이관, ServiceContainer 등록 확인
- [ ] 통합 테스트: 요청/응답 및 스트림(cancel 포함) 경로 점검
- [ ] 문서 업데이트: 표기 전환/마이그레이션 노트(IPC 스펙/용어 문서 반영)
  - [x] IPC_TERMS_AND_CHANNELS.md의 chat.\* 채널 도트/하이픈 표기로 정리

## 작업 순서

1. **채널 표기 전환**: RPC 서비스 파일의 채널을 도트 표기로 일괄 수정(컨트롤러와 매핑 재검증).
2. **호출부 이관**: 훅/컨테이너에서 레거시 호출을 RPC 서비스로 교체(가드 적용).
3. **레거시 제거**: `IpcChannel` 의존 경로/모듈 제거 또는 어댑터 뒤로 캡슐화.
4. **검증/테스트**: 타입/빌드/린트 통과 및 스트림 취소/에러 전파 확인.
5. **문서 반영**: 스펙/가이드/로드맵에 변경 반영 후 PR.

> 참고: 상위 계획서 `apps/gui/plan/RPC_MIGRATION_PLAN.md`의 Step 4 항목을 본 문서로 세분화했습니다.

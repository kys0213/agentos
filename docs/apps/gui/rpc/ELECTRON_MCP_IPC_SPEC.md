# Electron MCP IPC Spec

본 문서는 Electron 기반 렌더러↔메인 프로세스 간 MCP 관련 IPC 사용 규칙을 정리한 SSOT입니다. 생성된 컨트롤러/클라이언트와 스트리밍(Observable) 컨벤션을 기준으로 작성되었습니다.

## 목표

- 생성 컨트롤러/클라이언트 계약을 준수하여 안전한 타입/런타임 보장
- 스트리밍 응답은 Observable을 통해 전달하고, 구독 해제 필수
- 메모리/리소스 누수 방지를 위한 취소/해제 규칙 명문화

## 기본 원칙

- 계약 스키마가 단일 SSOT. 모든 입출력은 `zod.parse`로 경계 검증
- 스트리밍 메서드: `*.streamResponse`가 존재하면 서버 컨트롤러는 `Observable<z.output<...>>` 반환
- 클라이언트는 다음 2가지 인터페이스를 제공
  - `<name>Stream(payload) => Observable<Out>`
  - `<name>On(handler) => CloseFn` (내부적으로 스트림 + 핸들러 래핑)
- 모든 구독은 명시적으로 `unsubscribe()` 또는 `CloseFn()` 호출로 해제

## 사용 예시

### 1) 스트림 직접 구독

```ts
import { mcpClient } from './client';

const sub = mcpClient.usageEventsStream({ toolName: 'foo' }).subscribe({
  next: (event) => {
    // event: z.output<typeof McpUsageUpdateEventSchema>
  },
  error: (err) => {
    console.error('stream error', err);
  },
  complete: () => {
    console.log('stream completed');
  },
});

// 필요 시 해제 (컴포넌트 unmount, 탭 전환 등)
sub.unsubscribe();
```

### 2) 핸들러 등록 (CloseFn)

```ts
const close = mcpClient.usageEventsOn((event) => {
  // 핸들러 기반 단순 구독
});

// 필요 시 해제
close();
```

## Electron IPC 세부 규칙

- 렌더러에서 구독 해제 시, 메인 프로세스에서도 대응하는 구독/리소스를 반드시 해제
- 윈도우/뷰 unmount 시점에 남은 구독이 없도록 정리 (ex. `useEffect` cleanup)
- 백프레셔가 필요한 경우 서버 측에서 버퍼링/완화 전략을 명시 (해당 컨트롤러 문서에 기술)

## Do / Don’t

- Do: 계약 스키마에서 `z.output` 타입을 그대로 사용
- Do: 네트워크/프로세스 경계 직후 `zod.parse` 수행
- Do: 모든 스트림 구독에 대해 명시적 해제 처리
- Don’t: 스트리밍 응답을 Promise로 래핑하거나, 해제 없이 방치
- Don’t: 계약 밖 임의 필드 주입(전달/매핑은 컨트롤러/어댑터 경계에서만)

## 테스트 가이드

- E2E에서 스트림 취소 플로우 검증 (구독 후 즉시/지연 해제 모두)
- 메모리/핸들 누수 여부를 간접적으로 확인(구독 수/채널 수 변화 관찰)

## 참고

- RPC 가이드(SSOT): `docs/apps/gui/rpc/GUIDE.md`
- 스트리밍 서버 컨벤션: `apps/gui/plan/RPC_STREAMING_SERVER_CONVENTION_PLAN.md`

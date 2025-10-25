# GUI RPC & Streaming Guide

Canonical location. Index: `docs/apps/gui/rpc/README.md`

See also: `SPEC.md`, `TERMS.md`, `recipes.md`.
본 문서는 GUI의 계약(contracts) → 코드 생성(codegen) → 어댑터(adapters) → 스트리밍(streaming)까지의 최신/안정 가이드를 통합합니다. 세부 구현 계획과 진행 관리는 `apps/gui/plan/RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`를 참고하세요.

## 1) 계약(Contracts) → 코드 생성(Codegen)

- 계약 소스: `apps/gui/src/shared/rpc/contracts/*.contract.ts`
  - 모든 메서드의 payload/response/streamResponse를 Zod 스키마로 정의
  - `z.record(z.string(), z.unknown())`로 Key/Value 명시(버전 호환성)
- 코드 생성 스크립트: `node scripts/rpc-codegen.js`
  - 생성물
    - Renderer 클라이언트: `apps/gui/src/renderer/rpc/gen/<ns>.client.ts`
      - 타입: 계약 스키마를 직접 참조하여 `z.input`/`z.output` 기반으로 추론
      - 스트림: `<name>Stream()`, `<name>On(handler)` 메서드 자동 생성
      - 메서드 네이밍 규칙: 채널의 `.`은 메서드명에서 `_`로 변환
        - 예: `mcp.usage.getStats` → `usage_getStats()`
        - 스트림: `mcp.usage.events` → `usage_eventsStream()` / `usage_eventsOn()`
    - Main 컨트롤러 스텁: `apps/gui/src/main/<ns>/gen/<ns>.controller.ts`
      - Nest `@EventPattern` + `ZodValidationPipe` 사용, 반환 타입은 `z.output`
    - 채널 상수: `apps/gui/src/shared/rpc/gen/channels.ts`
  - 덮어쓰기 정책: 생성물 상단 헤더 없으면 `.gen.new.ts`로 안전 생성

## 2) 생성 클라이언트 사용 규칙

- 단발 RPC
  - 예: `client.create(payload: z.input<typeof C.methods['create']['payload']> ): Promise<z.output<typeof ...>>`
- 스트림 RPC (streamResponse 지정)
  - AsyncGenerator: `client.<name>Stream(payload?) => AsyncGenerator<z.output<...>>`
  - 구독형: `client.<name>On(handler: (ev) => void): CloseFn`
  - 취소/해제: `await close()` 또는 generator.return() 호출 필수

예시(타입 안전 호출 + 취소):

```ts
import { McpClient } from '@/renderer/rpc/gen/mcp.client';
import { McpContract as C } from '@/shared/rpc/contracts/mcp.contract';

const mcp = new McpClient(transport);

// 단발: z.input / z.output 기반 타입 추론
const tool = await mcp.getTool({ name: 'web.search' });
//    ^? z.output<typeof C.methods['getTool']['response']>

// 스트림: AsyncGenerator 사용
const it = mcp.usage_eventsStream();
try {
  for await (const ev of it) {
    // ev: z.output<typeof C.methods['usage.events']['streamResponse']>
    render(ev);
    if (shouldStop()) break; // for-await 탈출 시 아래 finally에서 취소
  }
} finally {
  await it.return?.(); // can 프레임 전송 → 서버 구독 해제
}

// 스트림: 구독형(On)
const close = mcp.usage_eventsOn((ev) => render(ev));
// ...
await close(); // can 프레임 전송 → 서버 구독 해제
```

## 3) 어댑터(Adapters) 패턴

- 역할: 생성 클라이언트(채널/타입 안전)를 앱의 도메인 서비스 인터페이스에 매핑
- 경계 검증: 필요 시 Zod `safeParse`로 런타임 검증 → 성공 시 파싱된 데이터 사용
- 점진적 엄격화: any/cast를 제거하고 계약 스키마 기반으로 정렬(Phase 2 참조)

## 4) Nest 컨트롤러 가이드

- 컨트롤러 스텁은 `@EventPattern('<ns>.<method>')`와 `ZodValidationPipe` 적용
- payload/response 타입은 `z.input`/`z.output` 기반으로 주석/반환 일치
- 실제 비즈니스 로직 연결은 도메인 모듈에서 주입하여 구현(승격 시)

## 5) 트랜스포트/취소 규칙

- 프레임 규격: `req/res/err/nxt/end/can`
- 스트림 취소: 소비자가 `can` 프레임 전송(클라이언트 측 `close()`/`return()`)
- 전송 인터페이스: `RpcClient.request/stream/on`

## 6) 테스트/검증

- 타입 체크: `pnpm -w typecheck` / GUI 범위: `pnpm -C apps/gui typecheck`
- 빌드: `pnpm -C apps/gui build`
- 스냅샷/통합: 스트림 취소/타임아웃, CoreError 전파 보강 권장

## 7) 마이그레이션 체크리스트

- [x] 계약 스키마 정비(레코드 키 명시, 스키마 누락 제거)
- [x] 코드젠 반영: z.input/z.output, 스트림 메서드 생성
- [x] McpUsage 스트림: transport.on → generated On/Stream 전환
- [ ] 어댑터 any 제거/경계 parse(Agent → Conversation → Preset → Bridge)
- [ ] 컨트롤러 승격/모듈 연결(도메인 단위)
- [ ] 문서/예제 보강(취소/해제, 에러 흐름, 성능 팁)

## 8) 참고

- IPC/프레임 상세: `docs/apps/gui/rpc/ELECTRON_MCP_IPC_SPEC.md`
- 통합 계획(진행 관리): `apps/gui/plan/RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`
- 생성 클라이언트 예시: `apps/gui/src/renderer/rpc/gen/*.client.ts`

# RPC 서버 스트리밍 컨벤션 계획서

본 문서는 GUI RPC의 서버→렌더러 스트리밍 규칙을 명문화하고, 계약/코드젠/문서/테스트를 정렬하여 인지부조화를 줄이는 것을 목표로 합니다.

## Requirements

### 성공 조건

- [ ] streamResponse가 있는 모든 메서드는 서버에서 동기 메서드로 `Observable<z.output<...>>`를 반환한다는 규칙을 명문화한다.
- [ ] 계약의 streamResponse는 “스트림 요소 타입”만을 나타내며, 서버는 Observable 자체를 반환하고 트랜스포트가 구독한다.
- [ ] `mcp.usage.events`의 streamResponse를 `z.unknown()`에서 구체 스키마로 강화(McpUsageUpdateEventSchema)하여 타입 일관성을 높인다.
- [ ] 코드젠이 서버 컨트롤러 스텁을 항상 동일 패턴(동기 + Observable 반환)으로 생성하도록 업데이트된다.
- [ ] GUIDE/SPEC/PR 템플릿에 해당 규칙을 반영하여 새 구현에서도 일관되게 적용된다.

### 사용 시나리오

- [ ] 신규 스트리밍 엔드포인트 추가 시, 계약에 `streamResponse` 스키마만 정의하면 코드젠이 컨트롤러 스텁을 `Observable<z.output<...>>`로 생성한다.
- [ ] 렌더러는 생성 클라이언트의 `xxxOn(handler)` 또는 `xxxStream()`을 사용하고, 구독 해제 시 리소스가 정상 정리된다.
- [ ] 팀원이 내부 트랜스포트를 몰라도 “streamResponse ⇒ 서버는 Observable 반환” 규칙만 기억하면 구현이 가능하다.

### 제약 조건

- [ ] 트랜스포트 레벨(Observable 전달/구독) 변경은 하지 않는다. 서버는 소스를 반환하고 트랜스포트가 구독한다.
- [ ] 기존 동작 호환을 유지한다(브레이킹 변경 없음). 계약 스키마 강화는 가능한 범위에서만 진행한다.

## Interface Sketch

```ts
// 계약 (예시: MCP Usage Events)
export const McpUsageUpdateEventSchema = z.object({
  type: z.literal('mcp.usage.update'),
  payload: z.object({ /* ... */ }).passthrough(),
  ts: z.number().optional(),
});

export const McpContract = defineContract({
  namespace: 'mcp',
  methods: {
    'usage.events': {
      channel: 'mcp.usage.events',
      streamResponse: McpUsageUpdateEventSchema, // 요소 타입
    },
  },
});

// 서버 컨트롤러 (생성 스텁 공통 패턴)
@EventPattern('mcp.usage.events')
usage_events(): Observable<z.output<(typeof C.methods)['usage.events']['streamResponse']>> {
  return this.outbound
    .ofType('mcp.usage.')
    .pipe(map((ev) => ev as z.output<(typeof C.methods)['usage.events']['streamResponse']>));
}

// 클라이언트 (생성)
usage_eventsOn(
  handler: (ev: z.output<(typeof C.methods)['usage.events']['streamResponse']>) => void
): CloseFn;

usage_eventsStream(): AsyncGenerator<
  z.output<(typeof C.methods)['usage.events']['streamResponse']>, void, unknown
>;

// OutboundChannel: 서버에서 발행하는 hot observable 소스
ofType(prefix: string): Observable<unknown>;
```

보강 옵션
- 다중 구독 비용 또는 초기 이벤트 재전송 요구가 있으면 `share()`/`shareReplay(1)` 적용 검토
- 구독 종료 시 리소스 정리를 위한 `finalize()`/레퍼런스 카운팅 옵션 검토

## Todo

- [ ] 계약 강화: `apps/gui/src/shared/rpc/contracts/mcp.contract.ts`에서 `usage.events.streamResponse`를 `McpUsageUpdateEventSchema`로 교체
- [ ] 코드젠: `apps/gui/scripts/rpc-codegen.mjs`에 서버 컨트롤러 스텁 생성 규칙 반영(동기 + Observable 반환)
- [ ] 컨트롤러: 기존 구현들이 규칙과 일치하는지 점검(현재 `mcp.controller.gen.new.ts`는 일치)
- [ ] 클라이언트: 생성 클라이언트 시그니처가 강화된 요소 타입을 반영하는지 확인
- [ ] 문서: `apps/gui/docs/rpc/GUIDE.md`와 `apps/gui/docs/rpc/SPEC.md`에 “서버 스트리밍 컨벤션” 섹션 추가
- [ ] PR 템플릿: “스트리밍 메서드 서버 시그니처 점검(동기 + Observable 반환)” 체크 항목 추가
- [ ] 테스트: 컨트롤러/트랜스포트 레벨에서 `subscribe` 가능성 및 구독 해제 동작 어서션 추가

## 작업 순서

1. 계약 강화
   - `usage.events.streamResponse`를 `McpUsageUpdateEventSchema`로 변경
   - 영향 범위 확인(빌드/타입체크)
2. 코드젠 규칙 반영
   - streamResponse 존재 시 서버 스텁을 동기 + Observable 반환으로 생성
   - 샘플로 MCP 엔드포인트 재생성/검증
3. 문서 업데이트
   - GUIDE/SPEC에 서버 스트리밍 컨벤션 추가
   - PR 템플릿 체크 항목 추가 제안(PR 분리 가능)
4. 테스트 보강
   - 컨트롤러 단위 테스트: `typeof result.subscribe === 'function'` 어서션
   - 필요 시 트랜스포트 통합 테스트도 보강

## 비고

- 본 계획은 동작을 바꾸지 않고 “규칙/타입/문서/코드젠”을 일관화하여 학습 비용과 혼선을 줄이는 데 초점을 둡니다.
- MCP 외 다른 스트리밍 엔드포인트에도 동일 규칙을 재사용합니다.


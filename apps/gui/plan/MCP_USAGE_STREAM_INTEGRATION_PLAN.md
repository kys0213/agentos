# MCP Usage Stream Integration Plan

## Requirements

### 성공 조건

- [x] MCP Tools Manager가 `useMcpUsageStream`을 통해 수신한 `usage-logged`, `metadata-updated`, `connection-changed` 이벤트를 즉시 반영한다.
- [x] 최근 사용 로그 패널이 새로운 이벤트 발생 시 최대 100건 범위에서 자동 갱신되고, 수동 새로고침 없이 최신 상태를 유지한다.
- [x] 도구 카드(상태 뱃지, 사용량, 마지막 사용 시각)가 이벤트 기반으로 업데이트되며, 기존 로딩/빈 상태 처리와 충돌하지 않는다.
- [x] Vitest 기반 단위테스트로 스트림 이벤트 처리 로직(로그 추가, 도구 상태 갱신)을 검증한다.

### 사용 시나리오

- [x] 사용자가 MCP Tools Manager를 열어두고 있을 때 새로운 도구 호출이 발생하면 `Recent Activity` 및 `Usage Logs` 탭이 자동으로 최신 항목을 표시한다.
- [x] 연결 상태가 변경되거나 사용량 메타데이터가 업데이트되면 도구 상태 카드와 카운터가 즉시 변경된다.
- [x] MCP 서비스/스트림이 사용 불가한 환경에서도 기존 fallback 동작(경고 로그 및 빈 UI)이 유지된다.

### 제약 조건

- [x] 기존 ServiceContainer 기반 의존 주입 구조를 유지하고, hook/service API 시그니처를 변경하지 않는다.
- [x] GUI 상태는 React state로 관리하며 Redux/Zustand 등의 전역 상태를 추가 도입하지 않는다.
- [x] 이벤트 핸들링은 타입 안전하게 구현하여 `McpUsageUpdateEvent` 스키마와 불일치가 없도록 한다.
- [x] Tests는 renderer Vitest 워크스페이스에서 실행 가능해야 한다.

## Interface Sketch

```ts
// apps/gui/src/renderer/components/mcp/McpToolManager.tsx (발췌)
const MAX_USAGE_LOGS = 100;
const { lastEvent } = useMcpUsageStream();

useEffect(() => {
  if (!lastEvent) {
    return;
  }
  setUsageLogs((prev) => {
    if (lastEvent.type !== 'usage-logged') {
      return prev;
    }
    const entry: GuiMcpUsageLog = mapUsageEvent(lastEvent.newLog);
    return [entry, ...prev].slice(0, MAX_USAGE_LOGS);
  });

  setTools((prev) => prev.map((tool) => {
    if (!matchesTool(tool, lastEvent)) {
      return tool;
    }
    return updateToolFromEvent(tool, lastEvent);
  }));
}, [lastEvent]);

// 테스트 아이디어
it('prepends usage log when usage event arrives', async () => {
  const { result } = renderHook(() => useMcpToolsManagerTestHarness());
  act(() => emitUsageEvent({...}));
  expect(result.current.usageLogs[0].id).toBe('new-id');
});
```

## Todo

- [x] MCP Tools Manager에 스트림 이벤트 처리 로직(useEffect, helper) 추가
- [x] 최근 사용 로그 및 도구 상태 갱신 helper 함수 구현 및 상태 슬라이싱 안정화
- [x] 새로고침 처리 시 usage 로그 재조회 및 이벤트 중복 방지 전략 수립
- [x] `useMcpUsageStream` 테스트를 실제 이벤트 스키마에 맞게 수정
- [x] MCP Tools Manager 스트림 반응 단위 테스트 추가
- [x] 타입체크/테스트 실행 및 계획서 업데이트

## 작업 순서

1. **인프라 반영**: `useMcpUsageStream` hook/서비스의 이벤트 스키마 확인 후 테스트 업데이트 (완료 조건: hook 테스트 통과).
2. **UI 상태 연동**: MCP Tools Manager에 이벤트 처리(useEffect, helper) 추가, 초기 로딩 및 refresh 로직 조정 (완료 조건: 수동 테스트 시 실시간 갱신 확인).
3. **단위 테스트 작성**: 이벤트 기반 상태 변화를 검증하는 컴포넌트/헬퍼 테스트 추가 (완료 조건: Vitest renderer 워크스페이스 성공).
4. **검증 및 문서화**: lint/typecheck/test 실행, Phase2 계획서 TODO 갱신 (완료 조건: 명시된 TODO 체크).

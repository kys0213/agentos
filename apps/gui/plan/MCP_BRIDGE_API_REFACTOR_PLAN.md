# Plan: Refactor MCP and Bridge Main APIs (Interface-first)

## Requirements

### 성공 조건

- [ ] `apps/gui/src/main/mcp/*`와 `apps/gui/src/main/bridge/*` 컨트롤러가 일관된 계약(네임스페이스·DTO·응답형식)을 따른다.
- [ ] 변경은 인터페이스 우선(Interface-first) 원칙을 준수하며, 구현 세부는 문서/테스트에서 비규범(non‑normative)으로 다룬다.
- [ ] 가변 작업(등록/해지/스위치/실행)은 공통 응답 래퍼(`{ success, result? | error }`)를 사용한다.
- [ ] 코어 서비스/레지스트리와의 경계에서 타입 안전성을 보장한다(`any` 금지, DTO 검증).
- [ ] 기존 호출부(렌더러 서비스, 테스트)와의 호환을 유지하거나, 필요한 경우 최소 변경으로 마이그레이션 가이드를 제공한다.

### 사용 시나리오

- [ ] Renderer가 RPC로 `bridge.*`/`mcp.*` 메서드를 호출할 때, DTO 검증이 적용되고 예측 가능한 응답 스키마를 수신한다.
- [ ] MCP 도구 실행은 `McpService` 경유(usage 기록 포함)로 수행되어 사용량 저장소가 갱신된다.
- [ ] Bridge 등록/해지는 매니페스트/설정 DTO로 입력을 받고, 등록 ID/상태를 일관 포맷으로 반환한다.

### 제약 조건

- [ ] 네임스페이스는 IPC 용어집(`apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`)을 존중: `mcp.*`, `bridge.*` 유지.
- [ ] 이벤트/구독 스트림은 본 계획에서 범위를 축소하고, 필요 시 후속 계획으로 분리한다.
- [ ] Renderer API 이름은 현행을 유지하되, 필수 스킴 변경이 필요한 경우 마이그레이션 섹션을 추가한다.

## Interface Sketch

```ts
// Common response wrapper for mutating ops
export type Ok<T> = { success: true; result: T };
export type Err = { success: false; error: string };
export type Resp<T> = Ok<T> | Err;

// Bridge
export interface RegisterBridgeDto {
  manifest: LlmManifest;
  config: Record<string, unknown>;
  id?: string;
}
export type RegisterBridgeResp = Resp<{ id: string }>;
export type UnregisterBridgeResp = Resp<{ success: true }>;
export type SwitchBridgeResp = Resp<{ success: true }>;

// MCP
export interface GetToolDto { name: string } // fully qualified: <mcp>.<tool>
export interface InvokeToolDto {
  name: string;
  input?: Record<string, unknown>;
  resumptionToken?: string;
}
export type InvokeToolResp = Resp<InvokeToolResult>; // from core

// Usage (already wired via McpUsageService)
export interface ListUsageDto {
  query?: {
    toolId?: string; toolName?: string; agentId?: string; sessionId?: string;
    status?: 'success' | 'error'; from?: string; to?: string;
  };
  pg?: { cursor?: string; limit?: number; direction?: 'forward'|'backward' };
}
export type ListUsageResp = CursorPaginationResult<McpUsageLog>;
export type UsageStatsResp = McpUsageStats;
```

## Todo

- [ ] DTO 정리: `bridge.controller` 입력/출력 DTO 도입(등록/해지/스위치/조회)
- [ ] DTO 정리: `mcp.controller` 입력/출력 DTO 도입(getTool/invokeTool)
- [ ] 응답 포맷 통일: 가변 작업은 `{ success, result? | error }` 래퍼 사용
- [ ] 서비스 경유 리팩터: `mcp.controller`가 `McpService`를 통해 실행(usage 기록 경유)
- [ ] 단위 테스트: `bridge.controller` happy/error 케이스, `mcp.controller` invoke happy/error
- [ ] 렌더러 영향 점검: 서비스 호출부 타입 정합성 확인(필요시 미세 조정)
- [ ] 문서/IPC 용어집 점검: 인터페이스 변경분 ToC/앵커만 갱신(스펙은 유지)

## 작업 순서

1) DTO/응답 래퍼 도입(bridge/mcp) — 완료 조건: 컴파일 성공, 컨트롤러 시그니처 통일
2) McpService 경유 실행(usage 기록 보장) — 완료 조건: invoke 시 repo에 usage append 확인(수동)
3) 단위 테스트 추가(bridge/mcp) — 완료 조건: happy/error 케이스 통과
4) 렌더러 영향 체크 — 완료 조건: typecheck 통과, 기존 호출부 컴파일 유지
5) 문서/용어집 링크 점검 — 완료 조건: 불일치 링크/앵커 수정(내용은 Interface-first 유지)

## 참고 (현행 분석 요약)

- Bridge
  - EventPattern: `bridge.list|get-current|get-config|register|unregister|switch`
  - 레지스트리 주입: `LlmBridgeRegistry` (토큰 주입)
  - 개선점: DTO/Resp 래퍼 부재 → 일관 인터페이스로 보강

- MCP
  - EventPattern: `mcp.getTool|mcp.invokeTool`
  - 현재 `McpRegistry` 직접 사용 → `McpService` 경유로 전환(usage 기록 일원화)
  - 입력 DTO 명확화 필요: name/input/resumptionToken

- Usage
  - `mcp.usage.getLogs|getStats`는 코어 `McpUsageService`로 연동됨(별도 변경 없음)


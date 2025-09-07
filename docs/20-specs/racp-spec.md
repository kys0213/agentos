# RACP (Remote Agent Command Protocol) Spec (Directional Draft)

> 상태: 아이디어/방향성 초안입니다. 실제 페이로드/엔드포인트/시맨틱은 변경될 수 있습니다. 아래 예시는 합의 전까지 비규범입니다.

원격에서 에이전트 실행을 제어하기 위한 최소 프로토콜을 제안합니다. 목표는 “명령/승인/상태/감사”를 표준화하여 운영 자동화와 감사 가능성을 확보하는 것입니다.

## 리소스 개요

- Command: 실행 요청(Execute/Pause/Cancel)
- Approval: 권한/승인(ACL/멀티사인)
- Status: Heartbeat/Progress/Result 스트림
- Audit: 불변 로그(누가/언제/무엇을/결과)

## 공통 필드(예시)

```json
{
  "id": "cmd_01HXXX...",
  "created_at": "2025-09-06T10:00:00Z",
  "idempotency_key": "c6b2a...",  
  "tenant_id": "org_abc",
  "actor": { "type": "user|agent", "id": "u_123" }
}
```

## Command(예시)

```json
{
  "type": "execute|pause|cancel",
  "target": { "agent_id": "a_123", "session_id": "s_456" },
  "priority": 0,
  "timeout_ms": 60000,
  "payload": {
    "messages": [ /* llm-bridge-spec UserMessage[] */ ],
    "tools": [ /* optional tool call allowances */ ]
  }
}
```

제약: 동일 `idempotency_key` 재접수 시 서버는 동일 응답(멱등) 또는 409(IdempotencyKeyInUse)를 반환.

## Approval(예시)

```json
{
  "command_id": "cmd_...",
  "required": 1,
  "grants": [ { "by": "u_777", "at": "2025-09-06T10:01:00Z", "method": "acl|signature" } ]
}
```

승인이 필요한 명령은 `required > grants.length` 동안 `pending_approval` 상태로 유지.

## Status Events(예시)

```json
{ "event": "heartbeat", "command_id": "cmd_...", "agent_id": "a_123", "at": "..." }
{ "event": "progress", "command_id": "cmd_...", "stage": "retrieval|tool|chat", "percent": 42 }
{ "event": "result", "command_id": "cmd_...", "ok": true, "output": { /* chat result */ } }
{ "event": "error", "command_id": "cmd_...", "code": "Timeout", "message": "..." }
```

전달 방식: SSE/WS/Queue 중 하나 선택. 최소 보장은 폴링 `GET /commands/:id/status?since=<cursor>`.

## Audit Log(예시)

```json
{
  "id": "aud_...",
  "command_id": "cmd_...",
  "at": "2025-09-06T10:01:02Z",
  "who": { "id": "u_777", "role": "approver" },
  "action": "approve|reject|enqueue|start|complete|error",
  "meta": { "ip": "...", "user_agent": "..." }
}
```

저장은 append-only. 불변성 보장을 위해 해시 체인(선택) 또는 WORM 스토리지 권장.

## 오류 코드 아이디어(예시)

- Unauthorized, Forbidden, ApprovalRequired
- InvalidPayload, UnsupportedCapability
- RateLimited, QuotaExceeded
- Timeout, Canceled, Conflict(IdempotencyKeyInUse)
- InternalError, UpstreamError

## 시퀀스 아이디어(예시)

```
Client -> ControlPlane : POST /commands {execute}
ControlPlane -> Approver(s) : approval request (async)
Approver -> ControlPlane : approve
ControlPlane -> Agent : enqueue/dispatch
Agent -> ControlPlane : heartbeat/progress/result
ControlPlane -> Client : stream status or GET /commands/:id/status
```

## 보안/신뢰성(가이드 제안)

- 모든 엔드포인트는 OIDC/JWT/API Key 중 택일 인증 + 테넌트 스코프
- 멱등키 필수(최소 execute에 대해), 재시도 안전
- 감사 로그 필수, 민감 메타는 최소 수집

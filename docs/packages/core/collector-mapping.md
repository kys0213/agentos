# Collector Mapping (Directional Draft)

> 상태: 방향성 초안. 실제 필드/형식은 구현 과정에서 단순화/변경될 수 있습니다.

## 목적

packages/core의 이벤트/세션/사용량 정보를 배치 수집 레코드(JSONL)로 매핑하는 경계 DTO 아이디어를 제시합니다.

## 매핑 스케치

| Core 타입/이벤트          | 수집 도메인        | 주요 필드(아이디어)                                   |
| ------------------------- | ------------------ | ----------------------------------------------------- |
| MessageHistory (chat)     | interactions/\*.jl | session_id, agent_id, route, model, ts, role, summary |
| LlmUsage (tokens/latency) | usage/\*.jl        | ts, agent_id, model, route, tokens_in/out, latency_ms |
| Tool call (MCP)           | tools/\*.jl        | ts, agent_id, tool, ok, error_code                    |
| Session status change     | events/\*.jl       | ts, agent_id, session_id, state, detail               |
| Domain errors             | errors/\*.jl       | ts, code, message, domain, agent_id, session_id       |

## idempotency_key 아이디어

- 레코드 정규화 → 안정적 직렬화 → 해시(SHA-256) → 배치 단위로 reduce/정렬 후 키 생성
- 동일 배치/레코드에 대해 중복 업로드 방지

## 경계 어댑터(의사코드)

```ts
function mapMessageHistory(h: MessageHistory): InteractionRecord {
  return {
    session_id: h.sessionId,
    agent_id: h.agentId,
    route: h.route,
    model: h.model,
    ts: isoNow(),
    role: h.role,
    summary: summarize(h.content), // 본문은 기본 비수집(meta_only)
  };
}
```

## Open Questions

- 메시지 본문 요약/익명화 수준은 어느 정도까지? (길이/토큰 한도)
- 도구 결과의 민감 데이터 처리(허용목록 vs 완전 비수집) 기준은?
- 오류 도메인 코드 표준화(코어 vs 수집 서버) 매핑표 필요성?

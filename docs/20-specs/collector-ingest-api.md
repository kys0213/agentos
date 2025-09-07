# Collector Ingest API (Directional Draft)

> 상태: 방향성 초안. 실제 엔드포인트/페이로드/오류 코드는 구현 과정에서 단순화/변경될 수 있습니다.

## 목표

- 배치 수집기(로컬/사이드카)가 주기적으로 안전하게 데이터를 업로드
- 멱등/재시도/백오프를 지원하여 네트워크/서버 장애에도 안전
- 프라이버시(allowlist/redaction)와 보안(TLS/인증)을 전제

## 최소 엔드포인트 아이디어

- POST `/v1/collect`
  - 헤더: `Authorization: Bearer <token>` 또는 `X-API-Key: <key>`
  - 헤더: `Idempotency-Key: <hash(batch)>`
  - 본문(아이디어):
    ```json
    {
      "batch_id": "2025-09-06-001",
      "journal": {
        "interactions": [ /* 요약 메시지(메타/익명화) */ ],
        "usage": [ /* tokens/latency/cost */ ],
        "errors": [ /* code/message/domain */ ],
        "tools": [ /* tool call meta */ ],
        "events": [ /* 상태 이벤트(옵션) */ ]
      },
      "cursor": { "events_after": "evt_123" },
      "meta": { "source": "gui|cli|slackbot", "client": "agentos-collector/0.1" }
    }
    ```
  - 응답(아이디어):
    ```json
    { "ack_id": "ACK-2025-09-06-001", "accepted": 1234, "rejected": 0 }
    ```

## 멱등/재시도

- 동일 `Idempotency-Key`로 재전송 시 서버는 이전 결과를 재사용(멱등) 또는 `409 Conflict`
- 5xx/네트워크 오류 시 지수 백오프 + 지터 재시도, 4xx는 보류/격리

## 보안/프라이버시

- TLS 필수, 토큰/키는 최소 권한 스코프
- 수집 전 로컬에서 allowlist/redaction 적용(본문은 meta_only/anonymized 기본)

## Open Questions

- 개별 도메인(usage/errors 등) 전용 엔드포인트로 나눌지? 단일 엔드포인트 유지?
- batch 크기/청크 업로드 기준은? (5MB/10MB 등)
- 서버 측 보관 수명/압축/색인 전략은?

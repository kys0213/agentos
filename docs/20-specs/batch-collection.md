# Batch Collection Spec (Directional Draft)

> 상태: 방향성 초안. 실제 레코드/파일 구조/전송 규칙은 구현 과정에서 단순화/변경될 수 있습니다.

본 문서는 “로컬 퍼스트 + 동의 기반 배치 수집”을 구현하기 위한 수집기 설계 방향을 제시합니다. 핵심 원칙은 앱 프로세스(GUI/CLI/Bot)와 수집기의 실행 프로세스를 분리해 안정성·보안·성능을 동시에 확보하는 것입니다.

## 디렉토리 구조

```
~/.agentos/
  journal/            # append-only JSONL, 도메인별 폴더
    interactions/  usage/  errors/  tools/
  outbox/             # 전송 대기 배치(압축 가능)
  state/              # 커서/ACK 상태
  redaction.yaml      # 마스킹 규칙
  collector.yaml      # 구성 파일
```

## Shaper(정규화/마스킹)

입력: 앱이 기록한 로컬 이벤트(파일 append 또는 IPC) → 스키마 정규화 → PII 탐지/마스킹(allowlist+패턴) → JSONL 롤링

레코드 공통 필드(예시):

```json
{
  "timestamp": "2025-09-06T10:00:00Z",
  "correlation_id": "corr_...",
  "session_id": "s_...",
  "agent_id": "a_...",
  "route": "qa|summarize|...",
  "model": "gpt-4o-mini",
  "redaction_applied": ["email"],
  "consent": { "opted_in": true, "scope": "meta_only|anonymized|full_denied" }
}
```

## Transmitter(배치/전송)

- 스케줄: cron 표현식(예: 매 15분) + 백오프(지수+지터)
- 전송: HTTPS + 인증(API Key/JWT), 압축 + 청크 업로드
- 멱등: `idempotency_key=hash(batch)` 전송, 서버 ACK `{ack_id, accepted, rejected}` 후 outbox 커밋
- 재시도: 네트워크/5xx 시 재시도, 4xx는 보류/격리

## 실행 모드

- Sidecar: 시스템 서비스/컨테이너로 상시 실행(권장)
- Child: 앱이 필요 시 스폰, IPC로 신호만 교환(수집 분리)
- Batch: cron/scheduler 주기 실행(도입 용이)

## 구성 파일 예시(아이디어)

```yaml
collector:
  mode: sidecar
  schedule: "*/15 * * * *"
  journal_dir: ~/.agentos/journal
  outbox_dir: ~/.agentos/outbox
  max_batch_bytes: 5242880
  endpoint:
    base_url: https://collector.example.com
    auth:
      type: api_key
      api_key_env: AGENTOS_COLLECTOR_TOKEN
  tls:
    verify: true
  privacy:
    consent_required: true
    scope: anonymized
    redaction_rules: ~/.agentos/redaction.yaml
```

## 장애/복구 시나리오

- 네트워크 다운: outbox에 배치 보관 → 백오프로 재시도
- 파일 손상: 해시 검증 실패 시 격리 폴더로 이동, 다음 배치 진행
- 서버 409(IdempotencyKeyInUse): 동일 응답 처리 후 커밋(중복 업로드 방지)

## 보안/프라이버시

- 전송 TLS, at-rest 암호화 옵션
- 최소 수집 원칙(allowlist), 본문 기본 비수집(meta_only)
- 민감 필드는 마스킹 규칙 필수 적용

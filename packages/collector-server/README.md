# @agentos/collector-server

AgentOS 중앙 수집 서버의 NestJS 구현체입니다. `/v1/collect` 엔드포인트로 전달되는 배치 데이터를 검증하고, SQLite 데이터베이스에 영속화한 뒤 멱등 ACK를 반환합니다.

## 특징

- NestJS + MikroORM 기반 HTTP 서버
- `COLLECTOR_API_KEY` Guard를 통한 단일 테넌트 인증
- `Idempotency-Key` 헤더로 멱등성을 보장하며 ACK 재사용
- MikroORM + SQLite 데이터베이스에 배치 메타데이터 저장, 본문은 저널 스토리지 모듈에 보존
- NestJS 모듈 설정으로 파일 시스템 외 다른 저널 스토리지(예: S3)로 교체 가능
- `/health` 엔드포인트로 상태 확인 가능

## 환경 변수

| 이름                      | 필수 | 설명                                                             | 기본값                      |
| ------------------------- | ---- | ---------------------------------------------------------------- | --------------------------- |
| `COLLECTOR_API_KEY`       | ✅   | 업로드 요청에 필요한 API 키                                      | 없음                        |
| `COLLECTOR_PORT`          | ❌   | 서버가 바인딩할 포트                                             | `3333`                     |
| `COLLECTOR_DB_PATH`       | ❌   | SQLite 데이터베이스 파일 경로                                    | `collector-server.sqlite`   |
| `COLLECTOR_JOURNAL_DRIVER`| ❌   | 저널 스토리지 드라이버(`filesystem`만 지원, 모듈 교체 여지를 고려) | `filesystem`               |
| `COLLECTOR_JOURNAL_DIR`   | ❌   | 파일 시스템 드라이버 사용 시 JSON 파일이 저장될 디렉터리          | `collector-journals`       |

## 사용 방법

```bash
pnpm --filter @agentos/collector-server build
COLLECTOR_API_KEY=secret pnpm --filter @agentos/collector-server start
```

로컬 실행 시 테스트 업로드 예시는 다음과 같습니다.

```bash
curl -X POST http://localhost:3333/v1/collect \
  -H "x-api-key: secret" \
  -H "Idempotency-Key: batch-001" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "batch-001",
    "journal": {
      "interactions": [{ "message": "hello", "role": "user" }]
    }
  }'
```

## 테스트

```bash
pnpm --filter @agentos/collector-server test
```

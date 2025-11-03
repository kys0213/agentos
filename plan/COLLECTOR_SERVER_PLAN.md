# 작업계획서: Collector 서버 MVP

## Requirements

### 성공 조건

- [x] `/v1/collect` 엔드포인트가 JSON 본문을 검증하고 202 응답과 ACK 페이로드를 반환한다.
- [x] `Idempotency-Key` 헤더를 사용하여 동일 배치가 중복 수신되어도 동일 결과를 반환한다.
- [x] 요청 본문 원본은 파일 스토리지에 JSON으로 기록하고, 데이터베이스에는 경로만 저장하며 실패 시 적절한 오류를 반환한다.
- [x] 환경 변수 기반 API 키 인증(단일 키)으로 비인가 요청을 차단한다.

### 사용 시나리오

- [x] 로컬 수집기가 API 키와 멱등 키를 포함한 요청을 전송하면 서버가 유효성 검사를 통과한 데이터를 저장하고 ACK를 돌려준다.
- [x] 동일한 배치를 재전송할 경우 서버는 기존 ACK를 반환하고 추가 저장을 생략한다.
- [x] 인증 키가 누락되거나 잘못된 경우 서버가 401 응답을 반환한다.

### 제약 조건

- [x] 초기 버전은 단일 테넌트이며, 스토리지는 NestJS + SQLite 기반으로 제한한다.
- [x] 외부 의존성은 Node.js 20 환경과 PNPM 모노레포 구조에 부합해야 한다.
- [x] 프라이버시 로직은 최소화하고 입력 검증과 저장 로직에 집중한다.

## Interface Sketch

```typescript
interface CollectorRecord {
  batch_id: string;
  journal: {
    interactions?: unknown[];
    usage?: unknown[];
    errors?: unknown[];
    tools?: unknown[];
    events?: unknown[];
  };
  cursor?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  received_at: string; // ISO timestamp
  idempotencyKey: string;
}

interface CollectRequestBody {
  batch_id: string;
  journal: Record<string, unknown>;
  cursor?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface CollectorStore {
  append(record: CollectorRecord): Promise<void>;
  hasIdempotencyKey(key: string): Promise<boolean>;
  rememberAck(key: string, ack: CollectAck): Promise<void>;
  getAck(key: string): Promise<CollectAck | undefined>;
}

interface CollectAck {
  ack_id: string;
  accepted: number;
  rejected: number;
}
```

## Todo

- [x] Node 서버 패키지 구조 생성(`packages/collector-server`)
- [x] NestJS 기반 HTTP 서버와 요청 스키마 검증 구현
- [x] MikroORM + SQLite 저장소(원본 JSON 문자열 + 멱등 메타) 구현
- [x] API 키 인증 및 멱등 키 캐시 로직 구현
- [x] 단위 테스트 작성 (인증/유효성/멱등)
- [x] 통합 테스트 작성 (실제 파일 기록 확인)
- [x] 개발/운영 안내 문서 작성(`docs/` 또는 패키지 README)

## 작업 순서

1. **기초 설정**: 새 패키지 생성, 의존성 추가, 서버 부트스트랩 (완료 조건: pnpm build 성공)
2. **핵심 기능**: NestJS 라우트, 검증, 저장소, 멱등/인증 로직 구현 (완료 조건: 수동 요청 시 ACK 반환)
3. **테스트 및 문서**: 단위/통합 테스트, README 정리 (완료 조건: 테스트 통과 및 문서 초안)

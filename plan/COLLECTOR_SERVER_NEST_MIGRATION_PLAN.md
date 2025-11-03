# 작업계획서: Collector 서버 NestJS & DB 마이그레이션

## Requirements

### 성공 조건

- [x] NestJS 기반 HTTP 서버가 `/v1/collect` 엔드포인트를 제공하고 Class Validator로 본문을 검증한다.
- [x] `Idempotency-Key` 헤더로 멱등성을 보장하며, 중복 요청 시 동일 ACK와 200 응답을 반환한다.
- [x] MikroORM + SQLite 데이터베이스에 배치와 ACK 정보를 영구 저장한다.
- [x] API 키 인증을 Nest Guard로 구현하여 올바른 키가 아닌 경우 401을 반환한다.
- [x] `/health` 엔드포인트가 서버 상태를 확인할 수 있다.

### 사용 시나리오

- [x] 데이터 수집기가 API 키와 멱등 키를 포함한 JSON 배치를 전송하면 서버가 유효성 검증 후 DB에 저장하고 ACK를 202로 반환한다.
- [x] 동일한 멱등 키로 재전송 시 서버는 DB에서 ACK를 조회해 200과 함께 반환한다.
- [x] 잘못된 API 키나 스키마 오류가 있는 경우 각각 401, 400 응답으로 거부된다.

### 제약 조건

- [x] NestJS(HTTP) + MikroORM + SQLite 조합을 사용하며, 환경 변수로 DB 파일 경로와 API 키를 설정한다.
- [x] 테스트는 파일 시스템 의존성을 최소화하기 위해 in-memory SQLite로 수행한다.
- [x] 기존 패키지 구조(pnpm workspace)와 TypeScript 설정을 유지한다.

## Interface Sketch

```typescript
// dto/collect-request.dto.ts
export class CollectRequestDto {
  @IsString()
  batch_id: string;

  @IsObject()
  journal: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  cursor?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

// entities/collector-batch.entity.ts (MikroORM)
@Entity({ tableName: 'collector_batches' })
export class CollectorBatchEntity {
  @PrimaryKey({ type: 'string' })
  id: string;

  @Property({ type: 'string', unique: true })
  idempotencyKey: string;

  @Property({ type: 'string' })
  batchId: string;

  @Property({ type: 'json' })
  journal: Record<string, unknown>;

  @Property({ type: 'json', nullable: true })
  cursor?: Record<string, unknown>;

  @Property({ type: 'json', nullable: true })
  meta?: Record<string, unknown>;

  @Property({ type: Date })
  receivedAt: Date;

  @Property({ type: 'string' })
  ackId: string;

  @Property({ type: 'number' })
  accepted: number;

  @Property({ type: 'number' })
  rejected: number;
}

// collect.service.ts
@Injectable()
export class CollectService {
  async ingest(
    dto: CollectRequestDto,
    idempotencyKey: string,
  ): Promise<CollectAckDto>;
}
```

## Todo

- [x] NestJS 애플리케이션 부트스트랩 및 패키지 의존성 정리
- [x] MikroORM 설정 및 CollectorBatch 엔터티/스키마 관리 구현
- [x] Collect 모듈(컨트롤러, 서비스, 가드) 작성
- [x] 테스트 작성 (단위 테스트)
- [x] 테스트 작성 (통합 테스트)
- [x] 문서 업데이트(README 및 환경 변수 안내)

## 작업 순서

1. **1단계**: NestJS/MikroORM 의존성 추가 및 애플리케이션 초기화 (완료 조건: Nest 앱 빌드 성공)
2. **2단계**: 엔터티와 서비스/컨트롤러 구현, 인증/멱등 로직 작성 (완료 조건: 기능 테스트 통과)
3. **3단계**: 테스트 및 문서 업데이트 (완료 조건: Vitest 통합 테스트 통과, README 최신화)

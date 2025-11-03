import 'reflect-metadata';
import { promises as fsPromises, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Global, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmModule, getRepositoryToken } from '@mikro-orm/nestjs';
import request from 'supertest';
import { EntityRepository, MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CollectModule } from '../src/collect/collect.module';
import { CollectorBatchEntity } from '../src/collect/entities/collector-batch.entity';
import { JOURNAL_STORAGE } from '../src/collect/journal-storage/journal-storage.constants';
import { JournalStorage } from '../src/collect/journal-storage/journal-storage.interface';
import { COLLECTOR_CONFIG, CollectorServerConfig } from '../src/config';

const API_KEY = 'test-key';
let journalDir: string;
let journalStorage: JournalStorage;

const BASE_TEST_CONFIG: CollectorServerConfig = {
  apiKey: API_KEY,
  port: 0,
  dbPath: ':memory:',
  journalStorage: {
    driver: 'filesystem',
    baseDir: '',
  },
};

@Global()
@Module({
      providers: [
        {
          provide: COLLECTOR_CONFIG,
          useFactory: (): CollectorServerConfig => {
            journalDir = mkdtempSync(join(tmpdir(), 'collector-journal-'));
            return {
              ...BASE_TEST_CONFIG,
              journalStorage: {
                driver: 'filesystem',
                baseDir: journalDir,
              },
            };
          },
        },
      ],
  exports: [COLLECTOR_CONFIG],
})
class TestCollectorConfigModule {}

describe('/v1/collect (NestJS)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let repository: EntityRepository<CollectorBatchEntity>;

  async function createApp(): Promise<void> {
    moduleRef = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          driver: SqliteDriver,
          dbName: ':memory:',
          entities: [CollectorBatchEntity],
          allowGlobalContext: true,
        }),
        TestCollectorConfigModule,
        CollectModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const orm = moduleRef.get<MikroORM>(MikroORM);
    await orm.getSchemaGenerator().refreshDatabase();

    await app.init();

    repository = moduleRef.get<EntityRepository<CollectorBatchEntity>>(getRepositoryToken(CollectorBatchEntity));
    journalStorage = moduleRef.get<JournalStorage>(JOURNAL_STORAGE);
  }

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    if (moduleRef) {
      await moduleRef.close();
    }
    if (journalDir) {
      await fsPromises.rm(journalDir, { recursive: true, force: true });
      journalDir = '';
    }
  });

  it('accepts valid payloads and stores batches', async () => {
    await createApp();
    const payload = {
      batch_id: 'batch-001',
      journal: {
        interactions: [
          {
            message: 'hello',
            role: 'user',
          },
        ],
        usage: [
          {
            input_tokens: 10,
            output_tokens: 20,
          },
        ],
      },
      meta: { source: 'cli' },
    };

    const response = await request(app.getHttpServer())
      .post('/v1/collect')
      .set('x-api-key', API_KEY)
      .set('idempotency-key', 'idem-001')
      .send(payload);

    expect(response.status).toBe(202);
    expect(response.body.ack_id).toContain('batch-001');
    expect(response.body.accepted).toBe(2);
    expect(response.body.rejected).toBe(0);

    const records = await repository.findAll();
    expect(records).toHaveLength(1);
    expect(records[0].batchId).toBe('batch-001');
    expect(records[0].idempotencyKey).toBe('idem-001');
    expect(records[0].journalPath).toContain('collector-journal-');
    const storedContents = await journalStorage.load(records[0].journalPath);
    expect(storedContents).toEqual(payload.journal);
  });

  it('rejects requests without valid authentication', async () => {
    await createApp();
    const response = await request(app.getHttpServer())
      .post('/v1/collect')
      .set('x-api-key', 'wrong-key')
      .set('idempotency-key', 'idem-002')
      .send({ batch_id: 'b', journal: { interactions: [] } });

    expect(response.status).toBe(401);
  });

  it('returns stored ACK for duplicate idempotency keys', async () => {
    await createApp();
    const payload = {
      batch_id: 'batch-dup',
      journal: {
        interactions: [{ message: 'first', role: 'user' }],
      },
    };

    const first = await request(app.getHttpServer())
      .post('/v1/collect')
      .set('Authorization', `Bearer ${API_KEY}`)
      .set('idempotency-key', 'idem-dup')
      .send(payload);

    expect(first.status).toBe(202);
    const firstAck = first.body.ack_id;

    const second = await request(app.getHttpServer())
      .post('/v1/collect')
      .set('Authorization', `Bearer ${API_KEY}`)
      .set('idempotency-key', 'idem-dup')
      .send(payload);

    expect(second.status).toBe(200);
    expect(second.body.ack_id).toBe(firstAck);

    const records = await repository.findAll();
    expect(records).toHaveLength(1);
  });
});

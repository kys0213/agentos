import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ tableName: 'collector_batches' })
export class CollectorBatchEntity {
  @PrimaryKey({ type: 'string', columnType: 'text' })
  id: string = randomUUID();

  @Property({ type: 'string', unique: true, columnType: 'text' })
  idempotencyKey!: string;

  @Property({ type: 'string', columnType: 'text' })
  batchId!: string;

  @Property({ type: 'string', columnType: 'text', fieldName: 'journal_path' })
  journalPath!: string;

  @Property({ type: 'json', nullable: true })
  cursor?: Record<string, unknown> | null;

  @Property({ type: 'json', nullable: true })
  meta?: Record<string, unknown> | null;

  @Property({ type: Date, columnType: 'datetime' })
  receivedAt!: Date;

  @Property({ type: 'string', columnType: 'text' })
  ackId!: string;

  @Property({ type: 'number', columnType: 'integer' })
  accepted!: number;

  @Property({ type: 'number', columnType: 'integer' })
  rejected!: number;
}

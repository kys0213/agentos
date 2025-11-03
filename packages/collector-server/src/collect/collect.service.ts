import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { randomUUID } from 'crypto';
import { EntityRepository } from '@mikro-orm/core';
import { CollectAckDto } from './dto/collect-ack.dto';
import { CollectRequestDto } from './dto/collect-request.dto';
import { CollectorBatchEntity } from './entities/collector-batch.entity';
import { JOURNAL_STORAGE } from './journal-storage/journal-storage.constants';
import { JournalStorage } from './journal-storage/journal-storage.interface';

interface IngestResult {
  ack: CollectAckDto;
  created: boolean;
}

@Injectable()
export class CollectService {
  constructor(
    @InjectRepository(CollectorBatchEntity)
    private readonly repository: EntityRepository<CollectorBatchEntity>,
    @Inject(JOURNAL_STORAGE)
    private readonly journalStorage: JournalStorage,
  ) {}

  async ingest(dto: CollectRequestDto, idempotencyKey: string): Promise<IngestResult> {
    const existing = await this.repository.findOne({ idempotencyKey });
    if (existing) {
      return {
        ack: {
          ack_id: existing.ackId,
          accepted: existing.accepted,
          rejected: existing.rejected,
        },
        created: false,
      };
    }

    const ack = this.createAck(dto);

    const record = this.repository.create({
      idempotencyKey,
      batchId: dto.batch_id,
      journalPath: '',
      cursor: dto.cursor ?? null,
      meta: dto.meta ?? null,
      ackId: ack.ack_id,
      accepted: ack.accepted,
      rejected: ack.rejected,
      receivedAt: new Date(),
    });

    const journalPath = await this.journalStorage.store(record.id, dto.journal);
    record.journalPath = journalPath;

    try {
      const entityManager = this.repository.getEntityManager();
      entityManager.persist(record);
      await entityManager.flush();
    } catch (error) {
      await this.journalStorage.remove(journalPath);
      throw new InternalServerErrorException('Failed to persist batch');
    }

    return { ack, created: true };
  }

  private createAck(dto: CollectRequestDto): CollectAckDto {
    return {
      ack_id: `ack_${dto.batch_id}_${randomUUID()}`,
      accepted: this.countJournalEntries(dto.journal),
      rejected: 0,
    };
  }

  private countJournalEntries(journal: Record<string, unknown>): number {
    return Object.values(journal).reduce<number>((sum, value) => {
      if (Array.isArray(value)) {
        return sum + value.length;
      }
      return sum + 1;
    }, 0);
  }
}

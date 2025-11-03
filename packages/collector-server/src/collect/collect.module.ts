import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CollectorBatchEntity } from './entities/collector-batch.entity';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { JournalStorageModule } from './journal-storage/journal-storage.module';
import { COLLECTOR_CONFIG, CollectorServerConfig } from '../config';

@Module({
  imports: [
    MikroOrmModule.forFeature([CollectorBatchEntity]),
    JournalStorageModule.registerAsync({
      inject: [COLLECTOR_CONFIG],
      useFactory: (config: CollectorServerConfig) => {
        const { journalStorage } = config;
        if (journalStorage.driver === 'filesystem') {
          return {
            driver: 'filesystem' as const,
            filesystem: { baseDir: journalStorage.baseDir },
          };
        }
        throw new Error(`Unsupported journal storage driver ${journalStorage.driver}`);
      },
    }),
  ],
  controllers: [CollectController],
  providers: [CollectService, ApiKeyGuard],
})
export class CollectModule {}

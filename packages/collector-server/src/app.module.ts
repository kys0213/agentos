import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CollectorConfigModule } from './config.module';
import { COLLECTOR_CONFIG, CollectorServerConfig } from './config';
import { CollectModule } from './collect/collect.module';
import { CollectorBatchEntity } from './collect/entities/collector-batch.entity';

@Module({
  imports: [
    CollectorConfigModule,
    MikroOrmModule.forRootAsync({
      imports: [CollectorConfigModule],
      inject: [COLLECTOR_CONFIG],
      useFactory: (config: CollectorServerConfig) => ({
        driver: SqliteDriver,
        dbName: config.dbPath,
        entities: [CollectorBatchEntity],
        ensureDatabase: true,
        allowGlobalContext: true,
      }),
    }),
    CollectModule,
  ],
})
export class AppModule {}

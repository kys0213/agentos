import { Global, Module } from '@nestjs/common';
import { COLLECTOR_CONFIG, CollectorServerConfig, loadConfig } from './config';

@Global()
@Module({
  providers: [
    {
      provide: COLLECTOR_CONFIG,
      useValue: loadCollectorConfig(),
    },
  ],
  exports: [COLLECTOR_CONFIG],
})
export class CollectorConfigModule {}

function loadCollectorConfig(): CollectorServerConfig {
  return loadConfig();
}

import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { ElectronAppEnvironment } from '../electron/electron-app.environment';

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService, ElectronAppEnvironment],
  exports: [KnowledgeService],
})
export class KnowledgeApiModule {}

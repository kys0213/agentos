import { Module } from '@nestjs/common';
import { BridgeController } from './bridge.controller';
import { LlmBridgeModule } from '../common/model/llm-bridge.module';

@Module({
  imports: [LlmBridgeModule],
  controllers: [BridgeController],
})
export class BridgeApiModule {}

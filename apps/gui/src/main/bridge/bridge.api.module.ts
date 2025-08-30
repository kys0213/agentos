import { Module } from '@nestjs/common';
// import { BridgeController } from './bridge.controller';
import { GeneratedBridgeController } from './gen/bridge.controller.gen.new';
import { LlmBridgeModule } from '../common/model/llm-bridge.module';

@Module({
  imports: [LlmBridgeModule],
  controllers: [GeneratedBridgeController],
})
export class BridgeApiModule {}

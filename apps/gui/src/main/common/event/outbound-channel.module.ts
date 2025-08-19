import { Global, Module } from '@nestjs/common';
import { OutboundChannel } from './outbound-channel';

@Module({
  providers: [OutboundChannel],
  exports: [OutboundChannel],
})
@Global()
export class OutboundChannelModule {}

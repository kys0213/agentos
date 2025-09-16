import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { SlackBoltService } from './slack-bolt.service';

@Module({
  imports: [DiscoveryModule],
  providers: [SlackBoltService],
  exports: [SlackBoltService],
})
export class SlackModule {}

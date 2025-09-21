import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { SlackBoltService } from './slack-bolt.service';
import { SlackController } from './slack.controller';

@Module({
  imports: [DiscoveryModule],
  providers: [SlackBoltService],
  controllers: [SlackController],
  exports: [SlackBoltService],
})
export class SlackModule {}

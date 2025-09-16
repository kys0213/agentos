import { Module } from '@nestjs/common';

import { SlackModule } from './slack/slack.module';

@Module({
  imports: [SlackModule],
})
export class AppModule {}

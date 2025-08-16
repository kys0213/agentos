import { Module } from '@nestjs/common';
import { FrameController } from './frame/frame.controller';

@Module({
  imports: [],
  controllers: [FrameController],
  providers: [],
})
export class AppModule {}

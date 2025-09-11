import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService], // AgentModule에서 사용할 수 있도록 export
})
export class ChatModule {}

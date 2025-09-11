import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ChatContract as C } from '../../shared/rpc/contracts/chat.contract';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @EventPattern('chat.list-sessions')
  async listSessions(
    @Payload(new ZodValidationPipe(C.methods['listSessions']['payload']))
    payload: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['listSessions']['response']>> {
    return this.chatService.listSessions(payload);
  }

  @EventPattern('chat.get-messages')
  async getMessages(
    @Payload(new ZodValidationPipe(C.methods['getMessages']['payload']))
    payload: z.input<(typeof C.methods)['getMessages']['payload']>
  ): Promise<z.output<(typeof C.methods)['getMessages']['response']>> {
    return this.chatService.getMessages(payload);
  }

  @EventPattern('chat.delete-session')
  async deleteSession(
    @Payload(new ZodValidationPipe(C.methods['deleteSession']['payload']))
    payload: z.input<(typeof C.methods)['deleteSession']['payload']>
  ): Promise<z.output<(typeof C.methods)['deleteSession']['response']>> {
    return this.chatService.deleteSession(payload);
  }
}
// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';

@Controller()
export class GeneratedChatControllerStub {
  @EventPattern('chat.list-sessions')
  async listSessions(
    @Payload(new ZodValidationPipe(C.methods['listSessions']['payload']))
    payload: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['listSessions']['response']>> {
    // Expected return: z.output<typeof C.methods['listSessions']['response']>
    throw new Error('NotImplemented: wire chat.listSessions');
  }

  @EventPattern('chat.get-messages')
  async getMessages(
    @Payload(new ZodValidationPipe(C.methods['getMessages']['payload']))
    payload: z.input<(typeof C.methods)['getMessages']['payload']>
  ): Promise<z.output<(typeof C.methods)['getMessages']['response']>> {
    // Expected return: z.output<typeof C.methods['getMessages']['response']>
    throw new Error('NotImplemented: wire chat.getMessages');
  }

  @EventPattern('chat.delete-session')
  async deleteSession(
    @Payload(new ZodValidationPipe(C.methods['deleteSession']['payload']))
    payload: z.input<(typeof C.methods)['deleteSession']['payload']>
  ): Promise<z.output<(typeof C.methods)['deleteSession']['response']>> {
    // Expected return: z.output<typeof C.methods['deleteSession']['response']>
    throw new Error('NotImplemented: wire chat.deleteSession');
  }
}

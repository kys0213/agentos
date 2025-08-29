// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';

@Controller()
export class GeneratedChatController {

  @EventPattern('chat.list-sessions')
  async methods(@Payload(new ZodValidationPipe(C.methods['methods'].payload)) payload: z.input<typeof C.methods['methods'].payload>) {
    // Expected return: z.output<typeof C.methods['methods'].response>
    throw new Error('NotImplemented: wire chat.methods');
  }

  @EventPattern('chat.get-messages')
  async getMessages(@Payload(new ZodValidationPipe(C.methods['getMessages'].payload)) payload: z.input<typeof C.methods['getMessages'].payload>) {
    throw new Error('NotImplemented: wire chat.getMessages');
  }

  @EventPattern('chat.delete-session')
  async deleteSession(@Payload(new ZodValidationPipe(C.methods['deleteSession'].payload)) payload: z.input<typeof C.methods['deleteSession'].payload>) {
    // Expected return: z.output<typeof C.methods['deleteSession'].response>
    throw new Error('NotImplemented: wire chat.deleteSession');
  }
}

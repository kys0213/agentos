// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';

@Controller()
export class GeneratedMcpController {

  @EventPattern('mcp.getTool')
  async getTool(@Payload(new ZodValidationPipe(C.methods['getTool'].payload)) payload) {
    throw new Error('NotImplemented: wire mcp.getTool');
  }

  @EventPattern('mcp.invokeTool')
  async invokeTool(@Payload(new ZodValidationPipe(C.methods['invokeTool'].payload)) payload) {
    throw new Error('NotImplemented: wire mcp.invokeTool');
  }
}

// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';

@Controller()
export class GeneratedMcpController {

  @EventPattern('mcp.getTool')
  async getTool(@Payload(new ZodValidationPipe(C.methods['getTool']['payload'])) payload: z.input<typeof C.methods['getTool']['payload']>): Promise<z.output<typeof C.methods['getTool']['response']>> {
    // Expected return: z.output<typeof C.methods['getTool']['response']>
    throw new Error('NotImplemented: wire mcp.getTool');
  }

  @EventPattern('mcp.invokeTool')
  async invokeTool(@Payload(new ZodValidationPipe(C.methods['invokeTool']['payload'])) payload: z.input<typeof C.methods['invokeTool']['payload']>): Promise<z.output<typeof C.methods['invokeTool']['response']>> {
    // Expected return: z.output<typeof C.methods['invokeTool']['response']>
    throw new Error('NotImplemented: wire mcp.invokeTool');
  }

  @EventPattern('mcp.usage.getLogs')
  async usage_getLogs(@Payload(new ZodValidationPipe(C.methods['usage.getLogs']['payload'])) payload: z.input<typeof C.methods['usage.getLogs']['payload']>): Promise<z.output<typeof C.methods['usage.getLogs']['response']>> {
    // Expected return: z.output<typeof C.methods['usage.getLogs']['response']>
    throw new Error('NotImplemented: wire mcp.usage.getLogs');
  }

  @EventPattern('mcp.usage.getStats')
  async usage_getStats(@Payload(new ZodValidationPipe(C.methods['usage.getStats']['payload'])) payload: z.input<typeof C.methods['usage.getStats']['payload']>): Promise<z.output<typeof C.methods['usage.getStats']['response']>> {
    // Expected return: z.output<typeof C.methods['usage.getStats']['response']>
    throw new Error('NotImplemented: wire mcp.usage.getStats');
  }

  @EventPattern('mcp.usage.getHourlyStats')
  async usage_getHourlyStats(@Payload(new ZodValidationPipe(C.methods['usage.getHourlyStats']['payload'])) payload: z.input<typeof C.methods['usage.getHourlyStats']['payload']>): Promise<z.output<typeof C.methods['usage.getHourlyStats']['response']>> {
    // Expected return: z.output<typeof C.methods['usage.getHourlyStats']['response']>
    throw new Error('NotImplemented: wire mcp.usage.getHourlyStats');
  }

  @EventPattern('mcp.usage.clear')
  async usage_clear(@Payload(new ZodValidationPipe(C.methods['usage.clear']['payload'])) payload: z.input<typeof C.methods['usage.clear']['payload']>): Promise<z.output<typeof C.methods['usage.clear']['response']>> {
    // Expected return: z.output<typeof C.methods['usage.clear']['response']>
    throw new Error('NotImplemented: wire mcp.usage.clear');
  }

  @EventPattern('mcp.usage.events')
  async usage_events(): Promise<void> {
    throw new Error('NotImplemented: wire mcp.usage.events');
  }
}

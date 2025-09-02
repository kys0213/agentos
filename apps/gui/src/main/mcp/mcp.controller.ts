import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { McpService } from '@agentos/core';
import { GetToolDto, InvokeToolDto, type Resp } from './dto/mcp.dto';

@Controller()
export class McpController {
  constructor(@Inject(McpService) private readonly mcp: McpService) {}

  @EventPattern('mcp.getTool')
  async getTool(@Payload() dto: GetToolDto) {
    return this.mcp.getTool(dto.name);
  }

  @EventPattern('mcp.invokeTool')
  async invokeTool(@Payload() data: InvokeToolDto): Promise<Resp<unknown>> {
    try {
      const result = await this.mcp.executeTool(data.name, data.input, undefined);
      return { success: true, result };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}

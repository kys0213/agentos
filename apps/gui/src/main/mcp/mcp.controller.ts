import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { McpService } from '@agentos/core';
import type { InvokeToolResult } from '@agentos/core/src/tool/mcp/mcp';
import { InvokeToolDto, type Resp } from './dto/mcp.dto';

@Controller()
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @EventPattern('mcp.getTool')
  async getTool(@Payload() name: string) {
    return this.mcp.getTool(name);
  }

  @EventPattern('mcp.invokeTool')
  async invokeTool(@Payload() data: InvokeToolDto): Promise<Resp<InvokeToolResult>> {
    try {
      const result = (await this.mcp.executeTool(data.name, data.input, undefined)) as InvokeToolResult;
      return { success: true, result };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}

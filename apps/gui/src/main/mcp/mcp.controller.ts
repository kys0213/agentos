import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { McpRegistry } from '@agentos/core';

type InvokePayload = {
  name: string; // fully qualified: <mcp>.<tool>
  input?: Record<string, unknown>;
  resumptionToken?: string;
};

@Controller()
export class McpController {
  constructor(private readonly registry: McpRegistry) {}

  @EventPattern('mcp.getTool')
  async getTool(@Payload() name: string) {
    return await this.registry.getTool(name);
  }

  @EventPattern('mcp.invokeTool')
  async invokeTool(@Payload() data: InvokePayload) {
    const info = await this.registry.getToolOrThrow(data.name);
    return await info.mcp.invokeTool(info.tool, {
      input: data.input,
      resumptionToken: data.resumptionToken,
    });
  }
}

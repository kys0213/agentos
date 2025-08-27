import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

// AUTO-GENERATED FILE. DO NOT EDIT.
@Controller()
export class GeneratedMcpController {
  @EventPattern('mcp.getTool')
  async getTool(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire mcp.getTool');
  }
  @EventPattern('mcp.invokeTool')
  async invokeTool(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire mcp.invokeTool');
  }
  @EventPattern('mcp.usage.getLogs')
  async usageGetLogs(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire mcp.usage.getLogs');
  }
  @EventPattern('mcp.usage.getStats')
  async usageGetStats(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire mcp.usage.getStats');
  }
  @EventPattern('mcp.usage.getHourlyStats')
  async usageGetHourlyStats(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire mcp.usage.getHourlyStats');
  }
  @EventPattern('mcp.usage.clear')
  async usageClear(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire mcp.usage.clear');
  }
}

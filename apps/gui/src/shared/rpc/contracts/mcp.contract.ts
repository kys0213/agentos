import { z } from 'zod';
import { defineContract } from './defineContract';

export const ToolInvokeResponseSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), result: z.unknown().optional() }),
  z.object({ success: z.literal(false), error: z.string() }),
]);

export const McpContract = defineContract({
  namespace: 'mcp',
  methods: {
    getTool: {
      channel: 'mcp.getTool',
      payload: z.object({ name: z.string() }),
      response: z.unknown(),
    },
    invokeTool: {
      channel: 'mcp.invokeTool',
      payload: z.object({
        name: z.string(),
        input: z.record(z.unknown()).optional(),
        agentId: z.string().optional(),
        agentName: z.string().optional(),
        resumptionToken: z.string().optional(),
      }),
      response: ToolInvokeResponseSchema,
    },
    // Usage API
    'usage.getLogs': {
      channel: 'mcp.usage.getLogs',
      payload: z
        .object({ query: z.record(z.unknown()).optional(), pg: z.record(z.unknown()).optional() })
        .optional(),
      response: z.array(z.unknown()), // TODO: McpUsageLog schema
    },
    'usage.getStats': {
      channel: 'mcp.usage.getStats',
      payload: z.object({ query: z.record(z.unknown()).optional() }).optional(),
      response: z.unknown(), // TODO: McpUsageStats schema
    },
    'usage.getHourlyStats': {
      channel: 'mcp.usage.getHourlyStats',
      payload: z.object({ date: z.string(), clientName: z.string().optional() }),
      response: z.object({ hourlyData: z.array(z.tuple([z.number(), z.number()])) }),
    },
    'usage.clear': {
      channel: 'mcp.usage.clear',
      payload: z.object({ olderThan: z.string().optional() }).optional(),
      response: z.object({ success: z.boolean(), error: z.string().optional() }),
    },
    'usage.events': {
      channel: 'mcp.usage.events',
      response: z.unknown(), // stream channel; used for on/stream
    },
  },
});

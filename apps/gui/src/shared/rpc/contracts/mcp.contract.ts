import { z } from 'zod';
import { defineContract } from './defineContract';

// Usage log/summary schemas (flexible but typed)
export const McpUsageLogSchema = z.object({
  id: z.string(),
  toolId: z.string().optional(),
  toolName: z.string().optional(),
  timestamp: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
  operation: z.literal('tool.call'),
  status: z.union([z.literal('success'), z.literal('error')]),
  durationMs: z.number().optional(),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  errorCode: z.string().optional(),
}).passthrough();

export const McpUsageStatsSchema = z
  .object({
    total: z.number().default(0),
    success: z.number().default(0),
    error: z.number().default(0),
  })
  .passthrough();

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
      response: z.array(McpUsageLogSchema),
    },
    'usage.getStats': {
      channel: 'mcp.usage.getStats',
      payload: z.object({ query: z.record(z.unknown()).optional() }).optional(),
      response: McpUsageStatsSchema,
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
      streamResponse: z.unknown(),
    },
  },
});

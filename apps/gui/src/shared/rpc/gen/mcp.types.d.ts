// AUTO-GENERATED FILE. DO NOT EDIT.
// Declaration-only types for generated RPC clients

export type getTool_Payload = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['getTool']['payload']
>;
export type getTool_Result = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['getTool']['response']
>;

export type invokeTool_Payload = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['invokeTool']['payload']
>;
export type invokeTool_Result = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['invokeTool']['response']
>;

export type _Payload = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['']['payload']
>;
export type _Result = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['']['response']
>;

export type usage_getStats_Payload = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['usage.getStats']['payload']
>;
export type usage_getStats_Result = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['usage.getStats']['response']
>;

export type usage_getHourlyStats_Payload = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['usage.getHourlyStats']['payload']
>;
export type usage_getHourlyStats_Result = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['usage.getHourlyStats']['response']
>;

export type usage_clear_Payload = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['usage.clear']['payload']
>;
export type usage_clear_Result = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['usage.clear']['response']
>;

export type usage_events_Payload = void;
export type usage_events_Result = void;
export type usage_events_Stream = import('zod').infer<
  (typeof import('../contracts/mcp.contract').McpContract)['methods']['usage.events']['streamResponse']
>;

// MCP Core Types and Interfaces
export type {
  McpConfig,
  StdioMcpConfig,
  StreamableHttpMcpConfig,
  WebSocketMcpConfig,
  SseMcpConfig,
} from './mcp-config';
export type {
  McpToolMetadata,
  McpConnectionStatus,
  McpUsageLog,
  McpUsageStatus,
  McpToolDescription,
  McpUsageStats,
} from './mcp-types';

// Repository Layer
export type {
  McpToolRepository,
  McpToolSearchQuery,
  McpToolRepositoryEvent,
  McpToolRepositoryEventHandler,
  McpToolRepositoryEventPayload,
  McpUnsubscribe,
} from './repository/mcp-tool-repository';
export { FileMcpToolRepository } from './repository/file-mcp-tool-repository';

// Registry Layer (SSOT + MCP Integration)
export type { McpMetadataRegistryEvents } from './registry/mcp-metadata-registry';
export { McpMetadataRegistry } from './registry/mcp-metadata-registry';

// Core MCP Implementation (Protocol-compliant)
export { Mcp } from './mcp';
export { McpRegistry } from './mcp.registery';

// Service Layer (Facade)
export type { McpServiceEvents } from './service/mcp-service';
export { McpService } from './service/mcp-service';

// Usage Layer (service + repository; types remain internal to avoid name clash with legacy)
export { FileMcpUsageRepository } from './usage/repository/file-mcp-usage-repository';
export { McpUsageService } from './usage/service/mcp-usage-service';

// Legacy exports (for backward compatibility)
export { McpEvent, type McpEventMap } from './mcp-event';
export { McpTransportFactory } from './mcp-transport.factory';

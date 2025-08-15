// MCP Core Types and Interfaces
export type { McpConfig } from './mcp-config';
export type {
  McpToolMetadata,
  McpConnectionStatus,
  McpUsageLog,
  McpUsageStatus,
} from './mcp-types';

// Repository Layer
export type {
  McpToolRepository,
  McpToolSearchQuery,
  McpToolRepositoryEvent,
  McpToolRepositoryEventHandler,
  McpToolRepositoryEventPayload,
  Unsubscribe,
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

// Legacy exports (for backward compatibility)
export { McpEvent, type McpEventMap } from './mcp-event';
export { McpTransportFactory } from './mcp-transport.factory';
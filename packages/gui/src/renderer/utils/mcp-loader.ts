import { Mcp } from '@agentos/core';
import { McpConfigStore } from '../stores/mcp-config-store';

export function loadMcpFromStore(store: McpConfigStore): Mcp | undefined {
  const config = store.get();
  if (!config) {
    return undefined;
  }
  return Mcp.create(config);
}

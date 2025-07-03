import { McpRegistry } from './mcp.registery';

/**
 * Returns the names of all MCPs currently registered in the given registry.
 */
export async function listInstalledMcps(registry: McpRegistry): Promise<string[]> {
  const mcps = await registry.getAll();
  return mcps.map((m) => m.name);
}

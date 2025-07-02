import { listInstalledMcps } from '../list-installed-mcps';
import { McpRegistry } from '../mcp.registery';
import { Mcp } from '../mcp';

test('listInstalledMcps returns names of registered MCPs', async () => {
  const registry = new McpRegistry();
  const mcpA = { name: 'a' } as Mcp;
  const mcpB = { name: 'b' } as Mcp;

  (registry as any).storage.set('a', mcpA);
  (registry as any).storage.set('b', mcpB);

  const result = await listInstalledMcps(registry);
  expect(result).toEqual(['a', 'b']);
});

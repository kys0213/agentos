"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_registery_1 = require("../mcp.registery");
describe('McpRegistry', () => {
    it.skip('should register and unregister', async () => {
        const registry = new mcp_registery_1.McpRegistry();
        await registry.register({
            type: 'stdio',
            name: 'filesystem',
            version: '1.0.0',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/irene/Desktop'],
        });
        const mcp = await registry.getOrThrow('filesystem');
        const tools = await mcp.getTools();
        expect(mcp).toBeDefined();
        expect(tools.length).toBeGreaterThan(0);
        expect(tools[0].name).toContain('filesystem');
        const result = await mcp.invokeTool(tools[0]);
        console.log(result);
        const description = await mcp.descriptionForLLM();
        console.log(description);
        await registry.unregister('filesystem');
        expect(await registry.get('filesystem')).toBeNull();
    });
});
//# sourceMappingURL=mcp-registery.e2e.test.js.map
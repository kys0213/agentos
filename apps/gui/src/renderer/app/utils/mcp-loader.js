import { Mcp } from '@agentos/core';
export function loadMcpFromStore(store) {
    const config = store.get();
    if (!config) {
        return undefined;
    }
    return Mcp.create(config);
}

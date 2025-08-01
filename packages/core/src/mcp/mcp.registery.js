"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpRegistry = void 0;
const mcp_1 = require("./mcp");
class McpRegistry {
    storage = new Map();
    onRegisterFunctions = [];
    onUnregisterFunctions = [];
    onRegister(fn) {
        this.onRegisterFunctions.push(fn);
    }
    onUnregister(fn) {
        this.onUnregisterFunctions.push(fn);
    }
    async getAll() {
        return Array.from(this.storage.values());
    }
    async getTool(name) {
        const { mcpName, toolName } = this.parseMcpAndToolName(name);
        if (!toolName) {
            return null;
        }
        const mcp = await this.get(mcpName);
        if (!mcp) {
            return null;
        }
        const tool = await mcp.getTool(toolName);
        if (!tool) {
            return null;
        }
        return {
            mcp,
            tool,
        };
    }
    async getToolOrThrow(name) {
        const result = await this.getTool(name);
        if (!result) {
            throw new Error(`Tool ${name} not found`);
        }
        return result;
    }
    async register(config) {
        const mcp = mcp_1.Mcp.create(config);
        await mcp.connect();
        this.storage.set(config.name, mcp);
        for (const onRegister of this.onRegisterFunctions) {
            onRegister(mcp);
        }
    }
    async get(name) {
        const mcp = this.storage.get(name);
        if (!mcp) {
            return null;
        }
        if (mcp.isConnected()) {
            return mcp;
        }
        await mcp.connect();
        return mcp;
    }
    async getOrThrow(name) {
        const mcp = await this.get(name);
        if (!mcp) {
            throw new Error(`Mcp ${name} is not registered`);
        }
        return mcp;
    }
    isRegistered(name) {
        return this.storage.has(name);
    }
    async unregister(name) {
        const mcp = await this.get(name);
        if (!mcp) {
            return;
        }
        const result = await mcp.safeDisconnect();
        this.storage.delete(name);
        for (const onUnregister of this.onUnregisterFunctions) {
            onUnregister(mcp);
        }
        return result;
    }
    async unregisterAll() {
        await Promise.all(Array.from(this.storage.values()).map((mcp) => mcp.safeDisconnect()));
        this.storage.clear();
    }
    parseMcpAndToolName(name) {
        const index = name.indexOf('.');
        if (index === -1) {
            return { mcpName: name, toolName: null };
        }
        const mcpName = name.substring(0, index);
        const toolName = name.substring(index + 1);
        return { mcpName, toolName };
    }
}
exports.McpRegistry = McpRegistry;
//# sourceMappingURL=mcp.registery.js.map
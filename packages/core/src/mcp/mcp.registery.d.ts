import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Mcp } from './mcp';
import { StdioMcpConfig } from './mcp-config';
export declare class McpRegistry {
    private storage;
    private onRegisterFunctions;
    private onUnregisterFunctions;
    onRegister(fn: OnRegisterFunction): void;
    onUnregister(fn: OnUnregisterFunction): void;
    getAll(): Promise<Mcp[]>;
    getTool(name: string): Promise<{
        mcp: Mcp;
        tool: Tool;
    } | null>;
    getToolOrThrow(name: string): Promise<{
        mcp: Mcp;
        tool: Tool;
    }>;
    register(config: StdioMcpConfig): Promise<void>;
    get(name: McpName): Promise<Mcp | null>;
    getOrThrow(name: McpName): Promise<Mcp>;
    isRegistered(name: McpName): boolean;
    unregister(name: McpName): Promise<({
        success: false;
        reason: unknown;
    } | {
        success: true;
        result: void;
    }) | undefined>;
    unregisterAll(): Promise<void>;
    private parseMcpAndToolName;
}
type McpName = string;
export interface OnRegisterFunction {
    (mcp: Mcp): void;
}
export interface OnUnregisterFunction {
    (mcp: Mcp): void;
}
export {};
//# sourceMappingURL=mcp.registery.d.ts.map
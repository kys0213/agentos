import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { AudioContent, ImageContent, Prompt, PromptMessage, Resource, ResourceContents, ServerCapabilities, TextContent, Tool } from '@modelcontextprotocol/sdk/types.js';
import EventEmitter from 'node:events';
import { McpConfig } from './mcp-config';
import { McpEventMap } from './mcp-event';
/**
 * mcp is a client for the MCP protocol.
 * mcp 도구를 한번 감싼 클래스로 mcp 도구의 기능을 확장합니다.
 */
export declare class Mcp extends EventEmitter {
    private readonly client;
    private readonly transport;
    private readonly config;
    private abortController;
    private lastUsedTime;
    private scheduler?;
    private tools;
    private prompts;
    private resources;
    constructor(client: Client, transport: Transport, config: McpConfig);
    static create(config: McpConfig): Mcp;
    get name(): string;
    get version(): string;
    get instructions(): string | undefined;
    get serverVersion(): {
        [x: string]: unknown;
        name: string;
        version: string;
        title?: string | undefined;
    } | undefined;
    descriptionForLLM(): Promise<string>;
    getServerCapabilities(): Promise<ServerCapabilities | undefined>;
    invokeTool(tool: Tool, option?: {
        resumptionToken?: string;
        input?: Record<string, unknown>;
    }): Promise<InvokeToolResult>;
    getResource(uri: string): Promise<ResourceContents[]>;
    getPrompt(name: string, input?: Record<string, string>): Promise<PromptMessage[]>;
    getPrompts(): Promise<Prompt[]>;
    getTool(name: string): Promise<Tool | undefined>;
    getTools(): Promise<Tool[]>;
    getResources(): Promise<Resource[]>;
    private appendPrefix;
    private removePrefix;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    safeConnect(): Promise<{
        success: false;
        reason: unknown;
    } | {
        success: true;
        result: void;
    }>;
    safeDisconnect(): Promise<{
        success: false;
        reason: unknown;
    } | {
        success: true;
        result: void;
    }>;
    emit<K extends keyof McpEventMap>(key: K, value: McpEventMap[K]): boolean;
    on<K extends keyof McpEventMap>(key: K, handler: (v: McpEventMap[K]) => void): this;
    private connectIfNotConnected;
    private registerMaxIdleTimeoutScheduler;
    private updateLastUsedTime;
}
export type McpContent = TextContent | ImageContent | AudioContent;
export type InvokeToolResult = {
    isError: boolean;
    contents: Array<McpContent>;
    resumptionToken?: string;
};
//# sourceMappingURL=mcp.d.ts.map
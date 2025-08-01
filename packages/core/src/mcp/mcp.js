"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mcp = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const node_events_1 = __importDefault(require("node:events"));
const scheduler_1 = require("../common/scheduler/scheduler");
const safeZone_1 = require("../common/utils/safeZone");
const mcp_event_1 = require("./mcp-event");
const mcp_transport_factory_1 = require("./mcp-transport.factory");
/**
 * mcp is a client for the MCP protocol.
 * mcp 도구를 한번 감싼 클래스로 mcp 도구의 기능을 확장합니다.
 */
class Mcp extends node_events_1.default {
    client;
    transport;
    config;
    abortController = null;
    lastUsedTime = 0;
    scheduler;
    tools = [];
    prompts = [];
    resources = [];
    constructor(client, transport, config) {
        super();
        this.client = client;
        this.transport = transport;
        this.config = config;
    }
    static create(config) {
        const transport = mcp_transport_factory_1.McpTransportFactory.create(config);
        const client = new index_js_1.Client({
            name: config.name,
            version: config.version,
        });
        const mcp = new Mcp(client, transport, config);
        return mcp;
    }
    get name() {
        const serverVersion = this.client.getServerVersion();
        if (!serverVersion) {
            return this.config.name;
        }
        return serverVersion.name;
    }
    get version() {
        const serverVersion = this.client.getServerVersion();
        if (!serverVersion) {
            return this.config.version;
        }
        return serverVersion.version;
    }
    get instructions() {
        return this.client.getInstructions();
    }
    get serverVersion() {
        return this.client.getServerVersion();
    }
    async descriptionForLLM() {
        const serverVersion = this.client.getServerVersion();
        if (!serverVersion) {
            return `name: ${this.config.name}\nversion: ${this.config.version}\ninstructions: ${this.client.getInstructions()}`;
        }
        const information = Object.entries(serverVersion)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        return `${information}\ninstructions: ${this.client.getInstructions()}`;
    }
    async getServerCapabilities() {
        return this.client.getServerCapabilities();
    }
    async invokeTool(tool, option) {
        let freshResumptionToken;
        await this.connectIfNotConnected();
        this.updateLastUsedTime();
        const result = await this.client.callTool({
            name: this.removePrefix(tool.name),
            arguments: option?.input,
        }, undefined, {
            timeout: this.config.network?.timeoutMs,
            maxTotalTimeout: this.config.network?.maxTotalTimeoutMs,
            resetTimeoutOnProgress: true,
            signal: this.abortController?.signal,
            onprogress: (progress) => {
                this.emit(mcp_event_1.McpEvent.ON_PROGRESS, { type: 'tool', name: tool.name, progress });
            },
            resumptionToken: option?.resumptionToken,
            onresumptiontoken: (token) => (freshResumptionToken = token),
        });
        if (result.isError) {
            throw new Error('Tool call failed reason: ' + result.content);
        }
        return {
            isError: result.isError == true,
            contents: Array.isArray(result.content) ? result.content : [result.content],
            resumptionToken: freshResumptionToken,
        };
    }
    async getResource(uri) {
        await this.connectIfNotConnected();
        this.updateLastUsedTime();
        const resource = await this.client.readResource({ uri }, {
            timeout: this.config.network?.timeoutMs,
            maxTotalTimeout: this.config.network?.maxTotalTimeoutMs,
            signal: this.abortController?.signal,
        });
        return resource.contents;
    }
    async getPrompt(name, input) {
        await this.connectIfNotConnected();
        this.updateLastUsedTime();
        const result = await this.client.getPrompt({ name: this.removePrefix(name), arguments: input }, {
            timeout: this.config.network?.timeoutMs,
            maxTotalTimeout: this.config.network?.maxTotalTimeoutMs,
            signal: this.abortController?.signal,
        });
        return result.messages;
    }
    async getPrompts() {
        if (this.prompts.length > 0) {
            return this.prompts;
        }
        await this.connectIfNotConnected();
        this.updateLastUsedTime();
        // TODO 페이징 처리 고민
        const { prompts } = await this.client.listPrompts();
        const promptWithPrefix = prompts.map((prompt) => this.appendPrefix(prompt));
        return promptWithPrefix;
    }
    async getTool(name) {
        const tools = await this.getTools();
        return tools.find((tool) => tool.name === name);
    }
    async getTools() {
        if (this.tools.length > 0) {
            return this.tools;
        }
        await this.connectIfNotConnected();
        this.updateLastUsedTime();
        // TODO 페이징 처리 고민
        const { tools } = await this.client.listTools();
        const toolWithPrefix = tools.map((tool) => this.appendPrefix(tool));
        return toolWithPrefix;
    }
    async getResources() {
        if (this.resources.length > 0) {
            return this.resources;
        }
        await this.connectIfNotConnected();
        this.updateLastUsedTime();
        // TODO 페이징 처리 고민
        const { resources } = await this.client.listResources();
        const resourceWithPrefix = resources.map((resource) => this.appendPrefix(resource));
        return resourceWithPrefix;
    }
    appendPrefix(value) {
        return { ...value, name: `${this.config.name}.${value.name}` };
    }
    removePrefix(name) {
        const index = name.indexOf(this.config.name);
        if (index !== 0) {
            return name;
        }
        return name.substring(this.config.name.length + 1);
    }
    isConnected() {
        return this.abortController !== null;
    }
    async connect() {
        if (this.isConnected()) {
            return;
        }
        this.abortController = new AbortController();
        await this.client.connect(this.transport, {
            signal: this.abortController.signal,
            timeout: this.config.network?.timeoutMs,
            maxTotalTimeout: this.config.network?.maxTotalTimeoutMs,
        });
        this.emit(mcp_event_1.McpEvent.CONNECTED, undefined);
        this.registerMaxIdleTimeoutScheduler();
    }
    async disconnect() {
        if (!this.isConnected()) {
            return;
        }
        if (this.scheduler && this.scheduler.isRunning()) {
            this.scheduler.stop();
        }
        try {
            await this.client.close();
            this.emit(mcp_event_1.McpEvent.DISCONNECTED, undefined);
            if (this.abortController?.signal.aborted) {
                return;
            }
            this.abortController?.abort();
        }
        finally {
            this.abortController = null;
            this.tools.length = 0;
            this.prompts.length = 0;
            this.resources.length = 0;
        }
    }
    async safeConnect() {
        return await (0, safeZone_1.safeZone)(() => this.connect());
    }
    async safeDisconnect() {
        return await (0, safeZone_1.safeZone)(() => this.disconnect());
    }
    emit(key, value) {
        return super.emit(key, value);
    }
    on(key, handler) {
        return super.on(key, handler);
    }
    async connectIfNotConnected() {
        if (!this.isConnected()) {
            await this.connect();
        }
    }
    registerMaxIdleTimeoutScheduler() {
        const maxConnectionIdleTimeoutMs = this.config.network?.maxConnectionIdleTimeoutMs;
        if (maxConnectionIdleTimeoutMs) {
            this.scheduler = scheduler_1.Scheduler.create(Math.min(maxConnectionIdleTimeoutMs, 10000));
            this.scheduler.start(async () => {
                if (this.lastUsedTime + maxConnectionIdleTimeoutMs < Date.now()) {
                    await this.safeDisconnect();
                }
            });
        }
    }
    updateLastUsedTime() {
        this.lastUsedTime = Date.now();
    }
}
exports.Mcp = Mcp;
//# sourceMappingURL=mcp.js.map
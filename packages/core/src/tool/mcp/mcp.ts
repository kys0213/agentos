import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  AudioContent,
  ImageContent,
  Prompt,
  PromptMessage,
  Resource,
  ResourceContents,
  ServerCapabilities,
  TextContent,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import EventEmitter from 'node:events';
import { Scheduler } from '../../common/scheduler/scheduler';
import { safeZone } from '../../common/utils/safeZone';
import { McpConfig } from './mcp-config';
import { McpEvent, McpEventMap } from './mcp-event';
import { McpTransportFactory } from './mcp-transport.factory';

/**
 * mcp is a client for the MCP protocol.
 * mcp 도구를 한번 감싼 클래스로 mcp 도구의 기능을 확장합니다.
 */
export class Mcp extends EventEmitter {
  private abortController: AbortController | null = null;
  private lastUsedTime: number = 0;
  private scheduler?: Scheduler;

  private tools: Tool[] = [];
  private prompts: Prompt[] = [];
  private resources: Resource[] = [];

  constructor(
    private readonly client: Client,
    private readonly transport: Transport,
    private readonly config: McpConfig
  ) {
    super();
  }

  static create(config: McpConfig) {
    const transport = McpTransportFactory.create(config);

    const client = new Client({
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

  async descriptionForLLM(): Promise<string> {
    const serverVersion = this.client.getServerVersion();

    if (!serverVersion) {
      return `name: ${this.config.name}\nversion: ${this.config.version}\ninstructions: ${this.client.getInstructions()}`;
    }

    const information = Object.entries(serverVersion)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `${information}\ninstructions: ${this.client.getInstructions()}`;
  }

  async getServerCapabilities(): Promise<ServerCapabilities | undefined> {
    return this.client.getServerCapabilities();
  }

  async invokeTool(
    tool: Tool,
    option?: { resumptionToken?: string; input?: Record<string, unknown> }
  ): Promise<InvokeToolResult> {
    let freshResumptionToken: string | undefined;

    await this.connectIfNotConnected();
    this.updateLastUsedTime();

    const result = await this.client.callTool(
      {
        name: this.removePrefix(tool.name),
        arguments: option?.input,
      },
      undefined,
      {
        timeout: this.config.network?.timeoutMs,
        maxTotalTimeout: this.config.network?.maxTotalTimeoutMs,
        resetTimeoutOnProgress: true,
        signal: this.abortController?.signal,
        onprogress: (progress) => {
          this.emit(McpEvent.ON_PROGRESS, { type: 'tool', name: tool.name, progress });
        },
        resumptionToken: option?.resumptionToken,
        onresumptiontoken: (token) => (freshResumptionToken = token),
      }
    );

    if (result.isError) {
      throw new Error('Tool call failed reason: ' + result.content);
    }

    return {
      isError: result.isError == true,
      contents: Array.isArray(result.content) ? result.content : [result.content],
      resumptionToken: freshResumptionToken,
    };
  }

  async getResource(uri: string): Promise<ResourceContents[]> {
    await this.connectIfNotConnected();
    this.updateLastUsedTime();

    const resource = await this.client.readResource(
      { uri },
      {
        timeout: this.config.network?.timeoutMs,
        maxTotalTimeout: this.config.network?.maxTotalTimeoutMs,
        signal: this.abortController?.signal,
      }
    );

    return resource.contents;
  }

  async getPrompt(name: string, input?: Record<string, string>): Promise<PromptMessage[]> {
    await this.connectIfNotConnected();
    this.updateLastUsedTime();

    const result = await this.client.getPrompt(
      { name: this.removePrefix(name), arguments: input },
      {
        timeout: this.config.network?.timeoutMs,
        maxTotalTimeout: this.config.network?.maxTotalTimeoutMs,
        signal: this.abortController?.signal,
      }
    );

    return result.messages;
  }

  async getPrompts(): Promise<Prompt[]> {
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

  async getTool(name: string): Promise<Tool | undefined> {
    const tools = await this.getTools();

    return tools.find((tool) => tool.name === name);
  }

  async getTools(): Promise<Tool[]> {
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

  async getResources(): Promise<Resource[]> {
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

  private appendPrefix<T extends { name: string }>(value: T): T {
    return { ...value, name: `${this.config.name}.${value.name}` };
  }

  private removePrefix(name: string) {
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

    this.emit(McpEvent.CONNECTED, undefined);

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

      this.emit(McpEvent.DISCONNECTED, undefined);

      if (this.abortController?.signal.aborted) {
        return;
      }

      this.abortController?.abort();
    } finally {
      this.abortController = null;
      this.tools.length = 0;
      this.prompts.length = 0;
      this.resources.length = 0;
    }
  }

  async safeConnect() {
    return await safeZone(() => this.connect());
  }

  async safeDisconnect() {
    return await safeZone(() => this.disconnect());
  }

  emit<K extends keyof McpEventMap>(key: K, value: McpEventMap[K]): boolean {
    return super.emit(key, value);
  }

  on<K extends keyof McpEventMap>(key: K, handler: (v: McpEventMap[K]) => void): this {
    return super.on(key, handler);
  }

  private async connectIfNotConnected() {
    if (!this.isConnected()) {
      await this.connect();
    }
  }

  private registerMaxIdleTimeoutScheduler() {
    const maxConnectionIdleTimeoutMs = this.config.network?.maxConnectionIdleTimeoutMs;

    if (maxConnectionIdleTimeoutMs) {
      this.scheduler = Scheduler.create(Math.min(maxConnectionIdleTimeoutMs, 10000));

      this.scheduler.start(async () => {
        if (this.lastUsedTime + maxConnectionIdleTimeoutMs < Date.now()) {
          await this.safeDisconnect();
        }
      });
    }
  }

  private updateLastUsedTime() {
    this.lastUsedTime = Date.now();
  }
}

export type McpContent = TextContent | ImageContent | AudioContent;

export type InvokeToolResult = {
  isError: boolean;
  contents: Array<McpContent>;
  resumptionToken?: string;
};

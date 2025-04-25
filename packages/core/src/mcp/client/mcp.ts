import { Client } from '@modelcontextprotocol/sdk/client/index';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport';
import {
  Prompt,
  Resource,
  ServerCapabilities,
  Tool,
  ResourceContents,
  PromptMessage,
} from '@modelcontextprotocol/sdk/types';
import { safeZone } from '../../utils/safeZone';
import { StdioMcpConfig } from './mcp-config';
import EventEmitter from 'node:events';
import { McpEvent, McpEventMap } from './mcp-event';

/**
 * mcp is a client for the MCP protocol.
 * mcp 도구를 한번 감싼 클래스로 mcp 도구의 기능을 확장합니다.
 */
export class Mcp extends EventEmitter {
  private abortController: AbortController | null = null;

  constructor(
    private readonly client: Client,
    private readonly transport: Transport,
    private readonly config: StdioMcpConfig
  ) {
    super();
  }

  static create(config: StdioMcpConfig) {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
      cwd: config.cwd,
    });

    const client = new Client({
      name: config.name,
      version: config.version,
    });

    return new Mcp(client, transport, config);
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
    const capabilities = await this.client.getServerCapabilities();

    return capabilities;
  }

  async invokeTool(
    tool: Tool,
    option?: { resumptionToken?: string; input?: Record<string, unknown> }
  ): Promise<InvokeToolResult> {
    let freshResumptionToken: string | undefined;

    const result = await this.client.callTool(
      {
        name: this.removePrefix(tool.name),
        arguments: option?.input,
      },
      undefined,
      {
        timeout: this.config.network?.timeout,
        maxTotalTimeout: this.config.network?.maxTotalTimeout,
        resetTimeoutOnProgress: true,
        signal: this.abortController?.signal,
        onprogress: (progress) => {
          this.emit(McpEvent.ON_PROGRESS, { type: 'tool', name: tool.name, progress });
        },
        resumptionToken: option?.resumptionToken,
        onresumptiontoken: (token) => (freshResumptionToken = token),
      }
    );

    return { result, resumptionToken: freshResumptionToken };
  }

  async getResource(uri: string): Promise<ResourceContents[]> {
    const resource = await this.client.readResource(
      { uri },
      {
        timeout: this.config.network?.timeout,
        maxTotalTimeout: this.config.network?.maxTotalTimeout,
        signal: this.abortController?.signal,
      }
    );

    return resource.contents;
  }

  async getPrompt(name: string, input?: Record<string, string>): Promise<PromptMessage[]> {
    const result = await this.client.getPrompt(
      { name: this.removePrefix(name), arguments: input },
      {
        timeout: this.config.network?.timeout,
        maxTotalTimeout: this.config.network?.maxTotalTimeout,
        signal: this.abortController?.signal,
      }
    );

    return result.messages;
  }

  async getPrompts(): Promise<Prompt[]> {
    // TODO 페이징 처리 고민
    const { prompts } = await this.client.listPrompts();
    return prompts.map((prompt) => this.appendPrefix(prompt));
  }

  async getTools(): Promise<Tool[]> {
    // TODO 페이징 처리 고민
    const { tools } = await this.client.listTools();
    return tools.map((tool) => this.appendPrefix(tool));
  }

  async getResources(): Promise<Resource[]> {
    // TODO 페이징 처리 고민
    const { resources } = await this.client.listResources();
    return resources.map((resource) => this.appendPrefix(resource));
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
      timeout: this.config.network?.timeout,
      maxTotalTimeout: this.config.network?.maxTotalTimeout,
    });

    this.emit(McpEvent.CONNECTED, undefined);
  }

  async disconnect() {
    if (!this.isConnected()) {
      return;
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
}

export type InvokeToolResult = {
  result: Record<string, unknown>;
  resumptionToken?: string;
};

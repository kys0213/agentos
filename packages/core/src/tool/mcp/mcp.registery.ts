import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Mcp } from './mcp';
import { McpConfig } from './mcp-config';

export class McpRegistry {
  private storage: Map<McpName, Mcp> = new Map();

  private onRegisterFunctions: OnRegisterFunction[] = [];
  private onUnregisterFunctions: OnUnregisterFunction[] = [];

  onRegister(fn: OnRegisterFunction) {
    this.onRegisterFunctions.push(fn);
  }

  onUnregister(fn: OnUnregisterFunction) {
    this.onUnregisterFunctions.push(fn);
  }

  async getAll(): Promise<Mcp[]> {
    return Array.from(this.storage.values());
  }

  async getTool(name: string): Promise<{ mcp: Mcp; tool: Tool } | null> {
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

  async getToolOrThrow(name: string) {
    const result = await this.getTool(name);

    if (!result) {
      throw new Error(`Tool ${name} not found`);
    }

    return result;
  }

  async register(config: McpConfig) {
    const mcp = Mcp.create(config);

    await mcp.connect();

    this.storage.set(config.name, mcp);

    for (const onRegister of this.onRegisterFunctions) {
      onRegister(mcp);
    }
  }

  async get(name: McpName) {
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

  async getOrThrow(name: McpName) {
    const mcp = await this.get(name);

    if (!mcp) {
      throw new Error(`Mcp ${name} is not registered`);
    }

    return mcp;
  }

  isRegistered(name: McpName) {
    return this.storage.has(name);
  }

  async unregister(name: McpName) {
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

  private parseMcpAndToolName(name: string) {
    const index = name.indexOf('.');

    if (index === -1) {
      return { mcpName: name, toolName: null };
    }

    const mcpName = name.substring(0, index);
    const toolName = name.substring(index + 1);

    return { mcpName, toolName };
  }
}

type McpName = string;

export interface OnRegisterFunction {
  (mcp: Mcp): void;
}

export interface OnUnregisterFunction {
  (mcp: Mcp): void;
}

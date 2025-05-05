import { Mcp } from './mcp';
import { StdioMcpConfig } from './mcp-config';

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

  async register(config: StdioMcpConfig) {
    const mcp = Mcp.create(config);

    await mcp.connect();

    this.storage.set(config.name, mcp);

    for (const fn of this.onRegisterFunctions) {
      fn(mcp);
    }
  }

  get(name: McpName) {
    return this.storage.get(name);
  }

  getOrThrow(name: McpName) {
    const mcp = this.get(name);

    if (!mcp) {
      throw new Error(`Mcp ${name} is not registered`);
    }

    return mcp;
  }

  isRegistered(name: McpName) {
    return this.storage.has(name);
  }

  async unregister(name: McpName) {
    const mcp = this.get(name);

    if (!mcp) {
      return;
    }

    const result = await mcp.safeDisconnect();

    this.storage.delete(name);

    for (const fn of this.onUnregisterFunctions) {
      fn(mcp);
    }

    return result;
  }

  async unregisterAll() {
    await Promise.all(Array.from(this.storage.values()).map((mcp) => mcp.safeDisconnect()));

    this.storage.clear();
  }
}

type McpName = string;

export interface OnRegisterFunction {
  (mcp: Mcp): void;
}

export interface OnUnregisterFunction {
  (mcp: Mcp): void;
}

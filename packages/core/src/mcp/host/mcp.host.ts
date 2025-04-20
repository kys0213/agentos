import { IMcpHost } from './i-mcp-host';
import { McpSession } from './mcp-session';

export class McpHost implements IMcpHost {
  constructor() {}

  use(): Promise<McpSession>;
  use(preset: Preset): Promise<McpSession>;
  async use(preset?: Preset): Promise<McpSession> {
    if (preset) {
      return new McpSession();
    }

    return new McpSession();
  }

  async use(preset: Preset): Promise<McpSession> {
    return new McpSession();
  }
}

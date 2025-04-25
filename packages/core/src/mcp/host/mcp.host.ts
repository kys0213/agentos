import { Preset } from '../../preset/preset';
import { McpRegistry } from '../client/mcp.registery';
import { IMcpHost } from './i-mcp-host';
import { ChatSession } from '../../session/chat-session';
import { ChatSessionLoader } from '../../session/mcp-session.loader';

export class McpHost implements IMcpHost {
  constructor(
    private readonly mcpRegistry: McpRegistry,
    private readonly sessionLoader: ChatSessionLoader
  ) {}

  use(): Promise<ChatSession>;
  use(session: string): Promise<ChatSession>;
  use(preset: Preset): Promise<ChatSession>;
  async use(preset?: Preset | string): Promise<ChatSession> {
    if (typeof preset === 'string') {
      const session = await this.sessionLoader.load(preset);
      return session;
    }

    if (preset) {
      const enabledMcp = preset.enabledMcps.map((mcp) => this.mcpRegistry.getOrThrow(mcp));

      return { sessionId: '123' };
    }

    return { sessionId: '123' };
  }
}

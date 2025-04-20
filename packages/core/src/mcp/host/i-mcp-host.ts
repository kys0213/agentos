import { Preset } from '../../preset/preset';
import { McpSession } from './mcp-session';

export interface IMcpHost {
  use(): Promise<McpSession>;
  use(preset: Preset): Promise<McpSession>;
}

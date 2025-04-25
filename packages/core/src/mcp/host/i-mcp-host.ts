import { Preset } from '../../preset/preset';
import { ChatSession } from '../../session/chat-session';

export interface IMcpHost {
  use(): Promise<ChatSession>;
  use(session: string): Promise<ChatSession>;
  use(preset: Preset): Promise<ChatSession>;
}

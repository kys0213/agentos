import { ChatSessionMetadata } from '../chat-session-metata';

export interface FileBasedSessionMetadata extends ChatSessionMetadata {
  latestMessageId: number;
}

import { ChatSessionMetadata } from '../chat-session-metata';

export interface FileBasedSessionMetadata extends ChatSessionMetadata {
  /**
   * The latest message id of the session
   */
  latestMessageId: number;
}

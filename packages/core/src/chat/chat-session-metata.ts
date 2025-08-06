import { LlmUsage } from 'llm-bridge-spec';
import { Checkpoint } from './chat-session';
import { MessageHistory } from './chat-session';
import { AgentMetadata } from '../agent/agent-metadata';

export interface ChatSessionMetadata {
  /**
   * The id of the session
   */
  sessionId: string;

  /**
   * The created at of the session
   */
  createdAt: Date;

  /**
   * The updated at of the session
   */
  updatedAt: Date;

  /**
   * The title of the session
   */
  title?: string;

  /**
   * The total messages of the session
   */
  totalMessages: number;

  /**
   * The total usage of the session
   */
  totalUsage: LlmUsage;

  /**
   * The latest summary of the session
   */
  latestSummary?: MessageHistory;

  /**
   * The recent messages of the session
   */
  recentMessages: MessageHistory[];

  /**
   * The latest checkpoint of the session
   */
  latestCheckpoint?: Checkpoint;

  /**
   * The joined agents of the session
   */
  joinedAgents: AgentMetadata[];
}

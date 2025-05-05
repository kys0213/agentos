import { LlmUsage } from 'llm-bridge-spec';
import { Checkpoint } from './chat-session';
import { Preset } from '../preset/preset';
import { MessageHistory } from './chat-session';

export interface ChatSessionMetadata {
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  totalMessages: number;
  totalUsage: LlmUsage;
  preset?: Preset;
  latestSummary?: MessageHistory;
  recentMessages: MessageHistory[];
  latestCheckpoint?: Checkpoint;
}

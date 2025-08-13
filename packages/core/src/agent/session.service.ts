import type { AgentSession } from './agent-session';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import type { MessageHistory } from '../chat/chat-session';
import type { UserMessage } from 'llm-bridge-spec';

export interface SessionListItem {
  id: string; // sessionId
  agentId: string;
  updatedAt: Date;
  title?: string;
  status?: 'idle' | 'running' | 'waiting-input' | 'terminated' | 'error';
}

export interface SessionService {
  create(
    agentId: string,
    options?: { sessionId?: string; presetId?: string }
  ): Promise<AgentSession>;
  get(sessionId: string): Promise<AgentSession>;
  list(options?: {
    agentId?: string;
    pagination?: CursorPagination;
  }): Promise<CursorPaginationResult<SessionListItem>>;
  chat(
    sessionId: string,
    input: UserMessage | UserMessage[],
    options?: { abortSignal?: AbortSignal; timeout?: number }
  ): Promise<Readonly<MessageHistory>[]>;
  terminate(sessionId: string): Promise<void>;
}

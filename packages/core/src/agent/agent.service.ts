import type { Agent } from './agent';
import type { AgentSession } from './agent-session';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import type { AgentExecuteOptions, AgentChatResult } from './agent';
import type { UserMessage } from 'llm-bridge-spec';
import type { AgentSearchQuery } from './agent-search';

export interface AgentService {
  getAgent(agentId: string): Promise<Agent | null>;
  listAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>>;
  searchAgents(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Agent>>;

  createSession(
    agentId: string,
    options?: { sessionId?: string; presetId?: string }
  ): Promise<AgentSession>;
  execute(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult>;
}

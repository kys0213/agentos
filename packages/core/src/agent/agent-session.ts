import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import type { MessageHistory } from '../chat/chat-session';
import type { UserMessage } from 'llm-bridge-spec';
import { Unsubscribe } from '../common/event/event-subscriber';

export type AgentSessionStatus = 'idle' | 'running' | 'waiting-input' | 'terminated' | 'error';

export type AgentSessionEventMap = {
  message: { message: MessageHistory };
  status: { state: AgentSessionStatus; detail?: string };
  error: { error: Error };
  terminated: { by: 'user' | 'timeout' | 'agent' };
  promptRequest: { id: string; message: string; schema?: unknown };
  consentRequest: { id: string; reason: string; data?: unknown };
  sensitiveInputRequest: {
    id: string;
    fields: Array<{ key: string; label: string; secret?: boolean }>;
  };
};

export type AgentSessionEvent = keyof AgentSessionEventMap;

export interface AgentSession {
  readonly agentId: string;
  readonly sessionId: string;

  chat(
    input: UserMessage | UserMessage[],
    options?: { abortSignal?: AbortSignal; timeout?: number }
  ): Promise<Readonly<MessageHistory>[]>;

  getHistory(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>>;

  terminate(): Promise<void>;

  on<E extends AgentSessionEvent>(
    event: E,
    handler: (payload: AgentSessionEventMap[E]) => void
  ): Unsubscribe;

  providePromptResponse(requestId: string, response: string): Promise<void>;
  provideConsentDecision(requestId: string, accepted: boolean): Promise<void>;
  provideSensitiveInput(requestId: string, values: Record<string, string>): Promise<void>;
}

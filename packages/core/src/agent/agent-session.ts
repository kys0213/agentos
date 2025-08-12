import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import type { MessageHistory } from '../chat/chat-session';
import type { UserMessage } from 'llm-bridge-spec';

export type AgentSessionEventMap = {
  message: { message: MessageHistory };
  status: { state: 'idle' | 'running' | 'waiting-input' | 'terminated' | 'error'; detail?: string };
  error: { error: Error };
  terminated: { by: 'user' | 'timeout' | 'agent' };
  promptRequest: { id: string; message: string; schema?: unknown };
  consentRequest: { id: string; reason: string; data?: unknown };
  sensitiveInputRequest: {
    id: string;
    fields: Array<{ key: string; label: string; secret?: boolean }>;
  };
};

export interface AgentSession {
  readonly id: string;

  chat(
    input: UserMessage | UserMessage[],
    options?: { abortSignal?: AbortSignal; timeout?: number }
  ): Promise<Readonly<MessageHistory>[]>;

  getHistory(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>>;

  terminate(): Promise<void>;

  on<E extends keyof AgentSessionEventMap>(
    event: E,
    handler: (payload: AgentSessionEventMap[E]) => void
  ): () => void;

  providePromptResponse(requestId: string, response: string): Promise<void>;
  provideConsentDecision(requestId: string, accepted: boolean): Promise<void>;
  provideSensitiveInput(requestId: string, values: Record<string, string>): Promise<void>;
}

import { Message, UserMessage } from 'llm-bridge-spec';

export interface Agent {
  run(
    content: UserMessage[],
    options?: {
      abortSignal?: AbortSignal;
      sessionId?: string;
    }
  ): Promise<Message[]>;
}

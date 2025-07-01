import { ChatSession } from '@agentos/core';

export interface ConversationStore {
  findThread(id: string): Promise<ConversationThread | null>;
}

export interface ConversationThread {
  getSession(): Promise<ChatSession>;
}

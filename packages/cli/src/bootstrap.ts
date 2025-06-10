import { ChatManager } from '@agentos/core';
import { createManager } from './chat-manager';

export interface AppContext {
  chatManager: ChatManager;
}

let context: AppContext | null = null;

export function bootstrap(): AppContext {
  if (!context) {
    const chatManager = createManager();
    context = { chatManager };
  }
  return context;
}

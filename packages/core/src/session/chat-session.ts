export interface ChatSession {
  sessionId: string;
}

export class ChatSessionImpl implements ChatSession {
  constructor(public readonly sessionId: string) {}
}

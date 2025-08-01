import { Message, UserMessage } from 'llm-bridge-spec';
export interface Agent {
    run(content: UserMessage[], options?: {
        abortSignal?: AbortSignal;
    }): Promise<Message[]>;
}
//# sourceMappingURL=agent.d.ts.map
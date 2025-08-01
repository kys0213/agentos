import { LlmBridge, Message, UserMessage } from 'llm-bridge-spec';
import { ChatSession } from '../chat/chat-session';
import { McpRegistry } from '../mcp/mcp.registery';
import { Agent } from './agent';
export declare class SimpleAgent implements Agent {
    private readonly llmBridge;
    private readonly chatSession;
    private readonly mcpRegistry;
    private readonly maxToolCallCount;
    constructor(llmBridge: LlmBridge, chatSession: ChatSession, mcpRegistry: McpRegistry, maxToolCallCount?: number);
    run(messages: UserMessage[], options?: {
        abortSignal?: AbortSignal;
    }): Promise<Message[]>;
    private getEnabledTools;
    private invoke;
    private invokeWithTool;
    private toLlmBridgeTool;
    private toMultiModalContents;
}
//# sourceMappingURL=simple-agent.d.ts.map
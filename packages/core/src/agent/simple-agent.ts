import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  AssistantMessage,
  LlmBridge,
  LlmBridgeResponse,
  LlmBridgeTool,
  Message,
  MultiModalContent,
  ToolCall,
  ToolMessage,
  UserMessage,
} from 'llm-bridge-spec';
import { ChatSession } from '../chat/chat-session';
import { ChatManager } from '../chat/chat.manager';
import { McpContent } from '../tool/mcp/mcp';
import { McpRegistry } from '../tool/mcp/mcp.registery';
import { Agent, AgentChatResult, AgentExecuteOptions } from './agent';
import { DefaultAgentSession } from './simple-agent-session';
import { AgentMetadata, ReadonlyAgentMetadata } from './agent-metadata';
import { validation } from '@agentos/lang';
import { Errors } from '../common/error/core-error';
import type { AgentEvent } from './agent-events';
import type { Unsubscribe } from '../common/event/event-subscriber';
import { AgentMetadataRepository } from './agent-metadata.repository';

const { isNonEmptyArray } = validation;

export class SimpleAgent implements Agent {
  private readonly activeSessions = new Map<string, ChatSession>();
  private readonly agentEventHandlers = new Set<(e: AgentEvent) => void>();

  constructor(
    public readonly id: string,
    private readonly llmBridge: LlmBridge,
    private readonly mcpRegistry: McpRegistry,
    private readonly chatManager: ChatManager,
    private readonly agentMetadataRepository: AgentMetadataRepository
  ) {}

  async update(patch: Partial<AgentMetadata>): Promise<void> {
    await this.agentMetadataRepository.update(this.id, patch);
  }

  async delete(): Promise<void> {
    await this.agentMetadataRepository.delete(this.id);
  }

  async isActive(): Promise<boolean> {
    const metadata = await this.getMetadata();
    return metadata.status === 'active';
  }

  async isIdle(): Promise<boolean> {
    const metadata = await this.getMetadata();
    return metadata.status === 'idle';
  }

  async isInactive(): Promise<boolean> {
    const metadata = await this.getMetadata();
    return metadata.status === 'inactive';
  }
  async isError(): Promise<boolean> {
    const metadata = await this.getMetadata();
    return metadata.status === 'error';
  }

  async getMetadata(): Promise<ReadonlyAgentMetadata> {
    return await this.agentMetadataRepository.getOrThrow(this.id);
  }

  async chat(messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentChatResult> {
    const chatSession = options?.sessionId
      ? await this.chatManager.getSession({ sessionId: options?.sessionId, agentId: this.id })
      : await this.chatManager.create({ agentId: this.id });

    try {
      const buffer: Message[] = Array.from(messages);

      const tools = await this.getEnabledTools();

      const response = await this.invoke(buffer, tools, chatSession, options);

      buffer.push({
        role: 'assistant',
        content: response.content,
      });

      return {
        messages: buffer,
        sessionId: chatSession.sessionId,
      };
    } finally {
      await this.update({ lastUsed: new Date() });
    }
  }

  async createSession(options?: { sessionId?: string; presetId?: string }) {
    const chatSession = options?.sessionId
      ? await this.chatManager.getSession({ sessionId: options.sessionId, agentId: this.id })
      : await this.chatManager.create({ agentId: this.id });

    this.activeSessions.set(chatSession.sessionId, chatSession);

    await this.agentMetadataRepository.addActiveSessionCount(this.id);

    this.emitAgentEvent({
      type: 'sessionCreated',
      agentId: this.id,
      sessionId: chatSession.sessionId,
    });

    const session = new DefaultAgentSession(
      chatSession,
      this.llmBridge,
      this.mcpRegistry,
      await this.getMetadata(),
      async (sessionId) => this.endSession(sessionId)
    );

    // Bridge session errors to agent-level errors
    session.on('error', ({ error }) => {
      this.emitAgentEvent({ type: 'error', agentId: this.id, error });
    });

    return session;
  }

  /**
   * 세션을 종료합니다.
   *
   * @param sessionId - 종료할 세션 ID
   */
  async endSession(sessionId: string): Promise<void> {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
    }
    await this.agentMetadataRepository.minusActiveSessionCount(this.id);
    this.emitAgentEvent({ type: 'sessionEnded', agentId: this.id, sessionId });
  }

  async idle(): Promise<void> {
    await this.update({ status: 'idle' });
    this.emitAgentEvent({ type: 'statusChanged', agentId: this.id, status: 'idle' });
  }

  async activate(): Promise<void> {
    await this.update({ status: 'active' });
    this.emitAgentEvent({ type: 'statusChanged', agentId: this.id, status: 'active' });
  }

  async inactive(): Promise<void> {
    await this.update({ status: 'inactive' });
    this.emitAgentEvent({ type: 'statusChanged', agentId: this.id, status: 'inactive' });
  }

  private async getEnabledTools(): Promise<LlmBridgeTool[]> {
    const registry = await this.mcpRegistry.getAll();
    const mcps = Array.isArray(registry) ? registry : [];

    const metadata = await this.getMetadata();

    const enabledMcps = metadata.preset.enabledMcps;

    if (!isNonEmptyArray(enabledMcps)) {
      const tools = await Promise.all(mcps.map(async (mcp) => await mcp.getTools()));

      return tools.flat().map(this.toLlmBridgeTool);
    }

    const foundTools = await Promise.all(
      enabledMcps.map(async (enabledMcp) => {
        const mcp = await this.mcpRegistry.getOrThrow(enabledMcp.name);
        const tools = await mcp.getTools();

        if (!isNonEmptyArray(enabledMcp.enabledTools)) {
          return tools;
        }

        const enabledTools = enabledMcp.enabledTools;

        const filteredTools = tools.filter((tool) =>
          enabledTools.some((enabledTool) => enabledTool.name === tool.name)
        );

        return filteredTools;
      })
    );

    return foundTools.flat().map(this.toLlmBridgeTool);
  }

  private async invoke(
    messages: Message[],
    tools: LlmBridgeTool[],
    chatSession: ChatSession,
    options?: AgentExecuteOptions
  ): Promise<LlmBridgeResponse> {
    const response = await this.llmBridge.invoke({ messages }, { tools });

    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      content: response.content,
    };

    await chatSession.appendMessage(assistantMessage);

    if (response.usage) {
      await chatSession.sumUsage(response.usage);
    }

    if (!isNonEmptyArray(response.toolCalls)) {
      return response;
    }

    messages.push(assistantMessage);

    return await this.invokeWithTool(messages, response.toolCalls, tools, chatSession, options);
  }

  private async invokeWithTool(
    messages: Message[],
    toolCalls: ToolCall[],
    tools: LlmBridgeTool[],
    chatSession: ChatSession,
    options?: AgentExecuteOptions
  ) {
    for (let i = 0; i < (options?.maxTurnCount ?? 3); i++) {
      if (options?.abortSignal?.aborted) {
        throw Errors.aborted('session', 'stopped by abort signal');
      }

      const mcpAndTools = await Promise.all(
        toolCalls!.map(async (toolCall) => {
          const mcpAndTool = await this.mcpRegistry.getToolOrThrow(toolCall.name);
          return { toolCall, mcpAndTool };
        })
      );

      const toolMessages: ToolMessage[] = [];

      for (const { toolCall, mcpAndTool } of mcpAndTools) {
        const { mcp, tool } = mcpAndTool;

        const { contents, isError } = await mcp.invokeTool(tool, { input: toolCall.arguments });

        if (isError) {
          throw Errors.operationFailed('mcp', 'Tool call failed', {
            reason: contents && contents[0] && (contents[0] as any).text,
          });
        }

        const toolMessage: ToolMessage = {
          role: 'tool',
          content: this.toMultiModalContents(contents),
          name: tool.name,
          toolCallId: toolCall.toolCallId,
        };

        toolMessages.push(toolMessage);

        if (chatSession) {
          await chatSession.appendMessage(toolMessage);
        }
      }

      const llmResponse = await this.llmBridge.invoke({ messages: messages }, { tools });

      if (!isNonEmptyArray(llmResponse.toolCalls)) {
        return llmResponse;
      }
    }

    throw Errors.operationFailed('mcp', 'Tool call count exceeded');
  }

  private toLlmBridgeTool(tool: Tool): LlmBridgeTool {
    return {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.parameters as Record<string, unknown>,
    };
  }

  private toMultiModalContents(contents: McpContent[]): MultiModalContent[] {
    return contents.map((content): MultiModalContent => {
      if (content.type === 'text') {
        return {
          contentType: content.type,
          value: content.text,
        };
      }

      return {
        contentType: content.type,
        value: Buffer.from(content.data),
      };
    });
  }

  // Agent event source
  on(handler: (event: AgentEvent) => void): Unsubscribe {
    this.agentEventHandlers.add(handler);
    return () => this.agentEventHandlers.delete(handler);
  }

  private emitAgentEvent(event: AgentEvent) {
    for (const h of this.agentEventHandlers) {
      try {
        h(event);
      } catch {
        // ignore handler errors
      }
    }
  }
}

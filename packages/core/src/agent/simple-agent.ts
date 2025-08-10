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
import { AgentMetadata, ReadonlyAgentMetadata } from './agent-metadata';

export class SimpleAgent implements Agent {
  private readonly activeSessions = new Map<string, ChatSession>();

  constructor(
    private readonly llmBridge: LlmBridge,
    private readonly mcpRegistry: McpRegistry,
    private readonly chatManager: ChatManager,
    private readonly _metadata: AgentMetadata
  ) {}

  get id(): string {
    return this._metadata.id;
  }

  async isActive(): Promise<boolean> {
    return this._metadata.status === 'active';
  }
  async isIdle(): Promise<boolean> {
    return this._metadata.status === 'idle';
  }
  async isInactive(): Promise<boolean> {
    return this._metadata.status === 'inactive';
  }
  async isError(): Promise<boolean> {
    return this._metadata.status === 'error';
  }

  async getMetadata(): Promise<ReadonlyAgentMetadata> {
    return this._metadata;
  }

  async chat(messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentChatResult> {
    const chatSession = options?.sessionId
      ? await this.chatManager.getSession(options?.sessionId)
      : await this.chatManager.create();

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
      this._metadata.lastUsed = new Date();
    }
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
  }

  async idle(): Promise<void> {
    this._metadata.status = 'idle';
  }

  async activate(): Promise<void> {
    this._metadata.status = 'active';
  }

  async inactive(): Promise<void> {
    this._metadata.status = 'inactive';
  }

  private async getEnabledTools(): Promise<LlmBridgeTool[]> {
    const mcps = await this.mcpRegistry.getAll();

    const enabledMcps = this._metadata.preset.enabledMcps;

    if (!enabledMcps || enabledMcps.length === 0) {
      const tools = await Promise.all(mcps.map(async (mcp) => await mcp.getTools()));

      return tools.flat().map(this.toLlmBridgeTool);
    }

    const foundTools = await Promise.all(
      enabledMcps.map(async (enabledMcp) => {
        const mcp = await this.mcpRegistry.getOrThrow(enabledMcp.name);
        const tools = await mcp.getTools();

        if (enabledMcp.enabledTools.length === 0) {
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

    if (!response.toolCalls || response.toolCalls?.length === 0) {
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
        throw new Error('stopped by abort signal');
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
          throw new Error('Tool call failed reason: ' + contents[0].text);
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

      if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
        return llmResponse;
      }
    }

    throw new Error('Tool call count exceeded');
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
}

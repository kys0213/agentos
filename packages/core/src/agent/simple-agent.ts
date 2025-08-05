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
import { McpRegistry } from '../tool/mcp/mcp.registery';
import { McpContent } from '../tool/mcp/mcp';
import { Preset } from '../preset/preset';
import { Agent, AgentExecuteOptions, AgentRunResult, AgentStatus } from './agent';
import { AgentMetadata } from './agent-metadata';

export class SimpleAgent implements Agent {
  // 상태 관리
  private _status: AgentStatus = 'idle';
  private _lastActivity?: Date;

  private readonly activeSessions = new Map<string, ChatSession>();

  constructor(
    private readonly llmBridge: LlmBridge,
    private readonly mcpRegistry: McpRegistry,
    private readonly chatManager: ChatManager,
    private readonly metadata: AgentMetadata,
    public readonly preset: Preset
  ) {}

  get id(): string {
    return this.metadata.id;
  }

  get name(): string {
    return this.metadata.name;
  }

  get description(): string {
    return this.metadata.description;
  }

  get icon(): string {
    return this.metadata.icon;
  }

  get keywords(): readonly string[] {
    return this.metadata.keywords;
  }

  get status(): AgentStatus {
    return this._status;
  }

  get lastActivity(): Date | undefined {
    return this._lastActivity;
  }

  get sessionCount(): number {
    return this.activeSessions.size;
  }

  async run(messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentRunResult> {
    const chatSession = options?.sessionId
      ? await this.chatManager.getSession(options?.sessionId)
      : await this.chatManager.create();

    const result = await this.safeRun(messages, chatSession, options);

    if (!result.isSuccess) {
      throw result.error;
    }

    return {
      messages: result.messages,
      sessionId: result.sessionId,
    };
  }

  private async safeRun(
    messages: UserMessage[],
    session: ChatSession,
    options?: AgentExecuteOptions
  ): Promise<SafeRunResult> {
    // 상태 업데이트
    this.start();

    try {
      const buffer: Message[] = Array.from(messages);

      const tools = await this.getEnabledTools();

      const response = await this.invoke(buffer, tools, session, options);

      buffer.push({
        role: 'assistant',
        content: response.content,
      });

      // 성공 시 상태 업데이트
      this.setEnd();

      return {
        isSuccess: true,
        messages: buffer,
        sessionId: session.sessionId,
      };
    } catch (error) {
      // 에러 시 상태 업데이트
      this.setError();

      return {
        isSuccess: false,
        sessionId: session.sessionId,
        error,
      };
    }
  }

  private setError() {
    this._status = 'error';
    this._lastActivity = new Date();
  }

  private setEnd() {
    this._status = this.activeSessions.size > 0 ? 'active' : 'idle';
    this._lastActivity = new Date();
  }

  private start() {
    this._status = 'busy';
    this._lastActivity = new Date();
  }

  /**
   * 세션을 종료합니다.
   *
   * @param sessionId - 종료할 세션 ID
   */
  endSession(sessionId: string): void {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);

      // 활성 세션이 없으면 idle 상태로 변경
      if (this.activeSessions.size === 0 && this._status === 'active') {
        this._status = 'idle';
      }
    }
  }

  private async getEnabledTools(): Promise<LlmBridgeTool[]> {
    const mcps = await this.mcpRegistry.getAll();

    const enabledMcps = this.preset.enabledMcps;

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

        const filteredTools = tools.filter((tool) => enabledTools.includes(tool.name));

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

type SafeRunResult =
  | {
      isSuccess: true;
      messages: Message[];
      sessionId: string;
    }
  | {
      isSuccess: false;
      error: unknown;
      sessionId: string;
    };

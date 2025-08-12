import type { AgentSession, AgentSessionEventMap } from './agent-session';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import type { MessageHistory, ChatSession } from '../chat/chat-session';
import type {
  LlmBridge,
  LlmBridgeResponse,
  LlmBridgeTool,
  ToolCall,
  UserMessage,
  Message,
  AssistantMessage,
  ToolMessage,
} from 'llm-bridge-spec';
import type { ReadonlyAgentMetadata } from './agent-metadata';
import type { McpRegistry } from '../tool/mcp/mcp.registery';

type Unsubscribe = () => void;

export class DefaultAgentSession implements AgentSession {
  private readonly handlers: Partial<{
    [K in keyof AgentSessionEventMap]: Set<(payload: AgentSessionEventMap[K]) => void>;
  }> = {};

  private getHandlerSet<E extends keyof AgentSessionEventMap>(
    event: E
  ): Set<(payload: AgentSessionEventMap[E]) => void> {
    const existing = this.handlers[event] as
      | Set<(payload: AgentSessionEventMap[E]) => void>
      | undefined;
    if (existing) return existing;
    const created: Set<(payload: AgentSessionEventMap[E]) => void> = new Set();
    // Assign without using any; index via Record<string, unknown> then cast on read
    (this.handlers as Record<string, unknown>)[event as string] = created;
    return created;
  }

  constructor(
    private readonly agentId: string,
    private readonly chatSession: ChatSession,
    private readonly llmBridge: LlmBridge,
    private readonly mcpRegistry: McpRegistry,
    private readonly agentMetadata: ReadonlyAgentMetadata,
    private readonly endSessionFn?: (sessionId: string) => Promise<void>
  ) {}

  private lastCursor: string = '';

  get id(): string {
    return this.chatSession.sessionId;
  }

  async chat(
    input: UserMessage | UserMessage[],
    options?: { abortSignal?: AbortSignal; timeout?: number }
  ): Promise<Readonly<MessageHistory>[]> {
    const messages = Array.isArray(input) ? input : [input];
    this.emit('status', { state: 'running' });
    const buffer: Message[] = Array.from(messages);
    const tools = await this.getEnabledTools();
    await this.invoke(buffer, tools, this.chatSession, {
      abortSignal: options?.abortSignal,
      timeout: options?.timeout,
      maxTurnCount: 1,
    });
    // Agent는 내부적으로 ChatSession에 메시지를 append 하므로, 최신 히스토리를 조회하여 반환
    try {
      const histories = await this.getHistory({
        cursor: this.lastCursor,
        direction: 'forward',
        limit: 100,
      } as any);
      const items = histories?.items ?? [];
      // 신규 메시지 이벤트 발행
      if (items.length > 0) {
        this.lastCursor = histories.nextCursor ?? this.lastCursor;
        for (const mh of items) {
          this.emit('message', { message: mh });
        }
      }
      this.emit('status', { state: 'idle' });
      return items;
    } catch {
      this.emit('status', { state: 'idle' });
      // 스토리지가 구현되지 않은 테스트 환경 등을 고려해 빈 배열 반환
      return [];
    }
  }

  async getHistory(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>> {
    return this.chatSession.getHistories(pagination);
  }

  async terminate(): Promise<void> {
    if (this.endSessionFn) {
      await this.endSessionFn(this.chatSession.sessionId);
    }
    this.emit('terminated', { by: 'user' });
  }

  on<E extends keyof AgentSessionEventMap>(
    event: E,
    handler: (payload: AgentSessionEventMap[E]) => void
  ): Unsubscribe {
    const set = this.getHandlerSet(event);
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  async providePromptResponse(): Promise<void> {
    // no-op (미구현 이벤트 경로)
  }
  async provideConsentDecision(): Promise<void> {
    // no-op
  }
  async provideSensitiveInput(): Promise<void> {
    // no-op
  }

  private emit<E extends keyof AgentSessionEventMap>(event: E, payload: AgentSessionEventMap[E]) {
    const set = this.getHandlerSet(event);
    for (const h of set) h(payload);
  }

  // ===== LLM/Tool orchestration (세션 로컬 구현) =====
  private async getEnabledTools(): Promise<LlmBridgeTool[]> {
    const mcps = await this.mcpRegistry.getAll();
    const enabledMcps = this.agentMetadata.preset.enabledMcps;

    if (!Array.isArray(enabledMcps) || enabledMcps.length === 0) {
      const tools = await Promise.all(mcps.map(async (mcp) => await mcp.getTools()));
      return tools.flat().map(this.toLlmBridgeTool);
    }

    const foundTools = await Promise.all(
      enabledMcps.map(async (enabled) => {
        const mcp = await this.mcpRegistry.getOrThrow(enabled.name);
        const tools = await mcp.getTools();
        if (!Array.isArray(enabled.enabledTools) || enabled.enabledTools.length === 0) {
          return tools;
        }
        const enabledTools = enabled.enabledTools;
        return tools.filter((t) => enabledTools.some((et) => et.name === t.name));
      })
    );

    return foundTools.flat().map(this.toLlmBridgeTool);
  }

  private toLlmBridgeTool(tool: any): LlmBridgeTool {
    return {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.parameters as Record<string, unknown>,
    };
  }

  private async invoke(
    messages: Message[],
    tools: LlmBridgeTool[],
    chatSession: ChatSession,
    options?: { abortSignal?: AbortSignal; timeout?: number; maxTurnCount?: number }
  ): Promise<LlmBridgeResponse> {
    this.ensureNotAborted(options?.abortSignal);
    const response = await this.invokeWithTimeout(
      () => this.llmBridge.invoke({ messages }, { tools }),
      options?.timeout
    );

    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      content: response.content,
    };
    await chatSession.appendMessage(assistantMessage);
    if ((response as any).usage) {
      await chatSession.sumUsage((response as any).usage);
    }

    if (!Array.isArray((response as any).toolCalls) || (response as any).toolCalls.length === 0) {
      return response;
    }

    messages.push(assistantMessage);
    return await this.invokeWithTool(
      messages,
      (response as any).toolCalls,
      tools,
      chatSession,
      options
    );
  }

  private async invokeWithTool(
    messages: Message[],
    toolCalls: ToolCall[],
    tools: LlmBridgeTool[],
    chatSession: ChatSession,
    options?: { abortSignal?: AbortSignal; timeout?: number; maxTurnCount?: number }
  ): Promise<LlmBridgeResponse> {
    for (let i = 0; i < (options?.maxTurnCount ?? 3); i++) {
      this.ensureNotAborted(options?.abortSignal);

      for (const toolCall of toolCalls) {
        const { mcp, tool } = await this.mcpRegistry.getToolOrThrow(toolCall.name);
        const { contents, isError } = await mcp.invokeTool(tool, { input: toolCall.arguments });
        if (isError) {
          throw new Error('Tool call failed');
        }
        const toolMessage: ToolMessage = {
          role: 'tool',
          content: this.toMultiModalContents(contents),
          name: tool.name,
          toolCallId: toolCall.toolCallId,
        };
        await chatSession.appendMessage(toolMessage);
      }

      const llmResponse = await this.invokeWithTimeout(
        () => this.llmBridge.invoke({ messages }, { tools }),
        options?.timeout
      );
      if (
        !Array.isArray((llmResponse as any).toolCalls) ||
        (llmResponse as any).toolCalls.length === 0
      ) {
        return llmResponse;
      }
      toolCalls = (llmResponse as any).toolCalls;
    }
    throw new Error('Tool call count exceeded');
  }

  private toMultiModalContents(contents: any[]): any[] {
    return contents.map((content) => {
      if (content.type === 'text') {
        return { contentType: content.type, value: content.text };
      }
      return { contentType: content.type, value: Buffer.from(content.data) };
    });
  }

  private ensureNotAborted(signal?: AbortSignal) {
    if (signal?.aborted) {
      throw new Error('stopped by abort signal');
    }
  }

  private async invokeWithTimeout<T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T> {
    if (!timeoutMs || timeoutMs <= 0) return fn();
    return await Promise.race<Promise<T>>([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
  }
}

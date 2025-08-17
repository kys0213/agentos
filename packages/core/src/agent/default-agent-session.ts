import { Tool } from '@modelcontextprotocol/sdk/types';
import type {
  LlmBridge,
  LlmBridgeResponse,
  LlmBridgeTool,
  Message,
  MultiModalContent,
  ToolMessage,
  UserMessage,
} from 'llm-bridge-spec';
import type { ChatSession, MessageHistory } from '../chat/chat-session';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import { McpContent } from '../tool/mcp/mcp';
import { Errors } from '../common/error/core-error';
import type { McpRegistry } from '../tool/mcp/mcp.registery';
import type { ReadonlyAgentMetadata } from './agent-metadata';
import type {
  AgentSession,
  AgentSessionEvent,
  AgentSessionEventMap,
  AgentSessionStatus,
} from './agent-session';
import type { Unsubscribe } from '../common/event/event-subscriber';

export class DefaultAgentSession implements AgentSession {
  private readonly handlers: Partial<
    Record<AgentSessionEvent, Set<(payload: AgentSessionEventMap[AgentSessionEvent]) => void>>
  > = {};

  private readonly promptRequests = new Map<
    string,
    { resolve: (v: string) => void; reject: (e: Error) => void }
  >();
  private readonly consentRequests = new Map<
    string,
    { resolve: (v: boolean) => void; reject: (e: Error) => void }
  >();
  private readonly sensitiveRequests = new Map<
    string,
    { resolve: (v: Record<string, string>) => void; reject: (e: Error) => void }
  >();

  constructor(
    private readonly chatSession: ChatSession,
    private readonly llmBridge: LlmBridge,
    private readonly mcpRegistry: McpRegistry,
    private readonly agentMetadata: ReadonlyAgentMetadata,
    private readonly endSessionFn?: (sessionId: string) => Promise<void>
  ) {}

  private readonly terminatedHandlers: Set<
    (payload: { by: 'user' | 'timeout' | 'agent' }) => void
  > = new Set();

  private status: AgentSessionStatus = 'idle';

  get agentId(): string {
    return this.chatSession.agentId;
  }

  get sessionId(): string {
    return this.chatSession.sessionId;
  }

  async chat(
    input: UserMessage | UserMessage[],
    options?: { abortSignal?: AbortSignal; timeout?: number }
  ): Promise<Readonly<MessageHistory>[]> {
    if (this.status !== 'idle') {
      throw Errors.operationFailed('session', 'session is not idle');
    }

    this.setStatus('running');

    const abortController = this.registerChatAbortController(options);

    try {
      // TODO 가장 마지막 checkpoint 와 checkpoint 사이의 메시지 조회 후 같이 전달해야함 ( 인터페이스 신규로 추가 필요 )

      const messages = Array.isArray(input) ? input : [input];

      const persistedMessages: MessageHistory[] = [];

      for (const message of messages) {
        const persistedMessage = await this.chatSession.appendMessage(message);
        persistedMessages.push(persistedMessage);
      }

      const tools = await this.getEnabledTools();

      const assistantMessages = await this.invoke(messages, tools, {
        abortSignal: abortController.signal,
        timeout: options?.timeout,
        maxTurnCount: 1,
      });

      // 일부 테스트 환경(mock)에서 appendMessage가 undefined를 반환할 수 있으므로 방어적으로 처리
      const safeAssistant = assistantMessages.filter((m): m is MessageHistory => Boolean(m));
      persistedMessages.push(...safeAssistant);

      return persistedMessages;
    } catch (error) {
      const err = error instanceof Error ? error : Errors.internal('session', String(error));
      this.emit('error', { error: err });
      throw err;
    } finally {
      this.setStatus('idle');
      this.terminatedHandlers.clear();
    }
  }

  private setStatus(status: AgentSessionStatus) {
    this.status = status;
    this.emit('status', { state: status });
  }

  private registerChatAbortController(
    options: { abortSignal?: AbortSignal; timeout?: number } | undefined
  ) {
    const abortController = new AbortController();

    options?.abortSignal?.addEventListener('abort', () => {
      abortController.abort();
      this.emit('status', { state: 'terminated', detail: 'stopped by user' });
    });

    this.terminatedHandlers.add((reason) => {
      abortController.abort(reason);
    });

    return abortController;
  }

  async terminate(): Promise<void> {
    if (this.endSessionFn) {
      await this.endSessionFn(this.chatSession.sessionId);
    }

    for (const handler of this.terminatedHandlers) {
      handler({ by: 'user' });
      this.terminatedHandlers.delete(handler);
    }

    this.emit('terminated', { by: 'user' });
  }

  async getHistory(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>> {
    return await this.chatSession.getHistories(pagination);
  }

  on<E extends AgentSessionEvent>(
    event: E,
    handler: (payload: AgentSessionEventMap[E]) => void
  ): Unsubscribe {
    const set = this.getHandlerSet(event);

    set.add(handler as (payload: AgentSessionEventMap[AgentSessionEvent]) => void);

    return () => {
      set.delete(handler as (payload: AgentSessionEventMap[AgentSessionEvent]) => void);
    };
  }

  async providePromptResponse(requestId: string, response: string): Promise<void> {
    const deferred = this.promptRequests.get(requestId);
    if (!deferred) {
      throw new Error(`Unknown promptRequest id: ${requestId}`);
    }
    this.promptRequests.delete(requestId);
    deferred.resolve(response);
  }

  async provideConsentDecision(requestId: string, accepted: boolean): Promise<void> {
    const deferred = this.consentRequests.get(requestId);
    if (!deferred) {
      throw new Error(`Unknown consentRequest id: ${requestId}`);
    }
    this.consentRequests.delete(requestId);
    deferred.resolve(accepted);
  }

  async provideSensitiveInput(requestId: string, values: Record<string, string>): Promise<void> {
    const deferred = this.sensitiveRequests.get(requestId);
    if (!deferred) {
      throw new Error(`Unknown sensitiveInputRequest id: ${requestId}`);
    }
    this.sensitiveRequests.delete(requestId);
    deferred.resolve(values);
  }

  private emit(event: AgentSessionEvent, payload: AgentSessionEventMap[AgentSessionEvent]) {
    const set = this.getHandlerSet(event);

    for (const handler of set) {
      handler(payload);
    }
  }

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

  private toLlmBridgeTool(tool: Tool): LlmBridgeTool {
    return {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.parameters as Record<string, unknown>,
    };
  }

  private async invoke(
    messages: Message[],
    tools: LlmBridgeTool[],
    options: { abortSignal: AbortSignal; timeout?: number; maxTurnCount?: number }
  ): Promise<MessageHistory[]> {
    this.ensureNotAborted(options.abortSignal);

    const { llmResponse, assistantMessage } = await this.invokeWithTimeout(
      () => this.llmBridge.invoke({ messages }, { tools }),
      { abortSignal: options.abortSignal, timeout: options.timeout }
    );

    if (!Array.isArray(llmResponse.toolCalls) || llmResponse.toolCalls.length === 0) {
      return [assistantMessage];
    }

    return await this.invokeWithTool(messages, llmResponse, options);
  }

  private async invokeWithTool(
    messages: Message[],
    response: LlmBridgeResponse,
    options: { abortSignal: AbortSignal; timeout?: number; maxTurnCount?: number }
  ): Promise<MessageHistory[]> {
    const toolResults: ToolMessage[] = [];

    for (let i = 0; i < (options?.maxTurnCount ?? 10); i++) {
      this.ensureNotAborted(options.abortSignal);

      for (const toolCall of response?.toolCalls ?? []) {
        const { mcp, tool } = await this.mcpRegistry.getToolOrThrow(toolCall.name);

        // 사용자 동의 요청 (Phase 2: interaction events)
        const allowed = await this.requestConsent(
          `Allow tool call: ${tool.name}?`,
          { tool: tool.name, mcp: mcp.name, arguments: toolCall.arguments },
          { abortSignal: options.abortSignal, timeout: options.timeout }
        );

        if (!allowed) {
          throw Errors.forbidden('mcp', 'tool call denied by user');
        }

        const { contents, isError } = await mcp.invokeTool(tool, { input: toolCall.arguments });

        if (isError) {
          throw Errors.operationFailed('mcp', 'Tool call failed');
        }

        const toolMessage: ToolMessage = {
          role: 'tool',
          content: this.toMultiModalContents(contents),
          name: tool.name,
          toolCallId: toolCall.toolCallId,
        };

        toolResults.push(toolMessage);

        const persistedTool = await this.chatSession.appendMessage(toolMessage);
        if (persistedTool) {
          this.emit('message', { message: persistedTool });
        }
      }

      const { llmResponse, assistantMessage } = await this.invokeWithTimeout(
        () =>
          this.llmBridge.invoke({
            messages: [...messages, ...toolResults],
          }),
        { abortSignal: options.abortSignal, timeout: options.timeout }
      );

      if (!Array.isArray(llmResponse.toolCalls) || llmResponse.toolCalls.length === 0) {
        return [assistantMessage];
      }
    }

    throw Errors.operationFailed('mcp', 'Tool call count exceeded');
  }

  private async requestConsent(
    reason: string,
    data: unknown,
    options: { abortSignal: AbortSignal; timeout?: number }
  ): Promise<boolean> {
    const id = this.createRequestId();
    this.setStatus('waiting-input');

    const decision = new Promise<boolean>((resolve, reject) => {
      this.consentRequests.set(id, { resolve, reject });

      const onAbort = () => {
        this.consentRequests.delete(id);
        reject(Errors.aborted('session', 'stopped by abort signal'));
      };
      options.abortSignal.addEventListener('abort', onAbort, { once: true });

      if (options.timeout && options.timeout > 0) {
        setTimeout(() => {
          if (this.consentRequests.has(id)) {
            this.consentRequests.delete(id);
            reject(Errors.timeout('session', 'timeout'));
          }
        }, options.timeout);
      }
    });

    this.emit('consentRequest', { id, reason, data });

    try {
      const result = await decision;
      return result;
    } finally {
      // Return to running if still active
      if (this.status === 'waiting-input') {
        this.setStatus('running');
      }
    }
  }

  private toMultiModalContents(contents: McpContent[]): MultiModalContent[] {
    return contents.map((content) => {
      if (content.type === 'text') {
        return { contentType: content.type, value: content.text };
      }
      return { contentType: content.type, value: Buffer.from(content.data) };
    });
  }

  private ensureNotAborted(signal?: AbortSignal) {
    if (signal?.aborted) {
      throw Errors.aborted('session', 'stopped by abort signal');
    }
  }

  private async invokeWithTimeout(
    fn: () => Promise<LlmBridgeResponse>,
    options: { abortSignal: AbortSignal; timeout?: number; maxTurnCount?: number }
  ): Promise<{ llmResponse: LlmBridgeResponse; assistantMessage: MessageHistory }> {
    const { abortSignal, timeout } = options;

    const promise =
      !timeout || timeout <= 0
        ? fn()
        : await Promise.race<Promise<LlmBridgeResponse>>([
            fn(),
            new Promise<LlmBridgeResponse>((_, reject) => {
              setTimeout(() => reject(Errors.timeout('session', 'timeout')), timeout);
            }),
          ]);

    const response = await promise;

    if (abortSignal.aborted) {
      throw Errors.aborted('session', 'stopped by abort signal');
    }

    const persistedAssistant = await this.chatSession.appendMessage({
      role: 'assistant',
      content: response.content,
    });
    if (persistedAssistant) {
      this.emit('message', { message: persistedAssistant });
    }

    if (response.usage) {
      await this.chatSession.sumUsage(response.usage);
    }

    // TODO : 컨텍스트 윈도우 초과시 체크포인트 저장

    return { llmResponse: response, assistantMessage: persistedAssistant };
  }

  private getHandlerSet(
    event: AgentSessionEvent
  ): Set<(payload: AgentSessionEventMap[AgentSessionEvent]) => void> {
    const existing = this.handlers[event];

    if (existing) {
      return existing;
    }

    const created: Set<(payload: AgentSessionEventMap[AgentSessionEvent]) => void> = new Set();

    this.handlers[event] = created;

    return created;
  }

  private createRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

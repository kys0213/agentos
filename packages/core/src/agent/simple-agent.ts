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
import { McpContent } from '../mcp/mcp';
import { McpRegistry } from '../mcp/mcp.registery';
import { Agent } from './agent';
import { Tool } from '@modelcontextprotocol/sdk/types';

export class SimpleAgent implements Agent {
  constructor(
    private readonly llmBridge: LlmBridge,
    private readonly chatSession: ChatSession,
    private readonly mcpRegistry: McpRegistry,
    private readonly maxToolCallCount: number = 3
  ) {}

  async run(messages: UserMessage[], options?: { abortSignal?: AbortSignal }): Promise<Message[]> {
    const buffer: Message[] = Array.from(messages);

    const tools = await this.getEnabledTools();

    const response = await this.invoke(buffer, tools, options);

    buffer.push({
      role: 'assistant',
      content: response.content,
    });

    return buffer;
  }

  private async getEnabledTools(): Promise<LlmBridgeTool[]> {
    const mcps = await this.mcpRegistry.getAll();

    const enabledMcps = this.chatSession.preset?.enabledMcps;

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
    options?: { abortSignal?: AbortSignal }
  ): Promise<LlmBridgeResponse> {
    const response = await this.llmBridge.invoke({ messages }, { tools });

    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      content: response.content,
    };

    await this.chatSession.appendMessage(assistantMessage);

    if (response.usage) {
      await this.chatSession.sumUsage(response.usage);
    }

    if (!response.toolCalls || response.toolCalls?.length === 0) {
      return response;
    }
    messages.push(assistantMessage);

    return await this.invokeWithTool(messages, response.toolCalls, tools, options);
  }

  private async invokeWithTool(
    messages: Message[],
    toolCalls: ToolCall[],
    tools: LlmBridgeTool[],
    options?: { abortSignal?: AbortSignal }
  ) {
    for (let i = 0; i < this.maxToolCallCount; i++) {
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

        await this.chatSession.appendMessage(toolMessage);
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

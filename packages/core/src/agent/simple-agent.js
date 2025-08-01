"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAgent = void 0;
class SimpleAgent {
    llmBridge;
    chatSession;
    mcpRegistry;
    maxToolCallCount;
    constructor(llmBridge, chatSession, mcpRegistry, maxToolCallCount = 3) {
        this.llmBridge = llmBridge;
        this.chatSession = chatSession;
        this.mcpRegistry = mcpRegistry;
        this.maxToolCallCount = maxToolCallCount;
    }
    async run(messages, options) {
        const buffer = Array.from(messages);
        const tools = await this.getEnabledTools();
        const response = await this.invoke(buffer, tools, options);
        buffer.push({
            role: 'assistant',
            content: response.content,
        });
        return buffer;
    }
    async getEnabledTools() {
        const mcps = await this.mcpRegistry.getAll();
        const enabledMcps = this.chatSession.preset?.enabledMcps;
        if (!enabledMcps || enabledMcps.length === 0) {
            const tools = await Promise.all(mcps.map(async (mcp) => await mcp.getTools()));
            return tools.flat().map(this.toLlmBridgeTool);
        }
        const foundTools = await Promise.all(enabledMcps.map(async (enabledMcp) => {
            const mcp = await this.mcpRegistry.getOrThrow(enabledMcp.name);
            const tools = await mcp.getTools();
            if (enabledMcp.enabledTools.length === 0) {
                return tools;
            }
            const enabledTools = enabledMcp.enabledTools;
            const filteredTools = tools.filter((tool) => enabledTools.includes(tool.name));
            return filteredTools;
        }));
        return foundTools.flat().map(this.toLlmBridgeTool);
    }
    async invoke(messages, tools, options) {
        const response = await this.llmBridge.invoke({ messages }, { tools });
        const assistantMessage = {
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
    async invokeWithTool(messages, toolCalls, tools, options) {
        for (let i = 0; i < this.maxToolCallCount; i++) {
            if (options?.abortSignal?.aborted) {
                throw new Error('stopped by abort signal');
            }
            const mcpAndTools = await Promise.all(toolCalls.map(async (toolCall) => {
                const mcpAndTool = await this.mcpRegistry.getToolOrThrow(toolCall.name);
                return { toolCall, mcpAndTool };
            }));
            const toolMessages = [];
            for (const { toolCall, mcpAndTool } of mcpAndTools) {
                const { mcp, tool } = mcpAndTool;
                const { contents, isError } = await mcp.invokeTool(tool, { input: toolCall.arguments });
                if (isError) {
                    throw new Error('Tool call failed reason: ' + contents[0].text);
                }
                const toolMessage = {
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
    toLlmBridgeTool(tool) {
        return {
            name: tool.name,
            description: tool.description ?? '',
            parameters: tool.parameters,
        };
    }
    toMultiModalContents(contents) {
        return contents.map((content) => {
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
exports.SimpleAgent = SimpleAgent;
//# sourceMappingURL=simple-agent.js.map
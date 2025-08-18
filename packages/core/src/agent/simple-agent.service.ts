import type { UserMessage } from 'llm-bridge-spec';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import type { Agent, AgentChatResult, AgentExecuteOptions } from './agent';
import type { AgentSearchQuery } from './agent-search';
import type { AgentSession } from './agent-session';
import type { AgentService } from './agent.service';
import { Errors } from '../common/error/core-error';
import { CreateAgentMetadata } from './agent-metadata';

import { LlmBridgeRegistry } from '../llm/bridge/registry';
import { SimpleAgent } from './simple-agent';
import { McpRegistry } from '../tool/mcp/mcp.registery';
import { ChatManager } from '../chat/chat.manager';
import { AgentMetadataRepository } from './agent-metadata.repository';

/**
 * A minimal AgentService implementation that wraps an existing AgentManager.
 * - Keeps backward compatibility while enabling session-centric DX.
 * - Provides simple in-memory search using getAllAgents.
 */
export class SimpleAgentService implements AgentService {
  private readonly agents = new Map<string, Agent>();

  constructor(
    private readonly llmBridgeRegistry: LlmBridgeRegistry,
    private readonly mcpRegistry: McpRegistry,
    private readonly chatManager: ChatManager,
    private readonly agentMetadataRepository: AgentMetadataRepository
  ) {}

  async createAgent(metadata: CreateAgentMetadata): Promise<Agent> {
    const llmBridge = await this.llmBridgeRegistry.getBridgeOrThrow(metadata.preset.llmBridgeName);

    const createdMetadata = await this.agentMetadataRepository.create(metadata);

    return new SimpleAgent(
      createdMetadata.id,
      llmBridge,
      this.mcpRegistry,
      this.chatManager,
      this.agentMetadataRepository
    );
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    // cache first
    if (this.agents.has(agentId)) return this.agents.get(agentId)!;

    const meta = await this.agentMetadataRepository.get(agentId);
    if (!meta) return null;

    const llmBridge =
      (await this.llmBridgeRegistry.getBridgeByName(meta.preset.llmBridgeName)) ?? null;
    if (!llmBridge) return null;

    const agent = new SimpleAgent(
      meta.id,
      llmBridge,
      this.mcpRegistry,
      this.chatManager,
      this.agentMetadataRepository
    );
    this.agents.set(agentId, agent);
    return agent;
  }

  async listAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>> {
    const metas = await this.agentMetadataRepository.list(pagination);
    const items: Agent[] = [];
    for (const m of metas.items) {
      const maybe = await this.getAgent(m.id);
      if (maybe) items.push(maybe);
    }
    return { items, nextCursor: metas.nextCursor };
  }

  async searchAgents(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Agent>> {
    // Use repository-level search first, then materialize Agents
    const metas = await this.agentMetadataRepository.search(query, pagination);
    const items: Agent[] = [];
    for (const m of metas.items) {
      const maybe = await this.getAgent(m.id);
      if (maybe) items.push(maybe);
    }
    return { items, nextCursor: metas.nextCursor };
  }

  async createSession(
    agentId: string,
    options?: { sessionId?: string; presetId?: string }
  ): Promise<AgentSession> {
    const agent = await this.getAgent(agentId);

    if (!agent) {
      throw Errors.notFound('agent', `Agent not found: ${agentId}`, { agentId });
    }

    return await agent.createSession(options);
  }

  async execute(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw Errors.notFound('agent', `Agent not found: ${agentId}`, { agentId });
    }
    return await agent.chat(messages, options);
  }

  private matchesMeta(m: Awaited<ReturnType<Agent['getMetadata']>>, q: AgentSearchQuery): boolean {
    if (q.status && m.status !== q.status) {
      return false;
    }

    if (q.name && !m.name.toLowerCase().includes(q.name.toLowerCase())) {
      return false;
    }

    if (q.description && !m.description.toLowerCase().includes(q.description.toLowerCase())) {
      return false;
    }

    if (Array.isArray(q.keywords) && q.keywords.length > 0) {
      const kw = new Set(q.keywords.map((k) => k.toLowerCase()));
      const has = m.keywords.some((k) => kw.has(k.toLowerCase()));

      if (!has) {
        return false;
      }
    }
    return true;
  }

  private paginate<T extends { id: string }>(
    items: T[],
    pagination?: CursorPagination
  ): CursorPaginationResult<T> {
    const limit = pagination?.limit ?? 20;
    const cursor = pagination?.cursor;
    let list = items;
    if (cursor) {
      const idx = items.findIndex((i) => i.id === cursor);
      if (idx >= 0) list = items.slice(idx + 1);
    }
    const page = list.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].id : '';
    return { items: page, nextCursor, hasMore: !!nextCursor };
  }
}

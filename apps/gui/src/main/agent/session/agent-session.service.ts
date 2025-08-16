import { Injectable, OnModuleInit } from '@nestjs/common';
import { app } from 'electron';
import * as path from 'path';
import type { Message, UserMessage } from 'llm-bridge-spec';
import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  ChatManager,
} from '@agentos/core';
import {
  FileBasedSessionStorage,
  FileBasedChatManager,
  McpRegistry,
  SimpleAgent,
  FileAgentMetadataRepository,
} from '@agentos/core';
import { NoopCompressor } from '../../NoopCompressor';
import { getBridgeManager } from '../../services/bridge-ipc-handlers';

@Injectable()
export class AgentSessionService implements OnModuleInit {
  private agentRepo: FileAgentMetadataRepository | null = null;
  private chatManager: ChatManager | null = null;
  private mcpRegistry: McpRegistry | null = null;

  private readonly sessions = new Map<
    string,
    { agentId: string; messages: Message[]; createdAt: Date; updatedAt: Date }
  >();

  onModuleInit() {
    // Lazy-init을 유지하되, userData 경로 가용성 확인 용도 로그
    const userDataPath = app.getPath('userData');
    // eslint-disable-next-line no-console
    console.log(`[AgentSession] using userData: ${userDataPath}`);
  }

  private getOrInitChatManager(): ChatManager {
    if (this.chatManager) return this.chatManager;
    const userDataPath = app.getPath('userData');
    const sessionsPath = path.join(userDataPath, 'sessions');
    const storage = new FileBasedSessionStorage(sessionsPath);
    const historyCompressor = new NoopCompressor();
    const titleCompressor = new NoopCompressor();
    this.chatManager = new FileBasedChatManager(storage, historyCompressor, titleCompressor);
    return this.chatManager;
  }

  private getOrInitMcpRegistry(): McpRegistry {
    if (this.mcpRegistry) return this.mcpRegistry;
    this.mcpRegistry = new McpRegistry();
    return this.mcpRegistry;
  }

  private getOrInitAgentRepo(): FileAgentMetadataRepository {
    if (this.agentRepo) return this.agentRepo;
    const userDataPath = app.getPath('userData');
    const agentsPath = path.join(userDataPath, 'agents');
    this.agentRepo = new FileAgentMetadataRepository(agentsPath);
    return this.agentRepo;
  }

  private createSimpleAgent(llmAgentId: string, metadata: AgentMetadata | null): SimpleAgent | null {
    const bridgeManager = getBridgeManager();
    const current = bridgeManager?.getCurrentBridge();
    if (!current) return null;

    const cm = this.getOrInitChatManager();
    const mr = this.getOrInitMcpRegistry();

    const baseMetadata: AgentMetadata =
      metadata ??
      ({
        id: llmAgentId,
        name: llmAgentId,
        description: '',
        icon: '🤖',
        keywords: [],
        preset: {
          id: 'default',
          name: 'Default',
          description: '',
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          systemPrompt: '',
          enabledMcps: [],
          llmBridgeName: current.id,
          llmBridgeConfig: current.config,
          status: 'active',
          usageCount: 0,
          knowledgeDocuments: 0,
          knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
          category: ['general'],
        },
        status: 'active',
        lastUsed: undefined,
        sessionCount: 0,
        usageCount: 0,
      } as AgentMetadata);
    return new SimpleAgent(current.bridge, mr, cm, baseMetadata);
  }

  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    // 활성 브릿지 있으면 SimpleAgent, 없으면 폴백 에코
    const repo = this.getOrInitAgentRepo();
    const agentMetadata = (await repo.get(agentId)) ?? null;
    const simpleAgent = this.createSimpleAgent(agentId, agentMetadata);

    if (simpleAgent) {
      const result = await simpleAgent.chat(messages, options);
      return result;
    }

    // 폴백: 세션 관리 + 에코 응답
    const sessionId = options?.sessionId ?? `session_${Date.now()}`;
    const now = new Date();
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { agentId, messages: [], createdAt: now, updatedAt: now });
    }
    const s = this.sessions.get(sessionId)!;
    const userMessages: Message[] = messages.map((m) => ({ role: 'user', content: m.content }));
    s.messages.push(...userMessages);

    const userText = messages
      .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
      .join('\n');
    const assistantReply: Message = {
      role: 'assistant',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: { type: 'text', text: `Echo: ${userText}` } as any,
    };

    s.messages.push(assistantReply);
    s.updatedAt = new Date();

    return { messages: [assistantReply], sessionId };
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    try {
      const repo = this.getOrInitAgentRepo();
      const agentMeta = (await repo.get(agentId)) ?? null;
      const simpleAgent = this.createSimpleAgent(agentId, agentMeta);
      if (simpleAgent) {
        await simpleAgent.endSession(sessionId);
      }
    } finally {
      this.sessions.delete(sessionId);
    }
  }

  async getMetadata(id: string): Promise<AgentMetadata | null> {
    const repo = this.getOrInitAgentRepo();
    return (await repo.get(id)) ?? null;
  }

  async getAllMetadatas(): Promise<AgentMetadata[]> {
    const repo = this.getOrInitAgentRepo();
    const res = await repo.list({ limit: 1000, cursor: '', direction: 'forward' });
    return res.items;
  }

  async updateAgent(
    agentId: string,
    patch: Partial<Omit<AgentMetadata, 'id'>>
  ): Promise<AgentMetadata> {
    const repo = this.getOrInitAgentRepo();
    // optimistic update: pass through to repo
    const updated = await repo.update(agentId, patch as Partial<AgentMetadata>);
    return updated;
  }

  async createAgent(agent: Omit<AgentMetadata, 'id'> & { id: string }): Promise<AgentMetadata> {
    const repo = this.getOrInitAgentRepo();
    const created = await repo.create(agent);
    return created;
  }

  async deleteAgent(id: string): Promise<AgentMetadata> {
    const repo = this.getOrInitAgentRepo();
    const existing = await repo.get(id);
    if (!existing) throw new Error(`Agent not found: ${id}`);
    await repo.delete(id);
    return existing;
  }
}


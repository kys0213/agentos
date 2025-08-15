import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  CreateAgentMetadata,
  ChatManager,
} from '@agentos/core';
import {
  FileBasedSessionStorage,
  FileBasedChatManager,
  McpRegistry,
  SimpleAgent,
  FileAgentMetadataRepository,
} from '@agentos/core';
import { app } from 'electron';
import * as path from 'path';
import { NoopCompressor } from '../NoopCompressor';
import { getBridgeManager } from './bridge-ipc-handlers';
import type { Message, UserMessage } from 'llm-bridge-spec';

// File-based metadata repository for agents
let agentRepo: FileAgentMetadataRepository | null = null;
const sessions = new Map<
  string,
  { agentId: string; messages: Message[]; createdAt: Date; updatedAt: Date }
>();

let chatManager: ChatManager | null = null;
let mcpRegistry: McpRegistry | null = null;

function getOrInitChatManager(): ChatManager {
  if (chatManager) return chatManager;
  const userDataPath = app.getPath('userData');
  const sessionsPath = path.join(userDataPath, 'sessions');
  const storage = new FileBasedSessionStorage(sessionsPath);
  const historyCompressor = new NoopCompressor();
  const titleCompressor = new NoopCompressor();
  chatManager = new FileBasedChatManager(storage, historyCompressor, titleCompressor);
  return chatManager;
}

function getOrInitMcpRegistry(): McpRegistry {
  if (mcpRegistry) return mcpRegistry;
  mcpRegistry = new McpRegistry();
  return mcpRegistry;
}

function createSimpleAgent(llmAgentId: string, metadata: AgentMetadata | null): SimpleAgent | null {
  const bridgeManager = getBridgeManager();
  const current = bridgeManager?.getCurrentBridge();
  if (!current) return null;

  const cm = getOrInitChatManager();
  const mr = getOrInitMcpRegistry();

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

function getOrInitAgentRepo(): FileAgentMetadataRepository {
  if (agentRepo) return agentRepo;
  const userDataPath = app.getPath('userData');
  const agentsPath = path.join(userDataPath, 'agents');
  agentRepo = new FileAgentMetadataRepository(agentsPath);
  return agentRepo;
}

export function setupAgentIpcHandlers() {
  ipcMain.handle(
    'agent:chat',
    async (
      _e: IpcMainInvokeEvent,
      agentId: string,
      messages: UserMessage[],
      options?: AgentExecuteOptions
    ): Promise<AgentChatResult> => {
      // 활성 브릿지가 있으면 SimpleAgent로 실행, 없으면 폴백 에코
      const repo = getOrInitAgentRepo();
      const agentMetadata = (await repo.get(agentId)) ?? null;
      const simpleAgent = createSimpleAgent(agentId, agentMetadata);

      if (simpleAgent) {
        const result = await simpleAgent.chat(messages, options);
        return result;
      }

      // 폴백: 세션 관리 + 에코 응답
      const sessionId = options?.sessionId ?? `session_${Date.now()}`;
      const now = new Date();
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { agentId, messages: [], createdAt: now, updatedAt: now });
      }
      const s = sessions.get(sessionId)!;
      const userMessages: Message[] = messages.map((m) => ({ role: 'user', content: m.content }));
      s.messages.push(...userMessages);

      const userText = messages
        .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
        .join('\n');
      const assistantReply: Message = {
        role: 'assistant',
        content: { type: 'text', text: `Echo: ${userText}` } as any,
      };

      s.messages.push(assistantReply);
      s.updatedAt = new Date();
      return { messages: [assistantReply], sessionId };
    }
  );

  ipcMain.handle(
    'agent:end-session',
    async (_e: IpcMainInvokeEvent, agentId: string, sessionId: string) => {
      try {
        const repo = getOrInitAgentRepo();
        const agentMeta = (await repo.get(agentId)) ?? null;
        const simpleAgent = createSimpleAgent(agentId, agentMeta);
        if (simpleAgent) {
          await simpleAgent.endSession(sessionId);
        }
      } finally {
        sessions.delete(sessionId);
      }
      return;
    }
  );

  ipcMain.handle('agent:get-metadata', async (_e: IpcMainInvokeEvent, id: string) => {
    const repo = getOrInitAgentRepo();
    return (await repo.get(id)) ?? null;
  });

  ipcMain.handle('agent:get-all-metadatas', async () => {
    const repo = getOrInitAgentRepo();
    const res = await repo.list({ limit: 1000, cursor: '', direction: 'forward' });
    return res.items;
  });

  ipcMain.handle(
    'agent:update',
    async (_e: IpcMainInvokeEvent, agentId: string, patch: Partial<Omit<AgentMetadata, 'id'>>) => {
      const repo = getOrInitAgentRepo();
      // optimistic update: pass through to repo
      const updated = await repo.update(agentId, patch as Partial<AgentMetadata>);
      return updated;
    }
  );

  ipcMain.handle('agent:create', async (_e: IpcMainInvokeEvent, data: CreateAgentMetadata) => {
    const repo = getOrInitAgentRepo();
    const created = await repo.create(data);
    return created;
  });

  ipcMain.handle('agent:delete', async (_e: IpcMainInvokeEvent, id: string) => {
    const repo = getOrInitAgentRepo();
    const existing = await repo.get(id);
    if (!existing) throw new Error(`Agent not found: ${id}`);
    await repo.delete(id);
    return existing;
  });

  console.log('Agent IPC handlers registered');
}

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  CreateAgentMetadata,
} from '@agentos/core';
import type { Message, UserMessage } from 'llm-bridge-spec';

// 간단한 인메모리 저장소 (임시 구현)
const agents = new Map<string, AgentMetadata>();
const sessions = new Map<
  string,
  { agentId: string; messages: Message[]; createdAt: Date; updatedAt: Date }
>();

export function setupAgentIpcHandlers() {
  ipcMain.handle(
    'agent:chat',
    async (
      _e: IpcMainInvokeEvent,
      agentId: string,
      messages: UserMessage[],
      options?: AgentExecuteOptions
    ): Promise<AgentChatResult> => {
      // 임시 구현: 세션 관리 + 에코 응답
      const sessionId = options?.sessionId ?? `session_${Date.now()}`;
      const now = new Date();

      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { agentId, messages: [], createdAt: now, updatedAt: now });
      }
      const s = sessions.get(sessionId)!;

      // 사용자 메시지 누적
      const userMessages: Message[] = messages.map((m) => ({ role: 'user', content: m.content }));
      s.messages.push(...userMessages);

      // 간단한 에코 응답 생성
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

  ipcMain.handle('agent:end-session', async (_e: IpcMainInvokeEvent, _agentId: string, sessionId: string) => {
    sessions.delete(sessionId);
    return;
  });

  ipcMain.handle('agent:get-metadata', async (_e: IpcMainInvokeEvent, id: string) => {
    return agents.get(id) ?? null;
  });

  ipcMain.handle('agent:get-all-metadatas', async () => {
    return Array.from(agents.values());
  });

  ipcMain.handle(
    'agent:update',
    async (_e: IpcMainInvokeEvent, agentId: string, patch: Partial<Omit<AgentMetadata, 'id'>>) => {
      const current = agents.get(agentId);
      if (!current) throw new Error(`Agent not found: ${agentId}`);
      const updated: AgentMetadata = { ...current, ...patch, id: current.id } as AgentMetadata;
      agents.set(agentId, updated);
      return updated;
    }
  );

  ipcMain.handle('agent:create', async (_e: IpcMainInvokeEvent, data: CreateAgentMetadata) => {
    // TODO: id 생성 로직 개선(UUID 등)
    const id = `agent_${Date.now()}`;
    const created: AgentMetadata = {
      id,
      lastUsed: undefined,
      sessionCount: 0,
      usageCount: 0,
      ...data,
    } as AgentMetadata;
    agents.set(id, created);
    return created;
  });

  ipcMain.handle('agent:delete', async (_e: IpcMainInvokeEvent, id: string) => {
    const data = agents.get(id);
    if (!data) throw new Error(`Agent not found: ${id}`);
    agents.delete(id);
    return data;
  });

  console.log('Agent IPC handlers registered');
}

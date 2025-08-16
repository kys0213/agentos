import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  ChatSessionDescription,
  CursorPagination,
  CursorPaginationResult,
  MessageHistory,
  McpConfig,
  McpToolMetadata,
  McpUsageLog,
  McpUsageStats,
  AgentStatus,
  McpConnectionStatus,
  ErrorCode,
  ErrorDomain,
  CreateAgentMetadata,
} from '@agentos/core';
import type { LlmManifest, UserMessage } from 'llm-bridge-spec';

export type Cid = string;

export type RpcFrame =
  | {
      kind: 'req';
      cid: Cid;
      method: string;
      payload?: unknown;
      meta?: { senderId?: number; rpcSpecVersion?: string; ts?: number };
    }
  | { kind: 'res'; cid: Cid; ok: true; result?: unknown }
  | {
      kind: 'err';
      cid: Cid;
      ok: false;
      message: string;
      code: ErrorCode;
      domain: ErrorDomain;
      details?: Record<string, unknown>;
    }
  | { kind: 'nxt'; cid: Cid; data: unknown; seq?: number }
  | { kind: 'end'; cid: Cid }
  | { kind: 'can'; cid: Cid };

export type RpcMethodMap = {
  'hub.getSnapshot': {
    req: void;
    res: {
      bridge: { activeId?: string; manifest?: LlmManifest };
      agents: Array<{ id: string; status: AgentStatus }>;
      sessions: CursorPaginationResult<ChatSessionDescription>;
      mcp: Array<{ name: string; status: McpConnectionStatus }>;
    };
  };
  'hub.watch': { req: void; res: { type: string; patch: unknown } };

  'agent.list': {
    req: { pagination?: CursorPagination };
    res: CursorPaginationResult<AgentMetadata>;
  };
  'agent.get': { req: { id: string }; res: AgentMetadata | null };
  'agent.create': { req: CreateAgentMetadata; res: AgentMetadata };
  'agent.update': {
    req: { id: string; patch: Partial<Omit<AgentMetadata, 'id'>> };
    res: AgentMetadata;
  };
  'agent.delete': { req: { id: string }; res: AgentMetadata };

  'agent.session.create': {
    req: { agentId: string; sessionId?: string; presetId?: string };
    res: { sessionId: string };
  };
  'agent.session.end': { req: { agentId: string; sessionId: string }; res: void };
  'agent.session.chat': {
    req: { agentId: string; input: UserMessage[]; options?: AgentExecuteOptions };
    res: AgentChatResult;
  };

  'chat.listSessions': {
    req: { pagination?: CursorPagination };
    res: CursorPaginationResult<ChatSessionDescription>;
  };
  'chat.getMessages': {
    req: { sessionId: string; pagination?: CursorPagination };
    res: CursorPaginationResult<Readonly<MessageHistory>>;
  };

  'bridge.register': { req: LlmManifest; res: { success: boolean } };
  'bridge.unregister': { req: { id: string }; res: { success: boolean } };
  'bridge.switch': { req: { id: string }; res: { success: boolean } };
  'bridge.getCurrent': { req: void; res: { id: string; config: LlmManifest } | null };
  'bridge.listIds': { req: void; res: string[] };
  'bridge.getConfig': { req: { id: string }; res: LlmManifest | null };

  'mcp.list': { req: void; res: McpConfig[] };
  'mcp.connect': { req: McpConfig; res: { success: boolean } };
  'mcp.disconnect': { req: { name: string }; res: { success: boolean } };
  'mcp.executeTool': {
    req: { clientName: string; toolName: string; args: Record<string, unknown> };
    res: { success: boolean; result?: unknown; error?: string };
  };
  'mcp.listResources': {
    req: { clientName: string };
    res: {
      resources: Array<{ uri: string; name: string; description?: string; mimeType?: string }>;
    };
  };
  'mcp.readResource': {
    req: { clientName: string; uri: string };
    res: { uri: string; mimeType?: string; content: string | ArrayBuffer };
  };
  'mcp.getStatus': { req: { clientName: string }; res: { connected: boolean; error?: string } };
  'mcp.getToolMetadata': { req: { clientName: string }; res: McpToolMetadata };
  'mcp.getAllToolMetadata': { req: void; res: McpToolMetadata[] };
  'mcp.usage.list': {
    req: { clientName?: string; range?: { start?: Date; end?: Date } };
    res: McpUsageLog[];
  };
  'mcp.usage.stats': { req: { clientName?: string }; res: McpUsageStats };
};

export interface RpcTransport {
  request<M extends keyof RpcMethodMap>(
    method: M,
    payload: RpcMethodMap[M]['req']
  ): Promise<RpcMethodMap[M]['res']>;
  stream?<M extends keyof RpcMethodMap>(
    method: M,
    payload: RpcMethodMap[M]['req']
  ): AsyncGenerator<RpcMethodMap[M]['res']>;
}

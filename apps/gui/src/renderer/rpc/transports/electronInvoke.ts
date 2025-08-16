import type { RpcMethodMap, RpcTransport } from '../types';

// DEPRECATED: Mixed service mapping in transport.
// Use channel-based ElectronIpcTransport instead for OCP compliance.
export class ElectronInvokeTransport implements RpcTransport {
  private get api() {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('ElectronAPI is not available. Ensure preload exposed it.');
    }
    return window.electronAPI;
  }

  async request<M extends keyof RpcMethodMap>(
    method: M,
    payload: RpcMethodMap[M]['req']
  ): Promise<RpcMethodMap[M]['res']> {
    switch (method as string) {
      // hub (compose from existing API calls)
      case 'hub.getSnapshot': {
        const [ids, current, sessions] = await Promise.all([
          this.api.bridge.getBridgeIds(),
          this.api.bridge.getCurrentBridge(),
          this.api.conversation.listSessions(undefined as any),
        ]);
        const mcp = (await this.api.mcp.getAllMcp()).map((c: any) => ({
          name: c.name,
          status: c.status,
        }));
        const bridge = current
          ? { activeId: current.id, manifest: current.config }
          : { activeId: undefined, manifest: undefined };
        const agents = (await this.api.agent.getAllAgentMetadatas()).map((a: any) => ({
          id: a.id,
          status: a.status,
        }));
        return { bridge, agents, sessions, mcp } as any;
      }

      // agent
      case 'agent.list': {
        const metas = await this.api.agent.getAllAgentMetadatas();
        return { items: metas, nextCursor: '', prevCursor: '' } as any;
      }
      case 'agent.get':
        return (await this.api.agent.getAgentMetadata((payload as any).id)) as any;
      case 'agent.create':
        return (await this.api.agent.createAgent(payload as any)) as any;
      case 'agent.update':
        return (await this.api.agent.updateAgent(
          (payload as any).id,
          (payload as any).patch
        )) as any;
      case 'agent.delete':
        return (await this.api.agent.deleteAgent((payload as any).id)) as any;

      // session/chat
      case 'agent.session.create':
        return {
          sessionId: (await this.api.agent.chat((payload as any).agentId, [], { maxTurnCount: 0 }))
            .sessionId,
        } as any;
      case 'agent.session.end':
        return (await this.api.agent.endSession(
          (payload as any).agentId,
          (payload as any).sessionId
        )) as any;
      case 'agent.session.chat':
        return (await this.api.agent.chat(
          (payload as any).agentId,
          (payload as any).input,
          (payload as any).options
        )) as any;

      // chat
      case 'chat.listSessions':
        return (await this.api.conversation.listSessions((payload as any)?.pagination)) as any;
      case 'chat.getMessages':
        return (await this.api.conversation.getMessages(
          (payload as any).sessionId,
          (payload as any).pagination
        )) as any;

      // bridge
      case 'bridge.register':
        return (await this.api.bridge.registerBridge(payload as any)) as any;
      case 'bridge.unregister':
        return (await this.api.bridge.unregisterBridge((payload as any).id)) as any;
      case 'bridge.switch':
        return (await this.api.bridge.switchBridge((payload as any).id)) as any;
      case 'bridge.getCurrent':
        return (await this.api.bridge.getCurrentBridge()) as any;
      case 'bridge.listIds':
        return (await this.api.bridge.getBridgeIds()) as any;
      case 'bridge.getConfig':
        return (await this.api.bridge.getBridgeConfig((payload as any).id)) as any;

      // mcp
      case 'mcp.list':
        return (await this.api.mcp.getAllMcp()) as any;
      case 'mcp.connect':
        return (await this.api.mcp.connectMcp(payload as any)) as any;
      case 'mcp.disconnect':
        return (await this.api.mcp.disconnectMcp((payload as any).name)) as any;
      case 'mcp.executeTool':
        return (await this.api.mcp.executeMcpTool(
          (payload as any).clientName,
          (payload as any).toolName,
          (payload as any).args
        )) as any;
      case 'mcp.listResources':
        return (await this.api.mcp.getMcpResources((payload as any).clientName)) as any;
      case 'mcp.readResource':
        return (await this.api.mcp.readMcpResource(
          (payload as any).clientName,
          (payload as any).uri
        )) as any;
      case 'mcp.getStatus':
        return (await this.api.mcp.getMcpStatus((payload as any).clientName)) as any;
      case 'mcp.getToolMetadata':
        return (await this.api.mcp.getToolMetadata((payload as any).clientName)) as any;
      case 'mcp.getAllToolMetadata':
        return (await this.api.mcp.getAllToolMetadata()) as any;
      case 'mcp.usage.list': {
        const p = payload as any;
        if (p?.clientName)
          return (await this.api.mcpUsageLog.getUsageLogs(p.clientName, p?.options)) as any;
        return (await this.api.mcpUsageLog.getAllUsageLogs(p?.options)) as any;
      }
      case 'mcp.usage.stats':
        return (await this.api.mcpUsageLog.getUsageStats((payload as any)?.clientName)) as any;

      default:
        throw new Error(`No mapping for RPC method: ${method as string}`);
    }
  }
}

import type { AgentStatus, Agent } from './agent';
import type { AgentMetadata } from './agent-metadata';
import type { Unsubscribe } from './agent-session';

export type AgentEvent =
  | { type: 'statusChanged'; agentId: string; status: AgentStatus }
  | { type: 'metadataUpdated'; agentId: string; patch: Partial<AgentMetadata> }
  | { type: 'sessionCreated'; agentId: string; sessionId: string }
  | { type: 'sessionEnded'; agentId: string; sessionId: string; reason?: string }
  | { type: 'error'; agentId: string; error: Error };

export interface AgentEventSource {
  on(handler: (event: AgentEvent) => void): Unsubscribe;
}

export type EventfulAgent = Agent & AgentEventSource;

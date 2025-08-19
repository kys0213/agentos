import { ServiceContainer } from '../../ipc/service-container';
import type {
  AgentMetadata,
  AgentStatus,
  ReadonlyAgentMetadata,
  CreateAgentMetadata,
} from '@agentos/core';

export async function fetchDesignAgents(): Promise<AgentMetadata[]> {
  const agentService = ServiceContainer.getOrThrow('agent');
  const metadatas = await agentService.getAllAgentMetadatas();
  return metadatas;
}

export async function updateDesignAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
  const agentService = ServiceContainer.getOrThrow('agent');
  await agentService.updateAgent(agentId, { status });
}

// Renderer-facing fetcher that returns core metadata directly
export async function fetchAgentMetadatas(): Promise<ReadonlyAgentMetadata[]> {
  const agentService = ServiceContainer.getOrThrow('agent');
  const metadatas = await agentService.getAllAgentMetadatas();
  return metadatas;
}

export async function updateAgentStatus(
  agentId: string,
  status: ReadonlyAgentMetadata['status']
): Promise<void> {
  const agentService = ServiceContainer.getOrThrow('agent');
  await agentService.updateAgent(agentId, { status });
}

export async function createAgent(data: CreateAgentMetadata): Promise<ReadonlyAgentMetadata> {
  const agentService = ServiceContainer.getOrThrow('agent');
  const created = await agentService.createAgent(data);
  return created;
}

export async function deleteAgent(id: string): Promise<ReadonlyAgentMetadata> {
  const agentService = ServiceContainer.getOrThrow('agent');
  const removed = await agentService.deleteAgent(id);
  return removed;
}

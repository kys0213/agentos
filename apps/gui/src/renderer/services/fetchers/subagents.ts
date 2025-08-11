import { ServiceContainer } from '../../../shared/ipc/service-container';
import type { AgentMetadata, AgentStatus, ReadonlyAgentMetadata } from '@agentos/core';

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

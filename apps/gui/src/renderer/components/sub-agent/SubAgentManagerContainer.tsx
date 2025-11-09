import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubAgentManager, type ChatOpenOptions } from './SubAgentManager';
import { ServiceContainer } from '../../../shared/di/service-container';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { AgentStatus, CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { AGENTS_QUERY_KEY, fetchAgents } from '../../hooks/useAppData';
import { CHAT_QUERY_KEYS } from '../../hooks/queries/use-chat';
import { serializeAgent, tryParseAgentExport, applyAgentExport } from '../../utils/agent-export';

export interface SubAgentManagerContainerProps {
  onCreateAgent?: () => void;
  onOpenChat?: (agentId: string, options?: ChatOpenOptions) => void;
  forceEmptyState?: boolean;
  onToggleEmptyState?: () => void;
}

export const SubAgentManagerContainer: React.FC<SubAgentManagerContainerProps> = ({
  onCreateAgent,
  onOpenChat,
  forceEmptyState = false,
  onToggleEmptyState,
}) => {
  const queryClient = useQueryClient();
  const {
    data: agents = [],
    status,
    error,
    refetch,
  } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: fetchAgents,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateAgentData = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.mentionableAgents });
    queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.activeAgents });
  }, [queryClient]);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgentStatus }) =>
      ServiceContainer.getOrThrow('agent').updateAgent(id, { status }),
    onSuccess: () => {
      invalidateAgentData();
    },
  });

  const handleExportAgent = React.useCallback(
    async (agentId: string) => {
      const agent = agents.find((item) => item.id === agentId);
      if (!agent) {
        throw new Error('Agent not found.');
      }
      const exportPayload = {
        name: agent.name,
        description: agent.description ?? '',
        status: agent.status ?? 'inactive',
        icon: agent.icon,
        keywords: Array.isArray(agent.keywords) ? agent.keywords : [],
        preset: agent.preset,
      };

      const json = JSON.stringify(serializeAgent(exportPayload), null, 2);
      return json;
    },
    [agents]
  );

  const handleImportAgent = React.useCallback(
    async (agentId: string, json: string) => {
      const parsed = tryParseAgentExport(json);
      if (!parsed) {
        throw new Error('Invalid agent JSON format. Please verify the contents and try again.');
      }

      const agent = agents.find((item) => item.id === agentId);
      const base: Partial<CreateAgentMetadata> = agent
        ? {
            name: agent.name,
            description: agent.description ?? '',
            status: agent.status ?? 'inactive',
            icon: agent.icon,
            keywords: Array.isArray(agent.keywords) ? agent.keywords : [],
            preset: agent.preset as ReadonlyPreset,
          }
        : {};

      const updated = applyAgentExport(base, parsed);
      const patch = Object.fromEntries(
        Object.entries({
          name: updated.name,
          description: updated.description,
          status: updated.status,
          icon: updated.icon,
          keywords: updated.keywords,
          preset: updated.preset,
        }).filter(([, value]) => value !== undefined)
      );

      await ServiceContainer.getOrThrow('agent').updateAgent(agentId, patch);
      invalidateAgentData();
    },
    [agents, invalidateAgentData]
  );

  if (status === 'pending') {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-sm text-muted-foreground">Loading agents…</div>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="p-6 flex items-center justify-between">
        <div className="text-sm text-red-600">
          Failed to load agents{error ? `: ${(error as Error).message}` : ''}
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <SubAgentManager
      agents={agents}
      onOpenChat={onOpenChat}
      onCreateAgent={onCreateAgent}
      onUpdateAgentStatus={(id, status) => mutation.mutate({ id, status })}
      onExportAgent={handleExportAgent}
      onImportAgent={handleImportAgent}
      forceEmptyState={forceEmptyState}
      onToggleEmptyState={onToggleEmptyState}
    />
  );
};

export default SubAgentManagerContainer;

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubAgentManager, type ChatOpenOptions } from './SubAgentManager';
import { ServiceContainer } from '../../../shared/di/service-container';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { AgentStatus } from '@agentos/core';
import { AGENTS_QUERY_KEY, fetchAgents } from '../../hooks/useAppData';
import { CHAT_QUERY_KEYS } from '../../hooks/queries/use-chat';

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

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgentStatus }) =>
      ServiceContainer.getOrThrow('agent').updateAgent(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.mentionableAgents });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.activeAgents });
    },
  });

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
      forceEmptyState={forceEmptyState}
      onToggleEmptyState={onToggleEmptyState}
    />
  );
};

export default SubAgentManagerContainer;

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubAgentCreate } from './SubAgentCreate';
import { ServiceContainer } from '../../../shared/di/service-container';
import type { CreateAgentMetadata } from '@agentos/core';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface SubAgentCreateContainerProps {
  onBack: () => void;
  onCreated?: (agentId: string) => void;
}

export const SubAgentCreateContainer: React.FC<SubAgentCreateContainerProps> = ({
  onBack,
  onCreated,
}) => {
  const queryClient = useQueryClient();

  const {
    data: presets = [],
    status,
    error,
    refetch,
  } = useQuery({
    queryKey: ['presets'],
    queryFn: async () => ServiceContainer.getOrThrow('preset').getAllPresets(),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateAgentMetadata) =>
      ServiceContainer.getOrThrow('agent').createAgent(data),
    onSuccess: (agent) => {
      // Invalidate agent lists used across views
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'mentionableAgents'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'activeAgents'] });
      onCreated?.(agent.id);
      onBack();
    },
  });

  if (status === 'pending') {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-sm text-muted-foreground">Loading presets…</div>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="p-6 flex items-center justify-between">
        <div className="text-sm text-red-600">
          Failed to load presets{error ? `: ${(error as Error).message}` : ''}
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <SubAgentCreate onBack={onBack} onCreate={(data) => mutation.mutate(data)} presets={presets} />
  );
};

export default SubAgentCreateContainer;

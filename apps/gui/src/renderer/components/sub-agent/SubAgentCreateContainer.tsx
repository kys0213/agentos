import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubAgentCreate } from './SubAgentCreate';
import { fetchPresets } from '../../services/fetchers/presets';
import { createAgent } from '../../services/fetchers/subagents';
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
  } = useQuery({ queryKey: ['presets'], queryFn: fetchPresets, staleTime: 5 * 60 * 1000 });

  const mutation = useMutation({
    mutationFn: (data: CreateAgentMetadata) => createAgent(data),
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
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
    <SubAgentCreate
      onBack={onBack}
      onCreate={(data) => mutation.mutate(data)}
      presets={presets}
    />
  );
};

export default SubAgentCreateContainer;


import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubAgentCreate } from './SubAgentCreate';
import { ServiceContainer } from '../../../shared/di/service-container';
import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

import type { AgentCreationStep } from '../../stores/store-types';

interface SubAgentCreateContainerProps {
  onBack: () => void;
  onCreated?: (agentId: string) => void;
  currentStepId?: AgentCreationStep;
  onStepChange?: (step: AgentCreationStep) => void;
}

export const SubAgentCreateContainer: React.FC<SubAgentCreateContainerProps> = ({
  onBack,
  onCreated,
  currentStepId,
  onStepChange,
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

  const [createError, setCreateError] = React.useState<string | null>(null);

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
      setCreateError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to create agent.';
      setCreateError(message);
    },
  });

  if (status === 'pending') {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-sm text-muted-foreground">Loading agent template…</div>
      </Card>
    );
  }

  // review: 프리셋이 아니라 연결된 MCP 목록을 노출해야함.
  const fallbackPreset = (): ReadonlyPreset => ({
    id: 'fallback-template',
    name: 'Default Assistant Template',
    description: 'Default template used when no presets are available.',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: 'You are a helpful assistant.',
    enabledMcps: [
      {
        name: 'filesystem',
        enabledTools: [],
        enabledResources: [],
        enabledPrompts: [],
      },
      {
        name: 'git',
        enabledTools: [],
        enabledResources: [],
        enabledPrompts: [],
      },
    ],
    llmBridgeName: '',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: ['general'],
  });

  const presetTemplate = presets[0] ?? fallbackPreset();

  return (
    <div className="space-y-4">
      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load presets{error ? `: ${(error as Error).message}` : ''}. Using a default
            template instead.
            <Button variant="outline" size="sm" className="ml-3" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <SubAgentCreate
        onBack={onBack}
        onCreate={(data) => {
          setCreateError(null);
          mutation.mutate(data);
        }}
        presetTemplate={presetTemplate}
        isSubmitting={mutation.isPending}
        submitError={createError}
        currentStepId={currentStepId}
        onStepChange={onStepChange}
      />
    </div>
  );
};

export default SubAgentCreateContainer;

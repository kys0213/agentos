import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubAgentCreate } from './SubAgentCreate';
import { ServiceContainer } from '../../../shared/di/service-container';
import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

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
        <div className="animate-pulse text-sm text-muted-foreground">Loading agent template…</div>
      </Card>
    );
  }

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
    llmBridgeName: 'openai',
    llmBridgeConfig: { bridgeId: 'openai', model: 'gpt-4', temperature: 0.7 },
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
            Failed to load presets{error ? `: ${(error as Error).message}` : ''}. Using a default template instead.
            <Button variant="outline" size="sm" className="ml-3" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <SubAgentCreate
        onBack={onBack}
        onCreate={(data) => mutation.mutate(data)}
        presetTemplate={presetTemplate}
      />
    </div>
  );
};

export default SubAgentCreateContainer;

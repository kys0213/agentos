import React, { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePreset, Preset } from '@agentos/core';
import { PresetManager } from './PresetManager';
import { ServiceContainer } from '../../../shared/di/service-container';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export const PresetManagerContainer: React.FC<{ onStartCreatePreset?: () => void }> = ({
  onStartCreatePreset,
}) => {
  const queryClient = useQueryClient();

  const {
    data: presets = [],
    status,
    error,
    refetch,
  } = useQuery({
    queryKey: ['presets'],
    queryFn: async () => {
      const svc = ServiceContainer.getOrThrow('preset');
      return svc.getAllPresets();
    },
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const svc = ServiceContainer.getOrThrow('preset');
      await svc.deletePreset(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePreset) => {
      const svc = ServiceContainer.getOrThrow('preset');
      return svc.createPreset(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Preset, 'id'>> }) => {
      const svc = ServiceContainer.getOrThrow('preset');
      return svc.updatePreset(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const svc = ServiceContainer.getOrThrow('preset');
      const src = await svc.getPreset(id);
      if (!src) {
        throw new Error('Preset not found');
      }
      const created = await svc.createPreset({
        name: `${src.name} (copy)`,
        description: src.description,
        author: src.author,
        version: src.version,
        systemPrompt: src.systemPrompt,
        enabledMcps: src.enabledMcps,
        llmBridgeName: src.llmBridgeName,
        llmBridgeConfig: src.llmBridgeConfig,
        status: src.status,
        category: src.category,
      });
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
  });

  const alert = useMemo(() => {
    if (createMutation.isSuccess) {
      return (
        <Alert className="mb-3">
          <AlertTitle>Preset created</AlertTitle>
          <AlertDescription>New preset has been added.</AlertDescription>
        </Alert>
      );
    }
    if (updateMutation.isSuccess) {
      return (
        <Alert className="mb-3">
          <AlertTitle>Preset updated</AlertTitle>
          <AlertDescription>Changes have been saved.</AlertDescription>
        </Alert>
      );
    }
    if (deleteMutation.isSuccess) {
      return (
        <Alert className="mb-3">
          <AlertTitle>Preset deleted</AlertTitle>
          <AlertDescription>Preset has been removed.</AlertDescription>
        </Alert>
      );
    }
    if (duplicateMutation.isSuccess) {
      return (
        <Alert className="mb-3">
          <AlertTitle>Preset duplicated</AlertTitle>
          <AlertDescription>Copy created successfully.</AlertDescription>
        </Alert>
      );
    }
    if (
      createMutation.isError ||
      updateMutation.isError ||
      deleteMutation.isError ||
      duplicateMutation.isError
    ) {
      const err =
        (createMutation.error as Error) ||
        (updateMutation.error as Error) ||
        (deleteMutation.error as Error) ||
        (duplicateMutation.error as Error);
      return (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>Operation failed</AlertTitle>
          <AlertDescription>{err?.message || 'Action failed'}</AlertDescription>
        </Alert>
      );
    }
    return null;
  }, [
    createMutation.isSuccess,
    updateMutation.isSuccess,
    deleteMutation.isSuccess,
    duplicateMutation.isSuccess,
    createMutation.isError,
    updateMutation.isError,
    deleteMutation.isError,
    duplicateMutation.isError,
  ]);

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
    <div className="space-y-2">
      {alert}
      <PresetManager
        presets={presets}
        isLoading={false}
        onDeletePreset={(id) => deleteMutation.mutate(id)}
        onDuplicatePreset={(p) => duplicateMutation.mutate(p.id)}
        onCreatePreset={(data) => createMutation.mutate(toCreatePresetFromPartial(data))}
        onCreatePresetAsync={(data) => createMutation.mutateAsync(data)}
        onUpdatePreset={(id, data) =>
          updateMutation.mutate({ id, data: data as Partial<Omit<Preset, 'id'>> })
        }
        onStartCreatePreset={onStartCreatePreset}
      />
    </div>
  );
};

function toCreatePresetFromPartial(data: Partial<Preset>): CreatePreset {
  return {
    name: data.name ?? '',
    description: data.description ?? '',
    author: data.author ?? '',
    version: data.version ?? '1.0.0',
    systemPrompt: data.systemPrompt ?? '',
    enabledMcps: data.enabledMcps,
    llmBridgeName: data.llmBridgeName ?? 'default',
    llmBridgeConfig: data.llmBridgeConfig ?? {},
    status: data.status ?? 'active',
    category: Array.isArray(data.category) ? data.category : [],
  };
}

export default PresetManagerContainer;

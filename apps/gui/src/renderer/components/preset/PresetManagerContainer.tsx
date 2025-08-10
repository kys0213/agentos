import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PresetManager } from './PresetManager';
import { fetchPresets, deletePreset, createPreset, updatePreset, duplicatePresetById } from '../../services/fetchers/presets';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export const PresetManagerContainer: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: presets = [], status, error, refetch } = useQuery({
    queryKey: ['presets'],
    queryFn: fetchPresets,
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePreset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createPreset(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePreset(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicatePresetById(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presets'] }),
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
        <div className="text-sm text-red-600">Failed to load presets{error ? `: ${(error as Error).message}` : ''}</div>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  return (
    <PresetManager
      presets={presets}
      isLoading={false}
      onDeletePreset={(id) => deleteMutation.mutate(id)}
      onDuplicatePreset={(p) => duplicateMutation.mutate(p.id)}
      onCreatePreset={(data) => createMutation.mutate(data as any)}
      onUpdatePreset={(id, data) => updateMutation.mutate({ id, data } as any)}
    />
  );
};

export default PresetManagerContainer;

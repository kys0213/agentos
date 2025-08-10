import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PresetDetail } from './PresetDetail';
import { fetchPresetById, updatePreset, deletePreset } from '../../services/fetchers/presets';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { Preset } from '@agentos/core';

interface PresetDetailContainerProps {
  presetId: string;
  onBack: () => void;
}

export const PresetDetailContainer: React.FC<PresetDetailContainerProps> = ({ presetId, onBack }) => {
  const queryClient = useQueryClient();

  const { data: preset, status, error, refetch } = useQuery({
    queryKey: ['preset', presetId],
    queryFn: () => fetchPresetById(presetId),
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Preset>) => updatePreset(presetId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['preset', presetId], updated);
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePreset(presetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      onBack();
    },
  });

  if (status === 'pending') {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-sm text-muted-foreground">Loading preset…</div>
      </Card>
    );
  }

  if (status === 'error' || !preset) {
    return (
      <Card className="p-6 flex items-center justify-between">
        <div className="text-sm text-red-600">Failed to load preset{error ? `: ${(error as Error).message}` : ''}</div>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  return (
    <PresetDetail
      onBack={onBack}
      preset={preset}
      onUpdate={(p) => updateMutation.mutate(p)}
      onDelete={() => deleteMutation.mutate()}
    />
  );
};

export default PresetDetailContainer;


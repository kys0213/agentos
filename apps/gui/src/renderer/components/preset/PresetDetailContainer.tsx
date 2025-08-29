import React, { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PresetDetail } from './PresetDetail';
import { ServiceContainer } from '../../../shared/di/service-container';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { Preset } from '@agentos/core';

interface PresetDetailContainerProps {
  presetId: string;
  onBack: () => void;
}

export const PresetDetailContainer: React.FC<PresetDetailContainerProps> = ({
  presetId,
  onBack,
}) => {
  const queryClient = useQueryClient();

  const {
    data: preset,
    status,
    error,
    refetch,
  } = useQuery({
    queryKey: ['preset', presetId],
    queryFn: async () => {
      const svc = ServiceContainer.getOrThrow('preset');
      return svc.getPreset(presetId);
    },
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Preset>) => {
      const svc = ServiceContainer.getOrThrow('preset');
      return svc.updatePreset(presetId, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['preset', presetId], updated);
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const svc = ServiceContainer.getOrThrow('preset');
      await svc.deletePreset(presetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      onBack();
    },
  });

  // Hook must be called on every render; compute alerts before conditional returns
  const alert = useMemo(() => {
    if (updateMutation.isSuccess) {
      return (
        <Alert className="mb-3">
          <AlertTitle>Preset saved</AlertTitle>
          <AlertDescription>Changes have been saved successfully.</AlertDescription>
        </Alert>
      );
    }
    if (updateMutation.isError) {
      return (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>
            {(updateMutation.error as Error)?.message || 'Failed to save changes'}
          </AlertDescription>
        </Alert>
      );
    }
    if (deleteMutation.isError) {
      return (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>Delete failed</AlertTitle>
          <AlertDescription>
            {(deleteMutation.error as Error)?.message || 'Failed to delete preset'}
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }, [updateMutation.isSuccess, updateMutation.isError, deleteMutation.isError]);

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
        <div className="text-sm text-red-600">
          Failed to load preset{error ? `: ${(error as Error).message}` : ''}
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
      <PresetDetail
        onBack={onBack}
        preset={preset}
        onUpdate={(p) => updateMutation.mutate(p)}
        onDelete={() => deleteMutation.mutate()}
      />
    </div>
  );
};

export default PresetDetailContainer;

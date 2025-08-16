import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceContainer } from '../../ipc/service-container';
import { Preset } from '@agentos/core';

// Query Keys
const QUERY_KEYS = {
  presets: ['presets'] as const,
  preset: (id: string) => ['preset', id] as const,
} as const;

// 프리셋 목록 조회
export const usePresets = () => {
  const presetService = ServiceContainer.getOrThrow('preset');

  return useQuery({
    queryKey: QUERY_KEYS.presets,
    queryFn: () => presetService.getAllPresets(),
    staleTime: 60000, // 1분
  });
};

// 특정 프리셋 조회
export const usePreset = (presetId: string) => {
  const presetService = ServiceContainer.getOrThrow('preset');

  return useQuery({
    queryKey: QUERY_KEYS.preset(presetId),
    queryFn: () => presetService.getPreset(presetId),
    enabled: !!presetId,
    staleTime: 300000, // 5분
  });
};

// 프리셋 생성 뮤테이션
export const useCreatePreset = () => {
  const queryClient = useQueryClient();
  const presetService = ServiceContainer.getOrThrow('preset');

  return useMutation({
    mutationFn: (preset: Preset) => presetService.createPreset(preset as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.presets });
    },
  });
};

// 프리셋 업데이트 뮤테이션
export const useUpdatePreset = () => {
  const queryClient = useQueryClient();
  const presetService = ServiceContainer.getOrThrow('preset');

  return useMutation({
    mutationFn: (preset: Preset) => presetService.updatePreset(preset.id, preset),
    onSuccess: (_, preset) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.presets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.preset(preset.id) });
    },
  });
};

// 프리셋 삭제 뮤테이션
export const useDeletePreset = () => {
  const queryClient = useQueryClient();
  const presetService = ServiceContainer.getOrThrow('preset');

  return useMutation({
    mutationFn: (presetId: string) => presetService.deletePreset(presetId),
    onSuccess: (_, presetId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.presets });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.preset(presetId) });
    },
  });
};

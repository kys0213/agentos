import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceContainer } from '../../ipc/service-container';
import type { LlmManifest } from 'llm-bridge-spec';

// Query Keys
export const BRIDGE_QK = {
  currentBridge: ['bridge', 'current'] as const,
  bridgeIds: ['bridge', 'ids'] as const,
  bridgeConfig: (id: string) => ['bridge', 'config', id] as const,
  bridgeList: ['bridge', 'list'] as const,
} as const;

// 현재 브릿지 조회
export const useCurrentBridge = () => {
  const bridgeService = ServiceContainer.getOrThrow('bridge');

  return useQuery({
    queryKey: BRIDGE_QK.currentBridge,
    queryFn: () => bridgeService.getCurrentBridge(),
    staleTime: 60000, // 1분 - 브릿지 설정은 자주 변경되지 않음
  });
};

// 사용 가능한 브릿지 ID 목록 조회
export const useBridgeIds = () => {
  const bridgeService = ServiceContainer.getOrThrow('bridge');

  return useQuery({
    queryKey: BRIDGE_QK.bridgeIds,
    queryFn: () => bridgeService.getBridgeIds(),
    staleTime: 300000, // 5분 - 브릿지 목록은 거의 변경되지 않음
  });
};

// 브릿지 전환 뮤테이션
export const useSwitchBridge = () => {
  const queryClient = useQueryClient();
  const bridgeService = ServiceContainer.getOrThrow('bridge');

  return useMutation({
    mutationFn: (bridgeId: string) => bridgeService.switchBridge(bridgeId),
    onSuccess: () => {
      // 현재 브릿지 정보 무효화
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.currentBridge });
      // 목록 및 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeList });
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeIds });
      // 채팅 세션들도 영향받을 수 있으므로 무효화
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};

// 브릿지 설정 조회
export const useBridgeConfig = (bridgeId: string) => {
  const bridgeService = ServiceContainer.getOrThrow('bridge');

  return useQuery({
    queryKey: BRIDGE_QK.bridgeConfig(bridgeId),
    queryFn: () => bridgeService.getBridgeConfig(bridgeId),
    enabled: !!bridgeId,
    staleTime: 300000, // 5분
  });
};

// 설치된 브릿지 목록(Manifest 포함)을 한 번에 로드
export const useInstalledBridges = () => {
  const bridgeService = ServiceContainer.getOrThrow('bridge');

  return useQuery<{ id: string; manifest: LlmManifest }[]>({
    queryKey: BRIDGE_QK.bridgeList,
    queryFn: async () => {
      const ids = await bridgeService.getBridgeIds();
      const manifests = await Promise.all(ids.map((id) => bridgeService.getBridgeConfig(id)));
      const list: { id: string; manifest: LlmManifest }[] = [];
      for (let i = 0; i < ids.length; i++) {
        const m = manifests[i];
        if (m) {
          list.push({ id: ids[i], manifest: m });
        }
      }
      return list;
    },
    staleTime: 300000,
  });
};

// Bridge 등록/해제
export const useRegisterBridge = () => {
  const queryClient = useQueryClient();
  const bridgeService = ServiceContainer.getOrThrow('bridge');
  return useMutation({
    mutationFn: (manifest: LlmManifest) => bridgeService.registerBridge(manifest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeIds });
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeList });
    },
  });
};

export const useUnregisterBridge = () => {
  const queryClient = useQueryClient();
  const bridgeService = ServiceContainer.getOrThrow('bridge');
  return useMutation({
    mutationFn: (id: string) => bridgeService.unregisterBridge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeIds });
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeList });
      queryClient.invalidateQueries({ queryKey: BRIDGE_QK.currentBridge });
    },
  });
};

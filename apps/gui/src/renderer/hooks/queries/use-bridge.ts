import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Services } from '../../bootstrap';
import type { LlmBridgeConfig } from '../../types/core-types';

// Query Keys
const QUERY_KEYS = {
  currentBridge: ['bridge', 'current'] as const,
  bridgeIds: ['bridge', 'ids'] as const,
  bridgeConfig: (id: string) => ['bridge', 'config', id] as const,
} as const;

// 현재 브릿지 조회
export const useCurrentBridge = () => {
  const bridgeService = Services.getBridge();

  return useQuery({
    queryKey: QUERY_KEYS.currentBridge,
    queryFn: () => bridgeService.getCurrentBridge(),
    staleTime: 60000, // 1분 - 브릿지 설정은 자주 변경되지 않음
  });
};

// 사용 가능한 브릿지 ID 목록 조회
export const useBridgeIds = () => {
  const bridgeService = Services.getBridge();

  return useQuery({
    queryKey: QUERY_KEYS.bridgeIds,
    queryFn: () => bridgeService.getBridgeIds(),
    staleTime: 300000, // 5분 - 브릿지 목록은 거의 변경되지 않음
  });
};

// 브릿지 전환 뮤테이션
export const useSwitchBridge = () => {
  const queryClient = useQueryClient();
  const bridgeService = Services.getBridge();

  return useMutation({
    mutationFn: (bridgeId: string) => bridgeService.switchBridge(bridgeId),
    onSuccess: () => {
      // 현재 브릿지 정보 무효화
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentBridge });
      // 채팅 세션들도 영향받을 수 있으므로 무효화
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};

// 브릿지 설정 조회
export const useBridgeConfig = (bridgeId: string) => {
  const bridgeService = Services.getBridge();

  return useQuery({
    queryKey: QUERY_KEYS.bridgeConfig(bridgeId),
    queryFn: () => bridgeService.getBridgeConfig(bridgeId),
    enabled: !!bridgeId,
    staleTime: 300000, // 5분
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { McpConfig } from '@agentos/core';
import { ServiceContainer } from '../../ipc/service-container';

// Query Keys
const QUERY_KEYS = {
  mcpConfigs: ['mcpConfigs'] as const,
  mcpStatus: ['mcpStatus'] as const,
  mcpConfig: (id: string) => ['mcpConfig', id] as const,
} as const;

// MCP 설정 목록 조회
export const useMcpConfigs = () => {
  const mcpService = ServiceContainer.getOrThrow('mcp');

  return useQuery({
    queryKey: QUERY_KEYS.mcpConfigs,
    queryFn: () => mcpService.getAllMcp(),
    staleTime: 30000, // 30초
  });
};

// MCP 상태 조회 (특정 클라이언트)
export const useMcpStatus = (clientName: string) => {
  const mcpService = ServiceContainer.getOrThrow('mcp');

  return useQuery({
    queryKey: [...QUERY_KEYS.mcpStatus, clientName],
    queryFn: () => mcpService.getMcpStatus(clientName),
    enabled: !!clientName,
    staleTime: 10000, // 10초 - 상태는 자주 확인
    refetchInterval: 30000, // 30초마다 자동 refetch
  });
};

// MCP 연결 뮤테이션
export const useConnectMcp = () => {
  const queryClient = useQueryClient();
  const mcpService = ServiceContainer.getOrThrow('mcp');

  return useMutation({
    mutationFn: (config: McpConfig) => mcpService.connectMcp(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpConfigs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpStatus });
    },
  });
};

// MCP 연결 해제 뮤테이션
export const useDisconnectMcp = () => {
  const queryClient = useQueryClient();
  const mcpService = ServiceContainer.getOrThrow('mcp');

  return useMutation({
    mutationFn: (configId: string) => mcpService.disconnectMcp(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpConfigs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpStatus });
    },
  });
};

// MCP 설정 저장 뮤테이션 (connect로 대체)
export const useSaveMcpConfig = () => {
  const queryClient = useQueryClient();
  const mcpService = ServiceContainer.getOrThrow('mcp');

  return useMutation({
    mutationFn: (config: McpConfig) => mcpService.connectMcp(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpConfigs });
    },
  });
};

// MCP 설정 삭제 뮤테이션 (disconnect로 대체)
export const useDeleteMcpConfig = () => {
  const queryClient = useQueryClient();
  const mcpService = ServiceContainer.getOrThrow('mcp');

  return useMutation({
    mutationFn: (configId: string) => mcpService.disconnectMcp(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpConfigs });
    },
  });
};

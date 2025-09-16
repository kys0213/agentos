import { useQuery } from '@tanstack/react-query';
import { ServiceContainer } from '../../../shared/di/service-container';

export function useMcpTools() {
  return useQuery({
    queryKey: ['mcp', 'tools'],
    queryFn: async () => {
      const mcp = ServiceContainer.get('mcp');
      if (!mcp) {
        return { items: [], nextCursor: '', hasMore: false } as const;
      }
      try {
        const items = await mcp.getAllToolMetadata();
        return { items, nextCursor: '', hasMore: false } as const;
      } catch {
        return { items: [], nextCursor: '', hasMore: false } as const;
      }
    },
    staleTime: 30_000,
  });
}

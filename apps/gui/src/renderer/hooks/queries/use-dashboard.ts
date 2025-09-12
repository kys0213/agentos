import { useQuery } from '@tanstack/react-query';
import { ServiceContainer } from '../../../shared/di/service-container';

type DashboardStats = {
  activeChats: number | null;
  agents: { total: number | null; active: number | null };
  bridges: { total: number | null; models: number | null };
  presets: { total: number | null; inUse: number | null };
  mcp?: { requests?: number | null; tokens?: number | null };
  mcp24h?: { requests?: number | null };
  meta: {
    agentsOk: boolean;
    bridgesOk: boolean;
    chatsOk: boolean;
    presetsOk: boolean;
    mcpOk: boolean;
    mcpHourlyOk: boolean;
  };
};

const QK = {
  stats: ['dashboard', 'stats'] as const,
};

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: QK.stats,
    queryFn: async () => {
      // Prepare adapters if registered
      const agent = ServiceContainer.get('agent');
      const bridge = ServiceContainer.get('bridge');
      const convo = ServiceContainer.get('conversation');
      const preset = ServiceContainer.get('preset');
      const mcpUsage = ServiceContainer.get('mcpUsageLog');

      // Run available requests in parallel; each guarded for absence/errors
      const [agentsRes, bridgesRes, chatsRes, presetsRes, mcpStats, mcpHourly] = await Promise.all([
        (async () => {
          if (!agent) return null as const;
          try {
            return await agent.getAllAgentMetadatas();
          } catch {
            return null as const;
          }
        })(),
        (async () => {
          if (!bridge) return null as const;
          try {
            const ids = await bridge.getBridgeIds();
            let modelCount = 0;
            for (const id of ids) {
              try {
                const cfg = await bridge.getBridgeConfig(id as string);
                const models = (cfg as any)?.models as unknown[] | undefined;
                modelCount += Array.isArray(models) ? models.length : 0;
              } catch {
                // ignore per-bridge errors
              }
            }
            return { ids, modelCount };
          } catch {
            return null as const;
          }
        })(),
        (async () => {
          if (!convo) return null as const;
          try {
            const page = await convo.listSessions();
            return page?.items?.length ?? 0; // Note: not total across pages
          } catch {
            return null as const;
          }
        })(),
        (async () => {
          if (!preset) return null as const;
          try {
            // Preset adapter API follows contract; expose getAllPresets()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = (preset as any).getAllPresets
              ? await (preset as any).getAllPresets()
              : [];
            return Array.isArray(p) ? p : [];
          } catch {
            return null as const;
          }
        })(),
        (async () => {
          if (!mcpUsage) return null as const;
          try {
            return await mcpUsage.getUsageStats();
          } catch {
            return null as const;
          }
        })(),
        (async () => {
          if (!mcpUsage) return null as const;
          try {
            const { hourlyData } = await mcpUsage.getHourlyStats(new Date());
            const total = Array.isArray(hourlyData)
              ? hourlyData.reduce((sum, t) => sum + (Array.isArray(t) ? Number(t[1]) || 0 : 0), 0)
              : 0;
            return total;
          } catch {
            return null as const;
          }
        })(),
      ]);

      const agentsTotal = agentsRes ? agentsRes.length : null;
      const agentsActive = agentsRes
        ? agentsRes.filter((a: any) => a.status === 'active').length
        : null;

      const bridgesTotal = bridgesRes ? bridgesRes.ids.length : null;
      const modelsTotal = bridgesRes ? bridgesRes.modelCount : null;

      const presetsTotal = presetsRes ? presetsRes.length : null;
      const presetsInUse = presetsRes
        ? presetsRes.filter((p: any) => typeof p.usageCount === 'number' && p.usageCount > 0).length
        : null;

      const activeChats = chatsRes ?? null;

      const mcpSummary = mcpStats
        ? {
          	// Core usage service returns totalUsage etc.
          	// eslint-disable-next-line @typescript-eslint/no-explicit-any
            requests: (mcpStats as any)?.totalUsage ?? null,
            tokens: null,
          }
        : undefined;

      return {
        activeChats,
        agents: { total: agentsTotal, active: agentsActive },
        bridges: { total: bridgesTotal, models: modelsTotal },
        presets: { total: presetsTotal, inUse: presetsInUse },
        mcp: mcpSummary,
        mcp24h: { requests: (mcpHourly as number | null) ?? null },
        meta: {
          agentsOk: !!agentsRes,
          bridgesOk: !!bridgesRes,
          chatsOk: chatsRes !== null,
          presetsOk: !!presetsRes,
          mcpOk: !!mcpStats,
          mcpHourlyOk: mcpHourly !== null,
        },
      } satisfies DashboardStats;
    },
    staleTime: 30_000,
    refetchInterval: 15_000,
  });
}

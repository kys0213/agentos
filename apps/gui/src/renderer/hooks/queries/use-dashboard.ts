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
          if (!agent) {
            return null;
          }
          try {
            return await agent.getAllAgentMetadatas();
          } catch {
            return null;
          }
        })(),
        (async () => {
          if (!bridge) {
            return null;
          }
          try {
            const summaries = await bridge.listBridges();
            let modelCount = 0;
            for (const summary of summaries) {
              try {
                const cfg = await bridge.getBridgeConfig(summary.id);
                const models = (cfg as { models?: unknown[] } | undefined)?.models;
                modelCount += Array.isArray(models) ? models.length : 0;
              } catch {
                // ignore per-bridge errors
              }
            }
            return { summaries, modelCount };
          } catch {
            return null;
          }
        })(),
        (async () => {
          if (!convo) {
            return null;
          }
          try {
            const metas = agent ? await agent.getAllAgentMetadatas() : [];
            if (!Array.isArray(metas) || metas.length === 0) {
              return 0;
            }

            const counts = await Promise.all(
              metas.map(async (meta) => {
                try {
                  const page = await convo.listSessions(meta.id);
                  return page?.items?.length ?? 0;
                } catch {
                  return 0;
                }
              })
            );
            return counts.reduce((sum, count) => sum + count, 0);
          } catch {
            return null;
          }
        })(),
        (async () => {
          if (!preset) {
            return null;
          }
          try {
            // Preset adapter API follows contract; expose getAllPresets()
            const maybe = preset as { getAllPresets?: () => Promise<unknown[]> };
            const p = maybe.getAllPresets ? await maybe.getAllPresets() : [];
            return Array.isArray(p) ? p : [];
          } catch {
            return null;
          }
        })(),
        (async () => {
          if (!mcpUsage) {
            return null;
          }
          try {
            return await mcpUsage.getUsageStats();
          } catch {
            return null;
          }
        })(),
        (async () => {
          if (!mcpUsage) {
            return null;
          }
          try {
            const { hourlyData } = await mcpUsage.getHourlyStats(new Date());
            const total = Array.isArray(hourlyData)
              ? hourlyData.reduce((sum, t) => sum + (Array.isArray(t) ? Number(t[1]) || 0 : 0), 0)
              : 0;
            return total;
          } catch {
            return null;
          }
        })(),
      ]);

      const agentsTotal = agentsRes ? agentsRes.length : null;
      const agentsActive = Array.isArray(agentsRes)
        ? agentsRes.filter((a) => (a as { status?: string }).status === 'active').length
        : null;

      const bridgesTotal = bridgesRes ? bridgesRes.summaries.length : null;
      const modelsTotal = bridgesRes ? bridgesRes.modelCount : null;

      const presetsTotal = presetsRes ? presetsRes.length : null;
      const presetsInUse = Array.isArray(presetsRes)
        ? presetsRes.filter((p) => {
            const u = (p as { usageCount?: unknown }).usageCount;
            return typeof u === 'number' && u > 0;
          }).length
        : null;

      const activeChats = chatsRes ?? null;

      const mcpSummary = mcpStats
        ? {
            requests: (mcpStats as { totalUsage?: number } | null)?.totalUsage ?? null,
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

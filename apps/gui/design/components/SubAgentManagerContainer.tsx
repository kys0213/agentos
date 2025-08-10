import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubAgentManager, Agent, SubAgentManagerProps } from './SubAgentManager';
import { Card } from './ui/card';
import { Button } from './ui/button';

export interface SubAgentManagerContainerProps
  extends Omit<SubAgentManagerProps, 'agents' | 'onUpdateAgentStatus'> {
  fetchAgents: () => Promise<Agent[]>;
  updateAgentStatus?: (agentId: string, status: Agent['status']) => Promise<void>;
}

export function SubAgentManagerContainer({
  fetchAgents,
  updateAgentStatus,
  onOpenChat,
  onCreateAgent,
}: SubAgentManagerContainerProps) {
  const queryClient = useQueryClient();

  const { data: agents = [], status, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Agent['status'] }) => {
      if (!updateAgentStatus) return;
      await updateAgentStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  if (status === 'pending') {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-sm text-muted-foreground">Loading agents…</div>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="p-6 flex items-center justify-between">
        <div className="text-sm text-red-600">Failed to load agents{error ? `: ${(error as Error).message}` : ''}</div>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <SubAgentManager
      agents={agents}
      onUpdateAgentStatus={(agentId, newStatus) =>
        mutation.mutate({ id: agentId, status: newStatus })
      }
      onOpenChat={onOpenChat}
      onCreateAgent={onCreateAgent}
    />
  );
}


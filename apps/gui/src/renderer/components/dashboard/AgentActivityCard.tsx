import type { ReadonlyAgentMetadata } from '@agentos/core';
import { Users, Sparkles, MinusCircle } from 'lucide-react';
import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AgentActivityCardProps {
  mentionableAgents: ReadonlyAgentMetadata[];
  activeAgents: ReadonlyAgentMetadata[];
}

export const AgentActivityCard: React.FC<AgentActivityCardProps> = ({
  mentionableAgents,
  activeAgents,
}) => {
  const totalActive = activeAgents.length;
  const totalMentionable = mentionableAgents.length;
  const idleCount = mentionableAgents.filter((agent) => agent.status === 'idle').length;
  const inactiveCount = mentionableAgents.filter((agent) => agent.status === 'inactive').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Agent Activity</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div>
            <p className="text-2xl font-semibold text-foreground">{totalActive}</p>
            <p className="text-xs text-muted-foreground">active right now</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {totalMentionable} mentionable / {inactiveCount} inactive
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Idle specialists</p>
              <p className="font-medium text-foreground">{idleCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3">
            <MinusCircle className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Inactive agents</p>
              <p className="font-medium text-foreground">{inactiveCount}</p>
            </div>
          </div>
        </div>

        {mentionableAgents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Available to mention</p>
            <div className="grid gap-2">
              {mentionableAgents.slice(0, 4).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    {agent.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {agent.description}
                      </p>
                    )}
                  </div>
                  <Badge className="status-active-subtle capitalize">{agent.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {mentionableAgents.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No agents are available for mention. Create or activate agents to unlock orchestration
            workflows.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentActivityCard;

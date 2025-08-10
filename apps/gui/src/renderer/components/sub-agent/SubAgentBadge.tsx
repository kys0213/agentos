import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CheckCircle, Clock, MinusCircle } from 'lucide-react';
import { AgentStatus } from '@agentos/core';

export const SubAgentBadge = ({
  status,
  withTooltip = false,
}: {
  status: AgentStatus;
  withTooltip?: boolean;
}) => {
  const badgeContent = getBadgeContent(status);

  if (withTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent(status)}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badgeContent;
};

function getBadgeContent(status: AgentStatus) {
  switch (status) {
    case 'active':
      return (
        <Badge className="gap-1 status-active">
          <CheckCircle className="w-3 h-3" />
          Active
        </Badge>
      );
    case 'idle':
      return (
        <Badge className="gap-1 status-idle">
          <Clock className="w-3 h-3" />
          Idle
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 status-inactive-subtle">
          <MinusCircle className="w-3 h-3" />
          Inactive
        </Badge>
      );
  }
}

function getTooltipContent(status: AgentStatus) {
  switch (status) {
    case 'active':
      return 'Automatically participate in conversations via orchestrator';
    case 'idle':
      return 'Available for explicit @mention calls only';
    case 'inactive':
      return 'Completely disabled, cannot be called';
    default:
      return '';
  }
}

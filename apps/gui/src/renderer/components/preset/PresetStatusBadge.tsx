import { PresetStatus } from '@agentos/core';
import { Badge, BadgeProps } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import { Clock, Archive } from 'lucide-react';

export const PresetStatusBadge = ({ status }: { status: PresetStatus }) => {
  const variants: Record<PresetStatus, BadgeProps['variant']> = {
    active: 'default',
    idle: 'secondary',
    inactive: 'outline',
  };

  const variant = variants[status] ?? 'secondary';
  return (
    <Badge variant={variant}>
      {status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
      {status === 'idle' && <Clock className="w-3 h-3 mr-1" />}
      {status === 'inactive' && <Archive className="w-3 h-3 mr-1" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

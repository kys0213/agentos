import { PresetStatus } from '@agentos/core';
import { Badge, BadgeProps } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import { Clock, Archive } from 'lucide-react';

export const PresetStatusBadge = ({ status }: { status?: PresetStatus }) => {
  const variants: Record<PresetStatus, BadgeProps['variant']> = {
    active: 'default',
    idle: 'secondary',
    inactive: 'outline',
  };

  const safeStatus: PresetStatus = (status ?? 'idle') as PresetStatus;
  const variant = variants[safeStatus] ?? 'secondary';
  return (
    <Badge variant={variant}>
      {safeStatus === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
      {safeStatus === 'idle' && <Clock className="w-3 h-3 mr-1" />}
      {safeStatus === 'inactive' && <Archive className="w-3 h-3 mr-1" />}
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </Badge>
  );
};

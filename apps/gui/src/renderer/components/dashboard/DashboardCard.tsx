import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
  onRetry?: () => void;
}

export function DashboardCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  onRetry,
}: DashboardCardProps) {
  const showRetry = typeof change === 'string' && change.includes('Retry') && onRetry;
  return (
    <div className="p-6 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{change}</span>
            {showRetry && (
              <button
                aria-label={`retry-${title}`}
                className="h-7 px-2 border rounded text-xs"
                onClick={onRetry}
              >
                Retry
              </button>
            )}
          </div>
        </div>
        <Icon className={`w-8 h-8 ${color ?? ''}`} />
      </div>
    </div>
  );
}

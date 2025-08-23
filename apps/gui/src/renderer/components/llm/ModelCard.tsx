import { Settings, Cpu, MessageSquare } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ModelManagerItem } from './ModelManager';
import { getStatusColor, getStatusIcon } from './modelManagerUtils';

interface Props {
  model: ModelManagerItem;
  onSwitch?: (bridgeId: string) => void;
}

export function ModelCard({ model, onSwitch }: Props) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">{model.name}</h3>
            <p className="text-sm text-muted-foreground">{model.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(model.isActive ? 'online' : 'offline')}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span
            className={`font-semibold capitalize ${getStatusColor(model.isActive ? 'online' : 'offline')}`}
          >
            {model.isActive ? 'online' : 'offline'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Requests</span>
          <span className="font-semibold">—</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tokens</span>
          <span className="font-semibold">—</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Cost</span>
          <span className="font-semibold">—</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Latency</span>
          <span className="font-semibold">—</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-semibold">—</span>
        </div>
      </div>

      {/* Capabilities */}
      {model.capabilities && model.capabilities.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-1">Capabilities</div>
          <div className="flex flex-wrap gap-1">
            {model.capabilities.map((cap) => (
              <Badge key={cap} variant="secondary" className="text-xs">
                {cap}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
        <Button
          size="sm"
          className="flex-1"
          variant={model.isActive ? 'default' : 'outline'}
          onClick={() => onSwitch?.(model.id)}
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {model.isActive ? 'Active' : 'Switch'}
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}

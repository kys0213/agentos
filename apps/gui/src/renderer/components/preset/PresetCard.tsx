import React from 'react';
import type { Preset } from '@agentos/core';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CategoryIcon } from '../common/CategoryIcon';
import { PresetStatusBadge } from './PresetStatusBadge';
import { Edit, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import PresetStatsChips from './PresetStatsChips';

export interface PresetCardProps {
  preset: Preset;
  onEdit?: (preset: Preset) => void;
  onDuplicate?: (preset: Preset) => void;
  onDelete?: (id: string) => void;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <CategoryIcon category={preset.category[0]} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{preset.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {Array.isArray(preset.category) ? preset.category[0] : (preset.category ?? 'general')}{' '}
              project
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PresetStatusBadge status={preset.status} />
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{preset.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Project ID:</span>
          <span className="font-medium text-foreground text-xs">{preset.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Model:</span>
          <span className="font-medium text-foreground">
            {(preset.llmBridgeConfig as any)?.model ?? ''}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Usage:</span>
          <span className="font-medium text-foreground">{preset.usageCount}</span>
        </div>
      </div>

      <PresetStatsChips
        indexed={preset.knowledgeStats?.indexed}
        vectorized={preset.knowledgeStats?.vectorized}
        totalDocs={preset.knowledgeDocuments}
      />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit?.(preset)}>
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDuplicate?.(preset)}>
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete?.(preset.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};

export default PresetCard;

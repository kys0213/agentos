import React from 'react';
import { Badge } from '../ui/badge';
import { Search, Database, Folder } from 'lucide-react';

export interface PresetStatsChipsProps {
  indexed?: number;
  vectorized?: number;
  totalDocs?: number;
  showIsolation?: boolean;
}

export const PresetStatsChips: React.FC<PresetStatsChipsProps> = ({
  indexed = 0,
  vectorized = 0,
  totalDocs = 0,
  showIsolation = true,
}) => {
  if (totalDocs <= 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mb-4">
      <Badge variant="secondary" className="text-xs gap-1">
        <Search className="w-3 h-3" />
        {indexed}/{totalDocs} Indexed
      </Badge>
      <Badge variant="secondary" className="text-xs gap-1">
        <Database className="w-3 h-3" />
        {vectorized}/{totalDocs} Vector
      </Badge>
      {showIsolation && (
        <Badge variant="outline" className="text-xs gap-1">
          <Folder className="w-3 h-3" />
          Isolated
        </Badge>
      )}
    </div>
  );
};

export default PresetStatsChips;


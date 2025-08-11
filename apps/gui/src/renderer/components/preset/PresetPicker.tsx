import React, { useMemo, useState } from 'react';
import type { ReadonlyPreset } from '@agentos/core';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import PresetStatsChips from './PresetStatsChips';

export interface PresetPickerProps {
  presets: ReadonlyPreset[];
  value?: string;
  onChange: (id: string) => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({ presets, value, onChange }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter((p) =>
      [p.name, p.description, ...(p.category ?? [])].some((s) => s?.toLowerCase().includes(q))
    );
  }, [presets, query]);

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <Input
          placeholder="Search presets by name, desc, category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <RadioGroup value={value ?? ''} onValueChange={(v) => onChange(v)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={`p-4 cursor-pointer border ${
                value === p.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              onClick={() => onChange(p.id)}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={p.id} />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm truncate">{p.name}</h4>
                    <span className="text-xs text-muted-foreground">v{p.version}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                  <div className="mt-2">
                    <PresetStatsChips
                      indexed={(p as any)?.knowledgeStats?.indexed}
                      vectorized={(p as any)?.knowledgeStats?.vectorized}
                      totalDocs={(p as any)?.knowledgeDocuments}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};

export default PresetPicker;

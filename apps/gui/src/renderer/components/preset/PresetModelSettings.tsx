import React from 'react';
import type { Preset } from '@agentos/core';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';

export interface PresetModelSettingsProps {
  config: Preset['llmBridgeConfig'] | undefined;
  onChange: (updates: Partial<Preset>) => void;
  showModel?: boolean;
  showParameters?: boolean;
}

export const PresetModelSettings: React.FC<PresetModelSettingsProps> = ({
  config,
  onChange,
  showModel = true,
  showParameters = true,
}) => {
  const cfg = (config ?? {}) as any;
  return (
    <div className="space-y-6">
      {showModel && (
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={cfg.model ?? ''}
            onValueChange={(value) => onChange({ llmBridgeConfig: { ...cfg, model: value } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'].map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showParameters && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">{cfg.temperature}</span>
            </div>
            <Slider
              value={[cfg.temperature ?? 0.7]}
              onValueChange={([value]) => onChange({ llmBridgeConfig: { ...cfg, temperature: value } })}
              max={2}
              min={0}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Max Tokens</Label>
              <span className="text-sm text-muted-foreground">{cfg.maxTokens}</span>
            </div>
            <Slider
              value={[cfg.maxTokens ?? 2048]}
              onValueChange={([value]) => onChange({ llmBridgeConfig: { ...cfg, maxTokens: value } })}
              max={4096}
              min={256}
              step={256}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Top P</Label>
              <span className="text-sm text-muted-foreground">{cfg.topP}</span>
            </div>
            <Slider
              value={[cfg.topP ?? 1.0]}
              onValueChange={([value]) => onChange({ llmBridgeConfig: { ...cfg, topP: value } })}
              max={1}
              min={0}
              step={0.1}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetModelSettings;

